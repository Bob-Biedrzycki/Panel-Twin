// VFD 200 assembly guide, V2: the panel built step by step, every conductor landed on its real terminal and labelled,
// and tools for the person wiring it (wire-by-wire mode, terminal tables, cut list, run sheet).
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
  size: 1.8, autoOrbit: false, frame: 'left',
  view: G.STEPS[0].view,
  cut: { a: [0, 0, 1], b: [0, 0, 1], center: [0, 0.95, 0.17], reach: 1.4 },
})
lab.view.frameX = -0.2

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
  plug: MAT.plastic({ color: '#d9e6ea', roughness: 0.15, transmission: 0.4, thickness: 0.004, finish: null }),
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

// ------------------------------------------------------------------ scene groups (shown/hidden per step)
const GROUPS = {}
function grp(name, parent) { const g = new THREE.Group(); g.name = name; (parent ?? lab.machine).add(g); GROUPS[name] = g; return g }
const encG = grp('enc'), standG = grp('stand'), doorsG = grp('doors'), cutG = grp('cutouts'), acG = grp('ac'), handleG = grp('handle')
const plateG = grp('plate'), ductG = grp('duct'), coverG = grp('covers'), railsG = grp('rails'), sub2G = grp('sub2'), wiresG = grp('wires'), doorDevG = grp('door'), tagsG = grp('tags')
const STEP_GROUPS = {}
for (const s of ['power', 'rail1', 'drives', 't1', 'rail3', 'rail4']) STEP_GROUPS[s] = grp(s)
const frontG = new THREE.Group(); encG.add(frontG)                  // front frame: hidden with "Remove front"
const VIEW = { noFront: false }

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
  encG.add(mesh(g, M.ss))
  // the whole front (frame, centre post, right flange, drip edge, gasket) is its own group so it can be taken off for a clear view
  const f = []
  f.push(box(W + 0.006, 0.016, T, 0, Y0 + HB - 0.022 * Math.tan(SLOPE) - 0.008, D + 0.022, 0))
  const fr = rect(W, HB, 0, 0, Y0 + HB / 2)
  fr.holes.push(holeOf(rect(0.533, HB - 0.07, 0.004, -0.3255, Y0 + HB / 2)), holeOf(rect(0.535, HB - 0.07, 0.004, 0.2805, Y0 + HB / 2)))
  f.push(plate(fr, T, D - 0.022 - T / 2))
  for (const x of [-W / 2 + 0.006, W / 2 - 0.006]) f.push(box(0.012, HB, 0.022, x, Y0 + HB / 2, D - 0.011, 0))
  f.push(box(0.032, HB - 0.02, 0.026, -0.023, Y0 + HB / 2, D - 0.013, 0.002))       // removable centre post
  f.push(box(0.054, HB - 0.02, 0.012, 0.595, Y0 + HB / 2, D - 0.006, 0.002))        // right flange (disconnect handle)
  frontG.add(mesh(f, M.ss))
  const eyes = []
  for (const x of [-0.575, 0.575]) { const z = 0.2, y = topY(z); eyes.push(at(new THREE.TorusGeometry(0.024, 0.006, 12, 32), x, y + 0.042, z), cyl(0.011, 0.02, x, y + 0.01, z, 'y', 6)) }
  encG.add(mesh(eyes, M.zinc))
  const studs = []; for (const x of [-SW / 2 + 0.025, SW / 2 - 0.025]) for (const y of [SY(25), SY(711), SY(1397)]) studs.push(cyl(0.0048, 0.03, x, y, T + 0.015, 'z', 12))
  encG.add(mesh(studs, M.zinc))
  // door gasket on the frame lip
  const gk = []; for (const [cx, w] of [[-0.3255, 0.533], [0.2805, 0.535]]) { gk.push(box(w + 0.01, 0.008, 0.004, cx, Y0 + HB - 0.03, D - 0.02, 0), box(w + 0.01, 0.008, 0.004, cx, Y0 + 0.03, D - 0.02, 0), box(0.008, HB - 0.06, 0.004, cx - w / 2 - 0.004, Y0 + HB / 2, D - 0.02, 0), box(0.008, HB - 0.06, 0.004, cx + w / 2 + 0.004, Y0 + HB / 2, D - 0.02, 0)) }
  frontG.add(mesh(gk, M.gasket))
  const lg = []
  for (const s of [-1, 1]) { const x = s * (W / 2 - 0.06); lg.push(box(0.12, 0.15, D, x, 0.075, D / 2, 0.004)); lg.push(box(0.14, 0.012, D + 0.02, x, 0.006, D / 2, 0.003)) }
  lg.push(box(W - 0.24, 0.1, 0.006, 0, 0.1, D - 0.04, 0.002))
  standG.add(mesh(lg, M.leg))
}

// doors: left hinged on the left edge, right hinged on the right edge (sheet 2 draws the right door as a copy of the left: design issue)
const doorL = new THREE.Group(), doorR = new THREE.Group()
const DOOR_Z = D + 0.004
doorL.position.set(-W / 2 + 0.03, 0, DOOR_Z); doorR.position.set(W / 2 - 0.054, 0, DOOR_Z)
doorsG.add(doorL, doorR)
function doorPanel(w, sign) {
  const g = [], x0 = sign > 0 ? 0 : -w
  g.push(box(w, HB - 0.05, 0.0028, x0 + w / 2, Y0 + HB / 2, 0.0014, 0.001))
  for (const y of [Y0 + 0.04, Y0 + HB - 0.04]) g.push(box(w, 0.022, 0.022, x0 + w / 2, y, -0.011, 0.001))
  for (const x of [x0 + 0.011, x0 + w - 0.011]) g.push(box(0.022, HB - 0.05, 0.022, x, Y0 + HB / 2, -0.011, 0.001))
  return g
}
let hmiHole, estopHole
{
  const wl = 0.573, wr = 0.575
  // sheet 2: display centre 1400 mm from the floor and 287 mm from the door's centre-post edge; E-STOP 138 mm from that edge
  hmiHole = { x: wl - 0.287, y: 1.4, w: 0.269, h: 0.224 }
  estopHole = { x: wl - 0.138, y: 1.097, r: 0.0152 }
  doorL.add(mesh(doorPanel(wl, 1), M.ssDoor))
  doorR.add(mesh(doorPanel(wr, -1), M.ssDoor))
  const hd = [box(0.04, 0.11, 0.02, wl - 0.07, 0.95, 0.012, 0.008), box(0.016, 0.1, 0.022, wl - 0.07, 0.87, 0.024, 0.006)]
  doorL.add(mesh(hd, M.black))
  const hd2 = [box(0.04, 0.11, 0.02, -wr + 0.07, 0.95, 0.012, 0.008), box(0.016, 0.1, 0.022, -wr + 0.07, 0.87, 0.024, 0.006)]
  doorR.add(mesh(hd2, M.black))
  const hg = []; for (const y of [0.35, 0.8, 1.25, 1.62]) { hg.push(cyl(0.007, 0.06, -0.006, y, -0.004, 'y', 12)); hg.push(cyl(0.007, 0.06, 0.006, y, -0.004, 'y', 12)) }
  doorsG.add(mesh(hg.map((g, i) => at(g.clone(), i % 2 ? W / 2 - 0.05 : -W / 2 + 0.024, 0, DOOR_Z)), M.ss))
  cutG.add(mesh([box(hmiHole.w, hmiHole.h, 0.004, hmiHole.x, hmiHole.y, 0.0015, 0)], M.hole))
  cutG.add(mesh([cyl(estopHole.r, 0.004, estopHole.x, estopHole.y, 0.0015, 'z', 32)], M.hole))
  doorL.add(cutG)
}

// A/C on the left side wall: Enviro-Therm 1000 BTU/h, 254 x 480 x 190.5 mm (PartsLib record), position not drawn
{
  const x = -W / 2 - 0.0953, g = []
  g.push(box(0.1905, 0.48, 0.254, x, 1.2, D * 0.5, 0.008))
  const grill = []; for (let k = 0; k < 11; k++) grill.push(box(0.004, 0.012, 0.2, x - 0.096, 1.03 + k * 0.026, D * 0.5, 0.001))
  acG.add(mesh(g, MAT.stainless({ roughness: 0.24, color: [0.68, 0.675, 0.66], rep: [1, 3] })), mesh(grill, M.grey))
  const lb = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#e9e8e3'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = '700 26px Inter, sans-serif'; c.fillText('ENVIRO-THERM', 12, 30); c.font = '500 18px Inter, sans-serif'; c.fillText('1000 BTU/h  120 V', 12, 54) })
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), MAT.plastic({ color: '#ffffff', map: lb, finish: null }))
  pl.rotation.y = -Math.PI / 2; pl.position.set(x - 0.0958, 1.37, D * 0.5); acG.add(pl)
  // X1 supply terminal box on the inside of the wall (PartsLib pins X1-1 L, X1-3 N, X1-4 PE)
  acG.add(mesh([box(0.012, 0.05, 0.07, -W / 2 + T + 0.006, 1.2, D * 0.5, 0.003)], M.black))
}
{
  handleG.add(mesh([box(0.044, 0.16, 0.022, 0.595, 1.413, D + 0.011, 0.006)], M.grey))
  handleG.add(mesh([box(0.022, 0.11, 0.016, 0.595, 1.453, D + 0.03, 0.006), cyl(0.014, 0.02, 0.595, 1.413, D + 0.028, 'z', 24)], M.red))
}

// ------------------------------------------------------------------ subplate 1
plateG.add(mesh([box(SW, SH, 0.00266, 0, Y0 + 0.051 + SH / 2, SPZ + 0.00133, 0)], M.sub))
{
  const holes = []; for (const x of [-SW / 2 + 0.025, SW / 2 - 0.025]) for (const y of [SY(25), SY(711), SY(1397)]) holes.push(cyl(0.006, 0.0005, x, y, PZ + 0.0002, 'z', 16))
  plateG.add(mesh(holes, M.hole))
  const nuts = []; for (const x of [-SW / 2 + 0.025, SW / 2 - 0.025]) for (const y of [SY(25), SY(711), SY(1397)]) nuts.push(cyl(0.0095, 0.008, x, y, PZ + 0.004, 'z', 6))
  GROUPS.enc.add(mesh(nuts, M.zinc))
}

