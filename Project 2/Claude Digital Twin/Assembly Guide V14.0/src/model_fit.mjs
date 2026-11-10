// Which vendor STEP model (assets/models, from ../Vendor Step Files) stands in for each device, and how it is turned
// into panel axes: X to the right, Y up, Z out of the panel towards the viewer.
// rot: rotations about the world axes applied in order, in degrees ('x90' = +90 about X).
// The back of every model (its lowest Z after turning) sits on the subplate face: the DIN devices' rail slots are in the
// models, so the rail sits inside them as it does on the panel.
// dx, dy: shift in mm from the centre of the sheet 3 rectangle, where the drawing and the model's outline disagree
// (a model outline includes latches and plugs that the sheet 3 face image leaves out).
// pins (optional): terminal positions in the maker's own model coordinates (mm), used instead of the sheet 3 layout.
// The rotations were found by viewing each model from all sides (tools/model_viewer.html) and checked against the maker's
// face image on sheet 3 with the terminal points drawn on (tools/fit_check.html).
const PF525_LOWER = [[[-70, -130], [70, -12]], [[8, -12], [70, 70]]]
const PF525_COVER = { box: [[-66, -13, 94.5], [8, 74.5, 200]], cut: [{ box: [[-64, -14, 93], [6.5, -6, 113]] }, { box: [[-66, -121, 56], [66, -77, 97]] }] }
// V5: terminal positions read off the makers' models (model mm after rot: lug screw centres, z = front of the screw or lug).
// The sheet 3 face pictures put Q1 and FU1's terminals 4-7 mm away from the model's lugs; the landing probe then finds the
// wire opening of each lug in the model. Q1: line lugs at the top (wire in from above), load box lugs at the bottom (from
// below), poles 46 mm apart. FU1: line box lugs above the fuses, load lugs below them.
const Q1_PINS = { L1: [-46, 66.4, 11.4, 't'], L2: [0, 66.4, 11.4, 't'], L3: [46, 66.4, 11.4, 't'], T1: [-46, -46.9, 30.9, 'b'], T2: [0, -46.9, 30.9, 'b'], T3: [46, -46.9, 30.9, 'b'] }
Object.assign(Q1_PINS, { '2T1': Q1_PINS.T1, '4T2': Q1_PINS.T2, '6T3': Q1_PINS.T3, '1L1': Q1_PINS.L1, '3L2': Q1_PINS.L2, '5L3': Q1_PINS.L3 })
const FU1_PINS = { L1: [-46.1, 12.4, 75.2, 't'], L2: [0, 12.4, 75.2, 't'], L3: [46.1, 12.4, 75.2, 't'], T1: [-46.1, -11.7, 40.3, 'b'], T2: [0, -11.7, 40.3, 'b'], T3: [46.1, -11.7, 40.3, 'b'] }
// V7 (Bob: the FU1 load wires did not land in the lugs): the box lug openings measured on Rockwell's model by rays from
// below: each lug's underside at y -41.3 mm, the through-hole centred at z 43.7 mm on the pole centre line. V5/V6's probe
// searched only to z 40.8 and took the gap behind the lug. The conductor goes 13 mm up into the lug, under its screw.
const FU1_LAND = Object.fromEntries([['T1', -46.0], ['T2', 0.2], ['T3', 46.2]].map(([n, x]) => [n, { tip: [x, -28, 43.7], mouth: [x, -41.6, 43.7], e: 'b' }]))
export const MODEL_FIT = {
  Q1: { model: 'Q1', rot: ['x90'], pins: Q1_PINS },
  // V9: the 1494U-F100 is a trailer fuse block. It hangs under the switch at DIM "Z" and the three fuses bridge from the
  // fuse clips on the switch's load side to the clips on the block (1494U-IN001 p.10: Z = 4.449 in, 113.0 mm, for 100 A
  // 600 V class J, with phase barriers; the shop photos show the clip plates on the switch). So its poles line up with
  // Q1's, and its top is 113.0 mm below the bottom of Q1's moulding. Placed from sheet 3 it sat 8.0 mm to the right and
  // 12.4 mm too low (a 125.4 mm gap, wider than the 117.6 mm fuse). dx, dy move it; trailer: guide.js adds the fuses.
  // V13 (Draft rev20): sheet 3 now lines FU1's poles up with Q1's (47 mm from the plate edge for both) and prints
  // "Z = 113 mm per manual". FU1 keeps its V9-V12 place relative to Q1 (Q1 itself moved 30 mm right and 33 mm down). The
  // rev20 picture of FU1 sits 60.5 mm higher than that and 1.3 mm left: dx, dy are now measured from the rev20 rectangle.
  FU1: { model: 'FU1', rot: ['x90'], pins: FU1_PINS, landings: FU1_LAND, dx: 1.5, dy: 59.5, trailer: { under: 'Q1', z: 113.0, bodyBelowOrigin: 70.0, axisZ: 68, barrier: 23 } },
  Lug1: { model: 'LUG', rot: ['z90', 'y90'] },
  CB3: { model: 'FAZ3', rot: [] },
  CB5: { model: 'FAZ1', rot: [] },
  // cover: the solids that come off for wiring, hidden in the wiring steps and the Completed panel view (V5). A list of part
  // indices, or box: every solid lying inside [[x0,y0,z0],[x1,y1,z1]] (mm, the model after rot). The terminal blocks behind
  // them are not in the makers' models: they are built (blocks below) at the positions the manuals give.
  // PF525 frame D: the control module front cover (520-UM001 p.32) is the group of solids on the control module's lower
  // front (x -65..7, y -12..74, z 95..111 mm).
  // cut: parts of larger solids that also come off: the control module's bottom wall under the I/O block (the control wires
  // leave there) and the power terminal guard across the bottom of the power module's front.
  // V6 decalSplit (shop photo 2026-11-05): with the white lower front cover off, the drive is black below the keypad
  // module and down the right-hand column; that part of the sheet 3 image (the cover) shows only while covers are on
  // V7 xray (Bob): the front covers go back on in the wiring steps and the Completed panel, drawn as x-ray glass
  DRV1: { model: 'PF525D', rot: ['x90'], cover: PF525_COVER, decalCover: true, decalSplit: PF525_LOWER, xray: true },
  DRV2: { model: 'PF525D', rot: ['x90'], cover: PF525_COVER, decalCover: true, decalSplit: PF525_LOWER, xray: true },
  // V6 rtbFloor: the floor of the recess behind the door, 73.5 mm from the back, measured on the model with the door off
  // (the terminal block itself is not in Rockwell's model: it sits in the 7 mm slot at 80 % across, as in the shop photo)
  // V6 faces (tools/make_faces.py): PLC1, PWS2 and IO1 carry their fronts rectified from the shop photo; the door's part
  // of the image goes on the door (decalCover) and stays off the recess behind it
  // V8 rtbEntry 'b': the shop photos (2026-11-05, door closed and door open) show the +24 V wire coming up from under the
  // module to its screw, as on the OW16
  PWS2: { model: 'PB2', rot: [], cover: { parts: [2] }, rtbFloor: 73.5, decalCover: true, rtbEntry: 'b' },
  // V5: the OW16 is a 1.5-wide module, 118 x 87 x 52.5 mm (1769-IN062 p.14), and Rockwell files it under this wide case
  // (1769-IO_CASE_15; the single-wide modules get 1769-IO_CASE). V4 narrowed it to 35 mm in error: it is now at full size.
  // Part 1 is the door over the terminal block. V6: the face is the shop photo of the fitted OW16 (sheet 3's image is a
  // single-wide 1769-HSC face, which V5 left off).
  // V7 rtbEntry 'b': Bob: the OW16's wires always come in from the bottom
  // V8 rtbExit: the open wire channel left of the block, 27-64 % across the module (rays down Rockwell's model: clear from
  // 12.8 to 36.8 mm; right of that the housing has a floor under the block). The wires leave the module through it.
  IO1: { model: 'OW16', rot: ['x90', 'z-90'], cover: { parts: [1] }, decalCover: true, rtbEntry: 'b', rtbExit: [0.3, 0.62] },
  // V5: 1769-L36ERM (the L3 housing the L30ER shares), converted with cascadio (tools/step_cascadio.py): occt-import-js
  // meshes none of it. Drawn as the maker's axes give it, front +Z, LEDs at the top; the circuit board is left out.
  PLC1: { model: 'L3', rot: [] },
  ECR: { model: 'ECR', rot: [] },
  CPL1: { model: 'AL1920', rot: [] },
  CPL2: { model: 'AL1920', rot: [] },
  CPL3: { model: 'AL1920', rot: [] },
  CB4: { model: 'EPSITRON', rot: ['x90', 'z-90'] },
  // V10 (Bob: do the WAGO wires go in the terminal block on the front?): V4-V9 had WAGO's model lying on its back, its
  // top turned to the front, so the black input plug showed on the "front" and the blue output plug was behind, against
  // the plate. Turned up as fitted (shop photos 2026-11-05): the blue 5-way output plug X2 stands on top at the front
  // edge, the black 4-way input plug X1 hangs under the bottom at the front, the label face is the front.
  // pins: the plugs' poles in the model's own mm (blue X2: 40 mm wide, 5 poles; black X1: 36 mm wide, 4 poles), wires
  // down into X2 from above and up into X1 from below. dy lifts the body back onto its sheet 3 rectangle (the plugs
  // make the outline taller at the top than at the bottom).
  PWS1: { model: 'PRO2', rot: ['y-90', 'x90'], dy: -4, pins: {
    1: [-51, 79, 115, 't'], 2: [-43, 79, 115, 't'], 3: [-35, 79, 115, 't'], 4: [-27, 79, 115, 't'], 5: [-19, 79, 115, 't'],
    L1: [-48.5, -76, 108.5, 'b'], L2: [-39.5, -76, 108.5, 'b'], L3: [-30.5, -76, 108.5, 'b'], PE: [-21.5, -76, 108.5, 'b'] } },
  NS1: { model: 'FL1116', rot: [] },
  // PTFIX blocks clip onto PTFIX-NS35A rail adapters (BOM qty 5: 2 under PDB2, 3 under PDB3)
  PDB2: { model: 'PTFIX12', rot: [], adapter: { model: 'NS35A', n: 2 } },
  PDB3: { model: 'PTFIX18', rot: [], adapter: { model: 'NS35A', n: 3 } },
  // 1492-REC15: Rockwell's 1492-REC family model. It stands across the rail (the rail slot runs along its 74 mm side) with
  // its single 3-way terminal block at the top, as in the 1492-TD015 p.51 photo. Pins: the three clamps of that block
  // (model coordinates), screw on the front, wire in from the end. L/N/G order is not printed in any document held.
  RCP1: { model: 'REC15', rot: ['x90', 'z180'], pins: { L: [-27.0, 19.5, 57.5, 't'], N: [-18.2, 19.5, 57.5, 't'], G: [-9.4, 19.5, 57.5, 't'] } },
}
// terminal strips and rail hardware: one block, repeated
// (profile check, tools/model_viewer.html ?v=right: the marker groove faces the front, the rail-foot slits the back)
// entry (V5): where the wire goes in, read off the block's profile (mm): z = height of the wire entry valley above the
// subplate, top/bot = the valley floor above/below the block centre. The makers' blocks are plain profiles (no clamp
// drawn): the screw sits on the front chamfer and the wire enters the valley behind it, into the clamp under the screw.
export const STRIP_MODEL = { J4: { model: 'J4', rot: [], entry: { z: 24.3, top: 14.7, bot: -18.7 } }, J6: { model: 'J6', rot: ['x90', 'z90'], entry: { z: 26.6, top: 24.5, bot: -20.5 } } }
export const PART_MODEL = {
  anchor: { model: 'EAJ35', rot: ['x90', 'z90'] }, barrier: { model: 'EBJ3', rot: ['x90', 'z90'] },
  rail: { model: 'RAIL', rot: ['y90'] }, duct3: { model: 'DUCT3', rot: [] }, duct2: { model: 'DUCT2', rot: [] },
  ptfixAdapter: { model: 'NS35A', rot: [] },
  fuseJ: { model: 'LPJ', rot: [] }, fuseCC: { model: 'FNQ', rot: [] }, bracket: { model: 'ASB2', rot: ['y-90'] },
  hmi: { model: 'PVP7', rot: ['y180'] }, estop: { model: '800H', rot: ['x90'] }, ac: { model: 'AC', rot: ['y90'] }, sub2: { model: 'SUB2', rot: ['z90'] },
  // Saginaw's model is drawn top-down (Y down): turned over, its doors hinge left and the handles are on the right, as the
  // SCE-60XEL4918SSST sales drawing shows
  enclosure: { model: 'ENCL', rot: ['y-90', 'z180'] },
}
