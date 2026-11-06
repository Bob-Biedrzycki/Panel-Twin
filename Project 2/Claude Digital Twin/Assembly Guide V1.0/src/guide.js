// VFD 200 assembly guide: the 3D panel, built step by step, with every wire routed and labelled.
// Data comes from src/layout.mjs and data/*.json, inlined by build.mjs as window.GUIDE.
const { THREE, Lab, MAT, GEO, clamp, lerp } = window.LabKit
const G = window.GUIDE
const { ENC } = G

// ------------------------------------------------------------------ frame: metres, Y up, the floor at 0, the back wall at z = 0
const { W, HB, D, T, HOOD, Y0, SW, SH } = ENC
const SLOPE = Math.atan2(HOOD, D)
const SPZ = T + 0.025, PZ = SPZ + 0.00266                     // subplate back and front faces (collar studs 25 mm)
const RZ = PZ + 0.0075                                        // top of a 35 x 7.5 rail
const SX = (X) => -SW / 2 + X / 1000                          // sheet 3 ordinates (mm from the plate's top left)
const SY = (Y) => Y0 + 0.051 + SH - Y / 1000
const topY = (z) => Y0 + HB + HOOD - z * Math.tan(SLOPE)

const lab = new Lab({
  prompt: '', no: 1, title: 'VFD 200', sub: 'assembly guide',
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
const loader = new THREE.TextureLoader()
const texCache = {}
function faceTex(key) {
  if (texCache[key]) return texCache[key]
  const t = loader.load(G.TEX[key].url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return (texCache[key] = t)
}
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t }

// ------------------------------------------------------------------ materials
const M = {
  ss: MAT.stainless({ roughness: 0.3, color: [0.66, 0.655, 0.64] }),
  ssDoor: MAT.stainless({ roughness: 0.26, color: [0.67, 0.665, 0.65], rep: [1, 6] }),
  leg: MAT.paint({ color: [0.3, 0.31, 0.32], roughness: 0.6, clearcoat: 0.05 }),
  sub: MAT.paint({ color: [0.9, 0.9, 0.88], roughness: 0.5, clearcoat: 0.1 }),
  duct: MAT.plastic({ color: [0.9, 0.905, 0.89], roughness: 0.55 }),
  rail: MAT.steel({ color: [0.78, 0.76, 0.62], roughness: 0.3, finish: 'brushed' }),
  zinc: MAT.steel({ color: [0.62, 0.63, 0.64], roughness: 0.36, finish: 'cast' }),
  screw: MAT.steel({ roughness: 0.22, color: [0.66, 0.66, 0.66] }),
  black: MAT.plastic({ color: [0.025, 0.025, 0.028], roughness: 0.4 }),
  grey: MAT.plastic({ color: '#7d8083', roughness: 0.45 }),
  red: MAT.plastic({ color: [0.75, 0.03, 0.03], roughness: 0.28, clearcoat: 0.6 }),
  yellow: MAT.plastic({ color: [0.95, 0.75, 0.05], roughness: 0.4 }),
  gasket: MAT.rubber(),
  hole: MAT.plastic({ color: [0.01, 0.01, 0.012], roughness: 0.9, finish: null }),
}
const bodyMats = {}
const bodyMat = (hex, metal) => bodyMats[hex + (metal ? 'm' : '')] ??= metal ? MAT.steel({ color: hex, roughness: 0.35, finish: 'cast' }) : MAT.plastic({ color: hex, roughness: 0.48 })
const faceMats = {}
function faceMat(key, tint) {
  const k = key + (tint ?? '')
  return faceMats[k] ??= MAT.plastic({ color: tint ?? '#ffffff', map: faceTex(key), roughness: 0.46, finish: null, alphaTest: 0.35, side: THREE.FrontSide })
}

// ------------------------------------------------------------------ scene groups (shown/hidden per step)
const GROUPS = {}
// plain groups under lab.machine (lab.add would force them visible every frame)
function grp(name, parent) { const g = new THREE.Group(); g.name = name; (parent ?? lab.machine).add(g); GROUPS[name] = g; return g }
const encG = grp('enc'), standG = grp('stand'), doorsG = grp('doors'), cutG = grp('cutouts'), acG = grp('ac'), handleG = grp('handle')
const plateG = grp('plate'), ductG = grp('duct'), coverG = grp('covers'), railsG = grp('rails'), sub2G = grp('sub2'), wiresG = grp('wires'), doorDevG = grp('door')
const STEP_GROUPS = {}
for (const s of ['power', 'rail1', 'drives', 't1', 'rail3', 'rail4']) STEP_GROUPS[s] = grp(s)

// ------------------------------------------------------------------ the enclosure: SCE-60XEL4918SSST (60 x 49 x 18 in)
{
  const g = []
  g.push(box(W, HB + HOOD, T, 0, Y0 + (HB + HOOD) / 2, T / 2, 0))
  g.push(box(W, T, D, 0, Y0 + T / 2, D / 2, 0))
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape(); sh.moveTo(0, Y0); sh.lineTo(D, Y0); sh.lineTo(D, Y0 + HB); sh.lineTo(0, Y0 + HB + HOOD); sh.closePath()
    if (s < 0) { sh.holes.push(holeOf(rect(0.2, 0.14, 0.004, D * 0.5, 1.39))); sh.holes.push(holeOf(rect(0.2, 0.14, 0.004, D * 0.5, 1.05))) }
    const sg = GEO.extrude(sh, T - 0.0002, 0.0001); sg.rotateY(-Math.PI / 2); g.push(at(sg, s * (W / 2 - T / 2) + (s < 0 ? T : 0) * 0, 0, 0))
  }
  const L = (D + 0.022) / Math.cos(SLOPE)
  const top = box(W + 0.006, T, L, 0, 0, L / 2, 0); top.rotateX(SLOPE); top.translate(0, Y0 + HB + HOOD + T / 2, 0); g.push(top)
  g.push(box(W + 0.006, 0.016, T, 0, Y0 + HB - 0.022 * Math.tan(SLOPE) - 0.008, D + 0.022, 0))
  const fr = rect(W, HB, 0, 0, Y0 + HB / 2)
  fr.holes.push(holeOf(rect(0.533, HB - 0.07, 0.004, -0.3255, Y0 + HB / 2)), holeOf(rect(0.535, HB - 0.07, 0.004, 0.2805, Y0 + HB / 2)))
  g.push(plate(fr, T, D - 0.022 - T / 2))
  for (const x of [-W / 2 + 0.006, W / 2 - 0.006]) g.push(box(0.012, HB, 0.022, x, Y0 + HB / 2, D - 0.011, 0))
  g.push(box(0.032, HB - 0.02, 0.026, -0.023, Y0 + HB / 2, D - 0.013, 0.002))       // removable centre post
  g.push(box(0.054, HB - 0.02, 0.012, 0.595, Y0 + HB / 2, D - 0.006, 0.002))        // right flange (disconnect handle)
  encG.add(mesh(g, M.ss))
  const eyes = []
  for (const x of [-0.575, 0.575]) { const z = 0.2, y = topY(z); eyes.push(at(new THREE.TorusGeometry(0.024, 0.006, 12, 32), x, y + 0.042, z), cyl(0.011, 0.02, x, y + 0.01, z, 'y', 6)) }
  encG.add(mesh(eyes, M.zinc))
  // collar studs for subplate 1
  const studs = []; for (const x of [-SW / 2 + 0.025, SW / 2 - 0.025]) for (const y of [SY(25), SY(711), SY(1397)]) studs.push(cyl(0.0048, 0.03, x, y, T + 0.015, 'z', 12))
  encG.add(mesh(studs, M.zinc))
  const lg = []
  for (const s of [-1, 1]) { const x = s * (W / 2 - 0.06); lg.push(box(0.12, 0.15, D, x, 0.075, D / 2, 0.004)); lg.push(box(0.14, 0.012, D + 0.02, x, 0.006, D / 2, 0.003)) }
  lg.push(box(W - 0.24, 0.1, 0.006, 0, 0.1, D - 0.04, 0.002))
  standG.add(mesh(lg, M.leg))
}

// doors: left hinged on the left edge, right hinged on the right edge (sheet 2 draws the right door as a copy of the left: flagged)
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
  // left door panel with the HMI and E-STOP holes (cut in step 2)
  const sh = rect(wl, HB - 0.05, 0.002, wl / 2, Y0 + HB / 2)
  const hmiC = [wl - 0.287 + 0.1345 - 0.13, 1.4]                       // HMI centre: 287 mm from the door's inner edge to the cutout's far edge
  // sheet 2: display centre 1400 mm from the floor and 287 mm from the door's centre-post edge; E-STOP 138 mm from that edge
  hmiHole = { x: wl - 0.287, y: 1.4, w: 0.269, h: 0.224 }
  estopHole = { x: wl - 0.138, y: 1.097, r: 0.0152 }
  const solid = doorPanel(wl, 1)
  doorL.add(mesh(solid, M.ssDoor))
  doorR.add(mesh(doorPanel(wr, -1), M.ssDoor))
  void hmiC; void sh
  // handles (three-point latch) and hinges
  const hd = []
  hd.push(box(0.04, 0.11, 0.02, wl - 0.07, 0.95, 0.012, 0.008), box(0.016, 0.1, 0.022, wl - 0.07, 0.87, 0.024, 0.006))
  doorL.add(mesh(hd, M.black))
  const hd2 = []
  hd2.push(box(0.04, 0.11, 0.02, -wr + 0.07, 0.95, 0.012, 0.008), box(0.016, 0.1, 0.022, -wr + 0.07, 0.87, 0.024, 0.006))
  doorR.add(mesh(hd2, M.black))
  const hg = []; for (const y of [0.35, 0.8, 1.25, 1.62]) { hg.push(cyl(0.007, 0.06, -0.006, y, -0.004, 'y', 12)); hg.push(cyl(0.007, 0.06, 0.006, y, -0.004, 'y', 12)) }
  doorsG.add(mesh(hg.map((g, i) => at(g.clone(), i % 2 ? W / 2 - 0.05 : -W / 2 + 0.024, 0, DOOR_Z)), M.ss))
  // cutouts (dark rectangles until the devices go in)
  cutG.add(mesh([box(hmiHole.w, hmiHole.h, 0.004, hmiHole.x, hmiHole.y, 0.0015, 0)], M.hole))
  cutG.add(mesh([cyl(estopHole.r, 0.004, estopHole.x, estopHole.y, 0.0015, 'z', 32)], M.hole))
  doorL.add(cutG)
}

