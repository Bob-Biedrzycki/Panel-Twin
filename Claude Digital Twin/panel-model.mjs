// VFD 200 panel model: the one solver shared by the 3D twin (panel-twin.html, inlined by build.mjs)
// and the SCADA simulator (scada-sim.mjs). Plain JavaScript, no imports, no DOM.
//
// Source: "Draft rev18.pdf", ABARTA Coca-Cola CIP Double Skid, CPME job 1082-01, panel VFD 200, rev A, 18 sheets.
//
// What it computes, every step:
//   - 480Y/277 V feeder (sheet 4): Q1 100 A disconnect, FU1 70 A class J, PDB1, CB1/CB2 140MT-F9E-C32 to DRV1/DRV2,
//     T1 750 VA to 120 V (sheet 6: RCP1 receptacle on CB5, the enclosure A/C on FU2), CB3 to PWS1 24 VDC 20 A (sheet 7)
//   - DRV1/DRV2 PowerFlex 525 15 HP with the parameters of sheet 5 (460 V, 60 Hz, 17.7 A, 2 pole, 3495 rpm), driving
//     MTR1/MTR2 (Baldor CEM3713T 15 HP) and a centrifugal CIP supply pump each: affinity laws, pump and system curves,
//     slip, motor and drive losses, input current, the 140MT thermal element, the drive motor overload, current limit,
//     heatsink temperature, safe torque off from the E-stop (sheet 5), EtherNet/IP comm loss
//   - CB4 WAGO 787-1668: eight electronic 24 V channels at the settings of sheet 7, each with its loads and trip
//   - the CIP process seen by the field instruments (sheets 10 to 14): three tanks, the 18 named VM1 valves, two supply
//     circuits, flow, temperature, level, conductivity. The review set has no P&ID: the process is an interpretation.
//   - the enclosure air temperature: heat released inside against the 1,000 BTU/h A/C and the stainless walls
//   - alarms with acknowledge, and the SCADA tag map (Modbus addresses and scaling, generated in order)
//
// Values marked ASSUMED are not printed in the review set; PartsLib was unreachable when this was written.
// They are all in P, so they are easy to replace with datasheet values.

export const P = {
  // ---- supply (sheet 4: incoming feeder 480Y/277 VAC, 3 phase, 3 wire, 60 Hz)
  vLL: 480, vUV: 360,            // V; drives drop out below vUV (ASSUMED, 75 %)
  // ---- DRV1/DRV2 PowerFlex 525 25B-D024N104: 24 A, 15 HP normal duty (BOM)
  drvA: 24,
  ramp: 6.0,                     // Hz/s: 10 s accel and decel to 60 Hz (factory default, ASSUMED)
  fMax: 60,
  iLim: 1.5,                     // current limit, x drive rating (ASSUMED default)
  drvL0: 28, drvLA: 9.0, drvLR: 0.35,   // drive loss W, W/A, ohm: about 300 W at 17.7 A (ASSUMED, ~2.7 % of rating)
  pfIn: 0.72,                    // true input power factor, 6 pulse, no line reactor or DC choke (ASSUMED)
  rthHs: 0.15, tauHs: 120, tHsTrip: 100,  // heatsink K/W above the enclosure air, s, deg C trip (F8) (ASSUMED)
  // ---- MTR1/MTR2 (sheet 5 parameters P031..P036, sheet 14 nameplate)
  mHP: 15, mV: 460, mA: 17.7, mRpm: 3495, mPoles: 2,
  mEff: 0.917,                   // Baldor CEM3713T full load efficiency (ASSUMED, premium efficiency class)
  mMag: 0.30,                    // magnetising current, fraction of FLA (ASSUMED)
  tauOL: 90,                     // s: drive motor overload, trips 150 % of P033 in about 60 s
  J: 0.12,                       // kg m2: motor rotor + pump impeller + water (ASSUMED)
  // ---- CB1/CB2 140MT-F9E-C32: 24..32 A adjustable, class 10, magnetic fixed at 15 x 32 A (BOM)
  cbSet: 24, tauCb: 200, rCb: 0.0043,  // A (note on sheet 4: the minimum that does not nuisance trip), s, ohm per pole (ASSUMED)
  // ---- the CIP supply pumps (not in the review set: ASSUMED, sized to the 15 HP motors)
  pumpH0: 62, pumpA: 0.0056,     // m at shut-off at 3495 rpm, m/(m3/h)^2 : BEP 50 m3/h at 48 m
  qBep: 50, pBep: 9343, pSo: 0.35, pDry: 0.15,  // m3/h, W shaft at BEP (eta 0.70), shut-off and dry fractions of pBep
  sysHs: 8, sysK: 0.016,         // circuit static head m, friction m/(m3/h)^2 (ASSUMED)
  casingC: 50000, casingG: 40,   // J/K, W/K: pump casing water when dead-headed (ASSUMED)
  // ---- process (interpretation of the valve and instrument names of sheets 10..14, ASSUMED)
  tankV: 3.0,                    // m3 each
  feedTEA: 4, feedTW: 10,        // m3/h feed rates into the tanks
  doseTEA: 0.5,                  // m3/h, TEA mod feed into the suction
  kTEA: 120, kTW: 0.4, tTEA: 20, tTW: 15,  // feed conductivity mS/cm and temperature deg C
  hexUA: 4000, hexHot: 90,       // W/K and deg C: supply heat exchangers
  tankUA: 15,                    // W/K per tank to the room
  // ---- T1 E750WB 750 VA 480/120 V, FU2 6 A, CB5 2 A (sheets 4, 6)
  t1VA: 750, t1Fe: 7, t1Cu: 18,  // W no-load and full-load copper losses (ASSUMED)
  // ---- A/C SCE-AC1000B120VSS: 1,000 BTU/h = 293 W (BOM)
  acW: 293, acSet: 35, acHyst: 1.0, acFanW: 15, acFanA: 0.4, acCompA: 3.2,   // W, deg C (95 F factory), K, W inside, A, A (ASSUMED)
  // ---- PWS1 WAGO 2787-2347: 24 V 20 A 480 W (BOM)
  pwsV: 24.0, pwsA: 20, pwsEff: 0.935, pwsL0: 3,
  // ---- CB4 WAGO 787-1668 channel settings (sheet 7) and loads in W at 24 V (loads ASSUMED)
  cb4Set: [3, 3, 4, 4, 4, 2, 2, 2],
  // ---- enclosure SCE-60XEL4918SSST, 60 x 49 x 18 in, 304 stainless 0.104 in, free standing, back to a wall (ASSUMED)
  area: 3.88,                    // m2: front 1.897 + two sides 1.393 + sloped top 0.59 (back to the wall)
  kWall: 4.5,                    // W/(m2 K), unpainted stainless, still air (ASSUMED)
  heatCap: 120000,               // J/K: 133 kg shell, 33 kg subplate, ~60 kg of devices (ASSUMED)
  tWarn: 45, tAlarm: 50,         // deg C: PowerFlex 525 IP20 open type is rated 50 deg C without derating
  gDoor: 60,                     // W/K extra with a door open (ASSUMED)
}
P.G = P.area * P.kWall
P.mW = P.mHP * 745.7
P.mTr = P.mW / (P.mRpm * Math.PI / 30)                  // rated torque N m
P.mLoss = P.mW * (1 / P.mEff - 1)                       // full load motor losses W

