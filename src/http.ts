import type { installMcpVisibility } from './mcp-runtime.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { BundlePlugin } from './bundles.ts'
import { groupGateId, computeGroups } from './groups.ts'
import type { Gate } from './catalog.ts'
import type { Catalog, HomeKind, SkillId } from './catalog.ts'
import type { LayerName, SkillHub, ToggleTarget, VisibilityTarget } from './hub.ts'

const PREFIX = '/skillhub'

function clientCatalog(catalog: Catalog) {
  return {
    offered: catalog.offered.map(skill => ({
      id: skill.id,
      name: skill.name,
      home: skill.home,
    })),
    tree: catalog.tree,
    collisions: catalog.collisions,
    broken: catalog.broken,
    layer: catalog.layer,
    resolved: catalog.resolved === true,
    legacySessionSnapshot: catalog.legacySessionSnapshot === true,
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(text)
}

const MAX_BODY_BYTES = 1024 * 1024

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let bytes = 0
  for await (const chunk of req) {
    bytes += (chunk as Buffer).length
    // Abruptly leaving the async iterator destroys the request stream.
    if (bytes > MAX_BODY_BYTES) throw new Error('invalid JSON: request body exceeds 1 MiB')
    chunks.push(chunk as Buffer)
  }
  if (chunks.length === 0) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new Error('invalid JSON body')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
  return parsed as Record<string, unknown>
}

function isLayerName(value: string | null): value is LayerName {
  return value === 'global' || value === 'project' || value === 'session'
}

/**
 * Read one catalog request. Every surface that displays a gate must see the
 * same value the model runs with, so the whole Panel chain is resolved through
 * Global→Project→Chat; a raw layer-only read is opt-in for callers that
 * explicitly want the layer document itself.
 */
function query(url: URL): { sessionId?: string; folder?: string; layer?: LayerName; resolved: boolean } {
  const sessionId = url.searchParams.get('sessionId') ?? undefined
  const folder = url.searchParams.get('folder') ?? undefined
  const layer = url.searchParams.get('layer')
  return {
    ...sessionId !== undefined && sessionId !== '' ? { sessionId } : {},
    ...folder !== undefined && folder !== '' ? { folder } : {},
    ...isLayerName(layer) ? { layer } : {},
    resolved: url.searchParams.get('raw') !== '1',
  }
}

function isSkillIdList(value: unknown): value is SkillId[] {
  return Array.isArray(value) && value.every(id => typeof id === 'string' && id !== '')
}

function visibilityTarget(body: Record<string, unknown>): VisibilityTarget {
  const kind = body['kind']
  if (kind === 'all') return { kind: 'all' }
  if (kind === 'skill' && typeof body['id'] === 'string') {
    return { kind: 'skill', id: body['id'] as SkillId }
  }
  if (kind === 'ids' && isSkillIdList(body['ids'])) {
    return { kind: 'ids', ids: body['ids'] }
  }
  if (kind === 'home' && (body['home'] === 'agent' || body['home'] === 'dsh')) {
    return { kind: 'home', home: body['home'] }
  }
  if (
    kind === 'group'
    && (body['packHome'] === 'agent' || body['packHome'] === 'dsh')
    && typeof body['packName'] === 'string'
    && typeof body['rel'] === 'string'
  ) {
    return {
      kind: 'group',
      packHome: body['packHome'],
      packName: body['packName'],
      rel: body['rel'],
    }
  }
  throw new Error('invalid visibility target')
}

function toggleTarget(body: Record<string, unknown>): ToggleTarget {
  if (typeof body['on'] !== 'boolean') throw new Error('on must be boolean')
  return { ...visibilityTarget(body), on: body['on'] }
}

/**
 * Groups of the requested scope: skills sharing a base name plus the MCP server
 * of the same name. A group is a view with its own gate, so members keep their
 * stored value and only inherit the lock.
 */
function groupsPayload(
  hub: SkillHub,
  mcp: ReturnType<typeof installMcpVisibility> | undefined,
  query: { sessionId?: string; folder?: string; layer?: LayerName; resolved: boolean },
): { layer: LayerName; groups: ReturnType<typeof computeGroups> } {
  const catalog = hub.catalog(query)
  const servers = mcp === undefined ? [] : mcp.catalog(query).servers
  const groups = computeGroups({
    skills: catalog.inventory.map(skill => ({ id: skill.id, name: skill.name, gate: skill.gate, source: skill.source })),
    servers,
  }, name => hub.gateOf(query, groupGateId(name)) as { gate: Gate; source: LayerName })
  return { layer: catalog.layer ?? 'global', groups }
}

