import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { scopeOf } from '@deepseek-ai/dsh-scope'
import type { SkillCandidate, SkillDefinition, SkillLookupOptions, SkillProvider, SkillViewOptions } from '@deepseek-ai/dsh-skill'
import type { Catalog, ManagedSkill } from './catalog.ts'
import type { SkillHub } from './hub.ts'
import { readBundleSkill, type BundlePlugin } from './bundles.ts'

const PROVIDER = 'skillhub'
const USER_DSH_RANK = 350
const USER_AGENTS_RANK = 351
/**
 * Package-shipped skills rank below every disk provider and below
 * `BUNDLED_SKILL_RANK` (600), so a shadow candidate wins the name and the
 * registry asks this plugin for the body — that is what lets a packaged skill
 * be switched off at all.
 */
const BUNDLE_PROVIDER = 'skillhub-bundles'
const BUNDLE_RANK = 340

/**
 * Read a session id out of a value that may be an id, a plain `{ session }`
 * key, or a Cordis Context (whose own property dereference is guarded and may
 * throw). Return the first readable shape.
 * @param holder - candidate scope key.
 * @returns the session id, when one is readable.
 */
function sessionIdOfKey(holder: unknown): string | undefined {
  if (typeof holder !== 'object' || holder === null) return undefined
  const agent = holder as {
    id?: unknown
    session?: { id?: unknown; header?: { id?: unknown } }
  }
  try {
    if (typeof agent.session?.id === 'string') return agent.session.id
    if (typeof agent.session?.header?.id === 'string') return agent.session.header.id
    // A Context tag can hand back the agent context itself, whose `session`
    // only resolves as a string after the raw id is read through the key.
    const raw = agent.session
    if (typeof raw === 'string') return raw
  } catch {
    // The guarded Context proxy refuses an un-injected service read: not an id.
    return undefined
  }
  return undefined
}

/**
 * Resolve the chat whose visibility layer applies to a lookup.
 *
 * The registry passes its viewing scope through as an opaque {@link ScopeKey}.
 * For an agent read that is the agent's own Context — the session id lives on
 * the scope tag the registry wrote into it, NOT as a `scope.session` property.
 * Reading only the property shape silently resolved no session, so a Chat-layer
 * override never reached the provider and the model kept seeing the Project or
 * Global value the user had just overridden in the conversation panel.
 *
 * The plain-object shape is still accepted for direct callers that hand over an
 * `{ session: { id } }` value, and for the per-agent registration below, which
 * knows its own session id and can pass it in as a string.
 * @param scope - the lookup scope: an agent Context, a scope key, or an id.
 * @returns the session id, or undefined when the read is not chat-scoped.
 */
export function sessionIdFromScope(scope: unknown): string | undefined {
  if (typeof scope === 'string') return scope === '' ? undefined : scope
  if (typeof scope !== 'object' || scope === null) return undefined
  try {
    const tagged = scopeOf(scope as Context)
    const fromTag = sessionIdOfKey(tagged)
    if (fromTag !== undefined) return fromTag
  } catch {
    // Not a Cordis Context: fall through to the plain-object shape.
  }
  return sessionIdOfKey(scope)
}

function toCandidate(skill: ManagedSkill): SkillCandidate {
  const source = skill.home === 'dsh' ? 'user-dsh' : 'user-agents'
  const rank = skill.home === 'dsh' ? USER_DSH_RANK : USER_AGENTS_RANK
  return {
    name: skill.name,
    description: skill.description,
    ...skill.whenToUse !== undefined ? { whenToUse: skill.whenToUse } : {},
    invocation: skill.invocation,
    source,
    provider: PROVIDER,
    rank,
    locator: { path: skill.path, directory: skill.directory },
    path: skill.path,
    resourceBase: { kind: 'directory', path: skill.directory },
  }
}

export function providerSkillsFromCatalog(catalog: Catalog): ManagedSkill[] {
  const byName = new Map<string, ManagedSkill[]>()
  for (const skill of catalog.inventory) {
    const list = byName.get(skill.name) ?? []
    list.push(skill)
    byName.set(skill.name, list)
  }
  const selected: ManagedSkill[] = []
  for (const group of byName.values()) {
    const on = group.filter(skill => skill.gate === 'on')
    const pool = on.length > 0 ? on : group
    pool.sort((left, right) => Number(left.home !== 'dsh') - Number(right.home !== 'dsh'))
    const pick = pool[0]
    if (pick === undefined) continue
    selected.push(pick)
  }
  return selected
}

/**
 * Build the provider the registry reads.
 *
 * `boundSessionId` exists because one provider instance serves every scope in
 * the layer it was registered in: the global registration cannot tell which
 * chat is asking, while the per-agent registration made on `agent/created`
 * knows exactly one agent. Passing that chat in here makes the Chat layer apply
 * even when a caller forwards no usable scope, which is what previously let a
 * chat-level override be ignored by the model's catalog.
 * @param hub - visibility store backing the provider.
 * @param boundSessionId - chat this provider belongs to, when it is agent-scoped.
 */
