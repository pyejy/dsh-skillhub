export type LayerName = 'global' | 'project' | 'session'
export type GateSource = LayerName
export type HomeKind = 'agent' | 'dsh'
export type Gate = 'on' | 'off'
export type GroupGate = 'on' | 'off' | 'mixed'

export type PackLink =
  | { kind: 'symlink'; target: string }
  | { kind: 'directory' }
  | { kind: 'broken-symlink'; target: string }

export type BrokenReason = {
  kind: 'missing-symlink-target' | 'unreadable-skill' | 'invalid-frontmatter' | 'invalid-name' | 'empty-pack' | 'symlink-cycle'
  target?: string
  message?: string
  raw?: string
}

export type CatalogPayload = {
  offered: { id: string; name: string; home: HomeKind }[]
  tree: HomeRoot[]
  collisions: { name: string; skills: string[] }[]
  broken: { path: string; reason: BrokenReason }[]
  layer?: LayerName
  /**
   * True when every `gate` below is the resolved Global→Project→Chat value the
   * model actually runs with, so `source` names the layer that decided it.
   * False only for a raw single-layer read.
   */
  resolved: boolean
  legacySessionSnapshot: boolean
}

export type HomeRoot = {
  kind: 'home'
  home: HomeKind
  path: string
  children: CatalogNode[]
}

export type SkillRef = {
  id: string
  name: string
  description?: string
  gate: Gate
  source: GateSource
  collision: boolean
}

export type CatalogNode =
  | {
    kind: 'pack'
    id: string
    name: string
    home: HomeKind
    path: string
    link: PackLink
    gate: GroupGate
    skill: SkillRef | null
    children: GroupChild[]
  }
  | {
    kind: 'root-skill'
    id: string
    name: string
    description?: string
    home: HomeKind
    path: string
    gate: Gate
    source: GateSource
    collision: boolean
  }
  | {
    kind: 'broken'
    name: string
    path: string
    home: HomeKind
    reason: BrokenReason
  }

export type GroupChild =
  | {
    kind: 'group'
    name: string
    rel: string
    home: HomeKind
    path: string
    gate: GroupGate
    skill: SkillRef | null
    children: GroupChild[]
  }
  | {
    kind: 'broken'
    name: string
    path: string
    home: HomeKind
    reason: BrokenReason
  }

/** One skill a package ships, with the store value and the resolved value. */
export type BundleSkillView = {
  id: string
  name: string
  /** Value stored for this skill's own row; the parent plugin is not folded in. */
  gate: Gate
  source: GateSource
  /** Parent plugin ∧ own row — what the model actually runs with. */
  effective: Gate
  /** True while the owning plugin is off; the switch is display-only then. */
  locked: boolean
}

/** One installed package that contributes skills to the catalogue. */
export type BundlePluginView = {
  name: string
  root: string
  gate: Gate
  source: GateSource
  skills: BundleSkillView[]
}

/** `/skillhub/bundles` snapshot for one scope. */
export type BundleCatalog = {
  layer: LayerName
  plugins: BundlePluginView[]
}

/** Scope selector shared by the bundle endpoints. */
export type BundleQuery = {
  layer: LayerName
  sessionId?: string
  folder?: string
}

/** What holds a group together: a same-named capability, or a skill family. */
export type GroupKind = 'capability' | 'family'

/**
 * One skill inside a group. `gate` is the skill's own row, `effective` folds in
 * the group's gate, and `locked` says the group is off — then the member is
 * display-only and its stored value must stay untouched.
 */
export type GroupSkillView = {
  id: string
  name: string
  gate: Gate
  source: GateSource
  effective: Gate
  locked: boolean
}

/** One MCP server inside a group, same contract as a member skill. */
export type GroupServerView = {
  name: string
  tools: number
  gate: Gate
  source: GateSource
  effective: Gate
  locked: boolean
}

/** A capability (`abaqus` skill + `abaqus` MCP) or a family of skills. */
export type GroupView = {
  name: string
  kind: GroupKind
  gate: Gate
  source: GateSource
  skills: GroupSkillView[]
  servers: GroupServerView[]
}

/** `/skillhub/groups` snapshot for one scope. */
export type GroupCatalog = {
  layer: LayerName
  groups: GroupView[]
}

/** Scope selector shared by the group and MCP endpoints. */
export type GroupQuery = BundleQuery

/** One MCP server row of the manager's MCP tab. */
export type McpServerRow = {
  name: string
  tools: number
  gate: Gate
  source: LayerName
  supported: boolean
}

/** `/skillhub/mcp/catalog` snapshot for one scope. */
export type McpCatalog = { servers: McpServerRow[] }

