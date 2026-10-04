// node scripts/build.mjs: the package build, src/index.lil -> dist/to-jsx-runtime.js (one build serves every condition:
//   nothing in it differs between browsers and the rest).
// node scripts/build.mjs --dev: the test-only entries (markdown -> React through this layer, the style parser, and
//   markdown -> hast columns for the package test) into .dev/.
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
const compiler = process.env.LILSCRIPT_COMPILER ?? '/home/azureuser/lilscript-work/lil2/lilscript-lazyfn'
if (!existsSync(compiler)) throw new Error('Set LILSCRIPT_COMPILER to the pinned LilScript compiler')
const run = (cwd, config, out, mode) => {
  const start = process.hrtime.bigint()
  execFileSync(compiler, ['--config', config, '--target', 'js-module', '--mode', mode, '--out-dir', out, '--cache', 'off', '--jobs', '1'], {cwd, stdio: ['ignore', 'ignore', 'inherit']})
  console.error(`built ${config} in ${(Number(process.hrtime.bigint() - start) / 1e9).toFixed(2)} s`)
}
if (process.argv.includes('--dev')) {
  for (const [config, out] of [['render.toml', 'render'], ['style.toml', 'style'], ['columns.toml', 'columns']]) run('test/support', config, `../../.dev/${out}`, 'development')
} else {
  run('.', 'lilscript.toml', '.', 'production')
}
