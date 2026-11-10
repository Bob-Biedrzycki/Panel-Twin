#!/usr/bin/env node
// Writes data/wirelist.json: the record of what the schematic sheets of "10006 VFD-RT00-03.pdf" show.
// It is written as a script because sheets B02, B03 and B04 (the three drives) are the same drawing three times;
// what differs between them is listed per drive below, as printed. Nothing here is the guide's reading: device tags,
// terminal names, wire numbers and sizes are as printed, misprints included (each has a note). The readings are in build.mjs.
// "sheet" is the PDF page (5 = B01, 6 = B02, 7 = B03, 8 = B04, 9 = C01, 10 = D01, 11 = N01); "line" is the printed line number.
// Wire labels on the drawing read COLOUR_SIZE (BK_BN_14AWG = black with brown stripe, 14 AWG).
// Terminal strips: the drawings do not number the terminals; each terminal circle is labelled with the strip tag and the
// wire number it carries, so "term" on a strip is that wire number as printed.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const wires = [], cables = [], links = [], field_only = [], stubs = []
const W = (wire, color, awg, potential, from, to, sheet, line, note = '', extra = {}) => wires.push({ wire, awg, potential, color_if_shown: color, from: { dev: from[0], term: from[1] }, to: { dev: to[0], term: to[1] }, sheet, line, note, ...extra })