// A/C on the left side wall: Enviro-Therm 1000 BTU/h, 18.9 x 10.00 x 7.5 in side mount (AutomationDirect cut sheet).
// Its position is not drawn: centred on the wall's upper half here.
{
  const x = -W / 2 - 0.0953, g = []
  g.push(box(0.1905, 0.48, 0.254, x, 1.2, D * 0.5, 0.008))
  const grill = []; for (let k = 0; k < 11; k++) grill.push(box(0.004, 0.012, 0.2, x - 0.096, 1.03 + k * 0.026, D * 0.5, 0.001))
  acG.add(mesh(g, MAT.stainless({ roughness: 0.24, color: [0.68, 0.675, 0.66], rep: [1, 3] })), mesh(grill, M.grey))
  const lb = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#e9e8e3'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = '700 26px Inter, sans-serif'; c.fillText('ENVIRO-THERM', 12, 30); c.font = '500 18px Inter, sans-serif'; c.fillText('1000 BTU/h  120 V', 12, 54) })
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), MAT.plastic({ color: '#ffffff', map: lb, finish: null }))
  pl.rotation.y = -Math.PI / 2; pl.position.set(x - 0.0958, 1.37, D * 0.5); acG.add(pl)
}
// disconnect handle on the right flange
{
  const hh = [box(0.044, 0.16, 0.022, 0.595, 1.413, D + 0.011, 0.006)]
  handleG.add(mesh(hh, M.grey))
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

// ------------------------------------------------------------------ wireway (Panduit F2X2WH6 / F3X2WH6), as drawn on sheet 3
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
  return { body: body.map(tr), cover: cover.map(tr) }
}
{
  const runs = G.DUCTS.map((d) => duct(d.r))
  ductG.add(mesh(runs.flatMap((r) => r.body), M.duct))
  coverG.add(mesh(runs.flatMap((r) => r.cover), M.duct))
}

// ------------------------------------------------------------------ DIN rails (RS PRO 467-416, 35 x 7.5 slotted)
const RAILP = [[-0.0175, 0.0075], [-0.0115, 0.0075], [-0.0115, 0.001], [0.0115, 0.001], [0.0115, 0.0075], [0.0175, 0.0075], [0.0175, 0.0065], [0.0125, 0.0065], [0.0125, 0], [-0.0125, 0], [-0.0125, 0.0065], [-0.0175, 0.0065]]
{
  const g = [], slots = []
  for (const r of Object.values(G.RAILS)) {
    g.push(railProfile(RAILP, (r.x1 - r.x0) / 1000, SX((r.x0 + r.x1) / 2), SY(r.y)))
    for (let x = r.x0 + 12; x < r.x1 - 10; x += 25) slots.push(box(0.015, 0.0052, 0.0006, SX(x), SY(r.y), PZ + 0.0012, 0.0006))
  }
  railsG.add(mesh(g, M.rail), mesh(slots, M.hole))
}

