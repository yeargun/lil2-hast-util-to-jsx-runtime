// node scripts/build.mjs --dev: the test-only render entry (markdown -> React through this layer) into .dev/render/.
// The layer ships inside lil2-react-markdown; it has no package build of its own.
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
const compiler = process.env.LILSCRIPT_COMPILER ?? '/home/azureuser/lilscript-work/remark-fix/lilscript-8ff44f'
if (!existsSync(compiler)) throw new Error('Set LILSCRIPT_COMPILER to the pinned LilScript compiler')
for (const [config, out] of [['render.toml', 'render'], ['style.toml', 'style']])
  execFileSync(compiler, ['--config', config, '--target', 'js-module', '--mode', 'development', '--out-dir', `../../.dev/${out}`, '--cache', 'off', '--jobs', '1'], {cwd: 'test/support', stdio: ['ignore', 'ignore', 'inherit']})