// ---------------------------------------------------------------- sheet B01 (page 5): 480 V AC
const FEED = 'Drawn from the supply symbol "480VAC @ 100 AMPS ±10%, 60 HZ, 3 PHASE (FLA: 77 AMPS)" with no wire number, no size and no entry point.'
W('', null, null, 'Incoming feeder L1', ['Plant feeder', 'L1'], ['DISCB0101', 'L1'], 5, 'B0100', FEED)
W('', null, null, 'Incoming feeder L2', ['Plant feeder', 'L2'], ['DISCB0101', 'L2'], 5, 'B0100', FEED)
W('', null, null, 'Incoming feeder L3', ['Plant feeder', 'L3'], ['DISCB0101', 'L3'], 5, 'B0100', FEED)
W('', null, null, 'GND', ['Plant feeder', 'ground conductor'], ['GND BAR', 'middle screw'], 5, 'B0101', `${FEED} Drawn to a junction dot, and from the dot to the middle (third of five) screw of the bar tagged GNDB0100 (D167-14); the screws are not numbered. From the same dot a line runs down to the earth symbol tagged GNDB0103.`)
const PH = [['L1', 'BK_BN', 'B01021'], ['L2', 'BK_OG', 'B01022'], ['L3', 'BK_YE', 'B01023']]
for (const [ph, col, num] of PH) W(num, col, '1', num, ['DISCB0101', `${ph} fuse load`], ['TBB0106', `${ph} line`], 5, 'B0103', `Printed ${col}_1AWG. From the load side of the DISCB0101 fuses (drawn as one device with the switch, "90A").`)
// branch circuits: [breaker, line, sizes printed on the line side L1 L2 L3, numbers and sizes printed on the load side]
const BR = [
  ['CBB0108', ['B0108', 'B0109', 'B0110'], ['1', '1', '14'], ['B01081', 'B01091', 'B01101'], ['1', '1', '14'], 'DRVB0200'],
  ['CBB0112', ['B0112', 'B0113', 'B0114'], ['1', '1', '14'], ['B01121', 'B01131', 'B01141'], ['1', '1', '14'], 'DRVB0300'],
  ['CBB0116', ['B0116', 'B0117', 'B0118'], ['14', '14', '14'], ['B01161', 'B01171', 'B01181'], ['14', '14', '14'], 'DRVB0400'],
]
for (const [cb, lines, inA, nums, outA, drv] of BR) PH.forEach(([ph, col, pot], i) => {
  W('', col, inA[i], pot, ['TBB0106', `${ph} load`], [cb, ph], 5, lines[i], `Printed ${col}_${inA[i]}AWG. No wire number of its own: it is on potential ${pot}.${inA[i] === '1' ? ' "1AWG" on a 20 A branch beside "14AWG" on the next phase.' : ''}`)
  const sh = { DRVB0200: 'B02', DRVB0300: 'B03', DRVB0400: 'B04' }[drv]
  W(nums[i], col, outA[i], nums[i], [cb, `T${i + 1}`], [drv, ph], 5, lines[i], `Printed ${col}_${outA[i]}AWG on sheet B01 and ${col}_14AWG on sheet ${sh}.`)
})
const FU32 = [['L1', 'BK_BN', '1', 'B0132', 'B01321', 'BK_BN', 'B01021'], ['L2', 'BK', '12', 'B0133', 'B01332', 'BK_OG', 'B01022'], ['L3', 'BK_YE', '1', 'B0134', 'B01342', 'BK_YE', 'B01023']]
FU32.forEach(([ph, col, awg, line, num, col2, pot], i) => {
  W('', col, awg, pot, ['TBB0106', `${ph} load`], ['FUB0132', `pole ${i + 1} line`], 5, line, `Printed ${col}_${awg}AWG. FUB0132 (2A) on the schematic is FUB0125 on layout sheets Z02 and Z04.`)
  W(num, col2, '14', num, ['FUB0132', `pole ${i + 1} load`], ['PWSB0132', ph], 5, line, `Printed ${col2}_14AWG.${i === 2 ? ' The number B01342 is printed between the L3 and GND terminals with a leader to this wire.' : ''} PWSB0132 on the schematic is PWSB0125 on the layout sheets.`)
})
W('', 'GN', '16', 'GND', ['PWSB0132', 'GND'], ['GND BAR', ''], 5, 'B0135', 'Printed GN_16AWG, to an earth symbol.')
W('', 'BU', '14', '+24 V DC', ['PWSB0132', '+'], ['CBB0133', 'line'], 5, 'B0133', 'Printed BU_14AWG. No wire number. The breaker terminals are not named on the drawing.')
W('B01331', 'BU', '14', 'B01331', ['CBB0133', 'load'], ['TB24-1', 'B01331'], 5, 'B0133', 'Printed BU_14AWG. Continues on sheet D01 (line D0100), where two TB24-1 terminals carry B01331 and nothing is connected beyond them.')
W('B01341', 'BUWH', '14', 'B01341', ['PWSB0132', '-'], ['TB1', 'B01341'], 5, 'B0134', 'Printed BUWH_14AWG.')
W('', 'GN', '16', 'GND', ['PWSB0132', '-'], ['GND BAR', ''], 5, 'B0134', 'Printed GN_16AWG: the 24 V DC common is bonded to ground at the supply.')
W('B01341', 'BUWH', '14', 'B01341', ['TB1', 'B01341'], ['TB24-1', 'B01341'], 10, 'D0101', 'Sheet B01 "to D0100"; sheet D01 "from B0134" above line D0100, printed BUWH_14AWG, to one TB24-1 terminal drawn between lines D0101 and D0102, with nothing connected beyond it.')
for (const [ph, col, pot, line, hx] of [['L2', 'BK_OG', 'B01022', 'B0137', 'H1'], ['L3', 'BK_YE', 'B01023', 'B0139', 'H4']]) {
  W('', col, '14', pot, ['TBB0106', `${ph} load`], ['FUB0137', `${hx} fuse line`], 5, line, `Printed ${col}_14AWG. Both primary fuses carry the one tag FUB0137 (2A).`)
  W('', col, '14', '', ['FUB0137', `${hx} fuse load`], ['TB0140', hx], 5, line, `Printed ${col}_14AWG. No wire number.`)
}
W('', null, null, '', ['TB0140', 'H2'], ['TB0140', 'H3'], 5, 'B0140', 'Drawn as a crossed link between H2 and H3 (the 480 V connection). No number, no size.')
W('B01372', 'RD', '8', 'B01372', ['TB0140', 'X1'], ['FUB0142', 'line'], 5, 'B0142', 'Printed RD_8AWG; B01372 is printed under X1.')
W('B01421', 'RD', '8', 'B01421', ['FUB0142', 'load'], ['TB120-1', 'B01421'], 5, 'B0142', 'Printed RD_8AWG on sheet B01; on sheet C01 the same potential continues as RD_14AWG.')
W('B01411', 'WH', '8', 'B01411', ['TB0140', 'X2'], ['TB120-1', 'B01411'], 5, 'B0144', 'Printed WH_8AWG.')
W('', 'GN', '12', 'GND', ['TB0140', 'X2'], ['GND BAR', ''], 5, 'B0141', 'Printed GN_12AWG beside the number B01411: the 120 V neutral is bonded to ground at X2.')
for (const [ph, col, pot, line, num, i] of [['L2', 'BK_OG', 'B01022', 'B0145', 'B01451', 1], ['L3', 'BK_YE', 'B01023', 'B0146', 'B01461', 2]]) {
  W('', col, '14', pot, ['TBB0106', `${ph} load`], ['FUB0145', `pole ${i} line`], 5, line, `Printed ${col}_14AWG.`)
  W(num, col, '14', num, ['FUB0145', `pole ${i} load`], ['ACB0145', `line ${i}`], 5, line, `Printed ${col}_14AWG. ACB0145 (2000BTU) is drawn with a three-phase symbol and two supply conductors; its terminals are not named.`)
}
W('', 'GN', '14', 'GND', ['ACB0145', 'GND'], ['GND BAR', ''], 5, 'B0148', 'Printed GN_14AWG, to an earth symbol (drawn between lines B0147 and B0148).')

