// VFD 200 assembly guide, V4: the panel built step by step from the makers' own 3D (STEP) models where they exist, every
// conductor landed on the real surface of its terminal and labelled, a completed-panel view, and tools for the person
// wiring it (wire-by-wire mode, terminal tables, cut list, run sheet).
// Data comes from src/layout.mjs, src/terminals.mjs and data/*.json, inlined by build.mjs as window.GUIDE.
const { THREE, Lab, MAT, GEO, clamp, lerp } = window.LabKit
const G = window.GUIDE
const { ENC } = G
const { LAYOUTS, DEVICE_LAYOUT, STRIP_LAYOUT, IOL_CORE } = G.TERMINALS

// ------------------------------------------------------------------ frame: metres, Y up, the floor at 0, the back wall at z = 0
const { W, HB, D, T, HOOD, Y0, SW, SH } = ENC
const SLOPE = Math.atan2(HOOD, D)
const SPZ = T + 0.025, PZ = SPZ + 0.00266                     // subplate back and front faces (collar studs 25 mm)
const RZ = PZ + 0.0075                                        // top of a 35 x 7.5 rail
const SX = (X) => -SW / 2 + X / 1000                          // sheet 3 ordinates (mm from the plate's top left)
const SY = (Y) => Y0 + 0.051 + SH - Y / 1000
const topY = (z) => Y0 + HB + HOOD - z * Math.tan(SLOPE)

const lab = new Lab({
  prompt: '', no: 2, title: 'VFD 200', sub: 'assembly guide',
  // hotkeys false (V5): the renderer's own C (cut away), X, E, S, L keys also fired, so C for Completed panel sliced the
  // panel open at the cut plane
  size: 1.8, autoOrbit: false, frame: 'left', hotkeys: false, staticShadows: true, adaptive: { min: 0.75 },
  view: G.STEPS[0].view,
  cut: { a: [0, 0, 1], b: [0, 0, 1], center: [0, 0.95, 0.17], reach: 1.4 },
})
// V8: the scene is centred in the part of the window the side panel leaves free (V7 shifted it by a fixed fifth)
const FX = () => { const p = document.getElementById('g-panel'); return document.body.classList.contains('nopanel') || innerWidth <= 820 || !p ? 0 : -(p.offsetWidth / innerWidth) / 2 }
lab.view.frameX = FX()

// ------------------------------------------------------------------ helpers
const V3 = (x, y, z) => new THREE.Vector3(x, y, z)
const at = (g, x, y, z) => { g.translate(x, y, z); return g }
const box = (w, h, d, x, y, z, r) => at(r === 0 ? new THREE.BoxGeometry(w, h, d) : GEO.rbox(w, h, d, r ?? Math.min(w, h, d) * 0.12, 2), x, y, z)
const cyl = (r, h, x, y, z, axis = 'y', seg = 20) => { const g = new THREE.CylinderGeometry(r, r, h, seg); if (axis === 'z') g.rotateX(Math.PI / 2); if (axis === 'x') g.rotateZ(Math.PI / 2); return at(g, x, y, z) }
const rect = (w, h, r = 0, cx = 0, cy = 0) => { const s = new THREE.Shape(); const x0 = cx - w / 2, y0 = cy - h / 2; if (!r) { s.moveTo(x0, y0); s.lineTo(x0 + w, y0); s.lineTo(x0 + w, y0 + h); s.lineTo(x0, y0 + h); s.closePath(); return s } s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); s.lineTo(x0 + w, y0 + h - r); s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s }
const holeOf = (s) => { const p = new THREE.Path(); p.setFromPoints(s.getPoints(8).reverse()); return p }
const plate = (shape, t, z, bevel = 0.0002) => at(GEO.extrude(shape, t - 2 * bevel, bevel), 0, 0, z)
const PROFILE_M = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1)
function railProfile(pts, width, xc, yc, z0 = PZ) {
  const s = new THREE.Shape(); pts.forEach(([v, w], i) => i ? s.lineTo(v, w) : s.moveTo(v, w)); s.closePath()
  const g = GEO.extrude(s, width - 0.0004, 0.0002); g.applyMatrix4(PROFILE_M); return at(g, xc, yc, z0)
}
const mesh = (geo, m) => { const o = new THREE.Mesh(Array.isArray(geo) ? GEO.merge(geo) : geo, m); o.castShadow = true; o.receiveShadow = true; return o }
// a cylinder between two points (screws, ferrules, sleeves along any direction)
function rod(a, b, r, seg = 12) { const d = b.clone().sub(a), L = d.length(); const g = new THREE.CylinderGeometry(r, r, L, seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize())); const m = a.clone().add(b).multiplyScalar(0.5); return at(g, m.x, m.y, m.z) }
const loader = new THREE.TextureLoader()
const texCache = {}
function faceTex(key) {
  if (texCache[key]) return texCache[key]
  const t = loader.load(G.TEX[key].url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return (texCache[key] = t)
}
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t }
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// ------------------------------------------------------------------ materials
const M = {
  ss: MAT.stainless({ roughness: 0.3, color: [0.66, 0.655, 0.64] }),
  ssDoor: MAT.stainless({ roughness: 0.26, color: [0.67, 0.665, 0.65], rep: [1, 6] }),
  leg: MAT.paint({ color: [0.3, 0.31, 0.32], roughness: 0.6, clearcoat: 0.05 }),
  sub: MAT.paint({ color: [0.9, 0.9, 0.88], roughness: 0.5, clearcoat: 0.1 }),
  duct: MAT.plastic({ color: [0.9, 0.905, 0.89], roughness: 0.55 }),
  rail: MAT.steel({ color: [0.78, 0.76, 0.62], roughness: 0.3, finish: 'brushed' }),
  zinc: MAT.steel({ color: [0.62, 0.63, 0.64], roughness: 0.36, finish: 'cast' }),
  screw: MAT.steel({ roughness: 0.2, color: [0.72, 0.72, 0.7], finish: null }),
  brassScrew: MAT.brass({ roughness: 0.3 }),
  copper: MAT.copper({ roughness: 0.32, finish: null }),
  tin: MAT.steel({ color: [0.8, 0.8, 0.78], roughness: 0.28, finish: null }),
  black: MAT.plastic({ color: [0.025, 0.025, 0.028], roughness: 0.4 }),
  grey: MAT.plastic({ color: '#7d8083', roughness: 0.45 }),
  orange: MAT.plastic({ color: '#e8711a', roughness: 0.42 }),
  red: MAT.plastic({ color: [0.75, 0.03, 0.03], roughness: 0.28, clearcoat: 0.6 }),
  yellow: MAT.plastic({ color: [0.95, 0.75, 0.05], roughness: 0.4 }),
  gasket: MAT.rubber(),
  hole: MAT.plastic({ color: [0.01, 0.01, 0.012], roughness: 0.9, finish: null }),
  rj: MAT.plastic({ color: '#1b1d1f', roughness: 0.5, finish: null }),
  // V5: see-through by opacity, not transmission: a transmission material makes three.js draw the whole panel a second
  // time every frame (the RJ45 plugs and the PDB1 cover doubled the frame cost)
  plug: MAT.plastic({ color: '#d9e6ea', roughness: 0.15, transparent: true, opacity: 0.8, finish: null }),
  collar: MAT.plastic({ color: '#e6e6e0', roughness: 0.4, finish: null }),
}
const bodyMats = {}
const bodyMat = (hex, metal) => bodyMats[hex + (metal ? 'm' : '')] ??= metal ? MAT.steel({ color: hex, roughness: 0.35, finish: 'cast' }) : MAT.plastic({ color: hex, roughness: 0.46, clearcoat: 0.12, clearcoatRoughness: 0.5 })
const faceMats = {}
function faceMat(key, tint) {
  const k = key + (tint ?? '')
  // the face image doubles as a bump map so moulded lines, screws and labels catch the light
  return faceMats[k] ??= MAT.plastic({ color: tint ?? '#ffffff', map: faceTex(key), bumpMap: faceTex(key), bumpScale: 0.9, roughness: 0.42, clearcoat: 0.15, clearcoatRoughness: 0.45, finish: null, alphaTest: 0.35, side: THREE.FrontSide })
}

// ------------------------------------------------------------------ vendor STEP models (src/model_fit.mjs, assets/models; inlined by build.mjs)
// Each model is the maker's own STEP file tessellated (tools/step_to_mesh.mjs), in mm in the maker's axes. vendor() turns it
// into panel axes in metres; vendorGroup() gives it materials, merged so a model costs a handful of draw calls.
async function gunzip(bytes) { const ds = new DecompressionStream('gzip'); return new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer() }
function decodeModel(buf, meta) {
  const lo = meta.lo, span = meta.hi.map((v, k) => Math.max(1e-6, v - lo[k]))
  let off = 0
  return meta.parts.map((p) => {
    const q = new Uint16Array(buf, off, p.nv * 3); off += p.nv * 6
    const ii = new Uint32Array(buf.slice(off, off + p.ni * 4)); off += p.ni * 4
    const pos = new Float32Array(p.nv * 3)
    for (let i = 0; i < q.length; i++) pos[i] = lo[i % 3] + (q[i] / 65535) * span[i % 3]
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(ii, 1)); g.computeVertexNormals()
    return { ...p, geo: g }
  })
}
const FIT = G.FIT ?? { MODEL_FIT: {}, STRIP_MODEL: {}, PART_MODEL: {} }
const VRAW = {}
await Promise.all(Object.entries(G.MODELS ?? {}).map(async ([k, m]) => {
  try { const bin = Uint8Array.from(atob(m.b64), (c) => c.charCodeAt(0)); VRAW[k] = decodeModel(await gunzip(bin), m.meta) } catch (e) { console.warn('model', k, e) }
  m.b64 = null
}))
const hasModel = (k) => !!VRAW[k]
const AXV = { x: V3(1, 0, 0), y: V3(0, 1, 0), z: V3(0, 0, 1) }
const VCACHE = {}
function vendor(key, rot = [], scale = null) {
  const ck = `${key}|${rot.join(',')}|${scale ?? ''}`
  if (VCACHE[ck]) return VCACHE[ck]
  const q = new THREE.Quaternion()
  for (const r of rot) q.premultiply(new THREE.Quaternion().setFromAxisAngle(AXV[r[0]], Number(r.slice(1)) * Math.PI / 180))
  const m4 = new THREE.Matrix4().makeRotationFromQuaternion(q).multiply(new THREE.Matrix4().makeScale(0.001, 0.001, 0.001))
  if (scale) m4.premultiply(new THREE.Matrix4().makeScale(...scale))
  const list = VRAW[key].map((p) => ({ geo: p.geo.clone().applyMatrix4(m4), part: p }))
  const box = new THREE.Box3(); for (const l of list) { l.geo.computeBoundingBox(); box.union(l.geo.boundingBox) }
  return (VCACHE[ck] = { key, list, box, size: box.getSize(V3()), center: box.getCenter(V3()), m4 })
}
// indexed merge (keeps vertices shared, unlike GEO.merge), optionally moving each copy
function mergeIdx(geos, offsets) {
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count }
  const reps = offsets ?? [null]
  const pos = new Float32Array(nv * 3 * reps.length), nor = new Float32Array(nv * 3 * reps.length), idx = new Uint32Array(ni * reps.length)
  let pv = 0, pi = 0
  for (const o of reps) for (const g of geos) {
    const p = g.attributes.position.array, n = g.attributes.normal.array, ix = g.index.array
    for (let i = 0; i < p.length; i += 3) { pos[pv * 3 + i] = p[i] + (o?.x ?? 0); pos[pv * 3 + i + 1] = p[i + 1] + (o?.y ?? 0); pos[pv * 3 + i + 2] = p[i + 2] + (o?.z ?? 0) }
    nor.set(n, pv * 3)
    for (let i = 0; i < ix.length; i++) idx[pi + i] = ix[i] + pv
    pv += p.length / 3; pi += ix.length
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1))
  return g
}
// a CAD default colour (Pro/E lavender, plain grey) says nothing about the part: only real colours are used
const realColour = (c) => c && !(Math.abs(c[0] - 0.64) < 0.02 && Math.abs(c[1] - 0.64) < 0.02 && c[2] > 0.95) && !(Math.abs(c[0] - c[1]) < 0.01 && Math.abs(c[1] - c[2]) < 0.01 && c[0] > 0.6 && c[0] < 0.72)
const colourMats = {}
const colourMat = (c, metal) => colourMats[c.join(',') + (metal ? 'm' : '')] ??= metal ? MAT.steel({ color: c, roughness: 0.35, finish: 'cast' }) : MAT.plastic({ color: c, roughness: 0.45, clearcoat: 0.1, clearcoatRoughness: 0.5 })
// style: { body: material, rules: [[regex on part name, material]], colours: use the maker's colours, small: material for parts under n triangles }
function vendorGroup(v, style = {}, { split, at } = {}) {
  const bins = new Map()
  v.list.forEach((l, i) => {
    const p = l.part
    let m = style.rules?.find(([re]) => re.test(p.name))?.[1]
    if (!m && style.byIndex) m = style.byIndex(i, p)
    if (!m && style.colours !== false && realColour(p.color)) m = colourMat(p.color, style.metalColours)
    if (!m && style.small && p.ni / 3 < style.small[0]) m = style.small[1]
    m ??= style.body ?? bodyMat('#cccccc')
    const cat = split ? split(p, l.geo, i) : 'all'
    if (cat === null) return
    const k = `${cat}|${m.uuid}`
    if (!bins.has(k)) bins.set(k, { cat, m, geos: [] })
    bins.get(k).geos.push(l.geo)
  })
  const out = {}
  for (const { cat, m, geos } of bins.values()) {
    const g = mergeIdx(geos, at ? [at] : null)
    const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true
    ;(out[cat] ??= new THREE.Group()).add(o)
  }
  return split ? out : (out.all ?? new THREE.Group())
}
// the maker's face image laid onto the front-facing surfaces of a model, so labels, LEDs and markings show on the 3D body.
// rect: the sheet 3 rectangle in world metres { x0, x1, yT, yB }; only triangles facing the viewer inside it take the image.
function faceDecal(group, rect, texKey, { minNz = 0.82, lift = 0.0002, tint, skip } = {}) {
  const P = [], UV = []
  group.updateMatrix()
  const a = V3(), b = V3(), c = V3(), n = V3()
  group.children.forEach((o) => {
    if (!o.isMesh || o.userData.noDecal) return
    o.updateMatrix()
    const pos = o.geometry.attributes.position, ix = o.geometry.index, mw = new THREE.Matrix4().multiplyMatrices(group.matrix, o.matrix)
    const at3 = (k) => ix ? ix.getX(k) : k
    const nT = ix ? ix.count : pos.count
    for (let t = 0; t < nT; t += 3) {
      a.fromBufferAttribute(pos, at3(t)).applyMatrix4(mw); b.fromBufferAttribute(pos, at3(t + 1)).applyMatrix4(mw); c.fromBufferAttribute(pos, at3(t + 2)).applyMatrix4(mw)
      n.subVectors(c, b).cross(a.clone().sub(b)).normalize()
      if (n.z < minNz) continue
      const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3
      if (cx < rect.x0 || cx > rect.x1 || cy < rect.yB || cy > rect.yT) continue
      if (skip?.(cx, cy)) continue
      for (const p of [a, b, c]) { P.push(p.x, p.y, p.z + lift); UV.push((p.x - rect.x0) / (rect.x1 - rect.x0), (p.y - rect.yB) / (rect.yT - rect.yB)) }
    }
  })
  if (!P.length) return null
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals()
  const m = faceMat(texKey, tint).clone(); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; m.bumpMap = null
  const o = new THREE.Mesh(g, m); o.receiveShadow = true
  return o
}

// ------------------------------------------------------------------ scene groups (shown/hidden per step)
const GROUPS = {}
function grp(name, parent) { const g = new THREE.Group(); g.name = name; (parent ?? lab.machine).add(g); GROUPS[name] = g; return g }
const encG = grp('enc'), standG = grp('stand'), doorsG = grp('doors'), cutG = grp('cutouts'), acG = grp('ac'), handleG = grp('handle')
const plateG = grp('plate'), ductG = grp('duct'), coverG = grp('covers'), railsG = grp('rails'), sub2G = grp('sub2'), wiresG = grp('wires'), doorDevG = grp('door'), tagsG = grp('tags')
const STEP_GROUPS = {}
for (const s of ['power', 'rail1', 'drives', 't1', 'rail3', 'rail4']) STEP_GROUPS[s] = grp(s)
const frontG = new THREE.Group(); encG.add(frontG)                  // front frame: hidden with "Remove front"
const IN = 0.0254, PLATE_CY = Y0 + 0.051 + SH / 2
const STUD_X = [-45.25 / 2 * IN, (45.25 / 2 - 21.13) * IN, 45.25 / 2 * IN]
const STUD_Y = [PLATE_CY - 54.25 / 2 * IN, PLATE_CY - 54.25 / 2 * IN + 27.13 * IN, PLATE_CY + 54.25 / 2 * IN]
const VIEW = { noFront: false, complete: false }
const VENC = hasModel(FIT.PART_MODEL.enclosure?.model)

// ------------------------------------------------------------------ the enclosure: SCE-60XEL4918SSST (60 x 49 x 18 in)
{
  const g = []
  g.push(box(W, HB + HOOD, T, 0, Y0 + (HB + HOOD) / 2, T / 2, 0))
  g.push(box(W, T, D, 0, Y0 + T / 2, D / 2, 0))
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape(); sh.moveTo(0, Y0); sh.lineTo(D, Y0); sh.lineTo(D, Y0 + HB); sh.lineTo(0, Y0 + HB + HOOD); sh.closePath()
    if (s < 0) { sh.holes.push(holeOf(rect(0.2, 0.14, 0.004, D * 0.5, 1.39))); sh.holes.push(holeOf(rect(0.2, 0.14, 0.004, D * 0.5, 1.05))) }
    const sg = GEO.extrude(sh, T - 0.0002, 0.0001); sg.rotateY(-Math.PI / 2); g.push(at(sg, s * (W / 2 - T / 2), 0, 0))
  }
  const L = (D + 0.022) / Math.cos(SLOPE)
  const top = box(W + 0.006, T, L, 0, 0, L / 2, 0); top.rotateX(SLOPE); top.translate(0, Y0 + HB + HOOD + T / 2, 0); g.push(top)
  if (!VENC) encG.add(mesh(g, M.ss))
  // the whole front (frame, centre post, right flange, drip edge, gasket) is its own group so it can be taken off for a clear view
  const f = []
  f.push(box(W + 0.006, 0.016, T, 0, Y0 + HB - 0.022 * Math.tan(SLOPE) - 0.008, D + 0.022, 0))
  const fr = rect(W, HB, 0, 0, Y0 + HB / 2)
  fr.holes.push(holeOf(rect(0.533, HB - 0.07, 0.004, -0.3255, Y0 + HB / 2)), holeOf(rect(0.535, HB - 0.07, 0.004, 0.2805, Y0 + HB / 2)))
  f.push(plate(fr, T, D - 0.022 - T / 2))
  for (const x of [-W / 2 + 0.006, W / 2 - 0.006]) f.push(box(0.012, HB, 0.022, x, Y0 + HB / 2, D - 0.011, 0))
  f.push(box(0.032, HB - 0.02, 0.026, -0.023, Y0 + HB / 2, D - 0.013, 0.002))       // removable centre post
  f.push(box(0.054, HB - 0.02, 0.012, 0.595, Y0 + HB / 2, D - 0.006, 0.002))        // right flange (disconnect handle)
  if (!VENC) frontG.add(mesh(f, M.ss))
  const eyes = []
  for (const x of [-0.575, 0.575]) { const z = 0.2, y = topY(z); eyes.push(at(new THREE.TorusGeometry(0.024, 0.006, 12, 32), x, y + 0.042, z), cyl(0.011, 0.02, x, y + 0.01, z, 'y', 6)) }
  if (!VENC) encG.add(mesh(eyes, M.zinc))
  // subpanel collar studs where Saginaw puts them (SCE-60XEL4918SSST drawing, rear view): 45.25 in apart across, 54.25 in apart
  // up and down, a middle row 27.13 in above the bottom one, a middle column 21.13 in from the right-hand one
  const studs = []; for (const x of STUD_X) for (const y of STUD_Y) studs.push(cyl(0.0048, 0.03, x, y, T + 0.015, 'z', 12))
  encG.add(mesh(studs, M.zinc))
  // door gasket on the frame lip
  const gk = []; for (const [cx, w] of [[-0.3255, 0.533], [0.2805, 0.535]]) { gk.push(box(w + 0.01, 0.008, 0.004, cx, Y0 + HB - 0.03, D - 0.02, 0), box(w + 0.01, 0.008, 0.004, cx, Y0 + 0.03, D - 0.02, 0), box(0.008, HB - 0.06, 0.004, cx - w / 2 - 0.004, Y0 + HB / 2, D - 0.02, 0), box(0.008, HB - 0.06, 0.004, cx + w / 2 + 0.004, Y0 + HB / 2, D - 0.02, 0)) }
  if (!VENC) frontG.add(mesh(gk, M.gasket))
  const lg = []
  for (const s of [-1, 1]) { const x = s * (W / 2 - 0.06); lg.push(box(0.12, 0.15, D, x, 0.075, D / 2, 0.004)); lg.push(box(0.14, 0.012, D + 0.02, x, 0.006, D / 2, 0.003)) }
  lg.push(box(W - 0.24, 0.1, 0.006, 0, 0.1, D - 0.04, 0.002))
  standG.add(mesh(lg, M.leg))
}

// doors: both hinge on their left edge, the right door on the removable centre post, handles on the right
// (Saginaw SCE-60XEL4918SSST drawing, front view: hinges on the left door's left edge and the right door's centre-post edge,
// 3-point handles on the right of each door; this is also how sheet 2 draws them)
const doorL = new THREE.Group(), doorR = new THREE.Group()
const DOOR_Z = D + 0.004
doorL.position.set(-W / 2 + 0.03, 0, DOOR_Z); doorR.position.set(-0.007, 0, DOOR_Z)
doorsG.add(doorL, doorR)
// V4: the enclosure is Saginaw's own SCE-60XEL4918SSST model (fasteners and the loose subpanel left out). Body, centre post
// and the two doors are kept apart so the doors swing on their real hinge edges and "Remove front" can take them off.
const VDOOR = {}
if (VENC) {
  const pm = FIT.PART_MODEL.enclosure, v = vendor(pm.model, pm.rot)
  // door hardware (latch rods and guides, hinges, print pocket) is mostly unnamed in the model: anything in front of the frame
  // (maker X > 430 mm) goes with the door whose width it lies in (main door Z -640..-40 mm, secondary -1240..-655 mm)
  const cat = (p) => {
    const n = p.name
    if (/MN-DR|GSKT-MD|-MD$|^126935/.test(n)) return 'mn'
    if (/SEC-DR|GSKT-SD|-SD$|^126937/.test(n)) return 'sec'
    if (/CCA|^1298|^130216/.test(n)) return 'post'                // removable centre post and its latch
    if (!p.geo.boundingBox) p.geo.computeBoundingBox()
    const b = p.geo.boundingBox, zc = (b.min.z + b.max.z) / 2
    if (b.min.x > 430) { if (zc > -640 && zc < -40) return 'mn'; if (zc > -1240 && zc < -655) return 'sec' }
    return 'body'
  }
  const off = V3(-v.center.x, Y0 - v.box.min.y, -v.box.min.z)
  const bb = {}
  v.list.forEach((l) => { const c = cat(l.part); (bb[c] ??= new THREE.Box3()).union(l.geo.boundingBox) })
  const doorBox = {}
  v.list.forEach((l) => { if (/^MODEL-138-(MN|SEC)-DR/.test(l.part.name)) doorBox[/MN/.test(l.part.name) ? 'mn' : 'sec'] = l.geo.boundingBox.clone().translate(off) })
  const grp = vendorGroup(v, { body: M.ss, rules: [[/GSKT/, M.gasket], [/HANDLE_INSERT|PADLOCK|NUT_CAM|ADAPTER_CAM/, M.black]] }, { split: (p) => cat(p), at: off })
  if (grp.body) encG.add(grp.body)
  if (grp.post) frontG.add(grp.post)
  // which door is on the left: the one whose panel lies left of the centre post
  const left = (doorBox.mn?.getCenter(V3()).x ?? -1) < (doorBox.sec?.getCenter(V3()).x ?? 1) ? 'mn' : 'sec', right = left === 'mn' ? 'sec' : 'mn'
  for (const [side, g, k] of [['L', doorL, left], ['R', doorR, right]]) {
    const b = doorBox[k]; if (!b || !grp[k]) continue
    g.position.set(b.min.x, 0, b.max.z - 0.0028)          // hinge on the door's left edge; local z = 0.0028 is the outer skin
    grp[k].position.sub(g.position); g.add(grp[k])
    VDOOR[side] = { w: b.max.x - b.min.x, h: b.max.y - b.min.y, y0: b.min.y }
  }
  VDOOR.box = bb
}
function doorPanel(w, sign) {
  const g = [], x0 = sign > 0 ? 0 : -w
  g.push(box(w, HB - 0.05, 0.0028, x0 + w / 2, Y0 + HB / 2, 0.0014, 0.001))
  for (const y of [Y0 + 0.04, Y0 + HB - 0.04]) g.push(box(w, 0.022, 0.022, x0 + w / 2, y, -0.011, 0.001))
  for (const x of [x0 + 0.011, x0 + w - 0.011]) g.push(box(0.022, HB - 0.05, 0.022, x, Y0 + HB / 2, -0.011, 0.001))
  return g
}
let hmiHole, estopHole
{
  const wl = VDOOR.L?.w ?? 0.573, wr = 0.575
  // sheet 2: display centre 1400 mm from the floor and 287 mm from the door's centre-post edge; E-STOP 138 mm from that edge
  // V13 (Draft rev20 sheet 2): HMI1 and the E-STOP are on the RIGHT door (rev18: the left door). Display centre 1400 mm from
  // the floor, 257 mm below the top of the door and 287 mm from the door's right (handle) edge; E-STOP centre 168 mm from
  // that edge and 935 mm above the bottom of the door (550 mm below its top), which is 1107 mm from the floor.
  const wR = VDOOR.R?.w ?? wr
  hmiHole = { x: wR - 0.287, y: 1.4, w: 0.269, h: 0.224 }
  estopHole = { x: wR - 0.168, y: 1.4 + 0.257 - 0.550, r: 0.0152 }
  if (!VENC) {
  doorL.add(mesh(doorPanel(wl, 1), M.ssDoor))
  doorR.add(mesh(doorPanel(wr, 1), M.ssDoor))
  // 3-point stainless handles on the right of each door (Saginaw drawing)
  const handle = (x) => [box(0.04, 0.11, 0.02, x, 0.95, 0.012, 0.008), box(0.016, 0.1, 0.022, x, 0.87, 0.024, 0.006), cyl(0.012, 0.012, x, 0.99, 0.024, 'z', 24)]
  doorL.add(mesh(handle(wl - 0.07), M.ss)); doorR.add(mesh(handle(wr - 0.07), M.ss))
  // four concealed hinges per door on its left edge
  const hg = []; for (const y of [0.35, 0.8, 1.25, 1.62]) hg.push(cyl(0.007, 0.06, 0, y, -0.004, 'y', 12))
  doorL.add(mesh(hg.map((g) => g.clone().translate(-0.006, 0, 0)), M.ss)); doorR.add(mesh(hg.map((g) => g.clone().translate(-0.006, 0, 0)), M.ss))
  }
  cutG.add(mesh([box(hmiHole.w, hmiHole.h, 0.004, hmiHole.x, hmiHole.y, 0.0015, 0)], M.hole))
  cutG.add(mesh([cyl(estopHole.r, 0.004, estopHole.x, estopHole.y, 0.0015, 'z', 32)], M.hole))
  doorR.add(cutG)
}

// A/C on the left side wall: Enviro-Therm 1000 BTU/h, 254 x 480 x 190.5 mm (PartsLib record), position not drawn
{
  const x = -W / 2 - 0.0953, g = []
  const pa = FIT.PART_MODEL.ac
  if (hasModel(pa?.model)) {
    // Saginaw's own SCE-AC1000B120VSS model, its mounting face on the outside of the left wall
    const v = vendor(pa.model, pa.rot)
    acG.add(vendorGroup(v, { body: MAT.stainless({ roughness: 0.24, color: [0.68, 0.675, 0.66], rep: [1, 3] }), rules: [[/FILTER/, M.grey], [/CAREL|ADDA|BLWR|CONNECTOR|072106/, M.black]] }, { at: V3(-W / 2 - v.box.max.x, 1.2 - v.center.y, D * 0.5 - v.center.z) }))
  } else {
  g.push(box(0.1905, 0.48, 0.254, x, 1.2, D * 0.5, 0.008))
  const grill = []; for (let k = 0; k < 11; k++) grill.push(box(0.004, 0.012, 0.2, x - 0.096, 1.03 + k * 0.026, D * 0.5, 0.001))
  acG.add(mesh(g, MAT.stainless({ roughness: 0.24, color: [0.68, 0.675, 0.66], rep: [1, 3] })), mesh(grill, M.grey))
  const lb = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#e9e8e3'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = '700 26px Inter, sans-serif'; c.fillText('ENVIRO-THERM', 12, 30); c.font = '500 18px Inter, sans-serif'; c.fillText('1000 BTU/h  120 V', 12, 54) })
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), MAT.plastic({ color: '#ffffff', map: lb, finish: null }))
  pl.rotation.y = -Math.PI / 2; pl.position.set(x - 0.0958, 1.37, D * 0.5); acG.add(pl)
  }
  // X1 supply terminal box on the inside of the wall (PartsLib pins X1-1 L, X1-3 N, X1-4 PE)
  acG.add(mesh([box(0.012, 0.05, 0.07, -W / 2 + T + 0.006, 1.2, D * 0.5, 0.003)], M.black))
}
{
  // flange handle slot 7.88 in below the top of the body (Saginaw drawing)
  handleG.add(mesh([box(0.044, 0.16, 0.022, 0.595, 1.394, D + 0.011, 0.006)], M.grey))
  handleG.add(mesh([box(0.022, 0.11, 0.016, 0.595, 1.434, D + 0.03, 0.006), cyl(0.014, 0.02, 0.595, 1.394, D + 0.028, 'z', 24)], M.red))
}

// ------------------------------------------------------------------ subplate 1
plateG.add(mesh([box(SW, SH, 0.00266, 0, Y0 + 0.051 + SH / 2, SPZ + 0.00133, 0)], M.sub))
{
  // mounting holes and nuts only where a Saginaw stud lands on the plate (the outer columns fall outside a 1118 mm plate: design issue)
  const holes = [], nuts = []
  for (const x of STUD_X) for (const y of STUD_Y) { if (Math.abs(x) > SW / 2 - 0.006) continue; holes.push(cyl(0.006, 0.0005, x, y, PZ + 0.0002, 'z', 16)); nuts.push(cyl(0.0095, 0.008, x, y, PZ + 0.004, 'z', 6)) }
  plateG.add(mesh(holes, M.hole))
  GROUPS.enc.add(mesh(nuts, M.zinc))
}

// ------------------------------------------------------------------ wireway (Panduit F2X2WH6 / F3X2WH6), as drawn on sheet 3, each run tagged D1-D9
const DH = 0.0508
// a run cut from a maker's straight length: copies end to end along the axis, the last one cut off at the run length
// (vertices beyond the cut are pulled back onto the cut face, which closes the end as a saw cut would)
function runGeo(v, axis, len) {
  const P = v.size[axis], n = Math.max(1, Math.ceil(len / P - 1e-6)), k3 = { x: 0, y: 1, z: 2 }[axis], geos = []
  for (let k = 0; k < n; k++) for (const l of v.list) {
    const g = l.geo.clone()
    g.translate(axis === 'x' ? k * P - v.box.min.x : -v.center.x, axis === 'y' ? k * P - v.box.min.y : -v.center.y, -v.box.min.z)
    const a = g.attributes.position.array; for (let i = k3; i < a.length; i += 3) if (a[i] > len) a[i] = len
    geos.push(g)
  }
  return mergeIdx(geos)
}
function duct([X0, X1, Yt, Yb], size) {
  const x0 = SX(X0), x1 = SX(X1), yT = SY(Yt), yB = SY(Yb), along = (x1 - x0) > (yT - yB) ? 'x' : 'y'
  const len = along === 'x' ? x1 - x0 : yT - yB, wd = (along === 'x' ? yT - yB : x1 - x0) - 0.004, cx = (x0 + x1) / 2, cy = (yT + yB) / 2, wt = 0.0018
  const body = [], cover = []
  // V4: Panduit's own F2X2WH6 / F3X2WH6 models, cut to the run length
  const pm = FIT.PART_MODEL[size === '3x2' ? 'duct3' : 'duct2']
  if (hasModel(pm?.model)) {
    const nat = pm.model === 'DUCT3' ? 'y' : 'x'
    const v = vendor(pm.model, nat === along ? pm.rot : [...pm.rot, 'z90'])
    const g = runGeo(v, along, len); g.translate(along === 'x' ? x0 : cx, along === 'x' ? cy : yB, PZ)
    const C = (w, h, d, x, y, z) => cover.push(along === 'x' ? box(w, h, d, x, y, z, 0.0006) : box(h, w, d, y, x, z, 0.0006))
    const vd = v.size.z, vw = along === 'x' ? v.size.y : v.size.x
    C(len, vw + 0.002, 0.0026, 0, 0, PZ + vd + 0.0013)
    for (const s of [-1, 1]) C(len, 0.0014, 0.007, 0, s * (vw / 2 + 0.0004), PZ + vd - 0.0025)
    return { body: [g], cover: cover.map((q) => at(q, cx, cy, 0)), cx, cy, along, vendor: true }
  }
  const B = (w, h, d, x, y, z) => body.push(along === 'x' ? box(w, h, d, x, y, z, 0) : box(h, w, d, y, x, z, 0))
  B(len, wd, 0.0016, 0, 0, PZ + 0.0008)
  const n = Math.floor(len / 0.0127)
  for (const s of [-1, 1]) {
    B(len, wt, 0.012, 0, s * (wd / 2 - wt / 2), PZ + 0.006)
    for (let i = 0; i < n; i++) { const u = -len / 2 + (i + 0.5) * (len / n); B(0.0064, wt, DH - 0.012, u, s * (wd / 2 - wt / 2), PZ + 0.012 + (DH - 0.012) / 2) }
  }
  const C = (w, h, d, x, y, z) => cover.push(along === 'x' ? box(w, h, d, x, y, z, 0.0006) : box(h, w, d, y, x, z, 0.0006))
  C(len, wd + 0.003, 0.0026, 0, 0, PZ + DH + 0.0013)
  for (const s of [-1, 1]) C(len, 0.0014, 0.007, 0, s * (wd / 2 + 0.0007), PZ + DH - 0.0025)
  const tr = (g) => at(g, cx, cy, 0)
  return { body: body.map(tr), cover: cover.map(tr), cx, cy, along }
}
const ductLabels = []
{
  const runs = G.DUCTS.map((d) => duct(d.r, d.size))
  const vend = runs.filter((r) => r.vendor).flatMap((r) => r.body); if (vend.length) ductG.add(mesh(mergeIdx(vend), M.duct))
  const procedural = runs.filter((r) => !r.vendor).flatMap((r) => r.body); if (procedural.length) ductG.add(mesh(procedural, M.duct))
  coverG.add(mesh(runs.flatMap((r) => r.cover), M.duct))
  // duct names on the duct floor, so a route like "D3 → D4 → D5" can be followed on the panel
  G.DUCTS.forEach((d, i) => {
    const t = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#e9e9e4'; c.fillRect(0, 0, w, h); c.fillStyle = '#9a3a06'; c.font = '800 44px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.id, w / 2, h / 2 + 2) })
    const r = runs[i]
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.015), MAT.plastic({ color: '#ffffff', map: t, finish: null }))
    const [X0, X1, Yt, Yb] = d.r
    const lx = r.along === 'x' ? SX(X0 + 40) : SX((X0 + X1) / 2), ly = r.along === 'x' ? SY((Yt + Yb) / 2) : SY(Yt + 40)
    p.position.set(lx, ly, PZ + 0.0019); if (r.along === 'y') p.rotation.z = Math.PI / 2
    ductG.add(p); ductLabels.push(p)
  })
}

// ------------------------------------------------------------------ DIN rails (RS PRO 467-416, 35 x 7.5 slotted)
const RAILP = [[-0.0175, 0.0075], [-0.0115, 0.0075], [-0.0115, 0.001], [0.0115, 0.001], [0.0115, 0.0075], [0.0175, 0.0075], [0.0175, 0.0065], [0.0125, 0.0065], [0.0125, 0], [-0.0125, 0], [-0.0125, 0.0065], [-0.0175, 0.0065]]
{
  const g = [], slots = [], scr = []
  const pr = FIT.PART_MODEL.rail, vr = hasModel(pr?.model) ? vendor(pr.model, pr.rot) : null
  for (const r of Object.values(G.RAILS)) {
    if (vr) {
      // the rail model (McMaster 8961K15, slotted TS35 x 7.5) cut to length: its own slots, so no drawn slots
      const rg = runGeo(vr, 'x', (r.x1 - r.x0) / 1000); rg.translate(SX(r.x0), SY(r.y), PZ)
      railsG.add(mesh(rg, M.rail))
      for (let x = r.x0 + 12; x < r.x1; x += 200) scr.push(cyl(0.0042, 0.0022, SX(x), SY(r.y), PZ + 0.0021, 'z', 16))
      continue
    }
    g.push(railProfile(RAILP, (r.x1 - r.x0) / 1000, SX((r.x0 + r.x1) / 2), SY(r.y)))
    for (let x = r.x0 + 12; x < r.x1 - 10; x += 25) slots.push(box(0.015, 0.0052, 0.0006, SX(x), SY(r.y), PZ + 0.0012, 0.0006))
    for (let x = r.x0 + 12; x < r.x1; x += 200) scr.push(cyl(0.0042, 0.0022, SX(x), SY(r.y), PZ + 0.0021, 'z', 16))
  }
  if (g.length) railsG.add(mesh(g, M.rail), mesh(slots, M.hole))
  railsG.add(mesh(scr, M.screw))
}

// ------------------------------------------------------------------ terminal hardware: what a clamp looks like from the front
const ENTRY_IN = { t: V3(0, -1, 0), b: V3(0, 1, 0), f: V3(0, 0, -1), l: V3(1, 0, 0) }      // direction the wire travels into the clamp
function screwHead(x, y, z, r = 0.0021) {
  // a combination slot/Phillips head standing proud of the clamp
  return [cyl(r, 0.0016, x, y, z, 'z', 12), box(r * 1.7, r * 0.32, 0.0006, x, y, z + 0.0009, 0), box(r * 0.32, r * 1.7, 0.0006, x, y, z + 0.0009, 0)]
}
function pushIn(x, y, z) { return [box(0.0028, 0.0034, 0.0016, x, y, z, 0.0005)] }

// ------------------------------------------------------------------ devices
const DEV = {}                      // tag -> { d, r (mm), z0, z1, obj, lay }
const pickables = []
const COVER_OFF = []                // drive covers shown off in the wiring steps
const COVER_ON = []                 // V5: the makers' own covers (drive control cover, 1769 doors), hidden while they are off
// V7: covers that stay on in the wiring steps and the Completed panel, drawn as x-ray glass so the landings show through
// (Bob: the drive front covers go back on and are x-rayed)
const COVER_XRAY = []
const XRAY_MAT = MAT.plastic({ color: '#bfd6e4', roughness: 0.25, transparent: true, opacity: 0.14, depthWrite: false, finish: null })
function setCovers(off) {
  for (const c of COVER_OFF) c.visible = off
  for (const c of COVER_ON) c.visible = !off
  for (const c of COVER_XRAY) c.traverse((m) => {
    if (!m.isMesh) return
    m.userData.mat ??= m.material
    m.material = off ? (m.userData.decal ? (m.userData.xdecal ??= Object.assign(m.material.clone(), { transparent: true, opacity: 0.3, depthWrite: false })) : XRAY_MAT) : m.userData.mat
    m.castShadow = !off; m.userData.noPick = off; m.renderOrder = off ? 3 : 0
  })
  lab.invalidateShadows?.()
}
function devRect(d) {
  if (d.r) return { X0: d.r[0], X1: d.r[1], Yt: d.r[2], Yb: d.r[3] }
  const t = G.TEX[d.tex]; return { X0: t.X0, X1: t.X1, Yt: t.Yt, Yb: t.Yb }
}
const TAG_PLATES = []
function tagPlate(tag, X, Y, w = 26) {
  // engraved white lamacoid device tag on the subplate, as the shop fits them
  const t = canvasTex(256, 80, (c, cw, ch) => { c.fillStyle = '#f7f7f3'; c.fillRect(0, 0, cw, ch); c.strokeStyle = '#c9c9c2'; c.lineWidth = 4; c.strokeRect(2, 2, cw - 4, ch - 4); c.fillStyle = '#121212'; c.font = `700 ${tag.length > 5 ? 40 : 50}px "JetBrains Mono", Consolas, monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tag, cw / 2, ch / 2 + 2) })
  const p = new THREE.Mesh(box(w / 1000, 0.0085, 0.0012, SX(X), SY(Y), PZ + 0.0006, 0.0006), [M.collar, M.collar, M.collar, M.collar, MAT.plastic({ color: '#ffffff', map: t, roughness: 0.35, finish: null }), M.collar])
  p.receiveShadow = true; tagsG.add(p); TAG_PLATES.push(p)
}
// materials for the vendor models that carry no colours of their own (most Rockwell and Eaton files)
const VSTYLE = {
  Q1: { body: bodyMat('#26272a'), small: [9000, M.zinc] },
  FU1: { body: bodyMat('#26272a'), small: [5000, M.tin] },
  LUG: { body: MAT.aluminium({ roughness: 0.4, finish: 'cast' }), small: [600, M.zinc] },
  // V6: black, as fitted (shop photo); the keypad module and covers carry the sheet 3 image
  PF525D: { body: bodyMat('#1f2022') },
  REC15: { body: bodyMat('#dddcd5') },
}
// ------------------------------------------------------------------ parts with no maker STEP: shapes from their catalogue drawings
// Each returns [geometries, material, { noDecal }] in panel metres; the sheet 3 face image is laid over the front surfaces after.
// Envelopes: PartsLib records (data/partslib_records.json) where held, else the sheet 3 face and the BOM depth.
const blk = (g, u0, u1, v0, v1, zf0, zf1, r = 0.0012) => { const xa = g.x0 + u0 * g.w, xb = g.x0 + u1 * g.w, ya = g.yT - v0 * g.h, yb = g.yT - v1 * g.h, za = g.z0 + zf0 * g.dep, zb = g.z0 + zf1 * g.dep; return box(xb - xa, ya - yb, zb - za, (xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2, r) }
const PROC = {
  // 140MT-F frame MPCB: rail base, terminal shoulders top and bottom, raised centre with the rotary handle (140-TD005 p.48)
  '140MT': (g) => {
    const knobX = g.xc, knobY = g.yT - 0.47 * g.h
    const knob = [cyl(g.w * 0.3, 0.007, knobX, knobY, g.z1 + 0.0035, 'z', 40), box(g.w * 0.13, g.w * 0.56, 0.009, knobX, knobY, g.z1 + 0.008, 0.002)]
    return [
      [[blk(g, 0.02, 0.98, 0.15, 0.85, 0, 0.5), blk(g, 0.01, 0.99, 0, 0.2, 0, 0.66), blk(g, 0.01, 0.99, 0.8, 1, 0, 0.66), blk(g, 0.02, 0.98, 0.2, 0.8, 0, 0.9, 0.004), blk(g, 0.08, 0.92, 0.3, 0.68, 0.85, 1, 0.004)], g.bm],
      [[cyl(0.0055, 0.003, g.xc + g.w * 0.22, g.yT - 0.7 * g.h, g.z0 + 0.9 * g.dep + 0.0015, 'z', 24)], M.grey, { noDecal: true }],
      [knob, bodyMat('#1f3c8c'), { noDecal: true }],
      [[blk(g, 0.06, 0.94, 0.2, 0.235, 0.62, 0.68, 0.0004), blk(g, 0.06, 0.94, 0.765, 0.8, 0.62, 0.68, 0.0004)], M.hole, { noDecal: true }],
    ]
  },
  // CHCC1DU class CC holder: rail base, terminal shoulders, pull-out fuse carrier on the front (Bussmann 10430)
  CHCC: (g) => [
    [[blk(g, 0.02, 0.98, 0.12, 0.88, 0, 0.55), blk(g, 0.01, 0.99, 0, 0.2, 0, 0.7), blk(g, 0.01, 0.99, 0.8, 1, 0, 0.7)], g.bm],
    [[blk(g, 0.05, 0.95, 0.22, 0.78, 0.5, 1, 0.002)], bodyMat('#bfc0bb')],
    [[blk(g, 0.25, 0.75, 0.2, 0.24, 0.92, 1.06, 0.001)], bodyMat('#7a7c7e'), { noDecal: true }],
  ],
  // 1492-PDC covered distribution block: base, three pole bodies, line lugs on top, smoked cover over the load side (1492-TD019 p.14)
  // V6 (shop photos 2026-11-05): fitted open, no cover: a black base, four tall black barrier fins standing the full depth
  // between and outside the poles, and on each pole a tin connector (line lug above, the tap block with its two large and
  // six small openings below) set well back between the fins; the tap wires come up from below into the tap block
  PDB1: (g) => {
    const fins = [], body = [], tin = [], marks = []
    for (const u of [0.05, 0.353, 0.654, 0.955]) fins.push(blk(g, u - 0.011, u + 0.011, 0.02, 0.98, 0.1, 1.0, 0.001))
    ;[0.202, 0.504, 0.804].forEach((c) => {
      body.push(blk(g, c - 0.13, c + 0.13, 0.06, 0.94, 0.1, 0.42, 0.002))
      tin.push(blk(g, c - 0.065, c + 0.065, 0.32, 0.44, 0.42, 0.72, 0.001), blk(g, c - 0.085, c + 0.085, 0.5, 0.73, 0.42, 0.72, 0.001))
    })
    // a white label on the left fin, as fitted
    marks.push(blk(g, 0.035, 0.065, 0.25, 0.45, 1.0, 1.006, 0.0004))
    return [[[blk(g, 0, 1, 0, 1, 0, 0.1, 0.002)], bodyMat('#1c1c1e')], [fins, bodyMat('#202022'), { noDecal: true }], [body, bodyMat('#2a2a2c'), { noDecal: true }], [tin, M.tin], [marks, bodyMat('#e8e8e2'), { noDecal: true }]]
  },
  // E750WB control transformer (162 x 176 x 178 mm, PartsLib). V6, as fitted (shop photos 2026-11-05): a black foot plate
  // with four slotted feet on the subplate, the laminated core and black coil standing on it, and everything on the front:
  // the primary terminal board (four screws in a column) on the left, the two-pole primary fuse block in the middle (fuse
  // clips above, the line terminals with their red ring lugs below), the one-pole secondary fuse block and the secondary
  // board on the right. The nameplate is on the left side. V5 drew the sheet 3 face: boards at the top and bottom.
  E750WB: (g) => {
    const black = bodyMat('#19191b'), board = bodyMat('#232325'), clipM = M.tin
    const foot = [blk(g, -0.02, 1.02, 0.0, 1.0, 0, 0.02, 0.001)], slots = []
    for (const [u, v] of [[0.06, 0.08], [0.94, 0.08], [0.06, 0.92], [0.94, 0.92]]) slots.push(blk(g, u - 0.04, u + 0.04, v - 0.012, v + 0.012, 0.02, 0.024, 0))
    // core (laminations, end brackets) and coil
    const core = [blk(g, 0.04, 0.96, 0.03, 0.97, 0.02, 0.86, 0.004)], coil = [blk(g, 0.22, 0.78, 0.0, 1.0, 0.04, 0.8, 0.012)]
    const brk = [blk(g, 0.02, 0.06, 0.03, 0.97, 0.02, 0.9, 0.001), blk(g, 0.94, 0.98, 0.03, 0.97, 0.02, 0.9, 0.001)]
    // primary board, left: base strip and barriers between its four screws
    const boards = [blk(g, 0.03, 0.28, 0.24, 0.72, 0.86, 0.95, 0.002), blk(g, 0.78, 0.98, 0.26, 0.72, 0.86, 0.95, 0.002)]
    for (const v of [0.29, 0.39, 0.485, 0.575, 0.67]) boards.push(blk(g, 0.06, 0.28, v - 0.006, v + 0.006, 0.95, 0.985, 0.0005))
    for (const v of [0.31, 0.43, 0.6, 0.7]) boards.push(blk(g, 0.8, 0.98, v - 0.006, v + 0.006, 0.95, 0.985, 0.0005))
    // fuse blocks: two-pole primary (centre) and one-pole secondary (right of centre), clips above and below each fuse
    const fb = [blk(g, 0.33, 0.6, 0.12, 0.66, 0.86, 0.93, 0.002), blk(g, 0.63, 0.76, 0.2, 0.68, 0.86, 0.93, 0.002)]
    const clips = []
    // V10: each fuse sits between a pair of spring clips 30 mm apart (a 38 mm cartridge held by its end caps); the
    // wire terminals are below the lower clips (shop photo: red ring lugs under the primary block's lower screws)
    for (const [u, v] of [[0.42, 0.56], [0.54, 0.56], [0.695, 0.58]]) clips.push(blk(g, u - 0.035, u + 0.035, v - 0.035, v + 0.035, 0.93, 0.99, 0.0006))
    for (const [u, v] of [[0.42, 0.38], [0.54, 0.38], [0.695, 0.415]]) for (const s of [-1, 1]) for (const k of [-1, 1]) clips.push(blk(g, u + k * 0.036 - 0.006, u + k * 0.036 + 0.006, v + s * 0.086 - 0.03, v + s * 0.086 + 0.03, 0.93, 1.0, 0.0004))
    return [[foot, black, { noDecal: true }], [slots, M.hole, { noDecal: true }], [core, MAT.steel({ color: [0.16, 0.16, 0.17], roughness: 0.55, finish: 'brushed' }), { noDecal: true }],
      [coil, black, { noDecal: true }], [brk, bodyMat('#141415'), { noDecal: true }], [boards, board, { noDecal: true }], [fb, bodyMat('#151517'), { noDecal: true }], [clips, clipM, { noDecal: true }]]
  },
  // GLG DIN isolator: slim housing, two levels of plug-in screw terminals top and bottom, label front
  // V6 (shop photos): the plugs are light green, not dark; the bands match the terminal rows (5-8 outer top, 1-4 inner
  // top, 9-12 inner bottom, 13-16 outer bottom) and the face drawn by tools/make_faces.py (orange and blue number labels)
  // V7 (Bob: the 9-12 wires ran down through the 13-16 plug): the tiers are stepped as on the real housing. Each inner
  // plug (1-4 top, 9-12 bottom) stands well in front of the outer plug beside it (front 97 % vs 75 % of the depth), so its
  // wires leave its end face in front of the outer plug and run past it, not through it.
  GLG: (g) => [
    [[blk(g, 0.02, 0.98, 0.175, 0.83, 0, 1, 0.0015), blk(g, 0.03, 0.97, 0.02, 0.98, 0, 0.5, 0.001)], g.bm],
    [[blk(g, 0.06, 0.94, 0.0, 0.105, 0.5, 0.75, 0.001), blk(g, 0.06, 0.94, 0.935, 1.0, 0.5, 0.75, 0.001), blk(g, 0.06, 0.94, 0.105, 0.175, 0.5, 0.97, 0.001), blk(g, 0.06, 0.94, 0.83, 0.935, 0.5, 0.97, 0.001)], bodyMat('#6ec478')],
  ],
  // Moxa NAT-102: slim metal housing, supply plug on top, two RJ45 on the front
  NAT102: (g) => [
    [[blk(g, 0.02, 0.98, 0.04, 0.98, 0, 1, 0.0015)], g.bm],
    [[blk(g, 0.15, 0.85, 0, 0.05, 0.62, 0.9, 0.0008)], bodyMat('#1f7a3a'), { noDecal: true }],
  ],
  // ILSCO D167-14: tin-plated bar on two insulators, a clamp screw for each tap (ILSCO N0017-00)
  D167: (g) => {
    const sc = []; for (const [u, v] of Object.values(g.lay.pins)) sc.push(...screwHead(g.x0 + u * g.w, g.yT - v * g.h, g.z1 + 0.0004, 0.0028))
    return [[[blk(g, 0.0, 1, 0.03, 0.97, 0.35, 1, 0.0008)], M.tin], [[blk(g, -0.1, 1.1, 0, 0.06, 0, 0.4, 0.001), blk(g, -0.1, 1.1, 0.94, 1, 0, 0.4, 0.001)], bodyMat('#2b2c2e'), { noDecal: true }], [sc, M.screw, { noDecal: true }]]
  },
  // 1769-L30ER: 1769 housing, black front door over the upper half, latches top and bottom (1769-TD005; 55 x 132 mm, PartsLib)
  L30ER: (g) => [
    [[blk(g, 0.02, 0.98, 0.06, 0.94, 0, 0.55, 0.0015), blk(g, 0.01, 0.99, 0.06, 0.94, 0.4, 0.97, 0.003)], g.bm],
    [[blk(g, 0.06, 0.94, 0.1, 0.5, 0.96, 1.0, 0.001)], bodyMat('#2b2d30')],
    [[blk(g, 0.3, 0.7, 0, 0.06, 0.1, 0.6, 0.001), blk(g, 0.3, 0.7, 0.94, 1, 0.1, 0.6, 0.001)], bodyMat('#8a8c8a'), { noDecal: true }],
  ],
}
function driveCoversOff(o, x0, w, yT, h, z1) {
  // wiring steps: control module front cover and power terminal guard off (520-UM001 p.32), terminal blocks exposed
  const cov = new THREE.Group(), recess = [], sc = [], lab_ = []
  const P_ = (u, v) => [x0 + u * w, yT - v * h]
  const [cx0, cy0] = P_(0.08, 0.325), [cx1, cy1] = P_(0.92, 0.4)
  recess.push(box(cx1 - cx0, cy0 - cy1, 0.004, (cx0 + cx1) / 2, (cy0 + cy1) / 2, z1 + 0.0012, 0.001))
  const [px0, py0] = P_(0.08, 0.86), [px1, py1] = P_(0.86, 0.985)
  recess.push(box(px1 - px0, py0 - py1, 0.004, (px0 + px1) / 2, (py0 + py1) / 2, z1 + 0.0012, 0.001))
  for (const [n, [u, v]] of Object.entries(LAYOUTS.PF525.pins)) { if (n === '4' || n === 'RJ45') continue; const [x, y] = P_(u, v); const big = v > 0.8; lab_.push(box(big ? 0.012 : 0.0048, big ? 0.012 : 0.0062, 0.0024, x, y, z1 + 0.0028, 0.0006)); sc.push(...screwHead(x, y, z1 + 0.0042, big ? 0.0034 : 0.0016)) }
  cov.add(mesh(recess, bodyMat('#151618')), mesh(lab_, bodyMat('#4a4c50')), mesh(sc, M.screw))
  cov.visible = false; o.add(cov); COVER_OFF.push(cov)
}
function moduleDoorOpen(o, lay, x0, x1, w, yT, h, yc, z1) {
  // 1769 modules: door open in the wiring steps, the terminal block behind it exposed (1769-IN028 p.5, 1769-IN062 p.8)
  const cov = new THREE.Group(), blk = [], sc = []
  const pts = Object.entries(lay.pins).filter(([n]) => !/[a-z]/i.test(n) || /^(OUT|VAC)/.test(n)).map(([, p]) => p)
  const us = pts.map((p) => p[0]), vs = pts.map((p) => p[1])
  const bx0 = x0 + (Math.min(...us) - 0.13) * w, bx1 = x0 + (Math.max(...us) + 0.13) * w, by0 = yT - (Math.min(...vs) - 0.04) * h, by1 = yT - (Math.max(...vs) + 0.04) * h
  blk.push(box(bx1 - bx0, by0 - by1, 0.006, (bx0 + bx1) / 2, (by0 + by1) / 2, z1 + 0.002, 0.001))
  for (const [u, v] of pts) sc.push(...screwHead(x0 + u * w, yT - v * h, z1 + 0.0052, 0.0019))
  const door = box(w * 0.92, h * 0.62, 0.0015, 0, 0, 0, 0.0006); door.rotateY(-1.2); door.translate(x1 + w * 0.2, yc - h * 0.05, z1 + w * 0.36)
  cov.add(mesh(blk, bodyMat('#2b2d30')), mesh(sc, M.screw), mesh([door], bodyMat('#b9bbb8')))
  cov.visible = false; o.add(cov); COVER_OFF.push(cov)
}
// a device from its maker's STEP model: real shape and size, centred on its sheet 3 rectangle, back on the subplate
function addVendorDevice(d, fit, parent, r) {
  const v = vendor(fit.model, fit.rot, fit.scale)
  const xc = SX((r.X0 + r.X1) / 2 + (fit.dx ?? 0)), yc = SY((r.Yt + r.Yb) / 2 + (fit.dy ?? 0))
  const style = { body: bodyMat(d.body ?? '#cccccc', d.metal), ...(VSTYLE[fit.model] ?? {}) }
  const o = new THREE.Group(); o.name = d.tag
  // V5: the solids that come off for wiring (fit.cover) go into their own group, shown only while the covers are on
  const isCover = coverTest(fit.cover)
  const vg = fit.cover ? vendorGroup(v, style, { split: (p, g, i) => isCover(p, g, i) ? 'cover' : 'all' }) : vendorGroup(v, style)
  let cg = null
  if (fit.cover) {
    const parts = vg; cg = parts.cover ?? new THREE.Group()
    const main = parts.all ?? new THREE.Group()
    if (fit.cover.cut) for (const cut of fit.cover.cut) for (const m of [...main.children]) {
      // a cut moves the triangles inside a box to the cover (PF525: the power terminal guard is part of the front shell)
      const [keep, off] = splitByBox(m.geometry, cut)
      if (off) { m.geometry = keep; const c = new THREE.Mesh(off, m.material); c.castShadow = c.receiveShadow = true; cg.add(c) }
    }
    return addVendorDevice2(d, fit, parent, r, v, o, main, cg, xc, yc)
  }
  return addVendorDevice2(d, fit, parent, r, v, o, vg, null, xc, yc)
}
// which solids belong to a removable cover: part indices, or every solid inside a box (mm, the model after rot)
function coverTest(c) {
  if (!c) return () => false
  return (p, g, i) => {
    if (c.parts) return c.parts.includes(i)
    g.computeBoundingBox(); const b = g.boundingBox, [lo, hi] = c.box
    return b.min.x * 1000 >= lo[0] && b.min.y * 1000 >= lo[1] && b.min.z * 1000 >= lo[2] && b.max.x * 1000 <= hi[0] && b.max.y * 1000 <= hi[1] && b.max.z * 1000 <= hi[2]
  }
}
// split an indexed geometry: triangles whose centre lies in the box [[x0,y0,z0],[x1,y1,z1]] (mm, model after rot, before placing)
function splitByBox(g, { box: [lo, hi] }) {
  const p = g.attributes.position.array, ix = g.index.array, A = [], B = []
  for (let t = 0; t < ix.length; t += 3) {
    let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { const v = ix[t + k] * 3; cx += p[v]; cy += p[v + 1]; cz += p[v + 2] }
    cx = cx / 3 * 1000; cy = cy / 3 * 1000; cz = cz / 3 * 1000
    ;(cx >= lo[0] && cx <= hi[0] && cy >= lo[1] && cy <= hi[1] && cz >= lo[2] && cz <= hi[2] ? B : A).push(ix[t], ix[t + 1], ix[t + 2])
  }
  if (!B.length) return [g, null]
  const mk = (I) => { const n = new THREE.BufferGeometry(); n.setAttribute('position', g.attributes.position); n.setAttribute('normal', g.attributes.normal); n.setIndex(I); return n }
  return [mk(A), mk(B)]
}
function addVendorDevice2(d, fit, parent, r, v, o, vg, cg, xc, yc) {
  // rail adapters under the device (PTFIX-NS35A): they take the rail, the device clips on top of them
  let lift = 0
  if (fit.adapter && hasModel(fit.adapter.model)) {
    const va = vendor(fit.adapter.model, fit.adapter.rot ?? []), n = fit.adapter.n
    const offs = []; for (let i = 0; i < n; i++) offs.push(V3(xc - v.size.x / 2 + (i + 0.5) * v.size.x / n - va.center.x, yc - va.center.y, PZ - va.box.min.z))
    o.add(mesh(mergeIdx(va.list.map((l) => l.geo), offs), bodyMat('#4d4f52')))
    lift = va.size.z
  }
  vg.position.set(xc - v.center.x, yc - v.center.y, PZ + lift - v.box.min.z)
  o.add(vg)
  if (cg) { cg.position.copy(vg.position); cg.userData.noProbe = true; o.add(cg); (fit.xray ? COVER_XRAY : COVER_ON).push(cg) }
  const dep = v.size.z + lift, z0 = PZ, z1 = PZ + dep
  const x0 = xc - v.size.x / 2, x1 = xc + v.size.x / 2, yT = yc + v.size.y / 2, yB = yc - v.size.y / 2
  // the sheet 3 face image laid onto the model's front surfaces (labels, LEDs, printed terminal numbers)
  if (d.tex && G.TEX[d.tex] && fit.decal !== false) {
    const rect = { x0: SX(r.X0), x1: SX(r.X1), yT: SY(r.Yt), yB: SY(r.Yb) }, tint = d.face === 'line' ? d.body : undefined
    // with a cover: no image on what is behind it (the cavity it leaves would show the cover's printing)
    const inBox = ([lo, hi], p) => p.x >= lo[0] && p.x <= hi[0] && p.y >= lo[1] && p.y <= hi[1]
    // V6: a cover given as part indices (the 1769 doors) keeps the image off the area its own outline covers
    let partBox = null
    if (cg && fit.cover.parts) { const b = new THREE.Box3(); cg.traverse((m) => { if (m.isMesh) { m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox) } }); if (!b.isEmpty()) partBox = [[b.min.x * 1000, b.min.y * 1000], [b.max.x * 1000, b.max.y * 1000]] }
    const skip = cg && fit.cover.box ? (cx, cy) => { const p = { x: (cx - vg.position.x) * 1000, y: (cy - vg.position.y) * 1000 }; return inBox(fit.cover.box, p) || (fit.cover.cut ?? []).some((c) => inBox(c.box, p)) }
      : partBox ? (cx, cy) => inBox(partBox, { x: (cx - vg.position.x) * 1000, y: (cy - vg.position.y) * 1000 }) : null
    // V6 decalSplit: parts of the face that belong to a cover the model does not separate (PF525: the white lower front
    // cover the shop takes off, shop photo 2026-11-05): that part of the image shows only while the covers are on
    const inSplit = fit.decalSplit ? (cx, cy) => fit.decalSplit.some((b) => inBox(b, { x: (cx - vg.position.x) * 1000, y: (cy - vg.position.y) * 1000 })) : null
    const dc = faceDecal(vg, rect, d.tex, { tint, skip: inSplit ? (cx, cy) => (skip?.(cx, cy) ?? false) || inSplit(cx, cy) : skip })
    if (dc) { dc.userData.noProbe = true; o.add(dc) }
    if (inSplit) { const ds = faceDecal(vg, rect, d.tex, { tint, skip: (cx, cy) => (skip?.(cx, cy) ?? false) || !inSplit(cx, cy) }); if (ds) { ds.userData.noProbe = true; ds.userData.decal = true; o.add(ds); (fit.xray ? COVER_XRAY : COVER_ON).push(ds) } }
    // the decal on a cover comes off with it
    if (cg && fit.decalCover) { const dcc = faceDecal(cg, rect, d.tex, { tint }); if (dcc) { dcc.position.copy(cg.position).negate(); dcc.traverse((m) => { m.userData.decal = true }); cg.add(dcc) } }
  }
  const lay = LAYOUTS[DEVICE_LAYOUT[d.tag]]
  parent.add(o)
  const dv = DEV[d.tag] = { d, r, x0, x1, yT, yB, xc, yc, z0, z1, obj: o, lay, vendor: vg, fit, v, landings: {} }
  // V5: the terminal blocks behind the covers, built where the manuals put them, in the cavity the cover leaves
  if (DEVICE_LAYOUT[d.tag] === 'PF525') pf525Blocks(dv)
  if (['PB2', 'OW16'].includes(DEVICE_LAYOUT[d.tag]) && lay) rtbBlock(dv)
  if (DEVICE_LAYOUT[d.tag] === 'L30ER') l3Ports(dv)
  // V7: landings measured on the maker's model (model mm): tip inside the clamp, mouth at the opening
  for (const [n, L] of Object.entries(fit.landings ?? {})) dv.landings[n] = { tip: mmPt(dv, ...L.tip), mouth: mmPt(dv, ...L.mouth), e: L.e }
  o.traverse((m) => { if (m.isMesh) { m.userData.tag = d.tag; pickables.push(m) } })
  return DEV[d.tag]
}
// depth of the real surface under a terminal: a ray from the front onto the vendor model (cached per device and point)
const RAYC = new THREE.Raycaster()
function surfaceZ(dv, x, y, fallback) {
  if (!dv.vendor) return fallback
  dv.rayMeshes ??= dv.vendor.children.filter((m) => m.isMesh).map((m) => { const t = new THREE.Mesh(m.geometry); t.position.copy(dv.vendor.position); t.updateMatrixWorld(true); return t })
  RAYC.set(V3(x, y, dv.z1 + 0.05), V3(0, 0, -1))
  const hit = RAYC.intersectObjects(dv.rayMeshes, false)[0]
  if (!hit) return fallback
  return clamp(hit.point.z - 0.0012, dv.z0 + (dv.z1 - dv.z0) * 0.25, dv.z1)
}

// ------------------------------------------------------------------ V5: where a wire really goes into its terminal
// A device's triangles (machine coordinates, covers off), and rays against them: double-sided, nearest hit.
function soupOf(dv) {
  if (dv.soup) return dv.soup
  lab.machine.updateMatrixWorld(true)
  const inv = new THREE.Matrix4().copy(lab.machine.matrixWorld).invert(), list = []
  let n = 0
  const walk = (o) => { if (o.userData.noProbe) return; if (o.isMesh && o.geometry.index !== undefined) { list.push(o); n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 } for (const c of o.children) walk(c) }
  walk(dv.obj)
  const T = new Float32Array(n * 9), v = V3()
  let k = 0
  for (const o of list) {
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), p = o.geometry.attributes.position, ix = o.geometry.index
    const cnt = ix ? ix.count : p.count
    for (let i = 0; i < cnt; i++) { v.fromBufferAttribute(p, ix ? ix.getX(i) : i).applyMatrix4(m); T[k++] = v.x; T[k++] = v.y; T[k++] = v.z }
  }
  return (dv.soup = T)
}
// the triangles touching a box (machine metres)
function soupIn(T, lo, hi) {
  const out = []
  for (let i = 0; i < T.length; i += 9) {
    let ok = true
    for (let a = 0; a < 3 && ok; a++) { const p = T[i + a], q = T[i + 3 + a], r = T[i + 6 + a]; if (Math.max(p, q, r) < lo[a] || Math.min(p, q, r) > hi[a]) ok = false }
    if (ok) for (let j = 0; j < 9; j++) out.push(T[i + j])
  }
  return new Float32Array(out)
}
// nearest hit distance along a unit ray (o, d) or Infinity (Moller-Trumbore, both faces)
function rayT(T, o, d, tMax = Infinity) {
  let best = tMax
  for (let i = 0; i < T.length; i += 9) {
    const e1x = T[i + 3] - T[i], e1y = T[i + 4] - T[i + 1], e1z = T[i + 5] - T[i + 2], e2x = T[i + 6] - T[i], e2y = T[i + 7] - T[i + 1], e2z = T[i + 8] - T[i + 2]
    const px = d.y * e2z - d.z * e2y, py = d.z * e2x - d.x * e2z, pz = d.x * e2y - d.y * e2x
    const det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-14) continue
    const inv = 1 / det, tx = o.x - T[i], ty = o.y - T[i + 1], tz = o.z - T[i + 2]
    const u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x
    const w = (d.x * qx + d.y * qy + d.z * qz) * inv; if (w < 0 || u + w > 1) continue
    const t = (e2x * qx + e2y * qy + e2z * qz) * inv; if (t > 1e-7 && t < best) best = t
  }
  return best
}
// outward unit axis of each entry, and the two axes across it
const OUT_AX = { t: [V3(0, 1, 0), V3(1, 0, 0), V3(0, 0, 1)], b: [V3(0, -1, 0), V3(1, 0, 0), V3(0, 0, 1)], l: [V3(-1, 0, 0), V3(0, 1, 0), V3(0, 0, 1)], f: [V3(0, 0, 1), V3(1, 0, 0), V3(0, 1, 0)] }
const HOLES = []                     // dark entry marks where a modelled part has no opening of its own (catalogue-shape parts)
// Find the wire opening of a terminal on a device's own geometry. pin: the clamp (machine metres; z = the screw or face).
// Returns { tip: end of the conductor, mouth: where the insulation stops (the entry of the clamp), a: outward axis,
// clear: a point straight out of the device, found: true when the opening was found in the model }.
function landing(dv, pin, e) {
  const [a, U, W] = OUT_AX[e] ?? OUT_AX.f, T = soupOf(dv)
  const bb = new THREE.Box3(V3(dv.x0, dv.yB, dv.z0), V3(dv.x1, dv.yT, dv.z1))
  const corner = V3(a.x > 0 ? bb.max.x : bb.min.x, a.y > 0 ? bb.max.y : bb.min.y, a.z > 0 ? bb.max.z : bb.min.z)
  const sOut = a.dot(corner), sP = a.dot(pin), uP = U.dot(pin), wP = W.dot(pin)
  const at = (u, w, s) => U.clone().multiplyScalar(u).addScaledVector(W, w).addScaledVector(a, s)
  const front = e === 'f'
  // the triangles near this terminal only
  const R = front ? 0.006 : 0.012
  const lo = at(uP - R, wP - (front ? R : 0.03), Math.min(sP, sOut) - 0.016), hi = at(uP + R, wP + (front ? R : 0.004), sOut + 0.03)
  const L = soupIn(T, [Math.min(lo.x, hi.x), Math.min(lo.y, hi.y), Math.min(lo.z, hi.z)], [Math.max(lo.x, hi.x), Math.max(lo.y, hi.y), Math.max(lo.z, hi.z)])
  const nd = a.clone().negate()
  const sHit = (u, w) => { const t = rayT(L, at(u, w, sOut + 0.02), nd); return t === Infinity ? -Infinity : sOut + 0.02 - t }
  const hitWithin = (p, d, r) => rayT(L, p, d, r) < r
  const step = front ? 0.0004 : 0.0005, cells = new Map()
  // catalogue-shape parts have no openings modelled: straight to the entry behind the screw (below)
  const nu = dv.proc ? -1 : front ? 6 : 7, w0 = front ? wP - 0.0025 : Math.max(dv.z0 + 0.001, wP - 0.025), w1 = front ? wP + 0.0025 : wP + 0.0005
  for (let i = -nu; i <= nu; i++) for (let w = w0, j = 0; w <= w1 + 1e-9; w += step, j++) {
    const u = uP + i * step, s = sHit(u, w)
    let ok
    if (front) {
      // a hole in the face: deeper than 2.5 mm, walls all round it
      ok = s < sP - 0.0025
      if (ok) { const q = at(u, w, s + 0.001); ok = [U, U.clone().negate(), W, W.clone().negate()].every((d) => hitWithin(q, d, 0.005)) }
    } else {
      // reaches the clamp, and at the clamp the conductor is boxed in: walls either side, the clamp in front, the body behind
      ok = s <= sP + 0.0015
      if (ok) { const q = at(u, w, sP); ok = hitWithin(q, U, 0.009) && hitWithin(q, U.clone().negate(), 0.009) && hitWithin(q, W, 0.016) && hitWithin(q, W.clone().negate(), 0.03) }
    }
    if (ok) cells.set(`${i},${j}`, { i, j, u, w, s })
  }
  let res
  if (cells.size) {
    const wTarget = front ? wP : wP - 0.004
    let seed = null, bc = Infinity
    for (const c of cells.values()) { const k = Math.abs(c.u - uP) + 0.5 * Math.abs(c.w - wTarget); if (k < bc) { bc = k; seed = c } }
    const seen = new Set([`${seed.i},${seed.j}`]), q = [seed], grp = []
    while (q.length) { const c = q.pop(); grp.push(c); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${c.i + di},${c.j + dj}`; if (cells.has(k) && !seen.has(k)) { seen.add(k); q.push(cells.get(k)) } } }
    const uc = grp.reduce((t, c) => t + c.u, 0) / grp.length, wc = grp.reduce((t, c) => t + c.w, 0) / grp.length
    // half-size of the opening across it, for the mouth probe
    const ru = Math.max(0.0012, (Math.max(...grp.map((c) => c.u)) - Math.min(...grp.map((c) => c.u))) / 2 + step), rw = Math.max(0.0012, (Math.max(...grp.map((c) => c.w)) - Math.min(...grp.map((c) => c.w))) / 2 + step)
    const s = sHit(uc, wc)
    let tipS = front ? s + 0.0004 : (s === -Infinity ? sP - 0.003 : clamp(s + 0.0005, sP - 0.005, sP + 0.001))
    const around = [[ru + 0.0008, 0], [-ru - 0.0008, 0], [0, rw + 0.0008], [0, -rw - 0.0008]].map(([du, dw]) => sHit(uc + du, wc + dw)).filter((x) => x > tipS + 0.001)
    const mouthS = around.length ? Math.min(Math.max(...around), sOut) : Math.min(tipS + 0.007, sOut)
    // a through-hole (box lug): the conductor stops inside the lug, not out of its far side. Walk in from the mouth while
    // the conductor is still boxed in; where it stops being boxed in is the lug's far face.
    if (!front) {
      const boxed = (sv) => { const q = at(uc, wc, sv); return hitWithin(q, U, 0.009) && hitWithin(q, U.clone().negate(), 0.009) && hitWithin(q, W, 0.016) && hitWithin(q, W.clone().negate(), 0.03) }
      let was = false
      for (let sv = mouthS - 0.0005; sv > tipS; sv -= 0.0005) { const b = boxed(sv); if (b) was = true; else if (was) { tipS = sv + 0.0008; break } }
    }
    res = { tip: at(uc, wc, tipS), mouth: at(uc, wc, mouthS), found: true }
  } else {
    // no opening in the model (catalogue-shape parts, or a clamp the maker drew solid): the conductor goes in behind the
    // screw head, through the face the clamp opens on, and that face gets a dark entry mark
    const wc = front ? wP : wP - 0.0035
    const s = sHit(uP, wc), mouthS = s === -Infinity ? sP + 0.004 : Math.max(s, sP + 0.001)
    res = { tip: at(uP, wc, front ? sP - 0.003 : sP - 0.001), mouth: at(uP, wc, mouthS), found: false }
    const hm = new THREE.BoxGeometry(front ? 0.0034 : 0.0036, front ? 0.0034 : 0.0036, 0.0006)
    hm.lookAt(a); hm.translate(...res.mouth.clone().addScaledVector(a, 0.0002).toArray()); (dv.holeGeos ??= []).push(hm)
  }
  return finishLanding(dv, res, e)
}
// an explicit landing (blocks built here, the RCP1 block): add the axis and the way out of the device
function finishLanding(dv, res, e) {
  const [a] = OUT_AX[e] ?? OUT_AX.f
  const corner = V3(a.x > 0 ? dv.x1 : dv.x0, a.y > 0 ? dv.yT : dv.yB, a.z > 0 ? dv.z1 : dv.z0), sOut = a.dot(corner)
  res.a = a
  // straight out of the device: past its outline (or 14 mm off the face for a front entry), then the wire may turn
  // V8: a front entry set deep in its device (the PTFIX feed opening) still comes out past the device's front before it turns
  const outS = e === 'f' ? Math.max(a.dot(res.mouth) + 0.014, sOut + 0.006) : Math.max(sOut, a.dot(res.mouth)) + 0.012
  res.clear = res.mouth.clone().addScaledVector(a, outS - a.dot(res.mouth))
  return res
}
// a block of terminals built from boxes: [x0,x1,y0,y1,z0,z1] in mm in the model's own axes (after rot), placed with it
function mmBox(dv, [ax, bx, ay, by, az, bz], r = 0.0005) {
  const p = dv.vendor.position
  return box((bx - ax) / 1000, (by - ay) / 1000, (bz - az) / 1000, p.x + (ax + bx) / 2000, p.y + (ay + by) / 2000, p.z + (az + bz) / 2000, r)
}
const mmPt = (dv, x, y, z) => V3(dv.vendor.position.x + x / 1000, dv.vendor.position.y + y / 1000, dv.vendor.position.z + z / 1000)
// depth of the model's surface (covers off) at a point, by a ray from the front, in model mm
function backAt(dv, x, y) { const p = mmPt(dv, x, y, 0), t = rayT(soupIn(soupOf(dv), [p.x - 0.002, p.y - 0.002, -1], [p.x + 0.002, p.y + 0.002, 1]), V3(p.x, p.y, dv.z1 + 0.05), V3(0, 0, -1)); return t === Infinity ? null : (dv.z1 + 0.05 - t - dv.vendor.position.z) * 1000 }
// PowerFlex 525 frame D: the control I/O block on the control module under its front cover (two tiers, wires in from
// below, screws from the front; order 520-UM001 p.42), the EtherNet/IP jack beside it, and the power block at the bottom
// of the power module (one row R/L1 S/L2 T/L3 U/T1 V/T2 W/T3, PE DC- DC+ BR- PE below it, wires in from below; p.36).
// Positions in the model's own mm; the blocks themselves are not in Rockwell's model.
function pf525Blocks(dv) {
  const blk = [], sc = [], holes = [], lab_ = [], jack = []
  // the block stands on the module's inner wall, its wire channels in front of the power module's face (z 94 mm), so the
  // control wires drop past it to the bottom of the drive as they do on the real drive
  const back = backAt(dv, -36, 30) ?? 94, zb = clamp(back, 94, 96)
  const rear = ['R1', 'R2', 'R5', 'R6', '01', '02', '03', '04', '05', '06', '07', '08', 'C1', 'C2'], fr = ['S1', 'S2', 'S+', '11', '12', '13', '14', '15', '16', '17', '18', '19']
  const X0 = -61, P = 3.5
  // rear tier (upper row): y 31..43, front at zb+8; front tier (lower row): y 19..29, front at zb+15
  blk.push(mmBox(dv, [X0 - 1.5, X0 + rear.length * P + 1.5, 31, 43, zb, zb + 8]), mmBox(dv, [X0 - 1.5, X0 + fr.length * P + 1.5, 19, 30, zb, zb + 15]))
  rear.forEach((n, i) => {
    const x = X0 + (i + 0.5) * P
    sc.push(...screwHead(...mmPt(dv, x, 39, zb + 8.2).toArray(), 0.0013)); lab_.push(mmBox(dv, [x - 1.4, x + 1.4, 33, 35, zb + 7.9, zb + 8.3], 0.0001))
    holes.push(mmBox(dv, [x - 1.1, x + 1.1, 30.6, 31.1, zb + 1.5, zb + 5.5], 0))
    dv.landings[n] = { tip: mmPt(dv, x, 38, zb + 3.5), mouth: mmPt(dv, x, 31, zb + 3.5), e: 'b' }
  })
  fr.forEach((n, i) => {
    const x = X0 + (i + 0.5) * P
    sc.push(...screwHead(...mmPt(dv, x, 26, zb + 15.2).toArray(), 0.0013)); lab_.push(mmBox(dv, [x - 1.4, x + 1.4, 21, 23, zb + 14.9, zb + 15.3], 0.0001))
    holes.push(mmBox(dv, [x - 1.1, x + 1.1, 18.6, 19.1, zb + 9, zb + 13], 0))
    dv.landings[n] = { tip: mmPt(dv, x, 25, zb + 11), mouth: mmPt(dv, x, 19, zb + 11), e: 'b' }
  })
  dv.landings['4'] = dv.landings['04']
  // EtherNet/IP jack to the right of the block, latch down
  jack.push(mmBox(dv, [-8, 6, 20, 36, zb, zb + 14], 0.0008)); holes.push(mmBox(dv, [-5.8, 3.8, 19.6, 20.1, zb + 2.5, zb + 11], 0))
  dv.landings.RJ45 = { tip: mmPt(dv, -1, 27, zb + 7), mouth: mmPt(dv, -1, 20, zb + 7), e: 'b', plug: true }
  // power block: base and terminal row at the bottom of the power module (behind the guard, which comes off with the cover)
  // V6, from the shop photo of DRV1/DRV2 (2026-11-05): the upper row R/L1 S/L2 T/L3 U/T1 V/T2 W/T3 at a 15.2 mm pitch
  // under its printed label strip; the lower row 25.8 mm below it, set back, and offset right: PE under T/L3, then DC-,
  // DC+, BR, and a second PE right of W/T3 (the shop lands the green ground there). The upper row's wires drop past the
  // front of the lower row, as in the photo.
  const pb = backAt(dv, 0, -100) ?? 45, zp = Math.max(40, Math.min(70, pb))
  const pw = ['L1', 'L2', 'L3', 'T1', 'T2', 'T3'], pl = [['PE2', -14.8], ['DC-', -3.0], ['DC+', 11.7], ['BR+', 26.3], ['PE', 41.0]]
  // the drive's front face (z 94 mm) runs down to y -88 mm; the terminals sit in the opening below it, the legend on the
  // front's lower edge just above them. The fan is on the underside (seen in the photo because it was taken from below).
  const yU = -95, yL = yU - 20.5
  blk.push(mmBox(dv, [-50, 49, yU - 11, yU + 7, zp, zp + 20], 0.001), mmBox(dv, [-23, 49, Math.max(-119.5, yL - 8.5), yU - 11, zp, zp + 12], 0.001))
  // separators between the upper terminals
  for (let i = 0; i <= 6; i++) blk.push(mmBox(dv, [-49.6 + i * 15.2, -48.4 + i * 15.2, yU - 9, yU + 8, zp + 20, zp + 24], 0.0002))
  pw.forEach((n, i) => {
    const x = -42 + i * 15.2
    sc.push(...screwHead(...mmPt(dv, x, yU, zp + 20.3).toArray(), 0.0026)); holes.push(mmBox(dv, [x - 3, x + 3, yU - 11.6, yU - 11.1, zp + 12.5, zp + 18.5], 0))
    dv.landings[n] = { tip: mmPt(dv, x, yU, zp + 15.5), mouth: mmPt(dv, x, yU - 11.5, zp + 15.5), e: 'b' }
  })
  pl.forEach(([n, x]) => {
    const yb = Math.max(-119.5, yL - 8.5)
    sc.push(...screwHead(...mmPt(dv, x, yL, zp + 12.3).toArray(), 0.0024)); holes.push(mmBox(dv, [x - 2.6, x + 2.6, yb - 0.6, yb - 0.1, zp + 3, zp + 9], 0))
    dv.landings[n] = { tip: mmPt(dv, x, yL, zp + 6), mouth: mmPt(dv, x, yb - 0.5, zp + 6), e: 'b' }
  })
  dv.landings['BR-'] = dv.landings['BR+']
  // V9: the control wires and the Ethernet cord do not hang down the middle of the drive, over the legend and the power
  // terminals (V8). Below the control module each one crosses to the left edge of the drive's front and runs down beside
  // the power block in its own place: two across, stacked forwards; the cord outermost.
  {
    const usedT = new Set()
    for (const s of G.SEGMENTS) for (const e of [s.from, s.to, ...(s.cores ?? []).flatMap((k) => [k.from, k.to])]) if (e?.dev === dv.d.tag) { const t = String(e.term ?? '').trim(); const c = dv.landings[t] ? t : t.replace(/\s*\(.*\)\s*$/, '').trim(); usedT.add(c === '4' ? '04' : c) }
    let i = 0
    for (const n of [...rear, ...fr, 'RJ45']) {
      if (!usedT.has(n)) continue
      const Ls = dv.landings[n], x = (Ls.tip.x - dv.vendor.position.x) * 1000, cord = n === 'RJ45'
      const xL = cord ? -61.5 : -56.5 + (i % 2) * 3.2, zL = cord ? 101 : 98.5 + Math.floor(i / 2) * 3.2
      if (!cord) i++
      Ls.via = [mmPt(dv, x, -18, zL), mmPt(dv, xL, -23 - Math.abs(x - xL) * 0.6, zL)]
      Ls.clear = V3(dv.vendor.position.x + xL / 1000, dv.yB - 0.012, dv.vendor.position.z + zL / 1000)
    }
  }
  const g = new THREE.Group()
  // the two PE screws are green, as fitted
  const pe = []; for (const [n, x] of pl) if (/^PE/.test(n)) pe.push(...screwHead(...mmPt(dv, x, yL, zp + 12.6).toArray(), 0.0025))
  g.add(mesh(blk, bodyMat('#2a2b2e')), mesh(sc, M.screw), mesh(lab_, bodyMat('#e9e9e4')), mesh(holes, M.hole), mesh(jack, M.rj), mesh(pe, MAT.steel({ color: [0.12, 0.54, 0.24], roughness: 0.35 })))
  // the printed legend over the upper row, as on the drive: R/L1 S/L2 T/L3 black on white, U/T1 V/T2 W/T3 white on black, Motor
  const legend = canvasTex(1024, 80, (c, cw, ch) => {
    c.fillStyle = '#111'; c.fillRect(0, 0, cw, ch)
    const cell = cw * 15.2 / 99, names = ['R/L1', 'S/L2', 'T/L3', 'U/T1', 'V/T2', 'W/T3']
    c.font = `700 ${Math.round(ch * 0.62)}px Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
    names.forEach((t, i) => { const x0 = i * cell; if (i < 3) { c.fillStyle = '#ecebe6'; c.fillRect(x0 + 3, 6, cell - 6, ch - 12) } c.fillStyle = i < 3 ? '#111' : '#f2f2ee'; c.fillText(t, x0 + cell / 2, ch / 2 + 2) })
    c.fillStyle = '#f2f2ee'; c.font = `700 ${Math.round(ch * 0.42)}px Arial, sans-serif`; c.fillText('Motor', 6 * cell + (cw - 6 * cell) / 2, ch / 2)
  })
  const lp = mmPt(dv, -0.5, -84.5, 94.25)
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.099, 0.0068), MAT.plastic({ color: '#ffffff', map: legend, roughness: 0.5, finish: null }))
  lm.position.copy(lp); g.add(lm)
  dv.obj.add(g)
}
// 1769 removable terminal block behind the door (1769-IN028 p.5, 1769-IN062 p.8): a dark block in the case's terminal
// recess, a screw and pressure plate at each terminal, the wire in from the front under the plate
function rtbBlock(dv) {
  const lay = dv.lay, r = dv.r
  const fx0 = SX(r.X0), fx1 = SX(r.X1), fyT = SY(r.Yt), fyB = SY(r.Yb)
  const pts = Object.entries(lay.pins).filter(([n]) => !/[a-z]/i.test(n) || /^(OUT|VAC)/.test(n))
  const xs = pts.map(([, p]) => fx0 + p[0] * (fx1 - fx0)), ys = pts.map(([, p]) => fyT - p[1] * (fyT - fyB))
  const bx0 = Math.min(...xs) - 0.0065, bx1 = Math.max(...xs) + 0.0065, by0 = Math.max(...ys) + 0.0055, by1 = Math.min(...ys) - 0.0055
  // the recess behind the door: model surface at the block centre with the door off
  // the front-most of a grid of rays over the block area (one ray can slip through a vent or gap)
  // V6: a recess floor measured on the finished model (mm from the back) wins over the ray grid
  const zb = dv.fit?.rtbFloor ? dv.z0 + dv.fit.rtbFloor / 1000 : clamp((() => {
    let best = -Infinity
    for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.15, 0.5, 0.85]) {
      const p = V3(bx0 + (bx1 - bx0) * fx, by1 + (by0 - by1) * fy, dv.z1 + 0.05), t = rayT(soupIn(soupOf(dv), [p.x - 0.002, p.y - 0.002, -1], [p.x + 0.002, p.y + 0.002, 1]), p, V3(0, 0, -1))
      if (t !== Infinity) best = Math.max(best, p.z - t)
    }
    return best === -Infinity ? dv.z1 - 0.012 : best
  })(), dv.z0 + 0.03, dv.z1 - 0.002)
  // the block's face is the surface the door covered: a dark terminal block face 2 mm proud of it
  const front = zb + 0.0018
  const blk = [box(bx1 - bx0, by0 - by1, 0.0026, (bx0 + bx1) / 2, (by0 + by1) / 2, zb + 0.0005, 0.0008)], sc = [], plate = [], holes = []
  pts.forEach(([n, p], i) => {
    const x = xs[i], y = ys[i]
    plate.push(box(0.0058, 0.0052, 0.0012, x, y, front + 0.0006, 0.0003)); sc.push(...screwHead(x, y, front + 0.0014, 0.0017))
    holes.push(box(0.0044, 0.0016, 0.0008, x, y - 0.0034, front + 0.0004, 0))
    // V7 rtbEntry 'b' (Bob: on the OW16 the wires always come in from the bottom): under the pressure plate from below,
    // then straight down the face of the block, clear of the screws under it, and out of the bottom of the module
    dv.landings[n] = dv.fit?.rtbEntry === 'b'
      ? { tip: V3(x, y - 0.0008, front - 0.0012), mouth: V3(x, y - 0.0042, front + 0.0042), e: 'b' }
      : { tip: V3(x, y - 0.0012, front - 0.0015), mouth: V3(x, y - 0.0034, front + 0.0012), e: 'f' }
  })
  // V8: below its column every wire takes its own lane out of the module. V7 ran all the wires of a column down one line,
  // drawn as a single wire, and the OW16's right-hand column went out through the floor of Rockwell's housing. The lanes
  // are in the open wire channel beside the block where the fit names one (rtbExit: fractions across the module, measured
  // on the model), else side by side under the block; three layers deep, inside the recess the door closes over.
  if (dv.fit?.rtbEntry === 'b') {
    // the column furthest from the channel takes the far lanes, so its wires cross under the nearer column's
    const ex = dv.fit.rtbExit, order = pts.map(([n], i) => i).sort((a, b) => xs[b] - xs[a] || ys[a] - ys[b]), nL = order.length
    order.forEach((i, k) => {
      const Ls = dv.landings[pts[i][0]], x = xs[i], col = ys.filter((_, j) => Math.abs(xs[j] - x) < 0.001).sort((a, b) => a - b)
      // down the column in front of the screws: nine places (three across, three deep) so no two wires share a line
      const j = col.indexOf(ys[i]), xr = x + (Math.floor(j / 3) % 3 - 1) * (col.length > 6 ? 0.002 : 0), zRun = front + 0.005 + (j % 3) * 0.003
      const xLane = ex ? fx0 + (ex[0] + (ex[1] - ex[0]) * (Math.floor(k / 3) / Math.max(1, Math.ceil(nL / 3) - 1))) * (fx1 - fx0) : x + (k - (nL - 1) / 2) * 0.0036
      const yTurn = Math.min(col[0] - 0.0065, Ls.tip.y - 0.0215), dx = Math.abs(xLane - x), yPop = Ls.tip.y - 0.0235
      Ls.via = [...(yPop > yTurn + 0.004 ? [V3(xr, yPop, zRun)] : []), V3(xr, yTurn, zRun), V3(xLane, yTurn - 0.004 - dx * 0.25, zRun)]
      Ls.clear = V3(xLane, dv.yB - 0.012, zRun)
    })
  }
  // names for the same screws (PB2: '+24V DC' is terminal 3, 'DC COM' 4, 'FG / GND' 5)
  for (const [n, p] of Object.entries(lay.pins)) if (!dv.landings[n]) { const i = pts.findIndex(([, q]) => q[0] === p[0] && q[1] === p[1]); if (i >= 0) dv.landings[n] = dv.landings[pts[i][0]] }
  const g = new THREE.Group(); g.add(mesh(blk, bodyMat('#2b2d30')), mesh(plate, M.zinc), mesh(sc, M.screw), mesh(holes, M.hole)); dv.obj.add(g)
}
// 1769-L3 controller: the two EtherNet/IP jacks open downwards under the front (sheet 3 face; Rockwell's model leaves
// the jack bodies out with the circuit board, so they are drawn in its openings)
function l3Ports(dv) {
  const jk = [], hl = []
  for (const [n, [u, , zf]] of Object.entries(dv.lay.pins)) {
    const x = dv.x0 + u * (dv.x1 - dv.x0), z = dv.z0 + zf * (dv.z1 - dv.z0)
    jk.push(box(0.0158, 0.016, 0.0138, x, dv.yB + 0.0085, z, 0.0008)); hl.push(box(0.0118, 0.001, 0.0086, x, dv.yB + 0.0004, z, 0))
    dv.landings[n] = { tip: V3(x, dv.yB + 0.009, z), mouth: V3(x, dv.yB + 0.0005, z), e: 'b', plug: true }
  }
  const g = new THREE.Group(); g.add(mesh(jk, M.rj), mesh(hl, M.hole)); dv.obj.add(g)
}
function addDevice(d) {
  const parent = d.at === 'sub1' ? STEP_GROUPS[d.step] : null
  if (!parent) return
  const fit0 = FIT.MODEL_FIT[d.tag]
  if (fit0 && hasModel(fit0.model)) {
    const dv = addVendorDevice(d, fit0, parent, devRect(d))
    tagPlate(d.tag, (dv.r.X0 + dv.r.X1) / 2, Math.max(dv.r.Yb, (Y0 + 0.051 + SH - dv.yB) * 1000) + 9, Math.max(16, Math.min(30, (dv.r.X1 - dv.r.X0) - 2)))
    TAG_PLATES[TAG_PLATES.length - 1].userData.step = d.step
    return
  }
  const r = devRect(d)
  const x0 = SX(r.X0), x1 = SX(r.X1), yT = SY(r.Yt), yB = SY(r.Yb), w = x1 - x0, h = yT - yB, xc = (x0 + x1) / 2, yc = (yT + yB) / 2
  const z0 = d.rail ? RZ : PZ, dep = d.depth / 1000, z1 = z0 + dep
  const o = new THREE.Group(); o.name = d.tag
  const bm = bodyMat(d.body ?? '#cccccc', d.metal)
  const lay = LAYOUTS[DEVICE_LAYOUT[d.tag]]
  // V4: parts with no maker STEP are built from their catalogue shape (PROC), the sheet 3 face laid over the front surfaces
  let pg = null
  const pb = PROC[DEVICE_LAYOUT[d.tag]]
  if (pb) {
    pg = new THREE.Group()
    for (const [geos, m, opt] of pb({ x0, x1, yT, yB, w, h, xc, yc, z0, dep, z1, bm, d, lay })) { if (!geos.length) continue; const me = mesh(geos, m); if (opt?.noDecal) me.userData.noDecal = true; pg.add(me) }
    o.add(pg)
    const dc = d.tex && G.TEX[d.tex] ? faceDecal(pg, { x0, x1, yT, yB }, d.tex, { tint: d.face === 'line' ? d.body : undefined, minNz: 0.7 }) : null
    if (dc) o.add(dc)
  } else if (d.rail) {
    // a DIN device: narrow base on the rail, terminal shoulders, full-height front
    o.add(mesh([box(w - 0.001, h * 0.62, dep * 0.55, xc, yc, z0 + dep * 0.275, 0.0015)], bm))
    o.add(mesh([box(w - 0.0006, h - 0.001, dep * 0.47, xc, yc, z0 + dep * 0.765, 0.0025)], bm))
    o.add(mesh([box(Math.min(0.012, w * 0.4), 0.008, 0.006, xc, yB + 0.004, z0 + 0.004, 0.001), box(Math.min(0.008, w * 0.3), 0.003, 0.004, xc, yB - 0.001, z0 + 0.004, 0.0008)], M.grey))
    // moulded vent slots on the top and bottom shoulders
    const vs = []; const nv = Math.max(2, Math.floor(w / 0.006))
    for (let i = 0; i < nv; i++) { const x = x0 + (i + 0.5) * w / nv; vs.push(box(0.0016, 0.0006, dep * 0.3, x, yT - 0.0002, z0 + dep * 0.7, 0), box(0.0016, 0.0006, dep * 0.3, x, yB + 0.0002, z0 + dep * 0.7, 0)) }
    o.add(mesh(vs, M.hole))
  } else if (d.tag === 'DRV1' || d.tag === 'DRV2') {
    // PowerFlex 525 frame D: power module with heatsink fins at the back, control module on the front top
    o.add(mesh([box(w - 0.002, h - 0.002, dep * 0.62, xc, yc, z0 + dep * 0.31 + dep * 0.18, 0.004)], bm))
    const fins = []; for (let i = 0; i < 9; i++) fins.push(box(0.0018, h * 0.92, dep * 0.18, x0 + 0.01 + i * (w - 0.02) / 8, yc, z0 + dep * 0.09, 0))
    o.add(mesh(fins, MAT.aluminium({ roughness: 0.4 })))
    o.add(mesh([box(w * 0.98, h * 0.33, dep * 0.2, xc, yT - h * 0.165, z1 - dep * 0.1, 0.003)], bodyMat('#2a2b2e')))
    // bottom conduit plate with knockouts (frame D wires leave downwards)
    const kp = [box(w - 0.006, 0.003, dep * 0.6, xc, yB + 0.0015, z0 + dep * 0.45, 0.001)]
    o.add(mesh(kp, M.grey))
    // wiring steps: control module front cover and power terminal guard off (520-UM001 p.32), terminal blocks exposed
    const cov = new THREE.Group(), recess = [], sc = [], lab_ = []
    const P_ = (u, v) => [x0 + u * w, yT - v * h]
    const [cx0, cy0] = P_(0.08, 0.325), [cx1, cy1] = P_(0.92, 0.4)
    recess.push(box(cx1 - cx0, cy0 - cy1, 0.004, (cx0 + cx1) / 2, (cy0 + cy1) / 2, z1 + 0.0012, 0.001))
    const [px0, py0] = P_(0.08, 0.86), [px1, py1] = P_(0.86, 0.985)
    recess.push(box(px1 - px0, py0 - py1, 0.004, (px0 + px1) / 2, (py0 + py1) / 2, z1 + 0.0012, 0.001))
    const lay_ = LAYOUTS.PF525
    for (const [n, [u, v]] of Object.entries(lay_.pins)) { if (n === '4' || n === 'RJ45') continue; const [x, y] = P_(u, v); const big = v > 0.8; lab_.push(box(big ? 0.012 : 0.0048, big ? 0.012 : 0.0062, 0.0024, x, y, z1 + 0.0028, 0.0006)); sc.push(...screwHead(x, y, z1 + 0.0042, big ? 0.0034 : 0.0016)) }
    cov.add(mesh(recess, bodyMat('#151618')), mesh(lab_, bodyMat('#4a4c50')), mesh(sc, M.screw))
    cov.visible = false; o.add(cov); COVER_OFF.push(cov)
  } else {
    o.add(mesh([box(w - 0.001, h - 0.001, dep, xc, yc, z0 + dep / 2, Math.min(0.006, dep * 0.08))], bm))
  }
  if (!pg) {
    const face = new THREE.Mesh(at(new THREE.PlaneGeometry(w, h), xc, yc, z1 + 0.0004), faceMat(d.tex, d.face === 'line' ? d.body : undefined))
    face.receiveShadow = true; o.add(face)
  }
  const pdv = pg ? { vendor: pg, z0, z1 } : null
  const zs = (x, y) => pdv ? surfaceZ(pdv, x, y, z1) + 0.0012 : z1
  // terminal hardware at every terminal in the layout: screws, push-in releases, RJ45 jacks
  if (lay) {
    const screws = [], push = [], jacks = []
    for (const [name, [u, v, zf, e]] of Object.entries(lay.pins)) {
      if (/#|^\d+$/.test(name) && DEVICE_LAYOUT[d.tag] === 'PB2' && !/^[1-5]$/.test(name)) continue
      const x = x0 + u * w, y = yT - v * h, z = z0 + dep * zf
      if (/^(X2\d|ETH|RJ45|LAN|WAN)/.test(name) || (DEVICE_LAYOUT[d.tag] === 'FL1116' && /^\d+$/.test(name))) { jacks.push(box(0.0118, 0.0105, 0.004, x, y, Math.min(z, zs(x, y)) + 0.0006, 0.0008)); continue }
      if (['EPSITRON', 'PRO2', 'PTFIX12', 'PTFIX18', 'AL1920', 'NAT102'].includes(DEVICE_LAYOUT[d.tag])) { if (e === 'f' || zf > 0.9) push.push(...pushIn(x, y, zs(x, y) + 0.0002)); continue }
      if (['PF525', 'PB2', 'OW16', 'D167'].includes(DEVICE_LAYOUT[d.tag])) continue          // hidden behind covers / drawn on the face
      screws.push(...screwHead(x, y, zs(x, y) - 0.0003, d.tag.startsWith('PDB1') || d.tag === 'Q1' || d.tag === 'FU1' ? 0.0034 : 0.0021))
    }
    if (screws.length) o.add(mesh(screws, M.screw))
    if (push.length) o.add(mesh(push, M.orange))
    if (jacks.length) o.add(mesh(jacks, M.rj))
    // 1769 modules: door open in the wiring steps, the terminal block behind it exposed (1769-IN028 p.5, 1769-IN062 p.8)
    if (['PB2', 'OW16'].includes(DEVICE_LAYOUT[d.tag])) {
      const cov = new THREE.Group(), blk = [], sc = []
      const pts = Object.entries(lay.pins).filter(([n]) => !/[a-z]/i.test(n) || /^(OUT|VAC)/.test(n)).map(([, p]) => p)
      const us = pts.map((p) => p[0]), vs = pts.map((p) => p[1])
      const bx0 = x0 + (Math.min(...us) - 0.13) * w, bx1 = x0 + (Math.max(...us) + 0.13) * w, by0 = yT - (Math.min(...vs) - 0.04) * h, by1 = yT - (Math.max(...vs) + 0.04) * h
      blk.push(box(bx1 - bx0, by0 - by1, 0.006, (bx0 + bx1) / 2, (by0 + by1) / 2, z1 + 0.002, 0.001))
      for (const [u, v] of pts) sc.push(...screwHead(x0 + u * w, yT - v * h, z1 + 0.0052, 0.0019))
      // the opened door, swung out to the right
      const door = box(w * 0.92, h * 0.62, 0.0015, 0, 0, 0, 0.0006); door.rotateY(-1.2); door.translate(x1 + w * 0.2, yc - h * 0.05, z1 + w * 0.36)
      cov.add(mesh(blk, bodyMat('#2b2d30')), mesh(sc, M.screw), mesh([door], bodyMat('#b9bbb8')))
      cov.visible = false; o.add(cov); COVER_OFF.push(cov)
    }
  }
  parent.add(o)
  DEV[d.tag] = { d, r, x0, x1, yT, yB, xc, yc, z0, z1, obj: o, lay, vendor: pg, proc: !!pg }
  o.traverse((m) => { if (m.isMesh) { m.userData.tag = d.tag; pickables.push(m) } })
  tagPlate(d.tag, (r.X0 + r.X1) / 2, r.Yb + 9, Math.max(16, Math.min(30, (r.X1 - r.X0) - 2)))
  TAG_PLATES[TAG_PLATES.length - 1].userData.step = d.step
}
function addStrip(d) {
  const s = d.strip, rail = G.RAILS[d.rail], yc = SY(rail.y), h = s.h / 1000, dep = s.depth / 1000
  const parent = STEP_GROUPS[d.step]
  const sl = STRIP_LAYOUT[s.kind]
  const body = [], faces = [], screws = [], marks = [], jumpers = []
  const TBP = [[-h / 2, 0.0075], [h / 2, 0.0075], [h / 2, dep * 0.62], [h * 0.32, dep], [h * 0.12, dep], [h * 0.12, dep * 0.93], [-h * 0.12, dep * 0.93], [-h * 0.12, dep], [-h * 0.32, dep], [-h / 2, dep * 0.62]]
  const xs = []
  // V4: the maker's block (1492-J4, 1492-J6 STEP), repeated at the pitch; its screw rows and depths read off the model
  const sm = FIT.STRIP_MODEL[s.kind], vb = sm && hasModel(sm.model) ? vendor(sm.model, sm.rot) : null
  let vgrp = null, rowZ = null
  if (vb) {
    const offs = []; for (let i = 0; i < s.n; i++) offs.push(V3(SX(s.x0 + s.pitch * (i + 0.5)) - vb.center.x, yc - vb.center.y, PZ - vb.box.min.z))
    vgrp = new THREE.Group(); vgrp.add(mesh(mergeIdx(vb.list.map((l) => l.geo), offs), bodyMat('#a9aba8')))
    // depth of the block's front at a height y (ray at the middle of the first block)
    const probe = new THREE.Mesh(mergeIdx(vb.list.map((l) => l.geo), [offs[0]])); probe.updateMatrixWorld(true)
    rowZ = (y) => { RAYC.set(V3(SX(s.x0 + s.pitch / 2), y, PZ + 0.2), V3(0, 0, -1)); return RAYC.intersectObject(probe, false)[0]?.point.z ?? PZ + dep * 0.8 }
  }
  for (let i = 0; i < s.n; i++) {
    const X = s.x0 + s.pitch * (i + 0.5), x = SX(X); xs.push(X)
    if (vb) {
      const rows = s.kind === 'JD4' ? [...sl.T, ...sl.B] : [sl.inside, sl.field]
      for (const v of rows) { const y = yc + h / 2 - v * h; screws.push(...screwHead(x, y, rowZ(y) - 0.0006, Math.min(0.0021, s.pitch / 2600))) }
      marks.push(box(s.pitch / 1000 - 0.0012, 0.006, 0.001, x, yc, rowZ(yc) + 0.0005, 0))
      continue
    }
    body.push(railProfile(TBP, s.pitch / 1000, x, yc))
    // the block modelled as it is (the sheet 3 symbol is not to scale): a screw in a recess near each end, the wire entry under it
    const rows = s.kind === 'JD4' ? [...sl.T, ...sl.B] : [sl.inside, sl.field]
    for (const v of rows) {
      const y = yc + h / 2 - v * h, low = s.kind === 'JD4' && (v < 0.2 || v > 0.8), zs = PZ + dep * (low ? 0.6 : 0.8)
      faces.push(box(s.pitch / 1000 - 0.0014, 0.0056, 0.003, x, y, zs - 0.0006, 0.0004))                      // screw recess
      screws.push(...screwHead(x, y, zs + 0.0002, Math.min(0.0021, s.pitch / 2600)))
      const ye = y + (v < 0.5 ? 1 : -1) * 0.0046
      faces.push(box(Math.min(0.0042, s.pitch / 1000 - 0.0016), 0.0026, 0.0042, x, ye, zs - 0.0034, 0.0003))   // wire entry
    }
    marks.push(box(s.pitch / 1000 - 0.0012, 0.006, 0.001, x, yc, PZ + dep * 0.93 + 0.0006, 0))
  }
  const o = new THREE.Group(); o.name = d.tag
  if (vgrp) o.add(vgrp, mesh(screws, M.screw), mesh(marks, bodyMat('#f2f2ee')))
  else o.add(mesh(body, bodyMat('#a9aba8')), mesh(screws, M.screw), mesh(marks, bodyMat('#f2f2ee')))
  if (jumpers.length) o.add(mesh(jumpers, M.red))
  if (faces.length) o.add(mesh(faces, M.hole))
  const markZ = vgrp ? rowZ(yc) + 0.0011 : PZ + dep * 0.93 + 0.0012
  const n = s.n, lt = canvasTex(Math.min(4096, n * 64), 64, (c, w, hh) => { c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, hh); c.fillStyle = '#111'; c.font = `700 ${Math.min(40, 64 * 0.62)}px Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < n; i++) { c.save(); c.translate((i + 0.5) * (w / n), hh / 2); c.rotate(-Math.PI / 2); c.fillText(String(i + 1), 0, 2); c.restore() } })
  const lp = new THREE.Mesh(at(new THREE.PlaneGeometry(SX(s.x0 + s.pitch * n) - SX(s.x0), 0.0058), (SX(s.x0) + SX(s.x0 + s.pitch * n)) / 2, yc, markZ), MAT.plastic({ color: '#ffffff', map: lt, finish: null }))
  o.add(lp)
  parent.add(o)
  const X0 = s.x0, X1 = s.x0 + s.pitch * s.n
  DEV[d.tag] = { d, r: { X0, X1, Yt: rail.y - s.h / 2, Yb: rail.y + s.h / 2 }, x0: SX(X0), x1: SX(X1), yT: yc + h / 2, yB: yc - h / 2, xc: (SX(X0) + SX(X1)) / 2, yc, z0: PZ, z1: vb ? PZ + vb.size.z : PZ + dep, obj: o, xs, vendor: vgrp }
  o.traverse((m) => { if (m.isMesh) { m.userData.tag = d.tag; pickables.push(m) } })
  tagPlate(d.tag, X0 + 13, rail.y + s.h / 2 + 9, 24)
  TAG_PLATES[TAG_PLATES.length - 1].userData.step = d.step
}
for (const d of G.DEVICES) { if (d.strip) addStrip(d); else if (d.at === 'sub1') addDevice(d) }
// V10 (Bob: every fuse is a part that can be selected): a fuse drawn in or on its holder, registered as a device of its
// own under the tag layout gives it (G.DEVICES, at: 'fuse'), so it is picked, tagged, found and listed like any part.
function addFuse(tag, host, parts) {
  const d = G.DEVICES.find((x) => x.tag === tag); if (!d || !host?.obj) return
  const g = new THREE.Group(), b = new THREE.Box3(); g.name = tag
  for (const [geos, m] of parts) { const me = mesh(geos, m); me.geometry.computeBoundingBox(); b.union(me.geometry.boundingBox); me.userData.tag = tag; pickables.push(me); g.add(me) }
  g.userData.noProbe = true; host.obj.add(g)
  DEV[tag] = { d, obj: g, fuse: true, x0: b.min.x, x1: b.max.x, yB: b.min.y, yT: b.max.y, z0: b.min.z, z1: b.max.z, xc: (b.min.x + b.max.x) / 2, yc: (b.min.y + b.max.y) / 2 }
}
// a cartridge fuse standing upright: ferrules at each end, the body between (class CC and midget: 10.3 x 38 mm)
const cartridge = (x, y, z, len = 0.0381, r = 0.00515, body = '#e6dcc0') => [[[cyl(r, len - 0.016, x, y, z, 'y', 20)], bodyMat(body)], [[cyl(r + 0.0002, 0.008, x, y + len / 2 - 0.004, z, 'y', 20), cyl(r + 0.0002, 0.008, x, y - len / 2 + 0.004, z, 'y', 20)], M.tin]]
// FU2 (CHCC1DU): the FNQ-R-6 sits in the pull-out carrier; it shows through a window in the carrier's front
if (DEV.FU2) { const h = DEV.FU2, z = h.z1 - 0.004; addFuse('FU2-F', h, [...cartridge(h.xc, h.yc, z - 0.004), [[box(0.0115, 0.041, 0.0012, h.xc, h.yc, h.z1 + 0.0002, 0.0006)], MAT.plastic({ color: '#20262b', roughness: 0.15, transparent: true, opacity: 0.45, depthWrite: false, finish: null })]]) }
// T1 (E750WB): two class CC fuses in the primary fuse block and one midget in the secondary block, each between its
// clips (PROC.E750WB). Sheet 4 gives 2 x 3.5 A class CC and 1 x 10 A midget; they are not in the BOM (approximation).
if (DEV.T1) {
  const h = DEV.T1, w = h.x1 - h.x0, ht = h.yT - h.yB, z = h.z0 + (h.z1 - h.z0) * 0.975
  addFuse('T1-F1', h, cartridge(h.x0 + 0.42 * w, h.yT - 0.38 * ht, z)); addFuse('T1-F2', h, cartridge(h.x0 + 0.54 * w, h.yT - 0.38 * ht, z))
  addFuse('T1-F3', h, cartridge(h.x0 + 0.695 * w, h.yT - 0.415 * ht, z, 0.0381, 0.00515, '#d9d2bd'))
}
// V9: a trailer fuse block (FU1 under Q1): the fuses bridge from the clips on the switch's load side to the clips on the
// block, and the phase barriers stand between the poles (1494U-IN001 p.10). Bussmann's LPJ model, one per pole.
for (const dv of Object.values(DEV)) {
  const tr = dv.fit?.trailer, up = tr && DEV[tr.under], pf = FIT.PART_MODEL.fuseJ
  if (!tr || !up?.vendor) continue
  const top = up.vendor.position.y - tr.bodyBelowOrigin / 1000, bot = dv.yT, yc = (top + bot) / 2, za = dv.vendor.position.z + tr.axisZ / 1000
  const xs = ['L1', 'L2', 'L3'].map((n) => dv.vendor.position.x + dv.fit.pins[n][0] / 1000), g = new THREE.Group()
  if (hasModel(pf?.model)) {
    // V10: each fuse is a part of its own (FU1-L1, -L2, -L3): it can be clicked, found and looked up
    const v = vendor(pf.model, ['x90'])
    xs.forEach((x, i) => addFuse(`${dv.d.tag}-L${i + 1}`, dv, [[mergeIdx(v.list.map((l) => l.geo), [V3(x - v.center.x, yc - v.center.y, za - v.center.z)]), bodyMat('#d8b13c')], [[cyl(v.size.x / 2 + 0.0003, 0.03, x, yc, za, 'y', 28)], bodyMat('#f1ede0')]]))
  }
  const bar = []; for (const s of [-1, 1]) bar.push(box(0.0016, top - bot + 0.05, dv.z1 - PZ - 0.004, (xs[1] + xs[1 + s]) / 2, yc, (PZ + dv.z1) / 2 + 0.006, 0.0004))
  g.add(mesh(bar, bodyMat('#34363a')))
  g.traverse((m) => { if (m.isMesh) { m.userData.tag = dv.d.tag; pickables.push(m) } })
  g.userData.noProbe = true; dv.obj.add(g)
}

// end anchors (1492-EAJ35, 7.87 mm), from the drawing's anchor face
for (const [rk, list] of Object.entries(G.ANCHORS)) {
  const rail = G.RAILS[rk], yc = SY(rail.y), g = [], f = [], sc = []
  for (const X of list) {
    const x = SX(X + 3.94)
    g.push(railProfile([[-0.0275, 0.0075], [0.0275, 0.0075], [0.0275, 0.024], [0.01, 0.034], [-0.01, 0.034], [-0.0275, 0.024]], 0.00787, x, yc))
    f.push(at(new THREE.PlaneGeometry(0.0078, 0.055), x, yc, PZ + 0.0345))
    sc.push(...screwHead(x, yc, PZ + 0.0352, 0.0024))
  }
  const step = rk === 'r1' ? 'rail1' : rk === 'r3' ? 'rail3' : 'rail4'
  const pa = FIT.PART_MODEL.anchor
  if (hasModel(pa?.model)) {
    // Rockwell's 1492-EAJ35 model at each anchor position, its clamp screw on the front
    const v = vendor(pa.model, pa.rot)
    const offs = list.map((X) => V3(SX(X + 3.94) - v.center.x, yc - v.center.y, PZ - v.box.min.z))
    STEP_GROUPS[step].add(mesh(mergeIdx(v.list.map((l) => l.geo), offs), bodyMat('#5b5d5f')))
  } else STEP_GROUPS[step].add(mesh(g, bodyMat('#5b5d5f')), new THREE.Mesh(GEO.merge(f), faceMat('ANCHOR')), mesh(sc, M.screw))
}
// end barriers (1492-EBJ3, BOM qty 2): on the open end of TB1 and TB2, Rockwell's model
{
  const pb = FIT.PART_MODEL.barrier
  if (hasModel(pb?.model)) {
    const v = vendor(pb.model, pb.rot)
    for (const tag of ['TB1', 'TB2']) {
      const d = G.DEVICES.find((x) => x.tag === tag); if (!d?.strip || !STEP_GROUPS[d.step]) continue      // job-specific: this panel's two open strip ends
      const s = d.strip, X = s.x0 + s.pitch * s.n + 0.75, yc = SY(G.RAILS[d.rail].y)
      STEP_GROUPS[d.step].add(mesh(mergeIdx(v.list.map((l) => l.geo), [V3(SX(X) - v.center.x, yc - v.center.y, PZ - v.box.min.z)]), bodyMat('#a9aba8')))
    }
  }
}

// RCP1 1492-REC15 DIN-rail duplex receptacle (sheet 6). Sheet 3 gives it no place: modelled in the free space on rail 4 between
// TB5 and CB5 (the only gap that fits it), the position itself is a design question.
// V4: Rockwell's own model. It is 74.2 mm along the rail and 123.7 mm tall, so it fills the space between the TB5 end
// anchor (887.4 mm) and CB5 (978.4 mm), centred at 932 mm; the V3 position (900-945 mm) was a 45 mm box.
if (hasModel(FIT.MODEL_FIT.RCP1?.model) && G.RAILS.r4 && STEP_GROUPS.rail4) {      // job-specific: remove with RCP1's entry in model_fit.mjs
  // V13 (Draft rev20): sheet 3 now draws RCP1, between TB4 and CB5, centred at 806.0 mm (V14: true scale; 768.5 to 843.4 mm)
  const rail = G.RAILS.r4, Xc = 806.0, v = vendor(FIT.MODEL_FIT.RCP1.model, FIT.MODEL_FIT.RCP1.rot)
  const dv = addVendorDevice({ tag: 'RCP1', pn: '1492-REC15', step: 'rail4', body: '#dddcd5' }, FIT.MODEL_FIT.RCP1, STEP_GROUPS.rail4, { X0: Xc - v.size.x * 500, X1: Xc + v.size.x * 500, Yt: rail.y - v.size.y * 500, Yb: rail.y + v.size.y * 500 })
  tagPlate('RCP1', Xc, rail.y + v.size.y * 500 + 9, 22); TAG_PLATES[TAG_PLATES.length - 1].userData.step = 'rail4'
  void dv
} else {
  const X0 = 900, X1 = 945, rail = G.RAILS.r4, yc = SY(rail.y), x0 = SX(X0), x1 = SX(X1), w = x1 - x0, xc = (x0 + x1) / 2, h = 0.086, dep = 0.058
  const o = new THREE.Group(); o.name = 'RCP1'
  const bm = bodyMat('#d9d8d2')
  o.add(mesh([box(w - 0.001, h * 0.62, dep * 0.55, xc, yc, RZ + dep * 0.275, 0.0015), box(w - 0.0006, h, dep * 0.47, xc, yc, RZ + dep * 0.765, 0.003)], bm))
  // two NEMA 5-15R faces: hot and neutral slots, round ground hole
  const sl = [], fp = []
  for (const s of [-1, 1]) {
    const y = yc + s * 0.021
    fp.push(box(w * 0.78, 0.03, 0.002, xc, y, RZ + dep + 0.001, 0.004))
    sl.push(box(0.0018, 0.0068, 0.003, xc - 0.0063, y + 0.003, RZ + dep + 0.002, 0.0003), box(0.0018, 0.0082, 0.003, xc + 0.0063, y + 0.003, RZ + dep + 0.002, 0.0003), cyl(0.0024, 0.003, xc, y - 0.008, RZ + dep + 0.002, 'z', 16))
  }
  o.add(mesh(fp, bodyMat('#efeee8')), mesh(sl, M.hole))
  const sc = []; for (const s of [-1, 1]) for (const k of [-1, 1]) sc.push(...screwHead(xc + k * 0.011, yc + s * (h / 2 - 0.006), RZ + dep * 0.8, 0.002))
  o.add(mesh(sc, M.brassScrew))
  STEP_GROUPS.rail4.add(o)
  DEV.RCP1 = { d: { tag: 'RCP1', pn: '1492-REC15', step: 'rail4' }, r: { X0, X1, Yt: rail.y - h * 500, Yb: rail.y + h * 500 }, x0, x1, yT: yc + h / 2, yB: yc - h / 2, xc, yc, z0: RZ, z1: RZ + dep, obj: o }
  o.traverse((m) => { if (m.isMesh) { m.userData.tag = 'RCP1'; pickables.push(m) } })
  tagPlate('RCP1', (X0 + X1) / 2, rail.y + 52, 22); TAG_PLATES[TAG_PLATES.length - 1].userData.step = 'rail4'
}

// ------------------------------------------------------------------ subplate 2 (SCE-16P14) on the left side wall, VM1 on angled brackets
const SUB2 = { x: -W / 2 + T + 0.004, y: 0.58, z: D * 0.42 }
{
  const g = new THREE.Group(); g.position.set(SUB2.x, SUB2.y, SUB2.z); g.rotation.y = Math.PI / 2; sub2G.add(g)
  const ps = FIT.PART_MODEL.sub2, pb = FIT.PART_MODEL.bracket
  if (hasModel(ps?.model)) { const v = vendor(ps.model, ps.rot); g.add(vendorGroup(v, { body: M.sub }, { at: V3(-v.center.x, -v.center.y, -v.box.min.z) })) }
  else g.add(mesh([box(0.381, 0.33, 0.00266, 0, 0, 0.00133, 0)], M.sub))
  const bt = faceMat('BRACKET')
  for (const s of [-1, 1]) {
    if (hasModel(pb?.model)) { const v = vendor(pb.model, pb.rot); g.add(vendorGroup(v, { body: M.zinc }, { at: V3(s * 0.155 - v.center.x, -v.center.y, 0.0019 - v.box.min.z) })); continue }
    g.add(mesh([box(0.024, 0.08, 0.05, s * 0.155, 0, 0.026, 0.002)], M.zinc))
    g.add(new THREE.Mesh(at(new THREE.PlaneGeometry(0.0253, 0.079), s * 0.155, 0, 0.0512), bt))
  }
  g.add(mesh([railProfile(RAILP, 0.34, 0, 0, 0.051)], M.rail))
  const t = G.TEX.VM1, w = (t.X1 - t.X0) / 1000, h = (t.Yb - t.Yt) / 1000, dep = 0.11
  const vm = new THREE.Group()
  vm.add(mesh([box(w - 0.002, h - 0.002, dep, 0, 0, 0.0585 + dep / 2, 0.003)], bodyMat('#8e9194')))
  vm.add(new THREE.Mesh(at(new THREE.PlaneGeometry(w, h), 0, 0, 0.0585 + dep + 0.0004), faceMat('VM1')))
  // 32 push-in tube fittings (1/4 in) along the bottom, supply and exhaust ports at the left end
  const ft = []; for (let k = 0; k < 16; k++) for (const s of [-1, 1]) ft.push(cyl(0.0042, 0.012, -w / 2 + 0.03 + k * (w - 0.05) / 15 + s * 0.003, -h / 2 - 0.004, 0.0585 + dep * 0.55 + s * 0.012, 'y', 14))
  vm.add(mesh(ft, M.rj))
  g.add(vm)
  g.traverse((m) => { if (m.isMesh) { m.userData.tag = 'VM1'; pickables.push(m) } })
  DEV.VM1 = { d: G.DEVICES.find((x) => x.tag === 'VM1'), sub2: true, obj: vm, group: g }
}

// ------------------------------------------------------------------ door devices: HMI1 PanelView Plus 7 (297 x 252 mm bezel, PartsLib) and the E-STOP
{
  const hw = 0.297, hh = 0.252
  const g = new THREE.Group(); doorR.add(g); doorDevG.userData.real = g
  const bez = mesh([box(hw, hh, 0.012, hmiHole.x, hmiHole.y, 0.0028 + 0.006, 0.006)], M.grey)
  const scr = new THREE.Mesh(at(new THREE.PlaneGeometry(hw * 0.985, hh * 0.985), hmiHole.x, hmiHole.y, 0.0028 + 0.0122), faceMat('HMI1'))
  const back = mesh([box(0.27, 0.22, 0.06, hmiHole.x, hmiHole.y, -0.03, 0.004)], M.black)
  const clips = []; for (const [dx, dy] of [[-0.13, 0.08], [-0.13, -0.08], [0.13, 0.08], [0.13, -0.08], [0, 0.108], [0, -0.108]]) clips.push(box(0.014, 0.01, 0.01, hmiHole.x + dx, hmiHole.y + dy, -0.006, 0.002))
  const ph = FIT.PART_MODEL.hmi
  if (hasModel(ph?.model)) {
    // Rockwell's PanelView Plus 7 Standard 10 in model: bezel outside the door, housing through the cutout; the screen
    // image (sheet 2 face) sits on the bezel front
    const v = vendor(ph.model, ph.rot)
    // the bezel (about 7.5 mm, Rockwell drawing PVP7S R1 10) stands proud of the door skin; the housing goes through the cutout
    g.add(vendorGroup(v, { body: M.grey, rules: [[/HOLDER|PRT0027|PRT0029/, M.black]], small: [400, M.zinc] }, { at: V3(hmiHole.x - v.center.x, hmiHole.y - v.center.y, 0.0028 + 0.0075 - v.box.max.z) }))
    scr.position.z = (0.0028 + 0.0075 + 0.0003) - (0.0028 + 0.0122)        // screen image just in front of the bezel face
    g.add(scr)
  } else g.add(bez, scr, back, mesh(clips, M.zinc))
  const es = new THREE.Group(); es.position.set(estopHole.x, estopHole.y, 0.0028)
  const pe = FIT.PART_MODEL.estop
  if (hasModel(pe?.model)) {
    // Rockwell's 800H-FRXJT operator model: 60 mm jumbo mushroom and its mounting collar, on the door skin
    const v = vendor(pe.model, pe.rot)
    es.add(vendorGroup(v, { body: M.red, small: [500, M.black] }))
  } else {
  es.add(mesh([cyl(0.024, 0.006, 0, 0, 0.003, 'z', 40)], M.yellow))
  es.add(mesh([cyl(0.017, 0.022, 0, 0, 0.017, 'z', 32)], M.black))
  es.add(mesh([GEO.lathe([[0, 0], [0.03, 0], [0.03, 0.006], [0.026, 0.016], [0.012, 0.021], [0, 0.022]], 48).rotateX(Math.PI / 2).translate(0, 0, 0.028)], M.red))
  }
  // two N.C. contact blocks and the LED module on the latch (800H)
  es.add(mesh([box(0.04, 0.04, 0.012, 0, 0, -0.008, 0.003), box(0.018, 0.04, 0.03, -0.01, 0, -0.03, 0.002), box(0.018, 0.04, 0.03, 0.01, 0, -0.03, 0.002)], M.black))
  es.add(mesh([...screwHead(-0.01, 0.012, -0.0452, 0.0018).map((q) => q.rotateY(Math.PI)), ...screwHead(0.01, 0.012, -0.0452, 0.0018).map((q) => q.rotateY(Math.PI))], M.screw))
  g.add(es)
  const lb = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#ffd400'; c.fillRect(0, 0, w, h); c.fillStyle = '#000'; c.font = '800 34px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('EMERGENCY STOP', w / 2, 44) })
  const leg = new THREE.Mesh(at(new THREE.PlaneGeometry(0.07, 0.0175), estopHole.x, estopHole.y - 0.042, 0.0034), MAT.plastic({ color: '#ffffff', map: lb, finish: null }))
  g.add(leg)
  g.traverse((m) => { if (m.isMesh) { m.userData.tag = 'HMI1'; pickables.push(m) } })
  es.traverse((m) => { if (m.isMesh) m.userData.tag = 'E-STOP' }); leg.userData.tag = 'E-STOP'
  DEV.HMI1 = { d: G.DEVICES.find((x) => x.tag === 'HMI1'), door: true, local: V3(hmiHole.x, hmiHole.y - 0.07, -0.06) }
  DEV['E-STOP'] = { d: G.DEVICES.find((x) => x.tag === 'E-STOP'), door: true, local: V3(estopHole.x, estopHole.y, -0.045) }
}
acG.traverse((m) => { if (m.isMesh) { m.userData.tag = 'A/C'; pickables.push(m) } })
encG.traverse((m) => { if (m.isMesh) { m.userData.tag = 'Enclosure'; pickables.push(m) } })

// ------------------------------------------------------------------ terminals: the clamp of a named terminal
// returns { X, Y (mm on subplate 1), z (m), e (entry), pin, conf, where } or an off-plate endpoint
const PIN_ALIAS = [[/\(H(\d)/, (m) => `H${m[1]}`], [/\((X\d)/, (m) => m[1]]]
function pinKey(lay, raw) {
  const s = String(raw ?? '').replace(/:field$/, '').trim()
  if (lay.pins[s]) return s
  // V6: the terminal's own name first ("1L1 (H1 primary fuse)" is the fuse block's 1L1, not H1), then the name in brackets
  const c = s.replace(/\s*\(.*\)\s*$/, '').trim()
  if (lay.pins[c]) return c
  for (const [re, f] of PIN_ALIAS) { const m = re.exec(s); if (m && lay.pins[f(m)]) return f(m) }
  const c2 = c.replace(/\s+/g, ''); if (lay.pins[c2]) return c2
  return null
}
function whereText(lay, key) {
  const [u, v] = lay.pins[key]
  if (/^(RJ45|ETH|LAN|WAN|X2\d)/.test(key)) return `RJ45 port ${key}${v > 0.9 ? ' (underside)' : ''}`
  if (lay === LAYOUTS.FL1116 && /^\d+$/.test(key)) { const n = Number(key), i = (n - 1) % 8; return `RJ45 port ${n}: ${n <= 8 ? 'left' : 'right'} column, ${i < 4 ? 'upper' : 'lower'} block, row ${(i % 4) + 1} (numbers printed beside the jacks)` }
  if (lay === LAYOUTS.EPSITRON) { if (/^OUT ?\d/.test(key)) { const n = Number(key.replace(/\D/g, '')); return `output ${n}: ${['1st', '2nd', '3rd'][n - 1] ?? `${n}th`} push-in from the top of the output column` } if (key === 'DC24+') return 'upper large push-in at the top (input +)'; if (/upper/.test(key) || key === '0V') return 'lower large push-in at the top (input 0 V)'; if (/lower/.test(key)) return '0 V push-in in the 2 x 2 block below the inputs' }
  if (lay === LAYOUTS.OW16 || lay === LAYOUTS.PB2) return `${lay === LAYOUTS.PB2 ? 'the' : u < 0.75 ? 'left' : 'right'} column behind the door,${Object.entries(lay.pins).filter(([, p]) => Math.abs(p[0] - u) < 0.01 && p[1] < v - 0.001).map(([k]) => k).filter((k, i, a) => !/[a-z]/.test(k) || /^(OUT|VAC)/.test(k)).length + 1}${''} from the top, wire in from below`
  if (lay === LAYOUTS.GLG && /^\d+$/.test(key)) { const n = Number(key), row = n <= 4 ? 'top inner plug (1 2 3 4, under the orange label)' : n <= 8 ? 'top outer plug (5 6 7 8)' : n <= 12 ? 'bottom inner plug (9 10 11 12, under the blue label)' : 'bottom outer plug (13 14 15 16)'; return `${row}, ${['1st', '2nd', '3rd', '4th'][(n - 1) % 4]} from the left, wire in from the ${n <= 8 ? 'top' : 'bottom'}` }
  if (lay === LAYOUTS.E750WB) return ({ H1: 'primary board (left), 1st screw from the top', H3: 'primary board (left), 2nd screw from the top', H2: 'primary board (left), 3rd screw from the top', H4: 'primary board (left), 4th screw from the top', '1L1': 'primary fuse block (middle), left pole, lower terminal (H1 fuse), ring lug, wire down', '3L2': 'primary fuse block (middle), right pole, lower terminal (H4 fuse), ring lug, wire down', '2T1': 'secondary fuse block (right of middle), lower terminal (X2 fuse), ring lug, wire down', X2: 'secondary board (right), upper screw', X1: 'secondary board (right), lower screw' })[key] ?? key
  if (lay === LAYOUTS.AL1920 && /^X0\d-\d/.test(key)) return `port ${key.slice(0, 3)} plug, pin ${key.slice(4)} (${v < 0.5 ? 'top' : 'bottom'} of the module)`
  const rowPins = Object.entries(lay.pins).filter(([k, p]) => Math.abs(p[1] - v) < 0.02 && !/#/.test(k)).map(([, p]) => p[0]).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b)
  const i = rowPins.findIndex((x) => Math.abs(x - u) < 1e-6)
  const ord = ['1st', '2nd', '3rd'][i] ?? `${i + 1}th`
  return `${v < 0.33 ? 'top' : v > 0.67 ? 'bottom' : 'middle'} row, ${ord} of ${rowPins.length} from the left`
}
// V11: tap 1 is kept for the incoming ground conductor, which sheet 4 draws on GB1 terminal 1; the rest follow from tap 2
const GB_TAPS = { next: 1, map: { tap1: 0 }, L: {} }
function gbTap(key) {
  if (GB_TAPS.map[key] === undefined) GB_TAPS.map[key] = GB_TAPS.next++
  const n = (GB_TAPS.map[key] % 14) + 1, dv = DEV.GB1, lay = dv.lay, [u, v, zf] = lay.pins[`TAP${n}`]
  const p = { X: dv.r.X0 + u * (dv.r.X1 - dv.r.X0), Y: dv.r.Yt + v * (dv.r.Yb - dv.r.Yt), z: dv.z0 + (dv.z1 - dv.z0) * zf, e: 'l', pin: `tap ${n}`, conf: 'measured', where: `tap ${n} of 14 from the top`, dev: 'GB1' }
  p.z = surfaceZ(dv, SX(p.X), SY(p.Y), p.z) + 0.0012
  p.L = GB_TAPS.L[n] ??= landing(dv, P(p.X, p.Y, p.z), 'l')
  return p
}
function term(devTag, rawTerm, key) {
  if (devTag === 'GND BAR' || devTag === 'GB1') return gbTap(String(rawTerm ?? '').trim() === '1' ? 'tap1' : key)
  const dv = DEV[devTag]; if (!dv || dv.door || dv.sub2) return null
  if (dv.d.strip) {
    const raw = String(rawTerm ?? '').trim()
    const m = /^(\d+)\s*(?:\((T|B)\))?/.exec(raw); const i = m ? Number(m[1]) - 1 : 0
    const s = dv.d.strip, sl = STRIP_LAYOUT[s.kind], X = s.x0 + s.pitch * (i + 0.5), Yt = G.RAILS[dv.d.rail].y - s.h / 2
    const level = m?.[2]
    const field = raw.includes(':field')
    const insideTop = true                             // V13 (rev20): TB1 is on rail 4 now, drive side up like every other strip (on rail 1 it faced down)
    const topSide = field ? !insideTop : insideTop
    let v; if (s.kind === 'JD4') { const pair = sl[level ?? 'T']; v = topSide ? pair[0] : pair[1] } else v = topSide ? sl.inside : sl.field
    if (!insideTop) v = 1 - v
    const zf = s.kind === 'JD4' && level === 'B' ? 0.62 : 0.8
    const zDef = PZ + (s.depth / 1000) * zf
    const p = { X, Y: Yt + v * s.h, z: dv.vendor ? surfaceZ(dv, SX(X), SY(Yt + v * s.h), zDef) : zDef, e: topSide ? 't' : 'b', pin: `${i + 1}${level ? ` (${level})` : ''}`, conf: sl.conf, where: `terminal ${i + 1}, ${topSide ? 'upper' : 'lower'} screw${level ? `, ${level === 'T' ? 'upper' : 'lower'} level` : ''}${field ? ' (field side)' : ''}`, dev: devTag }
    const en = FIT.STRIP_MODEL[s.kind]?.entry
    if (dv.vendor && en) {
      // V5: the maker's block: the wire goes down (or up) into the entry valley behind the screw, 6 mm into the clamp
      const up = p.e === 't', yc = SY(G.RAILS[dv.d.rail].y), mouth = V3(SX(X), yc + (up ? en.top : en.bot) / 1000, PZ + en.z / 1000)
      p.L = finishLanding(stripDv(dv, i), { tip: mouth.clone().add(V3(0, up ? -0.006 : 0.006, 0)), mouth, found: true }, p.e)
      return p
    }
    // a strip's landing: the block nearest the pin only (the strip is one long run of blocks)
    p.L = landing(stripDv(dv, i), P(p.X, p.Y, p.z + 0.0012), p.e)
    return p
  }
  if (dv.landings?.[String(rawTerm ?? '').trim()] || (dv.lay && dv.landings?.[pinKey(dv.lay, rawTerm)])) {
    // V5: a terminal on a block built here (drive, 1769 module, controller ports): its opening is known
    const k = dv.landings[String(rawTerm ?? '').trim()] ? String(rawTerm ?? '').trim() : pinKey(dv.lay, rawTerm), Ls = dv.landings[k]
    const L = finishLanding(dv, { tip: Ls.tip.clone(), mouth: Ls.mouth.clone(), found: true, plug: Ls.plug }, Ls.e)
    if (Ls.via) { L.via = Ls.via; L.clear = Ls.clear.clone() }
    return { X: (Ls.tip.x + SW / 2) * 1000, Y: (Y0 + 0.051 + SH - Ls.tip.y) * 1000, z: Ls.tip.z, e: Ls.e, pin: k, conf: dv.lay?.conf ?? 'documented', where: dv.lay === LAYOUTS.PF525 ? pfWhere(k) : whereText(dv.lay, k), dev: devTag, L }
  }
  if (devTag === 'RCP1' && dv.fit?.pins) {
    // the 1492-REC15 has one 3-way terminal block feeding both outlets (Rockwell 1492-REC model): sheet 6's L1-x/L2-x
    // names fold onto it, hot (L2-1, L1-2) on L, neutral (L1-1, L2-2) on N, ground on G
    const t = String(rawTerm ?? '').trim()
    const k = /GND|^G$/.test(t) ? 'G' : /^(L2-1|L1-2|L)$/.test(t) ? 'L' : 'N'
    const [mx, my, mz, e] = dv.fit.pins[k]
    const p = V3(mx, my, mz).applyMatrix4(dv.v.m4).add(dv.vendor.position)
    const i = ['L', 'N', 'G'].indexOf(k), xs = ['L', 'N', 'G'].map((n) => V3(...dv.fit.pins[n].slice(0, 3)).applyMatrix4(dv.v.m4).x).sort((a, b) => a - b)
    const pos = xs.findIndex((x) => Math.abs(x - V3(mx, my, mz).applyMatrix4(dv.v.m4).x) < 1e-6) + 1
    void i
    const q = { X: (p.x + SW / 2) * 1000, Y: (Y0 + 0.051 + SH - p.y) * 1000, z: surfaceZ(dv, p.x, p.y, p.z), e, pin: k, conf: 'measured', where: `terminal ${k}: ${['1st', '2nd', '3rd'][pos - 1]} of 3 from the left in the block at the top (sheet 6 calls it ${t}; L/N/G order to confirm on the label)`, dev: 'RCP1' }
    q.L = landing(dv, P(q.X, q.Y, q.z + 0.0012), e)
    return q
  }
  const lay = dv.lay; if (!lay) return null
  const k = pinKey(lay, rawTerm)
  if (!k) { console.warn('no pin', devTag, rawTerm); return null }
  if (dv.fit?.pins?.[k] && dv.v) {
    // V5: a terminal placed from the maker's model (lug screw centre), then its opening found in the model
    const [mx, my, mz, e] = dv.fit.pins[k], pw = V3(mx, my, mz).multiplyScalar(0.001).add(dv.vendor.position)
    const p = { X: (pw.x + SW / 2) * 1000, Y: (Y0 + 0.051 + SH - pw.y) * 1000, z: pw.z, e, pin: k, conf: 'measured', where: whereText(lay, k), dev: devTag }
    p.L = landing(dv, pw, e)
    return p
  }
  const [u, v, zf, e] = lay.pins[k]
  const X = dv.r.X0 + u * (dv.r.X1 - dv.r.X0), Y = dv.r.Yt + v * (dv.r.Yb - dv.r.Yt)
  let z = dv.z0 + (dv.z1 - dv.z0) * zf, conf = lay.conf
  // the screw or face at the pin: on the model's surface (catalogue-shape parts: their own surface too)
  z = surfaceZ(dv, SX(X), SY(Y), z) + 0.0012
  const p = { X, Y, z, e, pin: k, conf, where: whereText(lay, k), dev: devTag }
  if (e === 'f') p.side = v < 0.5 ? 'up' : 'down'
  p.L = landing(dv, P(X, Y, z), e)
  if (e === 'f') {
    // V5: front-entry terminals in one column (CB4's eight outputs): a wire passes in front of every terminal between it and
    // its duct, so each one stands off the face by 4.5 mm more than the ones it passes, like a dressed comb
    const passed = Object.entries(lay.pins).filter(([n, q]) => n !== k && q[3] === 'f' && Math.abs(q[0] - u) < 0.03 && (p.side === 'up' ? q[1] < v - 0.005 : q[1] > v + 0.005)).map(([, q]) => q[1]).filter((y, i, a) => a.indexOf(y) === i).length
    if (passed) p.L.clear.addScaledVector(p.L.a, passed * 0.0045)
  }
  return p
}
// PowerFlex 525 terminals as the blocks are built (520-UM001 p.36, p.42)
const PF_ROWS = { 'control block, rear (upper) tier': ['R1', 'R2', 'R5', 'R6', '01', '02', '03', '04', '05', '06', '07', '08', 'C1', 'C2'], 'control block, front (lower) tier': ['S1', 'S2', 'S+', '11', '12', '13', '14', '15', '16', '17', '18', '19'], 'power block at the bottom, upper row': ['L1', 'L2', 'L3', 'T1', 'T2', 'T3'], 'power block at the bottom, lower row': ['PE2', 'DC-', 'DC+', 'BR+', 'PE'] }
function pfWhere(k) {
  if (k === 'RJ45') return 'EtherNet/IP jack right of the control block, under the control cover, plug in from below'
  const kk = k === '4' ? '04' : k
  for (const [row, names] of Object.entries(PF_ROWS)) { const i = names.indexOf(kk); if (i >= 0) return `${row}, ${['1st', '2nd', '3rd'][i] ?? `${i + 1}th`} of ${names.length} from the left${kk === 'PE' ? ' (the right-hand PE, green screw)' : ''}, wire in from below` }
  return k
}
// one block of a strip as its own small device, for the landing probe
function stripDv(dv, i) {
  const s = dv.d.strip, x0 = SX(s.x0 + s.pitch * i), x1 = SX(s.x0 + s.pitch * (i + 1))
  dv.blocks ??= []
  return (dv.blocks[i] ??= { obj: dv.obj, x0, x1, yT: dv.yT, yB: dv.yB, z0: dv.z0, z1: dv.z1, get soup() { return soupOf(dv) }, set soup(v) {}, get holeGeos() { return (dv.holeGeos ??= []) }, set holeGeos(v) {} })
}

// ------------------------------------------------------------------ the duct graph (sheet 3 mm) and routing that keeps power and control apart
const DUCT = G.DUCTS.map((d) => { const [X0, X1, Yt, Yb] = d.r; const horiz = (X1 - X0) > (Yb - Yt); return { ...d, X0, X1, Yt, Yb, horiz, c: horiz ? (Yt + Yb) / 2 : (X0 + X1) / 2, a0: horiz ? X0 : Yt, a1: horiz ? X1 : Yb, half: horiz ? (Yb - Yt) / 2 : (X1 - X0) / 2 } })
// which ducts AC power is meant to use (around Q1/FU1/PDB1, rail 1 and the drives) and which carry DC and signals
const DUCT_CLASS = { D1: 'dc', D2: 'ac', D3: 'ac', D4: 'ac', D5: 'ac', D6: 'dc', D7: 'any', D8: 'dc', D9: 'dc' }
const NODES = [], dn = DUCT.map(() => [])
const addNode = (x, y, ducts) => { const i = NODES.length; NODES.push({ x, y }); for (const k of ducts) dn[k].push(i); return i }
DUCT.forEach((h, i) => { if (!h.horiz) return; DUCT.forEach((v, j) => {
  if (v.horiz) return
  const inX = v.c >= h.X0 - v.half - 1 && v.c <= h.X1 + v.half + 1, inY = h.c >= v.Yt - h.half - 1 && h.c <= v.Yb + h.half + 1
  if (inX && inY) addNode(v.c, h.c, [i, j])
}) })
DUCT.forEach((d, i) => { addNode(d.horiz ? d.a0 + 5 : d.c, d.horiz ? d.c : d.a0 + 5, [i]); addNode(d.horiz ? d.a1 - 5 : d.c, d.horiz ? d.c : d.a1 - 5, [i]) })
const ADJ = NODES.map(() => [])
const along = (d, n) => d.horiz ? NODES[n].x : NODES[n].y
DUCT.forEach((d, i) => { const l = dn[i].slice().sort((a, b) => along(d, a) - along(d, b)); for (let k = 1; k < l.length; k++) { const a = l[k - 1], b = l[k], w = Math.abs(along(d, b) - along(d, a)); ADJ[a].push([b, w, i]); ADJ[b].push([a, w, i]) } })
function entry(p0) {
  let best = null
  const side = { t: 'up', b: 'down', l: 'left', f: null }[p0.e] ?? p0.side
  // V5: measured from where the wire is once it is out of the device (straight out of its opening), so a wire never
  // turns towards a side duct while it is still inside the device's outline
  const p = p0.clearPt ? { X: (p0.clearPt.x + SW / 2) * 1000, Y: (Y0 + 0.051 + SH - p0.clearPt.y) * 1000 } : p0
  const sideCost = p0.e === 'f' ? 200 : 60
  for (let i = 0; i < DUCT.length; i++) {
    const d = DUCT[i]
    let q = null, cost = 0
    if (p.X >= d.X0 && p.X <= d.X1 && p.Y >= d.Yt && p.Y <= d.Yb) { q = d.horiz ? { X: p.X, Y: p.Y, cY: d.c } : { X: p.X, Y: p.Y, cX: d.c }; cost = -1 }
    else if (d.horiz && p.X >= d.X0 + 3 && p.X <= d.X1 - 3) {
      if (d.Yb <= p.Y + 2) { q = { X: p.X, Y: d.Yb, cY: d.c }; cost = p.Y - d.Yb + (side === 'down' ? 400 : 0) }
      else if (d.Yt >= p.Y - 2) { q = { X: p.X, Y: d.Yt, cY: d.c }; cost = d.Yt - p.Y + (side === 'up' ? 400 : 0) }
    } else if (!d.horiz && p.Y >= d.Yt + 3 && p.Y <= d.Yb - 3) {
      if (d.X1 <= p.X + 2) { q = { X: d.X1, Y: p.Y, cX: d.c }; cost = p.X - d.X1 + (side === 'left' ? 10 : sideCost) }
      else if (d.X0 >= p.X - 2) { q = { X: d.X0, Y: p.Y, cX: d.c }; cost = d.X0 - p.X + sideCost }
    }
    if (q && (!best || cost < best.cost)) best = { ...q, cost, i }
  }
  return best
}
function route(a, b, cls) {
  const ea = entry(a), eb = entry(b)
  if (!ea || !eb) return null
  const tmp = (e) => { const d = DUCT[e.i]; const x = d.horiz ? e.X : d.c, y = d.horiz ? d.c : e.Y; const i = NODES.length; NODES.push({ x, y }); ADJ.push([]); for (const n of dn[e.i]) { const w = Math.abs(along(d, n) - (d.horiz ? x : y)); ADJ[i].push([n, w, e.i]) } return i }
  const na = tmp(ea), nb = tmp(eb)
  if (ea.i === eb.i) { const d = DUCT[ea.i]; const w = Math.abs(d.horiz ? NODES[na].x - NODES[nb].x : NODES[na].y - NODES[nb].y); ADJ[na].push([nb, w, ea.i]) }
  for (const [n, w, di] of ADJ[nb]) ADJ[n].push([nb, w, di])
  const pen = (di) => { const c = DUCT_CLASS[DUCT[di].id]; return cls === 'any' || c === 'any' || c === cls ? 1 : 3.5 }
  const dist = new Array(NODES.length).fill(Infinity), prev = new Array(NODES.length).fill(-1), prevD = new Array(NODES.length).fill(-1), done = new Set()
  dist[na] = 0
  for (;;) {
    let u = -1, best = Infinity; for (let i = 0; i < NODES.length; i++) if (!done.has(i) && dist[i] < best) { best = dist[i]; u = i }
    if (u < 0 || u === nb) break
    done.add(u)
    for (const [v, w, di] of ADJ[u]) { const c = dist[u] + w * pen(di); if (c < dist[v]) { dist[v] = c; prev[v] = u; prevD[v] = di } }
  }
  const path = [], ducts = []
  for (let u = nb; u >= 0; u = prev[u]) { path.unshift({ ...NODES[u] }); if (prevD[u] >= 0) ducts.unshift(prevD[u]) }
  for (const [n] of ADJ[nb]) ADJ[n] = ADJ[n].filter(([v]) => v !== nb)
  for (const [n] of ADJ[na]) ADJ[n] = ADJ[n].filter(([v]) => v !== na)
  NODES.length -= 2; ADJ.length -= 2
  if (dist[nb] === Infinity) return null
  if (!ducts.length) ducts.push(ea.i)
  return { ea, eb, path, ducts: ducts.filter((x, i) => x !== ducts[i - 1]) }
}
const P = (X, Y, z) => V3(SX(X), SY(Y), z)
// from the clamp out of the device: [clamp, ferrule end, clear of the device]
function leadOut(p) {
  if (p.free) return { pts: [P(p.X, p.Y, p.z)], clamp: null }
  if (p.L) {
    // V5: the conductor sits in the terminal's real opening (landing): insulation stops at the end of the ferrule collar,
    // the bare end of a lug wire or the back of an RJ45 plug, then the wire runs straight out of the device before it turns
    const { tip, mouth, a, clear } = p.L, k = p.et?.k
    const insS = k === 'rj45' ? 0.024 : k === 'bare' ? Math.max(a.dot(mouth) - a.dot(tip) + 0.0012, 0.004) : Math.max(0.0115, a.dot(mouth) - a.dot(tip) + 0.0005)
    const ins = tip.clone().addScaledVector(a, insS)
    // V8: a landing with its own way out of the device (the 1769 blocks: down the column, then its lane under the door)
    if (p.L.via) { const vp = [ins, ...p.L.via.map((v) => v.clone()), clear.clone()]; p.clearPt = vp[vp.length - 1]; return { pts: vp, clamp: tip, dIn: a.clone().negate(), a, ins } }
    const pts = [ins]
    const left = a.dot(clear) - a.dot(ins)
    if (left > 0.006) { pts.push(ins.clone().addScaledVector(a, left * 0.55), clear.clone()) } else pts.push(ins.clone().addScaledVector(a, 0.006))
    p.clearPt = pts[pts.length - 1]
    return { pts, clamp: tip, dIn: a.clone().negate(), a, ins }
  }
  const c = P(p.X, p.Y, p.z), dIn = ENTRY_IN[p.e] ?? ENTRY_IN.f
  const q = c.clone().addScaledVector(dIn, -0.0115), q2 = c.clone().addScaledVector(dIn, -0.026)
  if (p.e === 'f') q2.add(V3(0, 0, 0.004))
  return { pts: [q, q2], clamp: c, dIn }
}
function wirePoints(a, b, lane, cls, od = 0.003) {
  const la = leadOut(a), lb = leadOut(b)
  const r = route(a, b, cls); if (!r) return null
  const zl = PZ + 0.008 + (lane % 7) * 0.005, off = ((lane * 7) % 11 - 5) * 2.2
  const toDuct = (p0, e, outPts) => {
    // V8: an off-plate end (field gland, door, A/C, subplate 2) has no clamp on the plate: its tail takes over straight from
    // the duct lane. V7 went to the exit point first and doubled back 8 mm, which kinked 60 wires and cables there.
    if (p0.exit && p0.free) return [P(e.cX !== undefined ? e.cX + off : e.X, e.cY !== undefined ? e.cY + off : e.Y, zl)]
    const last = outPts[outPts.length - 1]
    const p = p0.clearPt ? { ...p0, X: (p0.clearPt.x + SW / 2) * 1000, Y: (Y0 + 0.051 + SH - p0.clearPt.y) * 1000 } : p0
    const dirY = e.cY !== undefined ? Math.sign(e.Y - p.Y) : 0, dirX = e.cX !== undefined ? Math.sign(e.X - p.X) : 0
    const pts = [...outPts]
    // V9: out of a front entry the wire runs on straight for a few diameters, then turns: room for a bend it can make
    if (p.e === 'f' && !p.free) { const R = Math.max(0.012, od * 3.5); pts.push(V3(last.x, last.y, last.z + R), V3(last.x, SY(p.Y + dirY * (12 + R * 1600)), last.z + R + 0.002)) }
    // a side duct: first a short run on along the axis it left by, then across at that height, so the bend is a bend
    else if (p0.L && dirX && !dirY) pts.push(last.clone().addScaledVector(p0.L.a, 0.006))
    // V9: a wire coming from far in front of the plate (a drive, T1, a tall device) stays out there until it is over the
    // duct and drops in from the front; V8 pulled it back to 90 mm within a few millimetres of leaving the device
    const lz = pts[pts.length - 1].z
    pts.push(V3(SX(e.X - dirX * 6), SY(e.Y - dirY * 6), Math.max(PZ + 0.03, lz > PZ + 0.09 ? lz - (lz - PZ - 0.09) * 0.25 : lz)))
    pts.push(P(e.cX !== undefined ? e.cX + off : e.X, e.cY !== undefined ? e.cY + off : e.Y, zl))
    return pts
  }
  const A = toDuct(a, r.ea, la.pts), B = toDuct(b, r.eb, lb.pts).reverse()
  // V9: a run that only crosses one duct (in one side, out the other at the same place) goes over it, not down into it
  if (A.length > 1 && B.length > 1 && A[A.length - 1].distanceTo(B[0]) < 0.03) {
    const m = A[A.length - 1].clone().lerp(B[0], 0.5); m.z = Math.max(zl, Math.min(A[A.length - 2].z, B[1].z) - 0.006)
    A[A.length - 1] = m; B.shift()
    const pts = [...A, ...B].filter((p, i, arr) => i === 0 || p.distanceTo(arr[i - 1]) > 0.002)
    return { pts, ducts: r.ducts.map((i) => DUCT[i].id), clampA: la.clamp, clampB: lb.clamp, dInA: la.dIn, dInB: lb.dIn, insA: la.ins, insB: lb.ins }
  }
  const poly0 =[{ x: A[A.length - 1].x, y: A[A.length - 1].y }, ...r.path.slice(1, -1).map((n) => ({ x: SX(n.x + off), y: SY(n.y + off) })), { x: B[0].x, y: B[0].y }]
  // V9: two turns less than 30 mm apart (a duct junction a lane crosses at an offset) are one turn: a short leg between
  // them left no room for a bend the wire can make. Corner cuts grow with the wire.
  const poly = [poly0[0]], pe = poly0[poly0.length - 1]
  for (let k = 1; k < poly0.length - 1; k++) {
    const p = poly0[k], q = poly0[k + 1]
    // a turn within 30 mm of where the wire joins or leaves the duct run is cut across
    if (Math.hypot(p.x - poly0[0].x, p.y - poly0[0].y) < 0.03 || Math.hypot(p.x - pe.x, p.y - pe.y) < 0.03) continue
    if (k + 1 < poly0.length - 1 && Math.hypot(q.x - p.x, q.y - p.y) < 0.03) { poly.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }); k++ } else poly.push(p)
  }
  poly.push(poly0[poly0.length - 1])
  const dense = []
  for (let k = 1; k < poly.length; k++) {
    const p0 = poly[k - 1], p1 = poly[k], L = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    if (L < 1e-4) continue
    // the corner itself, and points along the straight well clear of it: roundCorners (below) makes the bend
    const ux = (p1.x - p0.x) / L, uy = (p1.y - p0.y) / L, n = Math.floor(L / 0.06)
    for (let j = 1; j < n; j++) { const t = L * j / n; if (t > 0.035 && L - t > 0.035) dense.push(V3(p0.x + ux * t, p0.y + uy * t, zl)) }
    if (k < poly.length - 1) dense.push(V3(p1.x, p1.y, zl))
  }
  const pts = [...A, ...dense, ...B].filter((p, i, arr) => i === 0 || p.distanceTo(arr[i - 1]) > 0.002)
  return { pts, ducts: r.ducts.map((i) => DUCT[i].id), clampA: la.clamp, clampB: lb.clamp, dInA: la.dIn, dInB: lb.dIn, insA: la.ins, insB: lb.ins }
}

// ------------------------------------------------------------------ wire colours (assumed: the drawings give none; see Modeling issues)
const WC = {
  // NFPA 79 13.2.4 (the drawings give no colours): black power, red AC control, white AC grounded, blue DC control,
  // white with blue stripe DC grounded, green (with or without yellow) protective earth
  power: { hex: '#141414', name: 'black (NFPA 79)' }, hot120: { hex: '#b8191b', name: 'red (NFPA 79)' }, neutral: { hex: '#e9e9e4', name: 'white (NFPA 79)' },
  dc: { hex: '#1f4fb8', name: 'blue (NFPA 79)' }, dc0: { hex: '#cfe0f5', name: 'white/blue stripe (NFPA 79)' }, gnd: { hex: '#2c8a3a', name: 'green/yellow (NFPA 79)' },
  link: { hex: '#b4b8bb', name: 'metal jumper link, supplied with the transformer' },
  iol: { hex: '#e6c21c', name: 'yellow jacket (LUTZE A1021803-1)' }, eth: { hex: '#2a9d8f', name: 'teal patch cord' }, field: { hex: '#3d3f42', name: 'black jacket (field cable)' },
}
const wireMats = {}
const wmat = (k) => wireMats[k] ??= MAT.plastic({ color: WC[k]?.hex ?? k, roughness: 0.36, clearcoat: 0.3, clearcoatRoughness: 0.35, finish: null })
const AWG_OD = { '4': 8.6, '6': 7.2, '8': 5.9, '10': 4.6, '12': 3.9, '14': 3.4, '16': 2.9, '18': 2.6, '20': 2.2, '22': 1.9 }   // MTW/THHN insulated OD, mm (typical)
// V13: a conductor the guide adds that is on no sheet (s.added, set in build.mjs) must not read as if it were on one.
// s.sheet still says which sheet's step it is wired with (and gives it its colour class below).
const sheetTxt = (s) => s.added ? `NOT ON THE DRAWINGS (wired with sheet ${s.sheet})` : `sheet ${s.sheet}${s.line ? `, line ${esc(s.line)}` : ''}`
const kindOf = (s) => {
  if (s.kind === 'iol' || s.kind === 'eth' || s.kind === 'field') return s.kind
  const p = String(s.potential ?? ''), f = `${s.from.dev} ${s.from.term} ${s.to.dev} ${s.to.term}`
  if (p === 'GND' || /GND BAR/.test(f) && !/DC -|COM/.test(f)) return 'gnd'
  if (s.sheet === 4 && s.label === 'W54') return 'hot120'
  if (s.sheet === 4 && s.label === 'W19') return 'neutral'
  if (s.sheet <= 5 && !/\bS[12]\b|Digital|E-STOP|TB4|OUT-|OUT\+|DC-COM|24V/.test(f + ' ' + p)) return 'power'
  if (s.sheet === 6 || s.sheet === 4 && /T1|FU2|TB2|RCP1/.test(f) && !/PWS1/.test(f)) return p === 'N' ? 'neutral' : 'hot120'
  if (/PDB3|0V|OUT-|DC COM|DC -|N24|Com|AIn-|AOut-|X31-1|V-|US-|\(lamp\)|DC-COM/.test(f + ' ' + p) && !/X1 \(lamp\)/.test(f)) return 'dc0'
  return 'dc'
}
const classOf = (k) => k === 'gnd' ? 'any' : ['power', 'hot120', 'neutral'].includes(k) ? 'ac' : 'dc'

// ------------------------------------------------------------------ what goes on the end of a conductor at each terminal (cited where a document says)
const PN_OF = Object.fromEntries(G.DEVICES.map((d) => [d.tag, d.pn])); PN_OF.GB1 = 'D167-14'; PN_OF.RCP1 = '1492-REC15'
const TERM_SPEC = {
  '25B-D024N104': { power: 'Torque 1.76-2.16 N·m (15.6-19.1 lb·in); 10-6 AWG (520-UM001 p.36)', control: 'Control block (520-UM001 p.42); remove the control module cover to reach it' },
  '140MT-F9E-C32': 'Torque 3-3.5 N·m (27-30 lb·in); 14-1 AWG (PartsLib record, 140-TD005 p.44)',
  'FAZ-D2-3-NA': 'Torque 2.4 N·m (21 lb·in) for 18-12 AWG, 2.8 N·m (25 lb·in) for 10-8 AWG; no ferrule (Eaton FAZ-NA p.6)',
  'FAZ-C2-1-NA-SP': 'Torque 2.4 N·m (21 lb·in) for 18-12 AWG, 2.8 N·m (25 lb·in) for 10-8 AWG; no ferrule (Eaton FAZ-NA p.6)',
  '1492-J4': 'Torque 1.0 N·m (9 lb·in); 22-10 AWG; strip 10 mm (1492-TD015 p.2)',
  '1492-J6': 'Torque 1.6 N·m (14.2 lb·in); 22-8 AWG; strip 12 mm (1492-TD015 p.2)',
  '1492-JD4': '26-10 AWG; strip 8 mm (1492-TD015 p.5)',
  '1492-PDC-3A200-S0108': 'Line 3/0-#8 AWG 18.3-22.4 N·m; load #2-#8 AWG 5.1-6.2 N·m, #10-#14 AWG 4.1-5.0 N·m (1492-TD019 p.7)',
  '1769-PB2': '14 AWG solid Cu 90 °C, 1.27 N·m (11.24 lb·in); up to two wires per terminal (1769-IN028 p.11)',
  '1769-OW16': 'Terminal screws 0.68 N·m (6 lb·in); #14-22 AWG (1769-IN062 p.10, web copy)',
  '2787-2347': 'Input and signal: CAGE CLAMP 28-12 AWG, strip 8-9 mm; output: push-in 20-8 AWG (WAGO data sheet p.2)',
  '787-1668': 'Input (+): push-in 20-8 AWG, strip 13-15 mm; outputs and 0 V: CAGE CLAMP 28-12 AWG (WAGO data sheet p.2, /000-080 variant)',
  AL1920: 'Cage-clamp plugs; 26-12 AWG, rated at least 75 °C for UL (ifm manual 80284064 p.14)',
  'PTFIX 6-12X2,5 BU': 'Push-in; strip 8-10 mm; 26-12 AWG; ferrules 0.14-2.5 mm² (Phoenix data sheet p.2)',
  'PTFIX 6-18X2,5 BUWH': 'Push-in; strip 8-10 mm; 26-12 AWG; ferrules 0.14-2.5 mm² (Phoenix data sheet p.2)',
  'NAT-102': 'Spring terminal 16-28 AWG; strip 8-9 mm (Moxa NAT-102 QIG p.7)',
  'K3A26U2N': 'Torque 50 lb·in; #14-2/0 AWG (Burndy spec sheet)',
  '800H-FRXJTQH2RA5': 'Contact blocks #18-14 AWG, 6-8 lb·in (800-TD009 p.3)',
  '1492-REC15': 'Torque 0.79 N·m (7 lb·in); 20-10 AWG (1492-TD015 p.51)',
  'D167-14': 'Taps 6-14 AWG (ILSCO D167)',
}
function specFor(tag, pin) {
  const pn = PN_OF[tag] ?? (DEV[tag]?.d.strip ? DEV[tag].d.pn : null)
  const s = TERM_SPEC[pn]
  if (!s) return { text: pn ? `No terminal data for ${pn} in the documents held` : '', pn }
  if (typeof s === 'string') return { text: s, pn }
  return { text: /^(L\d|T\d|PE|DC|BR)/.test(pin ?? '') ? s.power : s.control, pn }
}
function endType(p, awg, kind) {
  if (!p || p.free || p.exit) return null
  // V11: a site conductor with no size printed (the feeder) goes bare into its lug or tap
  if (p.feederEnd) return { k: 'bare', text: 'Bare stranded into the lug (size not on the drawings)' }
  if (kind === 'link') return { k: 'link', text: 'Under the terminal screw' }
  if (['FAZ-D2-3-NA', 'FAZ-C2-1-NA-SP'].includes(PN_OF[p.dev])) return { k: 'bare', text: 'Bare, no ferrule (Eaton FAZ-NA p.6)' }
  if (kind === 'eth') return { k: 'rj45', text: 'RJ45 plug' }
  if (['4', '6', '8'].includes(String(awg))) return { k: 'bare', text: 'Bare stranded into the lug' }
  return { k: 'ferrule', text: 'Insulated ferrule (shop standard size)' }
}
function endHardware(clamp, dIn, od, et, list, ins) {
  if (!clamp || !et) return
  if (ins) {
    // V5: from the conductor's tip in the clamp outwards: ferrule sleeve 8 mm then its collar; a bare end to the insulation;
    // an RJ45 plug body in the jack
    const a = dIn.clone().negate(), at_ = (s) => clamp.clone().addScaledVector(a, s)
    if (et.k === 'ferrule') { list.metal.push(rod(at_(0), at_(0.008), od * 0.26)); list.collar.push(rod(at_(0.0075), at_(0.0115), od * 0.56)) }
    else if (et.k === 'bare') list.copper.push(rod(at_(0), ins.clone().addScaledVector(a, 0.0005), od * 0.34))
    else if (et.k === 'rj45') { list.plug.push(rod(at_(0), at_(0.0215), 0.0068, 4)); list.metal.push(rod(at_(0.0205), at_(0.0245), 0.0034, 10)) }
    return
  }
  const out = clamp.clone().addScaledVector(dIn, -0.0115)
  if (et.k === 'ferrule') { list.metal.push(rod(clamp.clone().addScaledVector(dIn, 0.002), clamp.clone().addScaledVector(dIn, -0.008), od * 0.26)); list.collar.push(rod(clamp.clone().addScaledVector(dIn, -0.008), out, od * 0.56)) }
  else if (et.k === 'bare') list.copper.push(rod(clamp.clone().addScaledVector(dIn, 0.002), out, od * 0.34))
  else if (et.k === 'rj45') list.plug.push(rod(clamp.clone().addScaledVector(dIn, 0.003), out.clone().addScaledVector(dIn, -0.008), 0.0068, 4))
}

// ------------------------------------------------------------------ markers: wire numbers printed on white heat-shrink sleeves
const ATLAS = { c: document.createElement('canvas'), cells: new Map(), n: 0, cw: 64, ch: 256 }
ATLAS.c.width = 2048; ATLAS.c.height = 2048
const actx = ATLAS.c.getContext('2d'); actx.fillStyle = '#f7f7f2'; actx.fillRect(0, 0, 2048, 2048)
const atlasTex = new THREE.CanvasTexture(ATLAS.c); atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 8
function atlasCell(text) {
  if (ATLAS.cells.has(text)) return ATLAS.cells.get(text)
  const i = ATLAS.n++, cols = 2048 / ATLAS.cw, cx = (i % cols) * ATLAS.cw, cy = Math.floor(i / cols) * ATLAS.ch
  actx.save(); actx.fillStyle = '#f7f7f2'; actx.fillRect(cx, cy, ATLAS.cw, ATLAS.ch)
  actx.fillStyle = '#111'; actx.font = `700 ${text.length > 7 ? 24 : 34}px "JetBrains Mono", Consolas, monospace`; actx.textAlign = 'center'; actx.textBaseline = 'middle'
  for (const s of [0.25, 0.75]) { actx.save(); actx.translate(cx + ATLAS.cw * 0.5, cy + ATLAS.ch * s); actx.rotate(-Math.PI / 2); actx.fillText(text, 0, 2, ATLAS.ch * 0.46); actx.restore() }
  actx.restore()
  const cell = { u0: cx / 2048, u1: (cx + ATLAS.cw) / 2048, v0: 1 - (cy + ATLAS.ch) / 2048, v1: 1 - cy / 2048 }
  ATLAS.cells.set(text, cell); atlasTex.needsUpdate = true
  return cell
}
const markerMat = MAT.plastic({ color: '#ffffff', map: atlasTex, roughness: 0.55, finish: null })
function sleeve(curve, t, rad, text, len = 0.014) {
  const p = curve.getPointAt(t), tg = curve.getTangentAt(t)
  const g = new THREE.CylinderGeometry(rad + 0.0007, rad + 0.0007, len, 16, 1, true)
  const c = atlasCell(text), uv = g.attributes.uv
  for (let k = 0; k < uv.count; k++) { const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, lerp(c.u0, c.u1, (u * 2) % 1 || (u > 0.5 ? 1 : 0)), lerp(c.v0, c.v1, v)) }
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), tg)); g.translate(p.x, p.y, p.z)
  return g
}
// V9: round every corner of a run to a radius the wire can make. Each vertex that turns more than 30 degrees is replaced
// by an arc tangent to both legs, as large as the legs allow up to rMax (three diameters, at least 12 mm). keep: the
// first and last points that must stay as they are (the straight ferrule section in each clamp).
function roundCorners(pts, od, keepA = 2, keepB = keepA) {
  const rMax = Math.max(0.012, od * 3.2), out = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], a = pts[i - 1], b = pts[i + 1]
    const u1 = p.clone().sub(a), u2 = b.clone().sub(p), l1 = u1.length(), l2 = u2.length()
    if (i < keepA || i > pts.length - 1 - keepB || l1 < 1e-5 || l2 < 1e-5) { out.push(p); continue }
    u1.divideScalar(l1); u2.divideScalar(l2)
    const ang = Math.acos(clamp(u1.dot(u2), -1, 1))
    if (ang < 0.52) { out.push(p); continue }
    // tangent length for radius rMax, limited to 45 % of each leg so neighbouring corners do not overlap
    const t = Math.min(rMax * Math.tan(ang / 2), l1 * 0.45, l2 * 0.45)
    if (t < 0.002) { out.push(p); continue }
    const p0 = p.clone().addScaledVector(u1, -t), p1 = p.clone().addScaledVector(u2, t)
    out.push(p0)
    for (const s of [0.25, 0.5, 0.75]) out.push(p0.clone().multiplyScalar((1 - s) * (1 - s)).addScaledVector(p, 2 * s * (1 - s)).addScaledVector(p1, s * s))
    out.push(p1)
  }
  out.push(pts[pts.length - 1])
  return out.filter((p, i, arr) => i === 0 || p.distanceTo(arr[i - 1]) > 0.0015)
}
const tube = (pts, r, radial = 6) => { const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5); return { c, g: new THREE.TubeGeometry(c, Math.min(420, Math.max(16, Math.round(c.getLength() / 0.0065))), r, radial, false) } }

// ------------------------------------------------------------------ build every conductor and cable
const WIRES = []                    // per segment: { s, obj, tubes[], kind, curve, step, len, ends, ducts }
// V13 (Draft rev20): HMI1 and the E-STOP are on the right door, which hinges on the centre post. Their wires leave the plate
// from duct D5 (below the drives) at the centre post and cross to the door at its hinge edge. The drawings do not show a
// route: Design issues. (V12: the left door, leaving from the left riser along the left wall.)
const DOOR_HINGE_X = doorR.position.x - 0.012
const DOOR_EXIT = { X: Math.round((DOOR_HINGE_X + SW / 2) * 1000), Y: 738 }, AC_EXIT = { X: 42, Y: 140 }
const DUCT_USE = Object.fromEntries(G.DUCTS.map((d) => [d.id, { ac: new Set(), dc: new Set() }]))
const FIELD_EXIT = (X) => ({ X: clamp(X, 120, 1040), Y: 1440, z: PZ + 0.03, e: 'b', exit: true, free: true })
const EP_CACHE = new Map()
// Field devices: a far end at one of these is site wiring (a tail to a floor gland), not an error. Job-specific: list
// the prefixes of this job's field device tags here.
const FIELD_DEVICE = /^(MTR|FM|CE|LT|TT|SC|Plant)/
const UNRESOLVED = new Set()
function endpoint(e, key) {
  const dev = e.dev
  if (dev === 'Panel' || dev === 'ACU') return { ...AC_EXIT, z: PZ + 0.03, e: 'l', offplate: 'A/C', exit: true, free: true }
  if (dev === 'HMI1' || dev === 'E-STOP') return { ...DOOR_EXIT, z: PZ + 0.03, e: 'l', offplate: dev, exit: true, free: true, door: dev }
  if (dev === 'VM1') return { X: 30, Y: 1000, z: PZ + 0.03, e: 'l', offplate: 'VM1', exit: true, free: true, sub2: true }
  if (FIELD_DEVICE.test(dev)) return null
  // V8: a terminal is probed once; every conductor on it gets its own copy to place itself in the clamp
  const ck = dev === 'GND BAR' || dev === 'GB1' ? `GB|${key}` : `${dev}|${e.term}`
  if (!EP_CACHE.has(ck)) EP_CACHE.set(ck, term(dev, e.term, key))
  const p = EP_CACHE.get(ck)
  // An end that names a device or terminal the guide does not have is drawn as a field tail, which looks deliberate.
  // Keep the list: the audit fails on it (a mistyped tag or terminal in the wire list must not pass quietly).
  if (!p) UNRESOLVED.add(`${dev} ${e.term ?? ''}`.trim())
  return p ? { ...p, L: p.L ? { ...p.L } : undefined } : null
}
// V8: two conductors in one clamp lie side by side in it (V7 drew them on top of each other, as one wire). CLAMP_USE counts
// the conductors on each clamp before any is built; sideBySide then gives each its place across the clamp.
const CLAMP_USE = new Map()
const clampKey = (p) => p?.L && !p.exit ? `${p.dev}|${Math.round(p.L.tip.x * 2000)}|${Math.round(p.L.tip.y * 2000)}|${Math.round(p.L.tip.z * 2000)}` : null
function sideBySide(p, od) {
  const u = CLAMP_USE.get(clampKey(p)); if (!u || u.n < 2) return
  const [, U] = OUT_AX[p.e] ?? OUT_AX.f, sh = (u.i++ - (u.n - 1) / 2) * Math.min(od, 0.0032) * 0.95
  p.L = { ...p.L, tip: p.L.tip.clone().addScaledVector(U, sh), mouth: p.L.mouth.clone().addScaledVector(U, sh), clear: p.L.clear.clone().addScaledVector(U, sh) }
}
// V8: two terminals that face each other with nothing between them (Q1's load lugs straight above FU1's line lugs) are
// wired straight across. V7 took those conductors 135 mm sideways into a duct and back, with bends no 4 AWG wire makes.
function directRun(a, b) {
  if (!a.L || !b.L || a.exit || b.exit || a.dev === b.dev) return null
  const ea = a.L.a, eb = b.L.a
  if (Math.abs(ea.y) < 0.9 || Math.abs(eb.y) < 0.9 || ea.y * eb.y > 0) return null
  const la = leadOut(a), lb = leadOut(b), ca = la.pts[la.pts.length - 1], cb = lb.pts[lb.pts.length - 1]
  const gap = (cb.y - ca.y) * ea.y                    // how far b's way out lies ahead of a's, along a's way out
  if (gap < -0.004 || gap > 0.2 || Math.abs(ca.x - cb.x) > 0.045) return null
  const xa = Math.min(ca.x, cb.x) - 0.003, xb = Math.max(ca.x, cb.x) + 0.003, ya = Math.min(ca.y, cb.y), yb = Math.max(ca.y, cb.y)
  const mm = (x, y) => [(x + SW / 2) * 1000, (Y0 + 0.051 + SH - y) * 1000], [X0, Yb] = mm(xa, ya), [X1, Yt] = mm(xb, yb)
  if (DUCT.some((d) => d.X0 < X1 && d.X1 > X0 && d.Yt < Yb && d.Yb > Yt)) return null
  for (const [t, dv] of Object.entries(DEV)) { if (t === a.dev || t === b.dev || dv.x0 === undefined) continue; if (dv.x0 < xb && dv.x1 > xa && dv.yB < yb && dv.yT > ya) return null }
  const g = Math.max(gap, 0), mid = g > 0.07 ? [ca.clone().addScaledVector(ea, g * 0.15), cb.clone().addScaledVector(eb, g * 0.15)] : []
  return { pts: [...la.pts, ...mid, ...lb.pts.slice().reverse()], la, lb }
}
function tailFor(ex) {
  const wx = -W / 2 + T + 0.012, ey = SY(ex.Y)
  if (ex.offplate === 'A/C') return [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, 1.3, D * 0.42), V3(wx, 1.2, D * 0.5)]
  if (ex.sub2) return [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, lerp(ey, SUB2.y + 0.06, 0.5), SUB2.z - 0.12), V3(SUB2.x + 0.07, SUB2.y + 0.06, SUB2.z - 0.1)]   // V9: along the wall at its own height (V8 climbed 100 mm past VM1 and came back)
  if (ex.door) { const hx = DOOR_HINGE_X; return [V3(hx, ey, PZ + 0.05), V3(hx, ey - 0.01, lerp(PZ, D, 0.5)), V3(hx, ey - 0.03, D - 0.12), V3(hx + 0.004, ey - 0.05, D - 0.05)] }
  // field wiring: down out of the bottom duct to a cable gland in the enclosure floor (no entries are drawn: design issue)
  const g = glandAt(SX(ex.X))
  return [V3(SX(ex.X), SY(1436), PZ + 0.03), V3(lerp(SX(ex.X), g.x, 0.5), Y0 + 0.03, lerp(PZ + 0.03, g.z, 0.6)), V3(g.x, Y0 + T + 0.004, g.z), V3(g.x, Y0 - 0.05, g.z)]
}
// cable glands on the enclosure floor, one per 28 mm of plate, in two rows (feeder and motor cables would use bigger ones)
const GLANDS = new Map()
const glandG = new THREE.Group(); encG.add(glandG)
function glandAt(x) {
  const k = Math.round(x / 0.028)
  if (!GLANDS.has(k)) {
    const n = GLANDS.size, gx = k * 0.028, gz = 0.17 + (n % 2) * 0.05
    GLANDS.set(k, { x: gx, z: gz })
    const g = [cyl(0.0105, 0.004, gx, Y0 + T + 0.002, gz, 'y', 6), cyl(0.0085, 0.012, gx, Y0 + T + 0.01, gz, 'y', 24), GEO.lathe([[0, 0], [0.0085, 0], [0.007, 0.006], [0.004, 0.008], [0, 0.008]], 24).translate(gx, Y0 + T + 0.016, gz), cyl(0.0105, 0.004, gx, Y0 - 0.004, gz, 'y', 6)]
    glandG.add(mesh(g, MAT.plastic({ color: '#3a3c3f', roughness: 0.5 })))
  }
  return GLANDS.get(k)
}
function addDoorPart(w, ex, idx, kind, od, label) {
  const dv = DEV[ex.door], ey = SY(ex.Y) - 0.05, l = dv.local, k = (idx % 9) * 0.003
  const dp = [V3(-0.0114, ey, -0.054), V3(0.03, ey - 0.03, -0.04), V3(0.06 + k, l.y + 0.06, -0.038), V3(l.x - 0.05, l.y + k, -0.034), V3(l.x, l.y, l.z)]
  const { c, g } = tube(dp, od / 2)
  const o = new THREE.Mesh(g, wmat(kind)); o.castShadow = true; o.userData.wire = idx
  const h = new THREE.Group(); h.add(o); if (label) h.add(new THREE.Mesh(sleeve(c, 0.93, od / 2, label), markerMat))
  doorDevG.userData.real.add(h); w.tubes.push(o); w.doorTube = o; w.doorGroup = h
}
// cut length: the routed length, plus at each end the strip length from that terminal's document (10 mm if none is given)
// and a 50 mm service loop; a field end is left 300 mm long and coiled for the site, a door/A-C/subplate 2 end gets 100 mm
function cutOf(w, ends) {
  const parts = [{ what: 'routed length (clamp to clamp through the ducts)', mm: Math.round(w.len * 1000) }]
  for (const p of ends) {
    if (!p) continue
    if (p.exit && !p.offplate) { parts.push({ what: 'field end, left coiled for site', mm: 300 }); continue }
    if (p.exit) { parts.push({ what: `${p.offplate} end: slack at the hinge or wall`, mm: 100 }); continue }
    const sp = specFor(p.dev, p.pin).text ?? '', m = /strip (\d+)(?:-(\d+))? mm/.exec(sp)
    const strip = m ? Number(m[2] ?? m[1]) : 10
    parts.push({ what: `${p.dev} ${p.pin}: strip ${strip} mm${m ? '' : ' (not in the documents held)'} + 50 mm service loop`, mm: strip + 50 })
  }
  const total = parts.reduce((t, x) => t + x.mm, 0)
  return { parts, total: Math.ceil(total / 10) * 10 }
}
// V5: a wire's end hardware is one mesh coloured per part (ferrule sleeve, collar, copper), so 189 wires cost a few
// hundred draw calls fewer; RJ45 plugs stay see-through on their own
const HW_COL = { metal: '#c9ccce', collar: '#f1f1ec', copper: '#c27a4a' }
const hwMat = MAT.steel({ color: '#ffffff', vertexColors: true, roughness: 0.38, metalness: 0.55, finish: null })
function finishGroup(w, hw) {
  const g = w.obj, parts = []
  for (const k of ['metal', 'collar', 'copper']) for (const geo of hw[k]) {
    const c = new THREE.Color(HW_COL[k]), n = geo.attributes.position.count, col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); parts.push(geo)
  }
  if (parts.length) g.add(mesh(parts, hwMat))
  if (hw.plug.length) g.add(mesh(hw.plug, M.plug))
}
function addTail(pts, a, b) { if (a?.exit) pts.unshift(...tailFor(a).reverse()); if (b?.exit) pts.push(...tailFor(b)) }

const JUMPERS = {}                   // jumpers built so far on each device
// V11: a flat metal jumper link between two neighbouring screws (T1's H3-H2 480 V link), drawn as the link it is
function buildLink(s, idx) {
  const a = endpoint(s.from, s.id + ':a'), b = endpoint(s.to, s.id + ':b'); if (!a || !b) return null
  const pa = P(a.X, a.Y, a.z + 0.0012), pb = P(b.X, b.Y, b.z + 0.0012), d = pb.clone().sub(pa), L = d.length(), mid = pa.clone().lerp(pb, 0.5)
  const w = { s, kind: 'link', cls: 'ac', step: s.step, obj: new THREE.Group(), tubes: [], ends: [a, b], od: 0.006, link: true, ducts: [] }
  const g = box(0.0078, L + 0.011, 0.0012, 0, 0, 0, 0.0005); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize())); g.translate(mid.x, mid.y, mid.z)
  const o = new THREE.Mesh(g, wmat('link')); o.castShadow = true; o.receiveShadow = true; o.userData.wire = idx
  w.obj.add(o); w.tubes.push(o)
  w.obj.add(mesh([...screwHead(pa.x, pa.y, pa.z + 0.001, 0.0027), ...screwHead(pb.x, pb.y, pb.z + 0.001, 0.0027)], M.screw))
  w.curve = new THREE.CatmullRomCurve3([pa, mid, pb]); w.len = L
  w.cut = { parts: [{ what: 'jumper link supplied with the transformer: nothing to cut', mm: 0 }], total: 0 }
  w.cutText = 'nothing to cut'
  wiresG.add(w.obj)
  return w
}
// V11: a site conductor whose way into the enclosure is not on the drawings (the incoming feeder and ground, sheet 4):
// its landing, and a short tail standing out of the terminal with an open end
function buildFeeder(s, idx) {
  const b = endpoint(s.to, s.id + ':b'); if (!b?.L) return null
  const kind = kindOf(s), od = AWG_OD[s.awgDraw] / 1000
  b.feederEnd = true; b.et = endType(b, s.awgDraw, kind)
  sideBySide(b, od)
  const lo = leadOut(b), last = lo.pts[lo.pts.length - 1], a = b.L.a
  // on out of the terminal, then turning towards the front of the panel, where the installer brings it in
  const end = last.clone().addScaledVector(a, 0.07).add(V3(0, 0, 0.05))
  const pts = [end, last.clone().addScaledVector(a, 0.045).add(V3(0, 0, 0.012)), ...lo.pts.slice().reverse()]
  const far = { exit: true, free: true, offplate: 'the site feeder: entry not on the drawings', feeder: true, X: b.X, Y: b.Y, z: b.z }
  const w = { s, kind, cls: 'ac', step: s.step, obj: new THREE.Group(), tubes: [], ends: [far, b], od, feeder: true, ducts: [], cutText: 'length by the installer' }
  const hw = { metal: [], collar: [], copper: [], plug: [] }
  endHardware(lo.clamp, lo.dIn, od, b.et, hw, lo.ins)
  const { c, g } = tube(roundCorners(pts, od, 1, 2), od / 2, 9)
  const o = new THREE.Mesh(g, wmat(kind)); o.castShadow = true; o.receiveShadow = true; o.userData.wire = idx
  w.obj.add(o); w.tubes.push(o); w.curve = c; w.len = c.getLength()
  w.cut = { parts: [{ what: 'site conductor: length by the installer', mm: 0 }], total: 0 }
  finishGroup(w, hw); wiresG.add(w.obj)
  return w
}
function buildConductor(s, idx) {
  if (s.notFitted) return null
  if (s.link) return buildLink(s, idx)
  if (s.feeder) return buildFeeder(s, idx)
  const kind = kindOf(s), cls = classOf(kind)
  let a = endpoint(s.from, s.id + ':a'), b = endpoint(s.to, s.id + ':b')
  if (!a && b) a = FIELD_EXIT(b.X)
  if (!b && a) b = FIELD_EXIT(a.X)
  if (!a || !b) return null
  const od = (kind === 'eth' ? 5.8 : AWG_OD[s.awg] ?? 3.4) / 1000
  const w = { s, kind, cls, step: s.step, obj: new THREE.Group(), tubes: [], ends: [a, b], od }
  const hw = { metal: [], collar: [], copper: [], plug: [] }
  let pts, ducts = []
  a.et = endType(a, s.awg, kind); b.et = endType(b, s.awg, kind)
  sideBySide(a, od); sideBySide(b, od)
  const dr = directRun(a, b)
  if (dr) {
    pts = dr.pts; w.direct = true
    endHardware(dr.la.clamp, dr.la.dIn, od, a.et, hw, dr.la.ins); endHardware(dr.lb.clamp, dr.lb.dIn, od, b.et, hw, dr.lb.ins)
  } else if (s.from.dev === s.to.dev && !a.exit) {
    // a jumper on one device: out of each clamp and a short arc between them, clear of the device
    const la = leadOut(a), lb = leadOut(b)
    const ea = la.pts[la.pts.length - 1], eb = lb.pts[lb.pts.length - 1]
    // V12: a second and third jumper on the same device loop further out and further forward, so jumpers that
    // overlap along a strip (TB5-1 to -3 and TB5-2 to -4) pass over one another instead of through
    const nj = JUMPERS[s.from.dev] = (JUMPERS[s.from.dev] ?? -1) + 1
    const ax = la.a ?? V3(0, (a.e === 't' ? 1 : -1), 0), h = Math.max(0.008, od * 4.5)
    const mid = ea.clone().lerp(eb, 0.5).addScaledVector(ax, h).add(V3(0, 0, 0.004))
    // V9: between terminals closer than the wire can turn, the loop opens out sideways above them (a teardrop)
    const sd = eb.clone().sub(ea), gapJ = sd.length(), wide = gapJ < od * 6 && gapJ > 1e-5 ? [ea.clone().addScaledVector(ax, h * 0.55).addScaledVector(sd.clone().normalize(), -od * 1.6), mid, eb.clone().addScaledVector(ax, h * 0.55).addScaledVector(sd.clone().normalize(), od * 1.6)] : [mid]
    // V12: terminals far enough apart for the wire to turn between them (TB5-1 to TB5-3) get a plain U: straight on out
    // of each clamp, across, and back, each jumper on the device a step deeper and further forward than the last
    const dU = 0.012 + nj * 0.011, zU = 0.003 + nj * 0.006
    const uLoop = gapJ >= od * 3 && gapJ < 0.06 ? [ea.clone().addScaledVector(ax, dU).add(V3(0, 0, zU)), eb.clone().addScaledVector(ax, dU).add(V3(0, 0, zU))] : null
    pts = [...la.pts, ...(uLoop ?? wide), ...lb.pts.slice().reverse()]
    endHardware(la.clamp, la.dIn, od, a.et, hw, la.ins); endHardware(lb.clamp, lb.dIn, od, b.et, hw, lb.ins)
  } else {
    const r = wirePoints(a, b, idx, cls, od); if (!r) return null
    pts = r.pts; ducts = r.ducts
    endHardware(r.clampA, r.dInA, od, a.et, hw, r.insA); endHardware(r.clampB, r.dInB, od, b.et, hw, r.insB)
    addTail(pts, a, b)
  }
  const { c, g } = tube(roundCorners(pts, od, a.exit ? 1 : 2, b.exit ? 1 : 2), od / 2, s.awg === '4' ? 10 : 7)
  const o = new THREE.Mesh(g, wmat(kind)); o.castShadow = true; o.receiveShadow = true; o.userData.wire = idx
  w.obj.add(o); w.tubes.push(o); w.curve = c; w.len = c.getLength(); w.ducts = ducts; w.cut = cutOf(w, [a, b])
  // V12: a short jumper carries one marker, in the middle (two 14 mm sleeves do not fit side by side on it)
  if (s.label) { const L = w.len; w.obj.add(new THREE.Mesh(L < 0.11 ? sleeve(c, 0.5, od / 2, s.label) : GEO.merge([sleeve(c, clamp(0.03 / L, 0.01, 0.4), od / 2, s.label), sleeve(c, clamp(1 - 0.03 / L, 0.6, 0.99), od / 2, s.label)]), markerMat)) }
  finishGroup(w, hw)
  const ex = [a, b].find((e) => e?.door); if (ex) addDoorPart(w, ex, idx, kind, od, s.label)
  wiresG.add(w.obj)
  // site wiring to a field device has no drawn entry point, so it does not count towards duct sharing
  const toField = [a, b].some((e) => e?.exit && !e.offplate)
  if (!toField) for (const d of ducts) DUCT_USE[d][cls === 'ac' ? 'ac' : 'dc'].add(s.label || s.potential || s.id)
  return w
}

// a multi-core cable: jacket between two breakouts, every core to its own clamp with its own colour
function buildCable(s, idx) {
  const kind = s.kind, cls = 'dc'
  const coreEnds = s.cores.map((k, i) => ({ k, a: endpoint(k.from, `${s.id}:${i}:a`), b: endpoint(k.to, `${s.id}:${i}:b`) }))
  const side = (which) => {
    const all = coreEnds.map((c) => c[which]).filter((p) => p && !p.exit)
    // the breakout sits by the device most cores land on; a core to somewhere else (a shield to the ground bar) is routed
    const devs = all.map((p) => p.dev), main = devs.sort((a, b) => devs.filter((x) => x === b).length - devs.filter((x) => x === a).length)[0]
    const ts = all.filter((p) => p.dev === main)
    if (ts.length) {
      const X = ts.reduce((t, p) => t + p.X, 0) / ts.length, z = Math.max(...ts.map((p) => p.z))
      const up = ts.filter((p) => p.e === 't').length >= ts.length / 2
      // V5: the breakout sits beyond where the cores come out of the device (their landings' clear points)
      const cy = (p) => p.L ? (Y0 + 0.051 + SH - p.L.clear.y) * 1000 : p.Y
      const Y = up ? Math.min(...ts.map((p) => Math.min(p.Y - 34, cy(p) - 20))) : Math.max(...ts.map((p) => Math.max(p.Y + 34, cy(p) + 20)))
      return { bp: { X, Y, z: z + 0.012, e: up ? 't' : 'b', free: true }, terms: ts, main }
    }
    const ex = coreEnds.map((c) => c[which]).find((p) => p?.exit)
    return { bp: ex ?? null, terms: [] }
  }
  let A = side('a'), B = side('b')
  if (!A.bp && B.bp) A = { bp: FIELD_EXIT(B.bp.X), terms: [] }
  if (!B.bp && A.bp) B = { bp: FIELD_EXIT(A.bp.X), terms: [] }
  if (!A.bp || !B.bp) return null
  const jacketOd = (kind === 'iol' ? 5.6 : 6.2) / 1000, coreOd = 0.0021
  const w = { s, kind, cls, step: s.step, obj: new THREE.Group(), tubes: [], ends: [A.terms[0] ?? A.bp, B.terms[0] ?? B.bp], od: jacketOd, cable: true }
  const r = wirePoints(A.bp, B.bp, idx, cls, jacketOd); if (!r) return null
  const pts = r.pts; addTail(pts, A.bp, B.bp)
  const { c, g } = tube(roundCorners(pts, jacketOd, 1), jacketOd / 2, 9)
  const jm = kind === 'iol' ? wmat('iol') : wmat('field')
  const o = new THREE.Mesh(g, jm); o.castShadow = true; o.userData.wire = idx
  w.obj.add(o); w.tubes.push(o); w.curve = c; w.len = c.getLength(); w.ducts = r.ducts
  w.cut = cutOf(w, [A.terms[0] ?? A.bp, B.terms[0] ?? B.bp]); w.cut.parts.push({ what: 'core breakout, both ends (cores are about 60 mm past the jacket)', mm: 120 }); w.cut.total += 120
  const L = w.len
  w.obj.add(new THREE.Mesh(GEO.merge([sleeve(c, clamp(0.02 / L, 0.005, 0.4), jacketOd / 2, s.label, 0.02), sleeve(c, clamp(1 - 0.02 / L, 0.6, 0.995), jacketOd / 2, s.label, 0.02)]), markerMat))
  // breakouts: cores from the end of the jacket to each clamp, coloured by pin
  const hw = { metal: [], collar: [], copper: [], plug: [] }
  w.cores = []
  for (const [which, end] of [['a', A], ['b', B]]) {
    if (!end.terms.length) continue
    const bpW = P(end.bp.X, end.bp.Y, end.bp.z)
    // a heat-shrink boot where the jacket is stripped back
    w.obj.add(mesh([rod(bpW.clone().add(V3(0, end.bp.e === 't' ? 0.006 : -0.006, 0)), bpW.clone().add(V3(0, end.bp.e === 't' ? -0.004 : 0.004, 0)), jacketOd * 0.62)], M.black))
    coreEnds.forEach((ce, i) => {
      const p = ce[which]; if (!p || p.exit) return
      p.et = { k: 'ferrule' }
      sideBySide(p, coreOd)
      const lo = leadOut(p)
      const colour = ce.k.anl ? (ce.k.anl === 'BK' ? '#141414' : ce.k.anl === 'WH' ? '#e9e9e4' : '#b9a27a') : (IOL_CORE[ce.k.pin]?.color ?? '#555')
      const lastL = lo.pts[lo.pts.length - 1]
      let cpts
      if (p.dev !== end.main) {
        // V5: a core to another device (the shield to the ground bar) runs from the breakout through the ducts
        const rr = wirePoints({ ...end.bp, free: true }, p, idx + i, 'any')
        cpts = rr ? [bpW, ...rr.pts.slice(1)] : [...lo.pts, bpW].reverse()
      } else {
        const mid = lastL.clone().lerp(bpW, 0.55).add(V3((i - 1) * 0.003, 0, 0.006))
        cpts = [...lo.pts, mid, bpW]
      }
      const ct = tube(cpts, coreOd / 2, 5)
      const co = new THREE.Mesh(ct.g, wmat(colour)); co.castShadow = true; co.userData.wire = idx
      w.obj.add(co); w.tubes.push(co)
      endHardware(lo.clamp, lo.dIn, coreOd, { k: 'ferrule' }, hw, lo.ins)
      w.cores.push({ which, p, k: ce.k, colour, name: ce.k.anl ?? IOL_CORE[ce.k.pin]?.name ?? '' })
    })
  }
  finishGroup(w, hw)
  wiresG.add(w.obj)
  if (A.terms.length && B.terms.length) for (const d of r.ducts) DUCT_USE[d].dc.add(s.label)
  return w
}
for (const s of G.SEGMENTS) {
  if (s.notFitted) continue
  const ends = s.cores?.length ? s.cores.flatMap((k, i) => [endpoint(k.from, `${s.id}:${i}:a`), endpoint(k.to, `${s.id}:${i}:b`)]) : [endpoint(s.from, s.id + ':a'), endpoint(s.to, s.id + ':b')]
  for (const p of ends) { const k = clampKey(p); if (k) { const u = CLAMP_USE.get(k) ?? { n: 0, i: 0 }; u.n++; CLAMP_USE.set(k, u) } }
}
G.SEGMENTS.forEach((s, i) => { try { WIRES[i] =s.cores?.length ? buildCable(s, i) : buildConductor(s, i) } catch (e) { console.warn('wire', s.id, e) } })
// the dark entry marks of the openings that catalogue-shape parts do not model (V5 landing probe)
for (const dv of Object.values(DEV)) if (dv.holeGeos?.length) { const h = mesh(dv.holeGeos, M.hole); h.castShadow = false; dv.obj.add(h) }
const DUCT_SHARED = Object.entries(DUCT_USE).filter(([, u]) => u.ac.size && u.dc.size).map(([d, u]) => ({ duct: d, ac: [...u.ac], dc: [...u.dc] }))

// ------------------------------------------------------------------ highlight: accent outline round the parts of the step
const accent = new THREE.Color('#e8590c')
const hiMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9, depthTest: false })
const hiG = new THREE.Group(); lab.machine.add(hiG)
function outline(obj) {
  const b = new THREE.Box3().setFromObject(obj); if (b.isEmpty()) return null
  const inv = new THREE.Matrix4().copy(lab.machine.matrixWorld).invert(); b.applyMatrix4(inv)
  const s = b.getSize(V3()), c = b.getCenter(V3())
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s.x + 0.006, s.y + 0.006, s.z + 0.006)), hiMat)
  e.position.copy(c); e.renderOrder = 10
  return e
}

// ------------------------------------------------------------------ steps
const ALL_SUB1 = ['plate', 'duct', 'rails', 'power', 'rail1', 'drives', 't1', 'rail3', 'rail4']
let doorOpen = 0, doorTarget = 0, cur = 0, camTween = null, shadowSig = -1
const stepIndex = (id) => G.STEPS.findIndex((s) => s.id === id)
function stepTags(st) { return G.DEVICES.filter((d) => d.step === st.id || (st.id === 'door' && d.at === 'door') || (st.id === 'ac' && d.tag === 'A/C')).map((d) => d.tag) }
function applyVisibility(st, wiresUpTo) {
  const want = new Set(st.show.flatMap((k) => k === 'all-sub1' ? ALL_SUB1 : [k]))
  for (const k of ALL_SUB1) if (want.has(k)) for (const kk of ALL_SUB1.slice(0, ALL_SUB1.indexOf(k) + 1)) want.add(kk)
  for (const [k, g] of Object.entries(GROUPS)) g.visible = want.has(k)
  GROUPS.tags.visible = want.has('plate') && !want.has('covers')
  for (const p of TAG_PLATES) p.visible = !p.userData.step || want.has(p.userData.step) || want.has('all-sub1')
  const wiresOn = !!st.wires || want.has('wires')
  GROUPS.wires.visible = wiresOn
  if (wiresOn) for (const w of WIRES) if (w) w.obj.visible = stepIndex(w.step) <= wiresUpTo
  coverG.visible = want.has('covers')
  doorDevG.userData.real.visible = want.has('door')
  cutG.visible = want.has('cutouts') && !want.has('door')
  doorTarget = st.open && want.has('enc') ? 1 : 0
  for (const l of ductLabels) l.visible = !want.has('covers')
  setCovers(wiresOn && !want.has('covers'))
  applyFront()
}
function applyFront() {
  const st = G.STEPS[cur], inEnc = st.show.includes('enc')
  frontG.visible = !VIEW.noFront
  doorsG.visible = inEnc && !VIEW.noFront
  handleG.visible = st.show.includes('handle') && !VIEW.noFront
  const b = document.querySelector('[data-front]'); if (b) b.classList.toggle('on', VIEW.noFront)
}
function showStep(i, { fly = true, keepSel = false } = {}) {
  if (VIEW.complete) { VIEW.complete = false; VIEW.noFront = VIEW.frontBefore ?? false; document.querySelector('[data-complete]')?.classList.remove('on') }
  cur = clamp(i, 0, G.STEPS.length - 1)
  store.set('step', cur)
  const st = G.STEPS[cur]
  applyVisibility(st, cur)
  hiG.clear()
  if (!st.wires) { lab.machine.updateMatrixWorld(true); for (const t of stepTags(st)) { const o = DEV[t]?.obj ?? (t === 'A/C' ? acG : null); if (o) { const e = outline(o); if (e) hiG.add(e) } } }
  if (st.id === 'duct') { lab.machine.updateMatrixWorld(true); const e = outline(ductG); if (e) hiG.add(e) }
  if (st.id === 'rails') { lab.machine.updateMatrixWorld(true); const e = outline(railsG); if (e) hiG.add(e) }
  if (fly) flyTo(st.view)
  if (!keepSel && !wm.on && SEL.kind) select(null, { fly: false, from: 'ui' })
  else if (SEL.kind) applyWireLook()
  ui.render()
}
// the camera as it really is now (the user may have orbited since the last flight): az/el/dist/target in lab.view terms
function syncView() {
  const k = lab.k, tg = lab.controlsOrbit.target, off = lab.camera.position.clone().sub(tg), d = off.length()
  lab.view = { ...lab.view, az: THREE.MathUtils.radToDeg(Math.atan2(off.x, off.z)), el: THREE.MathUtils.radToDeg(Math.asin(clamp(off.y / d, -1, 1))), dist: d / 2.4, target: [tg.x / k, tg.y / k, tg.z / k], frameX: FX() }
}
function flyTo(v) {
  syncView()
  // no orbit momentum may carry on turning the model during or after the flight
  lab.controlsOrbit.enableDamping = false; lab.controlsOrbit.update()
  const from = { ...lab.view }, to = { ...lab.view, ...v, frameX: FX() }
  // take the short way round
  while (to.az - from.az > 180) to.az -= 360
  while (to.az - from.az < -180) to.az += 360
  camTween = { from, to, t0: performance.now(), dur: 850 }
}
// focus on something without turning the model: same viewing direction, centred on it, zoomed to fit
function focusOn(points, pad = 1) {
  if (!points.length) return
  syncView()
  const b = new THREE.Box3().setFromPoints(points), c = b.getCenter(V3()), sz = b.getSize(V3()).length()
  const fov = THREE.MathUtils.degToRad(lab.camera.fov), need = (sz * lab.k * 0.62 * pad) / Math.tan(fov / 2)
  flyTo({ target: [c.x, c.y, c.z], dist: clamp(need / 2.4, 0.12, 1.6), az: lab.view.az, el: lab.view.el })
}
function focusTag(tag) {
  const dv = DEV[tag]
  if (dv?.obj) { lab.machine.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(dv.obj); if (b.isEmpty()) return; const inv = new THREE.Matrix4().copy(lab.machine.matrixWorld).invert(); b.applyMatrix4(inv); focusOn([b.min, b.max], 1.6) }
  else if (dv?.door) { const p = DEV[tag].local.clone(); doorR.updateMatrixWorld(true); doorR.localToWorld(p); lab.machine.worldToLocal(p); focusOn([p.clone().addScalar(-0.12), p.clone().addScalar(0.12)]) }
}
lab.onTick((dt, l, rdt) => {
  if (camTween) {
    const k = clamp((performance.now() - camTween.t0) / camTween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    const f = camTween.from, t = camTween.to
    const v = { ...t, az: lerp(f.az, t.az, e), el: lerp(f.el, t.el, e), dist: lerp(f.dist, t.dist, e), fov: lerp(f.fov ?? 30, t.fov ?? 30, e), target: f.target.map((x, i) => lerp(x, t.target[i], e)) }
    lab.view = v; lab._applyView(v)
    if (k >= 1) { camTween = null; lab.controlsOrbit.update(); lab.controlsOrbit.enableDamping = true }
  }
  // V5: shadows are redrawn only when something moved or was shown or hidden (staticShadows): the doors swinging, or a
  // change in the set of visible meshes (steps, Completed panel, Remove front, covers, wires)
  if (Math.abs(doorTarget - doorOpen) > 1e-4) lab.invalidateShadows()
  let sig = 0; lab.machine.traverseVisible((o) => { if (o.isMesh && o.castShadow) sig = (sig * 31 + o.id) % 1000000007 })
  if (sig !== shadowSig) { shadowSig = sig; lab.invalidateShadows() }
  doorOpen += (doorTarget - doorOpen) * Math.min(1, rdt * 3)
  doorL.rotation.y = -doorOpen * 1.9; doorR.rotation.y = -doorOpen * 1.55
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220)
  hiMat.opacity = 0.55 + 0.4 * pulse
  for (const r of ringG.children) r.scale.setScalar(1 + 0.35 * pulse)
  tags.update(); LOC.update()
})
lab.controlsOrbit.addEventListener('start', () => { if (camTween) { camTween = null; lab.controlsOrbit.enableDamping = true } })

// ------------------------------------------------------------------ on-screen tags: device tags for the step, wire end labels, terminal tags of a selected device
const ringG = new THREE.Group(); lab.machine.add(ringG)
const ringMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.95, depthTest: false })
const tags = (() => {
  const layer = document.createElement('div'); layer.id = 'g-tags'; document.body.appendChild(layer)
  const els = new Map(); let hover = null; let ends = [], terms = []
  function el(key, cls) { if (!els.has(key)) { const e = document.createElement('div'); layer.appendChild(e); els.set(key, e) } const e = els.get(key); e.className = cls; return e }
  function anchor(tag) {
    const dv = DEV[tag]; if (!dv) return null
    if (dv.door) { const p = V3(dv.local.x, dv.local.y + 0.1, 0.04); doorR.localToWorld(p); return p }
    if (dv.sub2) { const p = V3(0, 0.07, 0.2); dv.group.localToWorld(p); return p }
    const p = V3(dv.xc, dv.yT + 0.012, dv.z1); lab.machine.localToWorld(p); return p
  }
  const place = (e, p) => { const q = p.clone().project(lab.camera); if (q.z > 1) { e.style.display = 'none'; return false } e.style.display = 'block'; e.style.left = `${(q.x * 0.5 + 0.5) * innerWidth}px`; e.style.top = `${(-q.y * 0.5 + 0.5) * innerHeight}px`; return true }
  function update() {
    const st = G.STEPS[cur], on = new Set(st.wires || wm.on || SEL.kind ? [] : stepTags(st)); if (hover) on.add(hover)
    if (SEL.kind === 'dev') on.add(SEL.tag)
    const live = new Set()
    for (const t of on) { const p = anchor(t); if (!p) continue; const e = el(t, 'g-tag' + (t === hover || t === SEL.tag ? ' hov' : '')); e.textContent = t; place(e, p); live.add(t) }
    ends.forEach((x, i) => { const k = `end:${i}`; place(el(k, 'g-end'), x.world()); els.get(k).innerHTML = x.html; live.add(k) })
    // terminal tags: skip any that would sit on top of one already placed (zoom in to see them all)
    const taken = []
    terms.forEach((x, i) => {
      const q = x.world().project(lab.camera); if (q.z > 1) return
      const sx = (q.x * 0.5 + 0.5) * innerWidth, sy = (-q.y * 0.5 + 0.5) * innerHeight + (x.side === 'below' ? 16 : -16)
      if (taken.some(([a, b]) => Math.abs(a - sx) < 58 && Math.abs(b - sy) < 15)) return
      taken.push([sx, sy])
      const k = `term:${i}`; const e = el(k, `g-term ${x.side}${x.done ? ' ok' : ''}`); e.innerHTML = x.html; place(e, x.world()); live.add(k)
    })
    for (const [k, e] of els) if (!live.has(k)) e.style.display = 'none'
  }
  return { update, setHover: (t) => { hover = t }, setEnds: (list) => { ends = list }, setTerms: (list) => { terms = list } }
})()

// ------------------------------------------------------------------ selection: one wire or one device, shared by the 3D view and every tab
const SEL = { kind: null, i: -1, tag: null }
const selMat = MAT.plastic({ color: '#e8590c', roughness: 0.3, emissive: '#e8590c', emissiveIntensity: 0.45, finish: null })
const ghostMats = new Map()
const ghostOf = (m0) => { if (!ghostMats.has(m0)) { const g = m0.clone(); g.transparent = true; g.opacity = 0.09; g.depthWrite = false; ghostMats.set(m0, g) } return ghostMats.get(m0) }
// every mesh that belongs to a wire (tube, cores, ferrules, markers, door part), so a wire can be ghosted whole
for (const w of WIRES) { if (!w) continue; w.meshes = []; const grab = (o) => o?.traverse((m) => { if (m.isMesh) { m.userData.mat0 = m.material; w.meshes.push(m) } }); grab(w.obj); grab(w.doorGroup) }
const segTouches = (s, tag) => { const hit = (e) => e.dev === tag || (tag === 'GB1' && e.dev === 'GND BAR'); return hit(s.from) || hit(s.to) || (s.cores ?? []).some((k) => hit(k.from) || hit(k.to)) }
function applyWireLook() {
  // with something selected every other wire turns to glass, so the selection can be traced through the bundles
  // V8: with nothing selected, a wire colour picked in the legend keeps that kind solid
  const keep = SEL.kind === 'wire' ? new Set([SEL.i]) : SEL.kind === 'dev' ? new Set(G.SEGMENTS.map((s, i) => i).filter((i) => segTouches(G.SEGMENTS[i], SEL.tag))) : VIEW.onlyKind ? new Set(WIRES.map((w, i) => w?.kind === VIEW.onlyKind ? i : -1).filter((i) => i >= 0)) : null
  for (const [k, w] of WIRES.entries()) {
    if (!w) continue
    for (const m of w.meshes) {
      if (!keep) m.material = m.userData.mat0
      else if (!keep.has(k)) m.material = ghostOf(m.userData.mat0)
      else m.material = SEL.kind === 'wire' && w.tubes.includes(m) && !(w.cable && m !== w.tubes[0]) ? selMat : m.userData.mat0
      m.renderOrder = keep && !keep.has(k) ? 2 : 0
    }
  }
}
// a glow that runs along the selected wire from end A to end B, over and over
const pulseG = new THREE.Group(); lab.machine.add(pulseG)
const pulseMat = new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.95, depthTest: false })
const haloMat = new THREE.MeshBasicMaterial({ color: '#ff8a3d', transparent: true, opacity: 0.35, depthTest: false, depthWrite: false })
for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), k ? haloMat : pulseMat); s.renderOrder = 14; pulseG.add(s) }
pulseG.visible = false
let traceCam = null
function wireEnds(w) {
  const pa = w.cable ? (w.cores?.find((c) => c.which === 'a')?.p ?? w.ends[0]) : w.ends[0], pb = w.cable ? (w.cores?.find((c) => c.which === 'b')?.p ?? w.ends[1]) : w.ends[1]
  return [pa, pb]
}
function select(sel, { fly = true, from } = {}) {
  SEL.kind = sel?.kind ?? null; SEL.i = sel?.kind === 'wire' ? sel.i : -1; SEL.tag = sel?.kind === 'dev' ? sel.tag : null
  ringG.clear(); tags.setEnds([]); tags.setTerms([]); hiG.clear(); traceCam = null
  pulseG.visible = SEL.kind === 'wire'
  const w = WIRES[SEL.i]
  if (SEL.kind === 'wire' && w) {
    const st = stepIndex(w.step)
    if (st > cur || !GROUPS.wires.visible) { cur = st; applyVisibility(G.STEPS[st], st) }
    if (G.STEPS[cur].show.includes('enc') && !VIEW.noFront) doorTarget = 1          // a selected wire is never behind a closed door
    const s = w.s, [pa, pb] = wireEnds(w), ends = []
    for (const [p, lbl, e] of [[pa, 'A', s.from], [pb, 'B', s.to]]) {
      if (p && !p.exit) {
        // a cable: a ring on every core's clamp, and the label lists the cores
        const side = lbl === 'A' ? 'a' : 'b', cps = w.cores?.filter((c) => c.which === side).map((c) => c.p) ?? [p]
        for (const q of cps) for (const r0 of [0.0045, 0.0072]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r0, r0 === 0.0045 ? 0.0008 : 0.0004, 8, 32), ringMat); ring.position.copy(P(q.X, q.Y, q.z)); ring.position.z += 0.004; ring.renderOrder = 12; ringG.add(ring) }
        const c = P(p.X, p.Y, p.z)
        const txt = w.cores?.length ? `${p.dev} ${w.cores.filter((k) => k.which === side).map((k) => `${k.p.pin} ${k.name}`).join(' · ')}` : endTxt(e)
        const sub = w.cores?.length ? w.cores.filter((k) => k.which === side).map((k) => k.p.where).join('; ') : p.where
        ends.push({ html: `<b>${lbl}</b> ${esc(txt)}<small>${esc(sub ?? '')}</small>`, world: () => lab.machine.localToWorld(c.clone()) })
      } else if (e.dev === 'HMI1' || e.dev === 'E-STOP') ends.push({ html: `<b>${lbl}</b> ${esc(endTxt(e))}<small>on the door</small>`, world: () => doorR.localToWorld(DEV[e.dev].local.clone()) })
      else if (p?.exit) ends.push({ html: `<b>${lbl}</b> ${esc(endTxt(e))}<small>${p.offplate ? esc(p.offplate) : 'gland in the floor: site'}</small>`, world: () => lab.machine.localToWorld(w.curve.getPointAt(lbl === 'A' ? 0 : 1).clone()) })
    }
    tags.setEnds(ends)
    for (const m of pulseG.children) m.scale.setScalar(Math.max(0.0035, w.od * 0.9) * (m.material === haloMat ? 2.2 : 1))
    if (fly) { const pts = []; for (const p of [pa, pb]) if (p && !p.exit) pts.push(P(p.X, p.Y, p.z)); if (pts.length < 2) pts.push(...w.curve.getPoints(24)); focusOn(pts, 1.3) }
  } else if (SEL.kind === 'dev') {
    const dv = DEV[SEL.tag]
    if (dv?.obj) { lab.machine.updateMatrixWorld(true); const e = outline(dv.obj); if (e) hiG.add(e) }
    // a tag on every terminal that has something on it: terminal and marker; ticked when that wire is done
    const list = []
    G.SEGMENTS.forEach((s, i) => {
      const w2 = WIRES[i]; if (!w2 || !segTouches(s, SEL.tag)) return
      const pts = w2.cores?.length ? w2.cores.map((c) => c.p).filter((p) => p.dev === SEL.tag) : w2.ends.filter((p) => p && !p.exit && p.dev === SEL.tag)
      for (const p of pts) { const c = P(p.X, p.Y, p.z); list.push({ html: `${esc(p.pin)} <b>${esc(s.label || '—')}</b>`, side: p.e === 'b' ? 'below' : 'above', done: wm.isDone(i), world: () => lab.machine.localToWorld(c.clone()) }) }
    })
    tags.setTerms(list.slice(0, 160))
    if (fly) focusTag(SEL.tag)
  }
  applyWireLook()
  if (from !== 'ui') ui.onSelect()
}
// follow the wire with the camera, end A to end B, at the current viewing angle
function traceRoute() {
  const w = WIRES[SEL.i]; if (!w) return
  syncView(); camTween = null; lab.controlsOrbit.enableDamping = false
  traceCam = { w, t0: performance.now(), dur: clamp(w.len / 0.22, 2.5, 9) * 1000, dist: 0.13 }
}
lab.onTick(() => {
  const w = WIRES[SEL.i]
  if (SEL.kind === 'wire' && w) {
    const L = w.len, per = clamp(L / 0.35, 1.2, 6) * 1000
    const t = (performance.now() % per) / per
    pulseG.children.forEach((m, k) => { const u = clamp(t - k * 0.012); m.position.copy(w.curve.getPointAt(u)) })
  }
  if (traceCam) {
    const k = clamp((performance.now() - traceCam.t0) / traceCam.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    const p = traceCam.w.curve.getPointAt(e)
    lab.view = { ...lab.view, target: [p.x, p.y, p.z], dist: traceCam.dist }; lab._applyView(lab.view)
    if (k >= 1) { traceCam = null; lab.controlsOrbit.update(); lab.controlsOrbit.enableDamping = true }
  }
})
lab.controlsOrbit.addEventListener('start', () => { if (traceCam) { traceCam = null; lab.controlsOrbit.enableDamping = true } })

// ------------------------------------------------------------------ picking
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2()
let downAt = null
function pick(ev) {
  const r = lab.renderer.domElement.getBoundingClientRect()
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(mouse, lab.camera)
  const visible = (m) => { let o = m; while (o) { if (!o.visible) return false; o = o.parent } return true }
  // ghosted wires are not pickable, so clicks reach the wires and parts that are still solid
  const wireMeshes = GROUPS.wires.visible ? WIRES.filter((w) => w && w.obj.visible).flatMap((w) => w.tubes.filter((t) => !t.material.transparent || t.material === selMat)) : []
  // V7: an x-rayed cover is glass: clicks go through it to the wires and terminals behind
  const hit = ray.intersectObjects([...wireMeshes, ...pickables.filter((m) => visible(m) && !m.userData.noPick)], false)[0]
  if (!hit) return null
  if (hit.object.userData.wire !== undefined) return { wire: hit.object.userData.wire }
  return { tag: hit.object.userData.tag }
}
lab.renderer.domElement.addEventListener('pointermove', (ev) => {
  const h = pick(ev); tags.setHover(h?.tag && h.tag !== 'Enclosure' ? h.tag : null)
  lab.renderer.domElement.style.cursor = h && (h.wire !== undefined || (h.tag && h.tag !== 'Enclosure')) ? 'pointer' : ''
  const tip = document.getElementById('g-tip')
  if (h?.wire !== undefined) { const s = G.SEGMENTS[h.wire]; tip.innerHTML = `<b>${esc(s.label || '(no number)')}</b> ${esc(endTxt(s.from))} → ${esc(endTxt(s.to))}<br><span>click to select and trace</span>`; tip.style.display = 'block'; tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY + 12}px` }
  else if (h?.tag && h.tag !== 'Enclosure') { tip.innerHTML = `<b>${esc(h.tag)}</b> ${esc(PN_OF[h.tag] ?? '')}<br><span>click to select: its wires stay solid</span>`; tip.style.display = 'block'; tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY + 12}px` }
  else tip.style.display = 'none'
})
lab.renderer.domElement.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY] })
lab.renderer.domElement.addEventListener('pointerup', (ev) => {
  if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 4) return
  const h = pick(ev)
  if (h?.wire !== undefined) select({ kind: 'wire', i: h.wire })
  else if (h?.tag && h.tag !== 'Enclosure') select({ kind: 'dev', tag: h.tag === 'A/C' ? 'A/C' : h.tag })
  else if (SEL.kind) select(null, { fly: false })
})

// ------------------------------------------------------------------ wire-by-wire mode: a list of wires (a step's, or a device's) worked through one at a time
const store = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem('vfd200-guide-v2') || '{}') } catch { s = {} } return { get: (k) => s[k], set: (k, v) => { s[k] = v; try { localStorage.setItem('vfd200-guide-v2', JSON.stringify(s)) } catch {} } } })()
const wm = {
  on: false, list: [], i: 0, filter: '', dev: null,
  build() {
    const segs = G.SEGMENTS.map((s, i) => ({ s, i, w: WIRES[i] })).filter((x) => x.w && (this.dev ? segTouches(x.s, this.dev) : !this.filter || x.s.step === this.filter))
    const key = (x) => { const p = x.w.ends[0]; return [stepIndex(x.s.step), p?.exit ? 2000 : Math.round((p?.Y ?? 2000) / 120), p?.X ?? 0] }
    segs.sort((a, b) => { const ka = key(a), kb = key(b); return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2] })
    this.list = segs.map((x) => x.i); this.i = clamp(this.i, 0, Math.max(0, this.list.length - 1))
  },
  enter({ filter, dev, wire } = {}) {
    this.on = true; this.dev = dev ?? null; if (filter !== undefined) this.filter = filter
    if (wire !== undefined && !dev) this.filter = G.SEGMENTS[wire].step
    this.build()
    if (wire !== undefined) { const k = this.list.indexOf(wire); if (k >= 0) this.i = k }
    this.show()
  },
  exit() { this.on = false },
  show() { const i = this.list[this.i]; if (i === undefined) { ui.render(); return } select({ kind: 'wire', i }, { from: 'ui' }); ui.render() },
  goTo(segIdx) { let k = this.list.indexOf(segIdx); if (k < 0) { this.dev = null; this.filter = G.SEGMENTS[segIdx].step; this.build(); k = this.list.indexOf(segIdx) } if (k >= 0) { this.i = k; this.show() } },
  next() { this.i = Math.min(this.list.length - 1, this.i + 1); this.show() },
  prev() { this.i = Math.max(0, this.i - 1); this.show() },
  done(segIdx, v) { const d = store.get('wired') ?? {}; d[G.SEGMENTS[segIdx].id] = v; store.set('wired', d) },
  isDone(segIdx) { return !!(store.get('wired') ?? {})[G.SEGMENTS[segIdx].id] },
}

// ------------------------------------------------------------------ V14: LOCATE. Where every item goes, from three datums.
// First principles: a builder locates a part with a tape or a square hooked on an edge. So every position is given from
// the same two edges of the plate (baseline dimensions, never a chain from one part to the next, so errors do not add up):
//   datum A  the face of the subplate (parts sit flat on it)
//   datum B  the top edge of the subplate (every "down" dimension starts here)
//   datum C  the left edge of the subplate (every "across" dimension starts here)
// This is the origin sheet 3 itself dimensions from (its top left corner). The numbers are the positions this guide
// builds the 3D panel at, read back from the model: sheet 3's pictures scaled from the PDF (good to about 1 mm), with
// real widths from the makers' documents where sheet 3 is not to scale. What sheet 3 prints as a dimension is quoted.
// Tolerances: the drawings give none. The three classes below are this guide's proposal (Design issues), shown as a
// feature control frame and in plain words. Door parts use the door's own edges, as sheet 2 dimensions them.
const LOC = (() => {
  const mmX = (x) => (x + SW / 2) * 1000, mmY = (y) => (Y0 + 0.051 + SH - y) * 1000
  const h = (v) => Math.round(v * 2) / 2
  const mm = (v) => { const r = h(v); return Number.isInteger(r) ? String(r) : r.toFixed(1) }
  const inch = (v) => { let n = Math.round(v / 25.4 * 16), w = Math.floor(n / 16), f = n % 16, d = 16; while (f && f % 2 === 0) { f /= 2; d /= 2 } return `${w}${f ? ` ${f}/${d}` : ''} in` }
  const both = (v) => `<b>${mm(v)}</b> <small>${inch(v)}</small>`
  const INK = '#b0127a'
  const TOL = {
    C: { zone: 1, pm: '±0.5 mm', name: 'Critical fit', why: 'another part has to line up with it' },
    F: { zone: 3, pm: '±1.5 mm', name: 'Fixed to the plate', why: 'drilled or screwed down: it cannot be moved later' },
    S: { zone: 6, pm: '±3 mm along the rail', name: 'On a DIN rail', why: 'it slides: the order and what it sits against matter more than the number' },
  }
  const fcf = (c) => `<span class="fcf" title="Position within a ${TOL[c].zone} mm circle of the true position, measured from datums A, B and C (${TOL[c].pm}). Proposed by this guide: the drawings give no tolerance."><i>⌖</i><i>⌀${TOL[c].zone}</i><i>A</i><i>B</i><i>C</i></span>`
  // what sheet 3 (Draft rev20) prints as a dimension for a part, quoted so it can be checked against the ordinates
  const PRINTED = {
    Q1: 'Sheet 3 prints 104 mm down from the top edge and 47 mm in from the right edge (1071 mm from the left edge) to the mounting point it marks on the switch. Use these two for the first hole; the outline numbers above are the envelope of the whole switch and mechanism.',
    FU1: 'Sheet 3 prints "Z = 113 mm per manual" and 47 mm in from the right edge. Z is the distance from Q1\'s lower mounting slots down to this block\'s two mounting holes (1494U-IN001 p.10): set the block from the switch, not from the plate edges.',
    Lug1: 'Sheet 3 prints 60 mm down from the top edge and 20 mm right of duct D4.',
    GB1: 'Sheet 3 prints 39 mm right of duct D4, 39 mm left of PDB1 and 55 mm above duct D5.',
    PDB1: 'Sheet 3 prints 20 mm in from the right edge and 100 mm above duct D5.',
    DRV1: 'Sheet 3 prints 50 mm clear on each side of the drive.', DRV2: 'Sheet 3 prints 50 mm clear on each side of the drive.',
    T1: 'Sheet 3 puts it in the 262 mm bay between ducts D6 and D7.',
  }
  // V15: mounting holes, ONLY where a maker's document (or sheet 3) gives them. Every number here is printed in the document
  // cited; nothing is scaled off a picture and nothing is inferred. A part with no entry shows no hole information at all.
  //   pat: the hole pattern itself (mm across, mm down), drawn as a small diagram
  //   cols: hole columns in mm from datum C, only where documents fix them on the plate (fn of the item for an offset from its edge)
  //   where: what the documents do and do not say about placing the pattern on the plate
  const HOLES = {
    Q1: { n: 4, pat: { w: 46.0, h: 124.0 }, cols: () => [1025, 1071], drill: 'Drill four 11/64 in (4.4 mm) holes for the thread-forming screws supplied with the switch.',
      text: 'Two round holes at the top and two slots 124.0 mm (4.88 in) below them, each pair 46.0 mm (1.81 in) apart, between the poles. The right-hand pair is 84.3 mm (3.32 in) in from the right end of the operating mechanism.',
      where: 'Across, two documents agree: the right-hand holes are 1071 mm from the left edge (sheet 3: 47 mm from the right edge; Rockwell: 3.32 in from the end of the mechanism) and the left-hand holes 1025 mm. Down, Rockwell locates the switch from the handle hole in the flange with paper template PN-254969, and sheet 3 prints 104 mm to a point that sits about 13 mm below the top hole row on Rockwell\'s drawing. No height is shown until engineering says which is meant: use the template.',
      cite: 'Rockwell drawing 10001235194 (1494U 100 A switch); 1494U-IN001 p.2; sheet 3' },
    FU1: { n: 2, pat: { w: 46.0 }, cols: () => [1025, 1071], drill: 'Two holes for #10-32 screws (the holes in the block are 0.203 in).',
      text: 'Two holes 46.0 mm (1.81 in) apart, between the poles, 9.4 mm (0.37 in) above the bottom of the moulding.',
      where: 'Across: in line with Q1\'s holes, 1025 and 1071 mm from the left edge. Down: 113.0 mm below Q1\'s lower mounting slots (DIM Z, 4.449 in, for 100 A 600 V class J fuses). Set it from the switch, not from the plate edge.',
      cite: 'Rockwell drawing 10001237277 (1494U 100 A fuse block); 1494U-IN001 p.10; sheet 3 ("Z = 113 mm per manual")' },
    PDB1: { n: 6, cols: (i) => [i.X0 + 26.2, i.X0 + 71.7, i.X0 + 117.2], drill: '',
      text: 'Six slots: one at the top and one at the bottom of each pole, in three columns 45.5 mm apart, the outer columns 26.2 mm in from each side of the block.',
      where: 'The heights of the two rows of slots are not dimensioned in the document, and it calls its dimensions approximate: mark the rows from the block itself.',
      cite: '1492-TD019 p.14, Figure 3 (D and E)' },
    DRV1: { n: 4, pat: { w: 116.0, h: 247.0 }, drill: 'M5 (#10-24) screws, 2.45-2.94 N·m (22-26 lb·in).',
      text: 'Four holes: 116.0 mm apart across, 247.0 mm apart down, on a body 130.0 x 260.0 mm.',
      where: 'Where the pattern sits inside the outline is not dimensioned in the manual: mark it through the drive.',
      cite: '520-UM001 p.188 (frame D) and p.15' },
    Lug1: { n: 2, pat: { h: 44.5 }, drill: 'The lug\'s holes are 9/16 in (14 mm), for 1/2 in studs or bolts.',
      text: 'Two holes 44.5 mm (1.75 in) apart along the lug.', where: 'Their distance from the end of the lug is not on the sheet held: mark through the lug.',
      cite: 'Burndy K3A26U2N specification sheet' },
    GB1: { n: 2, pat: { h: 50.3 }, drill: 'The bar\'s mounting holes are 13/64 in, for #10 screws.',
      text: 'Two holes 50.3 mm (1.98 in) apart along the bar; the first is 65.2 mm (2.566 in) from the end of the bar, at its 7th tap.',
      where: 'The page does not say which end: check on the bar.', cite: 'ILSCO D167 catalogue page C-235' },
    T1: { n: 4, drill: 'Slots 7.9 x 21.6 mm (0.31 x 0.85 in).',
      text: 'Four slots in the mounting plate. Mounting width 135.1 mm (W1) or 111.0 mm (W2); mounting depth 108.0 mm (D1) or 146.1 mm (D2).',
      where: 'The catalogue gives two widths and two depths for the two sets of slots: use the pair that matches the slots you fasten through.',
      cite: 'SolaHD catalogue p.173 (mounting profile) and p.175 (E750WB)' },
  }
  HOLES.DRV2 = HOLES.DRV1
  const STEP_OF_RAIL = { r1: 'rail1', r3: 'rail3', r4: 'rail4' }
  const ITEMS = []
  for (const d of G.DUCTS) { const [X0, X1, Yt, Yb] = d.r; ITEMS.push({ tag: d.id, kind: 'duct', step: 'duct', X0, X1, Yt, Yb, cls: 'F', what: `${d.size.replace('x', ' x ')} in duct, ${d.note}`, src: 'sheet 3 dimensions' }) }
  for (const [k, r] of Object.entries(G.RAILS)) ITEMS.push({ tag: r.name, kind: 'rail', step: 'rails', X0: r.x0, X1: r.x1, Y: r.y, Yt: r.y - 17.5, Yb: r.y + 17.5, cls: 'F', rail: k, what: `35 mm DIN rail, ${mm(r.x1 - r.x0)} mm long`, src: 'sheet 3 (10 mm from the duct at each end); centre line scaled from the picture', printed: 'Keep the rail parallel to the top edge: measure the centre line down from datum B at both ends.' })
  for (const [k, list] of Object.entries(G.ANCHORS ?? {})) list.forEach((X, i) => ITEMS.push({ tag: `${G.RAILS[k].name} anchor ${i + 1}`, kind: 'raildev', anchor: true, step: STEP_OF_RAIL[k], rail: k, X0: X, X1: X + 7.9, Y: G.RAILS[k].y, Yt: G.RAILS[k].y - 27, Yb: G.RAILS[k].y + 27, cls: 'S', what: '1492-EAJ35 end anchor', src: 'sheet 3' }))
  for (const [tag, dv] of Object.entries(DEV)) {
    if (dv.x0 === undefined || dv.d?.at === 'fuse' || dv.door || dv.sub2) continue
    const d = dv.d ?? {}, rail = d.rail ?? (tag === 'RCP1' ? 'r4' : null)
    const it = { tag, dev: true, kind: rail ? 'raildev' : 'plate', step: d.step, rail, X0: mmX(dv.x0), X1: mmX(dv.x1), Yt: mmY(dv.yT), Yb: mmY(dv.yB), what: d.pn ?? '', printed: PRINTED[tag] }
    if (rail) it.Y = G.RAILS[rail].y
    it.cls = rail ? 'S' : tag === 'Q1' || tag === 'FU1' ? 'C' : 'F'
    it.src = d.xNote ? d.xNote : d.strip ? 'sheet 3 start, real terminal pitch' : rail ? 'sheet 3 picture, scaled; real body width from the maker\'s model' : 'sheet 3 picture, scaled; outline of the maker\'s model'
    if (HOLES[tag]) { it.holes = HOLES[tag]; it.cols = HOLES[tag].cols ? HOLES[tag].cols(it).map((v) => Math.round(v * 2) / 2) : null }
    ITEMS.push(it)
  }
  // on a rail: what each part sits against, left to right
  for (const k of Object.keys(G.RAILS)) {
    const row = ITEMS.filter((i) => i.kind === 'raildev' && i.rail === k).sort((a, b) => a.X0 - b.X0)
    row.forEach((it, n) => { it.order = n + 1; it.of = row.length; const p = row[n - 1]; if (!p) { it.against = `first on ${G.RAILS[k].name}, ${mm(it.X0 - G.RAILS[k].x0)} mm from the rail's left end`; return } const gap = it.X0 - p.X1; it.against = gap < -0.8 ? `locks onto ${p.tag}` : gap < 0.8 ? `tight against ${p.tag}` : `${mm(gap)} mm gap after ${p.tag}` })
  }
  // the right door (sheet 2): datums are the door's own top edge and its handle (right) edge
  const DOOR = { w: (VDOOR.R?.w ?? 0.575) * 1000, h: (VDOOR.R?.h ?? 1.485) * 1000 }
  const DOOR_ITEMS = [
    { tag: 'HMI1', kind: 'door', step: 'cutouts', cls: 'C', fromRight: 287, fromTop: 257, w: 269, hh: 224, what: 'PanelView Plus 7 cutout, 269 wide x 224 high (sheet 2: "approx.")', printed: 'Sheet 2 prints: display centre 287 mm from the door\'s right edge, 257 mm below the top of the door, 1400 mm from the floor. Take the cutout size and tolerance from the PanelView Plus 7 instructions before cutting.' },
    { tag: 'E-STOP', kind: 'door', step: 'cutouts', cls: 'C', fromRight: 168, fromTop: 550, w: 30.5, hh: 30.5, round: true, what: '30 mm operator hole (800H)', printed: 'Sheet 2 prints: centre 168 mm from the door\'s right edge, 550 mm below the top of the door, 935 mm above its bottom.' },
  ]
  const byTag = (t) => ITEMS.find((i) => i.tag === t) ?? DOOR_ITEMS.find((i) => i.tag === t)
  const stepsWith = () => G.STEPS.filter((s) => itemsOf(s.id).length)
  // the mark-out step ("plate") is where everything that is drilled for gets marked: ducts, rails and plate-mounted parts
  const itemsOf = (stepId) => [...ITEMS.filter((i) => i.step === stepId || (stepId === 'plate' && (i.kind === 'duct' || i.kind === 'rail' || i.kind === 'plate'))).sort((a, b) => (a.rail ?? '').localeCompare(b.rail ?? '') || a.X0 - b.X0 || a.Yt - b.Yt), ...DOOR_ITEMS.filter((i) => i.step === stepId)]

  // ---- the mark-out drawing: the plate seen square-on, datum edges marked, ordinates of the chosen items on the two edges
  function sheet(scope, sel, big) {
    const on = new Set(scope.map((i) => i.tag)), F = big ? 22 : 30, mL = 190, mT = big ? 250 : 170
    // a rail step, full screen: only the band round that rail, so the row is as large as the window allows. The top edge is
    // then out of the picture: the ticks stand on a break line and the rail's own distance from the top edge is written on it
    const crop = big && scope.length > 0 && scope.every((i) => i.kind === 'raildev'), top = crop ? Math.min(...scope.map((i) => i.Yt)) - 60 : 0, bot = crop ? Math.max(...scope.map((i) => i.Yb)) + 70 : 1422
    const lead = [], xs = [], ys = []
    const body = ITEMS.filter((i) => !i.anchor).map((i) => {
      const hot = on.has(i.tag), s = i.tag === sel
      const cl = `${i.kind}${hot ? ' hot' : ''}${s ? ' sel' : ''}`
      if (i.kind === 'rail') return `<line class="${cl}" x1="${i.X0}" x2="${i.X1}" y1="${i.Y}" y2="${i.Y}"/>`
      const w = i.X1 - i.X0, hh = i.Yb - i.Yt
      return `<rect class="${cl}" ${i.dev ? `data-dev="${esc(i.tag)}"` : ''} x="${i.X0.toFixed(1)}" y="${i.Yt.toFixed(1)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}"><title>${esc(i.tag)}</title></rect>${hot && (w > 60 || big) ? `<text class="tg" x="${(i.X0 + w / 2).toFixed(1)}" y="${(i.Yt + hh / 2 + 7).toFixed(1)}" text-anchor="middle" font-size="${Math.min(F, Math.max(11, w * 0.42))}">${esc(i.tag)}</text>` : ''}`
    }).join('')
    for (const i of scope) {
      if (i.kind === 'door') continue
      const y = i.Y ?? i.Yt
      xs.push(i.X0); ys.push(y)
      lead.push(`<path class="ld" d="M${i.X0.toFixed(1)} ${y.toFixed(1)}V${top}M${i.X0.toFixed(1)} ${y.toFixed(1)}H0"/>`)
      if (i.cols) for (const c of i.cols) { xs.push(c); lead.push(`<path class="cl" d="M${c} ${(i.Yt - 14).toFixed(1)}V${(i.Yb + 14).toFixed(1)}"/>`) }
      if (i.kind === 'duct' || i.kind === 'rail' || scope.length <= 2) { xs.push(i.X1); if (i.kind === 'duct' || i.kind === 'plate') ys.push(i.Yb) }
    }
    const uniq = (a) => [...new Set(a.map((v) => h(v)))].sort((p, q) => p - q)
    let last = -99, lvl = 0
    const words = big || scope.length <= 2                  // the small drawing in the panel is a map: the numbers are in the table beside it
    const xt = uniq(xs).map((v) => { lvl = v - last < F * 1.05 ? (lvl + 1) % 3 : 0; last = v; const y = top - 14 - lvl * F * 2.9; return `<path class="tk" d="M${v} ${top}V${words ? y + 4 : top - 16}"/>${words ? `<text class="ord" font-size="${F}" transform="translate(${v + F * 0.36} ${y}) rotate(-90)">${mm(v)}</text>` : ''}` }).join('')
    last = -99
    const yt = uniq(ys).map((v) => { const dy = v - last < F * 1.05 ? F * 1.05 - (v - last) : 0; last = v + dy; return `<path class="tk" d="M0 ${v}H-12"/>${words ? `<text class="ord" font-size="${F}" x="-16" y="${v + dy + F * 0.36}" text-anchor="end">${mm(v)}</text>` : ''}` }).join('')
    return `<svg class="locsvg${big ? '' : ' thumb'}" ${big ? '' : `data-locbig="${esc(scope[0]?.step ?? '')}"`} viewBox="${-mL} ${top - mT} ${1118 + mL + 40} ${bot - top + mT + 40}" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="lc${big ? 1 : 0}${crop ? 1 : 0}"><rect x="-4" y="${top}" width="1200" height="${bot - top}"/></clipPath><g clip-path="url(#lc${big ? 1 : 0}${crop ? 1 : 0})"><rect class="plate" x="0" y="0" width="1118" height="1422"/>${body}</g>
      ${crop ? `<path class="brk" d="M0 ${top}H1118"/><text class="ord" font-size="${F}" x="1118" y="${top - mT + F * 2.6}" text-anchor="end">this line is ${mm(top)} mm below the top edge (B)</text>` : '<path class="datum" d="M0 0H1118"/>'}<path class="datum" d="M0 ${top}V${bot}"/>
      <g class="dflag">${crop ? '' : `<rect x="${1118 - 250}" y="${-mT + 6}" width="250" height="${F * 1.5}"/><text x="${1118 - 125}" y="${-mT + 6 + F * 1.1}" font-size="${F}" text-anchor="middle">B  top edge</text><circle cx="0" cy="0" r="13"/>`}
      <rect x="${-mL + 4}" y="${bot - F * 1.5}" width="${mL - 20}" height="${F * 1.5}"/><text x="${-mL + 4 + (mL - 20) / 2}" y="${bot - F * 0.4}" font-size="${F * 0.9}" text-anchor="middle">C  left edge</text>
      <text x="${-mL + 8}" y="${top - mT + F * 1.1}" font-size="${F * 0.9}">mm from C →${crop ? '' : '  from B ↓'}</text></g>
      ${lead.join('')}${xt}${yt}</svg>`
  }
  function doorSheet(scope, big) {
    const F = big ? 20 : 26, W = DOOR.w, H = DOOR.h
    const parts = DOOR_ITEMS.map((i) => { const cx = W - i.fromRight, cy = i.fromTop, hot = scope.some((s) => s.tag === i.tag)
      return `${i.round ? `<circle class="plate cut${hot ? ' hot' : ''}" cx="${cx}" cy="${cy}" r="${i.w / 2}"/>` : `<rect class="plate cut${hot ? ' hot' : ''}" x="${cx - i.w / 2}" y="${cy - i.hh / 2}" width="${i.w}" height="${i.hh}"/>`}
        <path class="ld" d="M${cx} ${cy}H${W}M${cx} ${cy}V0"/><path class="tk" d="M${cx - 14} ${cy}h28M${cx} ${cy - 14}v28M${cx} 0v-14M${W} ${cy}h14"/>
        <text class="ord" font-size="${F}" x="${cx}" y="-20" text-anchor="middle">${mm(i.fromRight)}</text><text class="ord" font-size="${F}" x="${W + 20}" y="${cy + F * 0.36}">${mm(i.fromTop)}</text><text class="tg" font-size="${F}" x="${cx - i.w / 2 - 10}" y="${cy + 8}" text-anchor="end">${esc(i.tag)}</text>` }).join('')
    // the top part of the door only (both cutouts are in it), so the numbers are large enough to read
    const Hs = Math.min(H, Math.max(...DOOR_ITEMS.map((i) => i.fromTop + i.hh / 2)) + 160)
    return `<svg class="locsvg door" viewBox="-40 -${F * 3.4} ${W + 150} ${Hs + F * 3.4 + 20}" xmlns="http://www.w3.org/2000/svg"><path class="plate" d="M0 ${Hs}V0H${W}V${Hs}"/>${parts}
      <path class="datum" d="M0 0H${W}"/><path class="datum" d="M${W} 0V${Hs}"/><g class="dflag"><text x="${W / 2}" y="-${F * 2.2}" font-size="${F * 0.8}" text-anchor="middle">top of the right door · mm in from its handle edge</text><text font-size="${F}" transform="translate(${W + 118} ${Hs / 2}) rotate(90)" text-anchor="middle">handle edge · mm down from the top</text></g></svg>`
  }

  // ---- words and tables
  function rowHTML(i, sel) {
    if (i.kind === 'door') return `<tr data-dev="${esc(i.tag)}" class="${i.tag === sel ? 'sel' : ''}"><td><b>${esc(i.tag)}</b><small>${esc(i.what)}</small></td><td>${both(i.fromRight)}<small>from the door's handle edge, to the centre</small></td><td>${both(i.fromTop)}<small>down from the top of the door, to the centre</small></td><td>${fcf(i.cls)}</td></tr>`
    const x = `${both(i.X0)}<small>left ${i.kind === 'rail' ? 'end' : 'edge'}</small><br>${both(i.X1)}<small>right ${i.kind === 'rail' ? 'end' : 'edge'} (check)</small>`
    const y = i.kind === 'rail' ? `${both(i.Y)}<small>centre line</small>` : i.kind === 'raildev' ? `<span class="onrail">${esc(G.RAILS[i.rail].name)}</span><small>${i.order} of ${i.of} from the left<br>${esc(i.against)}</small>` : `${both(i.Yt)}<small>top edge</small><br>${both(i.Yb)}<small>bottom edge (check)</small>`
    return `<tr ${i.dev ? `data-dev="${esc(i.tag)}"` : ''} class="${i.tag === sel ? 'sel' : ''}"><td><b>${esc(i.tag)}</b><small>${esc(i.what)}</small>${i.holes ? `<small class="hl">⊕ ${i.holes.n} mounting holes${i.holes.pat ? `: ${[i.holes.pat.w, i.holes.pat.h].filter(Boolean).map(mm).join(' x ')} mm` : ''}${i.cols ? `, columns at ${i.cols.map(mm).join(', ')}` : ''}. Tap for the pattern.</small>` : ''}</td><td>${x}</td><td>${y}</td><td>${fcf(i.cls)}</td></tr>`
  }
  const table = (scope, sel) => !scope.length ? '' : `<table class="loct"><thead><tr><th>Item</th><th>Across, from the left edge <i class="dm">C</i></th><th>Down, from the top edge <i class="dm">B</i></th><th>Hold to</th></tr></thead><tbody>${scope.map((i) => rowHTML(i, sel)).join('')}</tbody></table>`
  const legend = () => `<div class="locleg"><p><i class="dm">A</i> the face of the subplate · <i class="dm">B</i> its top edge · <i class="dm">C</i> its left edge. Hook the tape on the edge and read every number from it: do not measure from one part to the next.</p>
    ${Object.entries(TOL).map(([k, t]) => `<p>${fcf(k)} <b>${t.name}</b>: within ${t.pm} (${t.why}).</p>`).join('')}
    <p class="muted small">Positions are where this guide's 3D panel has each part: sheet 3 scaled from the drawing (good to about 1 mm) with real widths from the makers' documents. The tolerances are this guide's proposal, not the drawing's: see Issues. Mounting hole patterns are not on sheet 3: take them from each part's instructions (Parts).</p></div>`
  // the hole pattern as the document gives it: crosses at the holes, the two spacings written on it
  function patSVG(pt) {
    if (!pt) return ''
    const w = pt.w ?? 0, hh = pt.h ?? 0, sc = 150 / Math.max(w, hh, 1), W = Math.max(w * sc, 0), H = Math.max(hh * sc, 0), pts = []
    for (const x of w ? [0, W] : [0]) for (const y of hh ? [0, H] : [0]) pts.push([x, y])
    return `<svg class="patsvg" viewBox="-56 -34 ${W + 112} ${H + 68}" width="${Math.round(W + 112)}" height="${Math.round(H + 68)}" xmlns="http://www.w3.org/2000/svg">${pts.map(([x, y]) => `<path class="tk" d="M${x - 9} ${y}h18M${x} ${y - 9}v18"/><circle class="hc" cx="${x}" cy="${y}" r="5"/>`).join('')}
      ${w ? `<path class="ld" d="M0 -20H${W}"/><text class="ord" font-size="15" x="${W / 2}" y="-24" text-anchor="middle">${mm(w)}</text>` : ''}${hh ? `<path class="ld" d="M${W + 20} 0V${H}"/><text class="ord" font-size="15" x="${W + 26}" y="${H / 2 + 5}">${mm(hh)}</text>` : ''}</svg>`
  }
  function holesHTML(i) {
    const hl = i.holes; if (!hl) return ''
    return `<div class="lochole"><h4>Mounting holes <span class="hint">from the maker's document</span></h4>${patSVG(hl.pat)}<p>${esc(hl.text)}</p>${hl.drill ? `<p>${esc(hl.drill)}</p>` : ''}
      ${i.cols ? `<p>Hole columns, from <i class="dm">C</i>: ${i.cols.map((v) => both(v)).join(' · ')}</p>` : ''}${hl.where ? `<p class="note">${esc(hl.where)}</p>` : ''}<p class="muted small">From: ${esc(hl.cite)}</p></div>`
  }
  // the block on a part's page and under a selected part
  function card(tag) {
    const i = byTag(tag); if (!i) return ''
    const t = TOL[i.cls]
    const where = i.kind === 'door' ? `<p class="locbig">${both(i.fromRight)} from the handle edge of the right door · ${both(i.fromTop)} down from its top edge <small>(to the centre)</small></p>`
      : i.kind === 'raildev' ? `<p class="locbig"><span class="onrail">${esc(G.RAILS[i.rail].name)}</span> · left edge ${both(i.X0)} from <i class="dm">C</i> · right edge ${both(i.X1)}</p><p>${i.order} of ${i.of} from the left on this rail: ${esc(i.against)}. Rail centre line ${both(i.Y)} down from <i class="dm">B</i>.</p>`
      : `<p class="locbig">left edge ${both(i.X0)} from <i class="dm">C</i> · top edge ${both(i.Yt)} from <i class="dm">B</i></p><p>Check: right edge ${both(i.X1)}, bottom edge ${both(i.Yb)}. Size ${mm(i.X1 - i.X0)} x ${mm(i.Yb - i.Yt)} mm.</p>`
    return `<section class="loccard"><h3>Where it goes <button class="lnk" data-tab="locate">mark-out drawing →</button></h3>${where}
      <p>${fcf(i.cls)} ${t.name}: ${t.pm}.</p>${i.printed ? `<p class="note">${esc(i.printed)}</p>` : ''}<p class="muted small">From: ${esc(i.src ?? 'sheet 2')}</p>${holesHTML(i)}
      ${i.kind === 'door' ? doorSheet([i]) : sheet([i], tag)}</section>`
  }
  // the short list under a build step
  function stepBlock(st) {
    const scope = itemsOf(st.id); if (!scope.length) return ''
    return `<section class="locstep"><h3>Where it goes <span class="hint">from the top left corner of the plate</span></h3>${table(scope, SEL.tag)}<button class="btn ghost" data-tab="locate">Open the mark-out drawing</button></section>`
  }
  let viewStep = null
  function tabHTML() {
    const steps = stepsWith()
    const stId = viewStep && steps.some((s) => s.id === viewStep) ? viewStep : (steps.find((s) => s.id === G.STEPS[cur].id) ?? steps.find((s) => SEL.tag && byTag(SEL.tag)?.step === s.id) ?? steps[0]).id
    viewStep = stId
    const scope = SEL.kind === 'dev' && byTag(SEL.tag) && byTag(SEL.tag).step === stId ? itemsOf(stId) : itemsOf(stId)
    const door = scope.some((i) => i.kind === 'door'), plate = scope.filter((i) => i.kind !== 'door')
    return `<div class="stephead"><div class="num">⌖</div><div><h2>Locate</h2><p class="why">Where every item goes, measured from the same two edges.</p></div></div>
      <div class="wtools"><select data-locstep>${steps.map((s) => `<option value="${s.id}" ${s.id === stId ? 'selected' : ''}>Step ${stepIndex(s.id) + 1}: ${esc(s.title)}</option>`).join('')}</select><button class="btn ghost" data-locbig>Big drawing</button></div>
      ${plate.length ? sheet(plate, SEL.tag) : ''}${door ? doorSheet(scope) : ''}
      ${legend()}${table(scope, SEL.tag)}
      <div class="wtools"><button class="btn" data-locprint>Print the mark-out sheets</button><button class="btn ghost" data-loccsv>Positions (CSV)</button></div>`
  }
  function bigOpen(stepId) {
    let o = document.getElementById('g-locbig'); if (!o) { o = document.createElement('div'); o.id = 'g-locbig'; document.body.appendChild(o); o.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target === o) o.classList.remove('open'); const d = e.target.closest('[data-dev]'); if (d) { o.classList.remove('open'); select({ kind: 'dev', tag: d.dataset.dev }) } }) }
    if (stepId) viewStep = stepId
    if (!viewStep) viewStep = stepsWith()[0].id
    const scope = itemsOf(viewStep), st = G.STEPS[stepIndex(viewStep)]
    o.innerHTML = `<div class="in"><header><b>Step ${stepIndex(viewStep) + 1}: ${esc(st.title)}</b><span>All dimensions in mm from the top left corner of subplate 1: across from the left edge (C), down from the top edge (B).</span><button data-close>Close ✕</button></header>${scope.some((i) => i.kind !== 'door') ? sheet(scope.filter((i) => i.kind !== 'door'), SEL.tag, true) : doorSheet(scope, true)}</div>`
    o.classList.add('open')
  }
  function csv() {
    const rows = [['item', 'part', 'step', 'on', 'left edge from C mm', 'right edge from C mm', 'top edge or centre line from B mm', 'bottom edge from B mm', 'sits against', 'tolerance (proposed)', 'from', 'mounting holes (maker document)', 'hole columns from C mm', 'hole source']]
    for (const i of ITEMS) rows.push([i.tag, i.what, stepIndex(i.step) + 1, i.rail ? G.RAILS[i.rail].name : 'subplate 1', mm(i.X0), mm(i.X1), mm(i.Y ?? i.Yt), i.Y !== undefined ? '' : mm(i.Yb), i.against ?? '', `${TOL[i.cls].pm} (dia ${TOL[i.cls].zone} | A | B | C)`, i.src ?? '', i.holes ? `${i.holes.text} ${i.holes.drill}` : '', i.cols ? i.cols.map(mm).join(' / ') : '', i.holes?.cite ?? ''])
    for (const i of DOOR_ITEMS) rows.push([i.tag, i.what, stepIndex(i.step) + 1, 'right door', `${mm(i.fromRight)} from the handle edge`, '', `${mm(i.fromTop)} from the top of the door`, '', '', TOL[i.cls].pm, 'sheet 2'])
    const text = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = 'VFD200 positions.csv'; a.click()
  }
  function print() {
    const box = document.getElementById('g-print')
    box.innerHTML = `<h1>VFD 200 mark-out sheets</h1><p>${esc(G.JOB.number)} · ${esc(G.JOB.project)} · from ${esc(G.JOB.drawing)} rev ${esc(G.JOB.rev)} · assembly guide V${esc(G.VERSION)}. All dimensions in mm (inches to the nearest 1/16) from datum C (left edge of subplate 1) and datum B (its top edge). Tolerances are proposed by the guide: the drawings give none.</p>` +
      stepsWith().map((st) => { const sc = itemsOf(st.id), pl = sc.filter((i) => i.kind !== 'door'); return `<div class="locpage"><h2>Step ${stepIndex(st.id) + 1}: ${esc(st.title)}</h2>${pl.length ? sheet(pl, null, true) : ''}${sc.some((i) => i.kind === 'door') ? doorSheet(sc, true) : ''}${table(sc, null)}${sc.filter((i) => i.holes).map((i) => `<h3>${esc(i.tag)}</h3>${holesHTML(i)}`).join('')}</div>` }).join('')
    window.print()
  }

  // ---- the same thing on the 3D panel: datum edges lit, a leader from each edge to the part, numbers on the leaders
  const g3 = new THREE.Group(); g3.renderOrder = 30; lab.machine.add(g3)
  const lm = new THREE.MeshBasicMaterial({ color: INK, depthTest: false, transparent: true, opacity: 0.95 }), dm = new THREE.MeshBasicMaterial({ color: INK, depthTest: false, transparent: true, opacity: 0.55 })
  const Z = PZ + 0.004
  const bar = (X0, Y0m, X1, Y1m, t = 0.0014, m = lm) => { const o = new THREE.Mesh(new THREE.BoxGeometry(Math.max(Math.abs(X1 - X0) / 1000, t), Math.max(Math.abs(Y1m - Y0m) / 1000, t), 0.0004), m); o.position.set(SX((X0 + X1) / 2), SY((Y0m + Y1m) / 2), Z); o.renderOrder = 30; g3.add(o) }
  let labels = [], shown = ''
  const layer = document.getElementById('g-tags')
  const els = []
  function show(list) {
    const key = list.map((i) => i.tag).join('|'); if (key === shown) return; shown = key
    g3.clear(); labels = []
    if (!list.length) return
    bar(0, 0, 1118, 0, 0.003, dm); bar(0, 0, 0, 1422, 0.003, dm)                          // datums B and C
    labels.push({ X: 1118 - 60, Y: -16, html: '<i>B</i> top edge', c: 'dat' }, { X: -22, Y: 1422 - 60, html: '<i>C</i> left edge', c: 'dat' }, { X: -22, Y: -16, html: '0', c: 'dat' })
    const one = list.length === 1, seenY = new Set()
    // several parts on one rail: a tape laid along the row from the left edge, a tick and a number at each part's left edge
    const tape = {}
    if (!one) for (const k of Object.keys(G.RAILS)) {
      const row = list.filter((i) => i.kind === 'raildev' && i.rail === k).sort((a, b) => a.X0 - b.X0); if (!row.length) continue
      const ty = Math.min(...row.map((i) => i.Yt)) - 34; let last = -99, lvl = 0
      bar(0, ty, row[row.length - 1].X0, ty, 0.0022)
      labels.push({ X: 0, Y: ty, html: '0', c: 'dat' })
      for (const i of row) { lvl = i.X0 - last < 34 ? (lvl + 1) % 3 : 0; last = i.X0; bar(i.X0, ty - 4, i.X0, i.Yt, 0.001); labels.push({ X: i.X0, Y: ty - 12 - lvl * 15, html: mm(i.X0), c: `dim sm${i.anchor ? ' anc' : ''}` }); tape[i.tag] = 1 }
    }
    for (const i of list) {
      if (tape[i.tag]) { const ky = h(i.Y); if (!seenY.has(ky)) { seenY.add(ky); bar(0, i.Y, G.RAILS[i.rail].x0, i.Y); labels.push({ X: 42, Y: i.Y, html: `↓ ${mm(i.Y)}`, c: 'dim' }) } continue }
      if (i.kind === 'door') continue
      const y = i.Y ?? i.Yt
      if (one) {
        bar(0, y, i.X0, y); bar(i.X0, 0, i.X0, y)
        // the numbers sit beside the part (so they are in view when zoomed in on it) and again half way along each leader
        labels.push({ X: i.X0 - 34, Y: y, html: `→ ${mm(i.X0)}`, c: 'dim' }, { X: i.X0, Y: y - 26, html: `↓ ${mm(y)}`, c: 'dim' })
        if (i.cols) for (const c of i.cols) { bar(c, i.Yt - 16, c, i.Yb + 16, 0.0009); labels.push({ X: c, Y: i.Yb + 26, html: `⊕ ${mm(c)}`, c: 'chk' }) }
        if (i.X0 > 260) labels.push({ X: i.X0 / 2, Y: y, html: `→ ${mm(i.X0)}`, c: 'dim sm' })
        if (y > 260) labels.push({ X: i.X0, Y: y / 2, html: `↓ ${mm(y)}`, c: 'dim sm' })
        if (i.kind !== 'raildev') { bar(i.X1, i.Yt, i.X1, i.Yb, 0.001); labels.push({ X: i.X1, Y: i.Yb + 12, html: `${mm(i.X1)} , ${mm(i.Yb)}`, c: 'chk' }) } else labels.push({ X: i.X1, Y: i.Yb + 12, html: `right edge ${mm(i.X1)}`, c: 'chk' })
      } else {
        if (i.kind === 'raildev') { bar(i.X0, i.Yt - 14, i.X0, i.Yt + 6); labels.push({ X: i.X0, Y: i.Yt - 22 - ((i.order ?? 0) % 2) * 16, html: mm(i.X0), c: 'dim sm' }) }
        else { bar(i.X0, i.Yt - 10, i.X0, i.Yt + 10); labels.push({ X: i.X0, Y: i.Yt, html: i.kind === 'rail' ? `${mm(i.X0)} to ${mm(i.X1)}` : `${mm(i.X0)} , ${mm(i.Yt)}`, c: 'dim sm' }); if (i.kind === 'rail') labels[labels.length - 1].X = i.X0 + 90 }
        const ky = h(y); if (!seenY.has(ky) && (i.kind === 'raildev' || i.kind === 'rail')) { seenY.add(ky); bar(0, y, i.kind === 'rail' ? i.X0 : G.RAILS[i.rail].x0, y); labels.push({ X: 40, Y: y, html: `↓ ${mm(y)}`, c: 'dim' }) }
      }
    }
  }
  function want() {
    if (!VIEW.loc || VIEW.complete || wm.on) return []
    let tab = 'steps'; try { tab = ui.name } catch { return [] }
    const st = G.STEPS[cur], phaseOK = tab === 'locate' || ['P1', 'P2', 'P3'].includes(st.phase)
    if (!phaseOK) return []
    if (SEL.kind === 'dev') { const i = byTag(SEL.tag); return i && i.kind !== 'door' ? [i] : [] }
    if (SEL.kind) return []
    return itemsOf(tab === 'locate' && viewStep ? viewStep : st.id).filter((i) => i.kind !== 'door')
  }
  function update() {
    show(want())
    labels.forEach((l, n) => {
      const e = els[n] ?? (els[n] = layer.appendChild(document.createElement('div')))
      const q = lab.machine.localToWorld(V3(SX(l.X), SY(l.Y), Z)).project(lab.camera)
      if (q.z > 1) { e.style.display = 'none'; return }
      e.className = `g-dim ${l.c}`; e.innerHTML = l.html; e.style.display = 'block'; e.style.left = `${(q.x * 0.5 + 0.5) * innerWidth}px`; e.style.top = `${(-q.y * 0.5 + 0.5) * innerHeight}px`
    })
    for (let n = labels.length; n < els.length; n++) els[n].style.display = 'none'
  }
  VIEW.loc = store.get('loc') ?? true
  function toggle(on) { VIEW.loc = on ?? !VIEW.loc; store.set('loc', VIEW.loc); document.querySelector('[data-loc]')?.classList.toggle('on', VIEW.loc) }
  const css = document.createElement('style')
  css.textContent = `
    .locsvg { width:100%; height:auto; display:block; background:#fff; border:1px solid var(--line, #d9d9d4); border-radius:10px; margin:10px 0 }
    .locsvg.door { max-height:420px } .locsvg.thumb { cursor:zoom-in } .g-dim.anc { opacity:.6 }
    .locsvg .plate { fill:#f6f6f2; stroke:#8a8a84; stroke-width:2 } .locsvg .cut { fill:#fff } .locsvg .cut.hot { stroke:${INK}; stroke-width:4 }
    .locsvg .duct { fill:#dcdcd6; stroke:none } .locsvg .rail { stroke:#9a9a94; stroke-width:8; stroke-dasharray:22 10 } .locsvg .plate ~ rect.plate, .locsvg rect.raildev, .locsvg rect.plate { }
    .locsvg rect.raildev, .locsvg rect.plate:not(:first-child) { fill:#fff; stroke:#8a8a84; stroke-width:1.5; cursor:pointer }
    .locsvg .hot { stroke:${INK} !important; stroke-width:3 !important } .locsvg rect.duct.hot { fill:#f3d3e8 } .locsvg rect.raildev.hot, .locsvg rect.plate.hot { fill:#fbe9f4 } .locsvg line.rail.hot { stroke-width:10 !important }
    .locsvg .sel { fill:${INK} !important } .locsvg .tg { font-family:'JetBrains Mono', monospace; font-weight:700; fill:#222; pointer-events:none }
    .locsvg .cl, .patsvg .ld { stroke:#b0127a; stroke-width:1.6; stroke-dasharray:16 5 3 5; fill:none } .patsvg .tk { stroke:#b0127a; stroke-width:2; fill:none } .patsvg .hc { fill:none; stroke:#b0127a; stroke-width:1.6 } .patsvg .ord { font-family:'JetBrains Mono', monospace; font-weight:700; fill:#b0127a } .patsvg { display:block; margin:6px 0 }
    .lochole { border-top:1px dashed #d9b9cf; margin-top:10px; padding-top:8px } .lochole h4 { margin:0 0 4px; font-size:13px; text-transform:uppercase; letter-spacing:.04em; color:#555 } .loct small.hl { color:#b0127a }
    .locsvg .brk { stroke:#b0127a; stroke-width:3; stroke-dasharray:18 8 4 8; fill:none } .locsvg .datum { stroke:${INK}; stroke-width:7; fill:none } .locsvg .dflag rect { fill:${INK} } .locsvg .dflag rect + text { fill:#fff; font-weight:700 } .locsvg .dflag text { font-family:Inter, sans-serif; fill:${INK}; font-weight:700 } .locsvg .dflag circle { fill:${INK} }
    .locsvg .ld { stroke:${INK}; stroke-width:1.6; stroke-dasharray:7 6; fill:none; opacity:.75 } .locsvg .tk { stroke:${INK}; stroke-width:2.4; fill:none } .locsvg .ord { font-family:'JetBrains Mono', monospace; font-weight:700; fill:${INK} }
    .loct { width:100%; border-collapse:collapse; margin:8px 0 12px; font-size:13.5px } .loct th { text-align:left; font-weight:600; font-size:12px; color:#666; padding:6px 6px; border-bottom:2px solid #ddd; vertical-align:bottom }
    .loct td { padding:8px 6px; border-bottom:1px solid #e6e6e1; vertical-align:top; line-height:1.35 } .loct tr[data-dev] { cursor:pointer } .loct tr[data-dev]:hover { background:#faf3f8 } .loct tr.sel { background:#fbe9f4 }
    .loct small, .loccard small, .locbig small { color:#777; font-size:11.5px; margin-left:4px } .loct td:first-child small { display:block; margin-left:0 } .loct b { font-family:'JetBrains Mono', monospace; font-size:15px }
    .dm { display:inline-block; font:700 12px 'JetBrains Mono', monospace; font-style:normal; color:#fff; background:${INK}; border-radius:3px; padding:1px 5px }
    .onrail { display:inline-block; font-weight:700; background:#eee; border-radius:5px; padding:1px 7px }
    .fcf { display:inline-flex; border:1.5px solid #333; border-radius:2px; font:600 12px 'JetBrains Mono', monospace; vertical-align:middle; background:#fff } .fcf i { font-style:normal; padding:1px 5px; border-left:1.5px solid #333 } .fcf i:first-child { border-left:0 }
    .locleg { background:#faf6f9; border:1px solid #ecd9e6; border-radius:10px; padding:10px 12px; margin:8px 0 } .locleg p { margin:5px 0; font-size:13.5px }
    .loccard { border:1.5px solid ${INK}; border-radius:12px; padding:12px 14px; margin:10px 0 14px; background:#fff } .loccard h3 { margin-top:0 } .locbig { font-size:16px; line-height:1.5 } .locbig b, .loccard p b { font-family:'JetBrains Mono', monospace; font-size:18px }
    .g-dim { position:absolute; transform:translate(-50%, -50%); font:700 13px 'JetBrains Mono', monospace; color:#fff; background:${INK}; padding:2px 6px; border-radius:4px; white-space:nowrap; box-shadow:0 1px 5px #0003 }
    .g-dim.sm { font-size:11px; padding:1px 4px } .g-dim.chk { background:#fff; color:${INK}; border:1px solid ${INK}; font-size:11px } .g-dim.dat { background:#fff; color:${INK}; border:1.5px solid ${INK} } .g-dim.dat i { font-style:normal; background:${INK}; color:#fff; padding:0 4px; border-radius:2px; margin-right:3px }
    #g-locbig { position:fixed; inset:0; z-index:60; background:#0008; display:none; padding:20px } #g-locbig.open { display:block } #g-locbig .in { background:#fff; border-radius:14px; height:100%; display:flex; flex-direction:column; overflow:hidden }
    #g-locbig header { display:flex; gap:16px; align-items:center; padding:12px 18px; border-bottom:1px solid #ddd; font-size:14px } #g-locbig header span { color:#666; flex:1 } #g-locbig header button { font:600 14px Inter, sans-serif; padding:8px 14px; border-radius:8px; border:1px solid #bbb; background:#fff; cursor:pointer }
    #g-locbig .locsvg { flex:1; min-height:0; border:0; margin:0; width:100%; height:100% }
    body.big .loct { font-size:15px } body.big .g-dim { font-size:15px }
    @media print { #g-locbig { display:none !important } .locpage { page-break-after:always } .locpage .locsvg { max-height:150mm; border:0 } .loct { font-size:10px } .loct b { font-size:11px } }`
  document.head.appendChild(css)
  return { ITEMS, DOOR_ITEMS, TOL, HOLES, byTag, itemsOf, card, stepBlock, tabHTML, bigOpen, csv, print, update, toggle, setStep: (s) => { viewStep = s } }
})()

// ------------------------------------------------------------------ the guide panel
const endTxt = (e) => {
  const t = String(e.term ?? ''), field = t.endsWith(':field'), tt = t.replace(/:field$/, '')
  if (/^TB\d$/.test(e.dev)) return `${e.dev}-${tt}${field ? ' (field side)' : ''}`
  return `${e.dev}${tt ? ' ' + tt : ''}`
}
const devLink = (tag, text) => DEV[tag] || tag === 'GB1' ? `<button class="dl" data-dev="${esc(tag)}">${esc(text ?? tag)}</button>` : esc(text ?? tag)
const endLink = (e) => devLink(e.dev === 'GND BAR' ? 'GB1' : e.dev, endTxt(e))
const BOMBY = Object.fromEntries(G.BOM.map((b) => [b.pn, b]))
const DOCS = G.DOCS ?? {}
const lenMm = (w) => w ? (w.cut?.total ?? Math.round(w.len * 1000 / 10) * 10 + 150) : null
function refLinks(pn) {
  const out = [], d = DOCS[pn]
  if (d?.partslib) for (const x of d.partslib) out.push(`<a href="${esc(x.url)}" target="_blank" rel="noopener" class="pl">${x.title.startsWith('PartsLib') ? '' : 'PartsLib · '}${esc(x.title)}</a>`)
  else out.push(`<a href="${esc(G.PL_URL)}/#/search?q=${encodeURIComponent(pn)}" target="_blank" rel="noopener" class="pl">PartsLib: search ${esc(pn)}</a>`)
  if (d?.web) for (const x of d.web) out.push(`<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${x.verified ? 'Opened and checked' : 'Found by search, not opened: check it'}">${esc(x.title)}${x.doc_number ? ` <span class="dn">${esc(x.doc_number)}</span>` : ''}${x.verified ? '' : ' <span class="dn">(unchecked)</span>'}</a>`)
  return out.join('')
}
function factsFor(pn) { const d = DOCS[pn]; return d?.facts?.length ? `<ul class="facts">${d.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '' }
// where a part's 3D shape comes from: the maker's STEP (register id and file) or its catalogue drawing
const MODEL_OF_PN = (() => {
  const m = {}
  const add = (pn, key) => { const g = G.MODELS?.[key]; if (g && !m[pn]) m[pn] = g }
  for (const [tag, f] of Object.entries(FIT.MODEL_FIT)) add(G.DEVICES.find((d) => d.tag === tag)?.pn ?? (tag === 'RCP1' ? '1492-REC15' : ''), f.model)
  add('1492-J4', 'J4'); add('1492-J6', 'J6'); add('1492-EAJ35', 'EAJ35'); add('1492-EBJ3', 'EBJ3'); add('467-416', 'RAIL'); add('F2X2WH6', 'DUCT2'); add('F3X2WH6', 'DUCT3')
  add('SCE-60XEL4918SSST', 'ENCL'); add('SCE-AC1000B120VSS', 'AC'); add('2711P-T10C21D8S', 'PVP7'); add('800H-FRXJTQH2RA5', '800H'); add('SCE-16P14', 'SUB2'); add('DN-ASB2-10', 'ASB2'); add('PTFIX-NS35A', 'NS35A')
  return m
})()
function modelLine(pn) {
  const g = MODEL_OF_PN[pn]
  if (g) return `<div class="small muted" style="margin:2px 0 6px">3D: maker STEP, ${esc(g.comp)} · ${esc(String(g.step).split('/').pop())}</div>`
  return BOMBY[pn] && !BOMBY[pn].field ? `<div class="small muted" style="margin:2px 0 6px">3D: built from the catalogue drawing (no maker STEP held)</div>` : ''
}
function partCard(pn, tags) {
  const b = BOMBY[pn] ?? { pn, desc: '', mfr: '' }
  return `<div class="part"><div class="ph"><b>${esc(tags ?? b.where)}</b><span class="pn">${esc(pn)}</span></div>
    <div class="pd">${esc(b.mfr)} · ${esc(b.desc)}${b.qty ? ` · qty ${esc(b.qty)}` : ''}</div>${modelLine(pn)}${factsFor(pn)}<div class="refs">${refLinks(pn)}</div></div>`
}
function terminalRows(tag) {
  const rows = []
  G.SEGMENTS.forEach((s, i) => {
    const w = WIRES[i]
    if (s.notFitted) return                       // RCP1's two sheet 6 jumpers: nothing to land them on
    // RCP1: show the real clamp (L, N, G) with the sheet 6 name after it
    const nm = (end, p) => tag === 'RCP1' && p?.pin ? `${p.pin} (sheet 6: ${end.term})` : null
    const add = (end, other, p) => { if (end.dev === tag || (tag === 'GB1' && end.dev === 'GND BAR')) rows.push({ i, term: nm(end, p) ?? (end.term ? String(end.term).replace(/:field$/, '') + (String(end.term).endsWith(':field') ? ' (field)' : '') : (p?.pin ?? '')), label: s.label, other: other, awg: s.awg, kind: w?.kind ?? s.kind, where: p?.where }) }
    if (s.cores?.length) s.cores.forEach((k) => { add(k.from, k.to); add(k.to, k.from) })
    else { add(s.from, s.to, w?.ends[0]); add(s.to, s.from, w?.ends[1]) }
  })
  return rows.sort((a, b) => String(a.term).localeCompare(String(b.term), undefined, { numeric: true }))
}
function endBlock(label, e, p, s, w) {
  const sp = p && !p.exit ? specFor(p.dev, p.pin) : null
  const et = p && !p.exit ? endType(p, s.awg, w?.kind) : null
  const loc = p?.feeder ? 'From the plant supply, by the installer. Where it enters the enclosure is not on the drawings.' : p?.exit ? (p.door ? 'On the right door: forward from the duct below the drives to the centre post, then across the door from its hinge edge (route not on the drawings)' : p.offplate === 'A/C' ? 'To the A/C terminal box on the left wall' : p.sub2 ? 'To VM1 on subplate 2 (left wall)' : 'Down out of the bottom duct to a gland in the floor: connected on site') : p?.where
  return `<div class="endb"><div class="eh"><span class="ab">${label}</span><b>${endLink(e)}</b>${p?.conf && p.conf !== 'measured' ? `<span class="apx" title="Terminal position source">${esc(p.conf)}</span>` : ''}</div>
    ${loc ? `<div class="el">${esc(loc)}</div>` : ''}${et ? `<div class="el">End: ${esc(et.text)}</div>` : ''}${sp?.text ? `<div class="el sp">${esc(sp.text)}</div>` : ''}</div>`
}
function cutBlock(w) { return w?.cut ? `<details class="cutb"><summary>Cut ${w.cut.total} mm: how it adds up</summary>${w.cut.parts.map((p) => `<div><span>${esc(p.what)}</span><b>${p.mm} mm</b></div>`).join('')}</details>` : '' }
const segs = G.SEGMENTS
const ui = (() => {
  const Pnl = document.getElementById('g-panel')
  let tabName = 'steps', opts = {}
  // the selection bar: what is selected, and the same thing seen in each tab
  function chipHTML() {
    if (SEL.kind === 'wire') {
      const s = segs[SEL.i], w = WIRES[SEL.i]
      return `<div class="chip"><span class="sw" style="background:${WC[w?.kind]?.hex ?? '#888'}"></span><b>${esc(s.label || '(no number)')}</b><span class="ct">${esc(endTxt(s.from))} → ${esc(endTxt(s.to))}</span><button class="x" data-clear title="Clear (Esc)">✕</button>
        <div class="cb"><button data-go="wire">Wire it</button><button data-go="wires">Wires</button><button data-go="parts">Parts</button><button data-go="steps">Step</button><button data-trace>▶ Trace route</button></div></div>`
    }
    if (SEL.kind === 'dev') {
      const n = segs.filter((s) => segTouches(s, SEL.tag)).length
      return `<div class="chip dev"><b>${esc(SEL.tag)}</b><span class="ct">${esc(PN_OF[SEL.tag] ?? '')} · ${n} wire${n === 1 ? '' : 's'} land here</span><button class="x" data-clear title="Clear (Esc)">✕</button>
        <div class="cb"><button data-go="wire" ${n ? '' : 'disabled'}>Wire it (${n})</button><button data-go="wires">Its wires</button><button data-go="parts">Part</button><button data-go="steps">Its step</button>${LOC.byTag(SEL.tag) ? '<button data-go="locate">Locate</button>' : ''}</div></div>`
    }
    return ''
  }
  function stepsHTML() {
    const st = G.STEPS[cur], ph = G.PHASES.find((p) => p.id === st.phase)
    const done = store.get('done') ?? {}
    const tasks = st.tasks.map((t, k) => { const id = `${st.id}:${k}`; return `<label class="task"><input type="checkbox" data-task="${id}" ${done[id] ? 'checked' : ''}><span>${esc(t)}</span></label>` }).join('')
    const parts = (st.parts ?? []).map((pn) => partCard(pn)).join('')
    const list = G.SEGMENTS.map((s, i) => i).filter((i) => WIRES[i] && segs[i].step === st.id)
    const nDone = list.filter((i) => wm.isDone(i)).length
    const outline = G.PHASES.map((p) => `<div class="ph-n">${esc(p.name)}</div>` + G.STEPS.map((s, i) => s.phase !== p.id ? '' : `<button class="ol ${i === cur ? 'cur' : ''} ${G.STEPS[i].tasks.every((_, k) => done[`${s.id}:${k}`]) ? 'ok' : ''}" data-step="${i}"><span>${i + 1}</span>${esc(s.title)}</button>`).join('')).join('')
    const devs = stepTags(st)
    // V9: where you are in the job (the phases as a strip, this phase's steps as dots), then the step, then what to do
    const tDone = st.tasks.filter((_, k) => done[`${st.id}:${k}`]).length
    const strip = G.PHASES.map((p) => { const idx = G.STEPS.map((s, i) => s.phase === p.id ? i : -1).filter((i) => i >= 0); if (!idx.length) return ''; const on = p.id === st.phase, past = idx[idx.length - 1] < cur; return `<button class="ph ${on ? 'on' : past ? 'past' : ''}" data-step="${idx[0]}" title="${esc(p.name)}">${on ? `<span>${esc(p.name)}</span><em>${idx.map((i) => `<i class="${i === cur ? 'c' : i < cur ? 'p' : ''}"></i>`).join('')}</em>` : ''}</button>` }).join('')
    return `<div class="phstrip">${strip}</div>
      <div class="stephead"><div class="num">${cur + 1}</div><div><h2>${esc(st.title)}</h2>${st.why ? `<p class="why">${esc(st.why)}</p>` : ''}</div></div>
      ${list.length ? `<section class="wirecta"><div><b>${list.length}</b> wires and cables in this step · <b>${nDone}</b> done</div><div class="prog sm"><div style="width:${list.length ? nDone / list.length * 100 : 0}%"></div></div><button class="btn big" data-wm="${st.id}">${ICON.wire}<span>${nDone ? 'Carry on wiring' : 'Start wiring'}, one wire at a time</span></button></section>` : ''}
      <section><h3>Do this <span class="cnt ${tDone === st.tasks.length && tDone ? 'ok' : ''}">${tDone} of ${st.tasks.length} done</span></h3>${tasks}</section>
      ${LOC.stepBlock(st)}
      ${st.flags?.length ? `<section class="flags"><h3>${ICON.issues} Check with engineering first</h3>${st.flags.map((f) => `<p>${esc(f)}</p>`).join('')}</section>` : ''}
      ${devs.length ? `<section><h3>Fitted in this step <span class="hint">tap one to find it</span></h3><div class="devs">${devs.map((t) => devLink(t)).join('')}</div></section>` : ''}
      ${parts ? `<details class="fold"><summary>Parts and documents for this step <span class="cnt">${(st.parts ?? []).length}</span></summary>${parts}</details>` : ''}
      <details class="fold outline"><summary>All ${G.STEPS.length} steps</summary>${outline}</details>`
  }
  function wireModeHTML() {
    const i = wm.list[wm.i], s = segs[i], w = WIRES[i]
    const stepsOpt = G.STEPS.filter((x) => x.wires).map((x) => `<option value="${x.id}" ${!wm.dev && wm.filter === x.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')
    const devOpt = wm.dev ? `<option value="dev:${esc(wm.dev)}" selected>Everything on ${esc(wm.dev)}</option>` : ''
    const nDone = wm.list.filter((k) => wm.isDone(k)).length
    const head = `<div class="wtools"><select data-wmstep>${devOpt}<option value="" ${!wm.dev && !wm.filter ? 'selected' : ''}>All wiring steps</option>${stepsOpt}</select><button class="btn ghost" data-wmexit>Close</button></div>`
    if (!s) return head + '<p class="muted">No wires in this selection.</p>'
    const coresTxt = w?.cores?.length ? `<div class="cores">${w.cores.map((c) => `<span><i class="sw" style="background:${c.colour}"></i>${esc(c.name)} ${esc(c.k.potential)}: ${esc(endTxt(c.which === 'a' ? c.k.from : c.k.to))} <small>${esc(c.p.where ?? '')}</small></span>`).join('')}</div>` : ''
    const listHTML = wm.list.map((k, n) => `<button class="wl ${n === wm.i ? 'cur' : ''} ${wm.isDone(k) ? 'ok' : ''}" data-wmgo="${n}"><span class="sw" style="background:${WC[WIRES[k]?.kind]?.hex ?? '#888'}"></span><b>${esc(segs[k].label || '—')}</b> <span class="muted">${esc(endTxt(segs[k].from))} → ${esc(endTxt(segs[k].to))}</span></button>`).join('')
    const [pa, pb] = wireEnds(w)
    return `${head}
      <div class="wmprog"><div class="prog"><div style="width:${wm.list.length ? nDone / wm.list.length * 100 : 0}%"></div></div><span>${nDone} of ${wm.list.length} done · wire ${wm.i + 1} of ${wm.list.length}</span></div>
      <div class="wcard ${wm.isDone(i) ? 'isdone' : ''}">
        <div class="wmk"><span class="sleeve">${esc(s.label || 'no number')}</span><span class="sw big" style="background:${WC[w.kind]?.hex}"></span><div><b>${esc(w.link ? 'Jumper link' : s.awg ? (/×/.test(s.awg) ? s.awg : s.awg + ' AWG') : (w.kind === 'eth' ? 'Ethernet patch cord' : 'size not printed'))}</b> · ${esc(WC[w.kind]?.name ?? '')}<br><span class="muted">${w.cutText ?? `cut ${lenMm(w)} mm`} · ${sheetTxt(s)}${s.potential ? ` · ${esc(s.potential)}` : ''}</span></div></div>
        ${endBlock('A', s.from, pa, s, w)}
        ${endBlock('B', s.to, pb, s, w)}
        ${coresTxt}
        ${w.ducts?.length ? `<div class="route">Route: ${w.ducts.map((d) => `<span>${d}</span>`).join(' → ')} <button class="lnk" data-trace>▶ trace it</button></div>` : w.direct ? '<div class="route">Route: straight across to the terminal facing it, no duct <button class="lnk" data-trace>▶ trace it</button></div>' : ''}
        ${cutBlock(w)}
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
      </div>
      <details class="wlist" open><summary>All ${wm.list.length} in this selection</summary><div class="wls">${listHTML}</div></details>`
  }
  function deviceSection(d, highlight) {
    const tr = terminalRows(d.tag)
    const lay = LAYOUTS[DEVICE_LAYOUT[d.tag]]
    const nDone = tr.filter((r) => wm.isDone(r.i)).length
    return `<section class="selpart"><h3>${esc(d.tag)}</h3>${LOC.card(d.tag)}${partCard(d.pn, d.tag)}${(d.also ?? []).map((pn) => partCard(pn)).join('')}
      ${d.note ? `<p class="note">${esc(d.note)}</p>` : ''}${d.xNote ? `<p class="note">${esc(d.xNote)}</p>` : ''}
      <p class="muted small">Body: ${d.depth ? `${d.depth} mm deep${d.rail ? ' above the rail' : ''}` : ''} ${d.depthNote ? `(${esc(d.depthNote)})` : ''}${lay ? ` · terminal positions ${esc(lay.conf)}: ${esc(lay.src)}` : ''}</p>
      ${tr.length ? `<h3>Terminations · ${nDone} of ${tr.length} done <button class="lnk" data-wmdev="${esc(d.tag)}">wire them one by one →</button></h3><table class="wt"><thead><tr><th>Term.</th><th>Marker</th><th>Goes to</th><th>✓</th></tr></thead><tbody>${tr.map((r) => `<tr data-wire="${r.i}" class="${highlight === r.i ? 'sel' : ''}" title="${esc(r.where ?? '')}"><td>${esc(r.term)}</td><td><span class="sw" style="background:${WC[r.kind]?.hex ?? '#888'}"></span><b>${esc(r.label || '—')}</b></td><td>${endLink(r.other)}</td><td>${wm.isDone(r.i) ? '✓' : ''}</td></tr>`).join('')}</tbody></table>` : ''}
      ${d.step ? `<button class="lnk" data-step="${stepIndex(d.step)}">Go to its install step →</button>` : ''}</section>`
  }
  const devRec = (tag) => G.DEVICES.find((d) => d.tag === tag && (d.at !== 'fuse' || DEV[tag])) ??(tag === 'GB1' ? { tag: 'GB1', pn: 'D167-14', step: 'power' } : tag === 'RCP1' ? { tag: 'RCP1', pn: '1492-REC15', step: 'rail4', note: 'Sheet 3 (rev20) draws RCP1 between TB4 and CB5 on rail 4, centred at 806 mm. One L/N/G terminal block at the top feeds both outlets: hot, neutral and ground land there, and the two sheet 6 jumpers are not fitted (see Design issues). Check the L/N/G marking on the device.' } : null)
  function partsHTML() {
    const q = (opts.q ?? '').toLowerCase()
    const rows = G.BOM.filter((b) => !q || `${b.pn} ${b.where} ${b.desc} ${b.mfr}`.toLowerCase().includes(q))
    let head = ''
    if (SEL.kind === 'dev' && devRec(SEL.tag)) head = deviceSection(devRec(SEL.tag))
    else if (SEL.kind === 'wire') {
      const s = segs[SEL.i], tags_ = [...new Set([s.from.dev, s.to.dev].map((t) => t === 'GND BAR' ? 'GB1' : t))].filter((t) => devRec(t))
      head = `<p class="muted small">Both ends of ${esc(s.label || 'this wire')}:</p>` + tags_.map((t) => deviceSection(devRec(t), SEL.i)).join('')
    }
    return `${head}<input class="search" placeholder="Search part number, tag or description" value="${esc(opts.q ?? '')}" data-q>
      <div class="plist">${rows.map((b) => `<div class="prow ${b.field ? 'fieldp' : ''}">${partCard(b.pn)}${b.field ? '<div class="muted small">Field or skid item: not installed in this panel.</div>' : ''}</div>`).join('')}</div>`
  }
  function cutList() {
    const g = new Map()
    G.SEGMENTS.forEach((s, i) => {
      const w = WIRES[i]; if (!w) return
      const key = w.cable ? `${s.cableType?.split(' ')[0] || s.kind}` : `${s.awg ?? '?'} AWG ${WC[w.kind]?.name ?? ''}`
      const e = g.get(key) ?? { key, n: 0, mm: 0, markers: 0, cable: !!w.cable }
      e.n++; e.mm += lenMm(w); e.markers += s.label ? 2 : 0; g.set(key, e)
    })
    const rows = [...g.values()].sort((a, b) => Number(a.cable) - Number(b.cable) || a.key.localeCompare(b.key, undefined, { numeric: true }))
    const ferr = G.SEGMENTS.reduce((t, s, i) => { const w = WIRES[i]; if (!w) return t; if (w.cores) return t + w.cores.length; return t + w.ends.filter((p) => endType(p, s.awg, w.kind)?.k === 'ferrule').length }, 0)
    return `<table class="wt cut"><thead><tr><th>Conductor / cable</th><th>Runs</th><th>Total m</th><th>+10 %</th><th>Markers</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(r.key)}</td><td>${r.n}</td><td>${(r.mm / 1000).toFixed(1)}</td><td>${(r.mm * 1.1 / 1000).toFixed(1)}</td><td>${r.markers}</td></tr>`).join('')}</tbody></table>
      <p class="muted small">About ${ferr} ferrules. Each run is its routed length plus, per end, the strip length from that terminal's document and a 50 mm service loop (field ends 300 mm, coiled for the site).</p>`
  }
  function wiresHTML() {
    const q = (opts.q ?? '').toLowerCase(), sf = opts.step ?? ''
    // filtered to the selection: a device's wires, or every wire on the two devices a selected wire joins
    const ctxTags = SEL.kind === 'dev' ? [SEL.tag] : SEL.kind === 'wire' && opts.ctx !== false ? [...new Set([segs[SEL.i].from.dev, segs[SEL.i].to.dev].map((t) => t === 'GND BAR' ? 'GB1' : t))] : null
    const rows = segs.map((s, i) => ({ s, i })).filter(({ s, i }) => (!ctxTags || i === SEL.i || ctxTags.some((t) => segTouches(s, t))) && (!sf || s.step === sf) && (!q || `${s.label} ${endTxt(s.from)} ${endTxt(s.to)} ${s.potential}`.toLowerCase().includes(q)))
    const stepsOpt = G.STEPS.filter((s) => s.wires).map((s) => `<option value="${s.id}" ${sf === s.id ? 'selected' : ''}>${esc(s.title)}</option>`).join('')
    return `${ctxTags ? `<div class="ctxbar">Showing ${rows.length} wires on ${ctxTags.map((t) => esc(t)).join(' and ')} <button class="lnk" data-allwires>show all</button></div>` : ''}
      <div class="wtools"><select data-wstep><option value="">All wiring steps</option>${stepsOpt}</select><input class="search" placeholder="W29, CB1, TB4-12…" value="${esc(opts.q ?? '')}" data-q></div>
      <div class="wtools"><button class="btn" data-csv>Marker list (CSV)</button><button class="btn ghost" data-print>Print run sheet</button><button class="btn ghost" data-wm="${sf}">Wire one by one</button></div>
      ${SEL.kind === 'wire' ? wireDetail(SEL.i) : ''}
      <details class="cutl"><summary>Cut list</summary>${cutList()}</details>
      <table class="wt"><thead><tr><th>Marker</th><th>AWG</th><th>From</th><th>To</th><th>✓</th></tr></thead><tbody>
      ${rows.map(({ s, i }) => { const w = WIRES[i]; return `<tr data-wire="${i}" class="${i === SEL.i ? 'sel' : ''} ${w ? '' : 'nodraw'}"><td><span class="sw" style="background:${WC[w?.kind ?? kindOf(s)]?.hex}"></span><b>${esc(s.label || '—')}</b></td><td>${esc(s.awg ?? '')}</td><td>${esc(endTxt(s.from))}</td><td>${esc(endTxt(s.to))}${s.notFitted ? '<br><small class="muted" title="' + esc(s.note) + '">' + esc(s.nfWhy ?? 'not fitted') + '</small>' : ''}${s.added ? '<br><small class="muted" title="' + esc(s.note) + '">not on the drawings</small>' : ''}</td><td>${wm.isDone(i) ? '✓' : ''}</td></tr>` }).join('')}
      </tbody></table>`
  }
  function wireDetail(i) {
    const s = segs[i], w = WIRES[i]; if (!s || !w) return ''
    const [pa, pb] = wireEnds(w)
    return `<div class="wdet"><h3>${esc(s.label || (s.added ? '(not on the drawings: no number yet)' : '(no number on the drawing)'))}<button class="lnk" data-trace>▶ trace</button></h3>
      ${endBlock('A', s.from, pa, s, w)}${endBlock('B', s.to, pb, s, w)}
      <p class="muted">${s.awg ? `${esc(s.awg)} AWG · ` : ''}${WC[w.kind]?.name ?? ''} · ${sheetTxt(s)}${w.ducts?.length ? ` · ${w.ducts.join(' → ')}` : ''}</p>${cutBlock(w)}
      ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}</div>`
  }
  function issuesHTML() {
    const fl = G.STEPS.flatMap((s, i) => (s.flags ?? []).map((f) => ({ f, i })))
    const shared = DUCT_SHARED.length ? [`Power and control share ducts. 520-UM001 p.37 asks for control and signal wires at least 0.3 m (1 ft) from power wires. With the ducts drawn on sheet 3, and routing that keeps AC and DC apart wherever it can (site wiring left out), these ducts still carry both: ${DUCT_SHARED.map((d) => `${d.duct}: ${d.ac.length} AC (${d.ac.slice(0, 4).join(', ')}${d.ac.length > 4 ? ' …' : ''}) with ${d.dc.length} DC/signal`).join('; ')}. Add a duct or divider, or accept and note it.`] : []
    const nRes = G.MODELING_ISSUES.filter((m) => m.status === 'resolved').length
    return `<section><h3>Design issues <span class="cnt">${G.DESIGN_ISSUES.length + shared.length}</span></h3><p class="muted small">For the engineer who drew the panel: drawing and BOM problems found while building this guide. Those found in V4, V5 and V6 are marked.</p>
      ${[...G.DESIGN_ISSUES, ...shared].map((f) => `<div class="iss"><p>${/^NEW \(V\d+\) /.test(f) ? `<span class="pill new">${/^NEW \((V\d+)\) /.exec(f)[1]}</span> ${esc(f.replace(/^NEW \(V\d+\) /, ''))}` : /^NEW /.test(f) ? `<span class="pill new">V4</span> ${esc(f.slice(4))}` : esc(f)}</p></div>`).join('')}
      ${fl.length ? `<p class="muted small">Raised at a step:</p>${fl.map(({ f, i }) => `<div class="iss"><p>${esc(f)}</p><button class="lnk" data-step="${i}">Step ${i + 1} →</button></div>`).join('')}` : ''}</section>
      <section><h3>Modeling issues <span class="cnt">${nRes} of ${G.MODELING_ISSUES.length} resolved</span></h3><p class="muted small">How this guide models what the drawings leave open, and what was done about it.</p>
      ${G.MODELING_ISSUES.map((m) => `<div class="iss"><p><span class="pill ${m.status}">${m.status}</span>${/^NEW /.test(m.text) ? '<span class="pill new">V4</span>' : /^V5 /.test(m.text) ? '<span class="pill new">V5</span>' : /^V\d+ /.test(m.text) ? `<span class="pill new">${/^(V\d+) /.exec(m.text)[1]}</span>` : ''} ${esc(m.text.replace(/^(NEW|V\d+) /, ''))}</p><p class="muted small">${esc(m.how)}</p></div>`).join('')}</section>`
  }
  function render() {
    // V9: the five views as large buttons in the top bar, and how far along the job is beside them
    document.querySelector('#g-top .modes').innerHTML = [['steps', 'Build', 'build', 'Step by step: what to fit and what to check'], ['locate', 'Locate', 'locate', 'Where every item goes, measured from the top and left edges of the plate'], ['wire', 'Wire', 'wire', 'One wire at a time: marker, both ends, route, cut length'], ['parts', 'Parts', 'parts', 'Every part: number, documents, terminals'], ['wires', 'Wire list', 'list', 'Every wire: marker list, run sheet, cut list'], ['issues', 'Issues', 'issues', 'Questions for engineering']].map(([k, t, ic, tip]) => `<button data-tab="${k}" class="${k === tabName ? 'on' : ''}" title="${tip}">${ICON[ic]}<span>${t}</span></button>`).join('')
    {
      const dn = store.get('done') ?? {}, tAll = G.STEPS.reduce((t, s) => t + s.tasks.length, 0), tDone = G.STEPS.reduce((t, s) => t + s.tasks.filter((_, k) => dn[`${s.id}:${k}`]).length, 0)
      const wAll = WIRES.filter(Boolean).length, wDone = WIRES.reduce((t, w, i) => t + (w && wm.isDone(i) ? 1 : 0), 0)
      document.querySelector('#g-top .tprog').innerHTML = `<div title="Build tasks ticked"><span>Tasks <b>${tDone}</b>/${tAll}</span><i><u style="width:${tAll ? tDone / tAll * 100 : 0}%"></u></i></div><div title="Wires marked done"><span>Wires <b>${wDone}</b>/${wAll}</span><i><u style="width:${wAll ? wDone / wAll * 100 : 0}%"></u></i></div>`
    }
    Pnl.querySelector('.chipbar').innerHTML = chipHTML()
    const body = Pnl.querySelector('.body')
    const sc = body.scrollTop
    const done = VIEW.complete ? `<div class="flags" style="background:#eef6ee;border-color:#bfdcc3;margin-bottom:14px"><h3 style="color:var(--ok)">Completed panel</h3><p>Every part and all ${WIRES.filter(Boolean).length} wires in place. The doors and centre post are off, the duct covers are off, the drive covers are on as see-through glass and the 1769 doors are open, so every landing shows. Click any wire or part to trace it. Press <b>C</b> or any step to go back.</p><p class="muted small">Parts drawn from the maker's own 3D (STEP) model: ${Object.keys(G.MODELS ?? {}).length} models. The rest are built from their catalogue drawings (see Issues, modelling).</p></div>` : ''
    body.innerHTML = done + (tabName === 'steps' ? stepsHTML() : tabName === 'wire' ? wireModeHTML() : tabName === 'parts' ? partsHTML() : tabName === 'wires' ? wiresHTML() : tabName === 'locate' ? LOC.tabHTML() : issuesHTML())
    if (tabName === opts._lastTab && !opts.scrollSel) body.scrollTop = sc; else body.scrollTop = 0
    opts._lastTab = tabName
    const nav = Pnl.querySelector('.nav')
    // V9: one bar of large buttons at the bottom, always in the same place: steps in Build, wires in Wire
    if (tabName === 'wire') {
      const i = wm.list[wm.i], has = i !== undefined
      nav.innerHTML = `<button data-wmprev ${!has || wm.i === 0 ? 'disabled' : ''}>← Back</button><button class="pri ${has && wm.isDone(i) ? 'undo' : 'ok'}" data-wmdone ${has ? '' : 'disabled'}>${has && wm.isDone(i) ? 'Undo done' : '✓ Done, next wire'}</button><button data-wmnext ${!has || wm.i >= wm.list.length - 1 ? 'disabled' : ''}>Skip →</button>`
    } else {
      const st = G.STEPS[cur], dn = store.get('done') ?? {}, all = st.tasks.length > 0 && st.tasks.every((_, k) => dn[`${st.id}:${k}`])
      nav.innerHTML = `<button data-prev ${cur === 0 ? 'disabled' : ''}>← Back</button><div class="stepno">Step <b>${cur + 1}</b> of ${G.STEPS.length}<i><u style="width:${((cur + 1) / G.STEPS.length) * 100}%"></u></i></div><button data-next class="pri ${all ? 'ok' : ''}" ${cur === G.STEPS.length - 1 ? 'disabled' : ''}>${all ? '✓ Next step →' : 'Next step →'}</button>`
    }
    if (opts.focusQ) { const i = body.querySelector('[data-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length) } opts.focusQ = false }
    if (tabName === 'wire') { const lst = body.querySelector('.wlist .wls'), it = lst?.querySelector('.wl.cur'); if (lst && it) lst.scrollTop = it.offsetTop - lst.offsetTop - 60 }
    else if (opts.scrollSel) { const sel = body.querySelector('tr.sel, .selpart'); if (sel) sel.scrollIntoView({ block: tabName === 'parts' ? 'start' : 'center' }); opts.scrollSel = false }
  }
  // switching tabs carries the selection: each tab shows the selected wire or device its own way
  const setTab = (k, o = {}) => {
    if (tabName === 'wire' && k !== 'wire') wm.exit()
    tabName = k; opts = { ...o, _lastTab: opts._lastTab, scrollSel: true }
    if (k === 'wire') {
      if (o.filter !== undefined || o.dev) wm.enter({ filter: o.filter, dev: o.dev })
      else if (SEL.kind === 'wire') wm.enter({ wire: SEL.i })
      else if (SEL.kind === 'dev') wm.enter({ dev: SEL.tag })
      else wm.enter({ filter: G.STEPS[cur].wires ? G.STEPS[cur].id : wm.filter })
      return
    }
    if (k === 'locate') LOC.setStep(SEL.kind === 'dev' && LOC.byTag(SEL.tag) ? LOC.byTag(SEL.tag).step : LOC.itemsOf(G.STEPS[cur].id).length ? G.STEPS[cur].id : null)
    if (k === 'steps' && SEL.kind) { const st = SEL.kind === 'wire' ? stepIndex(segs[SEL.i].step) : stepIndex(devRec(SEL.tag)?.step); if (st >= 0 && st !== cur) { showStep(st, { keepSel: true }); return } }
    render()
  }
  function onSelect() {
    // a pick in the 3D view keeps the tab and refreshes it for the new selection
    if (tabName === 'wire') { if (SEL.kind === 'wire') { const k = wm.list.indexOf(SEL.i); if (k >= 0) { wm.i = k; render() } else wm.enter({ wire: SEL.i }) } else if (SEL.kind === 'dev') wm.enter({ dev: SEL.tag }); else render(); return }
    if (tabName === 'issues' && SEL.kind) tabName = SEL.kind === 'wire' ? 'wires' : 'parts'
    if (tabName === 'locate' && SEL.kind === 'dev' && LOC.byTag(SEL.tag)) LOC.setStep(LOC.byTag(SEL.tag).step)
    opts.scrollSel = true; render()
  }
  Pnl.addEventListener('click', (e) => {
    const t = e.target.closest('button, tr[data-wire], [data-dev], svg[data-locbig]'); if (!t) return
    if (t.dataset.tab) setTab(t.dataset.tab)
    else if (t.dataset.go) setTab(t.dataset.go)
    else if (t.hasAttribute('data-clear')) select(null, { fly: false })
    else if (t.hasAttribute('data-trace')) traceRoute()
    else if (t.dataset.dev) { select({ kind: 'dev', tag: t.dataset.dev }) }
    else if (t.dataset.step !== undefined) { setTab('steps'); showStep(Number(t.dataset.step)) }
    else if (t.hasAttribute('data-prev')) { setTab('steps'); showStep(cur - 1) }
    else if (t.hasAttribute('data-next')) { setTab('steps'); showStep(cur + 1) }
    else if (t.dataset.wm !== undefined) setTab('wire', { filter: t.dataset.wm })
    else if (t.dataset.wmdev) setTab('wire', { dev: t.dataset.wmdev })
    else if (t.hasAttribute('data-wmnext')) wm.next()
    else if (t.hasAttribute('data-wmprev')) wm.prev()
    else if (t.hasAttribute('data-wmdone')) { const i = wm.list[wm.i]; const was = wm.isDone(i); wm.done(i, !was); if (!was && wm.i < wm.list.length - 1) wm.next(); else render() }
    else if (t.dataset.wmgo !== undefined) { wm.i = Number(t.dataset.wmgo); wm.show() }
    else if (t.hasAttribute('data-wmexit')) setTab('steps')
    else if (t.hasAttribute('data-allwires')) { opts.ctx = false; select(null, { fly: false }) }
    else if (t.dataset.wire !== undefined) { const i = Number(t.dataset.wire); select({ kind: 'wire', i }, { from: 'ui' }); opts.scrollSel = false; render() }
    else if (t.hasAttribute('data-csv')) csv()
    else if (t.hasAttribute('data-print')) printSheet()
    else if (t.hasAttribute('data-locbig')) LOC.bigOpen(t.dataset.locbig || null)
    else if (t.hasAttribute('data-locprint')) LOC.print()
    else if (t.hasAttribute('data-loccsv')) LOC.csv()
  })
  Pnl.addEventListener('change', (e) => {
    const t = e.target
    if (t.dataset.task) { const d = store.get('done') ?? {}; d[t.dataset.task] = t.checked; store.set('done', d); render() }
    if (t.hasAttribute('data-wstep')) { opts.step = t.value; render() }
    if (t.hasAttribute('data-locstep')) { LOC.setStep(t.value); if (SEL.kind) select(null, { fly: false, from: 'ui' }); render() }
    if (t.hasAttribute('data-wmstep')) { wm.i = 0; if (t.value.startsWith('dev:')) wm.enter({ dev: t.value.slice(4) }); else wm.enter({ filter: t.value, dev: null }) }
  })
  Pnl.addEventListener('input', (e) => { if (e.target.hasAttribute('data-q')) { opts.q = e.target.value; opts.focusQ = true; render() } })
  function csv() {
    const rows = [['marker', 'awg', 'colour (NFPA 79)', 'from', 'from terminal position', 'to', 'to terminal position', 'end A', 'end B', 'route', 'potential', 'sheet', 'line', 'step', 'cut length mm', 'note']]
    segs.forEach((s, i) => { const w = WIRES[i]; const [pa, pb] = w ? wireEnds(w) : []; rows.push([s.label, s.awg ?? '', w ? WC[w.kind]?.name ?? '' : '', endTxt(s.from), pa?.where ?? '', endTxt(s.to), pb?.where ?? '', w ? endType(pa, s.awg, w.kind)?.text ?? '' : '', w ? endType(pb, s.awg, w.kind)?.text ?? '' : '', w?.ducts?.join(' > ') ?? '', s.potential ?? '', s.added ? 'not on the drawings' : s.sheet ?? '', s.line ?? '', s.step, lenMm(w) ?? '', s.note ?? '']) })
    const text = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = 'VFD200 wire markers.csv'; a.click()
  }
  function printSheet() {
    const box = document.getElementById('g-print')
    const by = G.STEPS.filter((s) => s.wires)
    box.innerHTML = `<h1>VFD 200 wiring run sheet</h1><p>${esc(G.JOB.number)} · ${esc(G.JOB.project)} · from ${esc(G.JOB.drawing)} rev ${esc(G.JOB.rev)} · assembly guide V${esc(G.VERSION)}. Colours per NFPA 79 13.2.4 (not specified on the drawings).</p>` +
      by.map((st) => `<h2>${esc(st.title)}</h2><table><thead><tr><th>✓</th><th>Marker</th><th>AWG</th><th>From</th><th>To</th><th>Ends</th><th>Route</th><th>Cut mm</th></tr></thead><tbody>${segs.map((s, i) => ({ s, i, w: WIRES[i] })).filter((x) => x.w && x.s.step === st.id).map(({ s, i, w }) => { const [pa, pb] = wireEnds(w); return `<tr><td>${wm.isDone(i) ? '☑' : '☐'}</td><td><b>${esc(s.label || '—')}</b>${s.added ? '<br><small>not on the drawings</small>' : ''}</td><td>${esc(s.awg ?? '')}</td><td>${esc(endTxt(s.from))}<br><small>${esc(pa?.where ?? '')}</small></td><td>${esc(endTxt(s.to))}<br><small>${esc(pb?.where ?? '')}</small></td><td><small>${esc(endType(pa, s.awg, w.kind)?.k ?? '')} / ${esc(endType(pb, s.awg, w.kind)?.k ?? '')}</small></td><td><small>${esc(w.ducts?.join(' › ') ?? '')}</small></td><td>${lenMm(w)}</td></tr>` }).join('')}</tbody></table>`).join('')
    window.print()
  }
  return { render, tab: setTab, onSelect, get name() { return tabName } }
})()

// view toolbar and search
function toggleFront(on) { VIEW.noFront = on ?? !VIEW.noFront; applyFront() }
// Completed panel: everything built and wired, doors and front off, duct covers off, so the finished panel can be compared
// with the one on the bench. Any step button or arrow key leaves it.
// V8: the view is fitted to the window, so the whole of subplate 1 shows whatever the window's shape (V7's fixed distance
// cut the top and bottom rails off on a wide window and the sides on a narrow one)
function completeView() {
  const t = Math.tan(THREE.MathUtils.degToRad(15)), small = innerWidth <= 820
  const freeW = innerWidth * (1 + 2 * FX()) - (small ? 0 : 150), freeH = small ? innerHeight * 0.48 - 60 : innerHeight - 130
  const dV = ((SH + 0.09) / 2) / t * (innerHeight / freeH), dH = ((SW + 0.09) / 2) / (t * freeW / innerHeight)
  return { az: 0, el: 4, dist: Math.max(dV, dH) * lab.k / 2.4, target: [0, Y0 + 0.051 + SH / 2 + (small ? -SH * 0.27 : 0), 0.08], fov: 30 }
}
function showComplete(on) {
  on = on ?? !VIEW.complete
  if (on === VIEW.complete) return
  VIEW.complete = on
  if (on) {
    VIEW.frontBefore = VIEW.noFront
    if (SEL.kind) select(null, { fly: false, from: 'ui' })
    applyVisibility({ show: ['enc', 'stand', 'all-sub1', 'sub2', 'wires', 'ac', 'handle', 'door'] }, G.STEPS.length)
    coverG.visible = false
    setCovers(true)                                       // drive covers and 1769 doors off, so every landing shows
    for (const l of ductLabels) l.visible = true
    for (const w of WIRES) if (w) w.obj.visible = true
    doorTarget = 0; VIEW.noFront = true; applyFront()
    hiG.clear()
    flyTo(completeView())
  } else { VIEW.noFront = VIEW.frontBefore ?? false; showStep(cur) }
  document.querySelector('[data-complete]')?.classList.toggle('on', VIEW.complete)
  ui.render()
}
// V9: the screen is laid out for the person building the panel: a top bar (what you are doing, how far along, find),
// a tool rail of large buttons on the 3D view, and "look from" buttons under it. The V8 toolbar markup is kept unused.
const IC = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const ICON = {
  done: IC('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 12l3 3 5-6"/>'), doors: IC('<path d="M4 21V3h9v18M13 6l7-1v14l-7-1M10 12h.01"/>'), reset: IC('<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4"/>'),
  plus: IC('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5M11 8v6M8 11h6"/>'), minus: IC('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5M8 11h6"/>'),
  colours: IC('<path d="M4 7c4-3 6 3 10 0s4-2 6-1M4 13c4-3 6 3 10 0s4-2 6-1M4 19c4-3 6 3 10 0s4-2 6-1"/>'), panel: IC('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>'),
  build: IC('<path d="M14 6l4 4M3 21l3-1 11-11-2-2L4 18zM16 4l2-2 4 4-2 2"/>'), wire: IC('<path d="M4 18c0-8 16-4 16-12M4 18v3M20 6V3"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="6" r="1.5"/>'),
  locate: IC('<circle cx="12" cy="12" r="6"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>'),
  parts: IC('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  list: IC('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'), issues: IC('<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>'), help: IC('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>'),
}
const railBtn = (attr, icon, label, key, title) => `<button ${attr} title="${title}${key ? ` (${key})` : ''}">${ICON[icon]}<span>${label}</span></button>`
document.getElementById('g-view').innerHTML = railBtn('data-complete', 'done', 'Finished', 'C', 'The finished panel: every part and wire in place, doors off, duct covers off') + railBtn('data-front', 'doors', 'Doors off', 'F', 'Take the doors and the front frame off for a clear view inside') + railBtn('data-reset', 'reset', 'Reset', 'R', 'Back to this step\'s view') + '<i></i>' + railBtn('data-zoom="0.62"', 'plus', 'Closer', '+', 'Zoom in') + railBtn('data-zoom="1.6"', 'minus', 'Further', '-', 'Zoom out') + '<i></i>' + railBtn('data-loc', 'locate', 'Dimensions', 'L', 'Show or hide the dimensions from the top and left edges of the plate while parts are being placed') + railBtn('data-legend', 'colours', 'Colours', 'K', 'What each wire colour means; pick one to show only those wires') + railBtn('data-panel', 'panel', 'Wide view', 'P', 'Hide or show the instructions for a full-width view')
document.getElementById('g-sl').innerHTML = [...new Set([...G.SEGMENTS.map((s) => s.label).filter(Boolean), ...Object.keys(DEV), 'GB1'])].map((x) => `<option value="${esc(x)}">`).join('')
const zoomBy = (f) => { syncView(); flyTo({ dist: clamp(lab.view.dist * f, 0.03, 2.2) }) }
document.getElementById('g-view').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.zoom) zoomBy(Number(b.dataset.zoom)); if (b.hasAttribute('data-legend')) toggleLegend(); if (b.hasAttribute('data-panel')) togglePanel(); if (b.hasAttribute('data-loc')) LOC.toggle() })
document.getElementById('g-top').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-help')) showHelp(); if (b.hasAttribute('data-text')) { document.body.classList.toggle('big'); store.set('big', document.body.classList.contains('big')); b.classList.toggle('on', document.body.classList.contains('big')) } if (b.dataset.tab) ui.tab(b.dataset.tab) })
if (store.get('big')) { document.body.classList.add('big'); document.querySelector('[data-text]')?.classList.add('on') }
const OLD_VIEW_HTML = `<button data-complete title="The finished panel: every part and wire in place, doors and front off, duct covers off (C)">Completed panel <kbd>C</kbd></button><button data-front title="Take the doors and the whole front frame off for a clear view inside (F)">Remove front <kbd>F</kbd></button><button data-reset title="Back to this step's view (R)">Reset view <kbd>R</kbd></button><input id="g-search" placeholder="Find W29, CB4, TB4…" list="g-sl"><datalist id="g-sl">${[...new Set([...G.SEGMENTS.map((s) => s.label).filter(Boolean), ...Object.keys(DEV), 'GB1'])].map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`
const resetView = () => flyTo(VIEW.complete ? completeView() : G.STEPS[cur].view)
document.getElementById('g-view').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-front')) toggleFront(); if (b.hasAttribute('data-complete')) showComplete(); if (b.hasAttribute('data-reset')) resetView() })
// ------------------------------------------------------------------ V8: second toolbar row (look from, wire colours, help), the wire colour key, the help card, hiding the side panel
const LOOK = { front: { az: 0, el: 4 }, left: { az: -40, el: 8 }, right: { az: 40, el: 8 }, above: { az: 0, el: 42 }, below: { az: 0, el: -42 } }
const KIND_NAME = { power: 'AC power, 480 V', hot120: 'AC control, 120 V hot', neutral: 'AC neutral', dc: 'DC control, +24 V', dc0: 'DC common, 0 V', gnd: 'Ground (PE)', iol: 'IO-Link cable', eth: 'Ethernet patch cord', field: 'Field cable' }
void OLD_VIEW_HTML
document.getElementById('g-view2').innerHTML = `<span class="lbl">Look from</span>${Object.keys(LOOK).map((k) => `<button data-look="${k}" title="Turn the panel to see it from ${k === 'front' ? 'the front' : k === 'above' || k === 'below' ? k : `the ${k}`}; the zoom stays as it is">${k[0].toUpperCase()}${k.slice(1)}</button>`).join('')}`
const OLD_VIEW2_HTML = `<span class="lbl">Look from</span>${Object.keys(LOOK).map((k) => `<button data-look="${k}" title="Turn the panel to see it from ${k === 'front' ? 'the front' : k === 'above' || k === 'below' ? k : `the ${k}`}; the zoom stays as it is">${k[0].toUpperCase()}${k.slice(1)}</button>`).join('')}<span class="sep"></span><button data-legend title="What each wire colour means; click a colour to show only those wires (K)">Wire colours <kbd>K</kbd></button><button data-help title="How to move around and what the keys do (H)">Help <kbd>H</kbd></button>`
document.getElementById('g-view2').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.look) flyTo(LOOK[b.dataset.look]); if (b.hasAttribute('data-legend')) toggleLegend(); if (b.hasAttribute('data-help')) showHelp() })
function setOnlyKind(k) { VIEW.onlyKind = VIEW.onlyKind === k ? null : k; applyWireLook(); renderLegend() }
function renderLegend() {
  const el = document.getElementById('g-legend'), n = {}
  for (const w of WIRES) if (w) n[w.kind] = (n[w.kind] ?? 0) + 1
  el.innerHTML = `<h4>Wire colours <button data-x title="Close">×</button></h4>${Object.keys(KIND_NAME).filter((k) => n[k]).map((k) => `<button class="lk${VIEW.onlyKind === k ? ' on' : ''}" data-kind="${k}" title="Show only these; click again for all"><i style="background:${WC[k].hex}"></i><span>${KIND_NAME[k]}<small>${esc(WC[k].name)}</small></span><b>${n[k]}</b></button>`).join('')}<p>${VIEW.onlyKind ? 'Showing one colour. Click it again for all.' : GROUPS.wires.visible ? 'Click a colour to show only those wires.' : 'No wires at this step yet: open Completed panel or a wiring step.'}</p>`
  document.querySelector('[data-legend]')?.classList.toggle('on', el.classList.contains('open'))
}
function toggleLegend(on) { const el = document.getElementById('g-legend'); el.classList.toggle('open', on ?? !el.classList.contains('open')); if (!el.classList.contains('open') && VIEW.onlyKind) { VIEW.onlyKind = null; applyWireLook() } renderLegend() }
document.getElementById('g-legend').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-x')) toggleLegend(false); else if (b.dataset.kind) setOnlyKind(b.dataset.kind) })
function showHelp(on) {
  const el = document.getElementById('g-helpcard'); on = on ?? !el.classList.contains('open')
  if (on) el.innerHTML = `<div class="hc"><button class="x" data-x title="Close (Esc)">×</button><h2>Finding your way round</h2>
<div class="cols"><div><h4>Move</h4><dl><dt>Drag</dt><dd>turn the panel, all the way round and underneath</dd><dt>Scroll or pinch</dt><dd>zoom, right in to a terminal</dd><dt>Right-drag</dt><dd>slide the view sideways</dd><dt>Look from</dt><dd>front, left, right, above or below at the same zoom</dd></dl>
<h4>Find and trace</h4><dl><dt>Click a wire</dt><dd>the rest turn to glass; both ends are ringed and named</dd><dt>Click a part</dt><dd>its wires stay solid and every terminal is tagged</dd><dt>Find box</dt><dd>type a wire or part tag: W29, CB4, TB4</dd><dt>Wire colours</dt><dd>the key; click a colour to show only those wires</dd></dl></div>
<div><h4>Keys</h4><dl class="keys"><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>previous or next step (or wire, when wiring one by one)</dd><dt><kbd>C</kbd></dt><dd>Completed panel, on and off</dd><dt><kbd>F</kbd></dt><dd>take the doors and front off</dd><dt><kbd>R</kbd></dt><dd>back to this step's view</dd><dt><kbd>T</kbd></dt><dd>fly along the selected wire</dd><dt><kbd>K</kbd></dt><dd>wire colour key</dd><dt><kbd>P</kbd></dt><dd>hide or show the side panel</dd><dt><kbd>Enter</kbd></dt><dd>done, next wire (when wiring one by one)</dd><dt><kbd>Esc</kbd></dt><dd>clear the selection, close this card</dd><dt><kbd>H</kbd></dt><dd>this card</dd></dl></div></div>
<p>Ticks, wiring progress and the step you were on are remembered on this computer. Build, Wire, Parts, Wire list and Issues are along the top; the big buttons at the bottom of the instructions always move you on. <kbd>+</kbd> <kbd>-</kbd> zoom; <b>AA</b> makes the text larger.</p><button class="go" data-x>Got it</button></div>`
  el.classList.toggle('open', on)
}
document.getElementById('g-helpcard').addEventListener('click', (e) => { if (e.target.id === 'g-helpcard' || e.target.closest('[data-x]')) showHelp(false) })
function togglePanel(on) {
  syncView()
  document.body.classList.toggle('nopanel', on === undefined ? undefined : !on)
  const hid = document.body.classList.contains('nopanel'), b = document.getElementById('g-collapse')
  b.textContent = hid ? '‹' : '›'; b.title = hid ? 'Show the side panel (P)' : 'Hide the side panel for a wider view (P)'
  lab.view = { ...lab.view, frameX: FX() }; lab._applyView(lab.view)
}
document.getElementById('g-collapse').addEventListener('click', () => togglePanel())
addEventListener('resize', () => { lab.view = { ...lab.view, frameX: FX() }; lab._applyView(lab.view) })
// the colour key says so when the step shown has no wires
let legendWires = null
lab.onTick(() => { if (GROUPS.wires.visible !== legendWires) { legendWires = GROUPS.wires.visible; renderLegend() } })
function find(q) {
  q = q.trim(); if (!q) return
  // a segment id (s195) finds a wire that has no number
  const byId = /^s\d+$/i.test(q) ? G.SEGMENTS.findIndex((s, k) => WIRES[k] && s.id === q.toLowerCase()) : -1
  if (byId >= 0) { select({ kind: 'wire', i: byId }); return }
  const i = G.SEGMENTS.findIndex((s, k) => WIRES[k] && s.label.toLowerCase() === q.toLowerCase())
  if (i >= 0) { select({ kind: 'wire', i }); return }
  const tag = Object.keys(DEV).find((t) => t.toLowerCase() === q.toLowerCase()) ?? (q.toUpperCase() === 'GB1' ? 'GB1' : null)
  if (tag) { select({ kind: 'dev', tag }); return }
  ui.tab('wires', { q })
}
document.getElementById('g-search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { find(e.target.value); e.target.blur() } e.stopPropagation() })
document.getElementById('g-search').addEventListener('change', (e) => find(e.target.value))
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'Escape') { if (document.getElementById('g-helpcard').classList.contains('open')) showHelp(false); else select(null, { fly: false }); return }
  if (e.key === 'h' || e.key === 'H' || e.key === '?') { showHelp(); return }
  if (e.key === 'k' || e.key === 'K') { toggleLegend(); return }
  if (e.key === 'l' || e.key === 'L') { LOC.toggle(); return }
  if (e.key === '+' || e.key === '=') { zoomBy(0.62); return }
  if (e.key === '-' || e.key === '_') { zoomBy(1.6); return }
  if (e.key === 'p' || e.key === 'P') { togglePanel(); return }
  if (e.key === 'f' || e.key === 'F') { toggleFront(); return }
  if (e.key === 'c' || e.key === 'C') { showComplete(); return }
  if (e.key === 'r' || e.key === 'R') { resetView(); return }
  if (e.key === 't' || e.key === 'T') { traceRoute(); return }
  if (wm.on) { if (e.key === 'ArrowRight') { wm.next(); e.preventDefault() } if (e.key === 'ArrowLeft') { wm.prev(); e.preventDefault() } if (e.key === 'Enter') { document.querySelector('[data-wmdone]')?.click(); e.preventDefault() } return }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { showStep(cur + 1); e.preventDefault() }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { showStep(cur - 1); e.preventDefault() }
})
void OLD_VIEW2_HTML
document.querySelector('#g-top .brand').innerHTML = `<b>${esc(G.JOB.panel)}</b><span>${esc(G.JOB.number)} · guide V${esc(G.VERSION)}</span>`
const OLD_HEAD_HTML = `<div class="job">${esc(G.JOB.number)} · ${esc(G.JOB.project)}</div><h1>${esc(G.JOB.panel)} <i>assembly guide</i> <span class="ver">V${esc(G.VERSION)}</span></h1><div class="src">From ${esc(G.JOB.drawing)}, rev ${esc(G.JOB.rev)}, ${G.JOB.sheets} sheets</div>`

// ------------------------------------------------------------------ go
// Headless audit (scripts/audit_headless.mjs opens the guide with ?audit=1): nothing is drawn; tools/audit.js runs on the
// finished model and its result is left in the page for the script to read.
const AUDIT = new URLSearchParams(location.search).get('audit')
if (!AUDIT) lab.start()
lab._assembly = 0
const qs = new URLSearchParams(location.search)
void OLD_HEAD_HTML
// V9: the guide opens at the step it was left at on this computer (?step=N still wins)
const s0 = Number(qs.get('step') ?? (store.get('step') ?? 0) + 1) - 1
showStep(clamp(isNaN(s0) ? 0 : s0, 0, G.STEPS.length - 1), { fly: false })
lab.setView(G.STEPS[cur].view); lab.view.frameX = FX(); lab._applyView(lab.view)
if (!AUDIT && !qs.has('shot') && !store.get('helpSeen')) { showHelp(true); store.set('helpSeen', 1) }
// For scripts/shot.mjs and for links into the guide: ?complete=1 opens the finished panel, ?find=W29 selects a wire or
// part, ?view=az,el,dist,x,y,z sets the camera (machine metres), ?shot=1 keeps the help card closed.
if (qs.get('complete')) showComplete(true)
if (qs.get('find')) find(qs.get('find'))
// ?tab=wire|parts|wires|issues opens that view (with ?find, it shows the selected wire's card or the part's page)
if (['wire', 'parts', 'wires', 'issues', 'locate'].includes(qs.get('tab'))) ui.tab(qs.get('tab'))
if (qs.get('locbig')) LOC.bigOpen(G.STEPS[cur].id)            // ?locbig=1: the full-screen mark-out drawing of the current step (for pictures)
if (qs.get('view')) { const v = qs.get('view').split(',').map(Number); if (v.length === 6 && v.every((x) => !isNaN(x))) setTimeout(() => flyTo({ az: v[0], el: v[1], dist: v[2], target: [v[3], v[4], v[5]] }), 50) }
window.guide = { LOC, lab, showStep, WIRES, DEV, select, ui, wm, DUCT_SHARED, term, focusTag, toggleFront, traceRoute, SEL, showComplete, flyTo, soupOf, PZ, DUCT, G, THREE, SX, SY }
if (AUDIT) {
  const leave = (o) => { const pre = document.createElement('pre'); pre.id = 'g-audit'; pre.textContent = JSON.stringify(o); document.body.appendChild(pre); document.title = 'AUDIT DONE' }
  import(new URL('tools/audit.js', location.href).href).then((A) => {
    const r = A.run()
    const mm = (v) => Math.round(v * 10000) / 10
    // every segment's route (21 points, mm), so two versions can be compared wire by wire (scripts/diff_routes.mjs)
    const routes = G.SEGMENTS.map((s, i) => { const w = WIRES[i]; return { id: s.id, label: s.label || '', from: `${s.from.dev} ${s.from.term ?? ''}`.trim(), to: `${s.to.dev} ${s.to.term ?? ''}`.trim(), step: s.step, drawn: !!w, notFitted: !!s.notFitted, kind: w?.kind ?? null, len: w ? mm(w.len) : null, ducts: w?.ducts ?? [], pts: w?.curve ? w.curve.getSpacedPoints(20).map((p) => [mm(p.x), mm(p.y), mm(p.z)]) : [] } })
    // where every device is (machine metres): centre, front, and box, for scripts/shot.mjs --view
    const devices = Object.fromEntries(Object.entries(DEV).filter(([, d]) => d.x0 !== undefined).map(([t, d]) => [t, { xc: +d.xc.toFixed(4), yc: +d.yc.toFixed(4), z1: +d.z1.toFixed(4), box: [d.x0, d.x1, d.yB, d.yT, d.z0, d.z1].map((v) => +v.toFixed(4)), pn: d.d?.pn ?? null }]))
    leave({ version: G.VERSION, segments: G.SEGMENTS.length, drawn: WIRES.filter(Boolean).length, notDrawn: G.SEGMENTS.filter((s, i) => !WIRES[i] && !s.notFitted).map((s) => s.label || s.id), unresolved: [...UNRESOLVED], deviceCount: Object.keys(DEV).length, summary: r.summary, through: r.through, over: r.over, shared: r.shared, kinks: r.kinks, behind: r.behind.slice(0, 20), overlap: r.overlap, notFound: r.notFound, loose: r.loose, devices, routes })
  }).catch((e) => leave({ error: String(e?.stack ?? e) }))
}
