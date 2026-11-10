#!/usr/bin/env node
// Compare two versions of a guide wire by wire: did anything move that was not meant to?
//   node scripts/audit_headless.mjs "<last version>" --json before.json
//   node scripts/audit_headless.mjs "<new version>"  --json after.json
//   node scripts/diff_routes.mjs before.json after.json [--tol 0.05]
// Segments are matched by id (their place in the list). For each it compares the ends, whether it is drawn, the ducts
// it runs in, its length and 21 points along it (mm). It prints every segment that is new, gone or changed, then a
// one-line summary. Exit 0 always: a difference is information, and it is for you to say whether it was intended.
// This is the answer to "make sure nothing else broke" after a small change. It does not replace looking at the
// devices you did change.
import { readFile } from 'node:fs/promises'

const [a, b] = process.argv.slice(2).filter((x) => !x.startsWith('--'))
if (!a || !b) { console.error('usage: node scripts/diff_routes.mjs before.json after.json [--tol 0.05]'); process.exit(2) }
const ti = process.argv.indexOf('--tol'), tol = ti > 0 ? Number(process.argv[ti + 1]) : 0.05
const A = JSON.parse(await readFile(a, 'utf8')), B = JSON.parse(await readFile(b, 'utf8'))
if (!A.routes || !B.routes) { console.error('no "routes" in one of the files: make them with scripts/audit_headless.mjs --json from a guide built with the skill\'s engine'); process.exit(2) }
const name = (r) => `${r.id} ${r.label || '(no number)'} ${r.from} -> ${r.to}`
const mapA = new Map(A.routes.map((r) => [r.id, r])), mapB = new Map(B.routes.map((r) => [r.id, r]))
let same = 0, changed = 0, added = 0, gone = 0
for (const r of B.routes) {
  const o = mapA.get(r.id)
  if (!o) { added++; console.log(`NEW      ${name(r)}: ${r.drawn ? `drawn, ${r.len} mm, ducts ${r.ducts.join(' > ') || 'none'}` : r.notFitted ? 'not fitted' : 'NOT DRAWN'}, step ${r.step}`); continue }
  const why = []
  if (o.from !== r.from || o.to !== r.to) why.push(`ends were ${o.from} -> ${o.to}`)
  if (o.label !== r.label) why.push(`number was "${o.label}"`)
  if (o.drawn !== r.drawn) why.push(o.drawn ? 'was drawn, now is not' : 'was not drawn, now is')
  if (o.step !== r.step) why.push(`step was ${o.step}`)
  if (o.ducts.join() !== r.ducts.join()) why.push(`ducts were ${o.ducts.join(' > ') || 'none'}`)
  if (o.len !== null && r.len !== null && Math.abs(o.len - r.len) > tol) why.push(`length ${o.len} -> ${r.len} mm`)
  let far = 0
  for (let i = 0; i < Math.min(o.pts.length, r.pts.length); i++) far = Math.max(far, Math.hypot(o.pts[i][0] - r.pts[i][0], o.pts[i][1] - r.pts[i][1], o.pts[i][2] - r.pts[i][2]))
  if (far > tol) why.push(`moved by up to ${far.toFixed(1)} mm`)
  if (why.length) { changed++; console.log(`CHANGED  ${name(r)}: ${why.join('; ')}`) } else same++
}
for (const o of A.routes) if (!mapB.has(o.id)) { gone++; console.log(`GONE     ${name(o)}`) }
console.log(`V${A.version} -> V${B.version}: ${A.routes.length} segments before, ${B.routes.length} after; ${same} identical, ${changed} changed, ${added} new, ${gone} gone`)
const d = (k) => `${A.summary[k]} -> ${B.summary[k]}`
console.log(`audit counts: through ${d('through')}, across ${d('over')}, shared ${d('shared')}, tight bends ${d('kinks')}, behind ${d('behind')}, not found ${d('notFound')}, in the open ${d('loose')}, ends ${d('ends')}`)