// VM1 valve outputs (sheet 10): position -> function. 1..8 on page 2/5, 9..16 on 3/5, 17..24 on 4/5, 25..32 on 5/5
export const VALVES = { 1: 'Tank 1 bottom', 2: 'Tank 2 bottom', 3: 'Tank 3 bottom', 4: 'Tank 1 top', 5: 'Tank 2 top', 6: 'Tank 3 top', 8: 'CIP tank drain', 9: 'TW HEX feed', 10: 'TEA mod feed', 25: 'System drain', 26: 'EVO pump feed', 27: 'TEA feed tank 1', 28: 'TW feed tank 2', 29: 'TW line feed', 30: 'TW feed tank 3', 31: 'TW line feed (2)', 32: 'TEA HEX feed' }
const VNAMES = Object.keys(VALVES).map(Number)

// CB4 channels (sheet 7): what each feeds
export const CB4_LOADS = ['PWS2 (PLC1 rack)', 'HMI1', 'CPL1', 'CPL2', 'CPL3', 'VM1', 'PDB2 (NS1, NS2, CE1, SI1, FM1, SI2, IO1)', 'E-STOP (STO)']
// instruments: which IO-Link master serves them (sheets 11..13)
const ON_CPL = { LT1: 0, LT2: 0, LT3: 0, FM1: 0, FM2: 0, CE2: 0, TT1: 0, TT2: 1, FM3: 1, FM4: 1, TT3: 1, TT4: 1, CE3: 1, CE4: 1, CE1: 0 }

