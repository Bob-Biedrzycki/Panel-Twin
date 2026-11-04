// VFD 200 assembly guide: the panel as drawn, the parts and the build order.
// Source: ../Draft rev18.pdf (ABARTA Coca-Cola CIP Double Skid, CPME 1082-01, rev A).
//   sheet 2 door layout, sheet 3 subplate layout, sheets 4-15 wiring, sheets 16-18 BOM.
// Subplate positions are sheet 3 ordinates in mm from the top left corner of subplate 1 (1118 x 1422 mm),
// read from the drawing (tools/extract_textures.py writes the exact face rectangles to assets/tex/index.json).
// Body depths are catalogue envelopes rounded to the mm; where a depth is not printed in a document we hold,
// it is marked depthNote: 'approx'.

export const JOB = {
  project: 'ABARTA Coca-Cola CIP Double Skid',
  location: 'Bedford Heights, OH',
  number: '1082-01',
  panel: 'VFD 200',
  desc: 'VFD Panel',
  drawing: 'Draft rev18.pdf',
  rev: 'A',
  sheets: 18,
}

// ---------------------------------------------------------------- bill of material (sheets 16-18, verbatim part numbers)
// cls: the BOM class name. where: the BOM "Where used". qty as printed.
export const BOM = [
  { pn: '25B-D024N104', mfr: 'Allen-Bradley', cls: 'Drive', qty: '2', where: 'DRV1 / DRV2', desc: 'PowerFlex 525 AC drive, embedded EtherNet/IP and Safety, 380-480 V AC 3-phase, 24 A, 15 HP / 11 kW ND and HD, frame D, IP20 open type, no filter', sheet: 16 },
  { pn: '140MT-F9E-C32', mfr: 'Allen-Bradley', cls: 'Circuit Breaker', qty: '2', where: 'CB1 / CB2', desc: 'Motor protection circuit breaker, self-protected Type E combination motor controller, 24-32 A adjustable, trip class 10, 65 kA at 480Y/277 V, F-frame, 35 mm DIN rail', sheet: 16 },
  { pn: '467-416', mfr: 'RS PRO', cls: 'Rail', qty: '2,591.20 mm', where: 'Panel-Subplate 1', desc: 'DIN rail, top hat, slotted, 1 m x 35 mm x 7.5 mm', sheet: 16 },
  { pn: '787-1668', mfr: 'WAGO', cls: 'Circuit Breaker', qty: '1', where: 'CB4', desc: 'Electronic circuit breaker, EPSITRON 787, 8 channels, 24 VDC, adjustable 2-10 A per channel, push-in CAGE CLAMP, 35 mm DIN rail', sheet: 16 },
  { pn: '800H-FRXJTQH2RA5', mfr: 'Allen-Bradley', cls: 'Button', qty: '1', where: 'E-STOP', desc: '30 mm push-pull operator, illuminated LED jumbo mushroom 60 mm, twist-to-release, red, 12-130 V AC/DC, Type 4/4X/12/13', sheet: 16 },
  { pn: '1492-EAJ35', mfr: 'Allen-Bradley', cls: 'End stop', qty: '21', where: 'TB1-TB5', desc: '1492 end anchor', sheet: 16 },
  { pn: '1492-EBJ3', mfr: 'Allen-Bradley', cls: 'Separator', qty: '2', where: 'TB1 / TB2', desc: '1492 end barrier, grey', sheet: 16 },
  { pn: '1492-J4', mfr: 'Allen-Bradley', cls: 'Terminal', qty: '81', where: 'TB2 / TB4 / TB5', desc: 'Terminal block, 5 mm, 25 A, grey, screw, one 22-12 AWG, single feed-through', sheet: 16 },
  { pn: '1492-J6', mfr: 'Allen-Bradley', cls: 'Terminal', qty: '6', where: 'TB1', desc: 'Terminal block, screw, feed-through, 8.1 x 60 x 39.5 mm, 1 pole, grey', sheet: 16 },
  { pn: '1492-JD4', mfr: 'Allen-Bradley', cls: 'Terminal', qty: '12', where: 'TB3', desc: 'Terminal block, 35 A, 600 V, 2 level, 2 circuit, grey, 4 mm', sheet: 16 },
  { pn: '1492-PDC-3A200-S0108', mfr: 'Allen-Bradley', cls: 'Power Distribution Block', qty: '1', where: 'PDB1', desc: 'Power distribution block, covered, 3-pole, 200 A, 1 line 3/0-#8 AWG, 8 loads #2-#8 AWG, panel mount', sheet: 16 },
  { pn: '1492-REC15', mfr: 'Allen-Bradley', cls: 'Receptacle', qty: '1', where: 'RCP1', desc: 'IEC duplex receptacle 15 A, DIN rail', sheet: 16 },
  { pn: '1494U-D100', mfr: 'Allen-Bradley', cls: 'Disconnect', qty: '1', where: 'Q1', desc: 'Universal visible-blade disconnect switch and mechanism, 100 A, 600 V AC, 3-pole, 60 HP at 460 V, panel mount', sheet: 16 },
  { pn: '1494U-F100', mfr: 'Allen-Bradley', cls: 'Fuse holder', qty: '1', where: 'FU1', desc: 'Fuse block, class H, J or R, 100 A, 600 V, 3-pole, #12-24 UNC studs, clips ordered separately', sheet: 16 },
  { pn: '1769-ECR', mfr: '(not given)', cls: 'PLC Accessory', qty: '1', where: 'PLC1', desc: 'CompactLogix right end cap', sheet: 16 },
  { pn: '1769-L30ER', mfr: 'Allen-Bradley', cls: 'PLC', qty: '1', where: 'PLC1', desc: 'CompactLogix 5370 L3 controller, dual Ethernet with DLR, 1 MB', sheet: 16 },
  { pn: '1769-OW16', mfr: 'Allen-Bradley', cls: 'PLC Module', qty: '1', where: 'PLC1-IO1', desc: 'Compact I/O relay output module, 16 N.O.', sheet: 16 },
  { pn: '1769-PB2', mfr: '(not given)', cls: 'Power supply', qty: '1', where: 'PWS2', desc: 'Compact I/O backplane power supply, 19.2-31.2 V DC input', sheet: 16 },
  { pn: '2711P-T10C21D8S', mfr: 'Allen-Bradley', cls: 'HMI', qty: '1', where: 'HMI1', desc: 'PanelView Plus 7 Standard, 10.4 in touch, 24 V DC, Type 4X/12/13, panel cutout mount', sheet: 16 },
  { pn: '2787-2347', mfr: 'WAGO', cls: 'Power supply', qty: '1', where: 'PWS1', desc: 'Pro 2 power supply, 3-phase 400-500 V AC in, 24 VDC 20 A / 480 W, CAGE CLAMP, 35 mm DIN rail', sheet: 16 },
  { pn: '8721AHA020UA1', mfr: 'Emerson Rosemount', cls: 'Sensor', qty: '1', where: 'FM1', desc: 'Hygienic magnetic flow meter sensor (field device; requires separate 8712 transmitter)', sheet: 16, field: true },
  { pn: '1085219', mfr: 'Phoenix Contact', cls: 'Networking', qty: '1', where: 'NS1', desc: 'FL SWITCH 1116N unmanaged Ethernet switch, 16 RJ45, 9-32 V DC, 35 mm DIN rail', sheet: 17 },
  { pn: 'A1021803-1', mfr: 'LUTZE', cls: 'Cable', qty: '0.00 mm', where: 'CBL-IOL-01 ... 25', desc: 'IO-Link cable, 3 x 18 AWG, cut to length (field)', sheet: 17, field: true },
  { pn: 'AL1920', mfr: 'IFM Electronic', cls: 'PLC Coupler', qty: '3', where: 'CPL1 / CPL2 / CPL3', desc: 'IO-Link master, EtherNet/IP, CabinetLine, 8 IO-Link ports, 35 mm DIN rail', sheet: 17 },
  { pn: 'C2WH6', mfr: 'Panduit', cls: 'Wire management accessory', qty: '10', where: 'Panel-Subplate 1', desc: 'White 2 in duct cover', sheet: 17 },
  { pn: 'CEM3713T', mfr: 'Baldor Reliance', cls: 'Motor', qty: '2', where: 'MTR1 / MTR2', desc: '15 HP premium efficiency motor (field device)', sheet: 17, field: true },
  { pn: 'CHCC1DU', mfr: 'Eaton Bussmann', cls: 'Fuse holder', qty: '1', where: 'FU2', desc: 'Fuse holder, class CC, 1-pole, 30 A, 600 V, DIN rail', sheet: 17 },
  { pn: 'D167-14', mfr: 'ILSCO', cls: 'Ground Bar', qty: '2', where: 'GB1 / GB2', desc: 'Ground/neutral bar, 14 taps 6-14 AWG, 4-14 AWG main, 2 mounting holes', sheet: 17 },
  { pn: 'DN-ASB2-10', mfr: 'AutomationDirect', cls: 'DIN rail accessory', qty: '2', where: 'Subplate 2', desc: 'Angled DIN rail support bracket, 50 mm, zinc plated, M6 screws included', sheet: 17 },
  { pn: 'DP2200', mfr: 'ifm electronic', cls: 'Signal Converter', qty: '4', where: 'SC1 / SC2 / SC5 / SC6', desc: '4-20 mA in to IO-Link converter (field side, at the instrument)', sheet: 17, field: true },
  { pn: 'E750WB', mfr: 'SolaHD (Emerson)', cls: 'Transformer', qty: '1', where: 'T1', desc: 'Control transformer, 240/480 V to 120 V, 0.75 kVA, class CC primary and midget secondary fuse blocks', sheet: 17 },
  { pn: 'EIO104', mfr: 'ifm electronic', cls: 'Signal Converter', qty: '2', where: 'SC3 / SC4', desc: 'IO-Link in to 4-20 mA out converter (field side)', sheet: 17, field: true },
  { pn: 'EVC001', mfr: 'IFM', cls: 'Cable', qty: '0.00 mm', where: 'EVC001-01 ... 06', desc: 'M12 A-coded 4-pin socket to open end (field)', sheet: 17, field: true },
  { pn: 'EVC094', mfr: 'IFM', cls: 'Cable', qty: '0.00 mm', where: 'EVC094-01 ... 06', desc: 'M12 A-coded 5-pin plug to open end (field)', sheet: 17, field: true },
  { pn: 'EVT002', mfr: 'IFM', cls: 'Cable', qty: '0.00 mm', where: 'EVT002-01 ... 03', desc: 'M12 4-pin straight socket, hygienic (field)', sheet: 17, field: true },
  { pn: 'EVT005', mfr: 'IFM', cls: 'Cable', qty: '0.00 mm', where: 'EVT005-01 ... 10', desc: 'M12 4-pin angled socket, hygienic (field)', sheet: 17, field: true },
  { pn: 'F2X2WH6', mfr: 'Panduit', cls: 'Wire duct', qty: '5,024.21 mm', where: 'Panel-Subplate 1', desc: 'Panduit white narrow slot duct 2 x 2 in, uses cover C2WH6', sheet: 17 },
  { pn: 'F3X2WH6', mfr: 'Panduit', cls: 'Wire duct', qty: '2,454.41 mm', where: 'Panel-Subplate 1', desc: 'Panduit white narrow slot duct 3 x 2 in, uses cover C3WH6', sheet: 17 },
  { pn: 'FAZ-C2-1-NA-SP', mfr: 'Eaton', cls: 'Circuit Breaker', qty: '1', where: 'CB5', desc: 'Miniature circuit breaker, 2 A, 1-pole, C curve, 277 V AC / 48 V DC, 35 mm DIN rail', sheet: 17 },
  { pn: 'FAZ-D2-3-NA', mfr: 'Eaton', cls: 'Circuit Breaker', qty: '1', where: 'CB3', desc: 'Miniature circuit breaker, 2 A, 3-pole, D curve, 480Y/277 V AC, 35 mm DIN rail', sheet: 17 },
  { pn: 'FNQ-R-6', mfr: 'Eaton Bussmann', cls: 'Fuse', qty: '1', where: 'FU2', desc: 'Class CC fuse, time-delay, 6 A', sheet: 17 },
  { pn: 'GLG-1xmA-1xmA', mfr: '(BOM shows Eaton Bussmann: confirm)', cls: 'Signal Converter', qty: '7', where: 'SI1 ... SI6', desc: '4-20 mA in to 4-20 mA out isolator, 24 VDC, 35 mm DIN rail (qty 7 for 6 tags)', sheet: 17 },
  { pn: 'K3A26U2N', mfr: 'Burndy (Hubbell)', cls: 'Termination lug', qty: '1', where: 'Lug1', desc: 'Mechanical lug, 3-conductor, 14-2/0 AWG, 1/2 in stud, 2 bolt holes, panel mount', sheet: 18 },
  { pn: 'LDL201', mfr: 'ifm electronic', cls: 'Sensor', qty: '3', where: 'CE2 / CE3 / CE4', desc: 'Inductive conductivity sensor, IO-Link (field)', sheet: 18, field: true },
  { pn: 'LPJ-70SP', mfr: 'Eaton', cls: 'Fuse', qty: '1', where: 'FU1', desc: 'Class J fuse, time-delay, 70 A (one listed: FU1 is 3-pole, so 3 are needed)', sheet: 18 },
  { pn: 'MS4-LFR-AQP-D6-E-R-V-PSI-NPT-WPP', mfr: 'Festo', cls: 'Accessory', qty: '1', where: 'skid', desc: 'Filter regulator, MS4 (skid air, not in this panel)', sheet: 18, field: true },
  { pn: 'MS6-LFR-AQR-D6-E-R-V-PSI-NPT-WP', mfr: 'Festo', cls: 'Accessory', qty: '2', where: 'skid', desc: 'Filter regulator, MS6 (skid air, not in this panel)', sheet: 18, field: true },
  { pn: 'NAT-102', mfr: 'Moxa', cls: 'Networking', qty: '1', where: 'NS2', desc: 'Industrial NAT device, 2 port, 12-48 V DC, 35 mm DIN rail', sheet: 18 },
  { pn: 'PLTC-18-1S-1', mfr: 'Quabbin', cls: 'Cable', qty: '0.00 mm', where: 'CBL-ANL-01 / 02', desc: 'Instrument cable, shielded, 1 pair 18 AWG (field)', sheet: 18, field: true },
  { pn: 'PM1708', mfr: 'ifm electronic', cls: 'Pressure transmitter', qty: '3', where: 'LT1 / LT2 / LT3', desc: 'Hygienic pressure sensor, IO-Link (field)', sheet: 18, field: true },
  { pn: 'PTFIX 6-12X2,5 BU', mfr: 'Phoenix Contact', cls: 'Power Distribution Block', qty: '1', where: 'PDB2', desc: 'Distribution block, 1 x 6 mm² in / 12 x 2.5 mm² out, push-in, blue', sheet: 18 },
  { pn: 'PTFIX 6-18X2,5 BUWH', mfr: 'Phoenix Contact', cls: 'Power Distribution Block', qty: '1', where: 'PDB3', desc: 'Distribution block, 1 x 6 mm² in / 18 x 2.5 mm² out, push-in, blue/white', sheet: 18 },
  { pn: 'PTFIX-NS35A', mfr: 'Phoenix Contact', cls: 'DIN rail accessory', qty: '5', where: 'PDB2 / PDB3', desc: 'DIN rail adapter for PTFIX blocks', sheet: 18 },
  { pn: 'Recpt-2', mfr: '(blank)', cls: 'Receptacle', qty: '1', where: 'Component1', desc: '(placeholder line in the BOM: confirm)', sheet: 18 },
  { pn: 'Rosemount 1056', mfr: 'Emerson Rosemount', cls: 'Sensor', qty: '1', where: 'CE1', desc: 'Dual-input analyser (field; model number incomplete)', sheet: 18, field: true },
  { pn: 'SCE-16P14', mfr: 'Saginaw Control & Engineering', cls: 'Location', qty: '1', where: 'Subplate 2', desc: 'Sub-panel, flat steel, white powder coat, 15 x 13 in (381 x 330 mm)', sheet: 18 },
  { pn: 'SCE-60XEL4918SSST', mfr: 'Saginaw Control & Engineering', cls: 'Location', qty: '1', where: 'Panel', desc: 'Enclosure, free-standing disconnect, 2-door XEL sloping top, 60 x 49 x 18 in, 304 stainless, Type 3R/4/4X/12/13, right flange, removable centre post', sheet: 18 },
  { pn: 'SCE-AC1000B120VSS', mfr: 'Saginaw Control & Engineering', cls: 'Enclosure accessory', qty: '1', where: 'Panel', desc: 'Air conditioner, Enviro-Therm closed loop, 1000 BTU/h, 120 V AC, 304 stainless, Type 3R/4/4X/12', sheet: 18 },
  { pn: 'SUH401', mfr: 'ifm electronic', cls: 'Sensor', qty: '3', where: 'FM2 / FM3 / FM4', desc: 'Ultrasonic flow meter, IO-Link (field)', sheet: 18, field: true },
  { pn: 'TD2947', mfr: 'ifm electronic', cls: 'Temp. Transmitter', qty: '4', where: 'TT1 ... TT4', desc: 'Temperature transmitter, IO-Link (field)', sheet: 18, field: true },
  { pn: 'VTUX-A-P-IOL-SQUQTLAL-UL-16X-XLRV4ARV4ARV4ARV4ARV4ARV4ARV4ARV4A...', mfr: 'Festo', cls: 'Solenoid Manifold', qty: '1', where: 'VM1', desc: 'VTUX valve terminal, IO-Link, 16 positions with 2x 3/2 NC valves, 32 outputs, IPX0 without valve seal, panel mount', sheet: 18 },
]

