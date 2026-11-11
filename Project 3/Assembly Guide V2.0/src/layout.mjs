// VFD-RT00-03 assembly guide: the panel as drawn, the parts and the build order.
// Source: ../10006 VFD-RT00-03.pdf (Sharpe Engineering & Equipment, Westby Creamery, 10006 Intake Receiving VFD, initial
// release 06/24/26). Sheets: A01-A04 title, contents, notes, cable list; B01-B04 480 V; C01 120 V; D01 24 V; N01 network;
// Z01 enclosure; Z02 subpanel layout; Z03-Z05 rail assemblies A, B, C with their bills of material.
// The layout sheets carry no dimensions ("SCALE: None"). Positions are measured on sheet Z02, which draws the subpanel
// at its true proportion (44 x 56 in): 1117.6 mm across is 452.6 pt on the page, 2.4693 mm per point. They are in mm from
// the top left corner of the subpanel, X to the right, Y down, good to about a millimetre. Every device is then drawn at
// the size its maker gives where a document is held (depthNote / xNote say which); otherwise at the size sheet Z02 draws it.

export const JOB = {
  project: 'Westby Creamery, 10006 Cheese Vat Installation',
  location: '',
  number: '10006',
  panel: 'VFD-RT00-03',
  desc: 'Intake Receiving VFD',
  drawing: '10006 VFD-RT00-03.pdf',
  rev: 'initial release 06/24/26',
  sheets: 16,
  // PDF page -> sheet name printed in the title block
  sheetNames: { 1: 'A01', 2: 'A02', 3: 'A03', 4: 'A04', 5: 'B01', 6: 'B02', 7: 'B03', 8: 'B04', 9: 'C01', 10: 'D01', 11: 'N01', 12: 'Z01', 13: 'Z02', 14: 'Z03', 15: 'Z04', 16: 'Z05' },
}

