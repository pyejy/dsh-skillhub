import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button, IconChevronRightOutlineRegular, IconPluginPinwheelOutlineRegular, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { BundleCatalog, BundlePluginView, BundleSkillView, LayerName } from './catalog-api.ts'
import { fetchBundles, postBundleToggle } from './catalog-api.ts'
import type { SkillHubKey } from './locales.ts'
import { GateSwitch, gateWord, notifyCatalogChanged, skillCountLabel, useCatalogRefresh } from './SkillHubPanel.tsx'
import { refreshSkillAutocomplete } from './slash-refresh.ts'
import css from './SkillHubPanel.module.css'

type Copy = Translate<SkillHubKey>
export interface PluginPanelProps {
  layer: LayerName
  sessionId?: string | undefined
  folder?: string | undefined
  layerReady: boolean
  onPluginCountChange?: ((count: number) => void) | undefined
  t: Copy
}

/**
 * Package layer of the manager: one row per installed package that ships
 * skills, one row per shipped skill underneath. A skill is only as live as its
 * package, so an off package renders its skills closed and inert without
 * touching the value stored for each skill.
 */
export function PluginPanel(props: PluginPanelProps) {
  const { t, layer, sessionId, folder, layerReady } = props
  const [catalog, setCatalog] = useState<BundleCatalog>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const pending = useRef(false)
  const generation = useRef(0)
  const inFlight = useRef(0)
  const onCountRef = useRef(props.onPluginCountChange)
  onCountRef.current = props.onPluginCountChange
  const key = JSON.stringify([layer, sessionId, folder])
  const activeKey = useRef(key)
  activeKey.current = key

  const load = useCallback(async () => {
    const current = ++generation.current
    inFlight.current += 1
    setRefreshing(true)
    try {
      const next = await fetchBundles({ layer, ...(sessionId ? { sessionId } : {}), ...(folder ? { folder } : {}) })
      if (key === activeKey.current && current === generation.current) {
        setCatalog(next)
        setError(undefined)
      }
    } catch (caught) {
      if (key === activeKey.current && current === generation.current) setError(String(caught))
    } finally {
      inFlight.current -= 1
      if (inFlight.current === 0) setRefreshing(false)
    }
  }, [key, layer, sessionId, folder])
  // Keep the previous list mounted while the new scope's read is in flight, so
  // switching 本对话/本项目/全局 does not flash a skeleton.
  useEffect(() => { setError(undefined); void load() }, [load])
  useCatalogRefresh(load)
  useEffect(() => { if (catalog !== undefined) onCountRef.current?.(catalog.plugins.length) }, [catalog])

  const update = async (id: string, on: boolean) => {
    if (pending.current || !layerReady) return
    pending.current = true
    ++generation.current
    setBusy(true)
    setError(undefined)
    try {
      const next = await postBundleToggle(
        { layer, ...(sessionId ? { sessionId } : {}), ...(folder ? { folder } : {}) }, id, on)
      if (key === activeKey.current) setCatalog(next)
      notifyCatalogChanged(layer)
      // Packages own the skills behind / autocomplete, so its list moved too.
      try { await refreshSkillAutocomplete() } catch (caught) {
        console.warn('[skillhub] Saved plugin gate but autocomplete refresh failed:', caught)
      }
    } catch (caught) {
      if (key === activeKey.current) setError(String(caught))
    } finally { pending.current = false; setBusy(false) }
  }
  const toggleOpen = (name: string) => setExpanded(current => ({ ...current, [name]: !(current[name] ?? false) }))
  const disabled = !layerReady || busy

  return (
    <div className={css.pluginBody} data-ud-check="skillhub-plugins-body" aria-busy={busy || refreshing}>
      {error !== undefined ? <div className={css.bannerRow}>
        <p className={css.error} role="alert">{t('error.load', { error })}</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>{t('error.retry')}</Button>
      </div> : null}
      {catalog === undefined && error === undefined ? <div className={css.skeleton} aria-label={t('loading')}>
        <div className={css.skel} /><div className={css.skel} /><div className={css.skel} />
      </div> : null}
      {catalog !== undefined && catalog.plugins.length === 0 ? <div className={css.emptyCard} data-ud-check="skillhub-plugins-empty">
        <div className={css.emptyIcon}><IconPluginPinwheelOutlineRegular size={28} /></div>
        <h3 className={css.emptyTitle}>{t('plugins.empty.title')}</h3>
        <p className={css.emptyDesc}>{t('plugins.empty.desc')}</p>
      </div> : null}
      {catalog !== undefined && catalog.plugins.length > 0 ? <div className={css.pluginList}>
        {catalog.plugins.map(plugin => <PluginRow key={plugin.name} plugin={plugin} t={t}
          open={expanded[plugin.name] ?? false} disabled={disabled} onOpen={() => toggleOpen(plugin.name)}
          onToggle={(id, on) => void update(id, on)} />)}
      </div> : null}
    </div>
  )
}

/** Package row plus, when expanded, the skills it ships. */
function PluginRow(props: {
  plugin: BundlePluginView; open: boolean; disabled: boolean; t: Copy
  onOpen: () => void; onToggle: (id: string, on: boolean) => void
}) {
  const { plugin, t, open, disabled } = props
  // An off package locks every row underneath it; the reason is stated once.
  const locked = plugin.gate === 'off'
  return <div className={css.plugin}>
    <div className={css.row} style={{ '--depth': '0' } as CSSProperties} data-folder="">
      <button type="button" className={css.chevron} aria-expanded={open}
        aria-label={t(open ? 'collapse' : 'expand', { name: plugin.name })} onClick={props.onOpen}>
        <IconChevronRightOutlineRegular size={14} />
      </button>
      <div className={css.cell}>
        <button type="button" className={css.nameBtn} title={plugin.root} onClick={props.onOpen}>
          <span className={css.name}>
            <span className={css.nameText}>{plugin.name}</span>
            <Tag tone="quiet">{skillCountLabel(t, plugin.skills.length)}</Tag>
          </span>
        </button>
      </div>
      <div className={css.actions}><GateSwitch gate={plugin.gate}
        label={t('switch.plugin', { name: plugin.name, state: gateWord(t, plugin.gate) })}
        disabled={disabled} onChange={on => props.onToggle(`plugin:${plugin.name}`, on)} /></div>
    </div>
    {open ? <>
      {locked ? <p className={css.lockedHint}>{t('plugins.locked')}</p> : null}
      {plugin.skills.map(skill => <PluginSkillRow key={skill.id} skill={skill} t={t}
        disabled={disabled} onToggle={on => props.onToggle(skill.id, on)} />)}
    </> : null}
  </div>
}

function PluginSkillRow(props: { skill: BundleSkillView; disabled: boolean; t: Copy; onToggle: (on: boolean) => void }) {
  const { skill, t } = props
  // Locked rows draw the resolved value and never post: the stored gate stays
  // untouched, so reopening the package restores the skill's own setting.
  const inert = props.disabled || skill.locked
  return <div className={css.row} data-leaf="" data-locked={skill.locked ? '' : undefined}
    style={{ '--depth': '1' } as CSSProperties}>
    <span className={css.chevronGhost} />
    <div className={css.cell}><div className={css.name}>
      <span className={css.nameText}>{skill.name}</span>
    </div></div>
    <div className={css.actions}><GateSwitch gate={skill.effective}
      label={t('switch.skill', { name: skill.name, state: gateWord(t, skill.effective) })}
      disabled={inert} onChange={on => { if (!skill.locked) props.onToggle(on) }} /></div>
  </div>
}
