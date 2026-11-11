// Converts the vendor STEP files listed in tools/models.json into compact meshes for the guide:
//   assets/models/<key>.bin   gzip of [Uint16 quantised positions][Uint32 indices], one block per part
//   assets/models/index.json  per model: source STEP (path, sha256), bbox (mm, as the maker drew it), parts (name, colour, counts)
// The STEP files are read with occt-import-js (OpenCascade compiled to WebAssembly; tools/package.json).
// Run: node --max-old-space-size=12000 tools/step_to_mesh.mjs [key ...]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import occtimportjs from 'occt-import-js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const VENDOR = join(root, '..', 'Vendor Step Files')
const cfg = JSON.parse(readFileSync(join(here, 'models.json'), 'utf8'))
const outDir = join(root, 'assets', 'models'); mkdirSync(outDir, { recursive: true })
const idxPath = join(outDir, 'index.json')
const index = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, 'utf8')) : {}
const only = process.argv.slice(2)
const occt = await occtimportjs()

for (const [key, m] of Object.entries(cfg.models)) {
  if (only.length && !only.includes(key)) continue
  // V5: files occt-import-js cannot mesh (1769-L36ERM) go through tools/step_cascadio.py instead
  if (m.reader === 'cascadio') { console.log(`${key}: converted by tools/step_cascadio.py, skipped here`); continue }
  const file = join(VENDOR, m.step)
  const buf = readFileSync(file)
  const t0 = Date.now()
  const res = occt.ReadStepFile(new Uint8Array(buf), { linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio', linearDeflection: m.deflection ?? 0.003, angularDeflection: m.angular ?? 0.5 })
  if (!res.success) { console.log(`${key}: FAILED to read ${m.step}`); continue }
  const keep = (mm, i) => (!m.skipParts || !m.skipParts.some((re) => new RegExp(re, 'i').test(mm.name ?? ''))) && (!m.skipIndex || !m.skipIndex.includes(i))
  const meshes = res.meshes.filter(keep)
  // split each mesh into parts by face colour (makers colour terminals, screws and labels differently)
  const parts = []
  meshes.forEach((mm, mi) => {
    const pos = mm.attributes.position.array, idx = mm.index.array
    const base = mm.color ?? null
    const runs = (mm.brep_faces?.length ? mm.brep_faces : [{ first: 0, last: idx.length / 3 - 1, color: null }])
    const byCol = new Map()
    for (const f of runs) { const c = f.color ?? base; const k = c ? c.map((v) => v.toFixed(3)).join(',') : 'none'; if (!byCol.has(k)) byCol.set(k, { color: c, tris: [] }); byCol.get(k).tris.push([f.first, f.last]) }
    for (const { color, tris } of byCol.values()) {
      const remap = new Map(), P = [], I = []
      for (const [a, b] of tris) for (let t = a; t <= b; t++) for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k]; let n = remap.get(v); if (n === undefined) { n = P.length / 3; remap.set(v, n); P.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]) } I.push(n) }
      parts.push({ name: mm.name || `solid ${mi}`, mesh: mi, color, P, I })
    }
  })
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]
  for (const p of parts) for (let i = 0; i < p.P.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p.P[i + k]); hi[k] = Math.max(hi[k], p.P[i + k]) }
  const span = hi.map((v, k) => Math.max(1e-6, v - lo[k]))
  const chunks = [], meta = []
  let tri = 0
  for (const p of parts) {
    const q = new Uint16Array(p.P.length)
    for (let i = 0; i < p.P.length; i++) q[i] = Math.round(((p.P[i] - lo[i % 3]) / span[i % 3]) * 65535)
    const ii = new Uint32Array(p.I)
    chunks.push(Buffer.from(q.buffer), Buffer.from(ii.buffer))
    meta.push({ name: p.name, mesh: p.mesh, color: p.color ? p.color.map((v) => +v.toFixed(3)) : null, nv: p.P.length / 3, ni: p.I.length })
    tri += p.I.length / 3
  }
  const bin = gzipSync(Buffer.concat(chunks), { level: 9 })
  writeFileSync(join(outDir, `${key}.bin`), bin)
  index[key] = { step: relative(join(root, '..'), file).replace(/\\/g, '/'), sha256: createHash('sha256').update(buf).digest('hex'), comp: m.comp, pn: m.pn, lo: lo.map((v) => +v.toFixed(3)), hi: hi.map((v) => +v.toFixed(3)), parts: meta, tri, bytes: bin.length }
  console.log(`${key}: ${parts.length} parts, ${tri} triangles, ${(bin.length / 1024).toFixed(0)} KB gz, size ${span.map((v) => v.toFixed(1)).join(' x ')} mm (${((Date.now() - t0) / 1000).toFixed(1)} s)`)
  writeFileSync(idxPath, JSON.stringify(index, null, 1))
}