// ---------------------------------------------------------------- bill of material (sheets Z01-Z05, part numbers as printed)
// The set has five bills of material, one per layout sheet; "sheet" is the PDF page. qty as printed.
export const BOM = [
  { pn: 'SCE-60XEL4912SSST', mfr: 'SCE (Saginaw)', cls: 'Enclosure', qty: '1', where: 'Enclosure', desc: 'S.S. 2-door XEL sloping top enclosure, 60 x 49 x 12 in', sheet: 12 },
  { pn: 'Panel Name Tag', mfr: 'Sharpe', cls: 'Label', qty: '1', where: 'Enclosure', desc: 'Panel name tag (Z01 note 1 gives its text: serial VFD-RT00-03, 60 A, 7.5 HP, max OCP 20 A, 480 V AC 3PH 60 Hz, SCCR 65 kA, Type 4X)', sheet: 12 },
  { pn: 'EZ00000000044', mfr: 'Roxtec', cls: 'Cable entry', qty: '1', where: 'Enclosure', desc: 'Gland, cable, 4 port, EZ-Entry (position not drawn)', sheet: 12 },
  { pn: 'SCE-60P48', mfr: 'SCE (Saginaw)', cls: 'Subpanel', qty: '1', where: 'Subpanel', desc: 'Subpanel, bent, 56 x 44 in', sheet: 13 },
  { pn: 'LPJ-60SP', mfr: 'Bussmann', cls: 'Fuse', qty: '3', where: 'DISCB0101-L1 / DISCB0101-L2 / DISCB0101-L3', desc: 'LPJ fuse, class J, time delay, current limiting, 60 A', sheet: 13 },
  { pn: 'K3A26U-2N', mfr: 'Burndy', cls: 'Ground lug', qty: '1', where: 'GNDB0101', desc: 'Ground lug', sheet: 13 },
  { pn: '1492-PDC-3A200-S0108', mfr: 'Allen-Bradley', cls: 'Power distribution block', qty: '1', where: 'TBB0106', desc: 'Power distribution block (3-pole, 200 A, 1 line 3/0-#8 AWG and 8 loads #2-#14 AWG per pole)', sheet: 13 },
  { pn: '1492-PDBC4', mfr: 'Allen-Bradley', cls: 'Cover', qty: '1', where: 'TBB0106', desc: 'Power distribution block cover plate', sheet: 13 },
  { pn: 'D167-14', mfr: 'ILSCO', cls: 'Ground bar', qty: '2', where: 'GNDB0100', desc: 'Ground terminal lugs (bar, 14 taps). Listed twice on Z02 (items 6 and 12); one is drawn', sheet: 13 },
  { pn: '25B-D013N104', mfr: 'Allen-Bradley', cls: 'Drive', qty: '3', where: 'DRVB0200 / DRVB0300 / DRVB0400', desc: 'PowerFlex 525 AC drive with embedded EtherNet/IP and safety, 380-480 V AC, 3-phase, 13 A, 7.5 HP (frame C)', sheet: 13 },
  { pn: '199-DR1', mfr: 'Allen-Bradley', cls: 'DIN rail', qty: '5', where: 'Rails A, B, C', desc: 'DIN rail, 35 mm (Z02 items 8, qty 3, and 11, qty 2)', sheet: 13 },
  { pn: 'G2X3WH6', mfr: 'Panduit', cls: 'Wire duct', qty: "24'", where: 'Subpanel', desc: '2 x 3 in wireway, white', sheet: 13 },
  { pn: 'C2WH6', mfr: 'Panduit', cls: 'Wire duct cover', qty: "24'", where: 'Subpanel', desc: '2 in duct cover, white', sheet: 13 },
  { pn: 'E750WB', mfr: 'Sola', cls: 'Transformer', qty: '1', where: 'TB0140', desc: '750 VA, 480 V AC to 120 V AC control transformer', sheet: 13 },
  { pn: '1494U-D60', mfr: 'Allen-Bradley', cls: 'Disconnect', qty: '1', where: 'DISCB0101', desc: '1494U disconnect switch, rod or cable operated, 60 A', sheet: 13 },
  { pn: '1494U-F60', mfr: 'Allen-Bradley', cls: 'Fuse block', qty: '1', where: 'DISCB0101-F', desc: '1494U fuse block, 60 A', sheet: 13 },
  { pn: '1494U-R1', mfr: 'Allen-Bradley', cls: 'Disconnect accessory', qty: '1', where: 'DISCB0101', desc: 'Threaded rod for 30 to 200 A', sheet: 13 },
  { pn: '1494U-HS1', mfr: 'Allen-Bradley', cls: 'Disconnect accessory', qty: '1', where: 'DISCB0101', desc: 'Stainless metal handle for 30 to 200 A', sheet: 13 },
  { pn: '1494U-PC1', mfr: 'Allen-Bradley', cls: 'Disconnect accessory', qty: '1', where: 'DISCB0101', desc: '1494U protective cover, 30-60 A', sheet: 13 },
  { pn: '1494U-FC60J', mfr: 'Allen-Bradley', cls: 'Disconnect accessory', qty: '1', where: 'DISCB0101', desc: '1494U 60 A class H/J 600 V fuse clip', sheet: 13 },
  { pn: 'CCMR002.TXP', mfr: 'Littelfuse', cls: 'Fuse', qty: '2 + 3', where: 'FUB0137-H1 / FUB0137-H4 / FUB0125', desc: 'Class CC time delay fuse, 2 A, 600 V AC. Z02 item 20 (qty 2, the transformer primary) and Z04 item 10 (qty 3, FUB0125)', sheet: 13 },
  { pn: 'CCMR010.TXP', mfr: 'Littelfuse', cls: 'Fuse', qty: '1', where: 'FUB0142', desc: 'Class CC time delay fuse, 10 A, 600 V AC / 250 V DC (the transformer secondary)', sheet: 13 },
  { pn: '140MT-D9E-C20', mfr: 'Allen-Bradley', cls: 'Circuit breaker', qty: '3', where: 'CBB0108 / CBB0112 / CBB0116', desc: 'Motor protection circuit breaker, standard magnetic trip, 14.5-20 A, frame D', sheet: 14 },
  { pn: '140MT-C-TE', mfr: 'Allen-Bradley', cls: 'Circuit breaker accessory', qty: '3', where: 'CBB0108 / CBB0112 / CBB0116', desc: 'UL Type E spacing adapter for 140MT frame C and D', sheet: 14 },
  { pn: '1492-EAJ35', mfr: 'Allen-Bradley', cls: 'End anchor', qty: '2 + 6 + 5', where: 'Rails A, B, C', desc: 'End anchor, DIN rail (Z03 qty 2, Z04 qty 6, Z05 qty 5)', sheet: 14 },
  { pn: 'LPSC002ID', mfr: 'Littelfuse', cls: 'Fuse holder', qty: '1', where: 'FUB0145', desc: 'POWR-SAFE dead front indicating fuse holder, 600 V, 30 A, class CC, 14 to 8 AWG, 2 poles', sheet: 14 },
  { pn: 'CCMR003.TXP', mfr: 'Littelfuse', cls: 'Fuse', qty: '2', where: 'FUB0145', desc: 'Class CC time delay fuse, 3 A, 600 V AC', sheet: 14 },
  { pn: 'LPSC003ID', mfr: 'Littelfuse', cls: 'Fuse holder', qty: '1', where: 'FUB0125', desc: 'POWR-SAFE dead front indicating fuse holder, 600 V, 30 A, class CC, 14 to 8 AWG, 3 poles (the description on Z04 prints LPSC002ID)', sheet: 15 },
  { pn: '1606-XLE240E-3', mfr: 'Allen-Bradley', cls: 'Power supply', qty: '1', where: 'PWSB0125', desc: '24-28 V DC, 240 W, 3-phase 380-480 V AC input', sheet: 15 },
  { pn: '1489-M1C100', mfr: 'Allen-Bradley', cls: 'Circuit breaker', qty: '2', where: 'CBB0133', desc: '1489-M thermal-magnetic circuit breaker, 1 pole, C curve, 10 A (qty 2; one is drawn)', sheet: 15 },
  { pn: '1489-M1C050', mfr: 'Allen-Bradley', cls: 'Circuit breaker', qty: '1', where: 'CBC0102', desc: '1489-M thermal-magnetic circuit breaker, 1 pole, C curve, 5 A', sheet: 15 },
  { pn: '1492-J4', mfr: 'Allen-Bradley', cls: 'Terminal', qty: '15 + 22', where: 'TB120-1 / TB1 / TB24-1', desc: '1492-J IEC terminal block, one-circuit feed-through (Z04 qty 15, 13 drawn; Z05 qty 22)', sheet: 15 },
  { pn: '1492-EBJ3', mfr: 'Allen-Bradley', cls: 'End barrier', qty: '5 + 7', where: 'TB120-1 / TB1 / TB24-1', desc: 'End barrier, grey (Z04 qty 5, Z05 qty 7)', sheet: 15 },
  { pn: '1492-JG4', mfr: 'Allen-Bradley', cls: 'Terminal', qty: '4 + 4', where: 'TB120-1 / TB1', desc: '1492-J IEC terminal block, one-circuit feed-through ground block', sheet: 15 },
  { pn: '1492-CJJ6-10', mfr: 'Allen-Bradley', cls: 'Jumper', qty: '3 + 2', where: 'TB120-1 / TB1 / TB24-1', desc: 'Screw centre jumper, 10 pole, for 1492-J4 (cut to the groups sheets Z04 and Z05 draw)', sheet: 15 },
  { pn: '1585J-M8HBJM-3', mfr: 'Allen-Bradley', cls: 'Cable', qty: '3', where: 'CBLN0102 / CBLN0104 / CBLN0106', desc: '1585 Ethernet cable, Cat5e, RJ45 straight male to RJ45, 3 m', sheet: 16 },
  { pn: 'CJ688TGIW', mfr: 'Panduit', cls: 'Network', qty: '3', where: 'JKN0102 / JKN0104 / JKN0106', desc: 'Category 6 RJ45 UTP Mini-Com jack, white', sheet: 16 },
  { pn: 'CADIN1IG', mfr: 'Panduit', cls: 'Network', qty: '3', where: 'JKN0102 / JKN0104 / JKN0106', desc: 'IndustrialNet adapter, 1 port, DIN rail mount', sheet: 16 },
  { pn: '700-HLT1L1', mfr: 'Allen-Bradley', cls: 'Relay', qty: '3', where: 'CRC0102 / CRC0105 / CRC0108', desc: 'Terminal block relay, 120 V AC coil', sheet: 16 },
]