// ---------------------------------------------------------------- sheets B02, B03, B04 (pages 6, 7, 8): the drives
const DRV = [
  { sheet: 6, sh: 'B02', drv: 'DRVB0200', rly: 'CRC0102', n: 'B02', disc: 'DISCB0200', mtr: 'MTRB0200', gLine: '12', gMtr: '14', comLine: 'B0135', contact: 'not numbered on this sheet' },
  { sheet: 7, sh: 'B03', drv: 'DRVB0300', rly: 'CRC0105', n: 'B03', disc: 'DISCB0300', mtr: 'MTRB0300', gLine: '12', gMtr: '14', comLine: 'B0136', contact: 'not numbered on this sheet' },
  { sheet: 8, sh: 'B04', drv: 'DRVB0400', rly: 'CRC0108', n: 'B04', disc: 'DISCB0400', mtr: 'MTRB0400', gLine: '16', gMtr: '16', comLine: 'B0137', contact: 'printed 11 (TB1 side) and 14' },
]
for (const d of DRV) {
  const L = (k) => `${d.sh}${k}`
  W('', 'GN', d.gLine, 'GND', [d.drv, 'GND (left, line side)'], ['GND BAR', ''], d.sheet, L('03'), `Printed GN_${d.gLine}AWG, to an earth symbol.`)
  ;[['U', '001', '00'], ['V', '011', '01'], ['W', '021', '02']].forEach(([t, k, ln]) => W(`${d.n}${k}`, null, null, `${d.n}${k}`, [d.drv, t], [d.disc, 'line'], d.sheet, L(ln), `Dashed (field wiring) to the auxiliary disconnect ${d.disc}. No size on this segment; the motor side of the disconnect is printed 14AWG. "Use minimum 1/2 inch rigid metal conduit for motor field wiring."`))
  W('', 'GN', d.gMtr, 'GND', [d.drv, 'GND (right, motor side)'], [d.mtr, 'ground'], d.sheet, L('03'), `Dashed (field wiring), printed GN_${d.gMtr}AWG, straight to the motor.`)
  W(`${d.n}061`, 'BU', '16', `${d.n}061`, [d.drv, '1'], ['TB1', `${d.n}061`], d.sheet, L('06'), 'Printed BU_16AWG. Terminal 1 (Stop). The sheet notes: remove the factory jumper between I/O terminals 01 and 11.')
  W(`${d.n}061`, 'BU', '16', `${d.n}061`, [d.drv, '11'], ['TB1', `${d.n}061`], d.sheet, L('14'), 'Printed BU_16AWG. Terminal 11 (+24 VDC).')
  W(`${d.n}061`, 'BU', '16', `${d.n}061`, ['TB1', `${d.n}061`], [d.rly, '14'], d.sheet, L('14'), `Printed BU_16AWG. Relay contact terminals: ${d.contact}.`, d.sheet === 8 ? {} : { inferred: true })
  W(`${d.n}101`, 'BU', '16', `${d.n}101`, [d.rly, '11'], ['TB1', `${d.n}101`], d.sheet, L('10'), `Printed BU_16AWG. Relay contact terminals: ${d.contact}.`, d.sheet === 8 ? {} : { inferred: true })
  W(`${d.n}101`, 'BU', '16', `${d.n}101`, ['TB1', `${d.n}101`], [d.drv, '5'], d.sheet, L('10'), 'Printed BU_16AWG. Terminal 5 (Digital Input 1).')
  W('B01341', 'BUWH', '16', 'B01341', ['TB1', 'B01341'], [d.drv, '4'], d.sheet, L('09'), `Printed BUWH_16AWG, "from ${d.comLine}". Terminal 4 (Digital Common). No TB1 terminal is drawn on this sheet; sheet B01 draws four TB1 terminals on B01341.`)
  for (const t of ['S1', 'S2']) stubs.push({ dev: d.drv, term: t, sheet: d.sheet, line: `${d.sh}${t === 'S1' ? '09' : '10'}`, note: `A short orange line leaves ${t} (Safety ${t[1]}) on the left of the drive and ends in open space: no wire number, no size, no destination. Nothing is drawn at S+. The sheet notes "* Remove safe-off jumper".` })
  links.push({ strip: 'TB1', potential: `${d.n}061`, between: 'the terminal on the drive terminal 1 line and the terminal on the terminal 11 line', printed: 'BU_16AWG', sheet: d.sheet, note: 'A vertical line between two TB1 terminal circles of the same potential, with a wire size printed on it.' })
  links.push({ strip: 'TB1', potential: `${d.n}061`, between: 'the two terminals on the terminal 11 line', printed: null, sheet: d.sheet, note: 'A line between two TB1 terminal circles, nothing printed on it.' })
  ;[['001', '002', 'BK_BN'], ['011', '012', 'BK_OG'], ['021', '022', 'BK_YE']].forEach(([a, b, col]) => field_only.push({ wire: `${d.n}${b}`, awg: '14', color: col, from: `${d.disc} load`, to: `${d.mtr}`, sheet: d.sheet, note: `Field wiring from the auxiliary disconnect to the motor (continues ${d.n}${a}). Not in this panel.` }))
  cables.push({ cable: `CBLN01${d.sheet === 6 ? '02' : d.sheet === 7 ? '04' : '06'}`, type: 'Ethernet patch cord 1585J-M8HBJM-3 (Cat5e, RJ45 to RJ45, 3 m)', from: { dev: d.drv, term: 'ETHERNET' }, to: { dev: `N01 jack ${d.sheet - 5}`, term: 'front' }, cores: [], sheet: d.sheet, note: `Sheet ${d.sh} "from N01${d.sheet === 6 ? '02' : d.sheet === 7 ? '04' : '06'}"; sheet N01 draws it from one of three Panduit DIN-rail jack modules (no tags) to the drive. The potential is printed CBLN01${d.sheet === 6 ? '02' : d.sheet === 7 ? '04' : '06'}1.` })
}
for (let k = 1; k <= 3; k++) cables.push({ cable: '', type: 'Ethernet field cable (not specified)', from: { dev: `N01 jack ${k}`, term: 'field' }, to: { dev: 'IDF-04', term: 'port (not given)' }, cores: [], sheet: 11, note: 'Sheet N01 draws a solid line (the legend\'s panel wiring) from the bottom of each jack module to the switch "AUTOMATION NETWORK IDF-04 (NEW)", new cream tank room, model TBD. No cable number or type.' })

