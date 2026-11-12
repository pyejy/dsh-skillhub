// Local production build for both halves of @aa2246740/dsh-skillhub.
//
// The published pipeline uses the DSHX external-plugin builder (`tsdown.config.ts`),
// which needs a DeepSeek Harness checkout. This script produces the same two
// artifacts — the Host ESM bundle and the browser `__ModuleLoader__` bundle —
// with esbuild plus the CSS-module compiler this repo already depends on, so the
// plugin can be rebuilt and installed from a working copy alone.
//
//   node scripts/build-local.mjs          # both halves
//   node scripts/build-local.mjs host     # lib/dsh-skillhub.js
//   node scripts/build-local.mjs client   # lib/client.js
import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const target = process.argv[2] ?? 'all'

const HOST_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-host-webserver',
  '@deepseek-ai/dsh-scope',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-skill',
  '@deepseek-ai/schemastery',
]

const CLIENT_EXTERNALS = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  '@deepseek-ai/dsh-client-ui-primitives',
]

/** CSS modules compiled the way the published bundle carries them: a style tag plus a class map. */
const cssModules = {
  name: 'dsh-css-modules',
  setup(context) {
    context.onLoad({ filter: /\.module\.css$/ }, async (args) => {
      const source = await readFile(args.path, 'utf8')
      const { code, exports } = transform({
        filename: args.path,
        code: Buffer.from(source),
        cssModules: { pattern: '[hash]_[local]' },
      })
      // lightningcss reports { local: { name, composes, isReferenced } }.
      const classes = Object.fromEntries(Object.entries(exports ?? {}).map(([local, value]) => [
        local,
        typeof value === 'string' ? value : value.name,
      ]))
      const tagId = `${manifest.name}/${basename(args.path)}`
      const contents = `
const css = ${JSON.stringify(code.toString('utf8'))};
const tagId = ${JSON.stringify(tagId)};
if (typeof document !== 'undefined'
  && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
  const tag = document.createElement('style');
  tag.dataset.plugin = ${JSON.stringify(manifest.name)};
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
export default ${JSON.stringify(classes)};
`
      return { contents, loader: 'js', resolveDir: dirname(args.path) }
    })
  },
}

async function buildHost() {
  const result = await build({
    entryPoints: [join(root, 'src/dsh-skillhub.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    charset: 'utf8',
    legalComments: 'none',
    logLevel: 'warning',
    external: [...HOST_EXTERNALS, 'node:*'],
  })
  const code = result.outputFiles[0].text
  await writeFile(join(root, 'lib/dsh-skillhub.js'), code, 'utf8')
  console.log(`host  → lib/dsh-skillhub.js (${code.length} bytes)`)
}

async function buildClient() {
  const result = await build({
    entryPoints: [join(root, 'src/client/index.tsx')],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    charset: 'utf8',
    legalComments: 'none',
    logLevel: 'warning',
    external: CLIENT_EXTERNALS,
    plugins: [cssModules],
  })
  const body = result.outputFiles[0].text
  const wrapped = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(manifest.name)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
${body}
\t\treturn module.exports;
\t}
});
`
  if (/(?:^|[\s"'`=(])(?:\/(?:Users|home|opt|var|tmp|private|agent)\/|[A-Za-z]:\\)/u.test(wrapped)) {
    throw new Error('client.js contains a non-portable absolute path')
  }
  await writeFile(join(root, 'lib/client.js'), wrapped, 'utf8')
  console.log(`client → lib/client.js (${wrapped.length} bytes)`)
}

if (target === 'host' || target === 'all') await buildHost()
if (target === 'client' || target === 'all') await buildClient()