// ---------------------------------------------------------------- the enclosure (metres): 60 x 49 x 12 in, subpanel 44 x 56 in
export const ENC = { W: 1.245, HB: 1.524, D: 0.305, T: 0.00264, HOOD: 0.082, Y0: 0.15, SW: 1.1176, SH: 1.4224 }

// ---------------------------------------------------------------- wireway as drawn on sheet Z02: [X0, X1, Ytop, Ybottom] mm
export const DUCTS = [
  { id: 'D1', r: [0, 57.3, 0, 1422.4], size: '2x3', note: 'left riser, full height' },
  { id: 'D2', r: [57.3, 857.1, 0, 57], size: '2x3', note: 'top, above rail A' },
  { id: 'D3', r: [57.3, 800, 268.7, 325.9], size: '2x3', note: 'below rail A, above the drives' },
  { id: 'D4', r: [800, 857.1, 57, 819.3], size: '2x3', note: 'riser left of the disconnect and TBB0106' },
  { id: 'D5', r: [57.3, 1117.6, 762.3, 819.3], size: '2x3', note: 'below the drives, above rail B and the transformer' },
  { id: 'D6', r: [695.2, 752.4, 819.3, 1098.4], size: '2x3', note: 'riser between rail B and the transformer' },
  { id: 'D7', r: [1060.6, 1117.6, 819.3, 1098.4], size: '2x3', note: 'right riser beside the transformer' },
  { id: 'D8', r: [57.3, 1117.6, 1098.4, 1154.7], size: '2x3', note: 'between rail B and rail C' },
  { id: 'D9', r: [1060.6, 1117.6, 1154.7, 1365.1], size: '2x3', note: 'right riser beside rail C' },
  { id: 'D10', r: [57.3, 1117.6, 1365.1, 1422.4], size: '2x3', note: 'bottom, field side' },
]

// DIN rails: centre line Y and the run X0..X1 (mm), as drawn. Keys r1, r3, r4 are assemblies A, B, C of sheet Z02.
export const RAILS = {
  r1: { y: 163.4, x0: 82.5, x1: 768.2, name: 'Rail A' },
  r3: { y: 974.9, x0: 106.7, x1: 665.2, name: 'Rail B' },
  r4: { y: 1273.1, x0: 76.3, x1: 1041.6, name: 'Rail C' },
}