// ---------------------------------------------------------------- the panel
export function createPanel(init = {}) {
  const inp = {
    vLL: P.vLL, ambient: 30, warp: 1,              // a warm CIP room (ASSUMED)
    run: [true, true], fRef: [50, 50],     // PLC run commands and speed references (Hz) per drive, from SCADA
    cbSet: [P.cbSet, P.cbSet],
    estop: false, q1: true, door: false, laptopW: 0,
    valves: Object.fromEntries(Array.from({ length: 32 }, (_, i) => [i + 1, false])),
    fAc: false, fSupply: false, fSeize: false, fShortCh3: false,
    ...init,
  }
  // a CIP recirculation on tank 1 with its heat exchanger on, as the default scene
  if (!init.valves) { inp.valves[1] = true; inp.valves[4] = true; inp.valves[32] = true }
  const s = {
    t: 0, beat: 0,
    cb: [true, true], cbTh: [0, 0], cbTrip: ['', ''],
    drv: [mkDrv(), mkDrv()],
    cir: [mkCir(), mkCir()],
    tanks: [{ V: 2.1, T: 45, k: 75 }, { V: 1.95, T: 30, k: 25 }, { V: 2.4, T: 18, k: 0.4 }],
    ch: P.cb4Set.map(() => ({ on: true, i: 0, acc: 0, trip: '' })),
    pws: { i: 0, pOut: 0, pLoss: 0, iIn: 0, limiting: false },
    t1: { va: 0, loss: 0, iPri: 0 }, ac: { comp: false, q: 0, cap: 0 },
    Tint: 38, Tss: 38, pHeat: 0, heat: {}, iLine: 0, vBus: 0, plc: true, net: true, cpl: [true, true, true],
  }
  function mkDrv() { return { st: 'ready', fault: '', f: 0, n: 0, I: 0, Iin: 0, pIn: 0, pOut: 0, loss: P.drvL0, ol: 0, hs: 38, vOut: 0, tq: 0, lim: false } }
  function mkCir() { return { Q: 0, Qr: 0, H: 0, P: 0, eta: 0, Tsup: 25, Tret: 25, k: 0, case: 25, mode: 'stopped', bad: 0, hex: 0 } }
  const alarms = new Map()

  function setAlarm(id, on, text, prio) {
    let a = alarms.get(id)
    if (on && !a) { a = { id, text, prio, active: true, acked: false, t0: s.t }; alarms.set(id, a) }
    else if (a) { a.active = on; if (on) a.text = text; if (!on && a.acked) alarms.delete(id) }
  }

  // ---- pump: operating point of one circuit at speed ratio r
  function pumpPoint(r, route) {
    if (r <= 0.01) return { Q: 0, H: 0, P: 0, mode: 'stopped' }
    if (!route.src) return { Q: 0, H: 0, P: P.pDry * P.pBep * r ** 3, mode: 'dry' }
    if (!route.dst) return { Q: 0, H: P.pumpH0 * r * r, P: P.pSo * P.pBep * r ** 3, mode: 'dead-head' }
    const head = P.pumpH0 * r * r - P.sysHs
    const Q = head > 0 ? Math.sqrt(head / (P.pumpA + P.sysK)) : 0
    const H = P.sysHs + P.sysK * Q * Q
    const Pw = P.pSo * P.pBep * r ** 3 + (1 - P.pSo) * P.pBep * r * r * (Q / P.qBep)
    return { Q, H, P: Pw, mode: Q > 0 ? 'flow' : 'no flow' }
  }
  // where the two supply circuits draw from and return to (the same header: sheet 10 valve names)
  function routes() {
    const v = inp.valves
    const src = [1, 2, 3].filter((j) => v[j] && s.tanks[j - 1].V / P.tankV > 0.03)
    const line = v[29] || v[31]
    const dstT = [4, 5, 6].filter((j) => v[j]).map((j) => j - 3)
    const drain = v[8] || v[25]
    return { src, line, dstT, drain, ok: { src: src.length > 0 || line, dst: dstT.length > 0 || drain } }
  }

  function step(dt) {
    if (!(dt > 0)) return s
    s.t += dt; s.beat = (s.beat + 1) & 0xffff
    const v = inp.valves
    const supply = !inp.fSupply && inp.q1 ? inp.vLL : 0
    s.vBus = supply
    // ---------------------------------------------------- 24 VDC: PWS1 on CB3, CB4 channels
    const pwsOn = supply > 300
    const npVal = VNAMES.filter((k) => v[k]).length
    const loadW = [
      16,                                   // PWS2 1769-PB2 feeding PLC1 + IO1 backplane (ASSUMED)
      25,                                   // HMI1 PanelView Plus 7 10.4 in (ASSUMED)
      4 + 3 * 1.2 + 2 * 1.0 + 2.5 + 1.5 + 0.6,  // CPL1 AL1920 + LT1-3, SC1, SC2, FM2, CE2, TT1 on its ports (ASSUMED)
      4 + 3 * 0.6 + 2 * 2.5 + 2 * 1.5,      // CPL2 + TT2..TT4, FM3, FM4, CE3, CE4 (ASSUMED)
      4 + 4 * 1.0,                          // CPL3 + SC3..SC6 (ASSUMED)
      1.5 + 1.0 * npVal,                    // VM1: node + 1 W per energised solenoid (ASSUMED)
      4.6 + 2.6 + 6 + 1.3 + 8 + 1.3 + (inp.estop ? 0 : 1),  // NS1, NS2, CE1 (24 V model?), SI1, FM1 electronics, SI2, E-stop lamp (ASSUMED)
      0.5,                                  // STO inputs S1/S2 of both drives
    ]
    let iTot = 0.05
    s.ch.forEach((c, k) => {
      const set = P.cb4Set[k]
      let I = pwsOn && c.on ? loadW[k] / P.pwsV : 0
      if (pwsOn && c.on && k === 2 && inp.fShortCh3) I = 1.5 * set          // active current limitation at 1.5 x the setting (ASSUMED)
      c.i = I
      if (c.on && I > set) { c.acc += dt * (I / set - 1); if (c.acc >= 0.5) { c.on = false; c.trip = I >= 1.45 * set ? 'short' : 'overload'; c.i = 0 } }
      else c.acc = Math.max(0, c.acc - dt * 0.2)
      iTot += c.i
    })
    s.pws.limiting = iTot > P.pwsA
    s.pws.i = Math.min(iTot, P.pwsA * 1.5)
    s.pws.pOut = pwsOn ? s.pws.i * P.pwsV : 0
    s.pws.pLoss = pwsOn ? s.pws.pOut * (1 / P.pwsEff - 1) + P.pwsL0 : 0
    s.pws.iIn = pwsOn ? (s.pws.pOut + s.pws.pLoss) / (Math.sqrt(3) * supply * 0.9) : 0
    const chOn = (k) => pwsOn && s.ch[k].on
    s.plc = chOn(0); s.hmi = chOn(1); s.cpl = [chOn(2), chOn(3), chOn(4)]; s.vm1 = chOn(5); s.net = chOn(6) && s.plc
    const vOut = (k) => s.vm1 && inp.valves[k]                             // a valve moves only with VM1 powered
    // ---------------------------------------------------- PLC interlocks (simulated): dry run and dead-head stop the pump
    const R = routes()
    const live = { 1: vOut(1), 2: vOut(2), 3: vOut(3), 4: vOut(4), 5: vOut(5), 6: vOut(6), 8: vOut(8), 25: vOut(25), 29: vOut(29), 31: vOut(31) }
    const RR = { src: R.src.filter((j) => live[j]), line: live[29] || live[31], dstT: R.dstT.filter((j) => live[j + 3]), drain: live[8] || live[25] }
    RR.ok = { src: RR.src.length > 0 || RR.line, dst: RR.dstT.length > 0 || RR.drain }
    // ---------------------------------------------------- drives, motors, pumps
    let iLine = 0
    for (let i = 0; i < 2; i++) {
      const d = s.drv[i], c = s.cir[i]
      const powered = supply > P.vUV && s.cb[i]
      // faults that stop the drive
      if (!powered) { if (d.st !== 'off') { d.st = 'off'; d.fault = supply > 0 && !s.cb[i] ? '' : '' } }
      else if (d.st === 'off') { d.st = 'ready'; d.fault = '' }
      if (powered && d.st !== 'fault') {
        if (d.hs >= P.tHsTrip) { d.st = 'fault'; d.fault = 'F8 heatsink overtemp' }
        else if (d.ol >= 1.1025) { d.st = 'fault'; d.fault = 'F7 motor overload' }
        else if (!s.net && (d.st === 'running' || d.f > 0)) { d.st = 'fault'; d.fault = 'F81 comm loss' }
      }
      const sto = inp.estop
      const want = powered && d.st !== 'fault' && !sto && s.net && inp.run[i] && c.bad < 8
      if (want) d.st = 'running'
      else if (powered && d.st === 'running') d.st = sto ? 'sto' : 'ready'
      if (powered && sto && d.st === 'ready') d.st = 'sto'
      if (powered && !sto && d.st === 'sto') d.st = 'ready'
      // output frequency ramps; STO, faults and loss of power remove torque: the shaft coasts
      const torqueOn = powered && (d.st === 'running' || (d.st === 'ready' && d.f > 0)) && !sto
      const fT = d.st === 'running' ? clampN(inp.fRef[i], 0, P.fMax) : 0
      if (torqueOn) d.f = d.f < fT ? Math.min(fT, d.f + P.ramp * dt) : Math.max(fT, d.f - P.ramp * dt)
      else d.f = 0
      // pump load at the current shaft speed
      const route = { src: RR.ok.src, dst: RR.ok.dst }
      let r = d.n / P.mRpm
      let pp = pumpPoint(r, route)
      let Tl = d.n > 1 ? pp.P / (d.n * Math.PI / 30) : 0
      if (inp.fSeize && i === 0) Tl = 4 * P.mTr                                      // seized pump: torque far above what the drive can give
      let I = 0, tq = 0
      if (torqueOn && d.f > 0.05) {
        // V/f: slip proportional to torque; the drive limits current to iLim x its rating
        const Tmax = (() => { const Ilim = P.iLim * P.drvA; const x = Math.sqrt(Math.max(0, (Ilim / P.mA) ** 2 - P.mMag ** 2) / (1 - P.mMag ** 2)); return x * P.mTr })()
        const slip0 = 60 * 2 / P.mPoles * 60 - P.mRpm                              // rpm slip at rated torque
        const nSync = 120 * d.f / P.mPoles
        const nWant = nSync - slip0 * Tl / P.mTr
        if (Tl > Tmax) { d.lim = true; tq = Tmax; d.n = Math.max(0, d.n + (Tmax - Tl) / P.J * (30 / Math.PI) * dt) }
        else { d.lim = false; tq = Tl; d.n = d.n + (nWant - d.n) * (1 - Math.exp(-dt / 0.15)) }
        if (d.lim && d.n < nSync - slip0 * Tmax / P.mTr) d.f = Math.max(0, Math.min(d.f, (d.n + slip0 * Tmax / P.mTr) / 2))   // current limit pulls the frequency back
        const x = tq / P.mTr
        I = P.mA * Math.sqrt(P.mMag ** 2 * Math.min(1, d.f / 60 + 0.05) + (x * Math.sqrt(1 - P.mMag ** 2)) ** 2)
      } else {
        d.lim = false
        d.n = Math.max(0, d.n - (Tl + 0.4) / P.J * (30 / Math.PI) * dt)            // coast against the pump and friction
      }
      r = d.n / P.mRpm; pp = pumpPoint(r, route)
      if (inp.fSeize && i === 0) { d.n = Math.min(d.n, 30); pp = { Q: 0, H: 0, P: 0, mode: 'seized' } }
      // motor and drive electrics
      const pShaft = torqueOn ? tq * d.n * Math.PI / 30 : 0
      const mLoss = torqueOn && d.f > 0.05 ? 0.35 * P.mLoss * Math.min(1, d.f / 60) + 0.65 * P.mLoss * (I / P.mA) ** 2 : 0
      d.pOut = pShaft + mLoss
      d.loss = powered ? P.drvL0 + P.drvLA * I + P.drvLR * I * I : 0
      d.pIn = powered ? d.pOut + d.loss : 0
      d.Iin = powered ? d.pIn / (Math.sqrt(3) * supply * P.pfIn) : 0
      d.I = I; d.tq = tq; d.vOut = Math.min(P.mV, P.mV * d.f / 60)
      // motor overload (P033 = 17.7 A) and the heatsink
      const r2 = (I / P.mA) ** 2
      d.ol = r2 + (d.ol - r2) * Math.exp(-dt / P.tauOL)
      const dtw = dt * Math.max(1, inp.warp)
      const hsSS = s.Tint + P.rthHs * d.loss
      d.hs = hsSS + (d.hs - hsSS) * Math.exp(-dtw / P.tauHs)
      // CB1/CB2: class 10 thermal element on the input current
      const rc = (d.Iin / inp.cbSet[i]) ** 2
      s.cbTh[i] = rc + (s.cbTh[i] - rc) * Math.exp(-dt / P.tauCb)
      if (s.cb[i] && s.cbTh[i] >= 1.2 ** 2) { s.cb[i] = false; s.cbTrip[i] = 'thermal' }
      iLine += d.Iin
      // the circuit (flow lags the pump by a couple of seconds, the return by the circuit length)
      c.mode = pp.mode
      c.Q += (pp.Q - c.Q) * (1 - Math.exp(-dt / 2))
      c.Qr += (c.Q - c.Qr) * (1 - Math.exp(-dt / 6))
      c.H = pp.H; c.P = pShaft; c.eta = pShaft > 1 ? 1000 * 9.81 * (c.Q / 3600) * pp.H / pShaft : 0
      // PLC interlock: a pump that runs dry or dead-headed for 8 s gets its run command dropped (re-armed on stop)
      if (d.st === 'running' && (pp.mode === 'dry' || pp.mode === 'dead-head') && s.plc) c.bad += dt
      else if (d.st !== 'running' || pp.mode === 'flow') c.bad = inp.run[i] && d.st !== 'running' && c.bad >= 8 ? c.bad : 0
      if (!inp.run[i]) c.bad = 0
    }
    // ---------------------------------------------------- the process: tanks, supply and return
    const mixIn = { V: 0, TV: 0, kV: 0 }
    for (const j of RR.src) { const tk = s.tanks[j - 1]; mixIn.V += 1; mixIn.TV += tk.T; mixIn.kV += tk.k }
    if (RR.line) { mixIn.V += 1; mixIn.TV += P.tTW; mixIn.kV += P.kTW }
    const Tsrc = mixIn.V ? mixIn.TV / mixIn.V : inp.ambient, ksrc = mixIn.V ? mixIn.kV / mixIn.V : 0
    const dose = vOut(10) ? P.doseTEA : 0
    for (let i = 0; i < 2; i++) {
      const c = s.cir[i], Q = c.Q
      const hexOn = i === 0 ? vOut(32) : vOut(9)                                   // TEA HEX feed on circuit 1, TW HEX feed on circuit 2 (ASSUMED)
      const mc = 1000 * (Q / 3600) * 4186
      const eps = mc > 1 ? 1 - Math.exp(-P.hexUA / mc) : 0
      const kIn = Q > 0.1 ? (ksrc * Q + P.kTEA * dose / 2) / (Q + dose / 2) : c.k
      const Tsup = hexOn && Q > 2 ? Tsrc + eps * (P.hexHot - Tsrc) : Tsrc     // the PLC closes the heating below 2 m3/h (ASSUMED)
      c.hex = hexOn && Q > 2 ? mc * (Tsup - Tsrc) : 0
      if (Q > 2) { c.Tsup += (Tsup - c.Tsup) * (1 - Math.exp(-dt / 4)); c.k += (kIn - c.k) * (1 - Math.exp(-dt / 4)) }
      else c.Tsup += (inp.ambient - c.Tsup) * (1 - Math.exp(-dt / 900))
      const Tret = c.Tsup - (Q > 0.2 ? 1.5 : 0)
      c.Tret += (Tret - c.Tret) * (1 - Math.exp(-dt / 12))
      // pump casing heats when dead-headed
      const gain = c.mode === 'dead-head' || c.mode === 'dry' ? c.P : 0
      c.case += (gain - P.casingG * (c.case - (Q > 0.2 ? c.Tsup : inp.ambient))) / P.casingC * dt
      if (c.mode === 'flow') c.case += (c.Tsup - c.case) * (1 - Math.exp(-dt / 10))
    }
    // tank mass and energy balance (m3/h -> m3/s)
    const h = dt / 3600, Qtot = s.cir[0].Q + s.cir[1].Q
    const nS = RR.src.length + (RR.line ? 1 : 0)
    for (const j of RR.src) s.tanks[j - 1].V -= Qtot / nS * h
    const nD = RR.dstT.length + (RR.drain ? 1 : 0)
    const TretMix = Qtot > 0.01 ? (s.cir[0].Tret * s.cir[0].Q + s.cir[1].Tret * s.cir[1].Q) / Qtot : 0
    const kRet = Qtot > 0.01 ? (s.cir[0].k * s.cir[0].Q + s.cir[1].k * s.cir[1].Q) / Qtot : 0
    const addTo = (j, dV, T, k) => { const tk = s.tanks[j - 1]; if (dV <= 0) return; tk.T = (tk.V * tk.T + dV * T) / (tk.V + dV); tk.k = (tk.V * tk.k + dV * k) / (tk.V + dV); tk.V += dV }
    for (const j of RR.dstT) addTo(j, Qtot / nD * h, TretMix, kRet)
    if (vOut(27)) addTo(1, P.feedTEA * h, P.tTEA, P.kTEA)
    if (vOut(28)) addTo(2, P.feedTW * h, P.tTW, P.kTW)
    if (vOut(30)) addTo(3, P.feedTW * h, P.tTW, P.kTW)
    for (const tk of s.tanks) {
      tk.over = tk.V > P.tankV
      tk.V = clampN(tk.V, 0, P.tankV)
      tk.T += -P.tankUA * (tk.T - inp.ambient) * dt / (1000 * 4186 * Math.max(0.05, tk.V))
    }
    // ---------------------------------------------------- 120 V: T1, the A/C (FU2) and the receptacle (CB5)
    const t1On = supply > 300
    const acPow = t1On && !inp.fAc
    // thermostat
    if (acPow) { if (!s.ac.comp && s.Tint > P.acSet + P.acHyst) s.ac.comp = true; else if (s.ac.comp && s.Tint < P.acSet - P.acHyst) s.ac.comp = false }
    else s.ac.comp = false
    s.ac.cap = P.acW * clampN(1 + 0.02 * (s.Tint - 35) - 0.01 * (inp.ambient - 35), 0.5, 1.4)
    s.ac.q = s.ac.comp ? s.ac.cap : 0
    const acA = acPow ? P.acFanA + (s.ac.comp ? P.acCompA : 0) : 0
    s.ac.a = acA
    s.t1.va = t1On ? 120 * acA / 0.85 + inp.laptopW / 0.95 : 0                  // VA at the secondary (A/C pf 0.85 ASSUMED)
    s.t1.loss = t1On ? P.t1Fe + P.t1Cu * (s.t1.va / P.t1VA) ** 2 : 0
    s.t1.iPri = t1On ? (s.t1.va + s.t1.loss) / supply : 0
    iLine += s.t1.iPri * 0.58 + s.pws.iIn                                            // single phase on L1-L2 shares ~ 1/sqrt3 per line
    s.iLine = iLine
    // ---------------------------------------------------- heat inside the enclosure
    const d0 = s.drv[0], d1 = s.drv[1]
    const H = {
      'DRV1': d0.loss, 'DRV2': d1.loss,
      'PWS1': s.pws.pLoss,
      '24 V devices': (s.ch[0].i * 24) + 0.6 * (s.ch[1].i * 24) + (s.cpl.filter(Boolean).length * 4) + s.ch[5].i * 24 + (pwsOn && s.ch[6].on ? 4.6 + 2.6 + 2.6 + 1 : 0),
      'T1': s.t1.loss,
      'CB1, CB2, Q1, FU1, wiring': 3 * P.rCb * (d0.Iin ** 2 + d1.Iin ** 2) + 3 * (0.0008 + 0.00015) * iLine ** 2 + 3 * 2 * 0.00206 * (d0.Iin ** 2 + d1.Iin ** 2 + d0.I ** 2 + d1.I ** 2) + 3 * 3 * 0.00081 * iLine ** 2,
      'A/C fan': acPow ? P.acFanW : 0,
    }
    s.heat = H
    s.pHeat = Object.values(H).reduce((a, b) => a + b, 0)
    const G = P.G + (inp.door ? P.gDoor : 0)
    const dtw = dt * Math.max(1, inp.warp)
    // settle point: without the A/C, or with its capacity cap(T) = acW (0.3 + 0.02 T - 0.01 (Ta - 35)) running flat out;
    // if that lands below the thermostat, the A/C cycles and holds the setpoint
    const TssNoAc = inp.ambient + s.pHeat / G
    if (!acPow || TssNoAc <= P.acSet) s.Tss = TssNoAc
    else s.Tss = Math.max(P.acSet, (inp.ambient * G + s.pHeat - P.acW * (0.3 - 0.01 * (inp.ambient - 35))) / (G + 0.02 * P.acW))
    s.Tint += (s.pHeat - s.ac.q - G * (s.Tint - inp.ambient)) / P.heatCap * dtw
    // ---------------------------------------------------- alarms
    const fN = fmtN
    setAlarm('SUPPLY_LOST', supply < 1, inp.q1 ? '480 V feeder lost' : 'Q1 disconnect open', 1)
    for (let i = 0; i < 2; i++) {
      const d = s.drv[i], c = s.cir[i], n = i + 1
      setAlarm(`CB${n}_TRIP`, !s.cb[i], `CB${n} 140MT tripped (${s.cbTrip[i] || 'off'}) - reset at the panel`, 1)
      setAlarm(`DRV${n}_FAULT`, d.st === 'fault', `DRV${n} fault: ${d.fault}`, 1)
      setAlarm(`P${n}_DRY`, d.st === 'running' && c.mode === 'dry' || c.bad >= 8 && !RR.ok.src, `Pump ${n}: no suction (no tank bottom or line feed open)${c.bad >= 8 ? ' - PLC stopped it' : ''}`, 2)
      setAlarm(`P${n}_DEADHEAD`, d.st === 'running' && c.mode === 'dead-head' || c.bad >= 8 && RR.ok.src && !RR.ok.dst, `Pump ${n}: dead-headed, casing ${fN(c.case)} deg C${c.bad >= 8 ? ' - PLC stopped it' : ''}`, 2)
      setAlarm(`DRV${n}_LIMIT`, d.lim, `DRV${n} in current limit at ${fN(d.I, 1)} A`, 2)
    }
    setAlarm('ESTOP', inp.estop, 'E-STOP pressed: safe torque off on DRV1 and DRV2', 1)
    setAlarm('CB4_TRIP', s.ch.some((c) => !c.on), `CB4 channel ${s.ch.map((c, k) => c.on ? '' : `${k + 1} (${CB4_LOADS[k].split(' ')[0]}, ${c.trip})`).filter(Boolean).join(', ')} off`, 1)
    setAlarm('PLC_DOWN', pwsOn && !s.plc, 'PLC1 has no power (CB4 channel 1)', 1)
    setAlarm('NET_DOWN', pwsOn && s.plc && !s.net, 'Machine network down (NS1 has no power, CB4 channel 7)', 1)
    for (let k = 0; k < 3; k++) setAlarm(`CPL${k + 1}_DOWN`, pwsOn && !s.cpl[k], `CPL${k + 1} IO-Link master off: its instruments read bad`, 2)
    setAlarm('PWS1_LIMIT', s.pws.limiting, `PWS1 overloaded: ${fN(iTot, 1)} A of 20 A`, 2)
    setAlarm('T1_OVERLOAD', s.t1.va > P.t1VA, `T1 at ${fN(s.t1.va)} VA of 750 VA`, 2)
    setAlarm('ENC_HOT', s.Tint >= P.tWarn && s.Tint < P.tAlarm, `Enclosure ${fN(s.Tint, 1)} deg C (warn ${P.tWarn})`, 3)
    setAlarm('ENC_HIHI', s.Tint >= P.tAlarm, `Enclosure ${fN(s.Tint, 1)} deg C: above the drives' 50 deg C rating`, 1)
    setAlarm('AC_SHORT', acPow && s.Tss > P.tAlarm, `A/C cannot hold the panel: it settles at ${fN(s.Tss, 1)} deg C with ${fN(s.pHeat)} W inside`, 2)
    setAlarm('AC_FAIL', supply > 0 && inp.fAc, 'Enclosure A/C failed (its alarm contact is not wired: SCADA sees only the temperature)', 2)
    setAlarm('DOOR_OPEN', inp.door, 'Panel door open: the A/C keeps running (its door switch X2-4/X2-5 is not wired)', 3)
    for (let j = 0; j < 3; j++) {
      const L = s.tanks[j].V / P.tankV * 100
      setAlarm(`TANK${j + 1}_LO`, L < 10, `Tank ${j + 1} level low: ${fN(L)} %`, 2)
      setAlarm(`TANK${j + 1}_HI`, L > 95, `Tank ${j + 1} level high: ${fN(L)} %${s.tanks[j].over ? ' (overflowing)' : ''}`, 2)
    }
    return s
  }

  // ---- field and SCADA actions
  function resetCb(i) { if (!s.cb[i]) { s.cb[i] = true; s.cbTrip[i] = ''; s.cbTh[i] *= 0.6; return true } return false }
  function openCb(i) { if (s.cb[i]) { s.cb[i] = false; s.cbTrip[i] = 'manual' } }
  function resetDrive(i) { const d = s.drv[i]; if (d.st === 'fault' && d.hs < P.tHsTrip - 5 && d.ol < 1) { d.st = 'ready'; d.fault = ''; s.cir[i].bad = 0; return true } if (d.st === 'fault') return false; s.cir[i].bad = 0; return true }
  function resetCh(k) { const c = s.ch[k]; if (!c.on) { c.on = true; c.acc = 0; c.trip = ''; return true } return false }
  function ack(id) { for (const a of alarms.values()) if (!id || a.id === id) { a.acked = true; if (!a.active) alarms.delete(a.id) } }
  const alarmList = () => [...alarms.values()].sort((a, b) => a.prio - b.prio || a.t0 - b.t0)
  const alarmWord = (w) => { let x = 0; ALARM_IDS.slice(w * 16, w * 16 + 16).forEach((id, k) => { if (alarms.get(id)?.active) x |= 1 << k }); return x }

  const panel = { P, inp, s, step, resetCb, openCb, resetDrive, resetCh, ack, alarmList, alarmWord }
  // settle the starting point: both pumps up to speed, no alarms kept
  if (init.warmStart !== false) {
    for (let k = 0; k < 300; k++) step(0.1)
    s.Tint = s.Tss; for (const d of s.drv) d.hs = s.Tint + P.rthHs * d.loss; s.t = 0
    alarms.clear(); step(0.05); for (const a of alarms.values()) a.acked = true
  }
  return panel
}
const ALARM_IDS = ['SUPPLY_LOST', 'CB1_TRIP', 'CB2_TRIP', 'DRV1_FAULT', 'DRV2_FAULT', 'ESTOP', 'P1_DRY', 'P2_DRY', 'P1_DEADHEAD', 'P2_DEADHEAD', 'DRV1_LIMIT', 'DRV2_LIMIT', 'CB4_TRIP', 'PLC_DOWN', 'NET_DOWN', 'PWS1_LIMIT',
  'CPL1_DOWN', 'CPL2_DOWN', 'CPL3_DOWN', 'T1_OVERLOAD', 'ENC_HOT', 'ENC_HIHI', 'AC_SHORT', 'AC_FAIL', 'DOOR_OPEN', 'TANK1_LO', 'TANK2_LO', 'TANK3_LO', 'TANK1_HI', 'TANK2_HI', 'TANK3_HI']
