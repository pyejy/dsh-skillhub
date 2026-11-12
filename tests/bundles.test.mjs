import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  discoverBundles, loadBundles, packageOf, saveBundles, scanPackage,
} from '../lib/types/bundles.js'
import { SkillHub } from '../lib/types/hub.js'
import { createBundleProvider } from '../lib/types/provider.js'

const FRONTMATTER = (name, description) => `---\nname: ${name}\ndescription: ${description}\n---\n\nBody of ${name}.\n`

/** A throwaway store plus one installed package that ships two skills. */
function fixture() {
  const base = mkdtempSync(join(tmpdir(), 'skillhub-bundles-'))
  const storeDir = join(base, 'store')
  const agentHome = join(base, 'agents/skills')
  const dshHome = join(base, 'dsh/skills')
  for (const path of [storeDir, agentHome, dshHome]) mkdirSync(path, { recursive: true })
  const root = join(base, 'node_modules/fake-plugin')
  for (const name of ['alpha-skill', 'beta-skill']) {
    const directory = join(root, 'skills', name)
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'SKILL.md'), FRONTMATTER(name, `${name} description`))
  }
  const hub = new SkillHub({ storeDir, agentHome, dshHome })
  return { base, storeDir, hub, root, cleanup: () => rmSync(base, { recursive: true, force: true }) }
}

test('package ownership resolves scoped and nested installs', () => {
  assert.deepEqual(
    packageOf('/p/node_modules/dsh-guizang-design/skills/x/SKILL.md'),
    { name: 'dsh-guizang-design', root: '/p/node_modules/dsh-guizang-design' },
  )
  assert.deepEqual(
    packageOf('/p/node_modules/@scope/pkg/skills/x/SKILL.md'),
    { name: '@scope/pkg', root: '/p/node_modules/@scope/pkg' },
  )
  // Nested installs belong to the innermost package.
  assert.equal(packageOf('/p/node_modules/a/node_modules/b/skills/x/SKILL.md').name, 'b')
  assert.equal(packageOf('/p/skills/x/SKILL.md'), undefined)
})

test('scanPackage reads both packaged skill roots', () => {
  const { root, cleanup } = fixture()
  try {
    const skills = scanPackage(root)
    assert.deepEqual(skills.map(skill => skill.name), ['alpha-skill', 'beta-skill'])
    assert.equal(skills[0].rel, 'skills/alpha-skill/SKILL.md')
    assert.match(skills[0].description, /alpha-skill description/)
  } finally {
    cleanup()
  }
})

test('the cache round-trips and survives a corrupt file', () => {
  const { storeDir, root, cleanup } = fixture()
  try {
    const plugin = { name: 'fake-plugin', root, skills: scanPackage(root) }
    saveBundles(storeDir, [plugin])
    assert.deepEqual(loadBundles(storeDir), [plugin])
    writeFileSync(join(storeDir, 'bundles.json'), '{ not json')
    assert.deepEqual(loadBundles(storeDir), [])
  } finally {
    cleanup()
  }
})

test('discovery merges registry paths with a disk rescan and ignores this plugin own providers', async () => {
  const { storeDir, root, cleanup } = fixture()
  try {
    const listing = async () => [{
      name: 'alpha-skill',
      description: 'alpha-skill description',
      provider: 'fake-plugin',
      source: 'bundled',
      invocation: { modelInvocable: true, userInvocable: true },
      path: join(root, 'skills/alpha-skill/SKILL.md'),
    }]
    const plugins = await discoverBundles({ list: listing }, storeDir)
    assert.equal(plugins.length, 1)
    // The rescan adds the sibling the registry never reported.
    assert.deepEqual(plugins[0].skills.map(skill => skill.name), ['alpha-skill', 'beta-skill'])
    assert.equal(loadBundles(storeDir)[0].name, 'fake-plugin')

    // Skills owned by this plugin's own providers never become package contributions,
    // and the cached package keeps contributing.
    const own = async () => [{
      name: 'x',
      description: '',
      provider: 'skillhub',
      source: 'user-dsh',
      invocation: { modelInvocable: true, userInvocable: true },
      path: join(root, 'skills/alpha-skill/SKILL.md'),
    }]
    assert.equal((await discoverBundles({ list: own }, storeDir)).length, 1)
  } finally {
    cleanup()
  }
})