// ---------------------------------------------------------------- devices
// at: 'sub1' on the subpanel, 'enc' on the enclosure. r: [X0, X1, Ytop, Ybottom] in mm.
// tex: face picture cut from sheet Z02 (assets/tex, tools/extract_textures.py), laid over the part.
const J4 = { pitch: 6.1, h: 60, depth: 47, kind: 'J4' }
export const DEVICES = [
  // power entry, top right
  { tag: 'DISCB0101', pn: '1494U-D60', at: 'sub1', depth: 102, body: '#1d1d1f', step: 'power', r: [957.0, 1139.3, 204.6, 430.7],
    note: 'Rockwell\'s model of the 1494U-D60. The 60 A switch has the same frame and pole spacing (46 mm) as the 100 A one sheet Z02 draws.' },
  { tag: 'DISCB0101-F', pn: '1494U-F60', at: 'sub1', depth: 78, body: '#1d1d1f', step: 'power', r: [964.5, 1096.5, 348.9, 409.7], also: ['1494U-FC60J'],
    note: 'The fuse block under the switch (Rockwell\'s model of the 1494U-F60). No tag of its own on the drawings (BOM Z02 item 15): named here after the switch.',
    xNote: 'placed by Rockwell\'s instruction, not by sheet Z02: for 60 A, 600 V class J fuses the block\'s mounting holes are 1.976 in (50.2 mm) below the switch\'s lower mounting holes (1494U-IN001 p.10). Sheet Z02 draws the block about 70 mm lower, which is the 100 A spacing (Design issues). The hole positions on the two parts are read off the models to about 5 mm' },
  { tag: 'TBB0106', pn: '1492-PDC-3A200-S0108', at: 'sub1', depth: 99.6, depthNote: '1492-TD019 p.14 Figure 3 (PartsLib): 143.3 x 127 x 99.6 mm', body: '#232325', step: 'power', r: [931.0, 1074.3, 565.5, 692.5], also: ['1492-PDBC4'],
    xNote: 'real size 143.3 x 127 mm, centred where sheet Z02 draws it (the Z02 symbol is 160 x 139 mm and shows twelve load holes a pole; the part has eight)' },
  { tag: 'GNDB0100', pn: 'D167-14', at: 'sub1', depth: 14, body: '#b7b7b2', metal: true, step: 'power', r: [880, 889, 591, 761.7],
    xNote: 'real length 170.7 mm (PartsLib record), from the top end sheet Z02 draws; Z02 draws it 97 mm long with ten screws' },
  { tag: 'GNDB0101', pn: 'K3A26U-2N', at: 'sub1', depth: 30, body: '#c9c9c4', metal: true, step: 'power', r: [874, 923.6, 50, 145],
    note: 'Ground lug. On the layout only: no conductor is drawn to it on any schematic sheet (Design issues).' },
  // rail A
  { tag: 'FUB0145', pn: 'LPSC002ID', at: 'sub1', rail: 'r1', tex: 'FUB0145', face: 'line', depth: 62, depthNote: 'approx', body: '#3a3c40', step: 'rail1', r: [475.8, 513.0, 124.5, 199.0], also: ['CCMR003.TXP'] },
  { tag: 'CBB0108', pn: '140MT-D9E-C20', at: 'sub1', rail: 'r1', tex: 'CBB0108', face: 'line', depth: 90, depthNote: 'approx', body: '#dcddd8', step: 'rail1', r: [522.5, 567.9, 115.0, 210.8], also: ['140MT-C-TE'] },
  { tag: 'CBB0112', pn: '140MT-D9E-C20', at: 'sub1', rail: 'r1', tex: 'CBB0112', face: 'line', depth: 90, depthNote: 'approx', body: '#dcddd8', step: 'rail1', r: [568.1, 613.5, 115.0, 210.8], also: ['140MT-C-TE'] },
  { tag: 'CBB0116', pn: '140MT-D9E-C20', at: 'sub1', rail: 'r1', tex: 'CBB0116', face: 'line', depth: 90, depthNote: 'approx', body: '#dcddd8', step: 'rail1', r: [616.0, 661.3, 115.0, 210.8], also: ['140MT-C-TE'] },
  // drives
  { tag: 'DRVB0200', pn: '25B-D013N104', at: 'sub1', tex: 'DRVB0200', face: 'line', depth: 184, depthNote: '520-TD001 p.15 (PartsLib): frame C, 109 x 220 x 184 mm', body: '#e3e3e0', step: 'drives', r: [328.8, 437.8, 414.6, 634.6] },
  { tag: 'DRVB0300', pn: '25B-D013N104', at: 'sub1', tex: 'DRVB0300', face: 'line', depth: 184, depthNote: '520-TD001 p.15 (PartsLib): frame C, 109 x 220 x 184 mm', body: '#e3e3e0', step: 'drives', r: [484.8, 593.8, 414.6, 634.6] },
  { tag: 'DRVB0400', pn: '25B-D013N104', at: 'sub1', tex: 'DRVB0400', face: 'line', depth: 184, depthNote: '520-TD001 p.15 (PartsLib): frame C, 109 x 220 x 184 mm', body: '#e3e3e0', step: 'drives', r: [640.2, 749.2, 414.6, 634.6] },
  // transformer
  { tag: 'TB0140', pn: 'E750WB', at: 'sub1', depth: 178.1, depthNote: 'PartsLib record (162.1 x 176 x 178.1 mm)', body: '#1b1b1d', step: 't1', r: [822.8, 984.9, 886.9, 1062.9],
    xNote: 'real size 162 x 176 mm, centred where sheet Z02 draws it (Z02 draws a plain 178 x 152 mm rectangle)', also: ['CCMR002.TXP', 'CCMR010.TXP'] },
  // rail B
  { tag: 'FUB0125', pn: 'LPSC003ID', at: 'sub1', rail: 'r3', tex: 'FUB0125', face: 'line', depth: 62, depthNote: 'approx', body: '#3a3c40', step: 'rail3', r: [335.6, 390.6, 933.9, 1007.8], also: ['CCMR002.TXP'],
    note: 'FUB0125 on the layout sheets (Z02, Z04); the schematic (B01) calls it FUB0132.' },
  { tag: 'PWSB0125', pn: '1606-XLE240E-3', at: 'sub1', rail: 'r3', tex: 'PWSB0125', face: 'line', depth: 117, depthNote: '1606-RM002 p.21 (PartsLib): 62 x 124 mm, 117 mm from the rail', body: '#d9dadb', step: 'rail3', r: [400.5, 462.5, 912.9, 1036.9],
    note: 'PWSB0125 on the layout sheets (Z02, Z04); the schematic (B01) calls it PWSB0132.' },
  { tag: 'CBC0102', pn: '1489-M1C050', at: 'sub1', rail: 'r3', tex: 'CBC0102', face: 'line', depth: 69, depthNote: 'approx', body: '#e8e8e4', step: 'rail3', r: [475.3, 492.8, 919.0, 1030.0] },
  { tag: 'TB120-1', pn: '1492-J4', at: 'sub1', rail: 'r3', step: 'rail3', strip: { ...J4, n: 17,
    xs: [504.6, 510.7, 516.7, 522.8, 532.1, 538.2, 544.2, 553.6, 559.6, 565.7, 575.1, 581.1, 587.2, 596.6, 602.6, 608.7, 614.8],
    marks: ['B01421', 'B01421', 'B01421', 'B01421', 'C01021', 'C01021', 'C01021', 'C01022', 'C01051', 'C01081', 'B01411', 'B01411', 'B01411', 'GND', 'GND', 'GND', 'GND'],
    jumpers: [[5, 7], [11, 13]], gnd: [14, 17], barriers: [527.5, 548.9, 570.4, 591.9, 618.6] },
    note: 'The drawings do not number the terminals: each is marked with the wire number it carries (sheet Z04). This guide numbers them 1 to 17 from the left. 1-13 are 1492-J4, 14-17 are 1492-JG4 ground blocks.' },
  { tag: 'CBB0133', pn: '1489-M1C100', at: 'sub1', rail: 'r3', tex: 'CBB0133', face: 'line', depth: 69, depthNote: 'approx', body: '#e8e8e4', step: 'rail3', r: [630.6, 648.1, 919.0, 1030.0] },
  // rail C
  { tag: 'CRC0102', pn: '700-HLT1L1', at: 'sub1', rail: 'r4', depth: 80, depthNote: 'approx', body: '#8e9296', step: 'rail4', r: [626.9, 633.2, 1231.0, 1319.0] },
  { tag: 'CRC0105', pn: '700-HLT1L1', at: 'sub1', rail: 'r4', depth: 80, depthNote: 'approx', body: '#8e9296', step: 'rail4', r: [633.3, 639.6, 1231.0, 1319.0] },
  { tag: 'CRC0108', pn: '700-HLT1L1', at: 'sub1', rail: 'r4', depth: 80, depthNote: 'approx', body: '#8e9296', step: 'rail4', r: [639.7, 646.0, 1231.0, 1319.0] },
  { tag: 'TB1', pn: '1492-J4', at: 'sub1', rail: 'r4', step: 'rail4', strip: { ...J4, n: 23,
    xs: [658.0, 664.2, 670.2, 676.4, 685.6, 691.7, 697.9, 703.9, 713.2, 719.3, 725.4, 731.4, 743.9, 750.0, 756.1, 762.3, 768.4, 774.4, 780.5, 789.8, 795.9, 802.0, 808.0],
    marks: ['B02061', 'B02061', 'B02061', 'B02101', 'B03061', 'B03061', 'B03061', 'B03101', 'B04061', 'B04061', 'B04061', 'B04101', 'B01341', 'B01341', 'B01341', 'B01341', 'B01341', 'B01341', 'B01341', 'GND', 'GND', 'GND', 'GND'],
    jumpers: [[1, 3], [5, 7], [9, 11], [13, 19]], gnd: [20, 23], barriers: [681.0, 708.6, 737.6, 785.2, 811.8] },
    note: 'The drawings do not number the terminals: each is marked with the wire number it carries (sheet Z05). This guide numbers them 1 to 23 from the left. 1-19 are 1492-J4, 20-23 are 1492-JG4 ground blocks.' },
  { tag: 'TB24-1', pn: '1492-J4', at: 'sub1', rail: 'r4', step: 'rail4', strip: { ...J4, n: 3, xs: [825.3, 831.4, 840.8], marks: ['B01331', 'B01331', 'B01341'], jumpers: [[1, 2]], barriers: [836.1, 844.6] },
    note: 'Terminals numbered 1 to 3 from the left by this guide; the drawings mark them with their wire numbers (sheet Z05).' },
  { tag: 'JKN0102', pn: 'CADIN1IG', at: 'sub1', rail: 'r4', tex: 'JKN0102', face: 'line', depth: 45, depthNote: 'approx', body: '#2a2c2f', step: 'rail4', r: [855.0, 874.0, 1250.6, 1299.0], also: ['CJ688TGIW'], note: 'No tag on the drawings: named here after its cable, CBLN0102 (sheet N01).' },
  { tag: 'JKN0104', pn: 'CADIN1IG', at: 'sub1', rail: 'r4', tex: 'JKN0104', face: 'line', depth: 45, depthNote: 'approx', body: '#2a2c2f', step: 'rail4', r: [874.0, 893.0, 1250.6, 1299.0], also: ['CJ688TGIW'], note: 'No tag on the drawings: named here after its cable, CBLN0104 (sheet N01).' },
  { tag: 'JKN0106', pn: 'CADIN1IG', at: 'sub1', rail: 'r4', tex: 'JKN0106', face: 'line', depth: 45, depthNote: 'approx', body: '#2a2c2f', step: 'rail4', r: [893.0, 912.0, 1250.6, 1299.0], also: ['CJ688TGIW'], note: 'No tag on the drawings: named here after its cable, CBLN0106 (sheet N01).' },
  // enclosure
  { tag: 'ACB0145', pn: '(not in the BOM)', at: 'enc', step: 'ac', note: 'Air conditioner, 2000 BTU (sheet B01). Sheet Z01 draws it on the left side wall. No part number on any sheet: drawn with a Saginaw 1000 BTU/h unit as a stand-in.' },
]

