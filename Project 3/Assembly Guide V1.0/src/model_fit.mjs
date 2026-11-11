// Which maker's 3D model (assets/models) stands in for each device, and how it is turned into panel axes:
// X to the right, Y up, Z out of the panel towards the viewer. rot: rotations about the world axes, in order, in degrees.
// scale: [x, y, z] applied after the rotation, where a model of a neighbouring size stands in (said on the part).
// pins / landings: terminal positions in the model's own mm (after rot, before scale).
//
// V1.0 of this panel has NO maker models of its own. Every model here came with the worked example (the VFD 200 guide):
// the same part where the part is the same (TBB0106's block is built from its catalogue shape, the ground lug, the
// 1492-J4 block, end anchor, end barrier, DIN rail), and a neighbouring size where it is not:
//   - the PowerFlex 525 frame D model, scaled to the frame C envelope (109 x 220 x 184 mm, 520-TD001 p.15)
//   - the 1494U-D100 switch and 1494U-F100 fuse block for the 60 A parts (sheet Z02 itself draws the 100 A symbol)
//   - the Panduit F2X2 duct stretched to 3 in tall for G2X3
//   - the Saginaw 60 x 49 x 18 in enclosure pressed to 12 in deep, and its 1000 BTU/h air conditioner
// Each is listed under Modeling issues. Devices not named here are built from their catalogue shape (PROC in guide.js).
const S525 = [109 / 130, 220 / 260, 184 / 212]
const PF525_LOWER = [[[-70, -130], [70, -12]], [[8, -12], [70, 70]]]
const PF525_COVER = { box: [[-66, -13, 94.5], [8, 74.5, 200]], cut: [{ box: [[-64, -14, 93], [6.5, -6, 113]] }, { box: [[-66, -121, 56], [66, -77, 97]] }] }
// lug screw centres on Rockwell's 1494U-D100 / F100 models (model mm after rot)
const Q1_PINS = { L1: [-46, 66.4, 11.4, 't'], L2: [0, 66.4, 11.4, 't'], L3: [46, 66.4, 11.4, 't'], T1: [-46, -46.9, 30.9, 'b'], T2: [0, -46.9, 30.9, 'b'], T3: [46, -46.9, 30.9, 'b'] }
const FU1_PINS = { L1: [-46.1, 12.4, 75.2, 't'], L2: [0, 12.4, 75.2, 't'], L3: [46.1, 12.4, 75.2, 't'], T1: [-46.1, -11.7, 40.3, 'b'], T2: [0, -11.7, 40.3, 'b'], T3: [46.1, -11.7, 40.3, 'b'] }
// the load box lugs of the fuse block, measured on the model by rays from below (worked example, V7)
const FU1_LAND = Object.fromEntries([['T1', -46.0], ['T2', 0.2], ['T3', 46.2]].map(([n, x]) => [n, { tip: [x, -28, 43.7], mouth: [x, -41.6, 43.7], e: 'b' }]))
const DRV = { model: 'PF525D', rot: ['x90'], scale: S525, cover: PF525_COVER, decalCover: true, decalSplit: PF525_LOWER, xray: true }
export const MODEL_FIT = {
  DISCB0101: { model: 'Q1', rot: ['x90'], pins: Q1_PINS },
  // the fuse block hangs under the switch and the fuses bridge the gap (trailer: guide.js draws the fuses and barriers)
  'DISCB0101-F': { model: 'FU1', rot: ['x90'], pins: FU1_PINS, landings: FU1_LAND, trailer: { under: 'DISCB0101', bodyBelowOrigin: 70.0, axisZ: 68 } },
  GNDB0101: { model: 'LUG', rot: ['z90', 'y90'] },
  DRVB0200: DRV, DRVB0300: DRV, DRVB0400: DRV,
}
// terminal strips and rail hardware: one block, repeated. entry: where the wire goes in, read off the block's profile (mm)
export const STRIP_MODEL = { J4: { model: 'J4', rot: [], entry: { z: 24.3, top: 14.7, bot: -18.7 } } }
export const PART_MODEL = {
  anchor: { model: 'EAJ35', rot: ['x90', 'z90'] }, barrier: { model: 'EBJ3', rot: ['x90', 'z90'] },
  rail: { model: 'RAIL', rot: ['y90'] },
  // G2X3WH6 (2 in wide, 3 in tall): Panduit's F2X2WH6 model, 50.5 mm tall, stretched to 79 mm
  duct2: { model: 'DUCT2', rot: [], scale: [1, 1, 79 / 50.535] },
  fuseCC: { model: 'FNQ', rot: [] },
  ac: { model: 'AC', rot: ['y90'] },
  // SCE-60XEL4912SSST (12 in deep): Saginaw's 18 in deep model of the same enclosure, pressed to 12 in
  enclosure: { model: 'ENCL', rot: ['y-90', 'z180'], scale: [1, 1, 12 / 18] },
}
