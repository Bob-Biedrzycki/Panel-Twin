// OIT-24VDC panel model: the one solver shared by the 3D twin (panel-twin.html, inlined by build.mjs)
// and the SCADA simulator (scada-sim.mjs). Plain JavaScript, no imports, no DOM.
//
// What it computes, every step:
//   - the 24 VDC distribution of sheet 2: field supply -> TB1-2 -> CB1 (6 A, curve C) -> TB1-4..6 -> HMI1, TC1, spare
//     (constant power loads, wire and source resistance, supply current limit, undervoltage drop out with hysteresis)
//   - CB1's thermal element (first order, calibrated to IEC 60898 / UL 489 curve C points) and its magnetic trip
//   - the thin client boot sequence and the monitor's power save when there is no video
//   - the enclosure's internal air temperature (lumped heat balance, IEC 60890 style surface method)
//   - alarms with acknowledge, and the SCADA tag map (Modbus addresses and scaling)
//
// Values marked ASSUMED are not from the review set (schematics-preview.pdf, rev A, 2026-11-04) or a cited
// manual; PartsLib was unreachable when this was written. They are collected in P so they are easy to replace.

export const P = {
  // field supply (not in this panel: sheet 2 says field conductors stop at the feed terminals)
  vNom: 24.0,          // V
  rSrc: 0.25,          // ohm, ASSUMED: supply output + 2 x 15 m of 14 AWG field cable
  iLim: 12.0,          // A, ASSUMED: a 10 A DIN supply in constant current limit at 1.2 x rating
  // CB1 1489-M1C060: 1 pole, curve C, 6 A
  In: 6.0,             // A, rating (BOM)
  rCb: 0.022,          // ohm, ASSUMED: breaker contact + bimetal resistance
  tauCb: 90,           // s, thermal time constant, ASSUMED: gives 20 s at 2.55 In and 85 s at 1.45 In (inside the curve C band)
  thTrip: 1.13 ** 2,   // (I/In)^2 at the conventional non-trip current 1.13 In
  magDC: 10 * 1.4,     // x In: curve C magnetic upper limit 10 In, x 1.4 on DC, ASSUMED
  // wiring (sheet 7 note 1: wire not yet itemised)
  rHmi: 0.063,         // ohm, ASSUMED: door harness, 2 x 1.5 m of 18 AWG (21 mohm/m)
  rTc1: 0.025,         // ohm, ASSUMED: 2 x 0.6 m of 18 AWG on the subplate
  rLoose: 4.0,         // ohm, fault: a loose 0 V screw at TB1-8 (a poor contact, ASSUMED)
  rthTerm: 15,         // K/W, terminal hot spot to enclosure air, ASSUMED
  rShort: 0.015,       // ohm, fault: a bolted short from TB1-6 (spare, live) to 0 V
  // HMI1 Hope HIS-ML22-STTD, DC model
  hmiBase: 7,          // W, ASSUMED: electronics and touch controller
  hmiBack: 35,         // W at full backlight, ASSUMED
  hmiSave: 3,          // W in power save (no video), ASSUMED
  hmiInside: 0.55,     // share of HMI heat released inside the enclosure (the rest leaves through the faceplate), ASSUMED
  // TC1 CONTEC 94115-03 (BX-T3020 thin client), DC-IN 12-24 V (sheet 3)
  tcIdle: 8.5,         // W, ASSUMED
  tcCpu: 13.5,         // W extra at 100 % CPU, ASSUMED
  tcBoot: 16,          // W while booting, ASSUMED
  tBoot: 28,           // s from power to ThinManager client on screen, ASSUMED
  // both DC devices: 12-24 V nominal, +/-10 %
  vDrop: 10.0,         // V, drops out below
  vStart: 11.5,        // V, starts again above
  vMinSpec: 10.8, vMaxSpec: 26.4,
  // enclosure SCE-30EL3008SSST, 762 x 762 x 203 mm, sloped top 15 deg, wall mounted (back not counted)
  area: 1.21,          // m2: front 0.581 + sloped top 0.157 + sides 0.320 + bottom 0.155
  kWall: 4.5,          // W/(m2 K), ASSUMED: unpainted stainless, still air (IEC 60890 uses 5.5 for painted steel)
  heatCap: 21250,      // J/K: 21 kg stainless shell + 9.8 kg subplate + HMI + TC1 (masses ASSUMED)
  tWarn: 45, tAlarm: 50, // deg C: devices are rated 0-50 deg C (ASSUMED)
}
P.G = P.area * P.kWall // W/K, conductance to the room

