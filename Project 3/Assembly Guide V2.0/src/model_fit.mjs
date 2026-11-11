// Which maker's 3D model (assets/models) stands in for each device, and how it is turned into panel axes:
// X to the right, Y up, Z out of the panel towards the viewer. rot: rotations about the world axes, in order, in degrees.
// pins / landings: terminal positions in the model's own mm (after rot), measured on the model (tools/model_parts.mjs).
//
// V2.0: Rockwell's own models for the drive (frame C), the 60 A switch and its fuse block, the 140MT-D breaker, the
// 1606-XLE240E-3 and the 1489-M breaker, and Panduit's G2X3WH6 duct, fetched 2026-11-10 (../Vendor Step Files/register.csv).
// Carried over from the VFD 200 guide: the 1492-J4 block, end anchor, end barrier, DIN rail, ground lug, and two stand-ins:
// the Saginaw 18 in deep enclosure pressed to 12 in, and its 1000 BTU/h air conditioner.

// PowerFlex 525 frame C (ng2-c-stp). The control module is the same part as on frame D, 10.5 mm to the right and 40 mm
// lower (control module solid: x -65..7, y -12..140 on D; x -54.5..17.5, y -52..100 on C), so the blocks, cover box and
// cuts measured on frame D for the VFD 200 guide are used shifted by that much. The power block keeps frame D's
// arrangement at the bottom of the drive: frame C's own terminal pitch is not measured (Modeling issues).
const CTL = [10.5, -40, 0]
const PF525_COVER = { box: [[-55.5, -53, 94], [18.5, 34.6, 200]], cut: [{ box: [[-53.5, -54, 93], [17, -46, 113]] }, { box: [[-56, -121, 56], [56, -77, 97]] }] }
const PF525_LOWER = [[[-60, -130], [60, -52]], [[18.5, -52], [60, 30]]]
const DRV = { model: 'PF525C', rot: ['x90'], ctlShift: CTL, cover: PF525_COVER, decalCover: true, decalSplit: PF525_LOWER, xray: true }
// 1494U-D60 (10001235006_asm): line lugs (solid 10000229898) x -46 / 0 / 46, y 58.4..87.8, z -11.3..3.1, wire in from above.
// The load side carries the fuse clips (B-36272), not lugs.
const Q_PINS = { L1: [-46, 73, -4, 't'], L2: [0, 73, -4, 't'], L3: [46, 73, -4, 't'] }
// 1494U-F60 (10001236416_asm): fuse clips at the top (y 1..25), load lugs at the bottom (solid 10000229898: y -33.1..-3.7,
// z 26.7..41.1), wire in from below.
const F_PINS = { L1: [-46, 12.4, 30, 't'], L2: [0, 12.4, 30, 't'], L3: [46, 12.4, 30, 't'], T1: [-46, -18, 33.9, 'b'], T2: [0, -18, 33.9, 'b'], T3: [46, -18, 33.9, 'b'] }
const F_LAND = Object.fromEntries([['T1', -46], ['T2', 0], ['T3', 46]].map(([n, x]) => [n, { tip: [x, -20, 33.9], mouth: [x, -33.4, 33.9], e: 'b' }]))
// 140MT-D9E: terminal screws (solids 58-63) at x -14.4 / 0 / 14.4, y +36.3 (line) and -36.3 (load), z 45.5..50.2
const MT_PINS = { L1: [-14.4, 36.3, 48, 't'], L2: [0, 36.3, 48, 't'], L3: [14.4, 36.3, 48, 't'], T1: [-14.4, -36.3, 48, 'b'], T2: [0, -36.3, 48, 'b'], T3: [14.4, -36.3, 48, 'b'] }
const MT = { model: 'MTD', rot: ['x90'], pins: MT_PINS }
// 1606-XLE240E-3: the blue label is the front (maker -Z), the potentiometer end is the top. Output blocks at the top
// (poles at x -3.5, 6.0, 15.6, 25.1: + + - -), input blocks at the bottom (x -9.5, 0, 9.5, 19: L1 L2 L3 PE); these agree
// with 1606-RM002 p.13 / p.21 and with the symbol on sheet Z04 to within a millimetre.
const XLE_PINS = { '+1': [-3.5, 55, 92, 't'], '+2': [6.0, 55, 92, 't'], '-1': [15.6, 55, 92, 't'], '-2': [25.1, 55, 92, 't'], L1: [-9.5, -57, 92, 'b'], L2: [0, -57, 92, 'b'], L3: [9.5, -57, 92, 'b'], PE: [19, -57, 92, 'b'] }
// 1489-M one pole: the DIN clip latch is at the bottom; a clamp at each end, mid depth
const CB1 = { model: 'M1489', rot: ['x90', 'z90'], pins: { 1: [0, 47, -25, 't'], 2: [0, -47, -25, 'b'] } }
export const MODEL_FIT = {
  // bodyBottom: the moulding ends at y -65.2; only the operating spring and rod (x > 85) hang below it, to y -138
  DISCB0101: { model: 'Q60', rot: ['x90'], pins: Q_PINS, bodyBottom: -65.2 },
  // the fuse block hangs under the switch; the fuses bridge the gap (trailer: guide.js draws them). bodyBelowOrigin puts
  // the fuse midway between the switch's clips and the block's. No phase barriers for 60 A class J (1494U-IN001 p.10).
  'DISCB0101-F': { model: 'FU60', rot: ['x90'], pins: F_PINS, landings: F_LAND, trailer: { under: 'DISCB0101', bodyBelowOrigin: 48.5, axisZ: 46, noBarrier: true } },
  GNDB0101: { model: 'LUG', rot: ['z90', 'y90'] },
  DRVB0200: DRV, DRVB0300: DRV, DRVB0400: DRV,
  CBB0108: MT, CBB0112: MT, CBB0116: MT,
  PWSB0125: { model: 'XLE', rot: ['y180'], pins: XLE_PINS },
  CBC0102: CB1, CBB0133: CB1,
}
export const STRIP_MODEL = { J4: { model: 'J4', rot: [], entry: { z: 24.3, top: 14.7, bot: -18.7 } } }
export const PART_MODEL = {
  anchor: { model: 'EAJ35', rot: ['x90', 'z90'] }, barrier: { model: 'EBJ3', rot: ['x90', 'z90'] },
  rail: { model: 'RAIL', rot: ['y90'] },
  duct2: { model: 'DUCT23', rot: [], nat: 'y' },
  fuseCC: { model: 'FNQ', rot: [] },
  ac: { model: 'AC', rot: ['y90'] },
  // SCE-60XEL4912SSST (12 in deep): Saginaw's 18 in deep model of the same enclosure, pressed to 12 in
  enclosure: { model: 'ENCL', rot: ['y-90', 'z180'], scale: [1, 1, 12 / 18] },
}
