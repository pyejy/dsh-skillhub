import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import type { SkillSummary } from '@deepseek-ai/dsh-skill'

/** One skill shipped inside an installed package (`skills/*`, `own-skills/*`). */
export interface BundleSkill {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly path: string
  readonly directory: string
  /** Path inside the package, e.g. `skills/guizang-ppt-skill/SKILL.md`. */
  readonly rel: string
}

/** One installed package that contributes skills to the registry. */
export interface BundlePlugin {
  readonly name: string
  readonly root: string
  readonly skills: readonly BundleSkill[]
}

interface BundleDocument {
  readonly version: 1
  readonly plugins: readonly BundlePlugin[]
}

/**
 * Bare package name of a loader row specifier.
 * @param specifier - row module specifier (`@scope/pkg`, `pkg`, `pkg/sub`, a path or a URL).
 * @returns the package name for a package-root row, otherwise undefined.
 */
export function barePackageName(specifier: string): string | undefined {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/')
    return parts.length === 2 && (parts[1] ?? '') !== '' ? specifier : undefined
  }
  return specifier !== '' && !specifier.includes('/') && !specifier.includes(':') ? specifier : undefined
}

/**
 * Keep only packages the loader currently has enabled.
 *
 * A package that is installed but switched off in the plugin manager contributes
 * nothing, so its skills must not be shadowed either — otherwise this plugin
 * would keep serving skills for a disabled package. An unknown set (loader
 * unreachable) filters nothing, which is the pre-existing behaviour.
 * @param plugins - discovered package contributions.
 * @param active - enabled package names, or undefined when the loader state is unknown.
 * @returns the contributions whose package is live.
 */
export function filterActive(
  plugins: readonly BundlePlugin[],
  active: ReadonlySet<string> | undefined,
): BundlePlugin[] {
  if (active === undefined) return [...plugins]
  return plugins.filter(plugin => active.has(plugin.name))
}

/** Skill providers that own the disk homes; their skills are not package contributions. */
const SKILLHUB_PROVIDERS = new Set(['skillhub', 'skillhub-propagation', 'skillhub-bundles'])

/** Where the discovered package skills are cached between Host loads. */
export function bundlesPath(storeDir: string): string {
  return join(storeDir, 'bundles.json')
}

function isBundleSkill(value: unknown): value is BundleSkill {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return typeof row['name'] === 'string' && typeof row['description'] === 'string'
    && typeof row['path'] === 'string' && typeof row['directory'] === 'string' && typeof row['rel'] === 'string'
}

function isBundlePlugin(value: unknown): value is BundlePlugin {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return typeof row['name'] === 'string' && typeof row['root'] === 'string'
    && Array.isArray(row['skills']) && row['skills'].every(isBundleSkill)
}

/** Read the cached package contributions; a corrupt cache is rebuilt, never fatal. */
export function loadBundles(storeDir: string): BundlePlugin[] {
  const path = bundlesPath(storeDir)
  if (!existsSync(path)) return []
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { plugins?: unknown }
    if (!Array.isArray(raw.plugins)) return []
    return raw.plugins.filter(isBundlePlugin).map(plugin => ({ ...plugin, skills: [...plugin.skills] }))
  } catch {
    return []
  }
}

/** Persist the cache atomically; failures only cost a rediscovery next load. */
export function saveBundles(storeDir: string, plugins: readonly BundlePlugin[]): void {
  try {
    mkdirSync(storeDir, { recursive: true })
    const path = bundlesPath(storeDir)
    const temp = `${path}.${randomUUID()}.tmp`
    const document: BundleDocument = { version: 1, plugins }
    writeFileSync(temp, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o600 })
    renameSync(temp, path)
  } catch (error) {
    console.error('[dsh-skillhub] bundle cache write failed', error)
  }
}

/**
 * Owning package of a file inside a profile's `node_modules`.
 * Nested installs (`a/node_modules/b`) resolve to the innermost package.
 * @param path - absolute file path.
 * @returns package name and root, or undefined when the path is not package-owned.
 */
export function packageOf(path: string): { name: string; root: string } | undefined {
  const marker = `${sep}node_modules${sep}`
  const at = path.lastIndexOf(marker)
  if (at < 0) return undefined
  const rest = path.slice(at + marker.length).split(sep).filter(part => part !== '')
  const first = rest[0]
  if (first === undefined) return undefined
  const segments = first.startsWith('@') && rest[1] !== undefined ? [first, rest[1]] : [first]
  if (segments.length === 0) return undefined
  return {
    name: segments.join('/'),
    root: `${path.slice(0, at)}${marker}${segments.join(sep)}`,
  }
}

/** Skill roots a package may ship; the same two names the packaged providers use. */
const SKILL_ROOTS = ['skills', 'own-skills'] as const

