#!/usr/bin/env node
// Makes panel-twin.html one self-contained file:
//   - pastes panel-model.mjs (the shared solver) between <!-- panel-model:start --> and <!-- panel-model:end -->
//   - pastes the Machine Skill kit between <!-- lab-kit:start --> and <!-- lab-kit:end -->
//   node build.mjs [--kit <path to lab-kit.js>]     (default: ~/.claude/skills/machine/kit/lab-kit.js)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const a = process.argv.slice(2)
const kitPath = a.includes('--kit') ? a[a.indexOf('--kit') + 1] : join(homedir(), '.claude', 'skills', 'machine', 'kit', 'lab-kit.js')
const page = join(here, 'panel-twin.html')
let html = readFileSync(page, 'utf8')

// the model: strip the ES module syntax, expose it as window.PanelModel (a classic script runs before the modules)
const model = readFileSync(join(here, 'panel-model.mjs'), 'utf8')
  .replace(/^export default .*$/m, '')
  .replace(/^export \{[^}]*\}\s*$/gm, '')
  .replace(/^export (const|function|let)/gm, '$1')
const modelBlock = `<!-- panel-model:start -->\n<script>\n// generated from panel-model.mjs by build.mjs: edit that file, then run node build.mjs\nwindow.PanelModel = (() => {\n${model.replace(/<\/script/gi, '<\\/script')}\nreturn { P, TAGS, ALARM_IDS, createPanel, snapshot, writeTag }\n})()\n</script>\n<!-- panel-model:end -->`
html = html.replace(/<!-- panel-model:start -->[\s\S]*?<!-- panel-model:end -->/, () => modelBlock)

if (existsSync(kitPath)) {
  const kit = readFileSync(kitPath, 'utf8')
  html = html.replace(/<!-- lab-kit:start -->[\s\S]*?<!-- lab-kit:end -->/, () => `<!-- lab-kit:start -->\n<script type="module">\n${kit.replace(/<\/script/gi, '<\\/script')}\n</script>\n<!-- lab-kit:end -->`)
} else console.warn(`kit not found at ${kitPath}: left the kit block as it was`)
writeFileSync(page, html)
console.log(`built ${page}`)