// ---------------------------------------------------------------- the enclosure (metres), as in the first twin
export const ENC = { W: 1.245, HB: 1.524, D: 0.457, T: 0.00264, HOOD: 0.123, Y0: 0.15, SW: 1.118, SH: 1.422 }

// ---------------------------------------------------------------- wireway as drawn on sheet 3: [X0, X1, Ytop, Ybottom] mm, width in inches
export const DUCTS = [
  { id: 'D1', r: [0, 84, 0, 1422], size: '3x2', note: 'left riser' },
  { id: 'D2', r: [84, 810, 0, 58], size: '2x2', note: 'top, above rail 1' },
  { id: 'D3', r: [84, 810, 292, 349], size: '2x2', note: 'below rail 1, above the drives' },
  { id: 'D4', r: [810, 869, 0, 709], size: '2x2', note: 'riser left of Q1/FU1/PDB1' },
  { id: 'D5', r: [84, 1118, 709, 767], size: '2x2', note: 'below the drives, above rail 3' },
  { id: 'D6', r: [742, 799, 767, 1045], size: '2x2', note: 'riser between PWS1 and T1' },
  { id: 'D7', r: [1061, 1118, 767, 1422], size: '2x2', note: 'right riser, lower' },
  { id: 'D8', r: [84, 1061, 1045, 1127], size: '3x2', note: 'between rail 3 and rail 4' },
  { id: 'D9', r: [84, 1061, 1364, 1422], size: '2x2', note: 'bottom, field side' },
]