function frontmatter(text: string): Record<string, string> {
  const match = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text)
  if (match === null || match[1] === undefined) return {}
  const fields: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+)[ \t]*:[ \t]*(.*)$/.exec(line)
    if (pair === null || pair[1] === undefined || pair[2] === undefined) continue
    fields[pair[1]] = pair[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return fields
}

/**
 * Skills a package ships on disk. Used when the registry does not report a path
 * (for example a provider that loads its catalog only on demand).
 * @param root - package root.
 * @returns discovered skills, ignoring unreadable entries.
 */
export function scanPackage(root: string): BundleSkill[] {
  const found: BundleSkill[] = []
  for (const home of SKILL_ROOTS) {
    const base = join(root, home)
    if (!existsSync(base)) continue
    let entries
    try {
      entries = readdirSync(base, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
      const directory = join(base, entry.name)
      const path = join(directory, 'SKILL.md')
      if (!existsSync(path)) continue
      let text: string
      try {
        text = readFileSync(path, 'utf8')
      } catch {
        continue
      }
      const fields = frontmatter(text)
      const name = fields['name'] ?? entry.name
      const description = fields['description'] ?? ''
      found.push({
        name,
        description,
        ...fields['whenToUse'] !== undefined ? { whenToUse: fields['whenToUse'] } : {},
        path,
        directory,
        rel: relative(root, path).split(sep).join('/'),
      })
    }
  }
  return found
}

function mergeSkills(known: readonly BundleSkill[], scanned: readonly BundleSkill[]): BundleSkill[] {
  const byPath = new Map<string, BundleSkill>()
  for (const skill of known) byPath.set(skill.path, skill)
  for (const skill of scanned) byPath.set(skill.path, skill)
  return [...byPath.values()].sort((left, right) => left.name.localeCompare(right.name))
}

function fromListing(summaries: readonly SkillSummary[]): Map<string, BundleSkill[]> {
  const byPlugin = new Map<string, BundleSkill[]>()
  for (const summary of summaries) {
    if (SKILLHUB_PROVIDERS.has(summary.provider)) continue
    const path = summary.path
    if (path === undefined || !path.endsWith('SKILL.md')) continue
    const owner = packageOf(path)
    if (owner === undefined) continue
    const list = byPlugin.get(owner.root) ?? []
    list.push({
      name: summary.name,
      description: summary.description,
      ...summary.whenToUse !== undefined ? { whenToUse: summary.whenToUse } : {},
      path,
      directory: dirname(path),
      rel: relative(owner.root, path).split(sep).join('/'),
    })
    byPlugin.set(owner.root, list)
  }
  return byPlugin
}

/**
 * Refresh the package-contribution cache from the live registry.
 *
 * The registry reports the *winning* provider for each name, and this plugin's
 * own provider outranks packaged ones, so the listing is only trusted for names
 * this plugin does not shadow yet; the cache keeps everything learned earlier.
 * Every known root is also rescanned so a package that adds a skill updates
 * without waiting for a registry round-trip.
 *
 * @param skills - the Host skill registry.
 * @param storeDir - SkillHub store directory holding the cache.
 * @returns the refreshed plugin list, also written to the cache.
 */
export async function discoverBundles(
  skills: { list(options?: object): Promise<SkillSummary[]> },
  storeDir: string,
): Promise<BundlePlugin[]> {
  const known = loadBundles(storeDir)
  const byRoot = new Map<string, { name: string; root: string; skills: BundleSkill[] }>()
  for (const plugin of known) {
    byRoot.set(plugin.root, { name: plugin.name, root: plugin.root, skills: [...plugin.skills] })
  }
  let summaries: readonly SkillSummary[] = []
  try {
    summaries = await skills.list({})
  } catch (error) {
    console.error('[dsh-skillhub] bundle discovery failed', error)
  }
  for (const [root, found] of fromListing(summaries)) {
    const owner = packageOf(found[0]?.path ?? '')
    if (owner === undefined) continue
    const existing = byRoot.get(root)
    byRoot.set(root, {
      name: existing?.name ?? owner.name,
      root,
      skills: mergeSkills(existing?.skills ?? [], found),
    })
  }
  const plugins: BundlePlugin[] = []
  for (const plugin of byRoot.values()) {
    const scanned = scanPackage(plugin.root)
    const skills = mergeSkills(plugin.skills, scanned)
    if (skills.length === 0) continue
    plugins.push({ name: plugin.name, root: plugin.root, skills })
  }
  plugins.sort((left, right) => left.name.localeCompare(right.name))
  saveBundles(storeDir, plugins)
  return plugins
}

/** Read the instruction body of one package skill. */
export function readBundleSkill(path: string): string | undefined {
  try {
    const content = readFileSync(path, 'utf8')
    const split = content.startsWith('---') ? content.indexOf('\n---', 3) : -1
    return split >= 0 ? content.slice(split + 4).replace(/^\r?\n/, '') : content
  } catch {
    return undefined
  }
}
