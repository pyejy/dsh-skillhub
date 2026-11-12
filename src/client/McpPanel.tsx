import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, IconCordisPluginOutlineRegular, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { LayerName } from './catalog-api.ts'
import type { SkillHubKey } from './locales.ts'
import { GateSwitch, gateWord, notifyCatalogChanged, useCatalogRefresh, type SkillHubSurface } from './SkillHubPanel.tsx'
import css from './SkillHubPanel.module.css'

type Catalog = { servers: { name: string; tools: number; gate: 'on' | 'off'; source: LayerName; supported: boolean }[] }
export interface McpBulkActions { allOn: () => void; allOff: () => void; disabled: boolean }
export interface McpPanelProps {
  surface: SkillHubSurface
  layer: LayerName
  sessionId?: string | undefined
  folder?: string | undefined
  canWriteSession: boolean
  canWriteProject: boolean
  layerReady: boolean
  /**
   * Servers closed by an off group, mapped to the group name. Those rows draw
   * the closed state and never post: the group owns the lock, the server keeps
   * its stored gate.
   */
  lockedServers?: ReadonlyMap<string, string> | undefined
  onServerCountChange?: ((count: number) => void) | undefined
  onBulkActions?: ((actions: McpBulkActions | undefined) => void) | undefined
  t: Translate<SkillHubKey>
}

export function McpPanel(props: McpPanelProps) {
  const { t, layer, sessionId, folder, layerReady } = props
  const [catalog, setCatalog] = useState<Catalog>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const pending = useRef(false)
  const generation = useRef(0)
  const inFlight = useRef(0)
  const tRef = useRef(t)
  tRef.current = t
  const onCountRef = useRef(props.onServerCountChange)
  onCountRef.current = props.onServerCountChange
  const query = { layer, ...(sessionId ? { sessionId } : {}), ...(folder ? { folder } : {}) }
  const key = JSON.stringify(query)
  const activeKey = useRef(key)
  activeKey.current = key

  const request = useCallback(async (path: string, body?: object, signal?: AbortSignal) => {
    const response = await fetch(`/skillhub/mcp/${path}`, body === undefined
      ? { ...(signal ? { signal } : {}) }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(tRef.current('mcp.unavailable'))
    const data = await response.json() as Catalog & { error?: string }
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
    if (!Array.isArray(data.servers)) throw new Error(tRef.current('mcp.unavailable'))
    return data
  }, [])
  const load = useCallback(() => {
    const current = ++generation.current
    const controller = new AbortController()
    inFlight.current += 1
    setRefreshing(true)
    const done = () => {
      inFlight.current -= 1
      if (inFlight.current === 0) setRefreshing(false)
    }
    void request(`catalog?${new URLSearchParams(JSON.parse(key) as Record<string, string>)}`, undefined, controller.signal)
      .then(data => {
        if (key === activeKey.current && current === generation.current) {
          setCatalog(data)
          onCountRef.current?.(data.servers.length)
          setError(undefined)
        }
      }).catch((caught: Error) => {
        if (!controller.signal.aborted && key === activeKey.current && current === generation.current) setError(caught.message)
      }).finally(done)
    return () => controller.abort()
  }, [key, request])
  // Keep the previous catalog mounted while the new layer's read is in flight:
  // clearing it here was what made switching layers flash a skeleton.
  useEffect(() => { setError(undefined); return load() }, [load])
  useCatalogRefresh(load)

  const update = async (servers: readonly string[], on: boolean) => {
    if (pending.current || !layerReady) return
    pending.current = true
    ++generation.current
    setBusy(true)
    setError(undefined)
    try {
      let latest: Catalog | undefined
      for (const server of servers) latest = await request('toggle', { ...query, server, on })
      if (latest && key === activeKey.current) {
        setCatalog(latest)
        onCountRef.current?.(latest.servers.length)
      }
    } catch (caught) {
      if (key === activeKey.current) setError(String(caught))
    } finally {
      pending.current = false
      setBusy(false)
      // Even a partially completed bulk write must refresh the other surfaces.
      notifyCatalogChanged(layer)
    }
  }
  const bulkActions = useMemo<McpBulkActions | undefined>(() => {
    if (!catalog?.servers.length) return undefined
    // A server locked by a group is not ours to write: bulk must skip it, or it
    // would overwrite the value the server is meant to keep.
    const writable = catalog.servers.filter(server => !(props.lockedServers?.has(server.name) ?? false))
    const names = writable.filter(server => server.supported || server.gate === 'off').map(server => server.name)
    return {
      allOn: () => void update(writable.map(server => server.name), true),
      allOff: () => void update(names, false),
      disabled: !layerReady || busy || writable.length === 0,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, key, layerReady, busy, props.lockedServers])
  useEffect(() => {
    props.onBulkActions?.(bulkActions)
    return () => props.onBulkActions?.(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkActions])

  return (
    <div className={css.mcpBody} data-ud-check="skillhub-mcp-body" aria-busy={busy || refreshing}>
      {error !== undefined ? <div className={css.bannerRow}>
        <p className={css.error} role="alert">{error}</p>
        <Button variant="outline" size="sm" onClick={() => load()}>{t('error.retry')}</Button>
      </div> : null}
      {catalog === undefined && error === undefined ? <div className={css.skeleton} aria-label={t('loading')}>
        <div className={css.skel} /><div className={css.skel} /><div className={css.skel} />
      </div> : null}
      {catalog !== undefined && catalog.servers.length === 0 ? <div className={css.emptyCard} data-ud-check="skillhub-mcp-empty">
        <div className={css.emptyIcon}><IconCordisPluginOutlineRegular size={28} /></div>
        <h3 className={css.emptyTitle}>{t('mcp.empty.title')}</h3>
        <p className={css.emptyDesc}>{t('mcp.empty.desc')}</p>
      </div> : null}
      {catalog !== undefined && catalog.servers.length > 0 ? <div className={css.mcpList}>
        {catalog.servers.map(server => {
          const lockedBy = props.lockedServers?.get(server.name)
          // A locked row shows the closed state and stays inert: the group owns
          // the lock and the server keeps its own stored gate.
          const gate = lockedBy === undefined ? server.gate : 'off'
          return <div key={server.name} className={css.row} data-leaf=""
            data-locked={lockedBy === undefined ? undefined : ''}
            title={lockedBy === undefined ? undefined : t('groups.lockedBy', { name: lockedBy })}>
            <span className={css.chevronGhost} />
            <div className={css.cell}><div className={css.name}>
              <span className={css.nameText}>{server.name}</span>
              <Tag tone="quiet">{t('mcp.tools', { n: server.tools })}</Tag>
              {!server.supported ? <Tag tone="warning">{t('mcp.unsupported')}</Tag> : null}
            </div></div>
            <div className={css.actions}><GateSwitch
              gate={gate}
              label={t('switch.mcp', { name: server.name, state: gateWord(t, gate) })}
              disabled={!layerReady || busy || lockedBy !== undefined || (!server.supported && server.gate === 'on')}
              onChange={on => { if (lockedBy === undefined) void update([server.name], on) }}
            /></div>
          </div>
        })}
      </div> : null}
    </div>
  )
}