// DIN rails (35 x 7.5 slotted): centre line Y and the run X0..X1 (mm), as drawn
export const RAILS = {
  r1: { y: 171, x0: 92, x1: 800, name: 'Rail 1' },
  r3: { y: 905, x0: 93, x1: 734, name: 'Rail 3' },
  r4: { y: 1245, x0: 94, x1: 1051, name: 'Rail 4' },
}

// ---------------------------------------------------------------- devices
// face: 'photo' (a manufacturer image), 'line' (a line drawing: tinted with the body colour)
// at: 'sub1' subplate 1 (sheet 3 mm), 'sub2' subplate 2, 'door', 'enc' (on the enclosure)
// tex: texture key in assets/tex (rectangle from index.json unless r is given)
// depth: body depth off the mounting surface in mm. body: side colour (sRGB hex).
export const DEVICES = [
  // plate-mounted power entry (top right)
  { tag: 'Q1', pn: '1494U-D100', at: 'sub1', tex: 'Q1', face: 'photo', depth: 102, body: '#1d1d1f', step: 'power', note: 'Z = 101.6 mm per Rockwell 1494U-IN007 (sheet 3): set the operating mechanism to this dimension.' },
  { tag: 'FU1', pn: '1494U-F100', at: 'sub1', tex: 'FU1', face: 'photo', depth: 78, body: '#1d1d1f', step: 'power', also: ['LPJ-70SP'] },
  { tag: 'PDB1', pn: '1492-PDC-3A200-S0108', at: 'sub1', tex: 'PDB1', face: 'photo', depth: 70, body: '#232325', step: 'power' },
  { tag: 'GB1', pn: 'D167-14', at: 'sub1', tex: 'GB1', face: 'photo', depth: 14, body: '#b7b7b2', metal: true, step: 'power' },
  { tag: 'Lug1', pn: 'K3A26U2N', at: 'sub1', tex: 'LUG1', face: 'line', depth: 30, body: '#c9c9c4', metal: true, step: 'power', r: [879, 930, 85, 183] },
  // rail 1
  { tag: 'FU2', pn: 'CHCC1DU', at: 'sub1', rail: 'r1', tex: 'FU2', face: 'photo', depth: 58, body: '#d9d9d6', step: 'rail1', also: ['FNQ-R-6'] },
  { tag: 'CB2', pn: '140MT-F9E-C32', at: 'sub1', rail: 'r1', tex: 'CB2', face: 'line', depth: 97, body: '#9a9c9e', step: 'rail1' },
  { tag: 'CB1', pn: '140MT-F9E-C32', at: 'sub1', rail: 'r1', tex: 'CB1', face: 'line', depth: 97, body: '#9a9c9e', step: 'rail1' },
  { tag: 'CB3', pn: 'FAZ-D2-3-NA', at: 'sub1', rail: 'r1', tex: 'CB3', face: 'line', depth: 70, body: '#e8e8e4', step: 'rail1' },
  { tag: 'TB1', pn: '1492-J6', at: 'sub1', rail: 'r1', strip: { n: 6, pitch: 8.1, h: 60, depth: 47, tex: 'TERM_J4', x0: 636, kind: 'J6' }, step: 'rail1' },
  // drives
  { tag: 'DRV1', pn: '25B-D024N104', at: 'sub1', tex: 'DRV1', face: 'photo', depth: 172, body: '#e3e3e0', step: 'drives' },
  { tag: 'DRV2', pn: '25B-D024N104', at: 'sub1', tex: 'DRV2', face: 'photo', depth: 172, body: '#e3e3e0', step: 'drives' },
  // rail 3
  { tag: 'PWS2', pn: '1769-PB2', at: 'sub1', rail: 'r3', tex: 'PWS2', face: 'line', depth: 87, body: '#d0d1cf', step: 'rail3' },
  { tag: 'PLC1', pn: '1769-L30ER', at: 'sub1', rail: 'r3', tex: 'PLC1', face: 'line', depth: 97.5, depthNote: '1769-TD005 (105 mm overall)', body: '#d0d1cf', step: 'rail3' },
  { tag: 'IO1', pn: '1769-OW16', at: 'sub1', rail: 'r3', tex: 'IO1', face: 'line', depth: 79.5, depthNote: '1769-IN062 p.14 (118 x 87 mm)', body: '#d0d1cf', step: 'rail3' },
  { tag: 'ECR', pn: '1769-ECR', at: 'sub1', rail: 'r3', tex: 'ECR', face: 'line', depth: 87, body: '#d0d1cf', step: 'rail3' },
  { tag: 'SI1', pn: 'GLG-1xmA-1xmA', at: 'sub1', rail: 'r3', tex: 'SI1', face: 'photo', depth: 114, body: '#3aa53c', step: 'rail3', r: [362.8, 385.3, 854.8, 954.1], xNote: 'real width (PartsLib), shifted from the sheet 3 position: see Design issues', depthNote: 'approx' },
  { tag: 'SI2', pn: 'GLG-1xmA-1xmA', at: 'sub1', rail: 'r3', tex: 'SI2', face: 'photo', depth: 114, body: '#3aa53c', step: 'rail3', r: [385.3, 407.8, 854.8, 954.1], xNote: 'real width (PartsLib), shifted from the sheet 3 position: see Design issues', depthNote: 'approx' },
  { tag: 'SI3', pn: 'GLG-1xmA-1xmA', at: 'sub1', rail: 'r3', tex: 'SI3', face: 'photo', depth: 114, body: '#3aa53c', step: 'rail3', r: [407.8, 430.3, 854.8, 954.1], xNote: 'real width (PartsLib), shifted from the sheet 3 position: see Design issues', depthNote: 'approx' },
  { tag: 'SI4', pn: 'GLG-1xmA-1xmA', at: 'sub1', rail: 'r3', tex: 'SI4', face: 'photo', depth: 114, body: '#3aa53c', step: 'rail3', r: [430.3, 452.8, 854.8, 954.1], xNote: 'real width (PartsLib), shifted from the sheet 3 position: see Design issues', depthNote: 'approx' },
  { tag: 'CPL1', pn: 'AL1920', at: 'sub1', rail: 'r3', tex: 'CPL1', face: 'photo', depth: 97.8, body: '#e2761c', step: 'rail3', r: [452.8, 502.8, 839.7, 965.8], depthNote: 'ifm 80281466 p.8 (105.3 mm overall)', xNote: 'real width 50 mm (ifm p.8)' },
  { tag: 'CPL2', pn: 'AL1920', at: 'sub1', rail: 'r3', tex: 'CPL2', face: 'photo', depth: 97.8, body: '#e2761c', step: 'rail3', r: [502.8, 552.8, 840, 966.2], depthNote: 'ifm 80281466 p.8 (105.3 mm overall)', xNote: 'real width 50 mm (ifm p.8)' },
  { tag: 'CPL3', pn: 'AL1920', at: 'sub1', rail: 'r3', tex: 'CPL3', face: 'photo', depth: 97.8, body: '#e2761c', step: 'rail3', r: [552.8, 602.8, 839.7, 965.8], depthNote: 'ifm 80281466 p.8 (105.3 mm overall)', xNote: 'real width 50 mm (ifm p.8)' },
  { tag: 'CB4', pn: '787-1668', at: 'sub1', rail: 'r3', tex: 'CB4', face: 'photo', depth: 104, body: '#c9cbcc', step: 'rail3', r: [602.8, 645.4, 840.6, 966.8], xNote: 'real width (PartsLib), shifted from the sheet 3 position: see Design issues', depthNote: 'approx' },
  { tag: 'PWS1', pn: '2787-2347', at: 'sub1', rail: 'r3', tex: 'PWS1', face: 'line', depth: 127, body: '#e9eae7', step: 'rail3', r: [645.4, 715.4, 839.0, 969.1], xNote: 'real width (PartsLib), shifted from the sheet 3 position: see Design issues', depthNote: 'approx' },
  { tag: 'T1', pn: 'E750WB', at: 'sub1', tex: 'T1', face: 'photo', depth: 115, body: '#1b1b1d', step: 't1', depthNote: 'approx' },
  // rail 4
  { tag: 'NS1', pn: '1085219', at: 'sub1', rail: 'r4', tex: 'NS1', face: 'photo', depth: 110, body: '#d8d9d6', step: 'rail4', depthNote: 'approx' },
  { tag: 'NS2', pn: 'NAT-102', at: 'sub1', rail: 'r4', tex: 'NS2', face: 'photo', depth: 100, body: '#202224', step: 'rail4', depthNote: 'approx' },
  { tag: 'SI5', pn: 'GLG-1xmA-1xmA', at: 'sub1', rail: 'r4', tex: 'SI5', face: 'photo', depth: 114, body: '#3aa53c', step: 'rail4', depthNote: 'approx' },
  { tag: 'SI6', pn: 'GLG-1xmA-1xmA', at: 'sub1', rail: 'r4', tex: 'SI6', face: 'photo', depth: 114, body: '#3aa53c', step: 'rail4', depthNote: 'approx' },
  { tag: 'PDB2', pn: 'PTFIX 6-12X2,5 BU', at: 'sub1', rail: 'r4', tex: 'PDB2', face: 'photo', depth: 48, body: '#1d8fd6', step: 'rail4', also: ['PTFIX-NS35A'], depthNote: 'approx' },
  { tag: 'PDB3', pn: 'PTFIX 6-18X2,5 BUWH', at: 'sub1', rail: 'r4', tex: 'PDB3', face: 'photo', depth: 48, body: '#5fb4e8', step: 'rail4', also: ['PTFIX-NS35A'], depthNote: 'approx' },
  { tag: 'TB3', pn: '1492-JD4', at: 'sub1', rail: 'r4', strip: { n: 12, pitch: 6.1, h: 60.7, depth: 56, tex: 'TB3', slices: 12, x0: 319, kind: 'JD4' }, depthNote: 'approx', step: 'rail4' },
  { tag: 'TB4', pn: '1492-J4', at: 'sub1', rail: 'r4', strip: { n: 72, pitch: 6.1, h: 60, depth: 47, tex: 'TERM_J4', x0: 400.5, kind: 'J4' }, step: 'rail4', note: '72 x 1492-J4 at 6.1 mm (1492-TD015 p.2) = 439 mm, from 400.5 to 840 mm: as drawn on sheet 3.' },
  { tag: 'TB5', pn: '1492-J4', at: 'sub1', rail: 'r4', strip: { n: 5, pitch: 6.1, h: 60, depth: 47, tex: 'TERM_J4', x0: 849, kind: 'J4' }, step: 'rail4' },
  { tag: 'CB5', pn: 'FAZ-C2-1-NA-SP', at: 'sub1', rail: 'r4', tex: 'CB5', face: 'line', depth: 70, body: '#e8e8e4', step: 'rail4' },
  { tag: 'TB2', pn: '1492-J4', at: 'sub1', rail: 'r4', strip: { n: 4, pitch: 6.1, h: 60, depth: 47, tex: 'TERM_J4', x0: 1006, kind: 'J4' }, step: 'rail4' },
  // subplate 2 (left side wall), VM1 on angled brackets, 50 mm stand-off
  { tag: 'Subplate 2', pn: 'SCE-16P14', at: 'sub2', step: 'sub2' },
  { tag: 'VM1', pn: 'VTUX-A-P-IOL-SQUQTLAL-UL-16X-XLRV4ARV4ARV4ARV4ARV4ARV4ARV4ARV4A...', at: 'sub2', tex: 'VM1', face: 'photo', depth: 120, body: '#8c8f92', step: 'sub2', also: ['DN-ASB2-10'], depthNote: 'approx' },
  // door and enclosure
  { tag: 'HMI1', pn: '2711P-T10C21D8S', at: 'door', tex: 'HMI1', face: 'photo', step: 'door' },
  { tag: 'E-STOP', pn: '800H-FRXJTQH2RA5', at: 'door', step: 'door' },
  { tag: 'A/C', pn: 'SCE-AC1000B120VSS', at: 'enc', step: 'ac' },
]