// ------------------------------------------------------------------ wireway (Panduit F2X2WH6 / F3X2WH6), as drawn on sheet 3, each run tagged D1-D9
const DH = 0.0508
function duct([X0, X1, Yt, Yb]) {
  const x0 = SX(X0), x1 = SX(X1), yT = SY(Yt), yB = SY(Yb), along = (x1 - x0) > (yT - yB) ? 'x' : 'y'
  const len = along === 'x' ? x1 - x0 : yT - yB, wd = (along === 'x' ? yT - yB : x1 - x0) - 0.004, cx = (x0 + x1) / 2, cy = (yT + yB) / 2, wt = 0.0018
  const body = [], cover = []
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
  const runs = G.DUCTS.map((d) => duct(d.r))
  ductG.add(mesh(runs.flatMap((r) => r.body), M.duct))
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
  for (const r of Object.values(G.RAILS)) {
    g.push(railProfile(RAILP, (r.x1 - r.x0) / 1000, SX((r.x0 + r.x1) / 2), SY(r.y)))
    for (let x = r.x0 + 12; x < r.x1 - 10; x += 25) slots.push(box(0.015, 0.0052, 0.0006, SX(x), SY(r.y), PZ + 0.0012, 0.0006))
    for (let x = r.x0 + 12; x < r.x1; x += 200) scr.push(cyl(0.0042, 0.0022, SX(x), SY(r.y), PZ + 0.0021, 'z', 16))
  }
  railsG.add(mesh(g, M.rail), mesh(slots, M.hole), mesh(scr, M.screw))
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
function addDevice(d) {
  const parent = d.at === 'sub1' ? STEP_GROUPS[d.step] : null
  if (!parent) return
  const r = devRect(d)
  const x0 = SX(r.X0), x1 = SX(r.X1), yT = SY(r.Yt), yB = SY(r.Yb), w = x1 - x0, h = yT - yB, xc = (x0 + x1) / 2, yc = (yT + yB) / 2
  const z0 = d.rail ? RZ : PZ, dep = d.depth / 1000, z1 = z0 + dep
  const o = new THREE.Group(); o.name = d.tag
  const bm = bodyMat(d.body ?? '#cccccc', d.metal)
  const lay = LAYOUTS[DEVICE_LAYOUT[d.tag]]
  if (d.rail) {
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
  } else {
    o.add(mesh([box(w - 0.001, h - 0.001, dep, xc, yc, z0 + dep / 2, Math.min(0.006, dep * 0.08))], bm))
  }
  const face = new THREE.Mesh(at(new THREE.PlaneGeometry(w, h), xc, yc, z1 + 0.0004), faceMat(d.tex, d.face === 'line' ? d.body : undefined))
  face.receiveShadow = true; o.add(face)
  // terminal hardware at every terminal in the layout: screws, push-in releases, RJ45 jacks
  if (lay) {
    const screws = [], push = [], jacks = []
    for (const [name, [u, v, zf, e]] of Object.entries(lay.pins)) {
      if (/#|^\d+$/.test(name) && DEVICE_LAYOUT[d.tag] === 'PB2' && !/^[1-5]$/.test(name)) continue
      const x = x0 + u * w, y = yT - v * h, z = z0 + dep * zf
      if (/^(X2\d|ETH|RJ45|LAN|WAN)/.test(name) || (DEVICE_LAYOUT[d.tag] === 'FL1116' && /^\d+$/.test(name))) { jacks.push(box(0.0118, 0.0105, 0.004, x, y, Math.min(z, z1) + 0.0006, 0.0008)); continue }
      if (['EPSITRON', 'PRO2', 'PTFIX12', 'PTFIX18', 'AL1920', 'NAT102'].includes(DEVICE_LAYOUT[d.tag])) { if (e === 'f' || zf > 0.9) push.push(...pushIn(x, y, z1 + 0.0008)); continue }
      if (['PF525', 'PB2', 'OW16', 'D167'].includes(DEVICE_LAYOUT[d.tag])) continue          // hidden behind covers / drawn on the face
      screws.push(...screwHead(x, y, z1 + 0.0009, d.tag.startsWith('PDB1') || d.tag === 'Q1' || d.tag === 'FU1' ? 0.0034 : 0.0021))
    }
    if (screws.length) o.add(mesh(screws, M.screw))
    if (push.length) o.add(mesh(push, M.orange))
    if (jacks.length) o.add(mesh(jacks, M.rj))
  }
  parent.add(o)
  DEV[d.tag] = { d, r, x0, x1, yT, yB, xc, yc, z0, z1, obj: o, lay }
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
  for (let i = 0; i < s.n; i++) {
    const X = s.x0 + s.pitch * (i + 0.5), x = SX(X); xs.push(X)
    body.push(railProfile(TBP, s.pitch / 1000, x, yc))
    const f = at(new THREE.PlaneGeometry(s.pitch / 1000 - 0.0003, h * 0.98), x, yc, PZ + dep + 0.0003)
    if (s.slices) { const uv = f.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (uv.getX(k) + (i % s.slices)) / s.slices) }
    faces.push(f)
    const rows = s.kind === 'JD4' ? [...sl.T, ...sl.B] : [sl.inside, sl.field]
    for (const v of rows) screws.push(...screwHead(x, yc + h / 2 - v * h, PZ + dep * (s.kind === 'JD4' && (v < 0.3 || v > 0.7) ? 0.62 : 0.8), Math.min(0.0019, s.pitch / 2400)))
    marks.push(box(s.pitch / 1000 - 0.0012, 0.006, 0.001, x, yc, PZ + dep * 0.93 + 0.0006, 0))
  }
  const o = new THREE.Group(); o.name = d.tag
  o.add(mesh(body, bodyMat('#9a9b98')), mesh(screws, M.screw), mesh(marks, bodyMat('#f2f2ee')))
  if (jumpers.length) o.add(mesh(jumpers, M.red))
  const fm = faceMat(s.tex); o.add(new THREE.Mesh(GEO.merge(faces), fm))
  const n = s.n, lt = canvasTex(Math.min(4096, n * 64), 64, (c, w, hh) => { c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, hh); c.fillStyle = '#111'; c.font = `700 ${Math.min(40, 64 * 0.62)}px Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < n; i++) { c.save(); c.translate((i + 0.5) * (w / n), hh / 2); c.rotate(-Math.PI / 2); c.fillText(String(i + 1), 0, 2); c.restore() } })
  const lp = new THREE.Mesh(at(new THREE.PlaneGeometry(SX(s.x0 + s.pitch * n) - SX(s.x0), 0.0058), (SX(s.x0) + SX(s.x0 + s.pitch * n)) / 2, yc, PZ + dep * 0.93 + 0.0012), MAT.plastic({ color: '#ffffff', map: lt, finish: null }))
  o.add(lp)
  parent.add(o)
  const X0 = s.x0, X1 = s.x0 + s.pitch * s.n
  DEV[d.tag] = { d, r: { X0, X1, Yt: rail.y - s.h / 2, Yb: rail.y + s.h / 2 }, x0: SX(X0), x1: SX(X1), yT: yc + h / 2, yB: yc - h / 2, xc: (SX(X0) + SX(X1)) / 2, yc, z0: PZ, z1: PZ + dep, obj: o, xs }
  o.traverse((m) => { if (m.isMesh) { m.userData.tag = d.tag; pickables.push(m) } })
  tagPlate(d.tag, X0 + 13, rail.y + s.h / 2 + 9, 24)
  TAG_PLATES[TAG_PLATES.length - 1].userData.step = d.step
}
for (const d of G.DEVICES) { if (d.strip) addStrip(d); else if (d.at === 'sub1') addDevice(d) }

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
  STEP_GROUPS[step].add(mesh(g, bodyMat('#5b5d5f')), new THREE.Mesh(GEO.merge(f), faceMat('ANCHOR')), mesh(sc, M.screw))
}

// RCP1 1492-REC15: on sheet 6, no position on sheet 3. Drawn as a dashed outline in the open space on rail 4.
{
  const X0 = 900, X1 = 945, rail = G.RAILS.r4, yc = SY(rail.y)
  const g = new THREE.BoxGeometry(SX(X1) - SX(X0), 0.075, 0.06)
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineDashedMaterial({ color: 0xc26a00, dashSize: 0.006, gapSize: 0.004 }))
  e.computeLineDistances(); e.position.set((SX(X0) + SX(X1)) / 2, yc, RZ + 0.03); STEP_GROUPS.rail4.add(e)
  DEV.RCP1 = { d: { tag: 'RCP1', pn: '1492-REC15', ghost: true }, r: { X0, X1, Yt: rail.y - 37, Yb: rail.y + 37 }, x0: SX(X0), x1: SX(X1), yT: yc + 0.0375, yB: yc - 0.0375, xc: (SX(X0) + SX(X1)) / 2, yc, z0: RZ, z1: RZ + 0.06, obj: e }
}

// ------------------------------------------------------------------ subplate 2 (SCE-16P14) on the left side wall, VM1 on angled brackets
const SUB2 = { x: -W / 2 + T + 0.004, y: 0.58, z: D * 0.42 }
{
  const g = new THREE.Group(); g.position.set(SUB2.x, SUB2.y, SUB2.z); g.rotation.y = Math.PI / 2; sub2G.add(g)
  g.add(mesh([box(0.381, 0.33, 0.00266, 0, 0, 0.00133, 0)], M.sub))
  const bt = faceMat('BRACKET')
  for (const s of [-1, 1]) {
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
  const g = new THREE.Group(); doorL.add(g); doorDevG.userData.real = g
  const bez = mesh([box(hw, hh, 0.012, hmiHole.x, hmiHole.y, 0.0028 + 0.006, 0.006)], M.grey)
  const scr = new THREE.Mesh(at(new THREE.PlaneGeometry(hw * 0.985, hh * 0.985), hmiHole.x, hmiHole.y, 0.0028 + 0.0122), faceMat('HMI1'))
  const back = mesh([box(0.27, 0.22, 0.06, hmiHole.x, hmiHole.y, -0.03, 0.004)], M.black)
  const clips = []; for (const [dx, dy] of [[-0.13, 0.08], [-0.13, -0.08], [0.13, 0.08], [0.13, -0.08], [0, 0.108], [0, -0.108]]) clips.push(box(0.014, 0.01, 0.01, hmiHole.x + dx, hmiHole.y + dy, -0.006, 0.002))
  g.add(bez, scr, back, mesh(clips, M.zinc))
  const es = new THREE.Group(); es.position.set(estopHole.x, estopHole.y, 0.0028)
  es.add(mesh([cyl(0.024, 0.006, 0, 0, 0.003, 'z', 40)], M.yellow))
  es.add(mesh([cyl(0.017, 0.022, 0, 0, 0.017, 'z', 32)], M.black))
  es.add(mesh([GEO.lathe([[0, 0], [0.03, 0], [0.03, 0.006], [0.026, 0.016], [0.012, 0.021], [0, 0.022]], 48).rotateX(Math.PI / 2).translate(0, 0, 0.028)], M.red))
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
  for (const [re, f] of PIN_ALIAS) { const m = re.exec(s); if (m && lay.pins[f(m)]) return f(m) }
  const c = s.replace(/\s*\(.*\)\s*$/, '').trim()
  if (lay.pins[c]) return c
  const c2 = c.replace(/\s+/g, ''); if (lay.pins[c2]) return c2
  return null
}
function whereText(lay, key) {
  const [u, v] = lay.pins[key]
  if (/^(RJ45|ETH|LAN|WAN|X2\d)/.test(key)) return `RJ45 port ${key}${v > 0.9 ? ' (underside)' : ''}`
  if (lay === LAYOUTS.FL1116 && /^\d+$/.test(key)) { const n = Number(key), i = (n - 1) % 8; return `RJ45 port ${n}: ${n <= 8 ? 'upper' : 'lower'} block, ${i % 2 ? 'right' : 'left'} column, row ${Math.floor(i / 2) + 1}` }
  if (lay === LAYOUTS.AL1920 && /^X0\d-\d/.test(key)) return `port ${key.slice(0, 3)} plug, pin ${key.slice(4)} (${v < 0.5 ? 'top' : 'bottom'} of the module)`
  const rowPins = Object.entries(lay.pins).filter(([k, p]) => Math.abs(p[1] - v) < 0.02 && !/#/.test(k)).map(([, p]) => p[0]).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b)
  const i = rowPins.findIndex((x) => Math.abs(x - u) < 1e-6)
  const ord = ['1st', '2nd', '3rd'][i] ?? `${i + 1}th`
  return `${v < 0.33 ? 'top' : v > 0.67 ? 'bottom' : 'middle'} row, ${ord} of ${rowPins.length} from the left`
}
const GB_TAPS = { next: 0, map: {} }
function gbTap(key) {
  if (GB_TAPS.map[key] === undefined) GB_TAPS.map[key] = GB_TAPS.next++
  const n = (GB_TAPS.map[key] % 14) + 1, dv = DEV.GB1, lay = dv.lay, [u, v, zf] = lay.pins[`TAP${n}`]
  return { X: dv.r.X0 + u * (dv.r.X1 - dv.r.X0), Y: dv.r.Yt + v * (dv.r.Yb - dv.r.Yt), z: dv.z0 + (dv.z1 - dv.z0) * zf, e: 'l', pin: `tap ${n}`, conf: 'measured', where: `tap ${n} of 14 from the top`, dev: 'GB1' }
}
function term(devTag, rawTerm, key) {
  if (devTag === 'GND BAR' || devTag === 'GB1') return gbTap(key)
  const dv = DEV[devTag]; if (!dv || dv.door || dv.sub2) return null
  if (dv.d.strip) {
    const raw = String(rawTerm ?? '').trim()
    const m = /^(\d+)\s*(?:\((T|B)\))?/.exec(raw); const i = m ? Number(m[1]) - 1 : 0
    const s = dv.d.strip, sl = STRIP_LAYOUT[s.kind], X = s.x0 + s.pitch * (i + 0.5), Yt = G.RAILS[dv.d.rail].y - s.h / 2
    const level = m?.[2]
    const field = raw.includes(':field')
    const insideTop = devTag !== 'TB1'                 // TB1's drive side faces the duct below rail 1
    const topSide = field ? !insideTop : insideTop
    let v; if (s.kind === 'JD4') { const pair = sl[level ?? 'T']; v = topSide ? pair[0] : pair[1] } else v = topSide ? sl.inside : sl.field
    if (!insideTop) v = 1 - v
    const zf = s.kind === 'JD4' && level === 'B' ? 0.62 : 0.8
    return { X, Y: Yt + v * s.h, z: PZ + (s.depth / 1000) * zf, e: topSide ? 't' : 'b', pin: `${i + 1}${level ? ` (${level})` : ''}`, conf: sl.conf, where: `terminal ${i + 1}, ${topSide ? 'upper' : 'lower'} screw${level ? `, ${level === 'T' ? 'upper' : 'lower'} level` : ''}${field ? ' (field side)' : ''}`, dev: devTag }
  }
  if (devTag === 'RCP1') {
    const t = String(rawTerm ?? ''); const u = t.includes('GND') ? 0.5 : t.startsWith('L1') ? 0.3 : 0.7, v = t.endsWith('1') || t === 'GND' ? 0.15 : 0.85
    return { X: dv.r.X0 + u * (dv.r.X1 - dv.r.X0), Y: dv.r.Yt + v * (dv.r.Yb - dv.r.Yt), z: dv.z1 - 0.01, e: 'f', pin: t, conf: 'approx', where: 'RCP1 has no position on the drawings', dev: 'RCP1' }
  }
  const lay = dv.lay; if (!lay) return null
  const k = pinKey(lay, rawTerm)
  if (!k) { console.warn('no pin', devTag, rawTerm); return null }
  const [u, v, zf, e] = lay.pins[k]
  return { X: dv.r.X0 + u * (dv.r.X1 - dv.r.X0), Y: dv.r.Yt + v * (dv.r.Yb - dv.r.Yt), z: dv.z0 + (dv.z1 - dv.z0) * zf, e, pin: k, conf: lay.conf, where: whereText(lay, k), dev: devTag }
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
function entry(p) {
  let best = null
  const side = { t: 'up', b: 'down', l: 'left', f: null }[p.e] ?? p.side
  for (let i = 0; i < DUCT.length; i++) {
    const d = DUCT[i]
    let q = null, cost = 0
    if (p.X >= d.X0 && p.X <= d.X1 && p.Y >= d.Yt && p.Y <= d.Yb) { q = d.horiz ? { X: p.X, Y: p.Y, cY: d.c } : { X: p.X, Y: p.Y, cX: d.c }; cost = -1 }
    else if (d.horiz && p.X >= d.X0 + 3 && p.X <= d.X1 - 3) {
      if (d.Yb <= p.Y + 2) { q = { X: p.X, Y: d.Yb, cY: d.c }; cost = p.Y - d.Yb + (side === 'down' ? 400 : 0) }
      else if (d.Yt >= p.Y - 2) { q = { X: p.X, Y: d.Yt, cY: d.c }; cost = d.Yt - p.Y + (side === 'up' ? 400 : 0) }
    } else if (!d.horiz && p.Y >= d.Yt + 3 && p.Y <= d.Yb - 3) {
      if (d.X1 <= p.X + 2) { q = { X: d.X1, Y: p.Y, cX: d.c }; cost = p.X - d.X1 + (side === 'left' ? 10 : 60) }
      else if (d.X0 >= p.X - 2) { q = { X: d.X0, Y: p.Y, cX: d.c }; cost = d.X0 - p.X + 60 }
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
  const c = P(p.X, p.Y, p.z), dIn = ENTRY_IN[p.e] ?? ENTRY_IN.f
  const q = c.clone().addScaledVector(dIn, -0.0115), q2 = c.clone().addScaledVector(dIn, -0.026)
  if (p.e === 'f') q2.add(V3(0, 0, 0.004))
  return { pts: [q, q2], clamp: c, dIn }
}
function wirePoints(a, b, lane, cls) {
  const r = route(a, b, cls); if (!r) return null
  const zl = PZ + 0.008 + (lane % 7) * 0.005, off = ((lane * 7) % 11 - 5) * 2.2
  const la = leadOut(a), lb = leadOut(b)
  const toDuct = (p, e, outPts) => {
    const last = outPts[outPts.length - 1]
    const dirY = e.cY !== undefined ? Math.sign(e.Y - p.Y) : 0, dirX = e.cX !== undefined ? Math.sign(e.X - p.X) : 0
    const pts = [...outPts]
    if (p.e === 'f' && !p.free) pts.push(V3(last.x, SY(p.Y + dirY * 12), last.z + 0.004))
    pts.push(V3(SX(e.X - dirX * 6), SY(e.Y - dirY * 6), Math.max(PZ + 0.03, Math.min(last.z, PZ + 0.09))))
    pts.push(P(e.cX !== undefined ? e.cX + off : e.X, e.cY !== undefined ? e.cY + off : e.Y, zl))
    return pts
  }
  const A = toDuct(a, r.ea, la.pts), B = toDuct(b, r.eb, lb.pts).reverse()
  const poly = [{ x: A[A.length - 1].x, y: A[A.length - 1].y }, ...r.path.slice(1, -1).map((n) => ({ x: SX(n.x + off), y: SY(n.y + off) })), { x: B[0].x, y: B[0].y }]
  const dense = []
  for (let k = 1; k < poly.length; k++) {
    const p0 = poly[k - 1], p1 = poly[k], L = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    if (L < 1e-4) continue
    const ux = (p1.x - p0.x) / L, uy = (p1.y - p0.y) / L, cut = Math.min(0.018, L / 2.5)
    const n = Math.max(1, Math.floor((L - 2 * cut) / 0.06))
    for (let j = 0; j <= n; j++) { const t = cut + (L - 2 * cut) * (j / n); dense.push(V3(p0.x + ux * t, p0.y + uy * t, zl)) }
  }
  const pts = [...A, ...dense, ...B].filter((p, i, arr) => i === 0 || p.distanceTo(arr[i - 1]) > 0.002)
  return { pts, ducts: r.ducts.map((i) => DUCT[i].id), clampA: la.clamp, clampB: lb.clamp, dInA: la.dIn, dInB: lb.dIn }
}

// ------------------------------------------------------------------ wire colours (assumed: the drawings give none; see Modeling issues)
const WC = {
  power: { hex: '#141414', name: 'black' }, hot120: { hex: '#b8191b', name: 'red' }, neutral: { hex: '#e9e9e4', name: 'white' },
  dc: { hex: '#1f4fb8', name: 'blue' }, dc0: { hex: '#cfe0f5', name: 'white/blue' }, gnd: { hex: '#2c8a3a', name: 'green/yellow' },
  iol: { hex: '#e6c21c', name: 'yellow jacket (LUTZE A1021803-1)' }, eth: { hex: '#2a9d8f', name: 'teal patch cord' }, field: { hex: '#3d3f42', name: 'black jacket (field cable)' },
}
const wireMats = {}
const wmat = (k) => wireMats[k] ??= MAT.plastic({ color: WC[k]?.hex ?? k, roughness: 0.36, clearcoat: 0.3, clearcoatRoughness: 0.35, finish: null })
const AWG_OD = { '4': 8.6, '6': 7.2, '8': 5.9, '10': 4.6, '12': 3.9, '14': 3.4, '16': 2.9, '18': 2.6, '20': 2.2, '22': 1.9 }   // MTW/THHN insulated OD, mm (typical)
const kindOf = (s) => {
  if (s.kind === 'iol' || s.kind === 'eth' || s.kind === 'field') return s.kind
  const p = String(s.potential ?? ''), f = `${s.from.dev} ${s.from.term} ${s.to.dev} ${s.to.term}`
  if (p === 'GND' || /GND BAR/.test(f) && !/DC -|COM/.test(f)) return 'gnd'
  if (s.sheet === 4 && s.label === 'W54') return 'hot120'
  if (s.sheet === 4 && s.label === 'W19') return 'neutral'
  if (s.sheet <= 5 && !/\bS[12]\b|Digital|E-STOP|TB5|OUT-|OUT\+|DC-COM|24V/.test(f + ' ' + p)) return 'power'
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
  if (['FAZ-D2-3-NA', 'FAZ-C2-1-NA-SP'].includes(PN_OF[p.dev])) return { k: 'bare', text: 'Bare, no ferrule (Eaton FAZ-NA p.6)' }
  if (kind === 'eth') return { k: 'rj45', text: 'RJ45 plug' }
  if (['4', '6', '8'].includes(String(awg))) return { k: 'bare', text: 'Bare stranded into the lug' }
  return { k: 'ferrule', text: 'Insulated ferrule (shop standard size)' }
}
function endHardware(clamp, dIn, od, et, list) {
  if (!clamp || !et) return
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
const tube = (pts, r, radial = 6) => { const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5); return { c, g: new THREE.TubeGeometry(c, Math.min(320, Math.max(12, Math.round(c.getLength() / 0.009))), r, radial, false) } }

// ------------------------------------------------------------------ build every conductor and cable
const WIRES = []                    // per segment: { s, obj, tubes[], kind, curve, step, len, ends, ducts }
const DOOR_EXIT = { X: 42, Y: 260 }, AC_EXIT = { X: 42, Y: 140 }
const DUCT_USE = Object.fromEntries(G.DUCTS.map((d) => [d.id, { ac: new Set(), dc: new Set() }]))
const FIELD_EXIT = (X) => ({ X: clamp(X, 120, 1040), Y: 1440, z: PZ + 0.03, e: 'b', exit: true, free: true })
function endpoint(e, key) {
  const dev = e.dev
  if (dev === 'Panel' || dev === 'ACU') return { ...AC_EXIT, z: PZ + 0.03, e: 'l', offplate: 'A/C', exit: true, free: true }
  if (dev === 'HMI1' || dev === 'E-STOP') return { ...DOOR_EXIT, z: PZ + 0.03, e: 'l', offplate: dev, exit: true, free: true, door: dev }
  if (dev === 'VM1') return { X: 30, Y: 1000, z: PZ + 0.03, e: 'l', offplate: 'VM1', exit: true, free: true, sub2: true }
  if (/^(MTR|FM|CE|LT|TT|SC|Plant)/.test(dev)) return null
  return term(dev, e.term, key)
}
function tailFor(ex) {
  const wx = -W / 2 + T + 0.012, ey = SY(ex.Y)
  if (ex.offplate === 'A/C') return [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, 1.3, D * 0.42), V3(wx, 1.2, D * 0.5)]
  if (ex.sub2) return [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, SUB2.y + 0.15, SUB2.z - 0.12), V3(SUB2.x + 0.07, SUB2.y + 0.06, SUB2.z - 0.1)]
  if (ex.door) return [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, ey - 0.03, D - 0.12), V3(wx + 0.004, ey - 0.05, D - 0.05)]
  return [V3(SX(ex.X), SY(1432), PZ + 0.03), V3(SX(ex.X), SY(1490), PZ + 0.03)]
}
function addDoorPart(w, ex, idx, kind, od, label) {
  const dv = DEV[ex.door], ey = SY(ex.Y) - 0.05, l = dv.local, k = (idx % 9) * 0.003
  const dp = [V3(-0.0114, ey, -0.054), V3(0.03, ey - 0.03, -0.04), V3(0.06 + k, l.y + 0.06, -0.038), V3(l.x - 0.05, l.y + k, -0.034), V3(l.x, l.y, l.z)]
  const { c, g } = tube(dp, od / 2)
  const o = new THREE.Mesh(g, wmat(kind)); o.castShadow = true; o.userData.wire = idx
  const h = new THREE.Group(); h.add(o); if (label) h.add(new THREE.Mesh(sleeve(c, 0.93, od / 2, label), markerMat))
  doorDevG.userData.real.add(h); w.tubes.push(o); w.doorTube = o
}
function finishGroup(w, hw) {
  const g = w.obj
  if (hw.metal.length) g.add(mesh(hw.metal, M.tin))
  if (hw.collar.length) g.add(mesh(hw.collar, M.collar))
  if (hw.copper.length) g.add(mesh(hw.copper, M.copper))
  if (hw.plug.length) g.add(mesh(hw.plug, M.plug))
}
function addTail(pts, a, b) { if (a?.exit) pts.unshift(...tailFor(a).reverse()); if (b?.exit) pts.push(...tailFor(b)) }

function buildConductor(s, idx) {
  const kind = kindOf(s), cls = classOf(kind)
  let a = endpoint(s.from, s.id + ':a'), b = endpoint(s.to, s.id + ':b')
  if (!a && b) a = FIELD_EXIT(b.X)
  if (!b && a) b = FIELD_EXIT(a.X)
  if (!a || !b) return null
  const od = (kind === 'eth' ? 5.8 : AWG_OD[s.awg] ?? 3.4) / 1000
  const w = { s, kind, cls, step: s.step, obj: new THREE.Group(), tubes: [], ends: [a, b], od }
  const hw = { metal: [], collar: [], copper: [], plug: [] }
  let pts, ducts = []
  if (s.from.dev === s.to.dev && !a.exit) {
    // a jumper on one device: a short arc between the two clamps
    const la = leadOut(a), lb = leadOut(b)
    const mid = la.pts[1].clone().lerp(lb.pts[1], 0.5).add(V3(0, (a.e === 't' ? 1 : -1) * 0.012, 0.014))
    pts = [...la.pts, mid, ...lb.pts.slice().reverse()]
    endHardware(la.clamp, la.dIn, od, endType(a, s.awg, kind), hw); endHardware(lb.clamp, lb.dIn, od, endType(b, s.awg, kind), hw)
  } else {
    const r = wirePoints(a, b, idx, cls); if (!r) return null
    pts = r.pts; ducts = r.ducts
    endHardware(r.clampA, r.dInA, od, endType(a, s.awg, kind), hw); endHardware(r.clampB, r.dInB, od, endType(b, s.awg, kind), hw)
    addTail(pts, a, b)
  }
  const { c, g } = tube(pts, od / 2, s.awg === '4' ? 10 : 7)
  const o = new THREE.Mesh(g, wmat(kind)); o.castShadow = true; o.receiveShadow = true; o.userData.wire = idx
  w.obj.add(o); w.tubes.push(o); w.curve = c; w.len = c.getLength(); w.ducts = ducts
  if (s.label) { const L = w.len; w.obj.add(new THREE.Mesh(GEO.merge([sleeve(c, clamp(0.03 / L, 0.01, 0.4), od / 2, s.label), sleeve(c, clamp(1 - 0.03 / L, 0.6, 0.99), od / 2, s.label)]), markerMat)) }
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
    const ts = coreEnds.map((c) => c[which]).filter((p) => p && !p.exit)
    if (ts.length) {
      const X = ts.reduce((t, p) => t + p.X, 0) / ts.length, z = Math.max(...ts.map((p) => p.z))
      const up = ts.filter((p) => p.e === 't').length >= ts.length / 2
      const Y = up ? Math.min(...ts.map((p) => p.Y)) - 34 : Math.max(...ts.map((p) => p.Y)) + 34
      return { bp: { X, Y, z: z + 0.012, e: up ? 't' : 'b', free: true }, terms: ts }
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
  const r = wirePoints(A.bp, B.bp, idx, cls); if (!r) return null
  const pts = r.pts; addTail(pts, A.bp, B.bp)
  const { c, g } = tube(pts, jacketOd / 2, 9)
  const jm = kind === 'iol' ? wmat('iol') : wmat('field')
  const o = new THREE.Mesh(g, jm); o.castShadow = true; o.userData.wire = idx
  w.obj.add(o); w.tubes.push(o); w.curve = c; w.len = c.getLength(); w.ducts = r.ducts
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
      const lo = leadOut(p)
      const colour = ce.k.anl ? (ce.k.anl === 'BK' ? '#141414' : ce.k.anl === 'WH' ? '#e9e9e4' : '#b9a27a') : (IOL_CORE[ce.k.pin]?.color ?? '#555')
      const mid = lo.pts[1].clone().lerp(bpW, 0.55).add(V3((i - 1) * 0.003, 0, 0.006))
      const ct = tube([...lo.pts, mid, bpW], coreOd / 2, 5)
      const co = new THREE.Mesh(ct.g, wmat(colour)); co.castShadow = true; co.userData.wire = idx
      w.obj.add(co); w.tubes.push(co)
      endHardware(lo.clamp, lo.dIn, coreOd, { k: 'ferrule' }, hw)
      w.cores.push({ which, p, k: ce.k, colour, name: ce.k.anl ?? IOL_CORE[ce.k.pin]?.name ?? '' })
    })
  }
  finishGroup(w, hw)
  wiresG.add(w.obj)
  if (A.terms.length && B.terms.length) for (const d of r.ducts) DUCT_USE[d].dc.add(s.label)
  return w
}
G.SEGMENTS.forEach((s, i) => { try { WIRES[i] = s.cores?.length ? buildCable(s, i) : buildConductor(s, i) } catch (e) { console.warn('wire', s.id, e) } })
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
let doorOpen = 0, doorTarget = 0, cur = 0, camTween = null
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
  applyFront()
}
function applyFront() {
  const st = G.STEPS[cur], inEnc = st.show.includes('enc')
  frontG.visible = !VIEW.noFront
  doorsG.visible = inEnc && !VIEW.noFront
  handleG.visible = st.show.includes('handle') && !VIEW.noFront
  const b = document.querySelector('[data-front]'); if (b) b.classList.toggle('on', VIEW.noFront)
}
function showStep(i, { fly = true } = {}) {
  cur = clamp(i, 0, G.STEPS.length - 1)
  const st = G.STEPS[cur]
  applyVisibility(st, cur)
  hiG.clear()
  if (!st.wires) { lab.machine.updateMatrixWorld(true); for (const t of stepTags(st)) { const o = DEV[t]?.obj ?? (t === 'A/C' ? acG : null); if (o) { const e = outline(o); if (e) hiG.add(e) } } }
  if (st.id === 'duct') { lab.machine.updateMatrixWorld(true); const e = outline(ductG); if (e) hiG.add(e) }
  if (st.id === 'rails') { lab.machine.updateMatrixWorld(true); const e = outline(railsG); if (e) hiG.add(e) }
  if (fly) flyTo(st.view)
  if (!wm.on) selectWire(-1, { fly: false })
  ui.render()
}
// the camera as it really is now (the user may have orbited since the last flight): az/el/dist/target in lab.view terms
function syncView() {
  const k = lab.k, tg = lab.controlsOrbit.target, off = lab.camera.position.clone().sub(tg), d = off.length()
  lab.view = { ...lab.view, az: THREE.MathUtils.radToDeg(Math.atan2(off.x, off.z)), el: THREE.MathUtils.radToDeg(Math.asin(clamp(off.y / d, -1, 1))), dist: d / 2.4, target: [tg.x / k, tg.y / k, tg.z / k], frameX: -0.2 }
}
function flyTo(v) {
  syncView()
  // no orbit momentum may carry on turning the model during or after the flight
  lab.controlsOrbit.enableDamping = false; lab.controlsOrbit.update()
  const from = { ...lab.view }, to = { ...lab.view, ...v, frameX: -0.2 }
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
  else if (dv?.door) { const p = DEV[tag].local.clone(); doorL.updateMatrixWorld(true); doorL.localToWorld(p); lab.machine.worldToLocal(p); focusOn([p.clone().addScalar(-0.12), p.clone().addScalar(0.12)]) }
}
lab.onTick((dt, l, rdt) => {
  if (camTween) {
    const k = clamp((performance.now() - camTween.t0) / camTween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    const f = camTween.from, t = camTween.to
    const v = { ...t, az: lerp(f.az, t.az, e), el: lerp(f.el, t.el, e), dist: lerp(f.dist, t.dist, e), fov: lerp(f.fov ?? 30, t.fov ?? 30, e), target: f.target.map((x, i) => lerp(x, t.target[i], e)) }
    lab.view = v; lab._applyView(v)
    if (k >= 1) { camTween = null; lab.controlsOrbit.update(); lab.controlsOrbit.enableDamping = true }
  }
  doorOpen += (doorTarget - doorOpen) * Math.min(1, rdt * 3)
  doorL.rotation.y = -doorOpen * 1.9; doorR.rotation.y = doorOpen * 1.9
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220)
  hiMat.opacity = 0.55 + 0.4 * pulse
  for (const r of ringG.children) r.scale.setScalar(1 + 0.35 * pulse)
  tags.update()
})
lab.controlsOrbit.addEventListener('start', () => { if (camTween) { camTween = null; lab.controlsOrbit.enableDamping = true } })

// ------------------------------------------------------------------ on-screen tags: device tags for the step, end labels in wire mode
const ringG = new THREE.Group(); lab.machine.add(ringG)
const ringMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.95, depthTest: false })
const tags = (() => {
  const layer = document.createElement('div'); layer.id = 'g-tags'; document.body.appendChild(layer)
  const els = new Map(); let hover = null; let ends = []
  function el(key, cls) { if (!els.has(key)) { const e = document.createElement('div'); layer.appendChild(e); els.set(key, e) } const e = els.get(key); e.className = cls; return e }
  function anchor(tag) {
    const dv = DEV[tag]; if (!dv) return null
    if (dv.door) { const p = V3(dv.local.x, dv.local.y + 0.1, 0.04); doorL.localToWorld(p); return p }
    if (dv.sub2) { const p = V3(0, 0.07, 0.2); dv.group.localToWorld(p); return p }
    const p = V3(dv.xc, dv.yT + 0.012, dv.z1); lab.machine.localToWorld(p); return p
  }
  const place = (e, p) => { const q = p.clone().project(lab.camera); if (q.z > 1) { e.style.display = 'none'; return } e.style.display = 'block'; e.style.left = `${(q.x * 0.5 + 0.5) * innerWidth}px`; e.style.top = `${(-q.y * 0.5 + 0.5) * innerHeight}px` }
  function update() {
    const st = G.STEPS[cur], on = new Set(st.wires || wm.on ? [] : stepTags(st)); if (hover && !wm.on) on.add(hover)
    for (const [k, e] of els) if (!on.has(k) && !k.startsWith('end:')) e.style.display = 'none'
    for (const t of on) { const p = anchor(t); if (!p) continue; const e = el(t, 'g-tag' + (t === hover ? ' hov' : '')); e.textContent = t; place(e, p) }
    ends.forEach((x, i) => { const e = el(`end:${i}`, 'g-end'); e.innerHTML = x.html; place(e, x.world()) })
    for (const [k, e] of els) if (k.startsWith('end:') && Number(k.slice(4)) >= ends.length) e.style.display = 'none'
  }
  return { update, setHover: (t) => { hover = t }, setEnds: (list) => { ends = list } }
})()

// ------------------------------------------------------------------ picking
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2()
let downAt = null
function pick(ev) {
  const r = lab.renderer.domElement.getBoundingClientRect()
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(mouse, lab.camera)
  const wireMeshes = GROUPS.wires.visible ? WIRES.filter((w) => w && w.obj.visible).flatMap((w) => w.tubes) : []
  const vis = pickables.filter((m) => { let o = m; while (o) { if (!o.visible) return false; o = o.parent } return true })
  const hit = ray.intersectObjects([...wireMeshes, ...vis], false)[0]
  if (!hit) return null
  if (hit.object.userData.wire !== undefined) return { wire: hit.object.userData.wire }
  return { tag: hit.object.userData.tag }
}
lab.renderer.domElement.addEventListener('pointermove', (ev) => {
  const h = pick(ev); tags.setHover(h?.tag && h.tag !== 'Enclosure' ? h.tag : null)
  lab.renderer.domElement.style.cursor = h && (h.wire !== undefined || (h.tag && h.tag !== 'Enclosure')) ? 'pointer' : ''
  const tip = document.getElementById('g-tip')
  if (h?.wire !== undefined) { const s = G.SEGMENTS[h.wire]; tip.innerHTML = `<b>${esc(s.label || '(no number)')}</b> ${esc(endTxt(s.from))} → ${esc(endTxt(s.to))}`; tip.style.display = 'block'; tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY + 12}px` }
  else tip.style.display = 'none'
})
lab.renderer.domElement.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY] })
lab.renderer.domElement.addEventListener('pointerup', (ev) => {
  if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 4) return
  const h = pick(ev)
  if (h?.wire !== undefined) { if (wm.on) wm.goTo(h.wire); else { selectWire(h.wire); ui.tab('wires', { wire: h.wire }) } }
  else if (h?.tag && h.tag !== 'Enclosure') { ui.tab('parts', { tag: h.tag }); focusTag(h.tag) }
})