// ---------------------------------------------------------------- sheet C01 (page 9): 120 V AC
W('B01421', 'RD', '14', 'B01421', ['TB120-1', 'B01421'], ['CBC0102', 'line'], 9, 'C0102', 'Printed RD_14AWG. Two TB120-1 terminals carry B01421 (lines C0101 and C0102), joined by the bus line.')
W('C01021', 'RD', '14', 'C01021', ['CBC0102', 'load'], ['TB120-1', 'C01022'], 9, 'C0102', 'Printed RD_14AWG; the wire is numbered C01021 and the TB120-1 terminal it reaches is labelled C01022.')
const RUNG = [['CRAUX1', 'C01022', 'C01051', 'CRC0102', 'C0102'], ['CRAUX2', 'C01021', 'C01081', 'CRC0105', 'C0105'], ['CRAUX3', 'C01021', 'C01021', 'CRC0108', 'C0108']]
for (const [aux, tOut, tRet, rly, line] of RUNG) {
  W('', 'RD', '14', tOut, ['TB120-1', tOut], [aux, 'contact'], 9, line, `Dashed (field wiring), printed RD_14AWG, from the TB120-1 terminal labelled ${tOut} to the pump's auxiliary disconnect contact ${aux}.`)
  W('', 'RD', '14', tRet, [aux, 'contact'], ['TB120-1', `${tRet} (return)`], 9, line, `Dashed (field wiring), printed RD_14AWG, back to the TB120-1 terminal labelled ${tRet}.${tRet === 'C01021' ? ' That is the label of the supply side too: as printed, this return is on the supply potential.' : ''}`)
  W('', null, null, tRet, ['TB120-1', `${tRet} (return)`], [rly, 'A1'], 9, line, 'No size or colour printed on this segment.')
  W('B01411', 'WH', '14', 'B01411', [rly, 'A2'], ['TB120-1', 'B01411'], 9, line, 'Printed WH_14AWG.')
}
links.push({ strip: 'TB120-1', potential: 'B01421', between: 'the terminals at lines C0101 and C0102', printed: null, sheet: 9, note: 'Bus line between two terminal circles.' })
links.push({ strip: 'TB120-1', potential: 'C01021', between: 'the terminals labelled C01022 (C0102), C01021 (C0105) and C01021 (C0108)', printed: null, sheet: 9, note: 'One vertical bus line joins the three supply-side terminals.' })
links.push({ strip: 'TB120-1', potential: 'B01411', between: 'the three terminals at lines C0102, C0105 and C0108', printed: null, sheet: 9, note: 'The neutral bus line.' })
links.push({ strip: 'TB24-1', potential: 'B01331', between: 'the terminals at lines D0100 and D0101', printed: 'BU_14AWG below them', sheet: 10, note: 'Two terminal circles on the +24 V bus line.' })
links.push({ strip: 'TB1', potential: 'B01341', between: 'the four terminals at lines B0134 to B0137', printed: null, sheet: 5, note: 'One vertical bus line joins four TB1 terminal circles.' })

