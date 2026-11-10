#!/usr/bin/env node
// Run a built guide's audit from the command line, with no browser window.
//   node scripts/audit_headless.mjs "<guide folder>" [--json out.json] [--max-kinks N] [--html "<name>.html"] [--timeout 180]
// It serves the folder on a local port, opens the guide with ?audit=1 in headless Edge or Chrome, and reads the result
// the guide leaves in the page (src/guide.js, the AUDIT block at the end; the checks themselves are tools/audit.js).
// Needs internet (the guide loads three.js from jsDelivr). Paths may be absolute: no need to cd anywhere.
//
// FAIL (exit 1) when: a wire passes through a solid; a wire crosses a device it does not land on; two conductors share
// a line in a clamp; a point is behind the plate; a segment was not drawn; an end names a device or terminal the guide
// does not have; or tight bends exceed --max-kinks (default 0). Exit 2 when the page did not load or threw.
// Also printed, not failed on: openings not found on the model, device boxes that overlap, runs in the open.
// --json writes everything, including every device's position and every wire's route (for shot.mjs --view and
// diff_routes.mjs). The example guide has two known tight bends: run it with --max-kinks 2.
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { findBrowser, pickHtml, serve, headless, preText } from './lib/browser.mjs'

const args = process.argv.slice(2)
const VAL = new Set(['--json', '--max-kinks', '--html', '--timeout'])
const dir = resolve(args.find((a, i) => !a.startsWith('--') && !VAL.has(args[i - 1])) ?? '.')
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const maxKinks = Number(opt('--max-kinks', 0)), timeout = Number(opt('--timeout', 180)) * 1000, jsonOut = opt('--json', null)
const exe = findBrowser(), html = await pickHtml(dir, opt('--html', null))
const { server, base } = await serve(dir)
const url = `${base}${encodeURIComponent(html)}?audit=1`
let dom = '', err = ''
for (let attempt = 1; attempt <= 2; attempt++) {
  const r = await headless(exe, ['--virtual-time-budget=120000', '--dump-dom'], url, timeout)
  dom = r.out; err = r.err
  if (preText(dom, 'g-audit') || preText(dom, 'g-error')) break
  if (attempt === 1) console.error('no result from the browser on the first try; trying once more')
}
server.close()
const pageError = preText(dom, 'g-error'), raw = preText(dom, 'g-audit')
if (pageError) { console.error(`THE GUIDE DID NOT LOAD: a script error in the page.\n${pageError}\n\nFix the source and rebuild. (Usual causes after changing data: a device, rail or step the engine looks up by name is gone; see references/engine-map.md.)`); process.exit(2) }
if (!raw) {
  console.error(`the guide did not report an audit result and showed no script error.\n- Was "${html}" built from a src/guide.js that has the AUDIT block and a build.mjs with the error handler (both are in the skill's example)?\n- Is this machine online? The guide loads three.js from cdn.jsdelivr.net.\n- Browser output: ${err.trim().split('\n').slice(-6).join('\n  ') || '(none)'}`)
  process.exit(2)
}
const r = JSON.parse(raw)
if (r.error) { console.error('the audit itself failed inside the page:\n' + r.error); process.exit(2) }
if (jsonOut) { await mkdir(dirname(resolve(jsonOut)), { recursive: true }); await writeFile(resolve(jsonOut), JSON.stringify(r, null, 1)) }
const s = r.summary, unresolved = r.unresolved ?? []
console.log(`guide V${r.version} ("${html}"): ${r.segments} segments, ${r.drawn} drawn, ${r.deviceCount} devices, ${s.ends} conductor ends`)
console.log(`through a solid: ${s.through}   across another device: ${s.over}   shared line in a clamp: ${s.shared}   tight bends: ${s.kinks}   behind the plate: ${s.behind}`)
for (const x of r.through) console.log(`  THROUGH   ${x.wire} is inside ${x.dev} for ${x.mm} mm${x.own ? ' (a device it lands on)' : ''}`)
for (const x of r.over) console.log(`  ACROSS    ${x.wire} crosses ${x.dev} for ${x.mm} mm`)
for (const x of r.shared) console.log(`  SHARED    ${x.dev} ${x.pin}: ${x.wires.join(', ')}`)
for (const x of r.kinks) console.log(`  BEND      ${x.wire}: radius ${x.r_mm} mm on a ${x.od_mm} mm wire`)
for (const x of r.behind) console.log(`  BEHIND    ${x.wire} at ${x.at.join(', ')}`)
if (r.notDrawn.length) console.log(`  NOT DRAWN ${r.notDrawn.join(', ')}`)
if (unresolved.length) console.log(`  UNRESOLVED (no such device or terminal; drawn as a field tail, or not at all): ${unresolved.join('; ')}`)
const nf = {}; for (const x of r.notFound ?? []) nf[x.dev] = (nf[x.dev] ?? 0) + 1
console.log(`for information: openings not found on the model ${s.notFound}${s.notFound ? ` (${Object.entries(nf).map(([d, n]) => `${d} ${n}`).join(', ')})` : ''}; device boxes overlapping ${s.overlap}${s.overlap ? ` (${r.overlap.map((o) => `${o.a}/${o.b}`).join(', ')})` : ''}; runs in the open ${s.loose}`)
const bad = s.through + s.over + s.shared + s.behind + r.notDrawn.length + unresolved.length + Math.max(0, s.kinks - maxKinks)
console.log(bad ? 'AUDIT: FAIL' : `AUDIT: PASS${s.kinks ? ` (with ${s.kinks} tight bend${s.kinks > 1 ? 's' : ''} allowed by --max-kinks ${maxKinks}: name them in the handover)` : ''}`)
process.exit(bad ? 1 : 0)