// ------------------------------------------------------------------ wire selection and wire-by-wire mode
const selMat = MAT.plastic({ color: '#e8590c', roughness: 0.3, emissive: '#e8590c', emissiveIntensity: 0.35, finish: null })
const ghostMats = new Map()
let selWire = -1
function setDim(on) {
  // in wire mode every other conductor is a ghost, so the one being wired reads at a glance
  for (const w of WIRES) { if (!w) continue; for (const t of w.tubes) { if (!t.userData.mat0) t.userData.mat0 = t.material; const m0 = t.userData.mat0; if (on) { if (!ghostMats.has(m0)) { const g = m0.clone(); g.transparent = true; g.opacity = 0.13; g.depthWrite = false; ghostMats.set(m0, g) } t.material = ghostMats.get(m0) } else t.material = m0 } }
  markerMat.transparent = on; markerMat.opacity = on ? 0.2 : 1; markerMat.needsUpdate = true
}
function selectWire(i, { fly = true } = {}) {
  selWire = i
  for (const [k, w] of WIRES.entries()) { if (!w) continue; for (const t of w.tubes) { if (!t.userData.mat0) t.userData.mat0 = t.material; if (k === i) t.material = w.cable && t !== w.tubes[0] ? t.userData.mat0 : selMat; else if (!wm.on) t.material = t.userData.mat0 } }
  ringG.clear(); tags.setEnds([])
  const w = WIRES[i]
  if (i >= 0 && w) {
    if (G.STEPS[cur].show.includes('enc') && !VIEW.noFront) doorTarget = 1           // a selected wire is never behind a closed door
    const st = stepIndex(w.step)
    if (st > cur || !GROUPS.wires.visible) { cur = st; applyVisibility(G.STEPS[st], st) }
    // pulsing rings and labels at both ends
    const ends = []
    const s = w.s
    const clampOf = (p) => p && !p.exit ? P(p.X, p.Y, p.z) : null
    const pa = w.cable ? (w.cores?.find((c) => c.which === 'a')?.p) : w.ends[0], pb = w.cable ? (w.cores?.find((c) => c.which === 'b')?.p) : w.ends[1]
    for (const [p, lbl, e] of [[pa, 'A', s.from], [pb, 'B', s.to]]) {
      const c = clampOf(p)
      if (c) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0055, 0.0009, 8, 28), ringMat); ring.position.copy(c); ring.position.z += 0.004; ring.renderOrder = 12; ringG.add(ring); ends.push({ html: `<b>${lbl}</b> ${esc(endTxt(e))}`, world: () => lab.machine.localToWorld(c.clone()) }) }
      else if (e.dev === 'HMI1' || e.dev === 'E-STOP') ends.push({ html: `<b>${lbl}</b> ${esc(endTxt(e))} (door)`, world: () => doorL.localToWorld(DEV[e.dev].local.clone()) })
    }
    tags.setEnds(ends)
    if (fly) {
      // frame both ends (the clamps, not the whole duct run) without turning the model
      const pts = []; for (const p of [pa, pb]) if (p && !p.exit) pts.push(P(p.X, p.Y, p.z))
      if (pts.length < 2) pts.push(...w.curve.getPoints(24))
      focusOn(pts, 1.25)
    }
  }
}
const store = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem('vfd200-guide-v2') || '{}') } catch { s = {} } return { get: (k) => s[k], set: (k, v) => { s[k] = v; try { localStorage.setItem('vfd200-guide-v2', JSON.stringify(s)) } catch {} } } })()
const wm = {
  on: false, list: [], i: 0, filter: '',
  build() {
    const segs = G.SEGMENTS.map((s, i) => ({ s, i, w: WIRES[i] })).filter((x) => x.w && (!this.filter || x.s.step === this.filter))
    // a sensible bench order: by step, then left to right, top to bottom on the plate from the first end
    const key = (x) => { const p = x.w.ends[0]; return [stepIndex(x.s.step), p?.exit ? 2000 : Math.round((p?.Y ?? 2000) / 120), p?.X ?? 0] }
    segs.sort((a, b) => { const ka = key(a), kb = key(b); return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2] })
    this.list = segs.map((x) => x.i); this.i = clamp(this.i, 0, Math.max(0, this.list.length - 1))
  },
  enter(filter) { this.on = true; if (filter !== undefined) this.filter = filter; this.build(); setDim(true); this.show() },
  exit() { this.on = false; setDim(false); selectWire(-1, { fly: false }); ringG.clear(); tags.setEnds([]) },
  show() { const i = this.list[this.i]; if (i === undefined) return; selectWire(i); ui.render() },
  goTo(segIdx) { const k = this.list.indexOf(segIdx); if (k >= 0) { this.i = k; this.show() } },
  next() { this.i = Math.min(this.list.length - 1, this.i + 1); this.show() },
  prev() { this.i = Math.max(0, this.i - 1); this.show() },
  done(segIdx, v) { const d = store.get('wired') ?? {}; d[G.SEGMENTS[segIdx].id] = v; store.set('wired', d) },
  isDone(segIdx) { return !!(store.get('wired') ?? {})[G.SEGMENTS[segIdx].id] },
}