export function createSkillHubProvider(hub: SkillHub, boundSessionId?: string): SkillProvider {
  return {
    name: PROVIDER,
    async list(options: SkillLookupOptions): Promise<SkillCandidate[]> {
      try {
        const view = options as SkillViewOptions
        const sessionId = sessionIdFromScope(view.scope) ?? boundSessionId
        const query: { sessionId?: string; folder?: string } = {}
        if (sessionId !== undefined) query.sessionId = sessionId
        if (options.cwd !== undefined) query.folder = resolve(options.cwd)
        return providerSkillsFromCatalog(hub.catalog(query)).map(toCandidate)
      } catch (error) {
        console.error('[dsh-skillhub] list failed', error)
        return []
      }
    },
    async get(candidate: SkillCandidate): Promise<SkillDefinition | undefined> {
      const locator = candidate.locator as { path?: string; directory?: string }
      if (typeof locator.path !== 'string') return undefined
      let content: string
      try {
        content = readFileSync(locator.path, 'utf8')
      } catch {
        return undefined
      }
      const split = content.startsWith('---') ? content.indexOf('\n---', 3) : -1
      const body = split >= 0 ? content.slice(split + 4).replace(/^\r?\n/, '') : content
      return {
        name: candidate.name,
        description: candidate.description,
        ...candidate.whenToUse !== undefined ? { whenToUse: candidate.whenToUse } : {},
        invocation: candidate.invocation,
        source: candidate.source,
        provider: PROVIDER,
        resourceBase: { kind: 'directory', path: locator.directory ?? dirname(locator.path) },
        path: locator.path,
        content: body,
      }
    },
  }
}

/** Locator handed back by {@link createBundleProvider} for one package skill. */
interface BundleLocator {
  readonly path: string
  readonly directory: string
  readonly effective: 'on' | 'off'
}

/**
 * Provider that owns every skill shipped inside an installed package.
 *
 * The packaged provider keeps its own registration; this one only has to win the
 * name (lower rank) and carry the gate as `modelInvocable`, so switching a
 * plugin or one of its skills off removes it from the model catalog without
 * touching the package or the loader.
 * @param hub - visibility store backing the package gates.
 * @param bundles - current package contributions; read on every call so a rediscovery is picked up.
 * @returns the provider the registry reads.
 */
export function createBundleProvider(
  hub: SkillHub,
  bundles: () => readonly BundlePlugin[],
): SkillProvider {
  return {
    name: BUNDLE_PROVIDER,
    async list(options: SkillLookupOptions): Promise<SkillCandidate[]> {
      try {
        const view = options as SkillViewOptions
        const sessionId = sessionIdFromScope(view.scope)
        const query: { sessionId?: string; folder?: string } = {}
        if (sessionId !== undefined) query.sessionId = sessionId
        if (options.cwd !== undefined) query.folder = resolve(options.cwd)
        const catalog = hub.bundleCatalog(bundles(), query)
        const candidates: SkillCandidate[] = []
        for (const plugin of catalog.plugins) {
          const source = bundles().find(entry => entry.name === plugin.name)
          if (source === undefined) continue
          for (const row of plugin.skills) {
            const skill = source.skills.find(entry => entry.name === row.name)
            if (skill === undefined) continue
            candidates.push({
              name: skill.name,
              description: skill.description,
              ...skill.whenToUse !== undefined ? { whenToUse: skill.whenToUse } : {},
              invocation: { modelInvocable: row.effective === 'on', userInvocable: row.effective === 'on' },
              source: 'bundled',
              provider: BUNDLE_PROVIDER,
              rank: BUNDLE_RANK,
              locator: { path: skill.path, directory: skill.directory, effective: row.effective } satisfies BundleLocator,
            })
          }
        }
        return candidates
      } catch (error) {
        console.error('[dsh-skillhub] bundle provider list failed', error)
        return []
      }
    },
    async get(candidate: SkillCandidate): Promise<SkillDefinition | undefined> {
      const locator = candidate.locator as Partial<BundleLocator> | undefined
      if (typeof locator?.path !== 'string') return undefined
      const content = readBundleSkill(locator.path)
      if (content === undefined) return undefined
      return {
        name: candidate.name,
        description: candidate.description,
        ...candidate.whenToUse !== undefined ? { whenToUse: candidate.whenToUse } : {},
        invocation: candidate.invocation,
        source: candidate.source,
        provider: BUNDLE_PROVIDER,
        resourceBase: { kind: 'directory', path: locator.directory ?? dirname(locator.path) },
        path: locator.path,
        content,
      }
    },
  }
}
