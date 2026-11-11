// Probe a STEP file: solids, names, colours, triangle counts and bounding boxes (mm).
// Run: node tools/step_probe.mjs <file.stp> [linearDeflectionRatio]
import { readFileSync } from 'node:fs'
import occtimportjs from 'occt-import-js'

const [file, ratio = '0.004'] = process.argv.slice(2)
const occt = await occtimportjs()
const res = occt.ReadStepFile(new Uint8Array(readFileSync(file)), {
  linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio', linearDeflection: Number(ratio), angularDeflection: 0.5,
})
if (!res.success) { console.log('FAILED'); process.exit(1) }
const bb = (m) => { const p = m.attributes.position.array; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[i + k]); hi[k] = Math.max(hi[k], p[i + k]) } return [lo, hi] }
let tri = 0; const all = [[1e9, 1e9, 1e9], [-1e9, -1e9, -1e9]]
const rows = res.meshes.map((m, i) => { const t = m.index.array.length / 3; tri += t; const [lo, hi] = bb(m); for (let k = 0; k < 3; k++) { all[0][k] = Math.min(all[0][k], lo[k]); all[1][k] = Math.max(all[1][k], hi[k]) } return `${i}\t${t}\t${(m.color ?? []).map((c) => c.toFixed(2)).join(',')}\t${m.name ?? ''}\t[${lo.map((v) => v.toFixed(1))}]..[${hi.map((v) => v.toFixed(1))}]` })
console.log(`${res.meshes.length} meshes, ${tri} triangles; bbox [${all[0].map((v) => v.toFixed(1))}]..[${all[1].map((v) => v.toFixed(1))}] size ${all[1].map((v, k) => (v - all[0][k]).toFixed(1)).join(' x ')}`)
if (process.env.ROWS) console.log(rows.slice(0, Number(process.env.ROWS)).join('\n'))
