import { useState, type CSSProperties } from 'react'
import {
  Button, IconChevronRightOutlineRegular, IconWorkspaceTreeOutlineRegular, Tag,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { GroupCatalog, GroupServerView, GroupSkillView, GroupView } from './catalog-api.ts'
import type { SkillHubKey } from './locales.ts'
import { GateSwitch, gateWord, skillCountLabel } from './SkillHubPanel.tsx'
import css from './SkillHubPanel.module.css'

type Copy = Translate<SkillHubKey>

export interface GroupPanelProps {
  layerReady: boolean
  /** Latest `/skillhub/groups` snapshot; owned by the panel so locks stay one source of truth. */
  catalog: GroupCatalog | undefined
  error: string | undefined
  /** Catalogue read/write error: a member switch posts through the same routes. */
  catalogError: string | undefined
  busy: boolean
  refreshing: boolean
  onRetry: () => void
  onToggleGroup: (name: string, on: boolean) => void
  onToggleSkill: (id: string, on: boolean) => void
  onToggleServer: (name: string, on: boolean) => void
  t: Copy
}

function groupKindLabel(t: Copy, kind: GroupView['kind']): string {
  return t(kind === 'capability' ? 'groups.kind.capability' : 'groups.kind.family')
}

/** `6 个技能` or `1 个技能 · 1 个 MCP`: what the group holds, on one line. */
function groupSummary(t: Copy, group: GroupView): string {
  const skills = skillCountLabel(t, group.skills.length)
  return group.servers.length === 0
    ? skills
    : `${skills} · ${t('groups.mcpCount', { n: group.servers.length })}`
}

/**
 * Composition layer of the manager: one row per capability (`abaqus` skill plus
 * the `abaqus` MCP server) or per skill family (`ponytail-*`), one row per
 * member underneath.
 *
 * A group is a view with a gate of its own. Closing it locks every member row —
 * they render the closed state and never post, so reopening the group restores
 * exactly the value each member was left at.
 */
export function GroupPanel(props: GroupPanelProps) {
  const { t, catalog } = props
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // A failed member write surfaces through the catalogue error; a failed group
  // read/write through `error`. Both deserve the same banner and retry.
  const shownError = props.error ?? props.catalogError
  const disabled = !props.layerReady || props.busy
  const toggleOpen = (name: string) => setExpanded(current => ({ ...current, [name]: !(current[name] ?? false) }))
  return (
    <div className={css.groupBody} data-ud-check="skillhub-groups-body" aria-busy={props.busy || props.refreshing}>
      {shownError !== undefined ? <div className={css.bannerRow}>
        <p className={css.error} role="alert">{t('error.load', { error: shownError })}</p>
        <Button variant="outline" size="sm" onClick={props.onRetry}>{t('error.retry')}</Button>
      </div> : null}
      {catalog === undefined && shownError === undefined ? <div className={css.skeleton} aria-label={t('loading')}>
        <div className={css.skel} /><div className={css.skel} /><div className={css.skel} />
      </div> : null}
      {catalog !== undefined && catalog.groups.length === 0 ? <div className={css.emptyCard} data-ud-check="skillhub-groups-empty">
        <div className={css.emptyIcon}><IconWorkspaceTreeOutlineRegular size={28} /></div>
        <h3 className={css.emptyTitle}>{t('groups.empty.title')}</h3>
        <p className={css.emptyDesc}>{t('groups.empty.desc')}</p>
      </div> : null}
      {catalog !== undefined && catalog.groups.length > 0 ? <div className={css.groupList}>
        {catalog.groups.map(group => <GroupRow key={group.name} group={group} t={t} disabled={disabled}
          open={expanded[group.name] ?? false} onOpen={() => toggleOpen(group.name)}
          onToggleGroup={props.onToggleGroup} onToggleSkill={props.onToggleSkill}
          onToggleServer={props.onToggleServer} />)}
      </div> : null}
    </div>
  )
}

/** Group row plus, when expanded, the skill and MCP rows it holds. */
function GroupRow(props: {
  group: GroupView; open: boolean; disabled: boolean; t: Copy
  onOpen: () => void
  onToggleGroup: (name: string, on: boolean) => void
  onToggleSkill: (id: string, on: boolean) => void
  onToggleServer: (name: string, on: boolean) => void
}) {
  const { group, t, open, disabled } = props
  // An off group states the reason once, above the members it locks.
  const locked = group.gate === 'off'
  return <div className={css.group}>
    <div className={css.row} style={{ '--depth': '0' } as CSSProperties} data-folder="">
      <button type="button" className={css.chevron} aria-expanded={open}
        aria-label={t(open ? 'collapse' : 'expand', { name: group.name })} onClick={props.onOpen}>
        <IconChevronRightOutlineRegular size={14} />
      </button>
      <div className={css.cell}>
        <button type="button" className={css.nameBtn} onClick={props.onOpen}>
          <span className={css.name}>
            <span className={css.nameText}>{group.name}</span>
            <span className={css.groupKind}>{groupKindLabel(t, group.kind)}</span>
            <Tag tone="quiet">{groupSummary(t, group)}</Tag>
          </span>
        </button>
      </div>
      <div className={css.actions}><GateSwitch gate={group.gate}
        label={t('switch.group', { name: group.name, state: gateWord(t, group.gate) })}
        disabled={disabled} onChange={on => props.onToggleGroup(group.name, on)} /></div>
    </div>
    {open ? <>
      {locked ? <p className={css.lockedHint}>{t('groups.locked')}</p> : null}
      {group.skills.map(skill => <GroupSkillRow key={skill.id} skill={skill} group={group.name} t={t}
        disabled={disabled} onToggle={props.onToggleSkill} />)}
      {group.servers.map(server => <GroupServerRow key={server.name} server={server} group={group.name} t={t}
        disabled={disabled} onToggle={props.onToggleServer} />)}
    </> : null}
  </div>
}

function GroupSkillRow(props: {
  skill: GroupSkillView; group: string; disabled: boolean; t: Copy; onToggle: (id: string, on: boolean) => void
}) {
  const { skill, t } = props
  // Locked rows draw the resolved value and never post: the stored gate stays
  // untouched, so reopening the group shows the skill exactly as it was left.
  const inert = props.disabled || skill.locked
  return <div className={css.row} data-leaf="" data-locked={skill.locked ? '' : undefined}
    title={skill.locked ? t('groups.lockedBy', { name: props.group }) : undefined}
    style={{ '--depth': '1' } as CSSProperties}>
    <span className={css.chevronGhost} />
    <div className={css.cell}><div className={css.name}>
      <span className={css.nameText}>{skill.name}</span>
    </div></div>
    <div className={css.actions}><GateSwitch gate={skill.effective}
      label={t('switch.skill', { name: skill.name, state: gateWord(t, skill.effective) })}
      disabled={inert} onChange={on => { if (!skill.locked) props.onToggle(skill.id, on) }} /></div>
  </div>
}

function GroupServerRow(props: {
  server: GroupServerView; group: string; disabled: boolean; t: Copy; onToggle: (name: string, on: boolean) => void
}) {
  const { server, t } = props
  const inert = props.disabled || server.locked
  return <div className={css.row} data-leaf="" data-locked={server.locked ? '' : undefined}
    title={server.locked ? t('groups.lockedBy', { name: props.group }) : undefined}
    style={{ '--depth': '1' } as CSSProperties}>
    <span className={css.chevronGhost} />
    <div className={css.cell}><div className={css.name}>
      <span className={css.nameText}>{server.name}</span>
      <Tag tone="quiet">{t('mcp.tools', { n: server.tools })}</Tag>
    </div></div>
    <div className={css.actions}><GateSwitch gate={server.effective}
      label={t('switch.mcp', { name: server.name, state: gateWord(t, server.effective) })}
      disabled={inert} onChange={on => { if (!server.locked) props.onToggle(server.name, on) }} /></div>
  </div>
}