const BASE = '/skillhub'

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  const trimmed = text.trimStart().toLowerCase()
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    throw new Error('The SkillHub host API is not on this Web session yet. Retry after DSH reloads the SkillHub server plugin.')
  }
  if (!response.ok) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
        const error = (parsed as { error: unknown }).error
        if (typeof error === 'string' && error !== '') throw new Error(error)
      }
    } catch (caught) {
      if (caught instanceof Error && caught.message !== text) throw caught
    }
    throw new Error(text === '' ? `HTTP ${String(response.status)}` : text)
  }
  return JSON.parse(text) as unknown
}

export async function fetchCatalog(
  sessionId?: string,
  folder?: string,
  layer?: LayerName,
): Promise<CatalogPayload> {
  const query = new URLSearchParams()
  if (sessionId !== undefined && sessionId !== '') query.set('sessionId', sessionId)
  if (folder !== undefined && folder !== '') query.set('folder', folder)
  if (layer !== undefined) query.set('layer', layer)
  const response = await fetch(`${BASE}/catalog?${query.toString()}`)
  return await readJson(response) as CatalogPayload
}

export async function postCatalog(path: string, body: Record<string, unknown>): Promise<CatalogPayload> {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await readJson(response)
  if (typeof payload === 'object' && payload !== null && 'offered' in payload) {
    return payload as CatalogPayload
  }
  if (
    typeof payload === 'object'
    && payload !== null
    && 'catalog' in payload
    && typeof (payload as { catalog: unknown }).catalog === 'object'
    && (payload as { catalog: object }).catalog !== null
  ) {
    return (payload as { catalog: CatalogPayload }).catalog
  }
  throw new Error('SkillHub returned an unexpected response')
}

function bundleQuery(query: BundleQuery): Record<string, string> {
  const params = new URLSearchParams()
  params.set('layer', query.layer)
  if (query.sessionId !== undefined && query.sessionId !== '') params.set('sessionId', query.sessionId)
  if (query.folder !== undefined && query.folder !== '') params.set('folder', query.folder)
  return Object.fromEntries(params)
}

function asBundleCatalog(payload: unknown): BundleCatalog {
  if (typeof payload === 'object' && payload !== null && Array.isArray((payload as { plugins?: unknown }).plugins)) {
    return payload as BundleCatalog
  }
  throw new Error('SkillHub returned an unexpected response')
}

/** Package contributions of one scope, with their effective gates. */
export async function fetchBundles(query: BundleQuery): Promise<BundleCatalog> {
  const params = new URLSearchParams(bundleQuery(query))
  const response = await fetch(`${BASE}/bundles?${params.toString()}`)
  return asBundleCatalog(await readJson(response))
}

/**
 * Write one gate of the bundle layer and return that layer's fresh snapshot.
 * @param query - scope of the layer document to write.
 * @param id - `plugin:<package>` or `bundle:<package>:<skill>`.
 * @param on - target gate.
 */
export async function postBundleToggle(query: BundleQuery, id: string, on: boolean): Promise<BundleCatalog> {
  const response = await fetch(`${BASE}/bundles/toggle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...bundleQuery(query), id, on }),
  })
  return asBundleCatalog(await readJson(response))
}

function asGroupCatalog(payload: unknown): GroupCatalog {
  if (typeof payload === 'object' && payload !== null && Array.isArray((payload as { groups?: unknown }).groups)) {
    return payload as GroupCatalog
  }
  throw new Error('SkillHub returned an unexpected response')
}

/** Composition layer of one scope: capabilities and skill families. */
export async function fetchGroups(query: GroupQuery): Promise<GroupCatalog> {
  const params = new URLSearchParams(bundleQuery(query))
  const response = await fetch(`${BASE}/groups?${params.toString()}`)
  return asGroupCatalog(await readJson(response))
}

/**
 * Write one group's own gate and return that layer's fresh snapshot.
 *
 * Only the group row moves: members keep their stored value, so opening the
 * group again restores exactly what each member was left at.
 *
 * @param query - scope of the layer document to write.
 * @param name - group name, e.g. `abaqus`.
 * @param on - target gate of the group itself.
 */
export async function postGroupToggle(query: GroupQuery, name: string, on: boolean): Promise<GroupCatalog> {
  const response = await fetch(`${BASE}/groups/toggle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...bundleQuery(query), name, on }),
  })
  return asGroupCatalog(await readJson(response))
}

function asMcpCatalog(payload: unknown): McpCatalog {
  if (typeof payload === 'object' && payload !== null && Array.isArray((payload as { servers?: unknown }).servers)) {
    return payload as McpCatalog
  }
  throw new Error('SkillHub returned an unexpected response')
}

/** Write one MCP server gate and return that scope's fresh server list. */
export async function postMcpToggle(query: GroupQuery, server: string, on: boolean): Promise<McpCatalog> {
  const response = await fetch(`${BASE}/mcp/toggle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...bundleQuery(query), server, on }),
  })
  return asMcpCatalog(await readJson(response))
}
