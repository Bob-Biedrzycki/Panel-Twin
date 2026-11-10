// V8 audit of the built guide. Serve the guide folder over http, open the guide, then in the console:
//   const A = await import('/tools/audit.js'); const r = A.run(); r.summary
// It walks every conductor from clamp to clamp and reports:
//   through   a wire passing through a solid (its own device beyond the clamp, or any other device), with the length inside
//   shared    conductor ends that sit in the same place (two wires drawn as one in a clamp)
//   kinks     bends tighter than the wire can make
//   behind    points behind the subplate face
//   notFound  ends whose opening was not found on the model (placed behind the screw instead)
//   overlap   devices whose bodies overlap
export function run({ step = 0.0015, skipTip = 0.016 } = {}) {
  const g = window.guide, { WIRES, DEV, PZ } = g
  // ---- per device: triangles binned on XY, for rays along Z
  const CELL = 0.004
  const grids = new Map()
  const gridOf = (tag) => {
    if (grids.has(tag)) return grids.get(tag)
    const dv = DEV[tag]; let G_ = null
    if (dv?.obj && dv.x0 !== undefined) {
      const T = g.soupOf(dv), bins = new Map()
      let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]
      for (let i = 0; i < T.length; i += 9) {
        const xa = Math.min(T[i], T[i + 3], T[i + 6]), xb = Math.max(T[i], T[i + 3], T[i + 6]), ya = Math.min(T[i + 1], T[i + 4], T[i + 7]), yb = Math.max(T[i + 1], T[i + 4], T[i + 7])
        for (let a = 0; a < 3; a++) for (let k = 0; k < 3; k++) { const v = T[i + k * 3 + a]; if (v < lo[a]) lo[a] = v; if (v > hi[a]) hi[a] = v }
        for (let cx = Math.floor(xa / CELL); cx <= Math.floor(xb / CELL); cx++) for (let cy = Math.floor(ya / CELL); cy <= Math.floor(yb / CELL); cy++) { const k = cx * 100003 + cy; let b = bins.get(k); if (!b) bins.set(k, b = []); b.push(i) }
      }
      G_ = { T, bins, lo, hi }
    }
    grids.set(tag, G_); return G_
  }
  // crossings of a ray from p along +Z and along -Z: inside when both are odd
  const inside = (G_, p) => {
    if (p.x < G_.lo[0] || p.x > G_.hi[0] || p.y < G_.lo[1] || p.y > G_.hi[1] || p.z < G_.lo[2] || p.z > G_.hi[2]) return false
    const b = G_.bins.get(Math.floor(p.x / CELL) * 100003 + Math.floor(p.y / CELL)); if (!b) return false
    const T = G_.T; let up = 0, dn = 0
    for (const i of b) {
      const ax = T[i] - p.x, ay = T[i + 1] - p.y, bx = T[i + 3] - p.x, by = T[i + 4] - p.y, cx = T[i + 6] - p.x, cy = T[i + 7] - p.y
      const d1 = ax * by - ay * bx, d2 = bx * cy - by * cx, d3 = cx * ay - cy * ax
      if (!((d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0))) continue
      const s = d1 + d2 + d3; if (Math.abs(s) < 1e-16) continue
      const z = (d2 * T[i + 2] + d3 * T[i + 5] + d1 * T[i + 8]) / s
      if (z > p.z) up++; else dn++
    }
    return (up & 1) === 1 && (dn & 1) === 1
  }
  const tags = Object.keys(DEV).filter((t) => DEV[t]?.obj && DEV[t].x0 !== undefined && !DEV[t].door && !DEV[t].sub2)
  const out = { through: [], shared: [], kinks: [], behind: [], notFound: [], overlap: [], over: [], loose: [] }
  const tips = []
  WIRES.forEach((w, idx) => {
    if (!w) return
    const label = w.s.label || w.s.id
    const curves = []
    // the conductor itself, and for a cable every core
    if (w.curve && !w.cable) curves.push({ c: w.curve, ends: w.ends, od: w.od, name: label })
    if (w.cable) {
      curves.push({ c: w.curve, ends: [null, null], od: w.od, name: `${label} jacket`, jacket: true })
      for (const t of w.tubes.slice(1)) { const pp = t.geometry.parameters?.path; if (pp) curves.push({ c: pp, ends: [null, null], od: 0.0021, name: `${label} core`, core: true }) }
    }
    for (const cv of curves) {
      const L = cv.c.getLength(), n = Math.max(4, Math.ceil(L / step)), pts = cv.c.getSpacedPoints(n)
      const hits = new Map()
      for (let k = 0; k <= n; k++) {
        const p = pts[k], s = (k / n) * L
        if (p.z < PZ - 0.0005 && p.y > 0.15) out.behind.push({ wire: cv.name, at: [p.x, p.y, p.z].map((v) => +v.toFixed(4)) })
        // inside the clamp at either end: the conductor is meant to be in the device there
        if (s < skipTip || L - s < skipTip) continue
        for (const tag of tags) {
          const G_ = gridOf(tag); if (!G_) continue
          if (inside(G_, p)) { const h = hits.get(tag) ?? { n: 0, first: p, s0: s }; h.n++; h.last = p; hits.set(tag, h) }
        }
      }
      // V9: where a wire is when it is in no duct. over: across the face of a device it does not land on.
      // loose: on the plate, outside every duct, more than 60 mm along the wire from either end (ends, tails and cable
      // breakouts are expected to be in the open; the middle of a run is not).
      if (!cv.core) {
        const sx0 = g.SX(0), sy0 = g.SY(0), over = new Map(); let loose = 0, lp = null
        const own = new Set([...cv.ends.filter(Boolean).map((e) => e.dev === 'GND BAR' ? 'GB1' : e.dev), ...(w.cores ?? []).map((k) => k.p.dev === 'GND BAR' ? 'GB1' : k.p.dev)])
        for (let k = 0; k <= n; k++) {
          const p = pts[k], s = (k / n) * L, X = (p.x - sx0) * 1000, Y = (sy0 - p.y) * 1000
          if (p.z > PZ + 0.2 || X < 0 || Y < 0 || Y > 1422 || X > 1118) continue
          if (g.DUCT.some((d) => X >= d.X0 - 4 && X <= d.X1 + 4 && Y >= d.Yt - 4 && Y <= d.Yb + 4)) continue
          for (const tag of tags) { if (own.has(tag)) continue; const dv = DEV[tag]; if (p.x > dv.x0 + 0.001 && p.x < dv.x1 - 0.001 && p.y > dv.yB + 0.001 && p.y < dv.yT - 0.001) over.set(tag, (over.get(tag) ?? 0) + 1) }
          if (s > 0.06 && L - s > 0.06) { loose++; lp ??= p }
        }
        for (const [tag, c] of over) if (c * step >= 0.004) out.over.push({ wire: cv.name, idx, dev: tag, mm: +(c * step * 1000).toFixed(0) })
        if (loose * step >= 0.01 && !w.direct) out.loose.push({ wire: cv.name, idx, mm: +(loose * step * 1000).toFixed(0), at: [lp.x, lp.y, lp.z].map((v) => +v.toFixed(3)) })
      }
      for (const [tag, h] of hits) if (h.n * step >= 0.003) out.through.push({ wire: cv.name, idx, dev: tag, mm: +(h.n * step * 1000).toFixed(1), own: cv.ends.some((e) => e?.dev === tag) || (w.cores ?? []).some((k) => k.p.dev === tag), at: [h.first.x, h.first.y, h.first.z].map((v) => +v.toFixed(4)), s0: +(h.s0 * 1000).toFixed(0), L: +(L * 1000).toFixed(0) })
      // kinks: radius through three samples 3 mm apart
      let worst = Infinity, wp = null
      for (let k = 2; k < n - 2; k++) {
        const a = pts[k - 2], b = pts[k], c = pts[k + 2], ab = a.distanceTo(b), bc = b.distanceTo(c), ca = c.distanceTo(a)
        const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2; if (area < 1e-12) continue
        const R = ab * bc * ca / (4 * area); if (R < worst) { worst = R; wp = b }
      }
      if (worst < Math.max(0.0025, cv.od * 0.9) && !cv.core) out.kinks.push({ wire: cv.name, idx, r_mm: +(worst * 1000).toFixed(1), od_mm: +(cv.od * 1000).toFixed(1), at: [wp.x, wp.y, wp.z].map((v) => +v.toFixed(4)) })
    }
    const ends = w.cable ? (w.cores ?? []).map((k) => k.p) : w.ends
    for (const e of ends) {
      if (!e || e.exit || !e.L) continue
      tips.push({ wire: label, dev: e.dev, pin: e.pin, t: e.L.tip })
      if (e.L.found === false) out.notFound.push({ wire: label, dev: e.dev, pin: e.pin })
    }
  })
  // conductor ends in the same place
  const seen = new Map()
  for (const t of tips) { const k = `${t.dev}|${Math.round(t.t.x * 2000)}|${Math.round(t.t.y * 2000)}|${Math.round(t.t.z * 2000)}`; (seen.get(k) ?? seen.set(k, []).get(k)).push(t) }
  for (const l of seen.values()) if (l.length > 1) out.shared.push({ dev: l[0].dev, pin: [...new Set(l.map((x) => x.pin))].join('/'), wires: l.map((x) => x.wire) })
  // device bodies overlapping (boxes, 1.5 mm tolerance)
  for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) {
    const a = DEV[tags[i]], b = DEV[tags[j]]
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.yT, b.yT) - Math.max(a.yB, b.yB), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0)
    if (ox > 0.0015 && oy > 0.0015 && oz > 0.0015) out.overlap.push({ a: tags[i], b: tags[j], mm: [ox, oy, oz].map((v) => +(v * 1000).toFixed(1)) })
  }
  out.summary = Object.fromEntries(Object.entries(out).filter(([k]) => k !== 'summary').map(([k, v]) => [k, v.length]))
  out.summary.ends = tips.length
  return out
}
