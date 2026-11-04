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
    conf: 'measured', src: 'face image, sheet 3 (1494U-D100): lug centres; PartsLib pins L1-L3 line (top), T1-T3 load',
    pins: { ...row(['L1', 'L2', 'L3'], 0.1, 0.62, 0.04, 0.92, 't'), ...row(['T1', 'T2', 'T3'], 0.1, 0.62, 0.53, 0.92, 'b'), '2T1': [0.1, 0.53, 0.92, 'b'], '4T2': [0.36, 0.53, 0.92, 'b'], '6T3': [0.62, 0.53, 0.92, 'b'] },
  },
  FU1: {
    conf: 'measured', src: 'face image, sheet 3 (1494U-F100): clip and lug centres',
    pins: { ...row(['L1', 'L2', 'L3'], 0.17, 0.83, 0.14, 0.8, 't'), ...row(['T1', 'T2', 'T3'], 0.17, 0.83, 0.9, 0.8, 'b') },
  },
  PDB1: (() => {
    // 1492-TD019 p.14 / PartsLib pins: per pole one line lug (top), two large load openings and two rows of three small ones
    const pins = {}
    ;[0.19, 0.5, 0.8].forEach((c, k) => {
      const p = `L${k + 1}`
      pins[p] = [c, 0.4, 0.95, 't']
      pins[`${p}-1`] = [c - 0.03, 0.58, 0.95, 'b']; pins[`${p}-2`] = [c + 0.03, 0.58, 0.95, 'b']
      pins[`${p}-3`] = [c - 0.045, 0.66, 0.95, 'b']; pins[`${p}-4`] = [c, 0.66, 0.95, 'b']; pins[`${p}-5`] = [c + 0.045, 0.66, 0.95, 'b']
      pins[`${p}-6`] = [c - 0.045, 0.73, 0.95, 'b']; pins[`${p}-7`] = [c, 0.73, 0.95, 'b']; pins[`${p}-8`] = [c + 0.045, 0.73, 0.95, 'b']
    })
    return { conf: 'measured', src: 'face image, sheet 3, and 1492-TD019 p.14 (one line, two large and six small load openings per pole)', pins }
  })(),
  E750WB: {
    conf: 'measured', src: 'face image, sheet 3 (E750WB): screw centres; terminal order H1 H3 H2 H4 across the top as printed',
    pins: { H1: [0.305, 0.12, 0.98, 't'], H3: [0.435, 0.12, 0.98, 't'], H2: [0.565, 0.12, 0.98, 't'], H4: [0.695, 0.12, 0.98, 't'], X2: [0.435, 0.93, 0.98, 'b'], X1: [0.565, 0.93, 0.98, 'b'] },
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
    return { conf: 'approx', src: '520-UM001 p.36 (power) and p.42 (control) terminal order; placed behind the lower cover and the control module cover', pins }
  })(),
  PB2: {
    conf: 'approx', src: '1769-IN028 p.11: terminals 1 PWR OUT +24V (not used on PB2), 2 PWR OUT COM (not used), 3 +24V DC, 4 DC neutral, 5 chassis ground; under the front door, spacing assumed',
    pins: { ...row(['1', '2', '3', '4', '5'], 0.2, 0.2, 0, 0, 'f'), '1': [0.22, 0.38, 0.9, 'f'], '2': [0.22, 0.44, 0.9, 'f'], '3': [0.22, 0.5, 0.9, 'f'], '4': [0.22, 0.56, 0.9, 'f'], '5': [0.22, 0.62, 0.9, 'f'], '+24V DC': [0.22, 0.5, 0.9, 'f'], 'DC COM': [0.22, 0.56, 0.9, 'f'], 'FG / GND': [0.22, 0.62, 0.9, 'f'] },
  },
  L30ER: { conf: 'measured', src: 'face image, sheet 3: Ethernet ports 1 (front) and 2 (rear) on the underside', pins: { 'ETH 1': [0.4, 0.995, 0.75, 'b'], 'ETH 2': [0.4, 0.995, 0.4, 'b'] } },
  OW16: { conf: 'approx', src: 'face image, sheet 3: terminal block under the door; positions assumed', pins: { 'VAC-VDC 1': [0.35, 0.24, 0.95, 'f'], 'OUT 0': [0.35, 0.3, 0.95, 'f'] } },
  GLG: (() => {
    const pins = {}; const us = [0.22, 0.42, 0.62, 0.82]
    for (let i = 0; i < 4; i++) { pins[String(1 + i)] = [us[i], 0.07, 0.9, 't']; pins[String(5 + i)] = [us[i], 0.145, 0.88, 't']; pins[String(9 + i)] = [us[i], 0.855, 0.88, 'b']; pins[String(13 + i)] = [us[i], 0.93, 0.9, 'b'] }
    return { conf: 'measured', src: 'face image, sheet 3: four screw terminals in two rows top and bottom; numbering 1-8 top, 9-16 bottom (PartsLib: 9 AIn+, 10 AIn-)', pins }
  })(),
  AL1920: (() => {
    const pins = { 'X31-1': [0.44, 0.02, 0.6, 't'], 'X31-2': [0.48, 0.02, 0.6, 't'], 'X31-3': [0.52, 0.02, 0.6, 't'], 'X31-4': [0.56, 0.02, 0.6, 't'], X21: [0.53, 0.52, 0.98, 'f'], X22: [0.27, 0.52, 0.98, 'f'], X23: [0.27, 0.66, 0.98, 'f'] }
    const cols = { X01: [0.1, 0.2], X02: [0.3, 0.41], X05: [0.58, 0.68], X06: [0.78, 0.88], X03: [0.1, 0.2], X04: [0.3, 0.41], X07: [0.58, 0.68], X08: [0.78, 0.88] }
    for (const [p, [a, b]] of Object.entries(cols)) {
      const top = ['X01', 'X02', 'X05', 'X06'].includes(p)
      const near = top ? 0.12 : 0.88, far = top ? 0.05 : 0.95, e = top ? 't' : 'b'
      pins[`${p}-1`] = [a, near, 0.95, e]; pins[`${p}-2`] = [b, near, 0.95, e]; pins[`${p}-3`] = [a, far, 0.98, e]; pins[`${p}-4`] = [b, far, 0.98, e]
    }
    return { conf: 'approx', src: 'face image, sheet 3 (16 plug positions, port labels X01/X02/X05/X06 over the top plugs, X03/X04/X07/X08 under the bottom ones); pin order inside a plug and the X31 position are assumed until the AL1920 manual is checked', pins }
  })(),
  EPSITRON: (() => {
    const pins = { 'DC24+': [0.3, 0.07, 0.95, 't'], '0V (upper, line 0714)': [0.2, 0.25, 0.92, 'f'], '0V (lower, line 0715)': [0.2, 0.29, 0.92, 'f'], '0V': [0.2, 0.25, 0.92, 'f'] }
    for (let n = 1; n <= 8; n++) { pins[`OUT${n}`] = [0.18, 0.355 + (n - 1) * 0.039, 0.92, 'f']; pins[`OUT ${n}`] = pins[`OUT${n}`] }
    for (let n = 1; n <= 3; n++) pins[`S${n}`] = [0.2, 0.82 + (n - 1) * 0.045, 0.92, 'f']
    return { conf: 'measured', src: 'face image, sheet 3 (787-1668): input block top, eight output push-ins in a column, signal block bottom; PartsLib pins', pins }
  })(),
  PRO2: {
    conf: 'measured', src: 'face image, sheet 3 (2787-2347): X2 output pins 1-5 across the top (1-3 OUT-, 4-5 OUT+), X1 input pins 1-4 across the bottom (L1 L2 L3 PE)',
    pins: { ...row(['1', '2', '3', '4', '5'], 0.27, 0.72, 0.02, 0.9, 't'), ...row(['L1', 'L2', 'L3', 'PE'], 0.29, 0.71, 0.98, 0.9, 'b') },
  },
  FL1116: (() => {
    const pins = { 'US+': [0.42, 0.985, 0.55, 'b'], 'US-': [0.58, 0.985, 0.55, 'b'], 'US−': [0.58, 0.985, 0.55, 'b'] }
    for (let n = 1; n <= 16; n++) { const blk = n <= 8 ? 0 : 1, i = (n - 1) % 8; pins[String(n)] = [i % 2 ? 0.68 : 0.3, (blk ? 0.55 : 0.1) + Math.floor(i / 2) * 0.107, 0.98, 'f'] }
    return { conf: 'measured', src: 'face image, sheet 3: 16 RJ45 in two blocks of 2 x 4; supply plug underneath; port numbering assumed odd left, even right', pins }
  })(),
  NAT102: { conf: 'measured', src: 'face image, sheet 3: port 2 EXTERNAL (WAN), port 1 INTERNAL (LAN), supply on top', pins: { 'V+': [0.4, 0.02, 0.8, 't'], 'V-': [0.6, 0.02, 0.8, 't'], 'V−': [0.6, 0.02, 0.8, 't'], WAN: [0.55, 0.62, 0.98, 'f'], LAN: [0.55, 0.82, 0.98, 'f'] } },
  PTFIX12: (() => {
    const pins = { IN: [0.1, 0.5, 0.92, 'l'] }
    for (let n = 1; n <= 12; n++) pins[`OUT${n}`] = [0.38 + ((n - 1) % 6) * 0.1, n <= 6 ? 0.2 : 0.78, 0.9, n <= 6 ? 't' : 'b']
    return { conf: 'measured', src: 'face image, sheet 3 (PTFIX 6/12X2,5): 6 mm² feed on the left, push-in outputs in two rows of six', pins }
  })(),
  PTFIX18: (() => {
    const pins = { IN: [0.08, 0.5, 0.92, 'l'] }
    for (let n = 1; n <= 18; n++) pins[`OUT${n}`] = [0.27 + ((n - 1) % 9) * 0.083, n <= 9 ? 0.2 : 0.78, 0.9, n <= 9 ? 't' : 'b']
    return { conf: 'measured', src: 'face image, sheet 3 (PTFIX 6/18X2,5): 6 mm² feed on the left, push-in outputs in two rows of nine', pins }
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
  J4: { conf: 'measured', src: 'sheet 3 face drawing of 1492-J4: two screws per terminal', inside: 0.3, field: 0.7 },
  J6: { conf: 'measured', src: 'sheet 3 face drawing of 1492-J6', inside: 0.3, field: 0.7 },
  JD4: { conf: 'approx', src: 'sheet 3 face drawing of 1492-JD4: four screws per terminal; upper level (T) taken as the inner pair, lower level (B) the outer pair', T: [0.38, 0.62], B: [0.18, 0.82] },
}

// IO-Link cable cores (IEC 61131-9 M12 colours: pin 1 L+ brown, pin 3 L- blue, pin 4 C/Q black). The LUTZE A1021803-1
// cable has black, brown and blue cores (BOM sheet 17). Colour per pin is the IO-Link convention, not printed on the drawing.
export const IOL_CORE = { 1: { color: '#7a4a24', name: 'BN' }, 3: { color: '#1f4fb8', name: 'BU' }, 4: { color: '#141414', name: 'BK' }, 2: { color: '#e9e9e4', name: 'WH' } }