// ---------------------------------------------------------------- the panel
export function createPanel(init = {}) {
  const inp = {
    vField: P.vNom,      // V, field supply setpoint
    backlight: 0.8,      // 0..1
    cpu: 0.25,           // 0..1 thin client load
    ambient: 25,         // deg C
    warp: 1,             // thermal time warp (1 = real time)
    fShort: false, fLoose: false, fPsu: false,
    ...init,
  }
  const s = {
    t: 0, beat: 0,
    cb1: true, th: 0, trip: '',        // CB1 closed, thermal state (I/In)^2 lagged, trip cause
    hmiOn: false, tcMode: 0, boot: 0,  // tcMode 0 off, 1 boot, 2 run
    Tint: inp.ambient,
    vSrc: 0, vBus: 0, vHmi: 0, vTc1: 0, iCb: 0, iHmi: 0, iTc1: 0, iShort: 0,
    pHmi: 0, pTc1: 0, pHeat: 0, pLoss: 0, Tss: inp.ambient, limiting: false,
  }
  const alarms = new Map()  // id -> { id, text, prio, active, acked, t0 }

  // constant power load at the far end of a resistance R from a bus at Vb: I Vb - I^2 R = Pw
  const cpl = (Vb, Pw, R) => {
    if (Pw <= 0) return { i: 0, v: Vb, ok: true }
    const d = Vb * Vb - 4 * Pw * R
    if (d < 0 || Vb <= 0) return { i: 0, v: 0, ok: false }
    const i = (Vb - Math.sqrt(d)) / (2 * R)
    return { i, v: Vb - i * R, ok: true }
  }
  const demand = () => ({
    hmi: s.hmiOn ? (s.tcMode === 2 ? P.hmiBase + P.hmiBack * inp.backlight : P.hmiSave) : 0,
    tc1: s.tcMode === 1 ? P.tcBoot : s.tcMode === 2 ? P.tcIdle + P.tcCpu * inp.cpu : 0,
  })
  const loads = (Vb, D) => {
    const rT = P.rTc1 + (inp.fLoose ? P.rLoose : 0)
    const h = cpl(Vb, D.hmi, P.rHmi), t = cpl(Vb, D.tc1, rT)
    const sc = inp.fShort ? Vb / P.rShort : 0
    return { h, t, sc, i: h.i + t.i + sc, rT }
  }

  // the bus: highest voltage where what the source can push equals what the loads draw
  function solveBus(D) {
    const Vs = inp.fPsu ? 0 : inp.vField
    s.vSrc = Vs
    if (!s.cb1 || Vs <= 0) { s.limiting = false; return { Vb: 0, L: loads(0, D), I: 0 } }
    const R = P.rSrc + P.rCb
    const src = (Vb) => Math.min(P.iLim, Math.max(0, (Vs - Vb) / R))
    const g = (Vb) => src(Vb) - loads(Vb, D).i
    let hi = Vs, lo = Vs
    const step = Vs / 400
    while (lo > 0 && g(lo) < 0) { hi = lo; lo = Math.max(0, lo - step) }
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (g(m) >= 0) lo = m; else hi = m }
    const Vb = lo, L = loads(Vb, D)
    s.limiting = (Vs - Vb) / R > P.iLim * 0.999
    return { Vb, L, I: src(Vb) }
  }

  function setAlarm(id, on, text, prio) {
    let a = alarms.get(id)
    if (on && !a) { a = { id, text, prio, active: true, acked: false, t0: s.t }; alarms.set(id, a) }
    else if (a) { a.active = on; a.text = text; if (!on && a.acked) alarms.delete(id) }
  }

  function step(dt) {
    if (!(dt > 0)) return s
    s.t += dt; s.beat = (s.beat + 1) & 0xffff
    const D = demand()
    const { Vb, L, I } = solveBus(D)
    s.vBus = Vb; s.iCb = s.cb1 ? I : 0
    s.vHmi = s.hmiOn ? L.h.v : Vb; s.vTc1 = s.tcMode ? L.t.v : Vb
    s.iHmi = L.h.i; s.iTc1 = L.t.i; s.iShort = L.sc
    s.pHmi = L.h.i * L.h.v; s.pTc1 = L.t.i * L.t.v
    // device supervisors: drop out below vDrop (or when the load line collapses), start above vStart
    const hmiV = L.h.ok ? (s.hmiOn ? L.h.v : Vb) : 0, tcV = L.t.ok ? (s.tcMode ? L.t.v : Vb) : 0
    if (s.hmiOn && hmiV < P.vDrop) s.hmiOn = false
    else if (!s.hmiOn && Vb > P.vStart) s.hmiOn = true
    if (s.tcMode && tcV < P.vDrop) { s.tcMode = 0; s.boot = 0 }
    else if (!s.tcMode && Vb > P.vStart) { s.tcMode = 1; s.boot = 0 }
    if (s.tcMode === 1) { s.boot += dt; if (s.boot >= P.tBoot) s.tcMode = 2 }
    // CB1: thermal element follows (I/In)^2 with time constant tauCb, trips at thTrip; magnetic is instant
    const r2 = (s.iCb / P.In) ** 2
    s.th = r2 + (s.th - r2) * Math.exp(-dt / P.tauCb)
    if (s.cb1 && s.iCb >= P.magDC * P.In) { s.cb1 = false; s.trip = 'magnetic' }
    if (s.cb1 && s.th >= P.thTrip) { s.cb1 = false; s.trip = 'thermal' }
    // heat inside: TC1, the hidden share of HMI1, CB1 and wiring losses
    const rT = L.rT
    s.pLoss = (s.iCb ** 2) * (P.rCb) + (L.h.i ** 2) * P.rHmi + (L.t.i ** 2) * rT + (inp.fShort ? L.sc ** 2 * P.rShort : 0)
    s.pHeat = s.pTc1 + P.hmiInside * s.pHmi + s.pLoss
    const dtt = dt * Math.max(1, inp.warp)
    const Tss = inp.ambient + s.pHeat / P.G
    s.Tss = Tss
    s.Tint = Tss + (s.Tint - Tss) * Math.exp(-dtt / (P.heatCap / P.G))
    // TB1-8 contact: the loose screw dissipates I^2 R in a few cubic millimetres of brass (1 min thermal lag)
    const pTerm = inp.fLoose ? (L.t.i ** 2) * P.rLoose : 0
    s.pTerm = pTerm
    s.tTerm = (s.tTerm ?? s.Tint) + ((s.Tint + pTerm * P.rthTerm) - (s.tTerm ?? s.Tint)) * (1 - Math.exp(-dt / 60))
    // alarms
    setAlarm('PSU_LOST', inp.fPsu || inp.vField < 1, 'Field 24 V supply lost', 1)
    setAlarm('CB1_TRIP', !s.cb1, `CB1 tripped (${s.trip || 'opened'}) - reset at the panel`, 1)
    setAlarm('SHORT', s.cb1 && inp.fShort && s.limiting, `Supply in current limit at ${fmtN(s.iCb, 1)} A - fault on the 24 V bus`, 1)
    setAlarm('BUS_UV', s.cb1 && s.vSrc > 1 && Vb < 21.6, `24 V bus low: ${fmtN(Vb, 1)} V`, 2)
    setAlarm('BUS_OV', Vb > P.vMaxSpec, `24 V bus above TC1 rating: ${fmtN(Vb, 1)} V`, 2)
    setAlarm('TC1_DOWN', s.tcMode !== 2, s.tcMode === 1 ? 'TC1 thin client booting' : 'TC1 thin client off', s.tcMode === 1 ? 3 : 1)
    setAlarm('HMI_DOWN', !s.hmiOn, 'HMI1 monitor off', 1)
    setAlarm('TC1_V', s.tcMode > 0 && s.vTc1 < 20, `TC1 supply low at the device: ${fmtN(s.vTc1, 1)} V`, 2)
    setAlarm('TB1_8_HOT', s.tTerm > 70, `TB1-8 contact hot: ${fmtN(s.tTerm)} deg C (${fmtN(s.pTerm, 1)} W in the joint)`, 2)
    setAlarm('CB1_LOAD', s.cb1 && s.iCb > 0.8 * P.In && !inp.fShort, `CB1 load ${fmtN(s.iCb / P.In * 100)} % of rating`, 3)
    setAlarm('T_HI', s.Tint >= P.tWarn && s.Tint < P.tAlarm, `Enclosure ${fmtN(s.Tint, 1)} deg C (warn ${P.tWarn})`, 3)
    setAlarm('T_HIHI', s.Tint >= P.tAlarm, `Enclosure ${fmtN(s.Tint, 1)} deg C above device rating`, 1)
    return s
  }

  // ---- field and SCADA actions
  function resetCb1() { if (!s.cb1) { s.cb1 = true; s.trip = ''; return true } return false }
  function openCb1() { if (s.cb1) { s.cb1 = false; s.trip = 'manual' } }
  function ack(id) { for (const a of alarms.values()) if (!id || a.id === id) { a.acked = true; if (!a.active) alarms.delete(a.id) } }
  const alarmList = () => [...alarms.values()].sort((a, b) => a.prio - b.prio || a.t0 - b.t0)
  const alarmWord = () => { let w = 0; let k = 0; for (const id of ALARM_IDS) { const a = alarms.get(id); if (a?.active) w |= 1 << k; k++ } return w }

  const panel = { P, inp, s, step, resetCb1, openCb1, ack, alarmList, alarmWord }
  // settle the starting point: power up and let the thin client finish booting (fast forward, no alarms kept)
  if (init.warmStart !== false) {
    for (let k = 0; k < 400; k++) step(0.1)
    s.Tint = s.Tss; s.t = 0
    alarms.clear(); step(0.05); for (const a of alarms.values()) a.acked = true
  }
  return panel
}
const ALARM_IDS = ['PSU_LOST', 'CB1_TRIP', 'SHORT', 'BUS_UV', 'BUS_OV', 'TC1_DOWN', 'HMI_DOWN', 'TC1_V', 'CB1_LOAD', 'T_HI', 'T_HIHI', 'TB1_8_HOT']
function fmtN(v, d = 0) { return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) }

