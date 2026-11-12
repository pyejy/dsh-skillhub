import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const harness = process.env.DSHX_HARNESS
const runtimeEntry = join(homedir(), '.codex', 'playwright-runtime', 'runtime.mjs')
const viewports = [
  { width: 800, height: 500 },
  { width: 1280, height: 800 },
  { width: 800, height: 320 },
  { width: 800, height: 240 },
  { width: 420, height: 500 },
  { width: 360, height: 500 },
  { width: 320, height: 320 },
  { width: 320, height: 240 },
]
const wideEnoughForOneToolbarRow = new Set(['800x500', '1280x800', '800x320', '800x240'])

function expectedDialogHeight(viewport) {
  const list = Math.min(480, viewport.height * 0.6)
  const cap = Math.min(640, viewport.height - 24)
  return Math.min(cap, list + 100)
}

function catalog(count) {
  return {
    offered: [], collisions: [], broken: [], resolved: true, legacySessionSnapshot: false,
    tree: [{
      kind: 'home', home: 'agent', path: '/fixture/skills',
      children: Array.from({ length: count }, (_, index) => ({
        kind: 'root-skill', id: `skill-${index}`,
        name: `Skill ${String(index).padStart(2, '0')}`, home: 'agent', path: `/fixture/skills/${index}`,
        gate: 'on', source: 'global', collision: false,
      })),
    }],
  }
}

function servers(count) {
  return {
    servers: Array.from({ length: count }, (_, index) => ({
      name: `MCP ${index}`, tools: 3, gate: 'on', source: 'global', supported: true,
    })),
  }
}

