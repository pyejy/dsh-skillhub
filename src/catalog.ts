import { propagatedGate, type PropagationMetadata } from './propagation.ts'
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync } from 'node:fs'
import { basename, dirname, join, posix, relative, sep } from 'node:path'

const IGNORE = new Set(['.git', 'node_modules', '.system'])
const HOST_SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isHostSkillName(name: string): boolean {
  return HOST_SKILL_NAME.test(name)
}

export type HomeKind = 'agent' | 'dsh'
export type Gate = 'on' | 'off'
export type VisibilityLayer = 'global' | 'project' | 'session'
export type LayerGate = Gate | 'inherit'
export type GroupGate = 'on' | 'off' | 'mixed'
export type AbsolutePath = string
export type SkillId = string & { readonly __brand: 'SkillId' }
export type PackId = string & { readonly __brand: 'PackId' }

export type VisibilityDocument = PropagationMetadata & {
  readonly version: 2
  readonly default: LayerGate
  readonly gates: Readonly<Record<string, LayerGate>>
  readonly legacySnapshot?: boolean
}

export const VisibilityDocument = {
  empty(): VisibilityDocument {
    return { version: 2, default: 'inherit', gates: {} }
  },
  global(defaultGate: Gate = 'on'): VisibilityDocument {
    return { version: 2, default: defaultGate, gates: {} }
  },
  off(ids: readonly SkillId[]): VisibilityDocument {
    const gates: Record<string, LayerGate> = {}
    for (const id of ids) gates[id] = 'off'
    return { version: 2, default: 'inherit', gates }
  },
  on(ids: readonly SkillId[]): VisibilityDocument {
    const gates: Record<string, LayerGate> = {}
    for (const id of ids) gates[id] = 'on'
    return { version: 2, default: 'inherit', gates }
  },
} as const

export function skillId(home: HomeKind, relPath: string): SkillId {
  return `${home}:${relPath.split(sep).join('/')}` as SkillId
}

export function packId(home: HomeKind, name: string): PackId {
  return `${home}:${name}` as PackId
}

export function parseSkillId(id: SkillId): { home: HomeKind; relPath: string } {
  const split = id.indexOf(':')
  const home = id.slice(0, split) as HomeKind
  return { home, relPath: id.slice(split + 1) }
}

export type BrokenReason =
  | { readonly kind: 'missing-symlink-target'; readonly target: string }
  | { readonly kind: 'unreadable-skill'; readonly message: string }
  | { readonly kind: 'invalid-frontmatter'; readonly message: string }
  | { readonly kind: 'invalid-name'; readonly raw: string }
  | { readonly kind: 'symlink-cycle'; readonly target: string }
  | { readonly kind: 'empty-pack' }

export interface BrokenEntry {
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly reason: BrokenReason
}

export interface OfferedSkill {
  readonly id: SkillId
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly directory: AbsolutePath
  readonly invocation: { readonly modelInvocable: boolean; readonly userInvocable: boolean }
  readonly content: string
}

export interface ManagedSkill extends OfferedSkill {
  readonly gate: Gate
  readonly source: VisibilityLayer
}

export interface Collision {
  readonly name: string
  readonly skills: readonly SkillId[]
}

export interface SkillNode {
  readonly kind: 'skill'
  readonly id: SkillId
  readonly name: string
  readonly description: string
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly gate: Gate
  readonly source: VisibilityLayer
  readonly collision: boolean
}

export interface BrokenNode {
  readonly kind: 'broken'
  readonly home: HomeKind
  readonly name: string
  readonly path: AbsolutePath
  readonly reason: BrokenReason
}

export interface GroupNode {
  readonly kind: 'group'
  readonly home: HomeKind
  readonly name: string
  readonly rel: string
  readonly path: AbsolutePath
  readonly gate: GroupGate
  readonly skill: SkillNode | null
  readonly children: readonly FolderChild[]
}

export type FolderChild = GroupNode | BrokenNode

export interface PackNode {
  readonly kind: 'pack'
  readonly id: PackId
  readonly home: HomeKind
  readonly name: string
  readonly path: AbsolutePath
  readonly link: { kind: 'symlink'; target: string } | { kind: 'directory' } | { kind: 'broken-symlink'; target: string }
  readonly gate: GroupGate
  readonly skill: SkillNode | null
  readonly children: readonly FolderChild[]
}