// ---------------------------------------------------------------- the SCADA tag map (Modbus TCP, zero based addresses)
// ir: input registers (FC4), di: discrete inputs (FC2), hr: holding registers (FC3/6/16), co: coils (FC1/5/15)
// Registers are unsigned 16 bit, value = engineering value x scale.
export const TAGS = [
  { name: 'VP1.Field.Voltage', kind: 'ir', addr: 0, scale: 100, unit: 'V', desc: 'Field 24 V at TB1-2', get: (p) => p.s.vSrc },
  { name: 'VP1.Bus.Voltage', kind: 'ir', addr: 1, scale: 100, unit: 'V', desc: '24 V bus TB1-4..6 (after CB1)', get: (p) => p.s.vBus },
  { name: 'VP1.CB1.Current', kind: 'ir', addr: 2, scale: 100, unit: 'A', desc: 'Current through CB1', get: (p) => p.s.iCb },
  { name: 'VP1.HMI1.Voltage', kind: 'ir', addr: 3, scale: 100, unit: 'V', desc: 'Voltage at HMI1 DC input', get: (p) => p.s.hmiOn ? p.s.vHmi : 0 },
  { name: 'VP1.TC1.Voltage', kind: 'ir', addr: 4, scale: 100, unit: 'V', desc: 'Voltage at TC1 DC-IN', get: (p) => p.s.tcMode ? p.s.vTc1 : 0 },
  { name: 'VP1.HMI1.Power', kind: 'ir', addr: 5, scale: 10, unit: 'W', desc: 'HMI1 input power', get: (p) => p.s.pHmi },
  { name: 'VP1.TC1.Power', kind: 'ir', addr: 6, scale: 10, unit: 'W', desc: 'TC1 input power', get: (p) => p.s.pTc1 },
  { name: 'VP1.Heat.Internal', kind: 'ir', addr: 7, scale: 10, unit: 'W', desc: 'Heat released inside the enclosure', get: (p) => p.s.pHeat },
  { name: 'VP1.Enc.Temp', kind: 'ir', addr: 8, scale: 10, unit: '°C', desc: 'Enclosure internal air', get: (p) => p.s.Tint },
  { name: 'VP1.Enc.TempSettle', kind: 'ir', addr: 9, scale: 10, unit: '°C', desc: 'Temperature it settles at', get: (p) => p.s.Tss },
  { name: 'VP1.Ambient.Temp', kind: 'ir', addr: 10, scale: 10, unit: '°C', desc: 'Room ambient', get: (p) => p.inp.ambient },
  { name: 'VP1.CB1.Thermal', kind: 'ir', addr: 11, scale: 10, unit: '%', desc: 'CB1 thermal element, % of trip', get: (p) => Math.min(100, (p.s.th / P.thTrip) * 100) },
  { name: 'VP1.TC1.Mode', kind: 'ir', addr: 12, scale: 1, unit: '', desc: '0 off, 1 booting, 2 running', get: (p) => p.s.tcMode },
  { name: 'VP1.TC1.BootPct', kind: 'ir', addr: 13, scale: 1, unit: '%', desc: 'Boot progress', get: (p) => p.s.tcMode === 2 ? 100 : Math.round((p.s.boot / P.tBoot) * 100) },
  { name: 'VP1.TB1_8.Temp', kind: 'ir', addr: 16, scale: 10, unit: '°C', desc: 'TB1-8 contact temperature', get: (p) => p.s.tTerm ?? p.s.Tint },
  { name: 'VP1.Alarm.Word', kind: 'ir', addr: 14, scale: 1, unit: '', desc: 'Active alarm bits (see README)', get: (p) => p.alarmWord() },
  { name: 'VP1.Heartbeat', kind: 'ir', addr: 15, scale: 1, unit: '', desc: 'Counts every solver step', get: (p) => p.s.beat },
  { name: 'VP1.CB1.Closed', kind: 'di', addr: 0, desc: 'CB1 closed', get: (p) => p.s.cb1 },
  { name: 'VP1.HMI1.On', kind: 'di', addr: 1, desc: 'HMI1 powered', get: (p) => p.s.hmiOn },
  { name: 'VP1.TC1.Running', kind: 'di', addr: 2, desc: 'TC1 client running', get: (p) => p.s.tcMode === 2 },
  { name: 'VP1.Bus.OK', kind: 'di', addr: 3, desc: 'Bus within 21.6-26.4 V', get: (p) => p.s.vBus >= 21.6 && p.s.vBus <= 26.4 },
  { name: 'VP1.Supply.Limiting', kind: 'di', addr: 4, desc: 'Field supply in current limit', get: (p) => p.s.limiting },
  { name: 'VP1.Alarm.Any', kind: 'di', addr: 5, desc: 'Any alarm active', get: (p) => p.alarmWord() !== 0 },
  { name: 'VP1.Field.VoltageSP', kind: 'hr', addr: 0, scale: 100, unit: 'V', desc: 'Field supply setpoint (simulation)', get: (p) => p.inp.vField, set: (p, v) => { p.inp.vField = clampN(v, 0, 30) } },
  { name: 'VP1.HMI1.Backlight', kind: 'hr', addr: 1, scale: 1, unit: '%', desc: 'HMI1 backlight', get: (p) => p.inp.backlight * 100, set: (p, v) => { p.inp.backlight = clampN(v, 0, 100) / 100 } },
  { name: 'VP1.TC1.CpuLoad', kind: 'hr', addr: 2, scale: 1, unit: '%', desc: 'TC1 CPU load (simulation)', get: (p) => p.inp.cpu * 100, set: (p, v) => { p.inp.cpu = clampN(v, 0, 100) / 100 } },
  { name: 'VP1.Ambient.TempSP', kind: 'hr', addr: 3, scale: 10, unit: '°C', desc: 'Room ambient (simulation)', get: (p) => p.inp.ambient, set: (p, v) => { p.inp.ambient = clampN(v, -10, 60) } },
  { name: 'VP1.Sim.TimeWarp', kind: 'hr', addr: 4, scale: 1, unit: 'x', desc: 'Thermal time warp', get: (p) => p.inp.warp, set: (p, v) => { p.inp.warp = clampN(Math.round(v), 1, 600) } },
  { name: 'VP1.Fault.ShortTB1_6', kind: 'co', addr: 0, desc: 'Fault: TB1-6 shorted to 0 V', get: (p) => p.inp.fShort, set: (p, v) => { p.inp.fShort = !!v } },
  { name: 'VP1.Fault.Loose0V_TB1_8', kind: 'co', addr: 1, desc: 'Fault: loose 0 V at TB1-8', get: (p) => p.inp.fLoose, set: (p, v) => { p.inp.fLoose = !!v } },
  { name: 'VP1.Fault.SupplyLost', kind: 'co', addr: 2, desc: 'Fault: field supply lost', get: (p) => p.inp.fPsu, set: (p, v) => { p.inp.fPsu = !!v } },
  { name: 'VP1.Cmd.CB1Reset', kind: 'co', addr: 3, desc: 'Field action: reset CB1 (pulse)', get: () => false, set: (p, v) => { if (v) p.resetCb1() } },
  { name: 'VP1.Cmd.CB1Open', kind: 'co', addr: 4, desc: 'Field action: open CB1 (pulse)', get: () => false, set: (p, v) => { if (v) p.openCb1() } },
  { name: 'VP1.Cmd.AckAll', kind: 'co', addr: 5, desc: 'Acknowledge all alarms (pulse)', get: () => false, set: (p, v) => { if (v) p.ack() } },
]
export { ALARM_IDS }
function clampN(v, a, b) { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a }

// one JSON snapshot of everything a client draws
export function snapshot(p) {
  const tags = {}
  for (const t of TAGS) { const v = t.get(p); tags[t.name] = typeof v === 'boolean' ? v : Math.round(v * 1000) / 1000 }
  return { t: p.s.t, tags, alarms: p.alarmList(), trip: p.s.trip, short: p.inp.fShort, loose: p.inp.fLoose, psu: p.inp.fPsu }
}

export function writeTag(p, name, value) {
  const t = TAGS.find((x) => x.name === name)
  if (!t || !t.set) return false
  t.set(p, value)
  return true
}

export default { P, TAGS, ALARM_IDS, createPanel, snapshot, writeTag }
