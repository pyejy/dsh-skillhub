import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

const satisfies = (version, range) => semver.satisfies(version, range, { includePrerelease: false })

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (name) => readFileSync(join(root, name), 'utf8')

test('declares dsh.bundle.patch so add joins the profile layer stack', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.match(read('cordis.patch.yml'), /name:\s*'@aa2246740\/dsh-skillhub'/)
  assert.doesNotMatch(read('cordis.patch.yml'), /name:\s*['"]?\.\//)
})

test('points the Host at committed JS, not TypeScript source', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.main, 'lib/dsh-skillhub.js')
  assert.equal(pkg.exports['.'].default, './lib/dsh-skillhub.js')
  assert.equal(pkg.exports['./client'].default, './lib/client.js')
  assert.equal(pkg.dsh.client.entry, './lib/client.js')
  assert.equal(pkg.scripts.prepare, undefined)
  assert.ok(pkg.files.includes('lib/*.js') || pkg.files.includes('lib/dsh-skillhub.js'))
  assert.ok(pkg.files.includes('cordis.patch.yml'))
})

test('ships a loadable Host entry with named apply / name / inject', () => {
  const host = read('lib/dsh-skillhub.js')
  assert.match(host, /\bexport\b[\s\S]*\bapply\b/)
  assert.match(host, /\bexport\b[\s\S]*\bname\b/)
  assert.match(host, /\bexport\b[\s\S]*\binject\b/)
  assert.match(host, /\[my-plugins\/dsh-skillhub\] loaded/)
  assert.doesNotMatch(host, /from ['"]\.\/.*\.ts['"]/)
})

test('ships the prebuilt web client without machine paths', () => {
  const client = read('lib/client.js')
  assert.match(client, /dsh-skillhub/)
  assert.match(client, /__ModuleLoader__/)
  assert.doesNotMatch(client, /(?:^|[\s"'`=(])(?:\/(?:Users|home|opt|var|tmp|private|agent)\/|[A-Za-z]:\\)/)
})

test('peer range accepts Harness 0.2.2 prereleases under npm and dsh runtime semantics', () => {
  const pkg = JSON.parse(read('package.json'))
  const range = '>=0.2.1-rc.1 <0.3.0-0 || >=0.2.2-rc.1 <0.3.0-0'
  const runtimeSatisfies = (version, subject) => semver.satisfies(version, subject, { includePrerelease: true })
  const peers = Object.entries(pkg.peerDependencies).filter(([name]) => name.startsWith('@deepseek-ai/dsh-'))
  assert.ok(peers.length >= 11)
  for (const [name, declared] of peers) {
    assert.equal(declared, range, name)
    assert.equal(pkg.devDependencies[name], range, name)
    // npm decides peers with strict semver: a prerelease range must name 0.2.2 itself.
    assert.equal(satisfies('0.2.1-rc.5', range), true, name)
    assert.equal(satisfies('0.2.1', range), true, name)
    assert.equal(satisfies('0.2.2-rc.2', range), true, name)
    assert.equal(satisfies('0.2.2', range), true, name)
    assert.equal(satisfies('0.2.0-rc.2', range), false, name)
    assert.equal(satisfies('0.2.0', range), false, name)
    assert.equal(satisfies('0.2.0-alpha', range), false, name)
    assert.equal(satisfies('0.2.1-alpha.1', range), false, name)
    assert.equal(satisfies('0.1.7-rc.2', range), false, name)
    assert.equal(satisfies('0.3.0-rc.1', range), false, name)
    // dsh-app-boot evaluates engines.dsh with includePrerelease.
    assert.equal(runtimeSatisfies('0.2.2-rc.2', range), true, name)
    assert.equal(runtimeSatisfies('0.3.0-rc.1', range), false, name)
  }
  assert.equal(JSON.stringify(pkg).includes('0.1.5-rc'), false)
  assert.equal(JSON.stringify(pkg).includes('0.1.7-rc'), false)
  assert.equal(JSON.stringify(pkg).includes('0.2.0-alpha'), false)
  assert.equal(pkg.version, '1.1.0')
  assert.equal(pkg.engines.dsh, range)
  assert.equal(runtimeSatisfies('0.2.2-rc.2', pkg.engines.dsh), true)
})

test('documents the official web install one-liner', () => {
  const readme = read('README.md')
  const lead = readme.slice(0, 600)
  assert.match(readme, /dsh plugin --profile web add @aa2246740\/dsh-skillhub@1\.1\.0/)
  assert.match(readme, /github:aa2246740\/dsh-skillhub#v1\.1\.0/)
  assert.doesNotMatch(readme, /@aa2246740\/dsh-skillhub@1\.0\.10|dsh-skillhub#v1\.0\.10/)
  assert.match(lead, /无需 pnpm、本地构建或 DSHX/)
  assert.doesNotMatch(readme, /dshx plugin|my-plugins|activate-new-client/)
})

test('pnpm pack stages the stock bundle files', () => {
  const packed = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['pack', '--dry-run'], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(packed.status, 0, packed.stderr || packed.stdout)
  const listing = `${packed.stdout}\n${packed.stderr}`
  assert.match(listing, /lib\/dsh-skillhub\.js/)
  assert.match(listing, /lib\/client\.js/)
  assert.match(listing, /cordis\.patch\.yml/)
})