// ------------------------------------------------------------------ the guide panel
const endTxt = (e) => {
  const t = String(e.term ?? ''), field = t.endsWith(':field'), tt = t.replace(/:field$/, '')
  if (/^TB\d$/.test(e.dev)) return `${e.dev}-${tt}${field ? ' (field side)' : ''}`
  return `${e.dev}${tt ? ' ' + tt : ''}`
}
const BOMBY = Object.fromEntries(G.BOM.map((b) => [b.pn, b]))
const DOCS = G.DOCS ?? {}
const lenMm = (w) => w ? Math.round(w.len * 1000 / 10) * 10 + 150 : null
function refLinks(pn) {
  const out = [], d = DOCS[pn]
  if (d?.partslib) for (const x of d.partslib) out.push(`<a href="${esc(x.url)}" target="_blank" rel="noopener" class="pl">${x.title.startsWith('PartsLib') ? '' : 'PartsLib · '}${esc(x.title)}</a>`)
  else out.push(`<a href="${esc(G.PL_URL)}/#/search?q=${encodeURIComponent(pn)}" target="_blank" rel="noopener" class="pl">PartsLib: search ${esc(pn)}</a>`)
  if (d?.web) for (const x of d.web) out.push(`<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${x.verified ? 'Opened and checked' : 'Found by search, not opened: check it'}">${esc(x.title)}${x.doc_number ? ` <span class="dn">${esc(x.doc_number)}</span>` : ''}${x.verified ? '' : ' <span class="dn">(unchecked)</span>'}</a>`)
  return out.join('')
}
function factsFor(pn) { const d = DOCS[pn]; return d?.facts?.length ? `<ul class="facts">${d.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '' }
function partCard(pn, tags) {
  const b = BOMBY[pn] ?? { pn, desc: '', mfr: '' }
  return `<div class="part"><div class="ph"><b>${esc(tags ?? b.where)}</b><span class="pn">${esc(pn)}</span></div>
    <div class="pd">${esc(b.mfr)} · ${esc(b.desc)}${b.qty ? ` · qty ${esc(b.qty)}` : ''}</div>${factsFor(pn)}<div class="refs">${refLinks(pn)}</div></div>`
}
// every terminal of a device with what lands on it
function terminalRows(tag) {
  const rows = []
  G.SEGMENTS.forEach((s, i) => {
    const w = WIRES[i]
    const add = (end, other, pinSide) => { if (end.dev === tag || (tag === 'GB1' && end.dev === 'GND BAR')) rows.push({ i, term: end.term ? String(end.term).replace(/:field$/, '') + (String(end.term).endsWith(':field') ? ' (field)' : '') : (pinSide?.pin ?? ''), label: s.label, other: endTxt(other), awg: s.awg, kind: w?.kind ?? s.kind }) }
    if (s.cores?.length) s.cores.forEach((k) => { add(k.from, k.to); add(k.to, k.from) })
    else { add(s.from, s.to, w?.ends[0]); add(s.to, s.from, w?.ends[1]) }
  })
  const num = (t) => { const m = /\d+/.exec(t); return m ? Number(m[0]) : 0 }
  return rows.sort((a, b) => String(a.term).localeCompare(String(b.term), undefined, { numeric: true }) || num(a.term) - num(b.term))
}
function endBlock(label, e, p, s, w) {
  const sp = p && !p.exit ? specFor(p.dev, p.pin) : null
  const et = p && !p.exit ? endType(p, s.awg, w?.kind) : null
  const loc = p?.exit ? (p.door ? 'On the door: run along the left wall to the hinge, then across the door' : p.offplate === 'A/C' ? 'To the A/C terminal box on the left wall' : p.sub2 ? 'To VM1 on subplate 2 (left wall)' : 'Leaves the panel through the bottom duct: connected on site') : p?.where
  return `<div class="endb"><div class="eh"><span class="ab">${label}</span><b>${esc(endTxt(e))}</b>${p?.conf === 'approx' ? '<span class="apx" title="Terminal position not visible on the drawing: placed per the manual">approx</span>' : ''}</div>
    ${loc ? `<div class="el">${esc(loc)}</div>` : ''}${et ? `<div class="el">End: ${esc(et.text)}</div>` : ''}${sp?.text ? `<div class="el sp">${esc(sp.text)}</div>` : ''}</div>`
}
const segs = G.SEGMENTS
const ui = (() => {
  const Pnl = document.getElementById('g-panel')
  let tabName = 'steps', opts = {}
  function stepsHTML() {
    const st = G.STEPS[cur], ph = G.PHASES.find((p) => p.id === st.phase)
    const done = store.get('done') ?? {}
    const tasks = st.tasks.map((t, k) => { const id = `${st.id}:${k}`; return `<label class="task"><input type="checkbox" data-task="${id}" ${done[id] ? 'checked' : ''}><span>${esc(t)}</span></label>` }).join('')
    const parts = (st.parts ?? []).map((pn) => partCard(pn)).join('')
    const list = G.SEGMENTS.map((s, i) => i).filter((i) => WIRES[i] && segs[i].step === st.id)
    const nDone = list.filter((i) => wm.isDone(i)).length
    const outline = G.PHASES.map((p) => `<div class="ph-n">${esc(p.name)}</div>` + G.STEPS.map((s, i) => s.phase !== p.id ? '' : `<button class="ol ${i === cur ? 'cur' : ''} ${G.STEPS[i].tasks.every((_, k) => done[`${s.id}:${k}`]) ? 'ok' : ''}" data-step="${i}"><span>${i + 1}</span>${esc(s.title)}</button>`).join('')).join('')
    return `<div class="stephead"><div class="kick">Step ${cur + 1} of ${G.STEPS.length} · ${esc(ph?.name)}</div><h2>${esc(st.title)}</h2>${st.why ? `<p class="why">${esc(st.why)}</p>` : ''}</div>
      ${list.length ? `<section class="wirecta"><div><b>${list.length}</b> conductors and cables · <b>${nDone}</b> done</div><div class="prog sm"><div style="width:${list.length ? nDone / list.length * 100 : 0}%"></div></div><button class="btn" data-wm="${st.id}">Wire them one by one →</button></section>` : ''}
      <section><h3>Do this</h3>${tasks}</section>
      ${st.flags?.length ? `<section class="flags"><h3>Check with engineering</h3>${st.flags.map((f) => `<p>${esc(f)}</p>`).join('')}</section>` : ''}
      ${parts ? `<section><h3>Parts and references</h3>${parts}</section>` : ''}
      <details class="outline"><summary>All steps</summary>${outline}</details>`
  }
  function wireModeHTML() {
    const i = wm.list[wm.i], s = segs[i], w = WIRES[i]
    const stepsOpt = G.STEPS.filter((x) => x.wires).map((x) => `<option value="${x.id}" ${wm.filter === x.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')
    const nDone = wm.list.filter((k) => wm.isDone(k)).length
    if (!s) return `<div class="wtools"><select data-wmstep><option value="">All wiring steps</option>${stepsOpt}</select></div><p class="muted">No wires in this selection.</p>`
    const coresTxt = w?.cores?.length ? `<div class="cores">${w.cores.map((c) => `<span><i class="sw" style="background:${c.colour}"></i>${esc(c.name)} ${esc(c.k.potential)}: ${esc(endTxt(c.which === 'a' ? c.k.from : c.k.to))}</span>`).join('')}</div>` : ''
    const listHTML = wm.list.map((k, n) => `<button class="wl ${n === wm.i ? 'cur' : ''} ${wm.isDone(k) ? 'ok' : ''}" data-wmgo="${n}"><span class="sw" style="background:${WC[WIRES[k]?.kind]?.hex ?? '#888'}"></span><b>${esc(segs[k].label || '—')}</b> <span class="muted">${esc(endTxt(segs[k].from))} → ${esc(endTxt(segs[k].to))}</span></button>`).join('')
    return `<div class="wtools"><select data-wmstep><option value="">All wiring steps</option>${stepsOpt}</select><button class="btn ghost" data-wmexit>Done</button></div>
      <div class="wmprog"><div class="prog"><div style="width:${wm.list.length ? nDone / wm.list.length * 100 : 0}%"></div></div><span>${nDone} of ${wm.list.length} done · wire ${wm.i + 1} of ${wm.list.length}</span></div>
      <div class="wcard ${wm.isDone(i) ? 'isdone' : ''}">
        <div class="wmk"><span class="sleeve">${esc(s.label || 'no number')}</span><span class="sw big" style="background:${WC[w.kind]?.hex}"></span><div><b>${esc(s.awg ? (/×/.test(s.awg) ? s.awg : s.awg + ' AWG') : (w.kind === 'eth' ? 'Ethernet patch cord' : 'size not printed'))}</b> · ${esc(WC[w.kind]?.name ?? '')}<br><span class="muted">cut about ${lenMm(w)} mm · sheet ${s.sheet}${s.line ? `, line ${esc(s.line)}` : ''}${s.potential ? ` · ${esc(s.potential)}` : ''}</span></div></div>
        ${endBlock('A', s.from, w.cable ? w.cores?.find((c) => c.which === 'a')?.p ?? w.ends[0] : w.ends[0], s, w)}
        ${endBlock('B', s.to, w.cable ? w.cores?.find((c) => c.which === 'b')?.p ?? w.ends[1] : w.ends[1], s, w)}
        ${coresTxt}
        ${w.ducts?.length ? `<div class="route">Route: ${w.ducts.map((d) => `<span>${d}</span>`).join(' → ')}</div>` : ''}
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        <div class="wbtn"><button data-wmprev ${wm.i === 0 ? 'disabled' : ''}>← Prev</button><button class="pri" data-wmdone>${wm.isDone(i) ? 'Undo done' : '✓ Done, next'}</button><button data-wmnext ${wm.i >= wm.list.length - 1 ? 'disabled' : ''}>Next →</button></div>
      </div>
      <details class="wlist" open><summary>All ${wm.list.length} in this selection</summary><div class="wls">${listHTML}</div></details>`
  }
  function partsHTML() {
    const q = (opts.q ?? '').toLowerCase()
    const rows = G.BOM.filter((b) => !q || `${b.pn} ${b.where} ${b.desc} ${b.mfr}`.toLowerCase().includes(q))
    const sel = opts.tag ? G.DEVICES.find((d) => d.tag === opts.tag) : null
    let head = ''
    if (sel || opts.tag === 'GB1') {
      const d = sel ?? { tag: 'GB1', pn: 'D167-14' }
      const tr = terminalRows(d.tag)
      const lay = LAYOUTS[DEVICE_LAYOUT[d.tag]]
      head = `<section class="selpart"><h3>${esc(d.tag)}</h3>${partCard(d.pn, d.tag)}${(d.also ?? []).map((pn) => partCard(pn)).join('')}
        ${d.note ? `<p class="note">${esc(d.note)}</p>` : ''}
        <p class="muted small">Body: ${d.depth ? `${d.depth} mm deep${d.rail ? ' above the rail' : ''}` : ''} ${d.depthNote ? `(${esc(d.depthNote)})` : ''}${lay ? ` · terminal positions: ${esc(lay.conf)} (${esc(lay.src)})` : ''}</p>
        ${tr.length ? `<h3>Terminations (${tr.length})</h3><table class="wt"><thead><tr><th>Term.</th><th>Marker</th><th>Goes to</th><th></th></tr></thead><tbody>${tr.map((r) => `<tr data-wire="${r.i}"><td>${esc(r.term)}</td><td><span class="sw" style="background:${WC[r.kind]?.hex ?? '#888'}"></span><b>${esc(r.label || '—')}</b></td><td>${esc(r.other)}</td><td>${wm.isDone(r.i) ? '✓' : ''}</td></tr>`).join('')}</tbody></table>` : ''}
        ${sel ? `<button class="lnk" data-step="${stepIndex(sel.step)}">Go to its step →</button>` : ''}</section>`
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
      <p class="muted small">About ${ferr} ferrules. Lengths are the routed length plus 75 mm a side: order to them, cut long and trim at the terminal.</p>`
  }
  function wiresHTML() {
    const q = (opts.q ?? '').toLowerCase(), sf = opts.step ?? ''
    const rows = segs.map((s, i) => ({ s, i })).filter(({ s }) => (!sf || s.step === sf) && (!q || `${s.label} ${endTxt(s.from)} ${endTxt(s.to)} ${s.potential}`.toLowerCase().includes(q)))
    const stepsOpt = G.STEPS.filter((s) => s.wires).map((s) => `<option value="${s.id}" ${sf === s.id ? 'selected' : ''}>${esc(s.title)}</option>`).join('')
    return `<div class="wtools"><select data-wstep><option value="">All wiring steps</option>${stepsOpt}</select><input class="search" placeholder="W29, CB1, TB4-12…" value="${esc(opts.q ?? '')}" data-q></div>
      <div class="wtools"><button class="btn" data-csv>Marker list (CSV)</button><button class="btn ghost" data-print>Print run sheet</button><button class="btn ghost" data-wm="${sf}">Wire one by one</button></div>
      <details class="cutl"><summary>Cut list</summary>${cutList()}</details>
      <table class="wt"><thead><tr><th>Marker</th><th>AWG</th><th>From</th><th>To</th><th>✓</th></tr></thead><tbody>
      ${rows.map(({ s, i }) => { const w = WIRES[i]; return `<tr data-wire="${i}" class="${i === selWire ? 'sel' : ''} ${w ? '' : 'nodraw'}"><td><span class="sw" style="background:${WC[w?.kind ?? kindOf(s)]?.hex}"></span><b>${esc(s.label || '—')}</b></td><td>${esc(s.awg ?? '')}</td><td>${esc(endTxt(s.from))}</td><td>${esc(endTxt(s.to))}</td><td>${wm.isDone(i) ? '✓' : ''}</td></tr>` }).join('')}
      </tbody></table>${opts.wire !== undefined ? wireDetail(opts.wire) : ''}`
  }
  function wireDetail(i) {
    const s = segs[i], w = WIRES[i]; if (!s || !w) return ''
    return `<div class="wdet"><h3>${esc(s.label || '(no number on the drawing)')}</h3>
      ${endBlock('A', s.from, w.cable ? w.cores?.find((c) => c.which === 'a')?.p ?? w.ends[0] : w.ends[0], s, w)}${endBlock('B', s.to, w.cable ? w.cores?.find((c) => c.which === 'b')?.p ?? w.ends[1] : w.ends[1], s, w)}
      <p class="muted">${s.awg ? `${esc(s.awg)} AWG · ` : ''}${WC[w.kind]?.name ?? ''} (assumed) · sheet ${s.sheet}${s.line ? `, line ${esc(s.line)}` : ''} · cut about ${lenMm(w)} mm${w.ducts?.length ? ` · ${w.ducts.join(' → ')}` : ''}</p>
      ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}</div>`
  }
  function issuesHTML() {
    const fl = G.STEPS.flatMap((s, i) => (s.flags ?? []).map((f) => ({ f, i })))
    const shared = DUCT_SHARED.length ? [`Power and control share ducts. 520-UM001 p.37 asks for control and signal wires at least 0.3 m (1 ft) from power wires. With the ducts drawn on sheet 3, and routing that keeps AC and DC apart wherever it can (site wiring left out), these ducts still carry both: ${DUCT_SHARED.map((d) => `${d.duct}: ${d.ac.length} AC (${d.ac.slice(0, 4).join(', ')}${d.ac.length > 4 ? ' …' : ''}) with ${d.dc.length} DC/signal`).join('; ')}. Add a duct or divider, or accept and note it.`] : []
    return `<section><h3>Design issues <span class="cnt">${G.DESIGN_ISSUES.length + shared.length}</span></h3><p class="muted small">For the engineer who drew the panel: drawing and BOM problems found while building this guide.</p>
      ${[...G.DESIGN_ISSUES, ...shared].map((f) => `<div class="iss"><p>${esc(f)}</p></div>`).join('')}
      ${fl.length ? `<p class="muted small">Raised at a step:</p>${fl.map(({ f, i }) => `<div class="iss"><p>${esc(f)}</p><button class="lnk" data-step="${i}">Step ${i + 1} →</button></div>`).join('')}` : ''}</section>
      <section><h3>Modeling issues <span class="cnt">${G.MODELING_ISSUES.length}</span></h3><p class="muted small">How this guide models what the drawings leave open, and what was done about it.</p>
      ${G.MODELING_ISSUES.map((m) => `<div class="iss"><p><span class="pill ${m.status}">${m.status}</span> ${esc(m.text)}</p><p class="muted small">${esc(m.how)}</p></div>`).join('')}</section>`
  }
  function render() {
    Pnl.querySelector('.tabs').innerHTML = [['steps', 'Build steps'], ['wire', 'Wire it'], ['parts', 'Parts'], ['wires', 'Wires'], ['issues', 'Issues']].map(([k, t]) => `<button data-tab="${k}" class="${k === tabName ? 'on' : ''}">${t}</button>`).join('')
    const body = Pnl.querySelector('.body')
    const sc = body.scrollTop
    body.innerHTML = tabName === 'steps' ? stepsHTML() : tabName === 'wire' ? wireModeHTML() : tabName === 'parts' ? partsHTML() : tabName === 'wires' ? wiresHTML() : issuesHTML()
    if (tabName === opts._lastTab) body.scrollTop = sc; else body.scrollTop = 0
    opts._lastTab = tabName
    const nav = Pnl.querySelector('.nav')
    nav.innerHTML = `<button data-prev ${cur === 0 ? 'disabled' : ''}>← Back</button><div class="prog"><div style="width:${((cur + 1) / G.STEPS.length) * 100}%"></div></div><button data-next class="pri" ${cur === G.STEPS.length - 1 ? 'disabled' : ''}>Next step →</button>`
    nav.style.display = tabName === 'wire' ? 'none' : ''
    if (opts.focusQ) { const i = body.querySelector('[data-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length) } opts.focusQ = false }
    if (tabName === 'wire') { body.scrollTop = 0; const lst = body.querySelector('.wlist .wls'), it = lst?.querySelector('.wl.cur'); if (lst && it) lst.scrollTop = it.offsetTop - lst.offsetTop - 60 }
    else { const sel = body.querySelector('tr.sel'); if (sel && opts.scrollSel) { sel.scrollIntoView({ block: 'nearest' }); opts.scrollSel = false } }
  }
  const setTab = (k, o = {}) => { if (tabName === 'wire' && k !== 'wire') wm.exit(); tabName = k; opts = { ...o, _lastTab: opts._lastTab, scrollSel: true }; if (k === 'wire') wm.enter(o.filter); else render() }
  Pnl.addEventListener('click', (e) => {
    const t = e.target.closest('button, tr[data-wire]'); if (!t) return
    if (t.dataset.tab) setTab(t.dataset.tab)
    else if (t.dataset.step !== undefined) { setTab('steps'); showStep(Number(t.dataset.step)) }
    else if (t.hasAttribute('data-prev')) { setTab('steps'); showStep(cur - 1) }
    else if (t.hasAttribute('data-next')) { setTab('steps'); showStep(cur + 1) }
    else if (t.dataset.wm !== undefined) { setTab('wire', { filter: t.dataset.wm }) }
    else if (t.hasAttribute('data-wmnext')) wm.next()
    else if (t.hasAttribute('data-wmprev')) wm.prev()
    else if (t.hasAttribute('data-wmdone')) { const i = wm.list[wm.i]; const was = wm.isDone(i); wm.done(i, !was); if (!was && wm.i < wm.list.length - 1) wm.next(); else render() }
    else if (t.dataset.wmgo !== undefined) { wm.i = Number(t.dataset.wmgo); wm.show() }
    else if (t.hasAttribute('data-wmexit')) setTab('steps')
    else if (t.dataset.wire !== undefined) { const i = Number(t.dataset.wire); if (tabName === 'parts') { setTab('wires', { wire: i }); selectWire(i) } else { opts.wire = i; selectWire(i); render() } }
    else if (t.hasAttribute('data-csv')) csv()
    else if (t.hasAttribute('data-print')) printSheet()
  })
  Pnl.addEventListener('change', (e) => {
    const t = e.target
    if (t.dataset.task) { const d = store.get('done') ?? {}; d[t.dataset.task] = t.checked; store.set('done', d) }
    if (t.hasAttribute('data-wstep')) { opts.step = t.value; render() }
    if (t.hasAttribute('data-wmstep')) { wm.i = 0; wm.enter(t.value) }
  })
  Pnl.addEventListener('input', (e) => { if (e.target.hasAttribute('data-q')) { opts.q = e.target.value; opts.focusQ = true; render() } })
  function csv() {
    const rows = [['marker', 'awg', 'colour (assumed)', 'from', 'from terminal position', 'to', 'to terminal position', 'end A', 'end B', 'route', 'potential', 'sheet', 'line', 'step', 'approx cut length mm', 'note']]
    segs.forEach((s, i) => { const w = WIRES[i]; rows.push([s.label, s.awg ?? '', w ? WC[w.kind]?.name ?? '' : '', endTxt(s.from), w?.ends[0]?.where ?? '', endTxt(s.to), w?.ends[1]?.where ?? '', w ? endType(w.ends[0], s.awg, w.kind)?.text ?? '' : '', w ? endType(w.ends[1], s.awg, w.kind)?.text ?? '' : '', w?.ducts?.join(' > ') ?? '', s.potential ?? '', s.sheet ?? '', s.line ?? '', s.step, lenMm(w) ?? '', s.note ?? '']) })
    const text = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = 'VFD200 wire markers.csv'; a.click()
  }
  function printSheet() {
    const box = document.getElementById('g-print')
    const by = G.STEPS.filter((s) => s.wires)
    box.innerHTML = `<h1>VFD 200 wiring run sheet</h1><p>${esc(G.JOB.number)} · ${esc(G.JOB.project)} · from ${esc(G.JOB.drawing)} rev ${esc(G.JOB.rev)} · assembly guide V${esc(G.VERSION)}. Colours assumed; lengths approximate.</p>` +
      by.map((st) => `<h2>${esc(st.title)}</h2><table><thead><tr><th>✓</th><th>Marker</th><th>AWG</th><th>From</th><th>To</th><th>Ends</th><th>Route</th><th>mm</th></tr></thead><tbody>${segs.map((s, i) => ({ s, i, w: WIRES[i] })).filter((x) => x.w && x.s.step === st.id).map(({ s, i, w }) => `<tr><td>${wm.isDone(i) ? '☑' : '☐'}</td><td><b>${esc(s.label || '—')}</b></td><td>${esc(s.awg ?? '')}</td><td>${esc(endTxt(s.from))}<br><small>${esc(w.ends[0]?.where ?? '')}</small></td><td>${esc(endTxt(s.to))}<br><small>${esc(w.ends[1]?.where ?? '')}</small></td><td><small>${esc(endType(w.ends[0], s.awg, w.kind)?.k ?? '')} / ${esc(endType(w.ends[1], s.awg, w.kind)?.k ?? '')}</small></td><td><small>${esc(w.ducts?.join(' › ') ?? '')}</small></td><td>${lenMm(w)}</td></tr>`).join('')}</tbody></table>`).join('')
    window.print()
  }
  return { render, tab: setTab, get name() { return tabName } }
})()

// view toolbar: take the front off, reset the camera to the step's view
function toggleFront(on) { VIEW.noFront = on ?? !VIEW.noFront; applyFront() }
document.getElementById('g-view').innerHTML = `<button data-front title="Take the doors and the whole front frame off for a clear view inside (F)">Remove front <kbd>F</kbd></button><button data-reset title="Back to this step's view (R)">Reset view <kbd>R</kbd></button>`
document.getElementById('g-view').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-front')) toggleFront(); if (b.hasAttribute('data-reset')) flyTo(G.STEPS[cur].view) })
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
  if (e.key === 'f' || e.key === 'F') { toggleFront(); return }
  if (e.key === 'r' || e.key === 'R') { flyTo(G.STEPS[cur].view); return }
  if (wm.on) { if (e.key === 'ArrowRight') { wm.next(); e.preventDefault() } if (e.key === 'ArrowLeft') { wm.prev(); e.preventDefault() } if (e.key === 'Enter') { document.querySelector('[data-wmdone]')?.click(); e.preventDefault() } return }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { showStep(cur + 1); e.preventDefault() }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { showStep(cur - 1); e.preventDefault() }
})
document.getElementById('g-head').innerHTML = `<div class="job">${esc(G.JOB.number)} · ${esc(G.JOB.project)}</div><h1>${esc(G.JOB.panel)} <i>assembly guide</i> <span class="ver">V${esc(G.VERSION)}</span></h1><div class="src">From ${esc(G.JOB.drawing)}, rev ${esc(G.JOB.rev)}, ${G.JOB.sheets} sheets</div>`

// ------------------------------------------------------------------ go
lab.start()
lab._assembly = 0
const qs = new URLSearchParams(location.search)
const s0 = Number(qs.get('step') ?? 1) - 1
showStep(clamp(isNaN(s0) ? 0 : s0, 0, G.STEPS.length - 1), { fly: false })
lab.setView(G.STEPS[cur].view); lab.view.frameX = -0.2; lab._applyView(lab.view)
window.guide = { lab, showStep, WIRES, DEV, selectWire, ui, wm, DUCT_SHARED, term, focusTag, toggleFront }
