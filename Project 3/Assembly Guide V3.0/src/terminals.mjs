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
    pins: { ...row(['L1', 'L2', 'L3'], 0.125, 0.625, 0.075, 0.92, 't'), ...row(['T1', 'T2', 'T3'], 0.125, 0.625, 0.505, 0.92, 'b'), '2T1': [0.125, 0.505, 0.92, 'b'], '4T2': [0.375, 0.505, 0.92, 'b'], '6T3': [0.625, 0.505, 0.92, 'b'],
      // V11: the line terminals under the names sheet 4 prints (the incoming feeder lands on them)
      '1L1': [0.125, 0.075, 0.92, 't'], '3L2': [0.375, 0.075, 0.92, 't'], '5L3': [0.625, 0.075, 0.92, 't'] },
  },
  FU1: {
    conf: 'measured', src: 'face image, sheet 3 (1494U-F100), 2.5 % grid: line clip screws at 20 % down, load box-lug wire holes at 55 % down (clamp screw above each)',
    pins: { L1: [0.2, 0.2, 0.8, 't'], L2: [0.52, 0.2, 0.8, 't'], L3: [0.84, 0.2, 0.8, 't'], T1: [0.155, 0.58, 0.85, 'b'], T2: [0.49, 0.58, 0.85, 'b'], T3: [0.83, 0.58, 0.85, 'b'] },
  },
  PDB1: (() => {
    // 1492-TD019 p.14 / PartsLib pins: per pole one line lug (top), two large load openings and two rows of three small ones;
    // offsets from the pole's line lug measured on the face image (2.5 % grid)
    // V6: the connector faces sit at 72 % of the depth between the barrier fins (shop photos), not on a front cover
    const pins = {}, z = 0.72
    ;[0.202, 0.504, 0.804].forEach((c, k) => {
      const p = `L${k + 1}`
      pins[p] = [c, 0.378, z, 't']
      pins[`${p}-1`] = [c - 0.03, 0.555, z, 'b']; pins[`${p}-2`] = [c + 0.02, 0.555, z, 'b']
      pins[`${p}-3`] = [c - 0.053, 0.627, z, 'b']; pins[`${p}-4`] = [c - 0.012, 0.627, z, 'b']; pins[`${p}-5`] = [c + 0.027, 0.627, z, 'b']
      pins[`${p}-6`] = [c - 0.053, 0.696, z, 'b']; pins[`${p}-7`] = [c - 0.012, 0.696, z, 'b']; pins[`${p}-8`] = [c + 0.027, 0.696, z, 'b']
    })
    return { conf: 'measured', src: 'face image, sheet 3 (2.5 % grid), 1492-TD019 p.14 (one line, two large and six small load openings per pole) and the shop photos 2026-11-05 (open block between tall barrier fins, tap wires up from below)', pins }
  })(),
  // V6, as fitted (shop photos 2026-11-05): primary board on the left of the front (H1 H3 H2 H4 down the column, the order
  // sheet 3 prints across), the two-pole primary fuse block in the middle with the line wires (1L1 to the H1 fuse, 3L2 to
  // the H4 fuse) on its lower terminals, red ring lugs, leaving downwards; the one-pole secondary fuse block (2T1, the X2
  // fuse) and the secondary board (X2 X1) on the right. Ring lugs under screws on the front: wires in from below.
  E750WB: {
    conf: 'measured', src: 'shop photos 2026-11-05 (front of T1: boards left and right, fuse blocks between; line wires on the primary fuse block\'s lower terminals); terminal order on each board as printed on sheet 3 (H1 H3 H2 H4, X2 X1)',
    pins: { H1: [0.17, 0.34, 0.985, 'b'], H3: [0.17, 0.435, 0.985, 'b'], H2: [0.17, 0.53, 0.985, 'b'], H4: [0.17, 0.625, 0.985, 'b'], '1L1': [0.42, 0.56, 0.99, 'b'], '3L2': [0.54, 0.56, 0.99, 'b'], '2T1': [0.695, 0.58, 0.99, 'b'], X2: [0.89, 0.37, 0.985, 'b'], X1: [0.89, 0.65, 0.985, 'b'] },
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
  PB2: (() => {
    // V6: shop photo (door open, 2026-11-05): one column of five screws at 80 % across, 43-77 % down, the fuse window to its
    // left; the door label reads, from the top, NOT USED, NOT USED, +24V dc, dc NEUTRAL, CHASSIS GND (1769-IN028 p.11)
    const v = [0.43, 0.515, 0.6, 0.685, 0.77], u = 0.8
    const pins = {}; v.forEach((y, i) => { pins[String(i + 1)] = [u, y, 0.9, 'f'] })
    Object.assign(pins, { '+24V DC': pins['3'], 'DC COM': pins['4'], 'FG / GND': pins['5'] })
    return { conf: 'measured', src: 'shop photo 2026-11-05 (door open: five screws at 80 % across, 43-77 % down, the blue +24 V wire on the third) and 1769-IN028 p.11 (1 and 2 not used, 3 +24V DC, 4 DC neutral, 5 chassis ground)', pins }
  })(),
  // V6: shop photo: both jacks open downwards under "1 (Front) 2 (Rear)", at 68 % across the front (V5 had 40 %)
  L30ER: { conf: 'measured', src: 'shop photo 2026-11-05 (front): Ethernet ports 1 (front) and 2 (rear) open downwards at 68 % across', pins: { 'ETH 1': [0.68, 0.995, 0.75, 'b'], 'ETH 2': [0.68, 0.995, 0.4, 'b'] } },
  OW16: (() => {
    // 1769-IN062 p.8: two staggered columns. Left: OUT 0, 2, 4, 6, VAC-VDC 2, OUT 8, 10, 12, 14; right (half a row higher): VAC-VDC 1, OUT 1, 3, 5, 7, 9, 11, 13, 15
    // V6: shop photo (door open): the block sits in the right of the module, its columns at 65.5 % and 86 % across, an open
    // wire channel to its left (V5 centred it at 36 / 64 %)
    const L = ['OUT 0', 'OUT 2', 'OUT 4', 'OUT 6', 'VAC-VDC 2', 'OUT 8', 'OUT 10', 'OUT 12', 'OUT 14'], R = ['VAC-VDC 1', 'OUT 1', 'OUT 3', 'OUT 5', 'OUT 7', 'OUT 9', 'OUT 11', 'OUT 13', 'OUT 15']
    // V7: wires in from the bottom (Bob, from the shop), down the face of the block
    const pins = {}; L.forEach((n, i) => { pins[n] = [0.655, 0.27 + i * 0.0725, 0.92, 'b'] }); R.forEach((n, i) => { pins[n] = [0.86, 0.234 + i * 0.0725, 0.92, 'b'] })
    return { conf: 'measured', src: '1769-IN062 p.8 (Output Wiring figure: column order) and the shop photo 2026-11-05 (door open: block in the right of the module, columns at 65.5 / 86 % across)', pins }
  })(),
  GLG: (() => {
    // measured at 900 dpi on sheet 3: screw columns 22/41/59/78 % across; rows 7.1 % and 13.9 % (top), 90.6 % and 97.5 % (bottom)
    // V6: the isolators' own labels (shop photos 2026-11-05) read 5 6 7 8 above 1 2 3 4 at the top and 9 10 11 12 above
    // 13 14 15 16 at the bottom, matching the numbers moulded on the plugs: 5-8 is the outer top row, 1-4 the inner (V5 had
    // them the other way round), 9-12 inner bottom, 13-16 outer bottom.
    const pins = {}; const us = [0.22, 0.41, 0.59, 0.78]
    // V7: clamp depths follow the stepped tiers (inner plug front at 97 %, outer at 75 %)
    for (let i = 0; i < 4; i++) { pins[String(5 + i)] = [us[i], 0.071, 0.75, 't']; pins[String(1 + i)] = [us[i], 0.139, 0.97, 't']; pins[String(9 + i)] = [us[i], 0.88, 0.97, 'b']; pins[String(13 + i)] = [us[i], 0.968, 0.75, 'b'] }
    return { conf: 'measured', src: 'sheet 3 at 900 dpi (screw positions) and the isolators\' own number labels in the shop photos 2026-11-05: 5-8 outer top, 1-4 inner top, 9-12 inner bottom, 13-16 outer bottom', pins }
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
    // V6: shop photos 2026-11-05. The supply is a three-way push-in plug on the front at the bottom left, marked US, GND and
    // earth (V5 had it underneath). The port numbers printed beside the jacks run 1-8 down the left column and 9-16 down
    // the right (rows 1/9 ... 8/16); V5 numbered odd ports left and even ports right.
    // plug position from Phoenix's own model (1085219.stp): it stands below the housing at 36-70 % across, the orange
    // levers on its upper front and the three round wire openings on its lower, sloping front (as in the photos): the
    // wires go in from below and in front
    const pins = { 'US+': [0.417, 0.985, 0.8, 'b'], 'US-': [0.53, 0.985, 0.8, 'b'], 'GND': [0.53, 0.985, 0.8, 'b'], 'FE': [0.643, 0.985, 0.8, 'b'] }
    pins['US−'] = pins['US-']
    const rows = [0.065, 0.16, 0.245, 0.336, 0.5, 0.59, 0.69, 0.79]
    for (let n = 1; n <= 16; n++) pins[String(n)] = [n <= 8 ? 0.335 : 0.68, rows[(n - 1) % 8], 0.98, 'f']
    return { conf: 'measured', src: 'face image, sheet 3, 2.5 % grid (jack positions) and the shop photos 2026-11-05: port numbers 1-8 down the left column and 9-16 down the right, as printed on the switch; supply plug US / GND / earth on the front at the bottom (position from Phoenix\'s model), wires in from the front', pins }
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

// ---------------------------------------------------------------- VFD-RT00-03: layouts for this panel's parts
// None of these parts has a terminal figure in a document held for this job except the 1606-XLE240E-3. Positions are
// read off the device symbols on sheets Z03-Z05 (2 % grid) and are marked conf 'approx' where the symbol is all there is.
Object.assign(LAYOUTS, {
  // LPSC00xID dead-front class CC holder, per pole a clamp at the top and one at the bottom (symbol, Z03/Z04).
  // Which end is line and which load is not printed anywhere: line at the top is this guide's choice.
  LPSC2: { conf: 'approx', src: 'device symbol, sheet Z03 (LPSC002ID): one clamp at the top and one at the bottom of each pole; line at the top is this guide\'s choice',
    pins: { ...row(['1L', '2L'], 0.25, 0.75, 0.1, 0.72, 't'), ...row(['1T', '2T'], 0.25, 0.75, 0.9, 0.72, 'b') } },
  LPSC3: { conf: 'approx', src: 'device symbol, sheet Z04 (LPSC003ID): one clamp at the top and one at the bottom of each pole; line at the top is this guide\'s choice',
    pins: { ...row(['1L', '2L', '3L'], 0.167, 0.833, 0.1, 0.72, 't'), ...row(['1T', '2T', '3T'], 0.167, 0.833, 0.9, 0.72, 'b') } },
  // 1606-XLE240E-3: output + + - - on top, input L1 L2 L3 PE underneath (1606-RM002 p.13 photograph and p.21 diagram, PartsLib);
  // positions across from the symbol on sheet Z04
  XLE240: { conf: 'documented', src: '1606-RM002 p.13 and p.21 (PartsLib): output + + - - at the top, input L1 L2 L3 PE at the bottom; positions across from the symbol on sheet Z04',
    pins: { '+1': [0.32, 0.075, 0.9, 't'], '+2': [0.485, 0.075, 0.9, 't'], '-1': [0.63, 0.075, 0.9, 't'], '-2': [0.79, 0.075, 0.9, 't'], L1: [0.23, 0.925, 0.9, 'b'], L2: [0.385, 0.925, 0.9, 'b'], L3: [0.53, 0.925, 0.9, 'b'], PE: [0.69, 0.925, 0.9, 'b'] } },
  // 1489-M1: one clamp at the top (1, line) and one at the bottom (2, load); symbol on sheet Z04
  M1489: { conf: 'approx', src: 'device symbol, sheet Z04 (1489-M1): one clamp at the top and one at the bottom; line at the top is this guide\'s choice', pins: { '1': [0.5, 0.1, 0.8, 't'], '2': [0.5, 0.9, 0.8, 'b'] } },
  // 700-HLT1 terminal block relay: no terminal figure held. The symbol on sheet Z05 draws three screws at the top and three
  // at the bottom. Coil A1/A2 at the bottom and contact 14/11/12 at the top is how this relay family is built; to be
  // checked against the part's own marking.
  HLT: { conf: 'approx', src: 'device symbol, sheet Z05 (700-HLT1L1): three screws at the top, three at the bottom. Which is which is NOT from a document: coil A1, A2 at the bottom, contact 14, 11, 12 at the top is assumed. Check the marking on the relay',
    pins: { '14': [0.5, 0.05, 0.62, 't'], '11': [0.5, 0.12, 0.8, 't'], '12': [0.5, 0.19, 0.97, 't'], A1: [0.5, 0.95, 0.62, 'b'], A2: [0.5, 0.88, 0.8, 'b'] } },
  // Panduit CADIN1IG with a CJ688TG jack: the RJ45 opening on the front, the field cable punched down on the back of the jack
  // Burndy K3A26U-2N: three conductor openings side by side at the top end, a set screw on the front over each
  // (Burndy\'s model: screws at -16.5, 0 and 16.5 mm across, 4 to 15 mm below the top end)
  LUG3: { conf: 'measured', src: 'Burndy\'s model of the K3A26U2N: three openings in the top end, set screws on the front at -16.5 / 0 / +16.5 mm; 14 AWG to 2/0 (Burndy master catalogue p.31)', pins: { '1': [0.17, 0.1, 0.6, 't'], '2': [0.5, 0.1, 0.6, 't'], '3': [0.83, 0.1, 0.6, 't'] } },
  CADIN: { conf: 'approx', src: 'device symbol, sheets Z05 and N01 (CADIN1IG with CJ688TGIW): jack opening on the front; the field cable terminates on the back of the jack and leaves downwards',
    pins: { front: [0.5, 0.62, 0.98, 'f'], field: [0.5, 0.97, 0.45, 'b'] } },
})

// which layout each device tag uses
export const DEVICE_LAYOUT = {
  CBB0108: '140MT', CBB0112: '140MT', CBB0116: '140MT', FUB0145: 'LPSC2', FUB0125: 'LPSC3', PWSB0125: 'XLE240',
  CBC0102: 'M1489', CBB0133: 'M1489', CRC0102: 'HLT', CRC0105: 'HLT', CRC0108: 'HLT',
  JKN0102: 'CADIN', JKN0104: 'CADIN', JKN0106: 'CADIN',
  GNDB0101: 'LUG3', DISCB0101: 'Q1', 'DISCB0101-F': 'FU1', TBB0106: 'PDB1', TB0140: 'E750WB', GNDB0100: 'D167',
  DRVB0200: 'PF525', DRVB0300: 'PF525', DRVB0400: 'PF525',
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
