import { createHash, randomUUID } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, symlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { nextPropagationRevision, readPropagationMetadata } from './propagation.ts'
import type { BundlePlugin } from './bundles.ts'
import {
  collectSkillGates, descendantSkillIds, findGroupByRel, resolveCatalog, resolveIdGate,
  type Catalog, type Gate, type HomeKind, type LayerGate, type PackNode, type ResolveInput, type SkillId,
  type VisibilityDocument, type VisibilityLayer,
} from './catalog.ts'

export type LayerName = VisibilityLayer
export type CatalogQuery = {
  readonly sessionId?: string
  readonly folder?: string
  readonly layer?: LayerName
  readonly resolved?: boolean
}
export interface HubPaths {
  readonly agentHome: string
  readonly dshHome: string
  readonly storeDir: string
}
export type VisibilityTarget =
  | { readonly kind: 'skill'; readonly id: SkillId }
  | { readonly kind: 'group'; readonly packHome: HomeKind; readonly packName: string; readonly rel: string }
  | { readonly kind: 'home'; readonly home: HomeKind }
  | { readonly kind: 'ids'; readonly ids: readonly SkillId[] }
  | { readonly kind: 'all' }
/** Effective gate of one package-shipped skill; `locked` marks a parent plugin that is off. */
export interface BundleSkillView {
  readonly id: string
  readonly name: string
  readonly gate: Gate
  readonly source: LayerName
  readonly effective: Gate
  readonly locked: boolean
}
/** One installed package that contributes skills, with its effective gates. */
export interface BundlePluginView {
  readonly name: string
  readonly root: string
  readonly gate: Gate
  readonly source: LayerName
  readonly skills: readonly BundleSkillView[]
}
export interface BundleCatalog {
  readonly layer: LayerName
  readonly plugins: readonly BundlePluginView[]
}
export type ToggleTarget = VisibilityTarget & { readonly on: boolean }

/** Gate key of a package-level switch. */
export function pluginGateId(name: string): string { return `plugin:${name}` }
/** Gate key of one skill a package ships. */
export function bundleSkillGateId(plugin: string, skill: string): string { return `bundle:${plugin}:${skill}` }