export interface RootSkillNode {
  readonly kind: 'root-skill'
  readonly id: SkillId
  readonly name: string
  readonly description: string
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly gate: Gate
  readonly source: VisibilityLayer
  readonly collision: boolean
}

export type CatalogNode = PackNode | RootSkillNode | BrokenNode

export interface HomeRoot {
  readonly kind: 'home'
  readonly home: HomeKind
  readonly path: AbsolutePath
  readonly children: readonly CatalogNode[]
}

export interface Catalog {
  readonly offered: readonly OfferedSkill[]
  readonly inventory: readonly ManagedSkill[]
  readonly tree: readonly HomeRoot[]
  readonly collisions: readonly Collision[]
  readonly broken: readonly BrokenEntry[]
  readonly layer?: VisibilityLayer
  /**
   * True when gates were resolved through the whole inheritance chain (Global,
   * then Project, then Chat). `layer` still names the layer whose document the
   * user is editing while each entry's `source` names the layer that actually
   * decided its gate, so an inherited override stays attributable.
   */
  readonly resolved?: boolean
  readonly legacySessionSnapshot?: boolean
}

export interface ResolveInput {
  readonly agentHome: AbsolutePath
  readonly dshHome: AbsolutePath
  readonly global?: VisibilityDocument
  readonly project?: VisibilityDocument
  readonly session?: VisibilityDocument
  /**
   * Fold Project and Chat into the Global document first, so every leaf reports
   * the gate the runtime would enforce no matter which layer the reader is
   * editing. Without it the layers stay separate and `gateStateOf` already
   * lets a deeper layer win on top of the global default.
   */
  readonly composeChain?: boolean
}

type ParsedSkill = {
  name: string
  description: string
  whenToUse?: string
  modelInvocable: boolean
  userInvocable: boolean
  content: string
}

type Leaf = {
  id: SkillId
  home: HomeKind
  relPath: string
  path: AbsolutePath
  directory: AbsolutePath
  parsed: ParsedSkill
}

function posixRel(from: string, to: string): string {
  return relative(from, to).split(sep).join('/')
}

