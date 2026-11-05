// Where every terminal sits on its device, and which way the wire goes in.
// [u, v, z, entry]: u across the device face from its left edge (0..1), v down from its top edge (0..1),
// z the depth of the clamp as a fraction of the body depth (1 = the front face),
// entry: 't' wire comes in from above, 'b' from below, 'f' from the front, 'l' from the left.
// Positions were read off the manufacturers' face images on sheet 3 (the screw heads, plugs and push-in openings)
// and the terminal figures in the manuals held in PartsLib; pin names follow the PartsLib pin lists.
// conf: 'measured' (read off the face image or a manual figure) or 'approx' (terminals not visible: placed where the
// manual says they are, spacing assumed).

const row = (names, u0, u1, v, z, e) => Object.fromEntries(names.map((n, i) => [n, [names.length === 1 ? (u0 + u1) / 2 : u0 + (u1 - u0) * i / (names.length - 1), v, z, e]]))

export const LAYOUTS = {
  '140MT': {
    conf: 'measured', src: 'face image, sheet 3 (140MT-F line drawing): screw centres; PartsLib pins L1-L3/T1-T3',
    pins: { ...row(['L1', 'L2', 'L3'], 0.18, 0.82, 0.09, 0.86, 't'), ...row(['T1', 'T2', 'T3'], 0.18, 0.82, 0.91, 0.86, 'b') },
  },
  FAZ3: {
    conf: 'measured', src: 'face image, sheet 3 (FAZ-D2-3-NA): screw centres',
    pins: { ...row(['L1', 'L2', 'L3'], 0.17, 0.83, 0.19, 0.82, 't'), ...row(['T1', 'T2', 'T3'], 0.17, 0.83, 0.81, 0.82, 'b') },
  },
  FAZ1: { conf: 'measured', src: 'face image, sheet 3 (FAZ-C2-1)', pins: { L1: [0.5, 0.19, 0.82, 't'], T1: [0.5, 0.81, 0.82, 'b'] } },
  CHCC: { conf: 'measured', src: 'face image, sheet 3 (CHCC1DU)', pins: { '1L1': [0.5, 0.09, 0.8, 't'], '2T1': [0.5, 0.89, 0.8, 'b'] } },
  Q1: {
    conf: 'measured', src: 'face image, sheet 3 (1494U-D100), measured on a 2.5 % grid: lug screws at 12.5/37.5/62.5 % across, line row 7.5 %, load row 50.5 % down; PartsLib pins L1-L3 line, T1-T3 load',
    pins: { ...row(['L1', 'L2', 'L3'], 0.125, 0.625, 0.075, 0.92, 't'), ...row(['T1', 'T2', 'T3'], 0.125, 0.625, 0.505, 0.92, 'b'), '2T1': [0.125, 0.505, 0.92, 'b'], '4T2': [0.375, 0.505, 0.92, 'b'], '6T3': [0.625, 0.505, 0.92, 'b'] },
  },
  FU1: {
    conf: 'measured', src: 'face image, sheet 3 (1494U-F100), 2.5 % grid: line clip screws at 20 % down, load box-lug wire holes at 55 % down (clamp screw above each)',
    pins: { L1: [0.2, 0.2, 0.8, 't'], L2: [0.52, 0.2, 0.8, 't'], L3: [0.84, 0.2, 0.8, 't'], T1: [0.155, 0.58, 0.85, 'b'], T2: [0.49, 0.58, 0.85, 'b'], T3: [0.83, 0.58, 0.85, 'b'] },
  },
  PDB1: (() => {
    // 1492-TD019 p.14 / PartsLib pins: per pole one line lug (top), two large load openings and two rows of three small ones;
    // offsets from the pole's line lug measured on the face image (2.5 % grid)
    const pins = {}
    ;[0.202, 0.504, 0.804].forEach((c, k) => {
      const p = `L${k + 1}`
      pins[p] = [c, 0.378, 0.95, 't']
      pins[`${p}-1`] = [c - 0.03, 0.555, 0.95, 'b']; pins[`${p}-2`] = [c + 0.02, 0.555, 0.95, 'b']
      pins[`${p}-3`] = [c - 0.053, 0.627, 0.95, 'b']; pins[`${p}-4`] = [c - 0.012, 0.627, 0.95, 'b']; pins[`${p}-5`] = [c + 0.027, 0.627, 0.95, 'b']
      pins[`${p}-6`] = [c - 0.053, 0.696, 0.95, 'b']; pins[`${p}-7`] = [c - 0.012, 0.696, 0.95, 'b']; pins[`${p}-8`] = [c + 0.027, 0.696, 0.95, 'b']
    })
    return { conf: 'measured', src: 'face image, sheet 3 (2.5 % grid), and 1492-TD019 p.14 (one line, two large and six small load openings per pole)', pins }
  })(),
  E750WB: {
    conf: 'measured', src: 'face image, sheet 3 (E750WB), 2.5 % grid: screw centres; terminal order H1 H3 H2 H4 across the top as printed, X2 X1 at the bottom',
    pins: { H1: [0.305, 0.115, 0.98, 't'], H3: [0.435, 0.115, 0.98, 't'], H2: [0.565, 0.115, 0.98, 't'], H4: [0.695, 0.115, 0.98, 't'], X2: [0.435, 0.88, 0.98, 'b'], X1: [0.565, 0.88, 0.98, 'b'] },
  },
  PF525: (() => {
    // 520-UM001 p.36 power block (frame A-D): R/L1 S/L2 T/L3 U/T1 V/T2 W/T3 in one row, PE DC- DC+/BR+ BR- PE below;
    // p.42 control block: top row R1 R2 R5 R6 01-08 C1 C2, bottom row S1 S2 S+ 11-19.
    const pins = { ...row(['L1', 'L2', 'L3', 'T1', 'T2', 'T3'], 0.2, 0.74, 0.9, 0.36, 'b'), PE: [0.13, 0.955, 0.33, 'b'], 'DC-': [0.36, 0.955, 0.33, 'b'], 'DC+': [0.48, 0.955, 0.33, 'b'], 'BR-': [0.6, 0.955, 0.33, 'b'] }
    const top = ['R1', 'R2', 'R5', 'R6', '01', '02', '03', '04', '05', '06', '07', '08', 'C1', 'C2']
    top.forEach((n, i) => { pins[n] = [0.13 + i * 0.052 + (i > 3 ? 0.012 : 0) + (i > 11 ? 0.012 : 0), 0.345, 0.82, 'b'] })
    const bot = ['S1', 'S2', 'S+', '11', '12', '13', '14', '15', '16', '17', '18', '19']
    bot.forEach((n, i) => { pins[n] = [0.13 + i * 0.052 + (i > 2 ? 0.064 : 0), 0.375, 0.8, 'b'] })
    pins['4'] = pins['04']; pins.RJ45 = [0.86, 0.31, 0.84, 'b']
    return { conf: 'documented', src: '520-UM001 p.36 (power block order) and p.42 (control block order); blocks are behind the control module front cover (just under the keypad) and the power module terminal guard (bottom), 520-UM001 p.32. Shown with both covers off in the wiring steps', pins }
  })(),
  PB2: {
    conf: 'documented', src: '1769-IN028 p.5 (terminal block, item 5: one column of five screws behind the door, right of centre) and p.11 (1 and 2 not used on PB2, 3 +24V DC, 4 DC neutral, 5 chassis ground)',
    pins: { '1': [0.74, 0.5, 0.9, 'f'], '2': [0.74, 0.58, 0.9, 'f'], '3': [0.74, 0.66, 0.9, 'f'], '4': [0.74, 0.74, 0.9, 'f'], '5': [0.74, 0.82, 0.9, 'f'], '+24V DC': [0.74, 0.66, 0.9, 'f'], 'DC COM': [0.74, 0.74, 0.9, 'f'], 'FG / GND': [0.74, 0.82, 0.9, 'f'] },
  },
  L30ER: { conf: 'measured', src: 'face image, sheet 3: Ethernet ports 1 (front) and 2 (rear) on the underside', pins: { 'ETH 1': [0.4, 0.995, 0.75, 'b'], 'ETH 2': [0.4, 0.995, 0.4, 'b'] } },
  OW16: (() => {
    // 1769-IN062 p.8: two staggered columns. Left: OUT 0, 2, 4, 6, VAC-VDC 2, OUT 8, 10, 12, 14; right (half a row higher): VAC-VDC 1, OUT 1, 3, 5, 7, 9, 11, 13, 15
    const L = ['OUT 0', 'OUT 2', 'OUT 4', 'OUT 6', 'VAC-VDC 2', 'OUT 8', 'OUT 10', 'OUT 12', 'OUT 14'], R = ['VAC-VDC 1', 'OUT 1', 'OUT 3', 'OUT 5', 'OUT 7', 'OUT 9', 'OUT 11', 'OUT 13', 'OUT 15']
    const pins = {}; L.forEach((n, i) => { pins[n] = [0.36, 0.27 + i * 0.0725, 0.92, 'f'] }); R.forEach((n, i) => { pins[n] = [0.64, 0.234 + i * 0.0725, 0.92, 'f'] })
    return { conf: 'documented', src: '1769-IN062 p.8 (Output Wiring figure): two staggered columns behind the door', pins }
  })(),
  GLG: (() => {
    // measured at 900 dpi on sheet 3: screw columns 22/41/59/78 % across; rows 7.1 % and 13.9 % (top), 90.6 % and 97.5 % (bottom)
    const pins = {}; const us = [0.22, 0.41, 0.59, 0.78]
    for (let i = 0; i < 4; i++) { pins[String(1 + i)] = [us[i], 0.071, 0.88, 't']; pins[String(5 + i)] = [us[i], 0.139, 0.92, 't']; pins[String(9 + i)] = [us[i], 0.906, 0.92, 'b']; pins[String(13 + i)] = [us[i], 0.975, 0.88, 'b'] }
    return { conf: 'measured', src: 'sheet 3 rendered at 900 dpi: four screws in two rows top and bottom. Numbering (1-4 outer top, 5-8 inner top, 9-12 inner bottom, 13-16 outer bottom) follows PartsLib pins 9 AIn+, 10 AIn-; the GLG has no manufacturer document to confirm the rest', pins }
  })(),
  AL1920: (() => {
    // ifm 80281466 p.5 (X31: 1-2 GND, 3-4 +24 V; ports: 1 L+, 2 DI, 3 L-, 4 C/Q) and p.9 (terminal arrangement: X01 rear / X02 front on the
    // top left, X05 rear / X06 front top right, X03 front / X04 rear bottom left, X07 front / X08 rear bottom right, X31 underneath).
    // Pin numbers printed on the face: "4 3 2 1" across each top group, "1 2 3 4" across each bottom group.
    const pins = { X21: [0.53, 0.52, 0.98, 'f'], X22: [0.27, 0.52, 0.98, 'f'], X23: [0.27, 0.66, 0.98, 'f'] }
    for (let k = 1; k <= 4; k++) pins[`X31-${k}`] = [0.24 + (k - 1) * 0.06, 0.995, 0.45, 'b']
    const L = [0.127, 0.22, 0.31, 0.40], R = [0.585, 0.685, 0.78, 0.87]
    const ports = { X01: [L, 'top', 'rear'], X02: [L, 'top', 'front'], X05: [R, 'top', 'rear'], X06: [R, 'top', 'front'], X03: [L, 'bot', 'front'], X04: [L, 'bot', 'rear'], X07: [R, 'bot', 'front'], X08: [R, 'bot', 'rear'] }
    for (const [p, [cols, side, lvl]] of Object.entries(ports)) for (let k = 1; k <= 4; k++) {
      const u = side === 'top' ? cols[4 - k] : cols[k - 1]
      const v = side === 'top' ? (lvl === 'rear' ? 0.025 : 0.1) : (lvl === 'rear' ? 0.975 : 0.9)
      pins[`${p}-${k}`] = [u, v, lvl === 'rear' ? 0.78 : 0.95, side === 'top' ? 't' : 'b']
    }
    return { conf: 'documented', src: 'ifm AL1920 operating instructions 80281466 p.5 (pin functions) and p.9 (terminal arrangement), pin numbers printed on the face (sheet 3)', pins }
  })(),
  EPSITRON: (() => {
    // 2.5 % grid on the sheet 3 face: two large push-ins top (DC24+ then 0 V), a 2 x 2 block below, eight outputs in a column, signal block at the bottom
    const pins = { 'DC24+': [0.39, 0.064, 0.95, 'f'], '0V (upper, line 0714)': [0.39, 0.128, 0.95, 'f'], '0V (lower, line 0715)': [0.19, 0.23, 0.95, 'f'], '0V': [0.39, 0.128, 0.95, 'f'] }
    for (let n = 1; n <= 8; n++) { pins[`OUT${n}`] = [0.2, 0.343 + (n - 1) * 0.0374, 0.95, 'f']; pins[`OUT ${n}`] = pins[`OUT${n}`] }
    for (let n = 1; n <= 3; n++) pins[`S${n}`] = [0.2, 0.82 + (n - 1) * 0.046, 0.95, 'f']
    return { conf: 'measured', src: 'face image, sheet 3 (787-1668), 2.5 % grid; PartsLib pins. Which large input is DC24+ and which 0 V follows sheet 7 (OUT- of PWS1 to the upper 0 V)', pins }
  })(),
  PRO2: {
    conf: 'measured', src: 'face image, sheet 3 (2787-2347), 2.5 % grid: X2 pins 1-5 at 28.7/39.4/49.6/60/70.9 % across the top (1-3 OUT-, 4-5 OUT+), X1 pins 1-4 across the bottom (L1 L2 L3 PE)',
    pins: { '1': [0.287, 0.025, 0.9, 't'], '2': [0.394, 0.025, 0.9, 't'], '3': [0.496, 0.025, 0.9, 't'], '4': [0.6, 0.025, 0.9, 't'], '5': [0.709, 0.025, 0.9, 't'], ...row(['L1', 'L2', 'L3', 'PE'], 0.29, 0.71, 0.98, 0.9, 'b') },
  },
  FL1116: (() => {
    const pins = { 'US+': [0.42, 0.985, 0.55, 'b'], 'US-': [0.58, 0.985, 0.55, 'b'], 'US−': [0.58, 0.985, 0.55, 'b'] }
    const top = [0.065, 0.16, 0.245, 0.336], bot = [0.5, 0.59, 0.69, 0.79]
    for (let n = 1; n <= 16; n++) { const i = (n - 1) % 8; pins[String(n)] = [i % 2 ? 0.68 : 0.335, (n <= 8 ? top : bot)[Math.floor(i / 2)], 0.98, 'f'] }
    return { conf: 'measured', src: 'face image, sheet 3, 2.5 % grid: 16 RJ45 in two blocks of 2 x 4; supply plug underneath. Port numbering (odd left, even right, 1-8 in the upper block) is the FL SWITCH convention but not printed on the face', pins }
  })(),
  NAT102: { conf: 'measured', src: 'face image, sheet 3, 2.5 % grid: port 2 EXTERNAL (WAN) at 59 %, port 1 INTERNAL (LAN) at 84 % down, supply on top', pins: { 'V+': [0.4, 0.02, 0.8, 't'], 'V-': [0.6, 0.02, 0.8, 't'], 'V−': [0.6, 0.02, 0.8, 't'], WAN: [0.5, 0.59, 0.98, 'f'], LAN: [0.5, 0.84, 0.98, 'f'] } },
  PTFIX12: (() => {
    const pins = { IN: [0.12, 0.5, 0.92, 'f'] }   // V5: the 6 mm2 feed is a front push-in too (a side entry is blocked by the next block)
    // V5: PTFIX push-in openings face the front (the conductor goes straight in, Phoenix data sheet), not the top or bottom
    for (let n = 1; n <= 12; n++) pins[`OUT${n}`] = [0.29 + ((n - 1) % 6) * 0.12, n <= 6 ? 0.23 : 0.67, 0.9, 'f']
    return { conf: 'measured', src: 'face image, sheet 3 (PTFIX 6/12X2,5), 2.5 % grid: 6 mm² feed at 12 % across, push-in openings in two rows of six at 23 % and 67 % down, 12 % pitch', pins }
  })(),
  PTFIX18: (() => {
    const pins = { IN: [0.095, 0.5, 0.92, 'f'] }
    for (let n = 1; n <= 18; n++) pins[`OUT${n}`] = [0.215 + ((n - 1) % 9) * 0.0925, n <= 9 ? 0.23 : 0.67, 0.9, 'f']
    return { conf: 'measured', src: 'face image, sheet 3 (PTFIX 6/18X2,5), 2.5 % grid: 6 mm² feed at 9.5 % across, push-in openings in two rows of nine at 23 % and 67 % down', pins }
  })(),
  D167: (() => {
    const pins = {}; for (let n = 1; n <= 14; n++) pins[`TAP${n}`] = [0.5, 0.06 + (n - 1) * 0.0677, 0.95, 'l']
    return { conf: 'measured', src: 'ILSCO D167 catalogue page: 14 taps; taps used in wire-list order', pins }
  })(),
}

