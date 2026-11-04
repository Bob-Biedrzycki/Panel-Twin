#!/usr/bin/env node
// Makes panel-twin.html one self-contained file:
//   - pastes panel-model.mjs (the shared solver) between <!-- panel-model:start --> and <!-- panel-model:end -->
//   - pastes the Machine Skill kit between <!-- lab-kit:start --> and <!-- lab-kit:end -->
//   - writes the Modbus map in README.md between <!-- modbus-map:start --> and <!-- modbus-map:end -->
//   node build.mjs [--kit <path to lab-kit.js>]     (default: ~/.claude/skills/machine/kit/lab-kit.js)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
const modelBlock = `<!-- panel-model:start -->\n<script>\n// generated from panel-model.mjs by build.mjs: edit that file, then run node build.mjs\nwindow.PanelModel = (() => {\n${model.replace(/<\/script/gi, '<\\/script')}\nreturn { P, TAGS, VALVES, CB4_LOADS, ALARM_IDS, BAD, createPanel, snapshot, writeTag }\n})()\n</script>\n<!-- panel-model:end -->`
html = html.replace(/<!-- panel-model:start -->[\s\S]*?<!-- panel-model:end -->/, () => modelBlock)

if (existsSync(kitPath)) {
  const kit = readFileSync(kitPath, 'utf8')
  html = html.replace(/<!-- lab-kit:start -->[\s\S]*?<!-- lab-kit:end -->/, () => `<!-- lab-kit:start -->\n<script type="module">\n${kit.replace(/<\/script/gi, '<\\/script')}\n</script>\n<!-- lab-kit:end -->`)
} else console.warn(`kit not found at ${kitPath}: left the kit block as it was`)
writeFileSync(page, html)
console.log(`built ${page}`)

// the Modbus map, generated from TAGS so it never drifts from the model
const { TAGS, ALARM_IDS } = await import(pathToFileURL(join(here, 'panel-model.mjs')).href)
const kindName = { ir: 'IR (FC4)', di: 'DI (FC2)', hr: 'HR (FC3/6/16)', co: 'Coil (FC1/5/15)' }
const rows = ['ir', 'di', 'hr', 'co'].flatMap((k) => TAGS.filter((t) => t.kind === k).map((t) => `| ${kindName[k]} | ${t.addr} | ${t.name} | ${k === 'ir' || k === 'hr' ? t.scale ?? 1 : ''} | ${t.unit ?? ''} | ${t.desc} |`))
const map = `<!-- modbus-map:start -->\n| Type | Addr | Tag | Scale | Unit | What |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\nAlarm words (IR \`VFD200.Alarm.Word0\` and \`Word1\`), bit 0 first: ${ALARM_IDS.map((id, i) => `${i}&nbsp;${id}`).join(', ')}.\n<!-- modbus-map:end -->`
const readme = join(here, 'README.md')
if (existsSync(readme)) {
  const r = readFileSync(readme, 'utf8')
  if (r.includes('<!-- modbus-map:start -->')) { writeFileSync(readme, r.replace(/<!-- modbus-map:start -->[\s\S]*?<!-- modbus-map:end -->/, () => map)); console.log('updated the Modbus map in README.md') }
}