function emptyDocument(layer: LayerName): VisibilityDocument {
  return { version: 2, default: layer === 'global' ? 'on' : 'inherit', gates: {} }
}
function readDoc(path: string, layer: LayerName): VisibilityDocument {
  if (!existsSync(path)) return emptyDocument(layer)
  let raw: unknown
  try { raw = JSON.parse(readFileSync(path, 'utf8')) as unknown } catch {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  const object = raw as { version?: unknown; default?: unknown; gates?: unknown; legacySnapshot?: unknown }
  if (typeof object.gates !== 'object' || object.gates === null || Array.isArray(object.gates)) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  const gates: Record<string, LayerGate> = Object.create(null) as Record<string, LayerGate>
  for (const [id, gate] of Object.entries(object.gates)) {
    if (gate !== 'on' && gate !== 'off' && !(layer !== 'global' && gate === 'inherit')) {
      throw new Error(`Invalid SkillHub visibility document: ${path}`)
    }
    gates[id] = gate
  }
  if (object.version === undefined) {
    return { version: 2, default: layer === 'project' ? 'inherit' : 'on', gates,
      ...(layer === 'session' ? { legacySnapshot: true } : {}) }
  }
  if (object.version !== 2) throw new Error(`Unsupported SkillHub visibility document version: ${path}`)
  const defaultGate = object.default
  if (defaultGate !== 'on' && defaultGate !== 'off' && !(layer !== 'global' && defaultGate === 'inherit')) {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  if (object.legacySnapshot !== undefined && typeof object.legacySnapshot !== 'boolean') {
    throw new Error(`Invalid SkillHub visibility document: ${path}`)
  }
  return { version: 2, default: defaultGate, gates, ...readPropagationMetadata(object, path),
    ...(object.legacySnapshot === true ? { legacySnapshot: true } : {}) }
}
function writeDoc(path: string, doc: VisibilityDocument): void {
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${randomUUID()}.tmp`
  writeFileSync(temp, `${JSON.stringify(doc, null, 2)}\n`, { mode: 0o600 })
  renameSync(temp, path)
}
function folderKey(folder: string): string {
  return createHash('sha256').update(resolve(folder)).digest('hex').slice(0, 24)
}
function optionalFolder(folder: string | undefined): string | undefined {
  return folder === undefined || folder.trim() === '' ? undefined : resolve(folder)
}
function assertSessionId(id: string): void {
  if (id.trim() === '' || id === '.' || id === '..' || id.includes('/') || id.includes('\\') || id.includes('\0')) {
    throw new Error('invalid sessionId for Session visibility')
  }
}
function resolvedLayer(query: CatalogQuery): LayerName {
  return query.layer ?? (query.sessionId !== undefined ? 'session' : query.folder !== undefined ? 'project' : 'global')
}
function targetIds(catalog: Catalog, target: VisibilityTarget): SkillId[] {
  if (target.kind === 'skill') return [target.id]
  if (target.kind === 'ids') return [...target.ids]
  if (target.kind === 'all') return collectSkillGates(catalog.tree).map(row => row.id)
  if (target.kind === 'home') return collectSkillGates(catalog.tree.filter(node => node.home === target.home)).map(row => row.id)
  const root = catalog.tree.find(node => node.home === target.packHome)
  const pack = root?.children.find((node): node is PackNode => node.kind === 'pack' && node.name === target.packName)
  if (pack === undefined) return []
  const group = findGroupByRel(pack, target.rel)
  return group === undefined ? [] : descendantSkillIds(group)
}

export class SkillHub {
  constructor(readonly paths: HubPaths) {
    for (const path of [paths.agentHome, paths.dshHome, paths.storeDir]) mkdirSync(path, { recursive: true })
  }
  private globalPath(): string { return join(this.paths.storeDir, 'global.json') }
  private projectPath(folder: string): string { return join(this.paths.storeDir, 'projects', `${folderKey(folder)}.json`) }
  private sessionPath(id: string): string {
    assertSessionId(id)
    return join(this.paths.storeDir, 'sessions', `${id}.json`)
  }
  private documentPath(layer: LayerName, sessionId?: string, folder?: string): string {
    if (layer === 'global') return this.globalPath()
    if (layer === 'project') {
      if (folder === undefined || folder === '') throw new Error('folder required for Project visibility')
      return this.projectPath(folder)
    }
    if (layer !== 'session') throw new Error('invalid layer')
    if (sessionId === undefined || sessionId === '') throw new Error('sessionId required for Session visibility')
    return this.sessionPath(sessionId)
  }

  /** The three layer documents a read composes, validated against the query. */
  private layerInput(layer: LayerName, sessionId: string | undefined, folder: string | undefined): ResolveInput {
    const global = readDoc(this.globalPath(), 'global')
    const project = layer === 'global' || folder === undefined ? undefined : readDoc(this.projectPath(folder), 'project')
    const session = layer !== 'session' || sessionId === undefined ? undefined : readDoc(this.sessionPath(sessionId), 'session')
    return {
      agentHome: this.paths.agentHome,
      dshHome: this.paths.dshHome,
      global,
      ...(project !== undefined ? { project } : {}),
      ...(session !== undefined ? { session } : {}),
    }
  }
  /** UI and provider use the same scoped, latest-operation resolution. */
  catalog(query: CatalogQuery = {}): Catalog {
    const layer = resolvedLayer(query)
    const folder = optionalFolder(query.folder)
    this.documentPath(layer, query.sessionId, folder)
    const session = layer !== 'session' || query.sessionId === undefined ? undefined : readDoc(this.sessionPath(query.sessionId), 'session')
    return {
      ...resolveCatalog(this.layerInput(layer, query.sessionId, folder)),
      layer,
      ...(query.resolved ? { resolved: true } : {}),
      ...(session?.legacySnapshot ? { legacySessionSnapshot: true } : {}),
    }
  }
  layerCatalog(layer: LayerName, folder?: string, sessionId?: string): Catalog {
    return this.catalog({ layer,
      ...(layer === 'session' && sessionId !== undefined ? { sessionId } : {}),
      ...(layer === 'project' && folder !== undefined ? { folder } : {}),
    })
  }
  displayedCatalog(layer: LayerName, folder?: string, sessionId?: string): Catalog {
    return this.catalog({ layer, resolved: true,
      ...(folder !== undefined ? { folder } : {}), ...(sessionId !== undefined ? { sessionId } : {}) })
  }
  toggle(query: { layer: LayerName; sessionId?: string; folder?: string; target: ToggleTarget }): Catalog {
    const folder = optionalFolder(query.folder)
    const path = this.documentPath(query.layer, query.sessionId, folder)
    const catalog = this.catalog({ layer: query.layer,
      ...(query.sessionId !== undefined ? { sessionId: query.sessionId } : {}),
      ...(folder !== undefined ? { folder } : {}) })
    const current = readDoc(path, query.layer)
    const revision = nextPropagationRevision(this.paths.storeDir)
    if (query.target.kind === 'all') {
      writeDoc(path, { version: 2, default: query.target.on ? 'on' : 'off', defaultRevision: revision, gates: {}, gateRevisions: {} })
    } else {
      const gates = { ...current.gates }
      const gateRevisions = { ...current.gateRevisions }
      for (const id of targetIds(catalog, query.target)) {
        gates[id] = query.target.on ? 'on' : 'off'
        gateRevisions[id] = revision
      }
      writeDoc(path, { ...current, gates, gateRevisions })
    }
    return this.displayedCatalog(query.layer, folder, query.sessionId)
  }

  /** Compatibility for older clients only; no restore controls in the current UI. */
  inherit(query: { layer: LayerName; sessionId?: string; folder?: string; target: VisibilityTarget }): Catalog {
    const folder = optionalFolder(query.folder)
    const path = this.documentPath(query.layer, query.sessionId, folder)
    const catalog = this.catalog({ layer: query.layer,
      ...(query.sessionId !== undefined ? { sessionId: query.sessionId } : {}),
      ...(folder !== undefined ? { folder } : {}) })
    const current = readDoc(path, query.layer)
    if (query.target.kind === 'all') {
      writeDoc(path, query.layer === 'global'
        ? { ...current, gates: {}, gateRevisions: {} }
        : emptyDocument(query.layer))
    } else {
      const gates = { ...current.gates }
      const gateRevisions = { ...current.gateRevisions }
      for (const id of targetIds(catalog, query.target)) {
        if (query.layer === 'global' || current.default === 'inherit') delete gates[id]
        else gates[id] = 'inherit'
        delete gateRevisions[id]
      }
      writeDoc(path, { ...current, gates, gateRevisions })
    }
    return this.layerCatalog(query.layer, folder, query.sessionId)
  }
  resetSession(sessionId: string, folder?: string): Catalog {
    return this.inherit({ layer: 'session', sessionId, ...(folder !== undefined ? { folder } : {}), target: { kind: 'all' } })
  }
  resetProject(folder: string): Catalog { return this.inherit({ layer: 'project', folder, target: { kind: 'all' } }) }
  /**
   * Gates of the package contributions at this scope. A skill is effective only
   * when both its own row and the parent package row are on; an off parent locks
   * the child switch without rewriting the child's stored value.
   */
  bundleCatalog(bundles: readonly BundlePlugin[], query: CatalogQuery = {}): BundleCatalog {
    const layer = resolvedLayer(query)
    const folder = optionalFolder(query.folder)
    this.documentPath(layer, query.sessionId, folder)
    const input = this.layerInput(layer, query.sessionId, folder)
    const plugins = bundles.map((plugin): BundlePluginView => {
      const parent = resolveIdGate(pluginGateId(plugin.name), input)
      const skills = plugin.skills.map((skill): BundleSkillView => {
        const id = bundleSkillGateId(plugin.name, skill.name)
        const own = resolveIdGate(id, input)
        return {
          id,
          name: skill.name,
          gate: own.gate,
          source: own.source,
          effective: parent.gate === 'on' && own.gate === 'on' ? 'on' : 'off',
          locked: parent.gate === 'off',
        }
      })
      return { name: plugin.name, root: plugin.root, gate: parent.gate, source: parent.source, skills }
    })
    return { layer, plugins }
  }
  /** Write one package or package-skill gate into the requested layer document. */
  toggleBundle(query: { layer: LayerName; sessionId?: string; folder?: string; id: string; on: boolean }): void {
    const folder = optionalFolder(query.folder)
    const path = this.documentPath(query.layer, query.sessionId, folder)
    const current = readDoc(path, query.layer)
    writeDoc(path, {
      ...current,
      gates: { ...current.gates, [query.id]: query.on ? 'on' : 'off' },
      gateRevisions: { ...current.gateRevisions, [query.id]: nextPropagationRevision(this.paths.storeDir) },
    })
  }
  install(sourceDir: string, home: HomeKind): Catalog {
    let real: string
    try { real = realpathSync(sourceDir) } catch { throw new Error(`Pack source directory does not exist: ${sourceDir}`) }
    if (!lstatSync(real).isDirectory()) throw new Error(`Pack source is not a directory: ${sourceDir}`)
    const destHome = home === 'agent' ? this.paths.agentHome : this.paths.dshHome
    mkdirSync(destHome, { recursive: true })
    const name = basename(sourceDir)
    const dest = join(destHome, name)
    if (existsSync(dest)) throw new Error(`Pack "${name}" already exists in ${home} home`)
    symlinkSync(real, dest, 'junction')
    return this.catalog({})
  }
}