function parseFrontmatter(text: string): { fields: Record<string, string>; body: string } | undefined {
  // Tolerate a UTF-8 BOM and CRLF line endings; match the closing fence in one
  // pass so no stray `\r` is left on the last field line.
  const match = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text)
  if (match === null || match[1] === undefined) return undefined
  const raw = match[1]
  const body = text.slice(match[0].length)
  const fields: Record<string, string> = {}
  const lines = raw.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const keyMatch = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line)
    if (keyMatch === null || keyMatch[1] === undefined || keyMatch[2] === undefined) continue
    const key = keyMatch[1]
    let value = keyMatch[2].trim()
    // YAML block scalar (`|`, `>`, with optional chomping/indent indicators):
    // gather the indented (or blank) continuation lines that follow.
    const block = /^[|>][-+]?\d*(?:\s+#.*)?$/.exec(value)
    if (block !== null) {
      const collected: string[] = []
      while (i + 1 < lines.length) {
        const next = lines[i + 1] ?? ''
        if (next.trim() !== '' && !/^\s/.test(next)) break
        collected.push(next.trim())
        i++
      }
      while (collected.length > 0 && collected[collected.length - 1] === '') collected.pop()
      while (collected.length > 0 && collected[0] === '') collected.shift()
      fields[key] = collected.join(' ')
      continue
    }
    if (
      (value.length >= 2 && value.startsWith('"') && value.endsWith('"'))
      || (value.length >= 2 && value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    fields[key] = value
  }
  return { fields, body }
}

function parseSkillFile(path: string): ParsedSkill | { error: BrokenReason } {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch (error) {
    return { error: { kind: 'unreadable-skill', message: String(error) } }
  }
  const parsed = parseFrontmatter(text)
  if (parsed === undefined) {
    return { error: { kind: 'invalid-frontmatter', message: 'missing yaml frontmatter' } }
  }
  const name = parsed.fields['name'] ?? ''
  const description = parsed.fields['description'] ?? ''
  if (name === '' || description === '') {
    return { error: { kind: 'invalid-frontmatter', message: 'name and description are required' } }
  }
  // A name the host cannot address makes the skill invisible to inventory, so
  // surface it as a broken row instead of silently dropping it from the tree.
  if (!isHostSkillName(name)) {
    return { error: { kind: 'invalid-name', raw: name } }
  }
  const disableModel = parsed.fields['disable-model-invocation']
  const userInvocableField = parsed.fields['user-invocable']
  return {
    name,
    description,
    ...parsed.fields['whenToUse'] !== undefined ? { whenToUse: parsed.fields['whenToUse'] } : {},
    modelInvocable: disableModel !== 'true',
    userInvocable: userInvocableField !== 'false',
    content: parsed.body,
  }
}

function listEntries(dir: string): string[] {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

/** Absolute recursion bound for the directory walk; symlink cycles bail earlier. */
const MAX_WALK_DEPTH = 12

/** Canonical path for cycle detection, tolerating realpath failures. */
function dirRealpath(path: string): string {
  try {
    return realpathSync(path)
  } catch {
    return path
  }
}

/** Best-effort target label for a symlink-cycle broken reason. */
function cycleTarget(path: string): string {
  try {
    return realpathSync(path)
  } catch { /* fall through */ }
  try {
    return readlinkSync(path)
  } catch { /* fall through */ }
  return path
}

function propagatedSkill(id: string | undefined, input: ResolveInput): { gate: Gate; source: VisibilityLayer } {
  return propagatedGate(id, [
    ['global', input.global], ['project', input.project], ['session', input.session],
  ])
}

/**
 * The result of composing the layer chain: the folded document, the map of
 * which layer decided each explicit id, and the layer that supplied the
 * composed default — the honest fallback attribution for unlisted rows.
 */
interface ComposedChain {
  readonly document: VisibilityDocument
  readonly decided: ReadonlyMap<string, VisibilityLayer>
  readonly defaultSource: VisibilityLayer
}

function gateStateOf(
  id: SkillId,
  input: ResolveInput,
  composed?: ComposedChain,
): { gate: Gate; source: VisibilityLayer } {
  // A composed document already folded the deeper layers into its global row, so
  // re-applying them would let a Chat or Project doc override the composition
  // and, worse, re-label the value as the wrong layer. The decision map is the
  // authority there; without composition the three documents are still separate.
  if (composed !== undefined) {
    return {
      gate: (input.global?.gates[id] ?? input.global?.default ?? 'on') === 'on' ? 'on' : 'off',
      source: composed.decided.get(id) ?? composed.defaultSource,
    }
  }
  return propagatedSkill(id, input)
}

function combineGates(gates: Gate[]): GroupGate {
  if (gates.length === 0) return 'off'
  const hasOn = gates.some(gate => gate === 'on')
  const hasOff = gates.some(gate => gate === 'off')
  if (hasOn && hasOff) return 'mixed'
  return hasOn ? 'on' : 'off'
}

function collectGates(node: FolderChild | PackNode): Gate[] {
  const own = node.kind === 'broken' ? [] : node.skill === null ? [] : [node.skill.gate]
  const nested = node.kind === 'broken' ? [] : node.children.flatMap(collectGates)
  return [...own, ...nested]
}

function walkGroup(
  home: HomeKind,
  homeRoot: string,
  dir: string,
  leaves: Leaf[],
  broken: BrokenEntry[],
  ancestors: readonly string[],
  depth: number,
): FolderChild {
  const rel = posixRel(homeRoot, dir)
  // This directory's canonical path joins the ancestor chain, so a child that
  // resolves onto it (or any earlier ancestor) is a symlink cycle.
  const chain = [...ancestors, dirRealpath(dir)]
  const skillPath = join(dir, 'SKILL.md')
  let skill: SkillNode | null = null
  if (existsSync(skillPath) && lstatSync(skillPath).isFile()) {
    const parsed = parseSkillFile(skillPath)
    if ('error' in parsed) {
      broken.push({ home, path: skillPath, reason: parsed.error })
    } else {
      const id = skillId(home, posix.join(rel, 'SKILL.md'))
      leaves.push({
        id,
        home,
        relPath: posix.join(rel, 'SKILL.md'),
        path: skillPath,
        directory: dir,
        parsed,
      })
      skill = {
        kind: 'skill',
        id,
        name: parsed.name,
        description: parsed.description,
        home,
        path: skillPath,
        gate: 'on',
        source: 'global',
        collision: false,
      }
    }
  }
  const children: FolderChild[] = []
  for (const name of listEntries(dir).sort()) {
    if (IGNORE.has(name) || name === 'SKILL.md') continue
    const child = join(dir, name)
    let stat
    try {
      stat = lstatSync(child)
    } catch (error) {
      broken.push({ home, path: child, reason: { kind: 'unreadable-skill', message: String(error) } })
      children.push({
        kind: 'broken',
        home,
        name,
        path: child,
        reason: { kind: 'unreadable-skill', message: String(error) },
      })
      continue
    }
    if (stat.isDirectory() || stat.isSymbolicLink()) {
      if (stat.isSymbolicLink() && !existsSync(child)) {
        let target = ''
        try { target = readlinkSync(child) } catch { target = child }
        const reason: BrokenReason = { kind: 'missing-symlink-target', target }
        broken.push({ home, path: child, reason })
        children.push({ kind: 'broken', home, name, path: child, reason })
        continue
      }
      if (!lstatSync(child).isDirectory() && !existsSync(join(child, 'SKILL.md'))) continue
      // A child directory (usually through a symlink) that resolves onto a
      // directory already on this walk's path would recurse forever; the
      // depth cap additionally bounds graphs realpath cannot untangle.
      if (chain.includes(dirRealpath(child)) || depth >= MAX_WALK_DEPTH) {
        const reason: BrokenReason = { kind: 'symlink-cycle', target: cycleTarget(child) }
        broken.push({ home, path: child, reason })
        children.push({ kind: 'broken', home, name, path: child, reason })
        continue
      }
      children.push(walkGroup(home, homeRoot, child, leaves, broken, chain, depth + 1))
    }
  }
  const node: GroupNode = {
    kind: 'group',
    home,
    name: basename(dir),
    rel,
    path: dir,
    gate: 'off',
    skill,
    children,
  }
  return { ...node, gate: combineGates(collectGates(node)) }
}

function walkHome(home: HomeKind, homeRoot: string, leaves: Leaf[], broken: BrokenEntry[]): CatalogNode[] {
  if (!existsSync(homeRoot)) {
    return []
  }
  // The home root itself is the first ancestor on the recursion path, so a
  // top-level pack symlinked back at the root is caught as a cycle too.
  const ancestors = [dirRealpath(homeRoot)]
  const children: CatalogNode[] = []
  for (const name of listEntries(homeRoot).sort()) {
    if (IGNORE.has(name)) continue
    const path = join(homeRoot, name)
    let stat
    try {
      stat = lstatSync(path)
    } catch (error) {
      const reason: BrokenReason = { kind: 'unreadable-skill', message: String(error) }
      broken.push({ home, path, reason })
      children.push({ kind: 'broken', home, name, path, reason })
      continue
    }
    if (stat.isFile() && name.endsWith('.md')) {
      const parsed = parseSkillFile(path)
      if ('error' in parsed) {
        broken.push({ home, path, reason: parsed.error })
        children.push({ kind: 'broken', home, name, path, reason: parsed.error })
        continue
      }
      const id = skillId(home, name)
      leaves.push({
        id,
        home,
        relPath: name,
        path,
        directory: homeRoot,
        parsed,
      })
      children.push({
        kind: 'root-skill',
        id,
        name: parsed.name,
        description: parsed.description,
        home,
        path,
        gate: 'on',
        source: 'global',
        collision: false,
      })
      continue
    }
    if (stat.isDirectory() || stat.isSymbolicLink()) {
      if (stat.isSymbolicLink() && !existsSync(path)) {
        let target = ''
        try { target = readlinkSync(path) } catch { target = path }
        const reason: BrokenReason = { kind: 'missing-symlink-target', target }
        broken.push({ home, path, reason })
        children.push({
          kind: 'broken',
          home,
          name,
          path,
          reason,
        })
        continue
      }
      let link: PackNode['link'] = { kind: 'directory' }
      if (stat.isSymbolicLink()) {
        let target = path
        try { target = readlinkSync(path) } catch { /* keep path */ }
        link = { kind: 'symlink', target }
      }
      const walked = walkGroup(home, homeRoot, path, leaves, broken, ancestors, 1)
      if (walked.kind === 'broken') {
        children.push(walked)
        continue
      }
      const pruned = pruneGroup(walked)
      if (pruned === null) {
        const skillPath = join(path, 'SKILL.md')
        const parseFail = broken.find(entry => entry.path === skillPath)
        const reason: BrokenReason = parseFail?.reason ?? { kind: 'empty-pack' }
        if (parseFail === undefined) broken.push({ home, path, reason })
        children.push({ kind: 'broken', home, name, path, reason })
        continue
      }
      const pack: PackNode = {
        kind: 'pack',
        id: packId(home, name),
        home,
        name,
        path,
        link,
        gate: pruned.gate,
        skill: pruned.skill,
        children: pruned.children,
      }
      children.push(pack)
    }
  }
  return regroupByOrigin(children, homeRoot)
}

function applyGatesToTree(
  nodes: readonly CatalogNode[],
  collisions: ReadonlySet<string>,
  input: ResolveInput,
  composed?: ComposedChain,
): CatalogNode[] {
  return nodes.map(node => applyGatesToNode(node, collisions, input, composed))
}

function applyGatesToNode(
  node: CatalogNode,
  collisions: ReadonlySet<string>,
  input: ResolveInput,
  composed?: ComposedChain,
): CatalogNode {
  if (node.kind === 'broken') return node
  if (node.kind === 'root-skill') {
    const state = gateStateOf(node.id, input, composed)
    return {
      ...node,
      ...state,
      collision: collisions.has(node.id),
    }
  }
  const skill = node.skill === null ? null : {
    ...node.skill,
    ...gateStateOf(node.skill.id, input, composed),
    collision: collisions.has(node.skill.id),
  }
  const children = node.children.map(child => {
    if (child.kind === 'broken') return child
    const next = applyGatesToNode(
      { ...child, kind: 'pack', id: packId(child.home, child.name), link: { kind: 'directory' } },
      collisions,
      input,
      composed,
    )
    if (next.kind !== 'pack') return child
    const group: GroupNode = {
      kind: 'group',
      home: next.home,
      name: next.name,
      rel: child.kind === 'group' ? child.rel : posixRel(dirname(node.path), next.path),
      path: next.path,
      gate: next.gate,
      skill: next.skill,
      children: next.children,
    }
    return group
  })
  const pack: PackNode = {
    ...node,
    skill,
    children,
    gate: 'off',
  }
  return { ...pack, gate: combineGates(collectGates(pack)) }
}

const emptyGateMap: Readonly<Record<string, LayerGate>> = {}

/**
 * Compose Global→Project→Chat into one document so a read at any layer reports
 * the gate the runtime enforces, while still naming the layer that decided each
 * value. Layer documents keep returning `LayerGate` values because the writer
 * still needs honest 'inherit' bookkeeping; a composed document loses it, which
 * is exactly the point: after folding, every id maps to the layer that won it.
 * @param input - the layers a query loaded.
 * @returns the composed document plus a decision map from skill id to layer.
 */
function composeChain(input: ResolveInput): ComposedChain {
  const fallback = propagatedSkill(undefined, input)
  const ids = new Set([input.global, input.project, input.session].flatMap(doc => Object.keys(doc?.gates ?? {})))
  const gates: Record<string, LayerGate> = Object.create(null) as Record<string, LayerGate>
  const decided = new Map<string, VisibilityLayer>()
  for (const id of ids) {
    const state = propagatedSkill(id, input)
    gates[id] = state.gate
    decided.set(id, state.source)
  }
  return { document: { version: 2, default: fallback.gate, gates }, decided, defaultSource: fallback.source }
}

/**
 * Resolve one gate id outside the disk inventory (package plugins and the
 * skills they ship) through the same Global→Project→Chat chain.
 * @param id - gate key, for example `plugin:dsh-guizang-design`.
 * @param input - the same layer documents the catalog receives.
 * @returns the winning gate and the layer that decided it.
 */
export function resolveIdGate(id: string, input: ResolveInput): { gate: Gate; source: VisibilityLayer } {
  return propagatedSkill(id, input)
}

export function resolveCatalog(input: ResolveInput): Catalog {
  const composed = input.composeChain === true ? composeChain(input) : undefined
  const source = composed === undefined ? input : { ...input, global: composed.document }
  const leaves: Leaf[] = []
  const broken: BrokenEntry[] = []
  const agentChildren = walkHome('agent', source.agentHome, leaves, broken)
  const dshChildren = walkHome('dsh', source.dshHome, leaves, broken)

  const byName = new Map<string, SkillId[]>()
  for (const leaf of leaves) {
    const list = byName.get(leaf.parsed.name) ?? []
    list.push(leaf.id)
    byName.set(leaf.parsed.name, list)
  }
  const collisions: Collision[] = []
  const collisionIds = new Set<string>()
  for (const [name, skills] of byName) {
    if (skills.length < 2) continue
    collisions.push({ name, skills })
    for (const id of skills) collisionIds.add(id)
  }

  const tree: HomeRoot[] = [
    {
      kind: 'home',
      home: 'agent',
      path: source.agentHome,
      children: applyGatesToTree(agentChildren, collisionIds, source, composed),
    },
    {
      kind: 'home',
      home: 'dsh',
      path: source.dshHome,
      children: applyGatesToTree(dshChildren, collisionIds, source, composed),
    },
  ]

  const inventory: ManagedSkill[] = []
  for (const leaf of leaves) {
    if (!isHostSkillName(leaf.parsed.name)) continue
    const state = gateStateOf(leaf.id, source, composed)
    const gate = state.gate
    const invocable = gate === 'on'
    inventory.push({
      id: leaf.id,
      name: leaf.parsed.name,
      description: leaf.parsed.description,
      ...leaf.parsed.whenToUse !== undefined ? { whenToUse: leaf.parsed.whenToUse } : {},
      home: leaf.home,
      path: leaf.path,
      directory: leaf.directory,
      invocation: {
        modelInvocable: invocable && leaf.parsed.modelInvocable,
        userInvocable: invocable && leaf.parsed.userInvocable,
      },
      content: leaf.parsed.content,
      gate,
      source: state.source,
    })
  }

  return {
    offered: inventory.filter(skill => skill.gate === 'on'),
    inventory,
    tree,
    collisions,
    broken,
  }
}
function resolvedPath(path: string): string | undefined {
  try {
    if (!existsSync(path)) return undefined
    return realpathSync(path)
  } catch {
    return undefined
  }
}

function originLayout(
  packPath: string,
  homeRoot: string,
): { originName: string; originPath: string; segments: string[] } | undefined {
  const real = resolvedPath(packPath)
  if (real === undefined) return undefined
  const parts = real.split(sep).filter(part => part !== '')
  const skillsAt = parts.lastIndexOf('skills')
  if (skillsAt <= 0 || skillsAt >= parts.length - 1) return undefined
  const skillsPath = `${sep}${parts.slice(0, skillsAt + 1).join(sep)}`
  const homeReal = resolvedPath(homeRoot)
  if (homeReal !== undefined && skillsPath === homeReal) return undefined
  const originName = parts[skillsAt - 1]
  if (originName === undefined || originName.startsWith('.')) return undefined
  const originPath = `${sep}${parts.slice(0, skillsAt).join(sep)}`
  const segments = parts.slice(skillsAt + 1)
  if (segments.length === 0) return undefined
  return { originName, originPath, segments }
}

function packAsGroup(pack: PackNode, rel: string, name: string): GroupNode {
  return {
    kind: 'group',
    home: pack.home,
    name,
    rel,
    path: pack.path,
    gate: pack.gate,
    skill: pack.skill,
    children: pack.children,
  }
}

function insertOriginSkill(
  origin: { children: FolderChild[]; path: string },
  segments: string[],
  pack: PackNode,
): void {
  let parent: { children: FolderChild[]; path: string } = origin
  let prefix = ''
  for (let i = 0; i < segments.length; i += 1) {
    const name = segments[i]
    if (name === undefined) return
    const rel = prefix === '' ? name : `${prefix}/${name}`
    if (i === segments.length - 1) {
      parent.children.push(packAsGroup(pack, rel, name))
      return
    }
    let group = parent.children.find((child): child is GroupNode => child.kind === 'group' && child.rel === rel)
    if (group === undefined) {
      group = {
        kind: 'group',
        home: pack.home,
        name,
        rel,
        path: join(parent.path, name),
        gate: 'off',
        skill: null,
        children: [],
      }
      parent.children.push(group)
    }
    parent = { children: group.children as FolderChild[], path: group.path }
    prefix = rel
  }
}

function compareByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name)
}

