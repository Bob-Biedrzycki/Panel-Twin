// Vendor STEP meshes (tools/step_to_mesh.mjs): decode one model into BufferGeometries, in mm, as the maker drew it.
// bytes: the gzip'd .bin; meta: its entry in assets/models/index.json.
export async function gunzip(bytes) {
  const ds = new DecompressionStream('gzip')
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer()
  return buf
}
export function decodeModel(THREE, buf, meta) {
  const lo = meta.lo, span = meta.hi.map((v, k) => Math.max(1e-6, v - lo[k]))
  let off = 0
  const parts = []
  for (const p of meta.parts) {
    const q = new Uint16Array(buf, off, p.nv * 3); off += p.nv * 6
    off = Math.ceil(off / 4) * 4 === off ? off : off           // positions are written back to back with the indices (6-byte stride)
    const ii = new Uint32Array(buf.slice(off, off + p.ni * 4)); off += p.ni * 4
    const pos = new Float32Array(p.nv * 3)
    for (let i = 0; i < q.length; i++) pos[i] = lo[i % 3] + (q[i] / 65535) * span[i % 3]
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setIndex(new THREE.BufferAttribute(ii, 1))
    g.computeVertexNormals()
    parts.push({ ...p, geo: g })
  }
  return parts
}