function fmtN(v, d = 0) { return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) }
function clampN(v, a, b) { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a }
const DRV_STATES = ['off', 'ready', 'running', 'sto', 'fault']

// ---------------------------------------------------------------- the SCADA tag map (Modbus TCP, zero based addresses, assigned in order)
// ir: input registers (FC4), di: discrete inputs (FC2), hr: holding registers (FC3/6/16), co: coils (FC1/5/15)
// Registers are unsigned 16 bit, raw = value x scale. An instrument whose IO-Link master is off reads 65535 (bad).
const BAD = 65535
const inst = (p, tag, v) => (ON_CPL[tag] === undefined || p.s.cpl[ON_CPL[tag]]) ? v : NaN
const T_ = []
const ir = (name, scale, unit, desc, get) => T_.push({ name, kind: 'ir', scale, unit, desc, get })
const di = (name, desc, get) => T_.push({ name, kind: 'di', desc, get })
const hr = (name, scale, unit, desc, get, set) => T_.push({ name, kind: 'hr', scale, unit, desc, get, set })
const co = (name, desc, get, set) => T_.push({ name, kind: 'co', desc, get, set })
// power
ir('VFD200.Supply.Voltage', 1, 'V', '480 V feeder at Q1 (line to line)', (p) => p.s.vBus)
ir('VFD200.Supply.Current', 10, 'A', 'Line current through FU1 (largest phase)', (p) => p.s.iLine)
for (const n of [1, 2]) {
  const i = n - 1, D = (p) => p.s.drv[i], C = (p) => p.s.cir[i]
  ir(`VFD200.DRV${n}.State`, 1, '', '0 off, 1 ready, 2 running, 3 safe torque off, 4 fault', (p) => DRV_STATES.indexOf(D(p).st))
  ir(`VFD200.DRV${n}.OutFreq`, 10, 'Hz', `DRV${n} output frequency`, (p) => D(p).f)
  ir(`VFD200.DRV${n}.OutCurrent`, 10, 'A', `DRV${n} output (motor) current`, (p) => D(p).I)
  ir(`VFD200.DRV${n}.OutVoltage`, 1, 'V', `DRV${n} output voltage`, (p) => D(p).vOut)
  ir(`VFD200.DRV${n}.OutPower`, 100, 'kW', `DRV${n} output power`, (p) => D(p).pOut / 1000)
  ir(`VFD200.DRV${n}.InCurrent`, 10, 'A', `DRV${n} input current (through CB${n})`, (p) => D(p).Iin)
  ir(`VFD200.DRV${n}.Loss`, 1, 'W', `DRV${n} heat released in the panel`, (p) => D(p).loss)
  ir(`VFD200.DRV${n}.Heatsink`, 10, '°C', `DRV${n} heatsink (F8 at ${P.tHsTrip} °C)`, (p) => D(p).hs)
  ir(`VFD200.DRV${n}.MotorOL`, 1, '%', `DRV${n} motor overload accumulator, % of trip`, (p) => Math.min(100, D(p).ol / 1.1025 * 100))
  ir(`VFD200.MTR${n}.Speed`, 1, 'rpm', `MTR${n} shaft speed`, (p) => D(p).n)
  ir(`VFD200.MTR${n}.Torque`, 10, 'N·m', `MTR${n} torque`, (p) => D(p).tq)
  ir(`VFD200.CB${n}.Thermal`, 1, '%', `CB${n} 140MT thermal element, % of trip`, (p) => Math.min(100, p.s.cbTh[i] / 1.44 * 100))
  ir(`VFD200.P${n}.Head`, 10, 'm', `Pump ${n} head`, (p) => C(p).H)
  ir(`VFD200.P${n}.ShaftPower`, 100, 'kW', `Pump ${n} shaft power`, (p) => C(p).P / 1000)
  ir(`VFD200.P${n}.CasingTemp`, 10, '°C', `Pump ${n} casing water (dead-head)`, (p) => C(p).case)
}
// instruments (sheets 11-13): supply circuit 1 = FM1 TT1 CE1, return 1 = FM3 TT2; circuit 2 = FM2 TT3, return 2 = FM4 TT4 (ASSUMED assignment)
ir('VFD200.FM1.Flow', 10, 'm³/h', 'FM1 supply 1 flow (8721 mag, via SI2/SC2)', (p) => inst(p, 'FM1', p.s.cir[0].Q))
ir('VFD200.FM2.Flow', 10, 'm³/h', 'FM2 supply 2 flow (SUH401)', (p) => inst(p, 'FM2', p.s.cir[1].Q))
ir('VFD200.FM3.Flow', 10, 'm³/h', 'FM3 return 1 flow (SUH401)', (p) => inst(p, 'FM3', p.s.cir[0].Qr))
ir('VFD200.FM4.Flow', 10, 'm³/h', 'FM4 return 2 flow (SUH401)', (p) => inst(p, 'FM4', p.s.cir[1].Qr))
ir('VFD200.TT1.Temp', 10, '°C', 'TT1 supply 1 temperature', (p) => inst(p, 'TT1', p.s.cir[0].Tsup))
ir('VFD200.TT2.Temp', 10, '°C', 'TT2 return 1 temperature', (p) => inst(p, 'TT2', p.s.cir[0].Tret))
ir('VFD200.TT3.Temp', 10, '°C', 'TT3 supply 2 temperature', (p) => inst(p, 'TT3', p.s.cir[1].Tsup))
ir('VFD200.TT4.Temp', 10, '°C', 'TT4 return 2 temperature', (p) => inst(p, 'TT4', p.s.cir[1].Tret))
ir('VFD200.CE1.Cond', 10, 'mS/cm', 'CE1 supply conductivity (Rosemount 1056, via SI1/SC1)', (p) => inst(p, 'CE1', p.s.cir[0].Q > 0.2 ? p.s.cir[0].k : 0))
for (const j of [1, 2, 3]) {
  ir(`VFD200.LT${j}.Level`, 10, '%', `LT${j} tank ${j} level (PM1708, hydrostatic)`, (p) => inst(p, `LT${j}`, p.s.tanks[j - 1].V / P.tankV * 100))
  ir(`VFD200.CE${j + 1}.Cond`, 10, 'mS/cm', `CE${j + 1} tank ${j} conductivity (LDL201) (ASSUMED location)`, (p) => inst(p, `CE${j + 1}`, p.s.tanks[j - 1].k))
  ir(`VFD200.Tank${j}.Temp`, 10, '°C', `Tank ${j} temperature (CE${j + 1} LDL201 temperature)`, (p) => inst(p, `CE${j + 1}`, p.s.tanks[j - 1].T))
}
// 24 V and 120 V
ir('VFD200.PWS1.Current', 100, 'A', 'PWS1 24 V output current', (p) => p.s.pws.i)
for (let k = 0; k < 8; k++) ir(`VFD200.CB4.Ch${k + 1}.Current`, 100, 'A', `CB4 OUT${k + 1}: ${CB4_LOADS[k]} (set ${P.cb4Set[k]} A)`, (p) => p.s.ch[k].i)
ir('VFD200.T1.Load', 1, 'VA', 'T1 load (A/C + receptacle)', (p) => p.s.t1.va)
// heat (simulation only: the design has no enclosure temperature sensor)
ir('VFD200.Heat.Internal', 1, 'W', 'Heat released inside the enclosure', (p) => p.s.pHeat)
ir('VFD200.AC.Cooling', 1, 'W', 'A/C heat removed now', (p) => p.s.ac.q)
ir('VFD200.Enc.Temp', 10, '°C', 'Enclosure air (SIMULATION: no sensor in the design)', (p) => p.s.Tint)
ir('VFD200.Enc.TempSettle', 10, '°C', 'Temperature it settles at', (p) => p.s.Tss)
ir('VFD200.Ambient.Temp', 10, '°C', 'Room ambient', (p) => p.inp.ambient)
ir('VFD200.Alarm.Word0', 1, '', 'Active alarm bits 0-15 (see README)', (p) => p.alarmWord(0))
ir('VFD200.Alarm.Word1', 1, '', 'Active alarm bits 16-31 (see README)', (p) => p.alarmWord(1))
ir('VFD200.Heartbeat', 1, '', 'Counts every solver step', (p) => p.s.beat)
// discrete inputs
di('VFD200.Q1.Closed', 'Q1 disconnect closed', (p) => p.inp.q1)
di('VFD200.CB1.Closed', 'CB1 closed', (p) => p.s.cb[0])
di('VFD200.CB2.Closed', 'CB2 closed', (p) => p.s.cb[1])
di('VFD200.DRV1.Running', 'DRV1 running', (p) => p.s.drv[0].st === 'running')
di('VFD200.DRV2.Running', 'DRV2 running', (p) => p.s.drv[1].st === 'running')
di('VFD200.DRV1.Faulted', 'DRV1 faulted', (p) => p.s.drv[0].st === 'fault')
di('VFD200.DRV2.Faulted', 'DRV2 faulted', (p) => p.s.drv[1].st === 'fault')
di('VFD200.EStop.Healthy', 'E-stop released (STO inputs energised)', (p) => !p.inp.estop)
di('VFD200.PLC1.Running', 'PLC1 powered', (p) => p.s.plc)
di('VFD200.Net.OK', 'Machine network up (NS1)', (p) => p.s.net)
for (let k = 0; k < 3; k++) di(`VFD200.CPL${k + 1}.OK`, `CPL${k + 1} IO-Link master powered`, (p) => p.s.cpl[k])
for (let k = 0; k < 8; k++) di(`VFD200.CB4.Ch${k + 1}.On`, `CB4 OUT${k + 1} on`, (p) => p.s.ch[k].on)
di('VFD200.AC.Compressor', 'A/C compressor running', (p) => p.s.ac.comp)
di('VFD200.Alarm.Any', 'Any alarm active', (p) => p.alarmWord(0) !== 0 || p.alarmWord(1) !== 0)
for (const k of VNAMES) di(`VFD200.VM1.Y${String(k).padStart(2, '0')}.Out`, `VM1 output ${k} energised: ${VALVES[k]}`, (p) => !!(p.s.vm1 && p.inp.valves[k]))
// holding registers: PLC setpoints from SCADA, panel settings, instructor
hr('VFD200.DRV1.SpeedRef', 10, 'Hz', 'DRV1 speed reference (P047 EtherNet/IP)', (p) => p.inp.fRef[0], (p, v) => { p.inp.fRef[0] = clampN(v, 0, P.fMax) })
hr('VFD200.DRV2.SpeedRef', 10, 'Hz', 'DRV2 speed reference (P047 EtherNet/IP)', (p) => p.inp.fRef[1], (p, v) => { p.inp.fRef[1] = clampN(v, 0, P.fMax) })
hr('VFD200.CB1.Setting', 10, 'A', 'CB1 thermal dial (24-32 A)', (p) => p.inp.cbSet[0], (p, v) => { p.inp.cbSet[0] = clampN(v, 24, 32) })
hr('VFD200.CB2.Setting', 10, 'A', 'CB2 thermal dial (24-32 A)', (p) => p.inp.cbSet[1], (p, v) => { p.inp.cbSet[1] = clampN(v, 24, 32) })
hr('VFD200.RCP1.Load', 1, 'W', 'Laptop on the receptacle (simulation)', (p) => p.inp.laptopW, (p, v) => { p.inp.laptopW = clampN(v, 0, 300) })
hr('VFD200.Supply.VoltageSP', 1, 'V', 'Feeder voltage (simulation)', (p) => p.inp.vLL, (p, v) => { p.inp.vLL = clampN(v, 0, 540) })
hr('VFD200.Ambient.TempSP', 10, '°C', 'Room ambient (simulation)', (p) => p.inp.ambient, (p, v) => { p.inp.ambient = clampN(v, -10, 50) })
hr('VFD200.Sim.TimeWarp', 1, 'x', 'Thermal time warp (enclosure and heatsinks only)', (p) => p.inp.warp, (p, v) => { p.inp.warp = clampN(Math.round(v), 1, 600) })
// coils
co('VFD200.DRV1.Run', 'DRV1 run command (PLC, P046 EtherNet/IP)', (p) => p.inp.run[0], (p, v) => { p.inp.run[0] = !!v; if (v) p.s.cir[0].bad = 0 })
co('VFD200.DRV2.Run', 'DRV2 run command (PLC, P046 EtherNet/IP)', (p) => p.inp.run[1], (p, v) => { p.inp.run[1] = !!v; if (v) p.s.cir[1].bad = 0 })
co('VFD200.DRV1.FaultReset', 'DRV1 fault reset (pulse)', () => false, (p, v) => { if (v) p.resetDrive(0) })
co('VFD200.DRV2.FaultReset', 'DRV2 fault reset (pulse)', () => false, (p, v) => { if (v) p.resetDrive(1) })
for (let k = 0; k < 8; k++) co(`VFD200.CB4.Ch${k + 1}.Reset`, `CB4 OUT${k + 1} reset (pulse)`, () => false, (p, v) => { if (v) p.resetCh(k) })
co('VFD200.Cmd.AckAll', 'Acknowledge all alarms (pulse)', () => false, (p, v) => { if (v) p.ack() })
for (const k of VNAMES) co(`VFD200.VM1.Y${String(k).padStart(2, '0')}`, `VM1 output ${k}: ${VALVES[k]}`, (p) => !!p.inp.valves[k], (p, v) => { p.inp.valves[k] = !!v })
co('VFD200.Field.EStop', 'Field: E-STOP pressed', (p) => p.inp.estop, (p, v) => { p.inp.estop = !!v })
co('VFD200.Field.Q1', 'Field: Q1 disconnect closed', (p) => p.inp.q1, (p, v) => { p.inp.q1 = !!v })
co('VFD200.Field.CB1Reset', 'Field: reset CB1 (pulse)', () => false, (p, v) => { if (v) p.resetCb(0) })
co('VFD200.Field.CB2Reset', 'Field: reset CB2 (pulse)', () => false, (p, v) => { if (v) p.resetCb(1) })
co('VFD200.Field.DoorOpen', 'Field: a panel door is open', (p) => p.inp.door, (p, v) => { p.inp.door = !!v })
co('VFD200.Fault.ACFail', 'Fault: enclosure A/C failed', (p) => p.inp.fAc, (p, v) => { p.inp.fAc = !!v })
co('VFD200.Fault.SupplyLost', 'Fault: 480 V feeder lost', (p) => p.inp.fSupply, (p, v) => { p.inp.fSupply = !!v })
co('VFD200.Fault.Pump1Seized', 'Fault: pump 1 seized', (p) => p.inp.fSeize, (p, v) => { p.inp.fSeize = !!v })
co('VFD200.Fault.ShortCB4Ch3', 'Fault: short on CB4 OUT3 (CPL1 sensor supply)', (p) => p.inp.fShortCh3, (p, v) => { p.inp.fShortCh3 = !!v })
// zero based addresses in order of declaration, per kind
const nextAddr = { ir: 0, di: 0, hr: 0, co: 0 }
for (const t of T_) t.addr = nextAddr[t.kind]++
export const TAGS = T_
export { ALARM_IDS, BAD }