// end anchors (1492-EAJ35, 7.9 mm): left edge of each, mm, as drawn on Z03-Z05
export const ANCHORS = {
  r1: [467.2, 513.2, 661.6],
  r3: [327.7, 390.8, 463.6, 492.9, 621.2, 648.2],
  r4: [618.6, 646.4, 814.0, 847.1, 912.3],
}

// ---------------------------------------------------------------- the build order
export const PHASES = [
  { id: 'P1', name: 'Prepare the enclosure' },
  { id: 'P2', name: 'Lay out the subpanel' },
  { id: 'P3', name: 'Mount the components' },
  { id: 'P4', name: 'Wire the subpanel' },
  { id: 'P5', name: 'Install and finish' },
]
const SUB = ['plate', 'duct', 'rails']
export const STEPS = [
  {
    id: 'enclosure', phase: 'P1', title: 'Receive the enclosure', show: ['enc', 'stand', 'doors'],
    view: { az: 28, el: 10, dist: 2.6, target: [0, 0.9, 0.15] },
    why: 'Everything else is located from the enclosure, so check it first while it is empty.',
    parts: ['SCE-60XEL4912SSST'],
    tasks: [
      'Check the enclosure against the BOM: SCE-60XEL4912SSST, stainless, two doors, sloping top, 60 x 49 x 12 in (sheet Z01).',
      'Remove the subpanel (SCE-60P48, 56 x 44 in) and keep its nuts. Build it flat on the bench (phases 2 to 4).',
      'Protect the stainless: stainless-only drills and files, and keep carbon-steel swarf off it.',
      'Sheet A03 note 6: conduit enters from the bottom; side entry only where the bottom is not feasible.',
    ],
    flags: ['No floor stand or legs are in the BOM; sheet Z01 draws the enclosure without any. The guide shows a stand only so the enclosure does not sit on the floor.', 'The Roxtec EZ-Entry gland (BOM Z01 item 3) has no position on any sheet.'],
  },
  {
    id: 'plate', phase: 'P2', title: 'Mark out and drill the subpanel', show: ['plate'], bench: true,
    view: { az: 0, el: 4, dist: 1.9, target: [0, 0.92, 0.03] },
    why: 'Lay out every hole before anything is mounted. Ducts and rails go down first because devices are placed against them.',
    parts: ['SCE-60P48'],
    tasks: [
      'The subpanel is 1117.6 x 1422.4 mm (44 x 56 in). Work from its top left corner. The layout sheets carry no dimensions: every position in this guide is measured off sheet Z02 (about 1 mm) and should be checked against the parts in hand.',
      'Rail centre lines: A at 163 mm, B at 975 mm, C at 1273 mm from the top.',
      'Disconnect DISCB0101 at the top right (poles at 984, 1030 and 1077 mm across; line lugs about 226 mm down), its fuse block under it (top about 349 mm down: by Rockwell\'s DIM Z, not as Z02 draws it), TBB0106 below (931-1074 mm across, 566-693 mm down), ground bar GNDB0100 left of it at 885 mm, ground lug GNDB0101 at the top (874-924 mm across, 50-145 mm down).',
      'Drives: DRVB0200 at 329-438 mm, DRVB0300 at 485-594 mm, DRVB0400 at 640-749 mm across; all three 415-635 mm down. Mounting holes 90.5 mm apart across and 207 mm apart up and down (520-TD001 p.15).',
      'Transformer TB0140 centred 904 mm across and 975 mm down.',
      'Drill and tap to each device\'s own mounting pattern (see Reference on each part).',
    ],
  },
  {
    id: 'duct', phase: 'P2', title: 'Mount the wire duct', show: ['plate', 'duct'], bench: true,
    view: { az: 0, el: 4, dist: 1.9, target: [0, 0.92, 0.03] },
    why: 'The ducts set the wire routes and the clearances to every device.',
    parts: ['G2X3WH6', 'C2WH6'],
    tasks: [
      'All duct is Panduit G2X3WH6 (2 in wide, 3 in tall). Ten runs, named D1 to D10 in this guide: the left riser (full height), the top run, the run under rail A, the riser left of the disconnect, the run under the drives (full width), the two risers either side of the transformer, the run between rails B and C, the right riser beside rail C and the bottom run.',
      'Cut to length, deburr the ends, butt the corners tight. Leave the covers off until the end of wiring.',
    ],
    flags: ['The ten runs add up to about 7.7 m (25 ft); the BOM lists 24 ft of duct and 24 ft of cover.'],
  },
  {
    id: 'rails', phase: 'P2', title: 'Mount the DIN rails', show: SUB, bench: true,
    view: { az: 0, el: 4, dist: 1.9, target: [0, 0.92, 0.03] },
    why: 'Three rails, as sheet Z02 draws them.',
    parts: ['199-DR1'],
    tasks: [
      'Rail A: 83 to 768 mm across, centre 163 mm down (686 mm long).',
      'Rail B: 107 to 665 mm across, centre 975 mm down (559 mm long).',
      'Rail C: 76 to 1042 mm across, centre 1273 mm down (965 mm long).',
      'Fix each rail at both ends and about every 200 mm. Deburr the cut ends.',
    ],
  },
  {
    id: 'power', phase: 'P3', title: 'Power entry: disconnect, fuse block, TBB0106, grounds', show: [...SUB, 'power'], bench: true,
    view: { az: -18, el: 8, dist: 1.0, target: [0.43, 1.2, 0.08] },
    why: 'The heaviest, plate-mounted parts first, while the plate is open around them.',
    parts: ['1494U-D60', '1494U-F60', '1494U-FC60J', 'LPJ-60SP', '1492-PDC-3A200-S0108', '1492-PDBC4', 'D167-14', 'K3A26U-2N'],
    tasks: [
      'DISCB0101 (1494U-D60): mount the switch so its operating mechanism lines up with the handle on the enclosure\'s right flange. Follow the 1494U installation instruction for the mechanism depth.',
      'The 1494U-F60 fuse block under the switch, poles in line with the switch poles. For 60 A, 600 V class J fuses its mounting holes are 1.976 in (50.2 mm) below the switch\'s lower mounting holes (DIM Z, 1494U-IN001 p.10); no phase barriers are needed. Set it with a fuse in hand. Fit the 1494U-FC60J fuse clips. 23-37 lb·in on the block screws.',
      'The three LPJ-60SP fuses clip between the switch and the block: they are the connection, there is no wire to make there. Fit them last, after testing.',
      'TBB0106 (1492-PDC-3A200-S0108) below the fuse block; its cover plate 1492-PDBC4 goes on after wiring.',
      'GNDB0100 ground bar left of TBB0106, and the GNDB0101 ground lug at the top.',
    ],
    flags: ['Sheet B01 marks DISCB0101 "90A" and the supply "100 AMPS"; the BOM switch, fuse block and fuses are 60 A and the nameplate text on Z01 says 60A; the Z02 symbol is marked 100A. Confirm the rating before ordering or mounting.'],
  },
  {
    id: 'rail1', phase: 'P3', title: 'Rail A: FUB0145 and the three motor breakers', show: [...SUB, 'power', 'rail1'], bench: true,
    view: { az: -8, el: 6, dist: 0.8, target: [0.03, 1.42, 0.06] },
    why: 'Left to right along rail A as sheet Z03 draws it.',
    parts: ['LPSC002ID', 'CCMR003.TXP', '140MT-D9E-C20', '140MT-C-TE', '1492-EAJ35'],
    tasks: [
      'End anchor, then FUB0145 (LPSC002ID, two poles) at 476-513 mm, then an end anchor.',
      'CBB0108, CBB0112, CBB0116 (140MT-D9E-C20) at 523-568, 568-614 and 616-661 mm, each with its 140MT-C-TE Type E spacing adapter on the line side. End anchor after CBB0116.',
      'Set each breaker\'s dial to the lowest setting that does not trip (520-TD001 p.30, footnote 4).',
      'The two CCMR003.TXP fuses (3 A) go into FUB0145 at test.',
    ],
    flags: ['Sheet Z03 draws three end anchors on rail A; its BOM lists two.'],
  },
  {
    id: 'drives', phase: 'P3', title: 'Drives DRVB0200, DRVB0300, DRVB0400', show: [...SUB, 'power', 'rail1', 'drives'], bench: true,
    view: { az: 12, el: 8, dist: 1.0, target: [-0.02, 1.05, 0.1] },
    why: 'Three PowerFlex 525 frame C drives on the plate between the duct under rail A and the duct above rail B.',
    parts: ['25B-D013N104'],
    tasks: [
      'DRVB0200 at 329-438 mm, DRVB0300 at 485-594 mm, DRVB0400 at 640-749 mm across; 415-635 mm down. About 46 mm between drives.',
      'Clearances (520-TD001 p.16): 50 mm above and below, 25 mm each side. As drawn there is about 89 mm to the duct above and 128 mm to the duct below.',
      'Four screws each; holes 90.5 x 207 mm apart.',
    ],
  },
  {
    id: 't1', phase: 'P3', title: 'Control transformer TB0140', show: [...SUB, 'power', 'rail1', 'drives', 't1'], bench: true,
    view: { az: -14, el: 8, dist: 0.9, target: [0.36, 0.62, 0.08] },
    parts: ['E750WB', 'CCMR002.TXP', 'CCMR010.TXP'],
    why: 'Plate-mounted between the two risers at the right, below the drives.',
    tasks: [
      'TB0140 (E750WB, 750 VA) centred 904 mm across and 975 mm down.',
      'Its fuse blocks carry FUB0137 (two CCMR002.TXP, 2 A, primary) and FUB0142 (one CCMR010.TXP, 10 A, secondary). Fit the fuses at test.',
    ],
    flags: ['Sheet Z02 draws the transformer as a plain 178 x 152 mm rectangle. The E750WB is 162 x 176 mm on the plate and 178 mm deep (PartsLib): it fits between the ducts with about 68 mm above and 35 mm below.'],
  },
  {
    id: 'rail3', phase: 'P3', title: 'Rail B: FUB0125, 24 V supply, CBC0102, TB120-1, CBB0133', show: [...SUB, 'power', 'rail1', 'drives', 't1', 'rail3'], bench: true,
    view: { az: 6, el: 6, dist: 0.85, target: [-0.08, 0.6, 0.07] },
    parts: ['LPSC003ID', 'CCMR002.TXP', '1606-XLE240E-3', '1489-M1C050', '1492-J4', '1492-JG4', '1492-EBJ3', '1492-CJJ6-10', '1489-M1C100', '1492-EAJ35'],
    why: 'Left to right along rail B as sheet Z04 draws it.',
    tasks: [
      'End anchor, FUB0125 (LPSC003ID, three poles) at 336-391 mm, end anchor.',
      'PWSB0125 (1606-XLE240E-3) at 400-463 mm. Keep 40 mm clear above it and 20 mm below (1606-RM002 p.21). End anchor.',
      'CBC0102 (1489-M1C050, 5 A) at 475-493 mm, end anchor.',
      'TB120-1, 17 blocks from 501 mm: four marked B01421, three C01021, one each C01022, C01051, C01081, three B01411, then four 1492-JG4 ground blocks. An end barrier after each group.',
      'Screw centre jumpers (1492-CJJ6-10 cut to length): across the three C01021 blocks (terminals 5-7) and the three B01411 blocks (11-13).',
      'End anchor, CBB0133 (1489-M1C100, 10 A) at 631-648 mm, end anchor.',
      'Three CCMR002.TXP fuses (2 A) go into FUB0125 at test.',
    ],
    flags: ['BOM Z04 lists fifteen 1492-J4; sheet Z04 draws thirteen (and four 1492-JG4). It also lists two 1489-M1C100; one is drawn.', 'The four B01421 blocks are drawn without a jumper, although sheet C01 joins two B01421 terminals.'],
  },
  {
    id: 'rail4', phase: 'P3', title: 'Rail C: relays, TB1, TB24-1 and the Ethernet jacks', show: [...SUB, 'power', 'rail1', 'drives', 't1', 'rail3', 'rail4'], bench: true,
    view: { az: 4, el: 6, dist: 0.9, target: [0.2, 0.3, 0.06] },
    parts: ['700-HLT1L1', '1492-J4', '1492-JG4', '1492-EBJ3', '1492-CJJ6-10', 'CADIN1IG', 'CJ688TGIW', '1492-EAJ35'],
    why: 'Left to right along rail C as sheet Z05 draws it.',
    tasks: [
      'End anchor, relays CRC0102, CRC0105, CRC0108 (700-HLT1L1) at 627-646 mm, end anchor.',
      'TB1, 23 blocks from 655 mm: B02061 x3, B02101, B03061 x3, B03101, B04061 x3, B04101, B01341 x7, then four 1492-JG4 ground blocks. An end barrier after each group.',
      'Screw centre jumpers: across each group of three (terminals 1-3, 5-7, 9-11) and across the seven B01341 blocks (13-19).',
      'End anchor, then TB24-1: two blocks B01331 (jumpered) and one B01341. End anchor.',
      'Three Panduit CADIN1IG DIN adapters with CJ688TGIW jacks at 855-912 mm, end anchor.',
    ],
    flags: ['Sheet Z05 draws eight end barriers; its BOM lists seven.'],
  },
  {
    id: 'w480', phase: 'P4', title: '480 V AC power wiring (sheets B01 to B04)', show: ['all-sub1'], wires: { sheet: [5, 6, 7, 8], kind: 'power' }, bench: true,
    view: { az: -6, el: 6, dist: 1.5, target: [0.12, 1.1, 0.06] },
    why: 'Biggest conductors first, while the ducts are empty.',
    parts: [],
    tasks: [
      'Fuse block to TBB0106: B01021, B01022, B01023 (printed 1 AWG), straight down.',
      'TBB0106 to CBB0108, CBB0112, CBB0116, FUB0125, FUB0137 (on the transformer) and FUB0145.',
      'Breakers to drives: B01081/B01091/B01101 to DRVB0200, B01121/B01131/B01141 to DRVB0300, B01161/B01171/B01181 to DRVB0400.',
      'FUB0125 to the 24 V supply (B01321, B01332, B01342). FUB0145 to the air conditioner (B01451, B01461).',
      'Grounds to GNDB0100: the three drives, the 24 V supply, the transformer X2 bond, the 0 V bond and the air conditioner.',
      'Torque every termination to the value on its wire card and mark it.',
    ],
    flags: ['Sheet B01 prints "1AWG" on several 20 A branch conductors whose other phase, and whose own continuation on sheets B02 and B03, is printed 14AWG. This guide makes them 14 AWG and says so on each wire. Confirm.'],
  },
  {
    id: 'w120', phase: 'P4', title: '120 V AC control wiring (sheets B01 and C01)', show: ['all-sub1'], wires: { sheet: [5, 9] }, bench: true,
    view: { az: -4, el: 6, dist: 1.3, target: [0.15, 0.55, 0.06] },
    parts: [], why: 'Transformer secondary to TB120-1, CBC0102 and the three relay coils.',
    tasks: [
      'Transformer secondary fuse (FUB0142) to TB120-1 terminal 4, lower screw (B01421); X2 to TB120-1 terminal 11 (B01411) and to the ground bar.',
      'TB120-1 terminal 4, upper screw, to CBC0102; CBC0102 to terminal 5 (C01021).',
      'Relay coils: A1 from TB120-1 terminals 8, 9 and 10; A2 to terminals 11, 12 and 13 (B01411).',
    ],
    flags: ['Sheet B01 prints 8 AWG for B01421 and B01411 into TB120-1. A 1492-J4 takes 22-10 AWG. Confirm the size.', 'The return terminals on sheet C01 are labelled C01051, C01081 and C01021; sheet Z04 marks the blocks C01022, C01051, C01081. This guide follows Z04, one block per pump, left to right. Confirm.'],
  },
  {
    id: 'w24', phase: 'P4', title: '24 V DC and drive control wiring (sheets B01 to B04, D01)', show: ['all-sub1'], wires: { sheet: [5, 6, 7, 8, 10] }, bench: true,
    view: { az: 0, el: 6, dist: 1.5, target: [0.0, 0.7, 0.06] },
    parts: [], why: 'The 24 V supply to CBB0133 and the strips, and each drive\'s stop and input circuit through its relay contact.',
    tasks: [
      '24 V supply + to CBB0133, CBB0133 to TB24-1 terminal 1 (B01331). Supply - to TB1 terminal 13 (B01341) and to the ground bar.',
      'TB1 terminal 17 to TB24-1 terminal 3 (B01341).',
      'Each drive: terminal 1 and terminal 11 to its B0x061 group on TB1; terminal 5 to its B0x101 block; terminal 4 to a B01341 block.',
      'Each relay: contact 14 to the third B0x061 block, contact 11 to the B0x101 block.',
      'Remove the factory jumper between drive terminals 01 and 11 (note on sheets B02 to B04): terminal 1 is wired as the stop input.', 'LEAVE the safe-off jumper (S1, S2, S+) in place for now: see the flag below.',
    ],
    flags: ['Sheets B02 to B04 say "Remove safe-off jumper" but draw nothing connected to S1 and S2 (two short stubs that end in space). With the jumper out and nothing on S1/S2 the drive will not run. Do not remove it until engineering says what the safety inputs connect to.', 'The relay contact terminals (11, 14) are printed on sheet B04 only; B02 and B03 are wired the same way here.'],
  },
  {
    id: 'wnet', phase: 'P4', title: 'Ethernet (sheet N01)', show: ['all-sub1'], wires: { sheet: [11] }, bench: true,
    view: { az: 0, el: 6, dist: 1.4, target: [0.1, 0.6, 0.06] },
    parts: ['1585J-M8HBJM-3'], why: 'One patch cord from each drive to its DIN-rail jack.',
    tasks: ['CBLN0102 from DRVB0200, CBLN0104 from DRVB0300, CBLN0106 from DRVB0400, each to its jack on rail C (left to right).'],
    flags: ['The jacks have no tags and sheet N01 does not say which jack takes which cable: left to right in cable-number order is this guide\'s choice.'],
  },
  {
    id: 'wfield', phase: 'P4', title: 'Field and site wiring (for the installer)', show: ['all-sub1'], wires: { sheet: [5, 6, 7, 8, 9, 11] }, bench: true,
    view: { az: 0, el: 6, dist: 1.6, target: [0.0, 0.6, 0.06] },
    parts: [], why: 'Drawn dashed on the schematics: made on site. Shown so each landing is clear.',
    tasks: [
      'Incoming feeder to the disconnect line lugs, incoming ground to GNDB0100.',
      'Motor leads U, V, W and the motor ground from each drive to its auxiliary disconnect and motor.',
      'Pump auxiliary disconnect contacts CRAUX1-3: out from TB120-1 terminals 5, 6, 7 (field side), back to 8, 9, 10.',
      'Ethernet from each jack to the IDF-04 switch.',
    ],
    flags: ['No entry points are drawn for any field conductor. Sheet A03 notes 6 and 18: bottom entry, and DC and analog in a separate conduit from AC.'],
  },
  {
    id: 'install', phase: 'P5', title: 'Install the subpanel in the enclosure', show: ['enc', 'stand', 'doors', 'all-sub1', 'wires'], open: true,
    view: { az: 24, el: 10, dist: 2.4, target: [0, 0.95, 0.15] },
    parts: [], why: 'The wired subpanel goes back on its studs.',
    tasks: ['Lift the subpanel onto its studs and torque the nuts.', 'Bond the subpanel and both doors to the enclosure ground.'],
  },
  {
    id: 'ac', phase: 'P5', title: 'Air conditioner and disconnect handle', show: ['enc', 'stand', 'doors', 'all-sub1', 'wires', 'ac', 'handle'], open: true,
    view: { az: -50, el: 10, dist: 2.2, target: [0, 0.95, 0.15] },
    parts: ['1494U-HS1', '1494U-R1'], why: 'The air conditioner and the handle go on once the subpanel is in.',
    tasks: ['Mount ACB0145 on the left side wall (sheet Z01) to its maker\'s cutout template and connect B01451, B01461 and its ground.', 'Fit the 1494U-HS1 handle on the right flange, cut the 1494U-R1 rod to length and adjust it to the switch. Check the door interlock.'],
    flags: ['The air conditioner is not in any BOM and its cutout is not drawn. Sheet B01 draws it with a three-phase symbol and two supply wires.'],
  },
  {
    id: 'finish', phase: 'P5', title: 'Covers, labels and checks', show: ['enc', 'stand', 'doors', 'all-sub1', 'wires', 'ac', 'handle', 'covers'], open: false,
    view: { az: 28, el: 10, dist: 2.6, target: [0, 0.9, 0.15] },
    parts: ['C2WH6', '1492-PDBC4'], why: 'Close up and prove the build before it leaves the shop.',
    tasks: ['Duct covers on (C2WH6) and the TBB0106 cover plate.', 'Wire markers: black text on white, as sheet A03 note 11 says, checked against this guide.', 'Torque audit, continuity, insulation resistance, then power up section by section.', 'Fit the fuses: LPJ-60SP x3, CCMR002 x5, CCMR003 x2, CCMR010 x1.', 'Fit the panel name tag with the text on sheet Z01.'],
  },
]