// ---------------------------------------------------------------- terminal strips as drawn on layout sheets Z04 and Z05 (left to right)
const strip = (tag, groups) => { const out = []; let n = 1; for (const [label, count, jumper, pn] of groups) for (let i = 0; i < count; i++) out.push({ strip: tag, position: n++, label, jumper_drawn: !!jumper, pn: pn ?? '1492-J4' }); return out }
const terminals = [
  ...strip('TB120-1', [['B01421', 4, 0], ['C01021', 3, 1], ['C01022', 1, 0], ['C01051', 1, 0], ['C01081', 1, 0], ['B01411', 3, 1], ['GND', 4, 0, '1492-JG4']]),
  ...strip('TB1', [['B02061', 3, 1], ['B02101', 1, 0], ['B03061', 3, 1], ['B03101', 1, 0], ['B04061', 3, 1], ['B04101', 1, 0], ['B01341', 7, 1], ['GND', 4, 0, '1492-JG4']]),
  ...strip('TB24-1', [['B01331', 2, 1], ['B01341', 1, 0]]),
]
const out = {
  source: '10006 VFD-RT00-03.pdf (Sharpe Engineering & Equipment, Westby Creamery, 10006 Intake Receiving VFD, initial release 06/24/26): schematic sheets B01-B04, C01, D01, N01 (PDF pages 5-11); terminal strips from layout sheets Z04 and Z05 (pages 15-16)',
  wires, cables, links, field_only, stubs, terminals,
  devices: 'see src/layout.mjs (DEVICES): tags as printed on the layout sheets; the schematic tags FUB0132 and PWSB0132 are FUB0125 and PWSB0125 there',
  unreadable: [],
}
writeFileSync(join(here, '..', 'data', 'wirelist.json'), JSON.stringify(out, null, 1))
console.log(`wirelist.json: ${wires.length} wires, ${cables.length} cables, ${links.length} drawn links, ${field_only.length} field-only conductors, ${stubs.length} open stubs, ${terminals.length} terminals`)
