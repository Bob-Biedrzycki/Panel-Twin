#!/usr/bin/env node
// Lists the solids of a converted model with their bounding boxes, in the maker's axes or after a rotation.
// usage: node tools/model_parts.mjs KEY [rot,rot...] [--min-tri N] [--box x0,x1,y0,y1,z0,z1]
// rot uses the names of src/model_fit.mjs (x90, z-90, ...). Used to find lugs, covers and terminal blocks by measurement.
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url)), dir = join(here, '..', 'assets', 'models')
const [key, rotArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const opt = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null }
const minTri = Number(opt('--min-tri') ?? 0), boxF = opt('--box')?.split(',').map(Number)
const m = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))[key]
const buf = gunzipSync(readFileSync(join(dir, `${key}.bin`)))
const rots = (rotArg ?? '').split(',').filter(Boolean)
const R = (p) => { let [x, y, z] = p; for (const r of rots) { const a = Number(r.slice(1)) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); if (r[0] === 'x') [y, z] = [y * c - z * s, y * s + z * c]; else if (r[0] === 'y') [x, z] = [x * c + z * s, -x * s + z * c]; else [x, y] = [x * c - y * s, x * s + y * c] } return [x, y, z] }
const span = m.hi.map((v, k) => v - m.lo[k])
let off = 0
m.parts.forEach((p, i) => {
  const q = new Uint16Array(buf.buffer, buf.byteOffset + off, p.nv * 3); off += p.nv * 6 + p.ni * 4
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]
  for (let v = 0; v < p.nv; v++) { const w = R([0, 1, 2].map((k) => m.lo[k] + q[v * 3 + k] / 65535 * span[k])); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]) } }
  if (p.ni / 3 < minTri) return
  if (boxF && (hi[0] < boxF[0] || lo[0] > boxF[1] || hi[1] < boxF[2] || lo[1] > boxF[3] || hi[2] < boxF[4] || lo[2] > boxF[5])) return
  console.log(`${String(i).padStart(3)} ${(p.name ?? '').slice(0, 34).padEnd(34)} tri ${String(p.ni / 3).padStart(6)}  x ${lo[0].toFixed(1)}..${hi[0].toFixed(1)}  y ${lo[1].toFixed(1)}..${hi[1].toFixed(1)}  z ${lo[2].toFixed(1)}..${hi[2].toFixed(1)}  ${p.color ? p.color.map((c) => c.toFixed(2)).join(',') : ''}`)
})
