import { McpPanel, type McpBulkActions } from './McpPanel.tsx'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Button, IconChevronRightOutlineRegular, IconCordisPluginOutlineRegular, IconEllipsisOutlineRegular,
  IconPluginPinwheelOutlineRegular, IconSearchOutlineRegular, IconSkillOutlineRegular,
  IconWarningOutlineRegular, Input, Menu, Pill, Tag, Toast, Tooltip, writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { PluginPanel } from './PluginPanel.tsx'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { CatalogNode, CatalogPayload, Gate, GroupChild, GroupGate, HomeKind, LayerName, SkillRef } from './catalog-api.ts'
import { fetchCatalog, postCatalog } from './catalog-api.ts'
import type { SkillHubKey } from './locales.ts'
import css from './SkillHubPanel.module.css'
import { refreshSkillAutocomplete } from './slash-refresh.ts'

export type SkillHubSurface = 'page' | 'popover'
type Copy = Translate<SkillHubKey>
type Node = CatalogNode | GroupChild
export function layerLabel(t: Copy, layer: LayerName): string {
  return t(layer === 'session' ? 'layer.session' : layer === 'project' ? 'layer.project' : 'layer.global')
}
export function gateWord(t: Copy, gate: Gate | GroupGate): string {
  return t(gate === 'on' ? 'gate.on' : gate === 'off' ? 'gate.off' : 'gate.mixed')
}
const CHANGED_EVENT = 'dsh-skillhub:changed'
export function notifyCatalogChanged(layer: LayerName): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<LayerName>(CHANGED_EVENT, { detail: layer }))
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANGED_EVENT)
    channel.postMessage(layer)
    channel.close()
  }
}
/** Keep mounted panels current, including other tabs and focused windows. */
export function useCatalogRefresh(reload: () => void | (() => void) | Promise<void>): void {
  const latest = useRef(reload)
  latest.current = reload
  useEffect(() => {
    let cleanup: (() => void) | undefined
    const changed = () => {
      cleanup?.()
      const next = latest.current()
      cleanup = typeof next === 'function' ? next : undefined
    }
    const visible = () => { if (document.visibilityState === 'visible') changed() }
    const channel = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(CHANGED_EVENT)
    if (channel) channel.onmessage = changed
    window.addEventListener(CHANGED_EVENT, changed)
    window.addEventListener('focus', visible)
    document.addEventListener('visibilitychange', visible)
    return () => {
      channel?.close()
      window.removeEventListener(CHANGED_EVENT, changed)
      window.removeEventListener('focus', visible)
      document.removeEventListener('visibilitychange', visible)
      cleanup?.()
    }
  }, [])
}
function brokenCopy(t: Copy, reason: { kind: string; target?: string }): string {
  if (reason.kind === 'missing-symlink-target') return reason.target === undefined ? t('broken.missing') : t('broken.missingNamed', { target: reason.target })
  if (reason.kind === 'empty-pack') return t('broken.empty')
  if (reason.kind === 'invalid-name') return t('broken.name')
  if (reason.kind === 'unreadable-skill') return t('broken.unreadable')
  if (reason.kind === 'invalid-frontmatter') return t('broken.frontmatter')
  if (reason.kind === 'symlink-cycle') return t('broken.cycle')
  return reason.kind
}
function homeLabel(t: Copy, home: HomeKind): string { return t(home === 'agent' ? 'home.agent' : 'home.dsh') }
function collectSkills(nodes: readonly Node[]): SkillRef[] {
  return nodes.flatMap(node => {
    if (node.kind === 'broken') return []
    if (node.kind === 'root-skill') return [node]
    return [...(node.skill ? [node.skill] : []), ...collectSkills(node.children)]
  })
}
function collectSkillIds(nodes: readonly Node[]): string[] { return collectSkills(nodes).map(skill => skill.id) }
function countSkills(nodes: readonly Node[]): { on: number; off: number } {
  const skills = collectSkills(nodes)
  const on = skills.filter(skill => skill.gate === 'on').length
  return { on, off: skills.length - on }
}
function gateFromCounts(counts: { on: number; off: number }): GroupGate {
  return counts.on > 0 && counts.off > 0 ? 'mixed' : counts.on > 0 ? 'on' : 'off'
}
export function skillCountLabel(t: Copy, total: number): string { return t(total === 1 ? 'count.skillsOne' : 'count.skills', { n: total }) }
function folderChildren(node: Node): GroupChild[] {
  if (node.kind === 'broken' || node.kind === 'root-skill') return []
  return node.children.filter(child => child.kind === 'broken' || collectSkillIds([child]).length > 0)
}
function soleSkill(node: Node): SkillRef | null {
  if (node.kind === 'broken') return null
  if (node.kind === 'root-skill') return node
  return node.skill !== null && folderChildren(node).length === 0 ? node.skill : null
}
function packPrefix(name: string): string | undefined {
  const split = name.indexOf('-')
  return split < 2 ? undefined : name.slice(0, split)
}
function clusterFlatPacks(nodes: readonly CatalogNode[]): CatalogNode[] {
  type Member = Extract<CatalogNode, { kind: 'pack' | 'broken' }>
  const existing = new Set(nodes.map(node => node.name))
  const counts = new Map<string, number>()
  for (const node of nodes) {
    if (node.kind !== 'pack' && node.kind !== 'broken') continue
    const prefix = packPrefix(node.name)
    if (prefix !== undefined && !existing.has(prefix)) counts.set(prefix, (counts.get(prefix) ?? 0) + 1)
  }
  const buckets = new Map<string, Member[]>()
  const out: Array<CatalogNode | { kind: 'cluster'; prefix: string }> = []
  for (const node of nodes) {
    const prefix = packPrefix(node.name)
    if ((node.kind !== 'pack' && node.kind !== 'broken') || prefix === undefined || (counts.get(prefix) ?? 0) < 3) {
      out.push(node)
      continue
    }
    const list = buckets.get(prefix)
    if (list) list.push(node)
    else { buckets.set(prefix, [node]); out.push({ kind: 'cluster', prefix }) }
  }
  const result: CatalogNode[] = []
  for (const node of out) {
    if (node.kind !== 'cluster') { result.push(node); continue }
    const members = buckets.get(node.prefix)
    const first = members?.[0]
    if (!members || !first) continue
    const children = members.map(member => {
      const name = member.name.slice(node.prefix.length + 1)
      if (member.kind === 'broken') return { ...member, name }
      return { kind: 'group' as const, name, rel: member.name, home: member.home,
        path: member.path, gate: member.gate, skill: member.skill, children: member.children }
    })
    result.push({ kind: 'pack', id: `${first.home}:${node.prefix}`, name: node.prefix, home: first.home,
      path: first.path, link: { kind: 'directory' }, gate: gateFromCounts(countSkills(members)), skill: null, children })
  }
  return result
}
function nodeMatches(node: Node, needle: string): boolean {
  const text = node.kind === 'broken' ? `${node.name} ${node.reason.kind}`
    : node.kind === 'root-skill' ? `${node.name} ${node.description ?? ''}`
      : `${node.name} ${node.skill?.name ?? ''} ${node.skill?.description ?? ''}`
  return text.toLowerCase().includes(needle)
    || (node.kind !== 'broken' && node.kind !== 'root-skill' && node.children.some(child => nodeMatches(child, needle)))
}
export function GateSwitch(props: { gate: Gate | GroupGate; label: string; disabled: boolean; onChange: (on: boolean) => void }) {
  return <button type="button" className={css.switch} role="switch"
    aria-checked={props.gate === 'mixed' ? 'mixed' : props.gate === 'on'}
    aria-label={props.label} data-state={props.gate} disabled={props.disabled}
    onClick={() => props.onChange(props.gate !== 'on')}><span className={css.thumb} /></button>
}
type Toggle = (ids: readonly string[], on: boolean) => void
function SkillLeaf(props: { depth: number; skill: SkillRef; label: string; disabled: boolean; t: Copy; onToggle: Toggle }) {
  const { skill, t } = props
  const [copied, setCopied] = useState(false)
  const copySlash = () => {
    void writeClipboard(`/${skill.name} `).then(ok => {
      if (ok) { setCopied(true); window.setTimeout(() => setCopied(false), 1500) }
    })
  }
  const name = <span className={css.nameText}>{props.label}</span>
  return <div className={css.row} data-leaf="" style={{ '--depth': String(props.depth) } as CSSProperties}>
    <span className={css.chevronGhost} />
    <div className={css.cell}><div className={css.name}>
      {skill.description ? <Tooltip label={skill.description} side="top" maxWidth={320}>{name}</Tooltip> : name}
      {skill.collision ? <Tag tone="warning">{t('badge.collision')}</Tag> : null}
    </div></div>
    <div className={css.actions}>
      <Tooltip label={copied ? t('copy.done') : t('copy.slash', { name: skill.name })} side="top">
        <button type="button" className={css.slash} aria-label={t('copy.slash', { name: skill.name })}
          data-copied={copied ? '' : undefined} onClick={copySlash}>/{skill.name}</button>
      </Tooltip>
      <GateSwitch gate={skill.gate} label={t('switch.skill', { name: props.label, state: gateWord(t, skill.gate) })}
        disabled={props.disabled} onChange={on => props.onToggle([skill.id], on)} />
    </div>
  </div>
}