async function browserEnv() {
  const require = createRequire(join(root, 'package.json'))
  const toolRequire = createRequire(require.resolve('tsdown'))
  const { rolldown } = await import(pathToFileURL(toolRequire.resolve('rolldown')).href)
  const primitives = resolve(harness, 'packages/client/ui-primitives/lib/index.js')
  const primitiveRequire = createRequire(primitives)
  // Harness 0.2.2 removed useAnchoredPosition and added the icons the plugin and
  // group tabs use; the stub must import exactly what the built client requires.
  const names = ['Button', 'IconChevronRightOutlineRegular', 'IconCordisPluginOutlineRegular',
    'IconEllipsisOutlineRegular', 'IconPluginPinwheelOutlineRegular', 'IconSearchOutlineRegular',
    'IconSkillOutlineRegular', 'IconWarningOutlineRegular', 'IconWorkspaceTreeOutlineRegular',
    'Input', 'Menu', 'Pill', 'Tag', 'Toast', 'Tooltip',
    'writeClipboard']
  const entry = join(tmpdir(), 'skillhub-popover-height-entry.mjs')
  const { writeFile } = await import('node:fs/promises')
  await writeFile(entry, `
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as jsx from 'react/jsx-runtime';
import { ${names.join(', ')} } from ${JSON.stringify(primitives)};
const modules = { react: React, 'react-dom': ReactDOM, 'react/jsx-runtime': jsx,
  '@deepseek-ai/dsh-client-ui-primitives': { ${names.join(', ')} } };
const registered = {};
window.__ModuleLoader__ = { load({id, factory}) {
  registered[id] = factory(name => {
    if (!(name in modules)) throw new Error('Unprovided module: ' + name);
    return modules[name];
  });
} };
window.initSkillHub = (surface = 'popover', language = 'en') => {
  const components = {};
  let dictionaries;
  const t = (key, values = {}) => (dictionaries[language][key] || key)
    .replace(/\\{(\\w+)\\}/g, (_, name) => String(values[name] ?? name));
  const ctx = {
    get: name => { if (name === 'loader') return { entries: () => [] }; throw new Error(name); },
    logger: { warn() {} },
    effect: callback => callback(),
    locale: { register: (_ns, value) => { dictionaries = value; }, bind: () => t },
    slots: { inject: (_name, callback) => callback(),
      register: (options, component) => { components[options.name] = component; } }
  };
  registered['@aa2246740/dsh-skillhub'].apply(ctx);
  const Component = components[surface === 'page' ? 'settings.section' : 'conversation.input.left'];
  const props = { t, sessionId: 'layout-session',
    useSessions: selector => selector({ byId: { 'layout-session': { cwd: '/fixture/workspace' } } }) };
  createRoot(document.querySelector('#mount')).render(React.createElement(Component, props));
};
`)
  const shared = Object.fromEntries(['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']
    .map(id => [id, require.resolve(id)]))
  const bundle = await rolldown({
    input: entry,
    platform: 'browser',
    plugins: [{
      name: 'skillhub-layout-fixture',
      resolveId(source, importer) {
        if (source in shared) return shared[source]
        if (source.endsWith('.css')) {
          const file = source.startsWith('.') ? resolve(dirname(importer), source) : primitiveRequire.resolve(source)
          return `\0skillhub-css:${file}.mjs`
        }
        if (importer?.includes('/dsh-client-ui-primitives/lib/index.js') &&
          !source.startsWith('.') && !source.startsWith('/') && !source.startsWith('\0')) {
          return primitiveRequire.resolve(source)
        }
      },
      async load(id) {
        if (!id.startsWith('\0skillhub-css:')) return
        const file = id.slice('\0skillhub-css:'.length, -4)
        const modular = file.endsWith('.module.css')
        const result = transform({ filename: file, code: Buffer.from(await readFile(file)), cssModules: modular })
        const classes = Object.fromEntries(Object.entries(result.exports ?? {}).map(([key, value]) => [key, value.name]))
        return `const style = document.createElement("style"); style.textContent = ${JSON.stringify(result.code.toString())}; document.head.appendChild(style); export default ${JSON.stringify(classes)};`
      },
    }],
  })
  const out = join(tmpdir(), 'skillhub-popover-height-env.js')
  await bundle.write({ file: out, format: 'iife', codeSplitting: false })
  await bundle.close()
  const themeSource = await readFile(resolve(harness, 'packages/client/ui-theme/lib/client.js'), 'utf8')
  const theme = [...themeSource.matchAll(/(?:var|const) ([A-Za-z0-9_$]+_css_default) = ("(?:\\.|[^"\\])*");/g)]
    .map(([, , literal]) => JSON.parse(literal))
    .join('\n')
  if (!theme.includes('--dsw-specific-menu')) throw new Error('theme sheet did not include menu tokens')
  return { env: await readFile(out, 'utf8'), plugin: await readFile(join(root, 'lib/client.js'), 'utf8'), theme }
}

test('popover dialog box stays the same height on Skills and MCP', {
  skip: !harness || !existsSync(runtimeEntry),
  timeout: 180_000,
}, async (t) => {
  const runtime = await import(pathToFileURL(runtimeEntry).href)
  if (!existsSync(runtime.pinnedRuntime.executablePath)) {
    t.skip('pinned Chromium is not installed')
    return
  }
  const built = readFileSync(join(root, 'lib/client.js'), 'utf8')
  assert.match(built, /min\(480px,60vh\) \+ 100px/, 'rebuild lib/client.js before this layout test')
  const { env, plugin, theme } = await browserEnv()
  const browser = await runtime.launchPinnedChromium()
  const failures = []
  const browserErrors = []
  try {
    const checkPopover = async (viewport, scenario, language) => {
      const page = await openFixture(browser, env, plugin, theme, viewport, scenario, 'popover', language, browserErrors)
      try {
        await settle(page, scenario, 'skills', language)
        const skills = await measure(page, 'skills')
        await page.getByRole('tab', { name: 'MCP' }).click()
        await settle(page, scenario, 'mcp', language)
        const mcp = await measure(page, 'mcp')
        await page.getByRole('tab', { name: /Skills|技能/ }).click()
        await settle(page, scenario, 'skills', language)
        const again = await measure(page, 'skills')
        const label = `${language} ${viewport.width}x${viewport.height} ${scenario}`
        const expected = expectedDialogHeight(viewport)
        for (const [name, box] of [['skills', skills], ['mcp', mcp], ['skills-return', again]]) {
          if (Math.abs(box.panel.height - expected) > 1) failures.push(`${label} ${name} dialog ${box.panel.height} != ${expected}`)
          if (!box.visibleTabs || !box.panelInViewport) failures.push(`${label} ${name} header left the viewport ${JSON.stringify(box.panel)}`)
          if (box.scrollers.length > 1) failures.push(`${label} ${name} has ${box.scrollers.length} vertical scrollers`)
          if (box.pageScroll.scrollHeight !== box.pageScroll.clientHeight) failures.push(`${label} ${name} document overflow`)
          if (box.scroll && box.scroll.lastRowVisible === false) failures.push(`${label} ${name} last row is not reachable`)
        }
        if (Math.abs(skills.panel.height - mcp.panel.height) > 0.5) failures.push(`${label} dialog delta ${skills.panel.height - mcp.panel.height}`)
        if (Math.abs(again.panel.height - mcp.panel.height) > 0.5) failures.push(`${label} return dialog delta ${again.panel.height - mcp.panel.height}`)
        if (Math.abs(skills.panel.y - mcp.panel.y) > 0.5) failures.push(`${label} dialog top delta ${skills.panel.y - mcp.panel.y}`)
        const key = `${viewport.width}x${viewport.height}`
        if (wideEnoughForOneToolbarRow.has(key)) {
          const absorbed = mcp.body.height - skills.body.height
          if (Math.abs(absorbed - 40) > 2) failures.push(`${label} MCP list should absorb the 40px search row, absorbed ${absorbed}`)
        }
      } finally {
        await page.close()
      }
    }
    for (const viewport of viewports) {
      for (const scenario of ['uneven', 'both-long', 'empty']) await checkPopover(viewport, scenario, 'en')
    }
    for (const viewport of [viewports[0], viewports[4], viewports[5], viewports[7]]) {
      for (const scenario of ['uneven', 'both-long']) await checkPopover(viewport, scenario, 'zh')
    }
    const popover = await openFixture(browser, env, plugin, theme, viewports[0], 'empty', 'popover', 'en', browserErrors)
    await settle(popover, 'empty', 'skills', 'en')
    const popoverBox = await measure(popover, 'skills')
    await popover.close()
    const page = await openFixture(browser, env, plugin, theme, viewports[0], 'empty', 'page', 'en', browserErrors)
    try {
      await settle(page, 'empty', 'skills', 'en')
      const skills = await measure(page, 'skills')
      await page.getByRole('tab', { name: 'MCP' }).click()
      await settle(page, 'empty', 'mcp', 'en')
      const mcp = await measure(page, 'mcp')
      for (const [name, box] of [['skills', skills], ['mcp', mcp]]) {
        if (box.root.height > popoverBox.panel.height - 50) failures.push(`settings ${name} is not content-sized: ${box.root.height} vs popover ${popoverBox.panel.height}`)
        if (box.body.height > 250) failures.push(`settings ${name} list was forced tall: ${box.body.height}`)
      }
    } finally {
      await page.close()
    }
  } finally {
    await browser.close()
  }
  assert.deepEqual(browserErrors, [])
  assert.deepEqual(failures, [])
})

async function openFixture(browser, env, plugin, theme, viewport, scenario, surface, language, browserErrors) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
  page.on('pageerror', error => browserErrors.push(`${viewport.width}x${viewport.height} ${scenario} ${surface} ${language}: ${error}`))
  await page.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/') return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html data-platform="win32"><head><title>SkillHub layout</title></head><body>
        <div id="mount"></div><script>window.process={env:{NODE_ENV:'production'}};</script></body></html>`,
    })
    if (path.startsWith('/skillhub/mcp/')) return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(servers(scenario === 'empty' ? 0 : scenario === 'both-long' ? 60 : 2)),
    })
    if (path === '/skillhub/catalog') return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(catalog(scenario === 'empty' ? 0 : 60)),
    })
    return route.abort()
  })
  await page.goto('http://skillhub-layout.invalid/')
  await page.addStyleTag({ content: theme })
  await page.addStyleTag({ content: `*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden}
    body{background:#eee;font-family:Arial,sans-serif}
    #mount{position:fixed;left:16px;bottom:16px}
    #mount:has([data-surface=page]){position:fixed;inset:16px;overflow:hidden}
    button,input{font:inherit}` })
  await page.addScriptTag({ content: env })
  await page.addScriptTag({ content: plugin })
  await page.evaluate(({ surface, language }) => window.initSkillHub(surface, language), { surface, language })
  if (surface === 'popover') await page.locator('[data-skillhub-chip] > button').click()
  await page.locator('[data-skillhub-panel]').waitFor()
  return page
}

async function settle(page, scenario, tab, language) {
  const body = page.locator(tab === 'skills' ? '[data-ud-check=skillhub-tree]' : '[data-ud-check=skillhub-mcp-body]')
  await body.waitFor()
  if (scenario === 'empty') await body.locator('[data-ud-check$="-empty"]').waitFor()
  else await body.locator('[role=switch]').first().waitFor()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function measure(page, tab) {
  const box = await page.evaluate(tabName => {
    const root = document.querySelector('[data-skillhub-panel]')
    const panel = document.querySelector('[data-ud-check=skillhub-chip-panel]') ?? root
    const body = document.querySelector(tabName === 'skills' ? '[data-ud-check=skillhub-tree]' : '[data-ud-check=skillhub-mcp-body]')
    const rect = node => {
      const box = node.getBoundingClientRect()
      return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom }
    }
    const scrollers = [...panel.querySelectorAll('*')].filter(node => {
      const style = getComputedStyle(node)
      return /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1
    }).map(node => node.getAttribute('data-ud-check') || node.className)
    const tabs = [...root.querySelectorAll('[role=tab]')].map(node => rect(node))
    const panelBox = rect(panel)
    return {
      panel: panelBox,
      root: rect(root),
      body: rect(body),
      scrollers,
      visibleTabs: tabs.every(row => row.y >= 0 && row.bottom <= innerHeight && row.y >= panelBox.y && row.bottom <= panelBox.bottom),
      panelInViewport: panelBox.y >= -0.5 && panelBox.bottom <= innerHeight + 0.5,
      pageScroll: { scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight },
    }
  }, tab)
  const selector = tab === 'skills' ? '[data-ud-check=skillhub-tree]' : '[data-ud-check=skillhub-mcp-body]'
  box.scroll = await page.evaluate(bodySelector => {
    const node = document.querySelector(bodySelector)
    if (node.scrollHeight <= node.clientHeight + 1) return null
    node.scrollTop = node.scrollHeight
    const switches = node.querySelectorAll('[role=switch]')
    const tail = switches[switches.length - 1]
    return {
      lastRowVisible: tail ? tail.getBoundingClientRect().bottom <= node.getBoundingClientRect().bottom + 1 : null,
    }
  }, selector)
  return box
}