// rail accessories counted per strip/device run (BOM qty 21 end anchors over TB1-TB5 and the rails)
export const ANCHORS = {
  r1: [130, 174, 627, 690],
  r3: [128, 316, 716],
  r4: [96, 311, 392.2, 840, 879.5, 997, 1030.4],
}

// ---------------------------------------------------------------- the build order
// Each step shows the panel after it is done. devices: tags installed in this step (keys of DEVICES or groups).
// view: camera (az, el in degrees; dist in multiples of the 1.8 m size; target in metres).
export const PHASES = [
  { id: 'P1', name: 'Prepare the enclosure' },
  { id: 'P2', name: 'Lay out subplate 1' },
  { id: 'P3', name: 'Mount the components' },
  { id: 'P4', name: 'Wire the subplate' },
  { id: 'P5', name: 'Install and finish' },
]

export const STEPS = [
  {
    id: 'enclosure', phase: 'P1', title: 'Receive the enclosure and set it on its stand', show: ['enc', 'stand', 'doors'],
    view: { az: 28, el: 10, dist: 2.6, target: [0, 0.9, 0.2] },
    why: 'Everything else is located from the enclosure, so check it first while it is empty.',
    parts: ['SCE-60XEL4918SSST'],
    tasks: [
      'Check the enclosure against the BOM: SCE-60XEL4918SSST, 60 x 49 x 18 in, two doors, removable centre post, right flange for the disconnect.',
      'Set it on its floor stand (sheet 2 shows legs to the floor; the stand is not in the BOM: confirm the part).',
      'Remove subplate 1 and keep its collar-stud nuts. Build subplate 1 flat on the bench (phases 2 to 4).',
      'Protect the 304 stainless: use stainless-only drills and files, and keep carbon-steel swarf off it.',
    ],
    flags: ['No floor stand, door bonding straps or E-STOP legend plate in the BOM.'],
  },
  {
    id: 'cutouts', phase: 'P1', title: 'Cut the doors and the side wall', show: ['enc', 'stand', 'doors', 'cutouts'],
    view: { az: 6, el: 6, dist: 2.3, target: [-0.25, 1.2, 0.4] },
    why: 'Cut and deburr before any device is in the enclosure, so no chips land in the electronics.',
    parts: ['2711P-T10C21D8S', '800H-FRXJTQH2RA5', 'SCE-AC1000B120VSS'],
    tasks: [
      'HMI1 cutout in the left door: 224 x 269 mm (8.82 x 10.59 in) H x W, display centre 1400 mm from the floor and 287 mm from the door\'s centre-post edge, 257 mm below the top of the door (sheet 2). Confirm the cutout against the PanelView Plus 7 installation instructions before cutting.',
      'E-STOP: 30 mm operator hole (800H) in the left door, centre 138 mm from the door\'s centre-post edge, 150 mm below the HMI cutout and 125 mm above the handle (sheet 2).',
      'A/C cutouts in the left side wall to the Saginaw Enviro-Therm template (position not drawn: confirm with engineering).',
      'Disconnect handle on the right flange: the flange is pre-punched for the 1494U operating mechanism; check it against 1494U-IN007.',
      'Deburr every cutout and clean the enclosure.',
    ],
    flags: ['The A/C and subplate 2 positions are not drawn: this guide puts both on the left side wall.', 'Field entries (feeder, 2 motor cables, ~25 instrument cables, VM1 air tubes) are not specified: no hubs, glands or gland plate in the BOM.'],
  },
  {
    id: 'plate', phase: 'P2', title: 'Mark out and drill subplate 1', show: ['plate'], bench: true,
    view: { az: 0, el: 4, dist: 1.9, target: [0, 0.92, 0.03] },
    why: 'Lay out every hole from sheet 3 before anything is mounted. Ducts and rails go down first because devices are placed against them.',
    parts: [],
    tasks: [
      'Subplate 1 is 1118 x 1422 mm (sheet 3). Work from its top left corner.',
      'Rails: centre lines at 171 mm (rail 1), 905 mm (rail 3) and 1245 mm (rail 4) from the top.',
      'Q1 at the top right (X 944-1117, Y 31-251 mm), FU1 below it (Y 315-384), PDB1 (Y 482-610), GB1 to its left (X 900-909), Lug1 at X 879-930, Y 85-183.',
      'Drives: DRV1 X 450-579, DRV2 X 628-757, both Y 403-660 mm, 50 mm clear on each side (sheet 3).',
      'T1 at X 844-1005, Y 814-989 mm.',
      'Drill and tap to the mounting hole patterns in each device\'s instructions (see Reference on each part).',
    ],
  },
  {
    id: 'duct', phase: 'P2', title: 'Mount the wire duct', show: ['plate', 'duct'], bench: true,
    view: { az: 0, el: 4, dist: 1.9, target: [0, 0.92, 0.03] },
    why: 'The ducts set the wire routes and the clearances to every device.',
    parts: ['F2X2WH6', 'F3X2WH6'],
    tasks: [
      '3 x 2 in (F3X2WH6): the left riser (full 1422 mm height) and the run between rail 3 and rail 4 (84-1061 mm, 82 mm tall band).',
      '2 x 2 in (F2X2WH6): top run, below rail 1, the riser left of Q1, below the drives, the riser between PWS1 and T1, the lower right riser and the bottom field run.',
      'Cut to length, deburr the ends, butt the corners tight. Leave the covers off until the end of wiring.',
    ],
    flags: ['The BOM lists only C2WH6 covers (10); the 2,454 mm of F3X2WH6 needs C3WH6 covers.'],
  },
  {
    id: 'rails', phase: 'P2', title: 'Mount the DIN rails', show: ['plate', 'duct', 'rails'], bench: true,
    view: { az: 0, el: 4, dist: 1.9, target: [0, 0.92, 0.03] },
    why: 'Three rails on subplate 1 (2,306 mm) and one on subplate 2 (290 mm): 2,596 mm against 2,591 mm in the BOM.',
    parts: ['467-416'],
    tasks: [
      'Rail 1: 92 to 800 mm at 171 mm (708 mm).',
      'Rail 3: 93 to 734 mm at 905 mm (641 mm).',
      'Rail 4: 94 to 1051 mm at 1245 mm (957 mm).',
      'Fix each rail at both ends and about every 200 mm. Deburr the cut ends.',
    ],
  },
  {
    id: 'power', phase: 'P3', title: 'Power entry: Q1, FU1, PDB1, GB1 and Lug1', show: ['plate', 'duct', 'rails', 'power'], bench: true,
    view: { az: -18, el: 8, dist: 1.0, target: [0.43, 1.35, 0.08] },
    why: 'The heaviest, plate-mounted parts first, while the plate is open around them.',
    parts: ['1494U-D100', '1494U-F100', 'LPJ-70SP', '1492-PDC-3A200-S0108', 'D167-14', 'K3A26U2N'],
    tasks: [
      'Q1 1494U-D100: mount the switch so the operating mechanism lines up with the right flange handle. Sheet 3: Z = 101.6 mm per 1494U-IN007.',
      'FU1 1494U-F100 below Q1, clips for class J. Fit the LPJ-70SP fuses last, after testing (three are needed; the BOM lists one).',
      'PDB1 1492-PDC-3A200-S0108 below FU1, cover on.',
      'GB1 ground bar left of PDB1 and Lug1 (main ground lug) left of Q1.',
    ],
  },
  {
    id: 'rail1', phase: 'P3', title: 'Rail 1: FU2, CB2, CB1, CB3, TB1', show: ['plate', 'duct', 'rails', 'power', 'rail1'], bench: true,
    view: { az: -10, el: 6, dist: 0.95, target: [-0.03, 1.4, 0.06] },
    why: 'Left to right along rail 1 as drawn on sheet 3.',
    parts: ['CHCC1DU', 'FNQ-R-6', '140MT-F9E-C32', 'FAZ-D2-3-NA', '1492-J6', '1492-EAJ35', '1492-EBJ3'],
    tasks: [
      'FU2 CHCC1DU at 139 mm (fuse FNQ-R-6 6 A goes in at test).',
      'CB2 then CB1 (140MT-F9E-C32) at 456-563 mm. Set both dials to their minimum that avoids nuisance trips (sheet 4 note, per Rockwell 520-TD001).',
      'CB3 FAZ-D2-3-NA (2 A, 3-pole) at 573-625 mm.',
      'TB1: six 1492-J6 with an end barrier and end anchors.',
      'End anchors either side of every group.',
    ],
  },
  {
    id: 'drives', phase: 'P3', title: 'Drives DRV1 and DRV2', show: ['plate', 'duct', 'rails', 'power', 'rail1', 'drives'], bench: true,
    view: { az: 16, el: 8, dist: 1.05, target: [0.03, 1.08, 0.1] },
    why: 'Both PowerFlex 525 frame D drives mount vertically on the plate with 50 mm side clearance (sheet 3).',
    parts: ['25B-D024N104'],
    tasks: [
      'DRV1 at X 450-579 mm, DRV2 at X 628-757 mm, Y 403-660 mm.',
      'Keep the top and bottom clearances in the PowerFlex 520 user manual: the ducts above (D3) and below (D5) set them.',
      'Mount with the screws in the four corner holes; keep the vent cover on until wiring is finished, then remove it if the manual calls for it at your ambient.',
    ],
  },
  {
    id: 't1', phase: 'P3', title: 'Control transformer T1', show: ['plate', 'duct', 'rails', 'power', 'rail1', 'drives', 't1'], bench: true,
    view: { az: -14, el: 8, dist: 0.9, target: [0.38, 0.78, 0.08] },
    parts: ['E750WB'],
    why: 'Plate-mounted at the right, below the drives.',
    tasks: ['T1 E750WB at X 844-1005, Y 814-989 mm. Fit its primary class CC and secondary midget fuses per sheet 4 (2 x 3.5 A class CC time-delay, 1 x 10 A midget time-delay): the fuses are not in the BOM.'],
    flags: ['T1 fuses (2 x 3.5 A class CC, 1 x 10 A midget, sheet 4) are not in the BOM.'],
  },
  {
    id: 'rail3', phase: 'P3', title: 'Rail 3: PLC, IO-Link masters, 24 V supply', show: ['plate', 'duct', 'rails', 'power', 'rail1', 'drives', 't1', 'rail3'], bench: true,
    view: { az: 8, el: 6, dist: 1.0, target: [-0.17, 0.8, 0.07] },
    parts: ['1769-PB2', '1769-L30ER', '1769-OW16', '1769-ECR', 'GLG-1xmA-1xmA', 'AL1920', '787-1668', '2787-2347', '1492-EAJ35'],
    why: 'The CompactLogix system goes on as one bus: PWS2, PLC1, IO1 and the end cap lock together left to right.',
    tasks: [
      'PWS2 1769-PB2, PLC1 1769-L30ER, IO1 1769-OW16 and the 1769-ECR end cap, from 136 mm. Slide each module along the bus and lock the bus levers.',
      'SI1-SI4 isolators from 363 mm.',
      'CPL1, CPL2, CPL3 AL1920 IO-Link masters from 450 mm.',
      'CB4 787-1668 then PWS1 2787-2347 at 596-710 mm. PWS1 needs its convection clearance above and below: check the WAGO instructions.',
    ],
  },
  {
    id: 'rail4', phase: 'P3', title: 'Rail 4: network, isolators, distribution and terminals', show: ['plate', 'duct', 'rails', 'power', 'rail1', 'drives', 't1', 'rail3', 'rail4'], bench: true,
    view: { az: 4, el: 6, dist: 1.05, target: [-0.05, 0.47, 0.06] },
    parts: ['1085219', 'NAT-102', 'GLG-1xmA-1xmA', 'PTFIX 6-12X2,5 BU', 'PTFIX 6-18X2,5 BUWH', 'PTFIX-NS35A', '1492-JD4', '1492-J4', 'FAZ-C2-1-NA-SP', '1492-EAJ35', '1492-EBJ3'],
    why: 'Left to right along rail 4 as drawn on sheet 3.',
    tasks: [
      'NS1 FL SWITCH 1116N at 104 mm, NS2 NAT-102 at 142 mm.',
      'SI5, SI6 at 166-210 mm.',
      'PDB2 (24 V, blue) and PDB3 (0 V, blue/white) on PTFIX-NS35A adapters at 211-311 mm.',
      'TB3: 12 x 1492-JD4 two-level terminals.',
      'TB4: 72 x 1492-J4 from 400.5 mm to 840 mm (6.1 mm each, 1492-TD015 p.2): as drawn on sheet 3.',
      'TB5: 5 x 1492-J4 (E-STOP), CB5 FAZ-C2-1 (2 A), TB2: 4 x 1492-J4 (120 V).',
      'End anchors on both sides of every strip; end barrier on the open side of TB2.',
    ],
    flags: ['RCP1 1492-REC15 (sheet 6) has no position on sheet 3.', 'GB2 (second D167-14) has no position on sheet 3.'],
  },
  {
    id: 'sub2', phase: 'P3', title: 'Subplate 2: VM1 valve terminal', show: ['sub2'], bench: true, sub2: true,
    view: { az: 70, el: 10, dist: 0.7, target: [-0.52, 0.56, 0.22] },
    parts: ['SCE-16P14', 'DN-ASB2-10', '467-416', 'VTUX-A-P-IOL-SQUQTLAL-UL-16X-XLRV4ARV4ARV4ARV4ARV4ARV4ARV4ARV4A...'],
    why: 'Sheet 3: VM1 mounts on angled DIN rail support brackets with a 50 mm stand-off.',
    tasks: [
      'Two DN-ASB2-10 angled brackets on SCE-16P14, 20 mm in from each side (sheet 3), rail across them.',
      'VM1 Festo VTUX on the rail. Keep the exhaust and the 1/4 in push-in ports clear.',
    ],
  },
  {
    id: 'w480', phase: 'P4', title: '480 V AC power wiring (sheet 4)', show: ['all-sub1'], wires: { sheet: [4, 5], kind: 'power' }, bench: true,
    view: { az: -6, el: 6, dist: 1.5, target: [0.12, 1.15, 0.06] },
    why: 'Biggest conductors first, while the ducts are empty.',
    parts: [],
    tasks: [
      'Q1 to FU1: W1-W3, 4 AWG. FU1 to PDB1: W4-W6, 4 AWG.',
      'PDB1 to CB1/CB2 (8 AWG), CB3 and T1 (14 AWG).',
      'CB1 to DRV1, CB2 to DRV2 (8 AWG); drive outputs to TB1 (8 AWG).',
      'Torque every termination to the value in its device\'s instructions and mark it.',
    ],
  },
  {
    id: 'w120', phase: 'P4', title: '120 V AC control wiring (sheet 6)', show: ['all-sub1'], wires: { sheet: [6] }, bench: true,
    view: { az: -6, el: 6, dist: 1.5, target: [0.12, 0.9, 0.06] },
    parts: [], why: 'T1 secondary to FU2, CB5, TB2 and the A/C feed.', tasks: ['Wire per sheet 6.'],
  },
  {
    id: 'w24', phase: 'P4', title: '24 V DC distribution (sheet 7)', show: ['all-sub1'], wires: { sheet: [7] }, bench: true,
    view: { az: 0, el: 6, dist: 1.4, target: [-0.05, 0.75, 0.06] },
    parts: [], why: 'PWS1 to CB4, CB4 channels to PDB2 and the loads, 0 V to PDB3.', tasks: ['Wire per sheet 7. Set the CB4 channel currents as printed on sheet 7.'],
  },
  {
    id: 'wnet', phase: 'P4', title: 'PLC, network and IO-Link (sheets 8-9)', show: ['all-sub1'], wires: { sheet: [8, 9] }, bench: true,
    view: { az: 0, el: 6, dist: 1.4, target: [-0.2, 0.75, 0.06] },
    parts: [], why: 'Ethernet patch cords and the IO-Link master power and port wiring.', tasks: ['Wire per sheets 8 and 9.'],
  },
  {
    id: 'wfield', phase: 'P4', title: 'Valve terminal and field terminals (sheets 10-15)', show: ['all-sub1', 'sub2'], wires: { sheet: [10, 11, 12, 13, 14, 15] }, bench: true,
    view: { az: 0, el: 6, dist: 1.3, target: [-0.05, 0.5, 0.06] },
    parts: [], why: 'Inside side of TB2-TB5 and the isolators; field sides are connected on site.', tasks: ['Wire per sheets 10 to 15. Leave the field side of each terminal open.'],
  },
  {
    id: 'install', phase: 'P5', title: 'Install the subplates in the enclosure', show: ['enc', 'stand', 'doors', 'cutouts', 'all-sub1', 'sub2', 'wires'], open: true,
    view: { az: 24, el: 10, dist: 2.4, target: [0, 0.95, 0.2] },
    parts: [], why: 'The wired subplate goes back on its collar studs.',
    tasks: ['Lift subplate 1 onto its collar studs and torque the nuts.', 'Bond subplate 1 to the enclosure ground stud.', 'Fit subplate 2 on the left side wall.'],
  },
  {
    id: 'door', phase: 'P5', title: 'Door devices: HMI1 and E-STOP', show: ['enc', 'stand', 'doors', 'cutouts', 'all-sub1', 'sub2', 'wires', 'door'], open: true,
    view: { az: 10, el: 6, dist: 1.4, target: [-0.3, 1.3, 0.45] },
    parts: ['2711P-T10C21D8S', '800H-FRXJTQH2RA5'], why: 'Door devices last, so they are not damaged while the subplate goes in.',
    tasks: ['HMI1 into its cutout with its mounting clips, tightened evenly to the torque in its instructions (this is what keeps the Type 4X seal).', 'E-STOP: operator through the 30 mm hole with its legend plate, latch and contact blocks on the back.'],
  },
  {
    id: 'ac', phase: 'P5', title: 'A/C unit and disconnect handle', show: ['enc', 'stand', 'doors', 'cutouts', 'all-sub1', 'sub2', 'wires', 'door', 'ac', 'handle'], open: true,
    view: { az: 50, el: 10, dist: 2.2, target: [0, 0.95, 0.2] },
    parts: ['SCE-AC1000B120VSS', '1494U-D100'], why: 'The A/C and handle go on once the enclosure is closed up.',
    tasks: ['Mount the Enviro-Therm on the side-wall cutouts with its gasket, per the Saginaw manual; route the condensate drain.', 'Fit the 1494U flange handle, cut the operating rod to length and adjust it to Q1 (1494U-IN007). Check the door interlock.'],
  },
  {
    id: 'finish', phase: 'P5', title: 'Covers, labels and checks', show: ['enc', 'stand', 'doors', 'cutouts', 'all-sub1', 'sub2', 'wires', 'door', 'ac', 'handle', 'covers'], open: false,
    view: { az: 28, el: 10, dist: 2.6, target: [0, 0.9, 0.2] },
    parts: ['C2WH6'], why: 'Close up and prove the build before it leaves the shop.',
    tasks: ['Duct covers on (C2WH6, and C3WH6 for the 3 in runs).', 'Device tags and wire markers checked against this guide.', 'Torque audit, continuity, insulation resistance, then power up section by section.', 'Fit the FU1 and FU2 fuses.'],
  },
]