export function SkillHubPanel(props: {
  sessionId?: string; folder?: string; defaultLayer: LayerName; layers: readonly LayerName[]; surface: SkillHubSurface; t: Copy
}) {
  const { sessionId, t } = props
  const folder = props.folder ?? ''
  const [layer, setLayer] = useState<LayerName>(props.defaultLayer)
  const [catalog, setCatalog] = useState<CatalogPayload>()
  const [error, setError] = useState<string>()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState<{ key: SkillHubKey; seq: number }>()
  const [tab, setTab] = useState<'skills' | 'mcp' | 'plugins'>('skills')
  const [mcpServerCount, setMcpServerCount] = useState<number>()
  const [pluginCount, setPluginCount] = useState<number>()
  const [mcpBulk, setMcpBulk] = useState<McpBulkActions>()
  const [moreOpen, setMoreOpen] = useState(false)
  const pending = useRef(false)
  const generation = useRef(0)
  const inFlight = useRef(0)
  const noticeSeq = useRef(0)
  const key = JSON.stringify([layer, folder, sessionId])
  const activeKey = useRef(key)
  activeKey.current = key
  const canWriteSession = !!sessionId
  const canWriteProject = folder !== ''
  const layerReady = layer === 'global' || (layer === 'session' && canWriteSession) || (layer === 'project' && canWriteProject)
  const load = useCallback(async () => {
    const current = ++generation.current
    inFlight.current += 1
    setRefreshing(true)
    try {
      const next = await fetchCatalog(sessionId, folder === '' ? undefined : folder, layer)
      if (key === activeKey.current && current === generation.current) { setCatalog(next); setError(undefined) }
    } catch (caught) {
      if (key === activeKey.current && current === generation.current) setError(String(caught))
    } finally {
      inFlight.current -= 1
      if (inFlight.current === 0) setRefreshing(false)
    }
  }, [key, sessionId, folder, layer])
  // Keep the previous catalog mounted while the new layer's read is in flight:
  // clearing it here was what made switching 本对话/本项目/全局 flash.
  useEffect(() => { setError(undefined); void load() }, [load])
  useCatalogRefresh(load)
  const mutate = async (target: Record<string, unknown>, on: boolean) => {
    if (pending.current || !layerReady) return
    pending.current = true
    ++generation.current
    setBusy(true)
    setError(undefined)
    try {
      const next = await postCatalog('/toggle', { layer, ...target, ...(sessionId ? { sessionId } : {}), ...(folder ? { folder } : {}) })
      if (key === activeKey.current) {
        setCatalog(next)
      }
      notifyCatalogChanged(layer)
      let refreshed = true
      try { await refreshSkillAutocomplete() } catch (caught) {
        refreshed = false
        console.warn('[skillhub] Saved skills but autocomplete refresh failed:', caught)
      }
      if (key === activeKey.current) {
        noticeSeq.current += 1
        setNotice({ key: refreshed ? (on ? 'refresh.hintOn' : 'refresh.hintOff') : 'refresh.partial', seq: noticeSeq.current })
      }
    } catch (caught) {
      if (key === activeKey.current) setError(String(caught))
    } finally { pending.current = false; setBusy(false) }
  }
  const toggleIds: Toggle = (ids, on) => { if (ids.length) void mutate({ kind: 'ids', ids, on }, on) }
  const needle = query.trim().toLowerCase()
  const counts = useMemo(() => catalog ? countSkills(catalog.tree.flatMap(home => home.children)) : { on: 0, off: 0 }, [catalog])
  const allSkillCount = counts.on + counts.off
  const canBulk = layerReady && !busy && catalog !== undefined && allSkillCount > 0
  // Packages have no bulk action yet: keep the shared menu honest on that tab.
  const moreDisabled = tab === 'mcp' ? mcpBulk === undefined || mcpBulk.disabled
    : tab === 'plugins' ? true
      : !canBulk
  const moreItems = [
    { id: 'allOn', label: t('allOn'), disabled: moreDisabled },
    { id: 'allOff', label: t('allOff'), disabled: moreDisabled },
    ...(tab !== 'mcp' ? [{ id: 'refreshSlash', label: t('refresh.slash'), disabled: busy }] : []),
  ]
  const refreshSlash = async () => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    let refreshed = true
    try { await refreshSkillAutocomplete() } catch (caught) {
      refreshed = false
      console.warn('[skillhub] Autocomplete refresh failed:', caught)
    } finally { pending.current = false; setBusy(false) }
    if (key === activeKey.current) {
      noticeSeq.current += 1
      setNotice({ key: refreshed ? 'refresh.done' : 'refresh.failed', seq: noticeSeq.current })
    }
  }
  const onMoreSelect = (id: string) => {
    setMoreOpen(false)
    if (id === 'refreshSlash') { void refreshSlash(); return }
    if (id !== 'allOn' && id !== 'allOff') return
    if (tab === 'mcp') { if (id === 'allOn') mcpBulk?.allOn(); else mcpBulk?.allOff() }
    else void mutate({ kind: 'all', on: id === 'allOn' }, id === 'allOn')
  }
  return <div className={css.root} data-surface={props.surface} data-skillhub-panel="" aria-busy={busy || refreshing}>
    <div className={css.toolbar}>
      <div className={css.tabs} role="tablist" aria-label={t('tab.aria')}>
        <Pill role="tab" aria-selected={tab === 'skills'} active={tab === 'skills'} onClick={() => setTab('skills')}>
          <IconSkillOutlineRegular size={13} /><span>{t('tab.skills')}</span>
          {allSkillCount > 0 ? <span className={css.pillCount}>{allSkillCount}</span> : null}
        </Pill>
        <Pill role="tab" aria-selected={tab === 'mcp'} active={tab === 'mcp'} onClick={() => setTab('mcp')}>
          <IconCordisPluginOutlineRegular size={13} /><span>{t('tab.mcp')}</span>
          {mcpServerCount !== undefined && mcpServerCount > 0 ? <span className={css.pillCount}>{mcpServerCount}</span> : null}
        </Pill>
        <Pill role="tab" aria-selected={tab === 'plugins'} active={tab === 'plugins'} onClick={() => setTab('plugins')}>
          <IconPluginPinwheelOutlineRegular size={13} /><span>{t('tab.plugins')}</span>
          {pluginCount !== undefined && pluginCount > 0 ? <span className={css.pillCount}>{pluginCount}</span> : null}
        </Pill>
      </div>
      <div className={css.toolbarEnd}>
        {props.layers.length > 1 ? <div className={css.segment} role="radiogroup" aria-label={t('layer.aria')}>
          {props.layers.map(name => <button key={name} type="button" role="radio" aria-checked={layer === name}
            data-active={layer === name ? '' : undefined}
            disabled={busy || (name === 'session' && !canWriteSession) || (name === 'project' && !canWriteProject)}
            onClick={() => setLayer(name)}>{layerLabel(t, name)}</button>)}
        </div> : null}
        <Menu open={moreOpen} onClose={() => setMoreOpen(false)} onSelect={onMoreSelect} items={moreItems} align="end" compact portal
          anchor={<Button variant="ghost" size="sm" icon={<IconEllipsisOutlineRegular size={16} />} aria-label={t('more')} title={t('more')}
            onClick={() => setMoreOpen(value => !value)} />} />
      </div>
    </div>
    {tab === 'mcp' ? <McpPanel surface={props.surface} layer={layer} sessionId={sessionId} folder={folder}
      canWriteSession={canWriteSession} canWriteProject={canWriteProject} layerReady={layerReady}
      onServerCountChange={setMcpServerCount} onBulkActions={setMcpBulk} t={t} />
      : tab === 'plugins' ? <PluginPanel layer={layer} sessionId={sessionId} folder={folder}
        layerReady={layerReady} onPluginCountChange={setPluginCount} t={t} /> : <>
      <label className={css.search}><Input className={css.field ?? ''} icon={<IconSearchOutlineRegular size={16} />}
        value={query} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')}
        onChange={event => setQuery(event.currentTarget.value)} /></label>
      <div className={css.body} data-ud-check="skillhub-tree" data-ud-role="panel">
        {error !== undefined ? <div className={css.bannerRow}>
          <p className={css.error} role="alert">{t('error.load', { error })}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>{t('error.retry')}</Button>
        </div> : null}
        {catalog && catalog.collisions.length > 0 ? <p className={css.warn} role="status">
          {t('collision.warn')} {catalog.collisions.map(row => row.name).join(', ')}
        </p> : null}
        {catalog === undefined && error === undefined ? <div className={css.skeleton} aria-label={t('loading')}>
          <div className={css.skel} /><div className={css.skel} /><div className={css.skel} />
        </div> : null}
        {catalog !== undefined && allSkillCount === 0 && needle === '' ? <div className={css.emptyCard} data-ud-check="skillhub-skills-empty">
          <div className={css.emptyIcon}><IconSkillOutlineRegular size={28} /></div>
          <h4 className={css.emptyTitle}>{t('skills.empty.title')}</h4><p className={css.emptyDesc}>{t('skills.empty.desc')}</p>
        </div> : null}
        {catalog !== undefined && (allSkillCount > 0 || needle !== '') ? catalog.tree.map(home => {
          const children = clusterFlatPacks(home.children).filter(node => needle === '' || nodeMatches(node, needle))
          const hideHomeChrome = props.surface === 'popover' && catalog.tree.filter(row => row.children.length > 0).length <= 1
          const homeKey = `home:${home.home}`
          const homeOpen = hideHomeChrome || needle !== '' || (expanded[homeKey] ?? true)
          const homeCounts = countSkills(home.children)
          const homeIds = collectSkillIds(home.children)
          const label = homeLabel(t, home.home)
          const toggleOpen = () => setExpanded(current => ({ ...current, [homeKey]: !(current[homeKey] ?? true) }))
          const tree = children.length === 0 ? <p className={css.empty}>{t(needle === '' ? 'empty.home' : 'empty.search')}</p>
            : children.map(node => <TreeNode key={node.kind === 'root-skill' ? node.id : node.path} node={node}
              depth={hideHomeChrome ? 0 : 1} needle={needle} expanded={expanded} setExpanded={setExpanded}
              disabled={!layerReady || busy} t={t} onToggle={toggleIds} />)
          return <section key={home.home} className={css.home} aria-label={label}>
            {!hideHomeChrome ? <div className={css.row} style={{ '--depth': '0' } as CSSProperties} data-folder="">
              <button type="button" className={css.chevron} aria-expanded={homeOpen}
                aria-label={t(homeOpen ? 'collapse' : 'expand', { name: label })} onClick={toggleOpen}><IconChevronRightOutlineRegular size={14} /></button>
              <div className={css.cell}><button type="button" className={css.nameBtn} title={home.path} onClick={toggleOpen}>
                <span className={css.name}><span className={css.nameText}>{label}</span>
                  {homeIds.length > 1 ? <Tag tone="quiet">{skillCountLabel(t, homeIds.length)}</Tag> : null}
                </span>
              </button></div>
              <div className={css.actions}><GateSwitch gate={gateFromCounts(homeCounts)}
                label={t('switch.folder', { name: label, state: gateWord(t, gateFromCounts(homeCounts)) })}
                disabled={!layerReady || busy || homeIds.length === 0} onChange={on => toggleIds(homeIds, on)} /></div>
            </div> : null}
            {homeOpen ? tree : null}
          </section>
        }) : null}
      </div>
      {notice ? <Toast key={notice.seq} text={t(notice.key)} onDone={() => setNotice(current => current?.seq === notice.seq ? undefined : current)} /> : null}
    </>}
  </div>
}
function TreeNode(props: {
  node: Node; depth: number; needle: string; expanded: Record<string, boolean>
  setExpanded: (next: Record<string, boolean> | ((current: Record<string, boolean>) => Record<string, boolean>)) => void
  disabled: boolean; t: Copy; onToggle: Toggle
}) {
  const { node, t } = props
  const style = { '--depth': String(props.depth) } as CSSProperties
  if (node.kind === 'broken') return <div className={css.row} data-broken="" style={style}>
    <span className={css.chevronGhost} /><div className={css.cell}><div className={css.name}>
      <IconWarningOutlineRegular size={14} /><span className={css.nameText}>{node.name}</span>
      <Tag tone="danger">{brokenCopy(t, node.reason)}</Tag>
    </div></div>
  </div>
  const leaf = soleSkill(node)
  if (leaf) return <SkillLeaf depth={props.depth} skill={leaf} label={node.name} disabled={props.disabled} t={t} onToggle={props.onToggle} />
  if (node.kind === 'root-skill') return null
  const children = folderChildren(node)
  const ids = collectSkillIds([node])
  const key = node.path
  const open = props.needle !== '' || (props.expanded[key] ?? false)
  const toggleOpen = () => props.setExpanded(current => ({ ...current, [key]: !(current[key] ?? false) }))
  return <div>
    <div className={css.row} style={style} data-folder={children.length ? '' : undefined}>
      {children.length ? <button type="button" className={css.chevron} aria-expanded={open}
        aria-label={t(open ? 'collapse' : 'expand', { name: node.name })} onClick={toggleOpen}><IconChevronRightOutlineRegular size={14} /></button>
        : <span className={css.chevronGhost} />}
      <div className={css.cell}><button type="button" className={css.nameBtn} onClick={toggleOpen} disabled={!children.length}>
        <span className={css.name}><span className={css.nameText}>{node.name}</span>
          {ids.length > 1 ? <Tag tone="quiet">{skillCountLabel(t, ids.length)}</Tag> : null}
        </span>
      </button></div>
      <div className={css.actions}><GateSwitch gate={node.gate}
        label={t('switch.folder', { name: node.name, state: gateWord(t, node.gate) })}
        disabled={props.disabled || ids.length === 0} onChange={on => props.onToggle(ids, on)} /></div>
    </div>
    {open ? <>
      {node.skill && children.length ? <SkillLeaf depth={props.depth + 1} skill={node.skill} label={node.skill.name}
        disabled={props.disabled} t={t} onToggle={props.onToggle} /> : null}
      {children.filter(child => props.needle === '' || nodeMatches(child, props.needle)).map(child =>
        <TreeNode key={child.path} {...props} node={child} depth={props.depth + 1} />)}
    </> : null}
  </div>
}