function finalizeFolderChild(node: FolderChild): FolderChild {
  if (node.kind === 'broken') return node
  const children = node.children.map(finalizeFolderChild).sort(compareByName)
  const next: GroupNode = { ...node, children, gate: 'off' }
  return { ...next, gate: combineGates(collectGates(next)) }
}

function regroupByOrigin(nodes: readonly CatalogNode[], homeRoot: string): CatalogNode[] {
  const leftover: CatalogNode[] = []
  const origins = new Map<string, { originName: string; originPath: string; home: HomeKind; children: FolderChild[] }>()
  for (const node of nodes) {
    if (node.kind !== 'pack') {
      leftover.push(node)
      continue
    }
    const layout = originLayout(node.path, homeRoot)
    if (layout === undefined) {
      leftover.push(node)
      continue
    }
    const key = `${node.home}:${layout.originPath}`
    let origin = origins.get(key)
    if (origin === undefined) {
      origin = {
        originName: layout.originName,
        originPath: layout.originPath,
        home: node.home,
        children: [],
      }
      origins.set(key, origin)
    }
    insertOriginSkill({ children: origin.children, path: origin.originPath }, layout.segments, node)
  }
  const originPacks: PackNode[] = []
  for (const origin of origins.values()) {
    const children = origin.children.map(finalizeFolderChild).sort(compareByName)
    const pack: PackNode = {
      kind: 'pack',
      id: packId(origin.home, origin.originName),
      home: origin.home,
      name: origin.originName,
      path: origin.originPath,
      link: { kind: 'directory' },
      gate: 'off',
      skill: null,
      children,
    }
    originPacks.push({ ...pack, gate: combineGates(collectGates(pack)) })
  }
  return [...originPacks, ...leftover].sort(compareByName)
}

