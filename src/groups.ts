import type { Gate, GroupGate, SkillId, VisibilityLayer } from './catalog.ts'
import type { McpGate, McpServerView } from './mcp.ts'

/** One skill inside a group, with the gate the runtime would enforce. */
export interface GroupSkillView {
  readonly id: SkillId
  readonly name: string
  /** The skill's own gate, without the parent. */
  readonly gate: Gate
  readonly source: VisibilityLayer
  readonly effective: Gate
  readonly locked: boolean
}

/** One MCP server inside a group. */
export interface GroupServerView {
  readonly name: string
  readonly tools: number
  readonly gate: McpGate
  readonly source: VisibilityLayer
  readonly effective: Gate
  readonly locked: boolean
}

/**
 * A user-visible capability: the skills and the MCP server that belong to one
 * thing (`abaqus`), or a family of skills that share a base name (`ponytail`).
 */
export interface GroupView {
  readonly name: string
  readonly kind: 'capability' | 'family'
  /** Off when the group is closed; otherwise on only when every member is on. */
  readonly gate: GroupGate
  readonly source: VisibilityLayer
  readonly skills: readonly GroupSkillView[]
  readonly servers: readonly GroupServerView[]
}

export interface GroupInput {
  readonly skills: readonly { readonly id: SkillId; readonly name: string; readonly gate: Gate; readonly source: VisibilityLayer }[]
  readonly servers: readonly McpServerView[]
}

/** Gate key of a group switch. */
export function groupGateId(name: string): string {
  return `group:${name}`
}

/**
 * Build the groups a scope shows.
 *
 * Two shapes become a group:
 * - a skill and an MCP server with the same name are one capability (the manual
 *   and the tools that execute it);
 * - skills named `<base>-<something>` join the skill named `<base>`, so an
 *   installed family (`ponytail`, `office`) reads as one row instead of six.
 *
 * A group is only a view over existing rows: its own gate lives in the same
 * layer document as everything else, and a parent that is off locks every
 * member without rewriting the member's stored value.
 *
 * @param input - this scope's skills and MCP servers.
 * @param resolveGroup - resolves one group's gate through the layer chain.
 * @returns groups sorted by name.
 */
export function computeGroups(
  input: GroupInput,
  resolveGroup: (name: string) => { gate: Gate; source: VisibilityLayer },
): GroupView[] {
  const skillByName = new Map<string, GroupInput['skills'][number]>()
  for (const skill of input.skills) if (!skillByName.has(skill.name)) skillByName.set(skill.name, skill)
  const serverByName = new Map<string, McpServerView>()
  for (const server of input.servers) serverByName.set(server.name, server)

  const members = new Map<string, { skills: Set<string>; kind: 'capability' | 'family' }>()
  const add = (name: string, skill: string, kind: 'capability' | 'family'): void => {
    const current = members.get(name)
    if (current === undefined) {
      members.set(name, { skills: new Set([skill]), kind })
      return
    }
    current.skills.add(skill)
    if (kind === 'capability') current.kind = 'capability'
  }

  for (const skill of input.skills) {
    const dash = skill.name.indexOf('-')
    if (dash <= 0) continue
    const base = skill.name.slice(0, dash)
    // A family needs its base to be a skill of its own; otherwise the prefix is
    // just part of the name (`kb-search` has no `kb` skill to belong to).
    if (skillByName.get(base) === undefined) continue
    const kind = serverByName.has(base) ? 'capability' : 'family'
    // The base skill belongs to its own family: closing the family closes it too.
    add(base, base, kind)
    add(base, skill.name, kind)
  }
  for (const [base, family] of members) {
    if (family.skills.size < 2) members.delete(base)
  }
  for (const server of input.servers) {
    if (skillByName.get(server.name) === undefined) continue
    add(server.name, server.name, 'capability')
  }

  const groups: GroupView[] = []
  for (const [name, entry] of members) {
    const parent = resolveGroup(name)
    const locked = parent.gate === 'off'
    const skills: GroupSkillView[] = []
    for (const skillName of [...entry.skills].sort((left, right) => left.localeCompare(right))) {
      const skill = skillByName.get(skillName)
      if (skill === undefined) continue
      skills.push({
        id: skill.id,
        name: skill.name,
        gate: skill.gate,
        source: skill.source,
        effective: parent.gate === 'on' && skill.gate === 'on' ? 'on' : 'off',
        locked,
      })
    }
    const server = serverByName.get(name)
    const membersOn = skills.every(skill => skill.effective === 'on')
      && (server === undefined || (parent.gate === 'on' && server.gate === 'on'))
    // A group that is open but holds a closed member reads as mixed, so the row
    // never claims "on" while something under it is off.
    const gate: GroupGate = parent.gate === 'off' ? 'off' : membersOn ? 'on' : 'mixed'
    groups.push({
      name,
      kind: entry.kind,
      gate,
      source: parent.source,
      skills,
      servers: server === undefined ? [] : [{
        name: server.name,
        tools: server.tools,
        gate: server.gate,
        source: server.source as VisibilityLayer,
        effective: parent.gate === 'on' && server.gate === 'on' ? 'on' : 'off',
        locked,
      }],
    })
  }
  groups.sort((left, right) => left.name.localeCompare(right.name))
  return groups
}