// ------------------------------------------------------------------ devices
const DEV = {}                      // tag -> { d, rect (mm), z0, z1, obj, group }
const pickables = []
function devRect(d) {
  if (d.r) return { X0: d.r[0], X1: d.r[1], Yt: d.r[2], Yb: d.r[3] }
  const t = G.TEX[d.tex]; return { X0: t.X0, X1: t.X1, Yt: t.Yt, Yb: t.Yb }
}
function addDevice(d) {
  const parent = d.at === 'sub1' ? STEP_GROUPS[d.step] : null
  if (!parent) return
  const r = devRect(d)
  const x0 = SX(r.X0), x1 = SX(r.X1), yT = SY(r.Yt), yB = SY(r.Yb), w = x1 - x0, h = yT - yB, xc = (x0 + x1) / 2, yc = (yT + yB) / 2
  const z0 = d.rail ? RZ : PZ, dep = d.depth / 1000, z1 = z0 + dep
  const o = new THREE.Group(); o.name = d.tag
  const bm = bodyMat(d.body ?? '#cccccc', d.metal)
  // body: rounded block, stepped like a DIN device (narrower base under a full-width front) where it sits on a rail
  if (d.rail) {
    o.add(mesh([box(w - 0.001, h * 0.62, dep * 0.55, xc, yc, z0 + dep * 0.275, 0.0015)], bm))
    o.add(mesh([box(w - 0.0006, h - 0.001, dep * 0.47, xc, yc, z0 + dep * 0.765, 0.0025)], bm))
    o.add(mesh([box(Math.min(0.012, w * 0.4), 0.008, 0.006, xc, yB + 0.004, z0 + 0.004, 0.001)], M.grey))     // rail latch
  } else o.add(mesh([box(w - 0.001, h - 0.001, dep, xc, yc, z0 + dep / 2, Math.min(0.006, dep * 0.08))], bm))
  // the manufacturer's face from the drawing
  const face = new THREE.Mesh(at(new THREE.PlaneGeometry(w, h), xc, yc, z1 + 0.0004), faceMat(d.tex, d.face === 'line' ? d.body : undefined))
  face.receiveShadow = true; o.add(face)
  parent.add(o)
  DEV[d.tag] = { d, r, x0, x1, yT, yB, xc, yc, z0, z1, obj: o }
  o.traverse((m) => { if (m.isMesh) { m.userData.tag = d.tag; pickables.push(m) } })
}
function addStrip(d) {
  const s = d.strip, rail = G.RAILS[d.rail], yc = SY(rail.y), h = s.h / 1000, dep = s.depth / 1000
  const parent = STEP_GROUPS[d.step]
  const body = [], faces = [], screws = [], marks = []
  const TBP = [[-h / 2, 0.0075], [h / 2, 0.0075], [h / 2, dep * 0.62], [h * 0.32, dep], [h * 0.12, dep], [h * 0.12, dep * 0.93], [-h * 0.12, dep * 0.93], [-h * 0.12, dep], [-h * 0.32, dep], [-h / 2, dep * 0.62]]
  const xs = []
  for (let i = 0; i < s.n; i++) {
    const X = s.x0 + s.pitch * (i + 0.5), x = SX(X); xs.push(X)
    body.push(railProfile(TBP, s.pitch / 1000, x, yc))
    const f = at(new THREE.PlaneGeometry(s.pitch / 1000 - 0.0003, h * 0.98), x, yc, PZ + dep + 0.0003)
    if (s.slices) { const uv = f.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (uv.getX(k) + (i % s.slices)) / s.slices) }
    faces.push(f)
    for (const sg of [-1, 1]) screws.push(cyl(0.0018, 0.002, x, yc + sg * h * 0.36, PZ + dep * 0.66 + 0.002, 'z', 10))
    marks.push(box(s.pitch / 1000 - 0.0012, 0.006, 0.001, x, yc, PZ + dep * 0.93 + 0.0006, 0))
  }
  const o = new THREE.Group(); o.name = d.tag
  o.add(mesh(body, bodyMat('#9a9b98')), mesh(screws, M.screw), mesh(marks, bodyMat('#f2f2ee')))
  const fm = faceMat(s.tex); o.add(new THREE.Mesh(GEO.merge(faces), fm))
  // terminal numbers on the marker strips
  const n = s.n, lt = canvasTex(Math.min(4096, n * 64), 64, (c, w, hh) => { c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, hh); c.fillStyle = '#111'; c.font = `700 ${Math.min(40, 64 * 0.62)}px Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < n; i++) { c.save(); c.translate((i + 0.5) * (w / n), hh / 2); c.rotate(-Math.PI / 2); c.fillText(String(i + 1), 0, 2); c.restore() } })
  const lp = new THREE.Mesh(at(new THREE.PlaneGeometry(SX(s.x0 + s.pitch * n) - SX(s.x0), 0.0058), (SX(s.x0) + SX(s.x0 + s.pitch * n)) / 2, yc, PZ + dep * 0.93 + 0.0012), MAT.plastic({ color: '#ffffff', map: lt, finish: null }))
  o.add(lp)
  parent.add(o)
  const X0 = s.x0, X1 = s.x0 + s.pitch * s.n
  DEV[d.tag] = { d, r: { X0, X1, Yt: rail.y - s.h / 2, Yb: rail.y + s.h / 2 }, x0: SX(X0), x1: SX(X1), yT: yc + h / 2, yB: yc - h / 2, xc: (SX(X0) + SX(X1)) / 2, yc, z0: PZ, z1: PZ + dep, obj: o, xs }
  o.traverse((m) => { if (m.isMesh) { m.userData.tag = d.tag; pickables.push(m) } })
}
for (const d of G.DEVICES) { if (d.strip) addStrip(d); else if (d.at === 'sub1') addDevice(d) }

// end anchors (1492-EAJ35), from the drawing's anchor face
{
  for (const [rk, list] of Object.entries(G.ANCHORS)) {
    const rail = G.RAILS[rk], yc = SY(rail.y), g = [], f = []
    for (const X of list) {
      const x = SX(X + 4)
      g.push(railProfile([[-0.0275, 0.0075], [0.0275, 0.0075], [0.0275, 0.024], [0.01, 0.034], [-0.01, 0.034], [-0.0275, 0.024]], 0.008, x, yc))
      f.push(at(new THREE.PlaneGeometry(0.0079, 0.055), x, yc, PZ + 0.0345))
    }
    const step = rk === 'r1' ? 'rail1' : rk === 'r3' ? 'rail3' : 'rail4'
    STEP_GROUPS[step].add(mesh(g, bodyMat('#5b5d5f')), new THREE.Mesh(GEO.merge(f), faceMat('ANCHOR')))
  }
}

// RCP1 1492-REC15: on sheet 6, no position on sheet 3. Drawn as a dashed outline in the open space on rail 4.
{
  const X0 = 900, X1 = 945, rail = G.RAILS.r4, yc = SY(rail.y)
  const g = new THREE.BoxGeometry(SX(X1) - SX(X0), 0.075, 0.06)
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineDashedMaterial({ color: 0xc26a00, dashSize: 0.006, gapSize: 0.004 }))
  e.computeLineDistances(); e.position.set((SX(X0) + SX(X1)) / 2, yc, RZ + 0.03); STEP_GROUPS.rail4.add(e)
  DEV.RCP1 = { d: { tag: 'RCP1', pn: '1492-REC15', ghost: true }, r: { X0, X1, Yt: rail.y - 37, Yb: rail.y + 37 }, x0: SX(X0), x1: SX(X1), yT: yc + 0.0375, yB: yc - 0.0375, xc: (SX(X0) + SX(X1)) / 2, yc, z0: RZ, z1: RZ + 0.06, obj: e }
}

// GB1 ground bar on 14 numbered taps; Lug1
// (faces come from the drawing; taps used in the order the wire list grounds them)

// ------------------------------------------------------------------ subplate 2 (SCE-16P14) on the left side wall, VM1 on angled brackets
const SUB2 = { x: -W / 2 + T + 0.004, y: 0.58, z: D * 0.42 }
{
  const g = new THREE.Group(); g.position.set(SUB2.x, SUB2.y, SUB2.z); g.rotation.y = Math.PI / 2; sub2G.add(g)
  g.add(mesh([box(0.381, 0.33, 0.00266, 0, 0, 0.00133, 0)], M.sub))
  // two DN-ASB2-10 brackets 20 mm in from the sides, 50 mm stand-off, rail across them
  const bt = faceMat('BRACKET')
  for (const s of [-1, 1]) {
    g.add(mesh([box(0.024, 0.08, 0.05, s * 0.155, 0, 0.026, 0.002)], M.zinc))
    g.add(new THREE.Mesh(at(new THREE.PlaneGeometry(0.0253, 0.079), s * 0.155, 0, 0.0512), bt))
  }
  g.add(mesh([railProfile(RAILP, 0.34, 0, 0, 0.051).applyMatrix4(new THREE.Matrix4())], M.rail))
  const t = G.TEX.VM1, w = (t.X1 - t.X0) / 1000, h = (t.Yb - t.Yt) / 1000, dep = 0.11
  const vm = new THREE.Group()
  vm.add(mesh([box(w - 0.002, h - 0.002, dep, 0, 0, 0.0585 + dep / 2, 0.003)], bodyMat('#8e9194')))
  vm.add(new THREE.Mesh(at(new THREE.PlaneGeometry(w, h), 0, 0, 0.0585 + dep + 0.0004), faceMat('VM1')))
  g.add(vm)
  g.traverse((m) => { if (m.isMesh) { m.userData.tag = 'VM1'; pickables.push(m) } })
  const wp = new THREE.Vector3();
  DEV.VM1 = { d: G.DEVICES.find((x) => x.tag === 'VM1'), sub2: true, obj: vm, group: g, world: wp }
}

// ------------------------------------------------------------------ door devices: HMI1 PanelView Plus 7 and the E-STOP
{
  const hw = 0.3, hh = 0.26                                // bezel envelope round the 269 x 224 mm cutout (approx)
  const g = new THREE.Group(); doorL.add(g); doorDevG.userData.real = g
  const bez = mesh([box(hw, hh, 0.012, hmiHole.x, hmiHole.y, 0.0028 + 0.006, 0.006)], M.grey)
  const scr = new THREE.Mesh(at(new THREE.PlaneGeometry(hw * 0.985, hh * 0.985), hmiHole.x, hmiHole.y, 0.0028 + 0.0122), faceMat('HMI1'))
  const back = mesh([box(0.27, 0.22, 0.06, hmiHole.x, hmiHole.y, -0.03, 0.004)], M.black)
  g.add(bez, scr, back)
  const es = new THREE.Group(); es.position.set(estopHole.x, estopHole.y, 0.0028)
  es.add(mesh([cyl(0.024, 0.006, 0, 0, 0.003, 'z', 40)], M.yellow))
  es.add(mesh([cyl(0.017, 0.022, 0, 0, 0.017, 'z', 32)], M.black))
  es.add(mesh([GEO.lathe([[0, 0], [0.03, 0], [0.03, 0.006], [0.026, 0.016], [0.012, 0.021], [0, 0.022]], 48).rotateX(Math.PI / 2).translate(0, 0, 0.028)], M.red))
  es.add(mesh([box(0.04, 0.04, 0.045, 0, 0, -0.024, 0.003)], M.black))
  g.add(es)
  const lb = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#ffd400'; c.fillRect(0, 0, w, h); c.fillStyle = '#000'; c.font = '800 34px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('EMERGENCY STOP', w / 2, 44) })
  const leg = new THREE.Mesh(at(new THREE.PlaneGeometry(0.07, 0.0175), estopHole.x, estopHole.y - 0.042, 0.0034), MAT.plastic({ color: '#ffffff', map: lb, finish: null }))
  g.add(leg)
  g.traverse((m) => { if (m.isMesh) { m.userData.tag = m === leg || es.children.includes(m) ? 'E-STOP' : 'HMI1'; pickables.push(m) } })
  es.traverse((m) => { if (m.isMesh) m.userData.tag = 'E-STOP' })
  DEV.HMI1 = { d: G.DEVICES.find((x) => x.tag === 'HMI1'), door: true, local: V3(hmiHole.x, hmiHole.y - 0.05, -0.06) }
  DEV['E-STOP'] = { d: G.DEVICES.find((x) => x.tag === 'E-STOP'), door: true, local: V3(estopHole.x, estopHole.y, -0.045) }
}
acG.traverse((m) => { if (m.isMesh) { m.userData.tag = 'A/C'; pickables.push(m) } })
encG.traverse((m) => { if (m.isMesh) { m.userData.tag = 'Enclosure'; pickables.push(m) } })

// ------------------------------------------------------------------ terminals: where each named terminal sits on its device
// returns { X, Y (mm on subplate 1), z (m), side: 'up' | 'down' } or a special endpoint
const clean = (t) => String(t ?? '').replace(/\s*\(.*\)\s*$/, '').trim()
function onFace(dev, u, v, zf = 0.86) { const X = dev.r.X0 + u * (dev.r.X1 - dev.r.X0), Y = dev.r.Yt + v * (dev.r.Yb - dev.r.Yt); return { X, Y, z: dev.z0 + (dev.z1 - dev.z0) * zf, side: v < 0.5 ? 'up' : 'down' } }
const GB_TAPS = { next: 0, map: {} }
function gbTap(key) { if (GB_TAPS.map[key] === undefined) GB_TAPS.map[key] = GB_TAPS.next++; const k = GB_TAPS.map[key] % 14; const dv = DEV.GB1; return { X: (dv.r.X0 + dv.r.X1) / 2, Y: dv.r.Yt + 8 + k * 11.6, z: dv.z1, side: 'left' } }
function term(devTag, rawTerm, key) {
  const t = clean(rawTerm), dv = DEV[devTag]
  if (devTag === 'GND BAR' || devTag === 'GB1') return gbTap(key)
  if (!dv) return null
  const tag = devTag
  if (dv.d.strip) {
    const m = /^(\d+)\s*(?:\((T|B)\))?/.exec(String(rawTerm ?? '').trim()); const i = m ? Number(m[1]) - 1 : 0
    const X = dv.r.X0 + dv.d.strip.pitch * (i + 0.5), rail = G.RAILS[dv.d.rail].y, hh = dv.d.strip.h
    const level = m?.[2]
    const inside = tag === 'TB1' ? 'down' : 'up'
    const field = String(rawTerm ?? '').includes(':field') || key?.endsWith(':field')
    const side = field ? (inside === 'up' ? 'down' : 'up') : inside
    const dy = (side === 'up' ? -1 : 1) * hh * (level === 'B' ? 0.22 : 0.36)
    return { X, Y: rail + dy, z: PZ + dv.d.strip.depth / 1000 * (level === 'B' ? 0.5 : 0.66), side }
  }
  const P = (u, v, zf) => onFace(dv, u, v, zf)
  switch (tag) {
    case 'Q1': return P({ '2T1': 0.3, '4T2': 0.5, '6T3': 0.7 }[t] ?? 0.5, 0.88, 0.7)
    case 'FU1': return P({ L1: 0.2, L2: 0.5, L3: 0.8, T1: 0.2, T2: 0.5, T3: 0.8 }[t] ?? 0.5, t.startsWith('L') ? 0.08 : 0.92, 0.75)
    case 'PDB1': {
      if (/^L[123]$/.test(t)) return P({ L1: 0.2, L2: 0.5, L3: 0.8 }[t], 0.32, 0.9)
      const m = /^L([123])-(\d)/.exec(t); const pole = m ? Number(m[1]) : 1, n = m ? Number(m[2]) : 1
      return P([0.2, 0.5, 0.8][pole - 1] + ((n - 1) % 4 - 1.5) * 0.045, n <= 4 ? 0.62 : 0.74, 0.9)
    }
    case 'CB1': case 'CB2': case 'CB3':
      return P({ L1: 0.2, L2: 0.5, L3: 0.8, T1: 0.2, T2: 0.5, T3: 0.8 }[t] ?? 0.5, t.startsWith('L') ? 0.06 : 0.94)
    case 'FU2': return P(0.5, t === '1L1' ? 0.05 : 0.95)
    case 'CB5': return P(0.5, t === 'L1' ? 0.05 : 0.95)
    case 'DRV1': case 'DRV2': {
      const pw = { L1: 0.1, L2: 0.19, L3: 0.28, T1: 0.5, T2: 0.59, T3: 0.68, PE: 0.86 }
      if (pw[t] !== undefined) return P(pw[t], 0.97, 0.45)
      const c = { S1: 0.28, S2: 0.34, '4': 0.42, 'S+': 0.22 }
      return P(c[t] ?? 0.3, 0.6, 0.98)
    }
    case 'PWS1': { const ins = { L1: 0.18, L2: 0.32, L3: 0.46, PE: 0.6 }; if (ins[t] !== undefined) return P(ins[t], 0.97); return P(t.startsWith('1') ? 0.2 : 0.55, 0.03) }
    case 'PWS2': return P({ '+24V DC': 0.25, 'DC COM': 0.45, 'FG / GND': 0.65 }[t] ?? 0.4, 0.06)
    case 'PLC1': return P(0.5, 0.95)
    case 'IO1': return P(0.5, t.startsWith('VAC') ? 0.25 : 0.4, 0.95)
    case 'CB4': { if (/^OUT\d/.test(t)) { const n = Number(t.slice(3)); return P(0.08 + (n - 1) * 0.12, 0.96) } return P(t.startsWith('DC24') ? 0.25 : t.includes('upper') ? 0.55 : 0.75, 0.04) }
    case 'PDB2': case 'PDB3': {
      if (t === 'IN') return P(0.06, 0.5, 0.9)
      const n = Number(t.replace('OUT', '')), per = tag === 'PDB2' ? 6 : 9
      return P(0.2 + ((n - 1) % per) * (0.75 / (per - 1)), n <= per ? 0.15 : 0.85, 0.9)
    }
    case 'CPL1': case 'CPL2': case 'CPL3': {
      if (t.startsWith('X31')) return P(t.endsWith('1') ? 0.62 : 0.8, 0.03)
      if (t.startsWith('X2')) return P(0.33, 0.46, 0.98)
      const m = /^X0(\d)-(\d)/.exec(t); const p = m ? Number(m[1]) : 1, pin = m ? Number(m[2]) : 1
      const top = p <= 4, i = (p - 1) % 4
      return P(0.12 + i * 0.22 + (pin - 2.5) * 0.03, top ? 0.04 : 0.96)
    }
    case 'SI1': case 'SI2': case 'SI3': case 'SI4': case 'SI5': case 'SI6': {
      const n = Number(t); const top = n <= 8
      return P(0.2 + ((n - 1) % 4) * 0.2, top ? 0.04 : 0.96)
    }
    case 'NS1': { if (t.startsWith('US')) return P(t === 'US+' ? 0.4 : 0.6, 0.98); const n = Number(t); return P(n % 2 ? 0.32 : 0.68, 0.06 + Math.floor((n - 1) / 2) * 0.11, 0.98) }
    case 'NS2': { if (t.startsWith('V')) return P(t === 'V+' ? 0.35 : 0.65, 0.03); return P(0.5, t === 'LAN' ? 0.78 : 0.56, 0.98) }
    case 'T1': {
      const h = /^H\d/.exec(t)?.[0] ?? (rawTerm?.includes('H1') ? 'H1' : rawTerm?.includes('H4') ? 'H4' : null)
      if (h) return P({ H1: 0.27, H3: 0.42, H2: 0.58, H4: 0.73 }[h], 0.12, 0.98)
      return P(rawTerm?.includes('X2') ? 0.42 : 0.58, 0.88, 0.98)
    }
    case 'RCP1': return P(t.includes('GND') ? 0.5 : t.startsWith('L1') ? 0.3 : 0.7, t.endsWith('1') || t === 'GND' ? 0.15 : 0.85, 0.9)
    default: return P(0.5, 0.5)
  }
}

// ------------------------------------------------------------------ wire routing through the duct graph (sheet 3 mm)
const DUCT = G.DUCTS.map((d) => { const [X0, X1, Yt, Yb] = d.r; const horiz = (X1 - X0) > (Yb - Yt); return { ...d, X0, X1, Yt, Yb, horiz, c: horiz ? (Yt + Yb) / 2 : (X0 + X1) / 2, a0: horiz ? X0 : Yt, a1: horiz ? X1 : Yb, half: horiz ? (Yb - Yt) / 2 : (X1 - X0) / 2 } })
// nodes: where centre lines meet (a horizontal duct crossing or touching a vertical one)
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
DUCT.forEach((d, i) => { const l = dn[i].slice().sort((a, b) => along(d, a) - along(d, b)); for (let k = 1; k < l.length; k++) { const a = l[k - 1], b = l[k], w = Math.abs(along(d, b) - along(d, a)); ADJ[a].push([b, w]); ADJ[b].push([a, w]) } })
function entry(p) {
  // the duct a wire drops into from a terminal: straight out of the terminal's side, nearest edge wins
  let best = null
  for (let i = 0; i < DUCT.length; i++) {
    const d = DUCT[i]
    let q = null, cost = 0
    if (p.X >= d.X0 && p.X <= d.X1 && p.Y >= d.Yt && p.Y <= d.Yb) {
      // already in this duct (exit points for the door, the A/C and subplate 2)
      q = d.horiz ? { X: p.X, Y: p.Y, cY: d.c } : { X: p.X, Y: p.Y, cX: d.c }; cost = -1
    } else if (d.horiz && p.X >= d.X0 + 3 && p.X <= d.X1 - 3) {
      const above = d.Yb <= p.Y + 2, below = d.Yt >= p.Y - 2
      if (above) { q = { X: p.X, Y: d.Yb, cY: d.c }; cost = p.Y - d.Yb + (p.side === 'down' ? 400 : 0) }
      else if (below) { q = { X: p.X, Y: d.Yt, cY: d.c }; cost = d.Yt - p.Y + (p.side === 'up' ? 400 : 0) }
    } else if (!d.horiz && p.Y >= d.Yt + 3 && p.Y <= d.Yb - 3) {
      const left = d.X1 <= p.X + 2, right = d.X0 >= p.X - 2
      if (left) { q = { X: d.X1, Y: p.Y, cX: d.c }; cost = p.X - d.X1 + 60 + (p.side === 'left' ? -50 : 0) }
      else if (right) { q = { X: d.X0, Y: p.Y, cX: d.c }; cost = d.X0 - p.X + 60 }
    }
    if (q && cost >= -1 && (!best || cost < best.cost)) best = { ...q, cost, i }
  }
  return best
}
function route(a, b) {
  const ea = entry(a), eb = entry(b)
  if (!ea || !eb) return null
  // temporary nodes on the two ducts
  const tmp = (e) => { const d = DUCT[e.i]; const x = d.horiz ? e.X : d.c, y = d.horiz ? d.c : e.Y; const i = NODES.length; NODES.push({ x, y }); ADJ.push([]); const l = dn[e.i]; for (const n of l) { const w = Math.abs(along(d, n) - (d.horiz ? x : y)); ADJ[i].push([n, w]) } return i }
  const na = tmp(ea), nb = tmp(eb)
  if (ea.i === eb.i) { const d = DUCT[ea.i]; const w = Math.abs((d.horiz ? NODES[na].x - NODES[nb].x : NODES[na].y - NODES[nb].y)); ADJ[na].push([nb, w]) }
  for (const [n, w] of ADJ[nb]) ADJ[n].push([nb, w])
  const dist = new Array(NODES.length).fill(Infinity), prev = new Array(NODES.length).fill(-1), done = new Set()
  dist[na] = 0
  for (;;) {
    let u = -1, best = Infinity; for (let i = 0; i < NODES.length; i++) if (!done.has(i) && dist[i] < best) { best = dist[i]; u = i }
    if (u < 0 || u === nb) break
    done.add(u)
    for (const [v, w] of ADJ[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u }
  }
  const path = []; for (let u = nb; u >= 0; u = prev[u]) path.unshift({ ...NODES[u] })
  // undo the temporary nodes
  for (const [n] of ADJ[nb]) ADJ[n] = ADJ[n].filter(([v]) => v !== nb)
  NODES.length -= 2; ADJ.length -= 2
  if (path.length < 1 || dist[nb] === Infinity) return null
  return { ea, eb, path, len: dist[nb] }
}
let LANE = 0
function wirePoints(a, b, lane) {
  const r = route(a, b); if (!r) return null
  const zl = PZ + 0.008 + (lane % 7) * 0.005, off = ((lane * 7) % 11 - 5) * 2.2           // depth and side lanes in the duct (mm)
  const P = (X, Y, z) => V3(SX(X), SY(Y), z)
  const pts = []
  const lead = (p, e) => {
    const out = []
    const dirY = e.cY !== undefined ? Math.sign(e.Y - p.Y) : 0, dirX = e.cX !== undefined ? Math.sign(e.X - p.X) : 0
    out.push(P(p.X, p.Y, p.z))
    out.push(P(p.X + dirX * 8, p.Y + dirY * 8, p.z + 0.004))
    out.push(P(e.X - dirX * 6, e.Y - dirY * 6, Math.max(PZ + 0.03, p.z - 0.01)))
    out.push(P(e.cX !== undefined ? e.cX + off : e.X, e.cY !== undefined ? e.cY + off : e.Y, zl))
    return out
  }
  pts.push(...lead(a, r.ea))
  // inside the duct: the polyline through the nodes, corners rounded over 18 mm, straights sampled every 60 mm,
  // so the spline hugs the duct instead of bulging past it
  const poly = [{ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y }, ...r.path.slice(1, -1).map((n) => ({ x: SX(n.x + off), y: SY(n.y + off) }))]
  const lb = lead(b, r.eb), endIn = lb[lb.length - 1]
  poly.push({ x: endIn.x, y: endIn.y })
  const dense = []
  for (let k = 1; k < poly.length; k++) {
    const p0 = poly[k - 1], p1 = poly[k], L = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    if (L < 1e-4) continue
    const ux = (p1.x - p0.x) / L, uy = (p1.y - p0.y) / L, cut = Math.min(0.018, L / 2.5)
    const n = Math.max(1, Math.floor((L - 2 * cut) / 0.06))
    for (let j = 0; j <= n; j++) { const t = cut + (L - 2 * cut) * (j / n); dense.push(V3(p0.x + ux * t, p0.y + uy * t, zl)) }
  }
  pts.push(...dense)
  pts.push(...lb.reverse())
  // drop near-duplicate points
  return pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 0.003)
}

// ------------------------------------------------------------------ wire colours (assumed convention: NFPA 79 / UL 508A practice, confirm with CPME standard)
const WC = {
  power: { hex: '#141414', name: 'black' }, hot120: { hex: '#b8191b', name: 'red' }, neutral: { hex: '#e9e9e4', name: 'white' },
  dc: { hex: '#1f4fb8', name: 'blue' }, dc0: { hex: '#cfe0f5', name: 'white/blue' }, gnd: { hex: '#2c8a3a', name: 'green/yellow' },
  iol: { hex: '#e6c21c', name: 'yellow jacket (LUTZE)' }, eth: { hex: '#2a9d8f', name: 'teal patch cord' }, field: { hex: '#4a4c4f', name: 'field cable' },
}
const wireMats = {}
const wmat = (k) => wireMats[k] ??= MAT.plastic({ color: WC[k].hex, roughness: 0.38, clearcoat: 0.25, finish: null })
const AWG_OD = { '4': 8.6, '6': 7.2, '8': 5.9, '10': 4.6, '12': 3.9, '14': 3.4, '16': 2.9, '18': 2.6 }   // MTW/THHN insulated OD, mm (typical)

// ------------------------------------------------------------------ markers: a texture atlas of wire numbers printed on white sleeves
const ATLAS = { c: document.createElement('canvas'), cells: new Map(), n: 0, cw: 64, ch: 256 }
ATLAS.c.width = 2048; ATLAS.c.height = 2048
const actx = ATLAS.c.getContext('2d'); actx.fillStyle = '#f7f7f2'; actx.fillRect(0, 0, 2048, 2048)
const atlasTex = new THREE.CanvasTexture(ATLAS.c); atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 8
function atlasCell(text) {
  if (ATLAS.cells.has(text)) return ATLAS.cells.get(text)
  const i = ATLAS.n++, cols = 2048 / ATLAS.cw, cx = (i % cols) * ATLAS.cw, cy = Math.floor(i / cols) * ATLAS.ch
  actx.save(); actx.fillStyle = '#f7f7f2'; actx.fillRect(cx, cy, ATLAS.cw, ATLAS.ch)
  actx.fillStyle = '#111'; actx.font = `700 ${text.length > 7 ? 26 : 34}px "JetBrains Mono", Consolas, monospace`; actx.textAlign = 'center'; actx.textBaseline = 'middle'
  for (const s of [0.25, 0.75]) { actx.save(); actx.translate(cx + ATLAS.cw * 0.5, cy + ATLAS.ch * s); actx.rotate(-Math.PI / 2); actx.fillText(text, 0, 2, ATLAS.ch * 0.46); actx.restore() }
  actx.restore()
  const cell = { u0: cx / 2048, u1: (cx + ATLAS.cw) / 2048, v0: 1 - (cy + ATLAS.ch) / 2048, v1: 1 - cy / 2048 }
  ATLAS.cells.set(text, cell); atlasTex.needsUpdate = true
  return cell
}
const markerMat = MAT.plastic({ color: '#ffffff', map: atlasTex, roughness: 0.55, finish: null })
function sleeve(curve, t, rad, text) {
  // a 14 mm heat-shrink marker, its text running along the wire, twice round the sleeve
  const p = curve.getPointAt(t), tg = curve.getTangentAt(t)
  const g = new THREE.CylinderGeometry(rad + 0.0007, rad + 0.0007, 0.014, 16, 1, true)
  const c = atlasCell(text), uv = g.attributes.uv
  for (let k = 0; k < uv.count; k++) { const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, lerp(c.u0, c.u1, (u * 2) % 1 || (u > 0.5 ? 1 : 0)), lerp(c.v0, c.v1, v)) }
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), tg)); g.translate(p.x, p.y, p.z)
  return g
}

// ------------------------------------------------------------------ build the wires
const WIRES = []                    // { seg, obj, mat, curve, step, ends: [p,p], doorPart }
const DOOR_EXIT = { X: 42, Y: 260 }                       // where door harness leaves the left riser (D1), sheet 3 mm
const AC_EXIT = { X: 42, Y: 140 }
const FIELD_EXIT = (X) => ({ X: clamp(X, 120, 1040), Y: 1440, z: PZ + 0.03, side: 'down', exit: true })
function endpoint(e, key, seg) {
  const dev = e.dev
  if (dev === 'Panel' || dev === 'ACU') return { ...AC_EXIT, z: PZ + 0.03, side: 'left', offplate: 'A/C', exit: true }
  if (dev === 'HMI1' || dev === 'E-STOP') return { ...DOOR_EXIT, z: PZ + 0.03, side: 'left', offplate: dev, exit: true, door: dev }
  if (dev === 'VM1') return { X: 30, Y: 1000, z: PZ + 0.03, side: 'left', offplate: 'VM1', exit: true, sub2: true }
  if (/^(MTR|FM|CE|LT|TT|SC|Plant)/.test(dev)) return null                        // field: handled by the caller
  return term(dev === 'GND BAR' ? 'GB1' : dev, e.term, key)
}
function kindOf(s) {
  if (s.kind === 'iol') return 'iol'
  if (s.kind === 'eth') return 'eth'
  if (s.kind === 'field') return 'field'
  const p = String(s.potential ?? ''), f = `${s.from.dev} ${s.from.term} ${s.to.dev} ${s.to.term}`
  if (p === 'GND' || /GND BAR/.test(f) && !/DC -|COM/.test(f)) return 'gnd'
  if (s.sheet === 4 && /^W(54)$/.test(s.wire)) return 'hot120'
  if (s.sheet === 4 && /^W(19)$/.test(s.wire)) return 'neutral'
  if (s.sheet <= 5 && !/S1|S2|Digital|E-STOP|TB5/.test(f)) return 'power'
  if (s.sheet === 6 || s.sheet === 4) return p === 'N' ? 'neutral' : 'hot120'
  if (/PDB3|0V|OUT-|DC COM|DC -|N24|Com|AIn-|AOut-|X31-1|V-|US-|\(lamp\)/.test(f) && !/X1 \(lamp\)/.test(f)) return 'dc0'
  return 'dc'
}
function buildSeg(s, idx) {
  const kind = kindOf(s)
  const key = s.id
  let a = endpoint(s.from, key + ':a', s), b = endpoint(s.to, key + ':b', s)
  // field ends stop at a terminal's field side when the wire list routes through one, else leave by the bottom duct
  if (s.via) { const [strip, n] = s.via; if (!a) a = term(strip, n, key + ':field'); else if (!b) b = term(strip, n, key + ':field') }
  if (!a && b) a = FIELD_EXIT(b.X)
  if (!b && a) b = FIELD_EXIT(a.X)
  if (!a || !b) return null
  if (s.from.dev === s.to.dev && !a.exit) {
    // a jumper on one device: a short arc between the two terminals
    const p1 = V3(SX(a.X), SY(a.Y), a.z), p2 = V3(SX(b.X), SY(b.Y), b.z)
    const mid = p1.clone().lerp(p2, 0.5).add(V3(0, (a.side === 'up' ? 1 : -1) * 0.012, 0.012))
    return finish(s, kind, [p1, mid, p2], idx)
  }
  const pts = wirePoints(a, b, idx); if (!pts) return null
  if (a.exit || b.exit) {
    const ex = a.exit ? a : b
    // off the plate: out of the left riser to the side wall, then along it (door harness to the hinge, A/C box, subplate 2)
    const wx = -W / 2 + T + 0.012, ey = SY(ex.Y)
    const tail = ex.offplate === 'A/C' ? [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, 1.3, D * 0.42), V3(wx, 1.2, D * 0.5)]
      : ex.sub2 ? [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, SUB2.y + 0.15, SUB2.z - 0.12), V3(SUB2.x + 0.07, SUB2.y + 0.06, SUB2.z - 0.1)]
      : ex.door ? [V3(SX(4), ey, PZ + 0.03), V3(wx, ey, PZ + 0.05), V3(wx, ey - 0.03, D - 0.12), V3(wx + 0.004, ey - 0.05, D - 0.05)]
      : [V3(SX(ex.X), SY(1432), PZ + 0.03), V3(SX(ex.X), SY(1490), PZ + 0.03)]           // cut off below the plate: "to field"
    if (a.exit) pts.unshift(...tail.slice().reverse()); else pts.push(...tail)
  }
  const w = finish(s, kind, pts, idx, a, b)
  const ex = [a, b].find((e) => e?.door)
  if (w && ex) {
    // the door side of the harness, carried by the door: from the hinge to the back of the device
    const dv = DEV[ex.door], ey = SY(ex.Y) - 0.05, l = dv.local, k = (idx % 9) * 0.003
    const dp = [V3(-0.0114, ey, -0.054), V3(0.03, ey - 0.03, -0.04), V3(0.06 + k, l.y + 0.06, -0.038), V3(l.x - 0.05, l.y + k, -0.034), V3(l.x, l.y, l.z)]
    const c = new THREE.CatmullRomCurve3(dp, false, 'centripetal', 0.5)
    const g = new THREE.TubeGeometry(c, 60, w.od / 2, 7, false)
    const o = new THREE.Mesh(g, wmat(kind)); o.castShadow = true; o.userData.wire = idx
    const mk = s.label ? new THREE.Mesh(sleeve(c, 0.93, w.od / 2, s.label), markerMat) : null
    const h = new THREE.Group(); h.add(o); if (mk) h.add(mk)
    doorDevG.userData.real.add(h); w.doorTube = o
  }
  return w
}
function finish(s, kind, pts, idx) {
  const od = (s.kind === 'iol' ? 5.6 : s.kind === 'eth' ? 5.8 : s.kind === 'field' ? 6.5 : AWG_OD[s.awg] ?? 3.4) / 1000
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5)
  const segs = Math.min(400, Math.max(24, Math.round(curve.getLength() / 0.006)))
  const g = new THREE.TubeGeometry(curve, segs, od / 2, s.awg === '4' ? 10 : 7, false)
  const m = wmat(kind)
  const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true
  o.userData.wire = idx
  const text = s.label
  const L = curve.getLength(), mk = []
  if (text) { mk.push(sleeve(curve, clamp(0.035 / L, 0.02, 0.4), od / 2, text)); mk.push(sleeve(curve, clamp(1 - 0.035 / L, 0.6, 0.98), od / 2, text)) }
  const mo = mk.length ? new THREE.Mesh(GEO.merge(mk), markerMat) : null
  const holder = new THREE.Group(); holder.add(o); if (mo) holder.add(mo)
  wiresG.add(holder)
  const w = { s, obj: holder, tube: o, kind, curve, step: s.step, len: L, od }
  WIRES[idx] = w
  return w
}
G.SEGMENTS.forEach((s, i) => { try { buildSeg(s, i) } catch (e) { console.warn('wire', s.id, e) } })

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

// ------------------------------------------------------------------ steps: what is visible, the camera, the doors
const ALL_SUB1 = ['plate', 'duct', 'rails', 'power', 'rail1', 'drives', 't1', 'rail3', 'rail4']
let doorOpen = 0, doorTarget = 0
let cur = 0, camTween = null
function showStep(i, { fly = true } = {}) {
  cur = clamp(i, 0, G.STEPS.length - 1)
  const st = G.STEPS[cur]
  const want = new Set(st.show.flatMap((k) => k === 'all-sub1' ? ALL_SUB1 : [k]))
  // subplate groups appear progressively: everything installed up to this step
  for (const k of ALL_SUB1) if (want.has(k)) for (const kk of ALL_SUB1.slice(0, ALL_SUB1.indexOf(k) + 1)) want.add(kk)
  const inEnc = want.has('enc')
  for (const [k, g] of Object.entries(GROUPS)) g.visible = want.has(k)
  if (st.wires || want.has('wires')) { GROUPS.wires.visible = true; for (const w of WIRES) if (w) w.obj.visible = stepIndex(w.step) <= cur }
  else GROUPS.wires.visible = false
  // door-side parts of door wires only once the door devices are in
  coverG.visible = want.has('covers')
  doorDevG.userData.real.visible = want.has('door')
  cutG.visible = want.has('cutouts') && !want.has('door')
  doorTarget = st.open ? 1 : 0
  if (!inEnc) doorTarget = 0
  hiG.clear()
  const tags = stepTags(st)
  if (!st.wires) for (const t of tags) { const dv = DEV[t]; const o = dv?.obj ?? (t === 'A/C' ? acG : null); if (o && o.visible !== false) { lab.machine.updateMatrixWorld(true); const e = outline(o); if (e) hiG.add(e) } }
  if (st.id === 'duct') { lab.machine.updateMatrixWorld(true); const e = outline(ductG); if (e) hiG.add(e) }
  if (st.id === 'rails') { lab.machine.updateMatrixWorld(true); const e = outline(railsG); if (e) hiG.add(e) }
  if (fly) flyTo(st.view)
  selectWire(-1)
  ui.render()
}
const stepIndex = (id) => G.STEPS.findIndex((s) => s.id === id)
function stepTags(st) { return G.DEVICES.filter((d) => d.step === st.id || (st.id === 'door' && d.at === 'door') || (st.id === 'ac' && d.tag === 'A/C')).map((d) => d.tag) }
function flyTo(v) {
  const from = { ...lab.view }, to = { ...lab.view, ...v, frameX: -0.2 }
  // shortest way round in azimuth
  const t0 = performance.now(), dur = 900
  camTween = { from, to, t0, dur }
}
lab.onTick((dt, l, rdt) => {
  if (camTween) {
    const k = clamp((performance.now() - camTween.t0) / camTween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    const f = camTween.from, t = camTween.to
    const v = { ...t, az: lerp(f.az, t.az, e), el: lerp(f.el, t.el, e), dist: lerp(f.dist, t.dist, e), fov: lerp(f.fov ?? 30, t.fov ?? 30, e), target: f.target.map((x, i) => lerp(x, t.target[i], e)) }
    lab.view = v; lab._applyView(v)
    if (k >= 1) camTween = null
  }
  doorOpen += (doorTarget - doorOpen) * Math.min(1, rdt * 3)
  doorL.rotation.y = -doorOpen * 1.9; doorR.rotation.y = doorOpen * 1.9
  hiMat.opacity = 0.55 + 0.4 * Math.sin(performance.now() / 260)
  tags.update()
})
// users' orbit interrupts a camera flight
lab.controlsOrbit.addEventListener('start', () => { camTween = null })

// ------------------------------------------------------------------ device tags on screen (current step, or hovered)
const tags = (() => {
  const layer = document.createElement('div'); layer.id = 'g-tags'; document.body.appendChild(layer)
  const els = new Map()
  let hover = null
  function el(tag) { if (!els.has(tag)) { const e = document.createElement('div'); e.className = 'g-tag'; e.textContent = tag; layer.appendChild(e); els.set(tag, e) } return els.get(tag) }
  function anchor(tag) {
    const dv = DEV[tag]; if (!dv) return null
    if (dv.door) { const p = V3(dv.local.x, dv.local.y + 0.1, 0.04); doorL.localToWorld(p); return p }
    if (dv.sub2) { const p = V3(0, 0.07, 0.2); dv.group.localToWorld(p); return p }
    const p = V3(dv.xc, dv.yT + 0.012, dv.z1); lab.machine.localToWorld(p); return p
  }
  function update() {
    const st = G.STEPS[cur], on = new Set(st.wires ? [] : stepTags(st)); if (hover) on.add(hover)
    for (const [t, e] of els) if (!on.has(t)) e.style.display = 'none'
    for (const t of on) {
      const p = anchor(t); if (!p) continue
      p.project(lab.camera); const e = el(t)
      if (p.z > 1) { e.style.display = 'none'; continue }
      e.style.display = 'block'; e.style.left = `${(p.x * 0.5 + 0.5) * innerWidth}px`; e.style.top = `${(-p.y * 0.5 + 0.5) * innerHeight}px`
      e.classList.toggle('hov', t === hover)
    }
  }
  return { update, setHover: (t) => { hover = t } }
})()

// ------------------------------------------------------------------ picking: hover shows the tag, click opens the part or the wire
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2()
let downAt = null
function pick(ev) {
  const r = lab.renderer.domElement.getBoundingClientRect()
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(mouse, lab.camera)
  const wireMeshes = WIRES.filter((w) => w && w.obj.visible && GROUPS.wires.visible).map((w) => w.tube)
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
  if (h?.wire !== undefined) { const s = WIRES[h.wire].s; tip.innerHTML = `<b>${s.label || '(no number)'}</b> ${esc(endTxt(s.from))} → ${esc(endTxt(s.to))}`; tip.style.display = 'block'; tip.style.left = `${ev.clientX + 14}px`; tip.style.top = `${ev.clientY + 12}px` }
  else tip.style.display = 'none'
})
lab.renderer.domElement.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY] })
lab.renderer.domElement.addEventListener('pointerup', (ev) => {
  if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 4) return
  const h = pick(ev)
  if (h?.wire !== undefined) { selectWire(h.wire); ui.tab('wires', { wire: h.wire }) }
  else if (h?.tag && h.tag !== 'Enclosure') ui.tab('parts', { tag: h.tag })
})

// ------------------------------------------------------------------ wire selection: the chosen wire in accent, the rest dimmed
const selMat = MAT.plastic({ color: '#e8590c', roughness: 0.3, emissive: '#e8590c', emissiveIntensity: 0.35, finish: null })
let selWire = -1
function selectWire(i) {
  selWire = i
  for (const [k, w] of WIRES.entries()) { if (!w) continue; w.tube.material = k === i ? selMat : wmat(w.kind); if (w.doorTube) w.doorTube.material = w.tube.material }
  if (i >= 0 && WIRES[i]) {
    const w = WIRES[i]; const st = stepIndex(w.step)
    if (st > cur || !GROUPS.wires.visible) showStep(st, { fly: false })
    const c = w.curve.getPointAt(0.5); const b = new THREE.Box3().setFromPoints(w.curve.getPoints(30)); const sz = b.getSize(V3()).length()
    flyTo({ target: [c.x, c.y, c.z], dist: clamp(sz * 0.9 + 0.25, 0.35, 1.4), az: lab.view.az, el: lab.view.el })
  }
}

// ------------------------------------------------------------------ the guide panel
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const endTxt = (e) => {
  const t = String(e.term ?? ''), field = t.endsWith(':field'), tt = t.replace(/:field$/, '')
  if (/^TB\d$/.test(e.dev)) return `${e.dev}-${tt}${field ? ' (field side)' : ''}`
  return `${e.dev}${tt ? ' ' + tt : ''}`
}
const BOMBY = Object.fromEntries(G.BOM.map((b) => [b.pn, b]))
const DOCS = G.DOCS ?? {}
const store = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem('vfd200-guide') || '{}') } catch { s = {} } return { get: (k) => s[k], set: (k, v) => { s[k] = v; try { localStorage.setItem('vfd200-guide', JSON.stringify(s)) } catch {} } } })()
function refLinks(pn) {
  const out = []
  const d = DOCS[pn]
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
const segs = G.SEGMENTS
const ui = (() => {
  const P = document.getElementById('g-panel')
  let tabName = 'steps', opts = {}
  function stepsHTML() {
    const st = G.STEPS[cur], ph = G.PHASES.find((p) => p.id === st.phase)
    const done = store.get('done') ?? {}
    const tasks = st.tasks.map((t, k) => { const id = `${st.id}:${k}`; return `<label class="task"><input type="checkbox" data-task="${id}" ${done[id] ? 'checked' : ''}><span>${esc(t)}</span></label>` }).join('')
    const parts = (st.parts ?? []).map((pn) => partCard(pn)).join('')
    const nW = WIRES.filter((w) => w && w.step === st.id).length
    const outline = G.PHASES.map((p) => `<div class="ph-n">${esc(p.name)}</div>` + G.STEPS.map((s, i) => s.phase !== p.id ? '' : `<button class="ol ${i === cur ? 'cur' : ''} ${G.STEPS[i].tasks.every((_, k) => done[`${s.id}:${k}`]) ? 'ok' : ''}" data-step="${i}"><span>${i + 1}</span>${esc(s.title)}</button>`).join('')).join('')
    return `<div class="stephead"><div class="kick">Step ${cur + 1} of ${G.STEPS.length} · ${esc(ph?.name)}</div><h2>${esc(st.title)}</h2>${st.why ? `<p class="why">${esc(st.why)}</p>` : ''}</div>
      <section><h3>Do this</h3>${tasks}</section>
      ${st.flags?.length ? `<section class="flags"><h3>Check with engineering</h3>${st.flags.map((f) => `<p>${esc(f)}</p>`).join('')}</section>` : ''}
      ${nW ? `<section><h3>Wires in this step</h3><p class="muted">${nW} conductors and cables, each labelled at both ends. <button class="lnk" data-wires="${st.id}">Open the wire list for this step →</button></p></section>` : ''}
      ${parts ? `<section><h3>Parts and references</h3>${parts}</section>` : ''}
      <details class="outline"><summary>All steps</summary>${outline}</details>`
  }
  function partsHTML() {
    const q = (opts.q ?? '').toLowerCase()
    const used = new Map()
    for (const d of G.DEVICES) { const l = used.get(d.pn) ?? []; l.push(d.tag); used.set(d.pn, l) }
    const rows = G.BOM.filter((b) => !q || `${b.pn} ${b.where} ${b.desc} ${b.mfr}`.toLowerCase().includes(q))
    const sel = opts.tag ? G.DEVICES.find((d) => d.tag === opts.tag) : null
    const head = sel ? `<section class="selpart"><h3>${esc(sel.tag)}</h3>${partCard(sel.pn, sel.tag)}${(sel.also ?? []).map((pn) => partCard(pn)).join('')}${sel.note ? `<p class="note">${esc(sel.note)}</p>` : ''}${sel.depthNote ? '<p class="muted small">Body depth drawn from the catalogue envelope (approximate).</p>' : ''}<button class="lnk" data-step="${stepIndex(sel.step)}">Go to its step →</button></section>` : ''
    return `${head}<input class="search" placeholder="Search part number, tag or description" value="${esc(opts.q ?? '')}" data-q>
      <div class="plist">${rows.map((b) => `<div class="prow ${b.field ? 'fieldp' : ''}">${partCard(b.pn)}${b.field ? '<div class="muted small">Field or skid item: not installed in this panel.</div>' : ''}</div>`).join('')}</div>`
  }
  function wiresHTML() {
    const q = (opts.q ?? '').toLowerCase(), sf = opts.step ?? ''
    const rows = segs.map((s, i) => ({ s, i })).filter(({ s }) => (!sf || s.step === sf) && (!q || `${s.label} ${endTxt(s.from)} ${endTxt(s.to)} ${s.potential}`.toLowerCase().includes(q)))
    const stepsOpt = G.STEPS.filter((s) => s.wires).map((s) => `<option value="${s.id}" ${sf === s.id ? 'selected' : ''}>${esc(s.title)}</option>`).join('')
    return `<div class="wtools"><select data-wstep><option value="">All wiring steps</option>${stepsOpt}</select><input class="search" placeholder="W29, CB1, TB4-12…" value="${esc(opts.q ?? '')}" data-q></div>
      <div class="wtools"><button class="btn" data-csv>Download marker list (CSV)</button><span class="muted small">${rows.length} rows · colours are an assumed convention</span></div>
      <table class="wt"><thead><tr><th>Marker</th><th>AWG</th><th>From</th><th>To</th><th>Sh.</th></tr></thead><tbody>
      ${rows.map(({ s, i }) => { const w = WIRES[i]; return `<tr data-wire="${i}" class="${i === selWire ? 'sel' : ''} ${w ? '' : 'nodraw'}"><td><span class="sw" style="background:${WC[w?.kind ?? kindOf(s)].hex}"></span><b>${esc(s.label || '—')}</b></td><td>${esc(s.awg ?? (s.kind === 'iol' ? '3×18' : ''))}</td><td>${esc(endTxt(s.from))}</td><td>${esc(endTxt(s.to))}</td><td>${s.sheet ?? ''}</td></tr>` }).join('')}
      </tbody></table>${opts.wire !== undefined ? wireDetail(opts.wire) : ''}`
  }
  function wireDetail(i) {
    const s = segs[i], w = WIRES[i]; if (!s) return ''
    return `<div class="wdet"><h3>${esc(s.label || '(no number on the drawing)')}</h3>
      <p>${esc(endTxt(s.from))} → ${esc(endTxt(s.to))}</p>
      <p class="muted">${s.awg ? `${esc(s.awg)} AWG · ` : ''}${w ? `${WC[w.kind].name} (assumed) · ` : ''}${s.potential ? `potential ${esc(s.potential)} · ` : ''}sheet ${s.sheet}${s.line ? `, line ${esc(s.line)}` : ''}${w ? ` · about ${Math.round(w.len * 1000 / 10) * 10 + 150} mm cut length incl. 75 mm each end` : ''}</p>
      ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}</div>`
  }
  function issuesHTML() {
    const fl = G.STEPS.flatMap((s, i) => (s.flags ?? []).map((f) => ({ f, i })))
    return `<section><h3>Drawing and BOM items to resolve</h3><p class="muted">Raised while building this guide from Draft rev18. None of them is changed in the guide without saying so.</p>
      ${fl.map(({ f, i }) => `<div class="iss"><p>${esc(f)}</p><button class="lnk" data-step="${i}">Step ${i + 1} →</button></div>`).join('')}
      ${(G.ISSUES ?? []).map((f) => `<div class="iss"><p>${esc(f)}</p></div>`).join('')}</section>`
  }
  function render() {
    P.querySelector('.tabs').innerHTML = [['steps', 'Build steps'], ['parts', 'Parts'], ['wires', 'Wires'], ['issues', 'Issues']].map(([k, t]) => `<button data-tab="${k}" class="${k === tabName ? 'on' : ''}">${t}</button>`).join('')
    const body = P.querySelector('.body')
    const sc = body.scrollTop
    body.innerHTML = tabName === 'steps' ? stepsHTML() : tabName === 'parts' ? partsHTML() : tabName === 'wires' ? wiresHTML() : issuesHTML()
    if (tabName === opts._lastTab) body.scrollTop = sc; else body.scrollTop = 0
    opts._lastTab = tabName
    const nav = P.querySelector('.nav')
    nav.innerHTML = `<button data-prev ${cur === 0 ? 'disabled' : ''}>← Back</button><div class="prog"><div style="width:${((cur + 1) / G.STEPS.length) * 100}%"></div></div><button data-next class="pri" ${cur === G.STEPS.length - 1 ? 'disabled' : ''}>Next step →</button>`
    if (opts.focusQ) { const i = body.querySelector('[data-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length) } opts.focusQ = false }
    const sel = body.querySelector('tr.sel'); if (sel && opts.scrollSel) { sel.scrollIntoView({ block: 'center' }); opts.scrollSel = false }
  }
  P.addEventListener('click', (e) => {
    const t = e.target.closest('button, tr[data-wire]'); if (!t) return
    if (t.dataset.tab) { tabName = t.dataset.tab; opts = { _lastTab: opts._lastTab }; render() }
    else if (t.dataset.step !== undefined) { tabName = 'steps'; showStep(Number(t.dataset.step)) }
    else if (t.hasAttribute('data-prev')) { tabName = 'steps'; showStep(cur - 1) }
    else if (t.hasAttribute('data-next')) { tabName = 'steps'; showStep(cur + 1) }
    else if (t.dataset.wires) { tabName = 'wires'; opts = { step: t.dataset.wires }; render() }
    else if (t.dataset.wire !== undefined) { const i = Number(t.dataset.wire); opts.wire = i; selectWire(i); render() }
    else if (t.hasAttribute('data-csv')) csv()
  })
  P.addEventListener('change', (e) => {
    const t = e.target
    if (t.dataset.task) { const d = store.get('done') ?? {}; d[t.dataset.task] = t.checked; store.set('done', d) }
    if (t.hasAttribute('data-wstep')) { opts.step = t.value; render() }
  })
  P.addEventListener('input', (e) => { if (e.target.hasAttribute('data-q')) { opts.q = e.target.value; opts.focusQ = true; render() } })
  function csv() {
    const rows = [['marker', 'awg', 'colour (assumed)', 'from', 'to', 'potential', 'sheet', 'line', 'step', 'approx cut length mm', 'note']]
    segs.forEach((s, i) => { const w = WIRES[i]; rows.push([s.label, s.awg ?? '', w ? WC[w.kind].name : '', endTxt(s.from), endTxt(s.to), s.potential ?? '', s.sheet ?? '', s.line ?? '', s.step, w ? Math.round(w.len * 1000 / 10) * 10 + 150 : '', s.note ?? '']) })
    const text = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = 'VFD200 wire markers.csv'; a.click()
  }
  return { render, tab: (k, o = {}) => { tabName = k; opts = { ...o, _lastTab: opts._lastTab, scrollSel: true }; render() } }
})()

// keyboard: arrows step through
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { showStep(cur + 1); e.preventDefault() }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { showStep(cur - 1); e.preventDefault() }
})
document.getElementById('g-head').innerHTML = `<div class="job">${esc(G.JOB.number)} · ${esc(G.JOB.project)}</div><h1>${esc(G.JOB.panel)} <i>assembly guide</i></h1><div class="src">From ${esc(G.JOB.drawing)}, rev ${esc(G.JOB.rev)}, ${G.JOB.sheets} sheets</div>`

// ------------------------------------------------------------------ go
lab.start()
lab._assembly = 0
const s0 = Number(new URLSearchParams(location.search).get('step') ?? 1) - 1
showStep(clamp(isNaN(s0) ? 0 : s0, 0, G.STEPS.length - 1), { fly: false })
lab.setView(G.STEPS[cur].view); lab.view.frameX = -0.2; lab._applyView(lab.view)
window.guide = { lab, showStep, WIRES, DEV, selectWire, ui }