function pruneGroup(node: GroupNode): GroupNode | null {
  const children: FolderChild[] = []
  for (const child of node.children) {
    if (child.kind === 'broken') {
      children.push(child)
      continue
    }
    const next = pruneGroup(child)
    if (next !== null) children.push(next)
  }
  if (node.skill === null && children.length === 0) return null
  const pruned: GroupNode = { ...node, children, gate: 'off' }
  return { ...pruned, gate: combineGates(collectGates(pruned)) }
}

export function findGroupByRel(node: PackNode | GroupNode, rel: string): PackNode | GroupNode | undefined {
  if (node.kind === 'pack' && rel === node.name) return node
  if (node.kind === 'group' && node.rel === rel) return node
  for (const child of node.children) {
    if (child.kind !== 'group') continue
    const found = findGroupByRel(child, rel)
    if (found !== undefined) return found
  }
  return undefined
}

export function descendantSkillIds(node: PackNode | GroupNode): SkillId[] {
  const ids: SkillId[] = []
  if (node.skill !== null) ids.push(node.skill.id)
  for (const child of node.children) {
    if (child.kind === 'group') ids.push(...descendantSkillIds(child))
  }
  return ids
}

export function collectSkillGates(tree: readonly HomeRoot[]): { id: SkillId; gate: Gate }[] {
  const rows: { id: SkillId; gate: Gate }[] = []
  const walk = (nodes: readonly CatalogNode[] | readonly FolderChild[]): void => {
    for (const node of nodes) {
      if (node.kind === 'root-skill') {
        rows.push({ id: node.id, gate: node.gate })
        continue
      }
      if (node.kind === 'broken') continue
      if (node.skill !== null) rows.push({ id: node.skill.id, gate: node.skill.gate })
      walk(node.children)
    }
  }
  for (const home of tree) walk(home.children)
  return rows
}