// which layout each device tag uses
export const DEVICE_LAYOUT = {
  CB1: '140MT', CB2: '140MT', CB3: 'FAZ3', CB5: 'FAZ1', FU2: 'CHCC', Q1: 'Q1', FU1: 'FU1', PDB1: 'PDB1', T1: 'E750WB',
  DRV1: 'PF525', DRV2: 'PF525', PWS2: 'PB2', PLC1: 'L30ER', IO1: 'OW16',
  SI1: 'GLG', SI2: 'GLG', SI3: 'GLG', SI4: 'GLG', SI5: 'GLG', SI6: 'GLG',
  CPL1: 'AL1920', CPL2: 'AL1920', CPL3: 'AL1920', CB4: 'EPSITRON', PWS1: 'PRO2', NS1: 'FL1116', NS2: 'NAT102',
  PDB2: 'PTFIX12', PDB3: 'PTFIX18', GB1: 'D167',
}

// terminal strips: screw rows across the block (fraction of the block height from its top) and clamp depth
export const STRIP_LAYOUT = {
  // The terminal symbols on sheet 3 are not to scale (their screws are not even symmetric about the rail), so the strips are
  // modelled from the block itself: a 60 mm feed-through with one screw clamp near each end, the wire entering below the screw.
  J4: { conf: 'documented', src: '1492-J4: 6.1 x 60 mm, one clamp per side (1492-TD015 p.2); screws modelled 17 mm either side of the rail centre', inside: 0.22, field: 0.78 },
  J6: { conf: 'documented', src: '1492-J6: 8.1 x 60 x 39.5 mm (BOM), one clamp per side; screws 17 mm either side of the rail centre', inside: 0.22, field: 0.78 },
  JD4: { conf: 'documented', src: '1492-JD4: two-level, 6.1 x 60.7 mm (PartsLib), two clamps per side; upper level (T) is the inner, higher pair, lower level (B) the outer pair', T: [0.32, 0.68], B: [0.12, 0.88] },
}

// IO-Link cable cores (IEC 61131-9 M12 colours: pin 1 L+ brown, pin 3 L- blue, pin 4 C/Q black). The LUTZE A1021803-1
// cable has black, brown and blue cores (BOM sheet 17). Colour per pin is the IO-Link convention, not printed on the drawing.
export const IOL_CORE = { 1: { color: '#7a4a24', name: 'BN' }, 3: { color: '#1f4fb8', name: 'BU' }, 4: { color: '#141414', name: 'BK' }, 2: { color: '#e9e9e4', name: 'WH' } }
