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
export const MODEL_FIT = {
  Q1: { model: 'Q1', rot: ['x90'] },
  FU1: { model: 'FU1', rot: ['x90'] },
  Lug1: { model: 'LUG', rot: ['z90', 'y90'] },
  CB3: { model: 'FAZ3', rot: [] },
  CB5: { model: 'FAZ1', rot: [] },
  DRV1: { model: 'PF525D', rot: ['x90'] },
  DRV2: { model: 'PF525D', rot: ['x90'] },
  PWS2: { model: 'PB2', rot: [] },
  // Rockwell offers its 1769 I/O case model on the OW16 page, but that case is 56.5 mm wide; the OW16 is 35 mm
  // (1769-IN062, PartsLib). The case is narrowed to 35 mm across the rail; height, depth, door and vents are the model's.
  IO1: { model: 'OW16', rot: ['x90', 'z-90'], scale: [35 / 56.5, 1, 1] },
  ECR: { model: 'ECR', rot: [] },
  CPL1: { model: 'AL1920', rot: [] },
  CPL2: { model: 'AL1920', rot: [] },
  CPL3: { model: 'AL1920', rot: [] },
  CB4: { model: 'EPSITRON', rot: ['x90', 'z-90'] },
  PWS1: { model: 'PRO2', rot: ['y-90'] },
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
export const STRIP_MODEL = { J4: { model: 'J4', rot: [] }, J6: { model: 'J6', rot: ['x90', 'z90'] } }
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