test('a parent plugin gate turns its skills off, locks them and keeps the stored child value', () => {
  const { hub, root, cleanup } = fixture()
  try {
    const plugin = { name: 'fake-plugin', root, skills: scanPackage(root) }
    const before = hub.bundleCatalog([plugin])
    assert.equal(before.plugins[0].gate, 'on')
    assert.equal(before.plugins[0].skills[0].effective, 'on')
    assert.equal(before.plugins[0].skills[0].locked, false)

    // Turn one skill off first: its stored value must survive the parent toggle.
    hub.toggleBundle({ layer: 'global', id: 'bundle:fake-plugin:beta-skill', on: false })
    hub.toggleBundle({ layer: 'global', id: 'plugin:fake-plugin', on: false })

    const after = hub.bundleCatalog([plugin])
    const parent = after.plugins[0]
    assert.equal(parent.gate, 'off')
    const alpha = parent.skills.find(skill => skill.name === 'alpha-skill')
    const beta = parent.skills.find(skill => skill.name === 'beta-skill')
    assert.equal(alpha.effective, 'off')
    assert.equal(alpha.locked, true)
    assert.equal(alpha.gate, 'on', 'the child gate itself is not rewritten')
    assert.equal(beta.gate, 'off', 'the explicit child choice is preserved')

    // Re-enabling the parent restores the previous per-skill choices.
    hub.toggleBundle({ layer: 'global', id: 'plugin:fake-plugin', on: true })
    const restored = hub.bundleCatalog([plugin]).plugins[0]
    assert.equal(restored.gate, 'on')
    assert.equal(restored.skills.find(skill => skill.name === 'alpha-skill').effective, 'on')
    assert.equal(restored.skills.find(skill => skill.name === 'beta-skill').effective, 'off')
    assert.equal(restored.skills.find(skill => skill.name === 'alpha-skill').locked, false)
  } finally {
    cleanup()
  }
})

test('project-scoped plugin gates reach the chat view', () => {
  const { base, hub, root, cleanup } = fixture()
  try {
    mkdirSync(join(base, 'work'), { recursive: true })
    const plugin = { name: 'fake-plugin', root, skills: scanPackage(root) }
    hub.toggleBundle({ layer: 'project', folder: join(base, 'work'), id: 'plugin:fake-plugin', on: false })
    const scoped = hub.bundleCatalog([plugin], { sessionId: 'session-1', folder: join(base, 'work') })
    assert.equal(scoped.plugins[0].gate, 'off')
    assert.equal(scoped.plugins[0].source, 'project')
    assert.equal(scoped.plugins[0].skills[0].locked, true)
    // A different project keeps the global default.
    const other = hub.bundleCatalog([plugin], { sessionId: 'session-2', folder: join(base, 'elsewhere') })
    assert.equal(other.plugins[0].gate, 'on')
  } finally {
    cleanup()
  }
})

test('the shadow provider outranks packaged skills and carries the gate', async () => {
  const { hub, root, cleanup } = fixture()
  try {
    const plugin = { name: 'fake-plugin', root, skills: scanPackage(root) }
    const provider = createBundleProvider(hub, () => [plugin])
    const on = await provider.list({})
    assert.equal(on.length, 2)
    // Lower than BUNDLED_SKILL_RANK (600): the shadow candidate wins the name.
    assert.ok(on.every(candidate => candidate.rank < 600))
    assert.ok(on.every(candidate => candidate.invocation.modelInvocable))
    const loaded = await provider.get(on[0])
    assert.match(loaded.content, /Body of alpha-skill|Body of beta-skill/)

    hub.toggleBundle({ layer: 'global', id: 'plugin:fake-plugin', on: false })
    const off = await provider.list({})
    assert.equal(off.length, 2, 'a switched-off skill is still shadowed so the packaged copy cannot surface')
    assert.ok(off.every(candidate => candidate.invocation.modelInvocable === false))
    assert.ok(off.every(candidate => candidate.invocation.userInvocable === false))
  } finally {
    cleanup()
  }
})