// one JSON snapshot of everything a client draws
export function snapshot(p) {
  const tags = {}
  for (const t of TAGS) { const v = t.get(p); tags[t.name] = typeof v === 'boolean' ? v : Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null }
  const s = p.s
  return {
    t: s.t, tags, alarms: p.alarmList(),
    drv: s.drv.map((d) => ({ st: d.st, fault: d.fault, lim: d.lim })),
    cir: s.cir.map((c) => ({ mode: c.mode, hex: c.hex })),
    cb: s.cb.slice(), cbTrip: s.cbTrip.slice(), ch: s.ch.map((c) => ({ on: c.on, trip: c.trip })),
    heat: Object.fromEntries(Object.entries(s.heat).map(([k, v]) => [k, Math.round(v * 10) / 10])),
    valves: { ...p.inp.valves }, inp: { estop: p.inp.estop, q1: p.inp.q1, door: p.inp.door, fAc: p.inp.fAc, fSupply: p.inp.fSupply, fSeize: p.inp.fSeize, fShortCh3: p.inp.fShortCh3, run: p.inp.run.slice() },
  }
}

export function writeTag(p, name, value) {
  const t = TAGS.find((x) => x.name === name)
  if (!t || !t.set) return false
  t.set(p, value)
  return true
}

export default { P, TAGS, VALVES, CB4_LOADS, ALARM_IDS, BAD, createPanel, snapshot, writeTag }