export function handleSkillHubHttp(
  hub: SkillHub,
  invalidate: () => void,
  requestRejection?: (req: IncomingMessage) => 401 | 403 | undefined,
  mcp?: ReturnType<typeof installMcpVisibility>,
  bundles?: () => readonly BundlePlugin[],
) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const host = req.headers.host ?? '127.0.0.1'
      const url = new URL(req.url ?? '/', `http://${host}`)
      const path = url.pathname.slice(PREFIX.length) || '/'
      if (requestRejection === undefined) {
        send(res, 503, { error: 'Host authentication unavailable' })
        return
      }
      const rejection = requestRejection(req)
      if (rejection !== undefined) {
        send(res, rejection, { error: rejection === 401 ? 'unauthorized' : 'forbidden' })
        return
      }
      if (req.method === 'GET' && path === '/mcp/catalog') {
        if (!mcp) { send(res, 503, { error: 'MCP visibility unavailable' }); return }
        send(res, 200, mcp.catalog(query(url)))
        return
      }
      if (req.method === 'GET' && path === '/groups') {
        send(res, 200, groupsPayload(hub, mcp, query(url)))
        return
      }
      if (req.method === 'GET' && path === '/bundles') {
        send(res, 200, hub.bundleCatalog(bundles?.() ?? [], query(url)))
        return
      }
      if (req.method === 'GET' && (path === '/catalog' || path === '/')) {
        send(res, 200, clientCatalog(hub.catalog(query(url))))
        return
      }
      if (req.method !== 'POST') {
        send(res, 405, { error: 'method not allowed' })
        return
      }
      const body = await readJson(req)
      if (path === '/mcp/toggle' || path === '/mcp/inherit') {
        if (!mcp) throw new Error('MCP visibility unavailable')
        const layer = body['layer']
        if (layer !== 'global' && layer !== 'project' && layer !== 'session') throw new Error('invalid MCP layer')
        if (typeof body['server'] !== 'string') throw new Error('server required')
        if (path === '/mcp/toggle' && typeof body['on'] !== 'boolean') throw new Error('on must be boolean')
        for (const key of ['folder', 'sessionId']) if (body[key] !== undefined && typeof body[key] !== 'string') throw new Error(`invalid ${key}`)
        const q: import('./mcp.ts').McpCatalogQuery = { layer, ...(typeof body['folder'] === 'string' ? { folder: body['folder'] } : {}), ...(typeof body['sessionId'] === 'string' ? { sessionId: body['sessionId'] } : {}) }
        send(res, 200, mcp.mutate(q, body['server'], path === '/mcp/toggle' ? body['on'] as boolean : undefined))
        return
      }
      if (path === '/groups/toggle') {
        const layer = body['layer']
        if (layer !== 'global' && layer !== 'project' && layer !== 'session') {
          send(res, 400, { error: 'invalid layer' })
          return
        }
        if (typeof body['name'] !== 'string' || body['name'] === '') throw new Error('name required')
        if (typeof body['on'] !== 'boolean') throw new Error('on must be boolean')
        const scope: { layer: LayerName; sessionId?: string; folder?: string } = { layer }
        if (typeof body['sessionId'] === 'string') scope.sessionId = body['sessionId']
        if (typeof body['folder'] === 'string') scope.folder = body['folder']
        // A group is a master switch: carrying it to the members is what makes
        // "open the group" mean "everything under it works", instead of leaving
        // the children on their own older values while the parent claims on.
        // The scope lives in the body, never in the URL: reading it from the
        // query made the reply a GLOBAL snapshot, so the panel briefly rendered
        // every other group with the global values and then snapped back.
        const scopeQuery = { ...scope, resolved: true }
        const before = groupsPayload(hub, mcp, scopeQuery).groups.find(group => group.name === body['name'])
        if (before === undefined) throw new Error('no such group')
        hub.toggleBundle({ ...scope, id: groupGateId(before.name), on: body['on'] })
        for (const member of before.skills) hub.toggleBundle({ ...scope, id: member.id, on: body['on'] })
        if (mcp !== undefined) {
          for (const member of before.servers) mcp.mutate(scope, member.name, body['on'])
        }
        invalidate()
        send(res, 200, groupsPayload(hub, mcp, scopeQuery))
        return
      }
      if (path === '/bundles/toggle') {
        const layer = body['layer']
        if (layer !== 'global' && layer !== 'project' && layer !== 'session') {
          send(res, 400, { error: 'invalid layer' })
          return
        }
        if (typeof body['id'] !== 'string' || body['id'] === '') throw new Error('id required')
        if (!/^(?:plugin|bundle):[^:]+(?::[^:]+)?$/u.test(body['id'])) throw new Error('invalid bundle id')
        if (typeof body['on'] !== 'boolean') throw new Error('on must be boolean')
        const toggle: { layer: LayerName; id: string; on: boolean; sessionId?: string; folder?: string } = {
          layer,
          id: body['id'],
          on: body['on'],
        }
        if (typeof body['sessionId'] === 'string') toggle.sessionId = body['sessionId']
        if (typeof body['folder'] === 'string') toggle.folder = body['folder']
        hub.toggleBundle(toggle)
        invalidate()
        send(res, 200, hub.bundleCatalog(bundles?.() ?? [], { layer,
          ...toggle.sessionId !== undefined ? { sessionId: toggle.sessionId } : {},
          ...toggle.folder !== undefined ? { folder: toggle.folder } : {} }))
        return
      }
      if (path === '/toggle') {
        const layer = body['layer']
        if (layer !== 'global' && layer !== 'project' && layer !== 'session') {
          send(res, 400, { error: 'invalid layer' })
          return
        }
        const toggle: {
          layer: 'global' | 'project' | 'session'
          sessionId?: string
          folder?: string
          target: ToggleTarget
        } = { layer, target: toggleTarget(body) }
        if (typeof body['sessionId'] === 'string') toggle.sessionId = body['sessionId']
        if (typeof body['folder'] === 'string') toggle.folder = body['folder']
        hub.toggle(toggle)
        invalidate()
        send(res, 200, clientCatalog(hub.displayedCatalog(layer, toggle.folder, toggle.sessionId)))
        return
      }
      if (path === '/inherit') {
        const layer = body['layer']
        if (layer !== 'global' && layer !== 'project' && layer !== 'session') {
          send(res, 400, { error: 'invalid layer' })
          return
        }
        const request: {
          layer: LayerName
          sessionId?: string
          folder?: string
          target: VisibilityTarget
        } = { layer, target: visibilityTarget(body) }
        if (typeof body['sessionId'] === 'string') request.sessionId = body['sessionId']
        if (typeof body['folder'] === 'string') request.folder = body['folder']
        hub.inherit(request)
        invalidate()
        send(res, 200, clientCatalog(hub.displayedCatalog(layer, request.folder, request.sessionId)))
        return
      }
      if (path === '/reset') {
        if (typeof body['sessionId'] !== 'string') {
          send(res, 400, { error: 'sessionId required' })
          return
        }
        const folder = typeof body['folder'] === 'string' ? body['folder'] : undefined
        hub.resetSession(body['sessionId'], folder)
        invalidate()
        send(res, 200, clientCatalog(hub.displayedCatalog('session', folder, body['sessionId'])))
        return
      }
      if (path === '/install') {
        if (typeof body['sourceDir'] !== 'string' || (body['home'] !== 'agent' && body['home'] !== 'dsh')) {
          send(res, 400, { error: 'sourceDir and home required' })
          return
        }
        const catalog = hub.install(body['sourceDir'], body['home'] as HomeKind)
        invalidate()
        send(res, 200, clientCatalog(catalog))
        return
      }
      send(res, 404, { error: 'not found' })
    } catch (error) {
      // Client-input problems answer 400. Everything else — including a
      // corrupted or unsupported visibility document surfaced by the hub's
      // readDoc/writeDoc paths — is an internal failure and answers 500.
      const message = String(error)
      const client = !/visibility document/i.test(message)
        && /required|invalid|must be|no longer registered|Cannot fully hide/i.test(message)
      send(res, client ? 400 : 500, { error: message })
    }
  }
}
