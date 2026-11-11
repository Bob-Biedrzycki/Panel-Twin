#!/usr/bin/env node
// Builds "VFD-RT00-03 Assembly Guide.html": one page that opens from disk (three.js from jsDelivr, fonts from Google
// Fonts, everything else inlined).
//   src/layout.mjs        the panel as drawn, the BOM and the build steps
//   src/guide.js          the 3D scene and the guide panel
//   data/wirelist.json    every wire and cable on sheets B01-B04, C01, D01, N01, as printed (tools/make_wirelist.mjs)
//   assets/tex/*.webp     device faces cut from sheet Z02 (tools/extract_textures.py)
//   vendor/lab-kit.js     the studio renderer (Machine Skill kit)
// This file is where the guide's READINGS of the drawings are applied, each with its reason. The wire list stays the
// record of what is printed. Run: node build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const rd = (p) => readFileSync(join(here, p), 'utf8')
const L = await import(pathToFileURL(join(here, 'src', 'layout.mjs')).href)
const PL_URL = 'https://partslib-atvgmpjvfa-uc.a.run.app'

// ---------------------------------------------------------------- textures as data URLs
const index = JSON.parse(rd('assets/tex/index.json'))
const TEX = {}
for (const [k, v] of Object.entries(index)) TEX[k] = { ...v, url: `data:image/webp;base64,${readFileSync(join(here, 'assets', 'tex', v.file)).toString('base64')}` }

// ---------------------------------------------------------------- wires and cables -> physical segments
const WL = JSON.parse(rd('data/wirelist.json'))
const SEGMENTS = []
const SH = L.JOB.sheetNames

// READING 1: tags. The schematic (B01) calls the 24 V supply and its fuse holder PWSB0132 and FUB0132; the layout sheets
// (Z02, Z04) tag the same parts PWSB0125 and FUB0125. The tag on the part is the layout's, so the guide uses that.
// The three DIN-rail Ethernet jacks have no tag: named JKN0102/04/06 after their cables, left to right (this guide's choice).
const ALIAS = { FUB0132: 'FUB0125', PWSB0132: 'PWSB0125', 'N01 jack 1': 'JKN0102', 'N01 jack 2': 'JKN0104', 'N01 jack 3': 'JKN0106' }

// READING 2: terminal strips. The drawings mark each terminal with the wire number it carries and do not number them.
// The guide numbers each strip from the left as sheets Z04 and Z05 draw it, and puts each conductor on one block and one
// side: panel wiring on the upper screw, field wiring (and the second panel conductor where a block has two) on the
// lower. Key: strip | printed terminal label | device at the other end | its terminal. Value: block number, ':field' = lower screw.
const TB_PLAN = {
  // TB120-1 (rail B): 1-4 B01421, 5-7 C01021 (jumpered), 8 C01022, 9 C01051, 10 C01081, 11-13 B01411 (jumpered), 14-17 GND
  'TB120-1|B01421|FUB0142|load': '1', 'TB120-1|B01421|CBC0102|line': '1:field',
  'TB120-1|C01022|CBC0102|load': '5',
  'TB120-1|C01022|CRAUX1|contact': '5:field', 'TB120-1|C01021|CRAUX2|contact': '6:field', 'TB120-1|C01021|CRAUX3|contact': '7:field',
  'TB120-1|C01051 (return)|CRAUX1|contact': '8:field', 'TB120-1|C01081 (return)|CRAUX2|contact': '9:field', 'TB120-1|C01021 (return)|CRAUX3|contact': '10:field',
  'TB120-1|C01051 (return)|CRC0102|A1': '8', 'TB120-1|C01081 (return)|CRC0105|A1': '9', 'TB120-1|C01021 (return)|CRC0108|A1': '10',
  'TB120-1|B01411|TB0140|X2': '11', 'TB120-1|B01411|CRC0102|A2': '11:field', 'TB120-1|B01411|CRC0105|A2': '12', 'TB120-1|B01411|CRC0108|A2': '13',
  // TB1 (rail C): 1-3 B02061, 4 B02101, 5-7 B03061, 8 B03101, 9-11 B04061, 12 B04101, 13-19 B01341, 20-23 GND
  'TB1|B02061|DRVB0200|1': '1', 'TB1|B02061|DRVB0200|11': '2', 'TB1|B02061|CRC0102|14': '3:field', 'TB1|B02101|CRC0102|11': '4:field', 'TB1|B02101|DRVB0200|5': '4',
  'TB1|B03061|DRVB0300|1': '5', 'TB1|B03061|DRVB0300|11': '6', 'TB1|B03061|CRC0105|14': '7:field', 'TB1|B03101|CRC0105|11': '8:field', 'TB1|B03101|DRVB0300|5': '8',
  'TB1|B04061|DRVB0400|1': '9', 'TB1|B04061|DRVB0400|11': '10', 'TB1|B04061|CRC0108|14': '11:field', 'TB1|B04101|CRC0108|11': '12:field', 'TB1|B04101|DRVB0400|5': '12',
  'TB1|B01341|PWSB0132|-': '13', 'TB1|B01341|DRVB0200|4': '14', 'TB1|B01341|DRVB0300|4': '15', 'TB1|B01341|DRVB0400|4': '16', 'TB1|B01341|TB24-1|B01341': '17:field',
  // TB24-1: 1-2 B01331 (jumpered), 3 B01341
  'TB24-1|B01331|CBB0133|load': '1', 'TB24-1|B01341|TB1|B01341': '3:field',
}
// READING 3: terminal names. Where the drawing names no terminal, or names it by function, the guide lands it on the
// terminal the maker's document (or, failing that, the device symbol) gives.
const PF = { '1': '01', '4': '04', '5': '05', '11': '11', U: 'T1', V: 'T2', W: 'T3', 'GND (left, line side)': 'PE2', 'GND (right, motor side)': 'PE', ETHERNET: 'RJ45', L1: 'L1', L2: 'L2', L3: 'L3' }
const tapN = { L1: 2, L2: 2, L3: 2 }          // TBB0106 load taps: 1 and 2 are the large openings, left free; 14 AWG goes in 3 to 8
const pwsMinus = { n: 0 }
function reading(e, other) {
  const dev0 = e.dev, t = String(e.term ?? '')
  let dev = ALIAS[dev0] ?? dev0, term = t, said = null
  if (/^(TB1|TB120-1|TB24-1)$/.test(dev0)) {
    const k = `${dev0}|${t}|${other.dev}|${other.term}`, slot = TB_PLAN[k]
    if (!slot) throw new Error(`no terminal planned for ${k}`)
    term = slot; said = `${dev0} terminal marked ${t.replace(' (return)', '')}`
  } else if (dev0 === 'DISCB0101' && /fuse load/.test(t)) { dev = 'DISCB0101-F'; term = `T${t[1]}`; said = `${dev0}, load side of the ${t.slice(0, 2)} fuse` }
  else if (dev0 === 'TBB0106') { const ph = t.slice(0, 2); term = /line/.test(t) ? ph : `${ph}-${++tapN[ph]}`; said = `TBB0106 ${t}` }
  else if (dev0 === 'FUB0132' || dev0 === 'FUB0145') { const m = /pole (\d) (line|load)/.exec(t); term = `${m[1]}${m[2] === 'line' ? 'L' : 'T'}`; said = `${dev0} ${t}` }
  else if (dev0 === 'PWSB0132') { term = t === '+' ? '+1' : t === 'GND' ? 'PE' : t === '-' ? `-${++pwsMinus.n}` : t; if (term !== t) said = `${dev0} ${t}` }
  else if (/^CB[BC]01(33|02)$/.test(dev0)) { term = t === 'line' ? '1' : '2'; said = `${dev0} ${t} side` }
  else if (/^DRVB0[234]00$/.test(dev0)) { term = PF[t] ?? t; if (term !== t) said = `${dev0} terminal ${t}` }
  // the transformer's fuse blocks are on the transformer: FUB0137 and FUB0142 land on TB0140's own fuse block terminals
  else if (dev0 === 'FUB0137' && /line/.test(t)) { dev = 'TB0140'; term = /H1/.test(t) ? '1L1' : '3L2'; said = `FUB0137, line side of the ${t.slice(0, 2)} fuse` }
  // the incoming ground is drawn to the middle one of five unnumbered screws; a D167-14 has 14 taps: the guide gives it the first
  else if (dev0 === 'GND BAR' && t === 'middle screw') { term = '1'; said = 'GNDB0100, the middle screw of the five drawn (not numbered)' }
  else if (dev0 === 'FUB0142' && t === 'load') { dev = 'TB0140'; term = '2T1'; said = 'FUB0142, load side' }
  return { dev, term, ...(said ? { printed: said } : {}) }
}
const COLOUR = { BK_BN: 'black with a brown stripe', BK_OG: 'black with an orange stripe', BK_YE: 'black with a yellow stripe', BK: 'black', RD: 'red', WH: 'white', BU: 'blue', BUWH: 'blue with a white stripe', GN: 'green' }
const KIND = { BK_BN: 'power', BK_OG: 'power', BK_YE: 'power', BK: 'power', RD: 'hot120', WH: 'neutral', BU: 'dc', BUWH: 'dc0', GN: 'gnd' }
const FIELD = /^(Plant feeder|DISCB0[234]00|MTRB|CRAUX|IDF)/
let n = 0
for (const w of WL.wires) {
  const field = FIELD.test(w.from.dev) || FIELD.test(w.to.dev)
  const feeder = w.from.dev === 'Plant feeder'
  let k = KIND[w.color_if_shown] ?? (feeder ? (w.potential === 'GND' ? 'gnd' : 'power') : /^(U|V|W)$/.test(w.from.term) ? 'power' : /A1$/.test(w.to.term) ? 'hot120' : 'power')
  const s = { id: `s${n++}`, label: w.wire || '', awg: w.awg, potential: w.potential, sheet: w.sheet, line: w.line, note: w.note || '', inferred: !!w.inferred, k,
    colorPrinted: w.color_if_shown ? `${COLOUR[w.color_if_shown]} (printed ${w.color_if_shown})` : null,
    from: reading(w.from, w.to), to: reading(w.to, w.from) }
  s.step = field ? 'wfield' : k === 'power' ? 'w480' : k === 'gnd' ? (w.from.dev === 'TB0140' ? 'w120' : /^PWSB/.test(w.from.dev) && w.from.term === '-' ? 'w24' : 'w480') : k === 'hot120' || k === 'neutral' ? 'w120' : 'w24'
  // READING 4: "1AWG" on 20 A branch conductors. Sheet B01 prints 1AWG on the L1 and L2 conductors of CBB0108 and
  // CBB0112 and on two FUB0132 feeds, where the L3 conductor beside each is 14AWG, CBB0116's are all 14AWG, and sheets
  // B02 and B03 print the very same wires (B01081, B01091, B01121, B01131) as 14AWG. A 1 AWG conductor does not go into a
  // 140MT-D or a class CC fuse holder (14 to 8 AWG, BOM Z03). The guide makes them 14 AWG and says so on the wire.
  // The three conductors from the fuse block to TBB0106 are also printed 1AWG; those are the panel's main conductors and
  // are left as printed (Design issues asks for the size to be confirmed).
  if (w.awg === '1' && w.from.dev !== 'DISCB0101') { s.awg = '14'; s.awgNote = 'printed 1AWG on sheet B01'; s.note += ' THIS GUIDE: made 14 AWG. "1AWG" is taken as a misprint: the next phase and the same wire on the drive sheet are printed 14AWG, and 1 AWG does not fit the terminals. Engineering to confirm (Design issues).' }
  if (feeder) { s.feeder = true; s.awg = null; s.awgDraw = w.potential === 'GND' ? '8' : '4'; s.note = `Site conductor, by the installer. ${s.note} Shown as a short tail so its landing is clear; the size drawn is not from the drawings.` }
  SEGMENTS.push(s)
}
// READING 5: the transformer's own links. Sheet B01 draws FUB0137 (two 2 A fuses) between TBB0106 and H1/H4, and FUB0142
// (10 A) between X1 and TB120-1, as if they were separate fuse holders. Sheet Z02 puts the tags FUB0137 and FUB0142 on
// the transformer TB0140, and the E750WB carries its own primary and secondary fuse blocks (seen on the same part number
// on CPME's VFD 200 panel, shop photos 2026-11-05). So the line conductors land on the primary fuse block, B01421 leaves
// from the secondary fuse block, and the conductors drawn from fuse to H1, fuse to H4 and X1 to fuse are the
// transformer's own links: nothing to cut or land. To be confirmed on the part (Design issues).
for (const s of SEGMENTS) {
  const f = `${s.from.dev}|${s.from.term}|${s.to.dev}|${s.to.term}`
  if (/^FUB0137\|H[14] fuse load\|TB0140\|H[14]$/.test(f) || f === 'TB0140|X1|FUB0142|line') {
    s.notFitted = true; s.nfWhy = 'not a wire to make: a link on the transformer\'s own fuse block'
    s.note += ' NOT A WIRE TO MAKE: the fuse block is on the transformer and this connection is the transformer\'s own link. Check it is there.'
  }
  // the H2-H3 connection is the flat link supplied with the transformer
  if (s.from.dev === 'TB0140' && s.to.dev === 'TB0140') { s.link = true; s.label = 'H2-H3 link'; s.note += ' Fitted as the flat jumper link supplied with the transformer, under the H2 and H3 screws (480 V connection). Nothing to cut or mark.' }
}
// cables: three patch cords (drive to jack) and three field Ethernet runs (jack to the IDF-04 switch)
for (const c of WL.cables) {
  const from = reading(c.from, c.to), to = reading(c.to, c.from)
  if (to.dev.startsWith('JKN')) to.term = 'front'
  if (from.dev.startsWith('JKN')) from.term = c.from.term
  const field = FIELD.test(c.to.dev)
  SEGMENTS.push({ id: `s${n++}`, kind: 'eth', k: 'eth', label: c.cable, awg: null, potential: 'Ethernet', sheet: c.sheet, line: '', from, to, note: c.note, step: field ? 'wfield' : 'wnet' })
}
// ADDED: conductors the guide adds at someone's request that are on no sheet. They are not in data/wirelist.json (that
// file is the record of the drawings). First confirm on the sheets that both terminals are free. Each one needs:
//   - a comment here saying who asked (a name or a role) and the date
//   - `added: true`, and a note that begins "NOT ON THE DRAWINGS"
//   - `sheet`: the sheet whose step it is wired with; `step`: that step's id; `k`: its colour class
//   - no invented wire number or potential number (label '', a potential that says what it is in words)
//   - a design issue asking engineering to add it to the sheets and number it
//   - a task and a flag on its step, added to L.STEPS right below (not in src/layout.mjs, which is the panel as drawn)
// They go last, so every existing segment keeps its id, its saved tick and its lane in the ducts.
const ADDED = []
for (const a of ADDED) SEGMENTS.push({ ...a, id: `s${n++}`, inferred: false })

// ---------------------------------------------------------------- reference documents per BOM part number
const DOCS = {}
const docsRaw = existsSync(join(here, 'data/install_docs.json')) ? JSON.parse(rd('data/install_docs.json')) : []
for (const b of L.BOM) {
  const hits = docsRaw.filter((e) => `${e.part} ${(e.tags ?? []).join(' ')}`.includes(b.pn))
  const web = [], facts = []
  for (const e of hits) for (const d of e.docs) {
    if (!d.url) continue
    if (d.doc_number && web.some((w) => w.doc_number === d.doc_number)) continue
    web.push({ title: `${e.manufacturer ?? ''} ${d.kind}`.trim(), doc_number: d.doc_number ?? '', url: d.url, verified: !!d.verified })
    if (d.verified && d.key_install_facts) facts.push(`${d.doc_number || d.kind}: ${d.key_install_facts}`)
  }
  DOCS[b.pn] = { web: web.slice(0, 4), facts: [...new Set(facts)].slice(0, 3) }
}
if (existsSync(join(here, 'data/partslib.json'))) {
  const pl = JSON.parse(rd('data/partslib.json'))
  for (const [pn, links] of Object.entries(pl)) if (!pn.startsWith('_')) (DOCS[pn] ??= { web: [], facts: [] }).partslib = links
}
if (existsSync(join(here, 'data/install_facts.json'))) {
  const f = JSON.parse(rd('data/install_facts.json'))
  for (const [pn, list] of Object.entries(f)) if (!pn.startsWith('_')) { const d = (DOCS[pn] ??= { web: [], facts: [] }); d.facts = [...list, ...d.facts].slice(0, 5) }
}

// ---------------------------------------------------------------- real envelopes from PartsLib records (data/partslib_records.json)
const REC = existsSync(join(here, 'data/partslib_records.json')) ? JSON.parse(rd('data/partslib_records.json')) : {}
for (const d of L.DEVICES) {
  const r = REC[d.pn]
  if (r?.d && !d.strip) { d.depth = d.rail ? +(r.d - 7.5).toFixed(1) : r.d; d.depthNote = `PartsLib record: ${r.dsrc ?? 'depth'}`; d.depthFrom = 'partslib' }
  if (r) d.rec = r
}
// ---------------------------------------------------------------- fuses that can be seen are parts of their own
// (the class CC fuses in FUB0125 and FUB0145 are inside dead-front holders: they are in the parts list, not drawn)
const fitLast = 'Fitted last, after testing.'
for (const f of [
  { tag: 'DISCB0101-F-L1', pn: 'LPJ-60SP', step: 'power', note: `Class J, 60 A. Clips between the switch's L1 pole and the fuse block: it is the connection. ${fitLast}` },
  { tag: 'DISCB0101-F-L2', pn: 'LPJ-60SP', step: 'power', note: `Class J, 60 A. Clips between the switch's L2 pole and the fuse block: it is the connection. ${fitLast}` },
  { tag: 'DISCB0101-F-L3', pn: 'LPJ-60SP', step: 'power', note: `Class J, 60 A. Clips between the switch's L3 pole and the fuse block: it is the connection. ${fitLast}` },
  { tag: 'FUB0137-H1', pn: 'CCMR002.TXP', step: 't1', note: `Transformer primary fuse, H1 side (from TBB0106 L2). Class CC, 2 A. Sheet B01 gives both primary fuses the one tag FUB0137. ${fitLast}` },
  { tag: 'FUB0137-H4', pn: 'CCMR002.TXP', step: 't1', note: `Transformer primary fuse, H4 side (from TBB0106 L3). Class CC, 2 A. ${fitLast}` },
  { tag: 'FUB0142', pn: 'CCMR010.TXP', step: 't1', note: `Transformer secondary fuse (X1, wire B01421). Class CC, 10 A. ${fitLast}` },
]) L.DEVICES.push({ ...f, at: 'fuse' })
for (const b of L.BOM) { if (b.pn === 'LPJ-60SP') b.where = 'DISCB0101-F-L1 / DISCB0101-F-L2 / DISCB0101-F-L3' }
const T = await import(pathToFileURL(join(here, 'src', 'terminals.mjs')).href)

// ---------------------------------------------------------------- issues
// Design issues: for the engineer who drew the panel. Modeling issues: this guide's own assumptions and stand-ins.
const DESIGN_ISSUES = [
  'Safe torque off. Sheets B02, B03 and B04 each draw a short orange line leaving drive terminals S1 and S2 that ends in open space: no wire number, no size, no destination, nothing at S+. The same sheets note "Remove safe-off jumper". No safety relay, E-stop or safety circuit is on any sheet or in any BOM. With the jumper removed and nothing connected to S1 and S2 a PowerFlex 525 will not run. Say what S1, S2 and S+ connect to, or that the factory jumper stays in. This guide lands nothing on S1, S2 or S+ and tells the builder to leave the safe-off jumper in until engineering answers.',
  'Main rating. Sheet B01 reads "480VAC @ 100 AMPS ±10% (FLA: 77 AMPS)" and marks DISCB0101 "90A". The BOM on Z02 lists a 60 A switch (1494U-D60), a 60 A fuse block (1494U-F60), 60 A fuse clips and three LPJ-60SP fuses, and the nameplate text on Z01 says "CURRENT: 60A". The switch symbol on Z02 is marked 100A. Three 7.5 HP drives at 15.4 A input each (520-TD001 p.30) plus the control loads come to well under 60 A. Say which rating is meant and make the sheets agree.',
  'Wire sizes on sheet B01. "1AWG" is printed on the L1 and L2 conductors of CBB0108 and CBB0112 (both sides of each breaker) and on the L1 and L3 feeds to FUB0132, where the conductor beside each is 14AWG, and where sheets B02 and B03 print the same wires (B01081, B01091, B01121, B01131) as 14AWG. This guide makes them 14 AWG. The three conductors from the fuse block to TBB0106 (B01021, B01022, B01023) are also printed 1AWG: left as printed here; confirm the size (the 1494U-F60 lug range is not in a document held).',
  'NEW As printed, the three 1 AWG conductors B01021, B01022 and B01023 cannot be made as the layout draws them: the fuse block poles are 24 to 30 mm to the right of the TBB0106 line lugs they feed, and there is only about 80 mm between them. The guide draws them as printed and they show as bends tighter than the wire (the audit names all three). A smaller conductor, or TBB0106 moved under the fuse block, clears it.',
  'Sheet B01, B01421 and B01411 from the transformer to TB120-1 are printed RD_8AWG and WH_8AWG. TB120-1 is 1492-J4 blocks, which take 22 to 10 AWG (1492-TD015 p.2). Sheet C01 continues the same potentials at 14AWG. The guide lists them as printed: confirm the size (10 AWG or smaller is needed to land them).',
  'Tags. The 24 V supply and its fuse holder are PWSB0132 and FUB0132 on sheet B01, and PWSB0125 and FUB0125 on sheets Z02 and Z04. The ground bar is GNDB0100 on B01; Z02 puts "GNDB0100" over the Burndy lug and labels the bar "GNDB0100 GROUND BAR (100-CP1)" and the lug "GNDB0101". The earth symbol on B01 is GNDB0103. The two transformer primary fuses share one tag, FUB0137. The three Ethernet jacks have no tag.',
  'Terminal numbers. No terminal on TB1, TB120-1 or TB24-1 has a number: each is identified only by the wire number printed on it (Z04, Z05). Where several blocks carry one wire number the drawings do not say which block or which side a conductor lands on. This guide numbers the blocks from the left and gives every conductor a block and a side (listed in START HERE and on each wire). Number the terminals on the drawings.',
  'Sheet C01, terminal labels. The supply-side terminals of the three pump rungs are labelled C01022, C01021, C01021, and they are one node (joined by the bus line): the first should read C01021. The return terminals are labelled C01051, C01081 and C01021, and the third is the supply potential as printed. Sheet Z04 marks the blocks C01021 x3 (jumpered), C01022, C01051, C01081, which is what the line numbers give (lines C0102, C0105, C0108). This guide follows Z04: out on blocks 5, 6, 7; back on block 8 (C01022) for CRAUX1, 9 (C01051) for CRAUX2, 10 (C01081) for CRAUX3. Correct sheet C01.',
  'Sheet C01 draws two TB120-1 terminals on B01421, joined by the bus; sheet Z04 draws four B01421 blocks with no jumper. This guide lands the supply from FUB0142 and the wire to CBC0102 on the same block (terminal 1), one on each side. Either show a jumper or say which blocks are used; three of the four are spare as drawn.',
  'Sheets B02 to B04 draw a line between the two B0x061 terminals on the terminal 1 and terminal 11 lines with "BU_16AWG" printed on it, and a second, unlabelled, between two terminals on the terminal 11 line. Sheet Z05 draws a screw centre jumper across the three B0x061 blocks. This guide fits the centre jumper and no wire. Confirm that no wire jumper is intended.',
  'Relay terminals. The contact of CRC0108 is printed 11 and 14 on sheet B04; the contacts of CRC0102 and CRC0105 on B02 and B03 have no terminal numbers. The NC cross reference under each coil on C01 is blank and the 12 terminal is unused. This guide wires all three alike.',
  'Motor data. The parameter tables on sheets B02 and B03 give motor nameplate 17 A and 15 HP (P34, P37) with overload 25 A; the motors drawn on the same sheets are 7.5 HP, 13 FLA, and the drive is a 13 A, 7.5 HP unit. Sheet B04\'s table gives 4 A and 3 HP for a motor drawn as 7.5 HP, 13 FLA, and enters "480VAC" as the value of P31. Sheet B04 also prints 16AWG for both drive grounds where B02 and B03 print 12AWG (line side) and 14AWG (motor). Sheet A03 note 19 calls for a motor ground the same size as the motor conductors (14 AWG).',
  'Titles do not agree. The drawing set is "10006 Intake Receiving VFD"; sheets B02 to B04 are the cream tank 1 and 2 discharge pumps and the skim silo outlet pump (PP-CT01-01, PP-CT02-01, PP-CT03-01); the relay rungs on C01 are bay 1 and bay 2 receiving pump and receiving CIP pump auxiliary disconnect feedback (PP-RB01-01, PP-RB01-02, PP-RB00-01). The motor on B02 is titled "cream tank output mtr" and on B03 "cream tank 2 output mtr". Confirm which pumps this panel serves and that each relay is the feedback for the drive it interlocks.',
  'Grounding. The incoming ground is drawn to a junction beside the D167-14 bar, with no size. The Burndy K3A26U-2N lug (GNDB0101 on Z02, a three-conductor main ground lug) has no conductor on any schematic sheet. The usual arrangement is the incoming ground on the lug and a bond from the lug to the bar: say which. The BOM on Z02 lists D167-14 twice (items 6 and 12); one bar is drawn. Z02 draws the bar about 97 mm long with ten screws; a D167-14 is 171 mm long with 14 taps and, placed from the drawn top end, reaches the duct below it.',
  'Incoming feeder: no wire numbers, no size and no entry point. The Roxtec EZ-Entry gland (Z01 item 3) has no position. No conduit hubs or entries are drawn for the feeder, the three motor circuits, the pump auxiliary contacts or the Ethernet runs. Sheet A03 note 6 calls for bottom entry and note 18 for DC and AC in separate conduit; the 24 V and 120 V terminals share rail C and rail B ducts with 480 V.',
  'The air conditioner ACB0145 (2000BTU) is on sheets B01 and Z01 and in no BOM: no part number, voltage, current or cutout. It is drawn with a three-phase symbol and fed by two conductors (L2, L3) through two 3 A fuses. Confirm the unit and that 3 A suits it.',
  'Sheet B01: the L1, L2, L3 bus arrows at the end of sheet B04 read "to B0500"; there is no sheet B05. The wire number printed at the 24 V supply\'s L3 terminal is B01342 and at L2 is B01332 (line numbering would give B01331 and B01341, which are the +24 V and 0 V numbers). No wire number on the + conductor from the supply to CBB0133, on the transformer primary conductors, or on any ground.',
  'Sheet D01 and TB24-1. +24 V (B01331) goes from CBB0133 to two jumpered TB24-1 blocks and 0 V (B01341) to a third, and nothing is connected to them: the drives take their 24 V from their own terminal 11. If TB24-1 is for future loads, say so; CBB0133 (10 A) then protects nothing today. The BOM on Z04 lists two 1489-M1C100; one is drawn.',
  'Bills of material against the layouts. Z03: three end anchors drawn on rail A, two listed. Z04: thirteen 1492-J4 drawn, fifteen listed; the LPSC003ID line\'s description prints "LPSC002ID ... 3 poles". Z05: eight end barriers drawn, seven listed. Z02: about 25 ft of duct drawn, 24 ft listed; the cover C2WH6 is the 2 in cover for the G2X3 duct. No ferrules, wire, markers, ground blocks\' rail bonding or door bonding straps are listed. No floor stand or legs (Z01 draws none).',
  'Layout sheets have no dimensions (scale "None"). Z02 draws the transformer as a plain 178 x 152 mm rectangle (an E750WB is 162 x 176 mm, 178 mm deep) and TBB0106 as a 160 x 139 mm symbol with twelve load holes a pole (the 1492-PDC-3A200-S0108 is 143 x 127 mm with eight). Dimension the layout or state that the parts are placed to the symbols.',
  'Sheet A03 note 9 and note 11: shielded pairs and wire labels are specified, but no label text is given for the unnumbered conductors, and the wire-number scheme makes several different conductors carry one number (every wire on a potential has the potential\'s number: six conductors are marked B01341).',
  'Sheet A03 note 2 reads "coordinate with Sharpe and plant personnel" and the nameplate block on Z01 is a template with placeholders (XXXXX) above the filled-in note. The network switch IDF-04 is "Model: TBD" with IP address x.x.x.x on N01.',
]
const MODELING_ISSUES = [
  { status: 'open', text: 'V1 No maker\'s 3D model was fetched for this panel. Parts are drawn from models that came with CPME\'s VFD 200 guide, or built from their catalogue shape.', how: 'Same part, same model: the 1492-J4 blocks, end anchors, end barriers, DIN rail and ground lug. Catalogue shapes: TBB0106, the transformer, the ground bar (all three as on VFD 200, where they were checked against shop photos), the 140MT-D breakers, the two fuse holders, the 24 V supply, the two 1489-M breakers, the relays and the Ethernet jacks. Stand-ins of a neighbouring size are listed one by one below. Makers\' models for the frame C drive, the 60 A switch and fuse block, the 1606-XLE240E-3, 1489-M, 700-HLT and the Panduit parts would replace them.' },
  { status: 'open', text: 'V1 The drives are Rockwell\'s frame D PowerFlex 525 model scaled to the frame C envelope (109 x 220 x 184 mm, 520-TD001 p.15).', how: 'Outline and position are right. The control and power terminal blocks are built in the order 520-UM001 gives, but their exact positions on a frame C drive are not measured: the blocks shown are the frame D arrangement, shrunk with the body. Use the terminal names on the wire cards, not the picture, to find a terminal.' },
  { status: 'open', text: 'V1 The disconnect and its fuse block are Rockwell\'s 100 A models (1494U-D100, 1494U-F100); the BOM parts are the 60 A ones.', how: 'Sheet Z02 itself draws the 100 A symbol (marked 100A, poles 46 mm apart), so position and pole spacing follow the sheet. The fuses are drawn at class J 60 A size (27 x 60 mm). Lug positions on the real 60 A parts may differ.' },
  { status: 'open', text: 'V1 The enclosure is Saginaw\'s 60 x 49 x 18 in model pressed to 12 in deep; the air conditioner is Saginaw\'s 1000 BTU/h unit.', how: 'Width, height, doors and handles are as the SCE-60XEL4912SSST; door hardware looks thinner than it is. The air conditioner is on the left side wall as sheet Z01 draws it; its real size and cutout are unknown (Design issues).' },
  { status: 'open', text: 'V1 Wire duct: Panduit\'s 2 x 2 in model stretched to 3 in tall for G2X3WH6.', how: 'Width and height are right; the slot pattern is the narrow-slot F type, the G type has wide slots.' },
  { status: 'open', text: 'V1 Terminal positions on the fuse holders (LPSC), the 1489-M breakers, the 700-HLT1L1 relays and the Ethernet jacks are read off the device symbols on sheets Z03 to Z05, not from makers\' documents.', how: 'Each says so on its part card. On the relays, which screw is A1, A2, 11, 14 and 12 is assumed (coil at the bottom, contact at the top): check the marking on the relay before landing. Line at the top of each fuse holder and breaker is this guide\'s choice.' },
  { status: 'open', text: 'V1 Terminal strips: block and side for every conductor are this guide\'s choice.', how: 'Panel wiring on the upper screw, field wiring on the lower; where a block takes two panel conductors the second is on the lower screw. The plan is in build.mjs (TB_PLAN) and in START HERE. The blocks carry the wire-number marks sheets Z04 and Z05 print, and the guide\'s own 1 to n numbers.' },
  { status: 'open', text: 'V1 Field conductors have no drawn entry.', how: 'They run to the bottom duct and down through the enclosure floor, as sheet A03 note 6 asks. The incoming feeder and ground are short tails at their lugs. Where each really enters is the installer\'s and the engineer\'s decision.' },
  { status: 'open', text: 'V1 Positions come from sheet Z02 by measurement (no dimensions are printed).', how: 'Good to about a millimetre on the drawing; the drawing itself is not dimensioned. Parts with a maker\'s size are drawn at that size, centred where Z02 draws them.' },
  { status: 'open', text: 'V1 Wire colours are the ones the drawing prints (BK_BN, BK_OG, BK_YE, RD, WH, BU, BUWH, GN).', how: 'The stripes are not drawn: the three phases all show black, 0 V shows pale blue. Each wire card gives the printed colour in words. Conductors with no colour printed (the transformer link, the relay coil feeds, the motor leads, the feeder) take the colour of their circuit.' },
  { status: 'open', text: 'V1 Nothing in this guide has been checked against a built panel or shop photos.', how: 'There are none yet for this job. The first photos should be compared device by device, as was done on VFD 200.' },
]
const TERMINALS = { LAYOUTS: T.LAYOUTS, DEVICE_LAYOUT: T.DEVICE_LAYOUT, STRIP_LAYOUT: T.STRIP_LAYOUT, IOL_CORE: T.IOL_CORE }

// ---------------------------------------------------------------- vendor STEP models (tools/step_to_mesh.mjs -> assets/models)
const F = await import(pathToFileURL(join(here, 'src', 'model_fit.mjs')).href)
const MIDX = JSON.parse(rd('assets/models/index.json'))
const used = new Set([...Object.values(F.MODEL_FIT), ...Object.values(F.STRIP_MODEL), ...Object.values(F.PART_MODEL)].map((m) => m.model))
const MODELS = {}
for (const k of used) {
  if (!MIDX[k]) { console.warn(`model ${k} not converted`); continue }
  const { parts, lo, hi, step, sha256, pn, comp, tri } = MIDX[k]
  MODELS[k] = { meta: { parts, lo, hi }, step, sha256, pn, comp, tri, b64: readFileSync(join(here, 'assets', 'models', `${k}.bin`)).toString('base64') }
}
const FIT = { MODEL_FIT: F.MODEL_FIT, STRIP_MODEL: F.STRIP_MODEL, PART_MODEL: F.PART_MODEL }
const GUIDE = { JOB: L.JOB, BOM: L.BOM, ENC: L.ENC, DUCTS: L.DUCTS, RAILS: L.RAILS, DEVICES: L.DEVICES, ANCHORS: L.ANCHORS, PHASES: L.PHASES, STEPS: L.STEPS, TEX, SEGMENTS, DOCS, DESIGN_ISSUES, MODELING_ISSUES, TERMINALS, REC, PL_URL, VERSION: '1.0', MODELS, FIT }

// ---------------------------------------------------------------- the page
const kit = rd('vendor/lab-kit.js')
const guide = rd('src/guide.js')
const safe = (s) => s.replace(/<\/script/gi, '<\\/script')
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${L.JOB.panel} Assembly Guide</title>
<meta name="description" content="Step-by-step build guide for panel ${L.JOB.panel} (${L.JOB.project}, ${L.JOB.desc}) from ${L.JOB.drawing}: a 3D panel built in order, every wire routed and labelled, and the reference documents for each part.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
} }
</script>
<style>
:root { --ink:#16171a; --mut:#6b6d72; --line:#dcdad3; --bg:#f3f2ee; --card:#fbfaf7; --acc:#e8590c; --amber:#a35a00; --ok:#2f7d3b }
.lab-side, .lab-how, .lab-prompt, .lab-pills, .lab-modes, .lab-beat { display:none !important }
.lab-scale { left:24px !important; bottom:20px !important }
#g-panel { position:fixed; right:0; top:0; bottom:0; width:min(440px, 38vw); background:var(--card); border-left:1px solid var(--line); z-index:5; display:flex; flex-direction:column; font:14px/1.45 Inter, system-ui, sans-serif; color:var(--ink) }
#g-head { padding:18px 22px 10px; border-bottom:1px solid var(--line) }
#g-head .job { font-size:11.5px; color:var(--mut); letter-spacing:.02em }
#g-head h1 { font:400 30px/1.1 'Instrument Serif', Georgia, serif; margin:4px 0 2px }
#g-head h1 i { color:var(--mut) }
#g-head .src { font-size:11.5px; color:var(--mut) }
#g-panel .tabs { display:flex; gap:2px; padding:8px 14px 0; border-bottom:1px solid var(--line) }
#g-panel .tabs button { border:0; background:none; padding:8px 10px 9px; font:600 13px Inter, sans-serif; color:var(--mut); border-bottom:2px solid transparent; cursor:pointer }
#g-panel .tabs button.on { color:var(--ink); border-bottom-color:var(--acc) }
#g-panel .body { flex:1; overflow:auto; padding:16px 22px 24px }
#g-panel .nav { display:flex; align-items:center; gap:10px; padding:12px 16px; border-top:1px solid var(--line); background:#f6f5f1 }
#g-panel .nav button { border:1px solid var(--line); background:#fff; border-radius:8px; padding:9px 12px; font:600 13px Inter, sans-serif; cursor:pointer; white-space:nowrap }
#g-panel .nav button.pri { background:var(--ink); color:#fff; border-color:var(--ink) }
#g-panel .nav button:disabled { opacity:.35; cursor:default }
#g-panel .prog { flex:1; height:4px; background:var(--line); border-radius:2px; overflow:hidden }
#g-panel .prog div { height:100%; background:var(--acc) }
.stephead .kick { font-size:12px; color:var(--acc); font-weight:600 }
.stephead h2 { font:400 26px/1.15 'Instrument Serif', Georgia, serif; margin:4px 0 6px }
.why { color:#3d3f44; margin:0 0 8px }
#g-panel section { margin:16px 0 0 }
#g-panel h3 { font:600 11.5px Inter, sans-serif; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); margin:0 0 8px }
.task { display:flex; gap:10px; align-items:flex-start; padding:7px 0; border-bottom:1px dashed var(--line); cursor:pointer }
.task input { margin-top:3px; accent-color:var(--ok); width:16px; height:16px; flex:none }
.task input:checked + span { color:var(--mut); text-decoration:line-through; text-decoration-color:#bbb }
.flags { background:#fff6e8; border:1px solid #f0d5a8; border-radius:10px; padding:10px 12px }
.flags h3 { color:var(--amber) }
.flags p { margin:4px 0; font-size:13px }
.part { border:1px solid var(--line); border-radius:10px; padding:10px 12px; margin:0 0 8px; background:#fff }
.part .ph { display:flex; justify-content:space-between; gap:8px; align-items:baseline }
.part .pn { font:600 12px 'JetBrains Mono', monospace; color:#333 }
.part .pd { font-size:12.5px; color:#4a4c51; margin:3px 0 6px }
.facts { margin:4px 0 6px; padding-left:16px; font-size:12px; color:#33363b }
.facts li { margin:2px 0 }
.refs { display:flex; flex-wrap:wrap; gap:6px }
.refs a { font-size:12px; text-decoration:none; color:#174ea6; background:#eef3fb; border-radius:6px; padding:3px 7px }
.refs a.pl { background:#fdeee4; color:#9a3a06; font-weight:600 }
.refs .dn { color:#5a6578; font-family:'JetBrains Mono', monospace; font-size:11px }
.note { font-size:12.5px; background:#f3f1ea; border-radius:8px; padding:7px 9px }
.muted { color:var(--mut) } .small { font-size:12px }
.lnk { border:0; background:none; color:var(--acc); font:600 13px Inter, sans-serif; cursor:pointer; padding:0 }
.outline { margin-top:22px } .outline summary { cursor:pointer; font-weight:600; color:var(--mut); font-size:13px }
.ph-n { font:600 11px Inter; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); margin:12px 0 4px }
.ol { display:flex; gap:8px; width:100%; text-align:left; border:0; background:none; padding:5px 6px; border-radius:6px; font:13px Inter, sans-serif; cursor:pointer; color:var(--ink) }
.ol span { width:20px; color:var(--mut); flex:none } .ol.cur { background:#fdeee4 } .ol.ok span::after { content:' ✓'; color:var(--ok) }
.search { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--line); border-radius:8px; font:13px Inter, sans-serif; margin:0 0 10px; background:#fff }
.wtools { display:flex; gap:8px; align-items:center; margin:0 0 8px } .wtools select { flex:1; padding:7px; border:1px solid var(--line); border-radius:8px; font:13px Inter; background:#fff } .wtools .search { margin:0; flex:1 }
.btn { border:1px solid var(--ink); background:var(--ink); color:#fff; border-radius:8px; padding:7px 10px; font:600 12.5px Inter; cursor:pointer }
.wt { width:100%; border-collapse:collapse; font-size:12px }
.wt th { text-align:left; color:var(--mut); font-weight:600; border-bottom:1px solid var(--line); padding:5px 4px; position:sticky; top:-16px; background:var(--card) }
.wt td { padding:5px 4px; border-bottom:1px solid #eceae4; vertical-align:top }
.wt td:first-child { white-space:nowrap; font-family:'JetBrains Mono', monospace }
.wt tr { cursor:pointer } .wt tr:hover { background:#f6f2ea } .wt tr.sel { background:#fdeee4 } .wt tr.nodraw { opacity:.6 }
.sw { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; border:1px solid #0002; vertical-align:-1px }
.wdet { position:static; background:#fff; border:1px solid var(--acc); border-radius:10px; padding:10px 12px; margin-top:10px; box-shadow:0 -6px 18px #0001 }
.wdet h3 { color:var(--acc); font-size:14px; text-transform:none; letter-spacing:0; font-family:'JetBrains Mono', monospace }
.wdet p { margin:3px 0; font-size:12.5px }
.selpart { border:1px solid var(--acc); border-radius:12px; padding:10px; margin-bottom:14px }
.prow.fieldp { opacity:.65 }
.iss { border-bottom:1px dashed var(--line); padding:8px 0 } .iss p { margin:0 0 3px; font-size:13px }
#g-tags { position:fixed; inset:0; pointer-events:none; z-index:3 }
.g-tag { position:absolute; transform:translate(-50%, -100%); font:700 11.5px 'JetBrains Mono', monospace; background:var(--ink); color:#fff; padding:3px 6px; border-radius:5px; white-space:nowrap; box-shadow:0 2px 8px #0003 }
.g-tag::after { content:''; position:absolute; left:50%; bottom:-4px; margin-left:-4px; border:4px solid transparent; border-top-color:var(--ink); border-bottom:0 }
.g-tag.hov { background:var(--acc) } .g-tag.hov::after { border-top-color:var(--acc) }
#g-tip { position:fixed; z-index:6; pointer-events:none; display:none; background:#fff; border:1px solid var(--line); border-radius:8px; padding:6px 9px; font:12.5px Inter; box-shadow:0 4px 14px #0002; max-width:380px }
#g-tip b { font-family:'JetBrains Mono', monospace; color:var(--acc) }
#g-bar { position:fixed; left:20px; top:16px; z-index:4; display:flex; flex-direction:column; gap:6px; max-width:calc(100vw - min(440px, 38vw) - 40px) }
body.nopanel #g-bar { max-width:calc(100vw - 40px) }
#g-view, #g-view2 { display:flex; gap:6px; flex-wrap:wrap; align-items:center }
#g-bar button { border:1px solid var(--line); background:#fffffff0; border-radius:8px; padding:8px 11px; font:600 12.5px Inter, sans-serif; cursor:pointer; color:var(--ink); box-shadow:0 1px 3px #0001 }
#g-bar button:hover { border-color:#b9b6ac; background:#fff }
#g-bar button:focus-visible, #g-collapse:focus-visible, #g-legend button:focus-visible, #g-helpcard button:focus-visible { outline:2px solid var(--acc); outline-offset:1px }
#g-bar button.on { background:var(--ink); color:#fff; border-color:var(--ink) }
#g-bar kbd { font:600 10px 'JetBrains Mono', monospace; opacity:.6; margin-left:4px }
#g-view2 button { padding:5px 9px; font-weight:500; font-size:12px }
#g-view2 .lbl { font:600 11px Inter, sans-serif; color:var(--mut); text-transform:uppercase; letter-spacing:.05em; margin-right:2px; background:#f3f2eecc; padding:3px 6px; border-radius:6px }
#g-view2 .sep { width:8px }
#g-legend { position:fixed; left:20px; bottom:52px; z-index:4; width:250px; background:#fffffff5; border:1px solid var(--line); border-radius:12px; padding:10px 10px 8px; font:12.5px Inter, sans-serif; color:var(--ink); box-shadow:0 6px 20px #0002; display:none }
#g-legend.open { display:block }
#g-legend h4 { margin:0 0 6px; font:600 11.5px Inter, sans-serif; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); display:flex; justify-content:space-between; align-items:center }
#g-legend h4 button { border:0; background:none; font-size:16px; cursor:pointer; color:var(--mut); padding:0 4px }
#g-legend .lk { display:flex; align-items:center; gap:8px; width:100%; text-align:left; border:1px solid transparent; background:none; border-radius:7px; padding:4px 6px; cursor:pointer; font:inherit; color:inherit }
#g-legend .lk:hover { background:#f6f2ea } #g-legend .lk.on { border-color:var(--acc); background:#fff7f1 }
#g-legend .lk i { width:22px; height:8px; border-radius:4px; border:1px solid #0003; flex:none }
#g-legend .lk span { flex:1; line-height:1.2 } #g-legend .lk small { display:block; color:var(--mut); font-size:10.5px }
#g-legend .lk b { font:600 11px 'JetBrains Mono', monospace; color:var(--mut) }
#g-legend p { margin:6px 4px 0; font-size:11.5px; color:var(--mut) }
#g-helpcard { position:fixed; inset:0; z-index:20; background:#16171a66; display:none; align-items:center; justify-content:center; padding:20px }
#g-helpcard.open { display:flex }
#g-helpcard .hc { position:relative; background:var(--card); border-radius:16px; padding:22px 26px 20px; max-width:720px; width:100%; max-height:calc(100vh - 40px); overflow:auto; font:13.5px/1.45 Inter, sans-serif; color:var(--ink); box-shadow:0 20px 60px #0005 }
#g-helpcard h2 { font:400 28px/1.1 'Instrument Serif', Georgia, serif; margin:0 0 12px }
#g-helpcard h4 { font:600 11.5px Inter, sans-serif; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); margin:12px 0 6px }
#g-helpcard .cols { display:grid; grid-template-columns:1fr 1fr; gap:6px 28px }
#g-helpcard dl { display:grid; grid-template-columns:max-content 1fr; gap:5px 12px; margin:0 }
#g-helpcard dt { font-weight:600; white-space:nowrap } #g-helpcard dd { margin:0; color:#3d3f44 }
#g-helpcard kbd { font:600 11px 'JetBrains Mono', monospace; background:#fff; border:1px solid var(--line); border-bottom-width:2px; border-radius:5px; padding:1px 6px }
#g-helpcard p { color:var(--mut); font-size:12.5px; margin:14px 0 12px }
#g-helpcard .x { position:absolute; right:14px; top:12px; border:0; background:none; font-size:22px; cursor:pointer; color:var(--mut) }
#g-helpcard .go { border:1px solid var(--ink); background:var(--ink); color:#fff; border-radius:8px; padding:9px 18px; font:600 13px Inter, sans-serif; cursor:pointer }
#g-collapse { position:fixed; top:50%; right:min(440px, 38vw); transform:translateY(-50%); z-index:6; width:20px; height:56px; border:1px solid var(--line); border-right:0; border-radius:8px 0 0 8px; background:var(--card); color:var(--mut); font:600 15px Inter, sans-serif; cursor:pointer; padding:0 }
#g-collapse:hover { color:var(--ink); background:#fff }
#g-panel { transition:transform .22s ease } #g-collapse { transition:right .22s ease }
body.nopanel #g-panel { transform:translateX(100%) } body.nopanel #g-collapse { right:0 }
#g-head .ver { font:600 11px Inter; color:#fff; background:var(--acc); border-radius:4px; padding:2px 5px; vertical-align:middle }
.wirecta { background:#f6f2ea; border:1px solid #ecdcc6; border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:8px }
.prog.sm { height:4px; background:var(--line); border-radius:2px; overflow:hidden } .prog.sm div { height:100%; background:var(--ok) }
.wmprog { display:flex; align-items:center; gap:10px; margin:2px 0 10px; font-size:12px; color:var(--mut) } .wmprog .prog { flex:1; height:6px; background:var(--line); border-radius:3px; overflow:hidden } .wmprog .prog div { height:100%; background:var(--ok) }
.wcard { border:1.5px solid var(--acc); border-radius:12px; padding:12px; background:#fff }
.wcard.isdone { border-color:var(--ok); background:#f4faf4 }
.wmk { display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:13px }
.sleeve { font:700 18px 'JetBrains Mono', monospace; background:#f7f7f2; border:1px solid #d8d8d0; border-radius:6px; padding:6px 10px; box-shadow:inset 0 -2px 0 #e4e4dc }
.sw.big { width:18px; height:18px; border-radius:4px }
.endb { border-top:1px dashed var(--line); padding:8px 0 }
.eh { display:flex; align-items:center; gap:8px; font-size:15px } .eh b { font-family:'JetBrains Mono', monospace }
.ab { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%; background:var(--acc); color:#fff; font:700 12px Inter }
.apx { font:600 10.5px Inter; color:var(--amber); border:1px solid #f0d5a8; background:#fff6e8; border-radius:4px; padding:1px 5px }
.el { font-size:12.5px; color:#3d3f44; margin:3px 0 0 30px } .el.sp { color:#174ea6 }
.cores { display:flex; flex-direction:column; gap:3px; margin:6px 0 4px; font-size:12px } .cores i.sw { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; vertical-align:-1px }
.route { margin:8px 0 4px; font-size:12.5px } .route span { font:600 12px 'JetBrains Mono', monospace; background:#f6f2ea; border-radius:4px; padding:1px 5px }
.wbtn { display:flex; gap:8px; margin-top:10px } .wbtn button { flex:1; border:1px solid var(--line); background:#fff; border-radius:8px; padding:10px 8px; font:600 13px Inter; cursor:pointer } .wbtn button.pri { background:var(--ink); color:#fff; border-color:var(--ink); flex:1.6 } .wbtn button:disabled { opacity:.35 }
.wlist { margin-top:14px } .wls { max-height:280px; overflow:auto; position:relative; border:1px solid var(--line); border-radius:8px; padding:4px } .wlist summary { cursor:pointer; font-weight:600; color:var(--mut); font-size:13px; margin-bottom:6px }
.wl { display:block; width:100%; text-align:left; border:0; background:none; padding:5px 6px; border-radius:6px; font:12.5px Inter; cursor:pointer } .wl b { font-family:'JetBrains Mono', monospace } .wl.cur { background:#fdeee4 } .wl.ok b::after { content:' ✓'; color:var(--ok) }
.btn.ghost { background:#fff; color:var(--ink); border-color:var(--line) }
.cutl { margin:6px 0 10px } .cutl summary { cursor:pointer; font-weight:600; font-size:13px }
.wt.cut td, .wt.cut th { text-align:right } .wt.cut td:first-child, .wt.cut th:first-child { text-align:left; font-family:Inter }
.pill { font:700 10px Inter; text-transform:uppercase; letter-spacing:.04em; border-radius:4px; padding:2px 5px; margin-right:4px } .pill.resolved { background:#e3f2e5; color:var(--ok) } .pill.open { background:#fff1dc; color:var(--amber) }
.cnt { font:600 11px Inter; background:var(--line); border-radius:8px; padding:1px 6px; color:var(--ink) }
.g-end { position:absolute; transform:translate(-50%, calc(-100% - 12px)); font:600 12px 'JetBrains Mono', monospace; background:#fff; color:var(--ink); border:1.5px solid var(--acc); padding:3px 7px; border-radius:6px; white-space:nowrap; box-shadow:0 3px 10px #0003 }
.g-end b { color:#fff; background:var(--acc); border-radius:50%; display:inline-grid; place-items:center; width:16px; height:16px; font:700 10px Inter; margin-right:4px }
#g-print { display:none }
#g-panel .chipbar:empty { display:none }
#g-panel .chipbar { padding:10px 14px 0 }
.chip { border:1.5px solid var(--acc); background:#fff7f1; border-radius:12px; padding:9px 34px 9px 12px; position:relative; font-size:13px; display:flex; flex-wrap:wrap; align-items:center; gap:6px }
.chip.dev { border-color:#2f6fb8; background:#f1f6fd }
.chip > b { font:700 15px 'JetBrains Mono', monospace }
.chip .ct { color:#3d3f44; font-size:12.5px }
.chip .x { position:absolute; right:8px; top:7px; border:0; background:none; font-size:15px; cursor:pointer; color:var(--mut) }
.chip .cb { display:flex; gap:5px; width:100%; flex-wrap:wrap; margin-top:3px }
.chip .cb button { border:1px solid var(--line); background:#fff; border-radius:7px; padding:5px 9px; font:600 12px Inter, sans-serif; cursor:pointer }
.chip .cb button[data-trace] { background:var(--acc); color:#fff; border-color:var(--acc) }
.chip .cb button:disabled { opacity:.4 }
.dl { border:0; background:none; padding:0; font:inherit; color:#174ea6; cursor:pointer; text-decoration:underline dotted; text-underline-offset:2px }
.devs { display:flex; flex-wrap:wrap; gap:6px } .devs .dl { font:600 12.5px 'JetBrains Mono', monospace; background:#eef3fb; border-radius:6px; padding:3px 7px; text-decoration:none }
.ctxbar { background:#f1f6fd; border:1px solid #cfe0f5; border-radius:8px; padding:7px 10px; font-size:12.5px; margin-bottom:8px }
.cutb { margin:8px 0 4px; font-size:12.5px } .cutb summary { cursor:pointer; color:#3d3f44; font-weight:600 } .cutb div { display:flex; justify-content:space-between; gap:10px; padding:2px 0; border-bottom:1px dashed var(--line) } .cutb div span { color:var(--mut) }
.pill.new { background:#e3eefc; color:#174ea6 }
.g-end small { display:block; font:500 10.5px Inter, sans-serif; color:var(--mut); margin-top:1px; max-width:240px; white-space:normal }
.g-term { position:absolute; font:600 10.5px 'JetBrains Mono', monospace; background:#1b1d22e6; color:#fff; padding:1px 5px; border-radius:4px; white-space:nowrap; pointer-events:none }
.g-term.above { transform:translate(-50%, calc(-100% - 9px)) } .g-term.below { transform:translate(-50%, 9px) }
.g-term b { color:#ffcf9e } .g-term.ok { background:#2f7d3be6 } .g-term.ok b { color:#d6f5d9 }
#g-tip span { color:var(--mut); font-size:11.5px }
#g-search { border:1px solid var(--line); background:#fffffff0; border-radius:8px; padding:7px 10px; font:600 12.5px Inter, sans-serif; width:170px }

/* ---------------- V9: laid out for the person at the bench. Large targets, one bar of actions, progress always in view ---------------- */
:root { --top:60px; --pw:min(480px, 40vw); --ink:#14161a; --ok:#1f8a3b }
#g-top { position:fixed; left:0; right:0; top:0; height:var(--top); z-index:8; background:#14161a; color:#fff; display:flex; align-items:center; gap:12px; padding:0 14px; font:14px Inter, system-ui, sans-serif; box-shadow:0 2px 10px #0004 }
#g-top .brand { display:flex; flex-direction:column; line-height:1.15; margin-right:4px; white-space:nowrap }
#g-top .brand b { font:700 19px Inter, sans-serif } #g-top .brand span { font-size:11px; color:#a9acb3 }
#g-top .modes { display:flex; gap:4px; align-items:center }
#g-top .modes button { display:flex; align-items:center; gap:8px; height:44px; padding:0 13px; border:0; border-radius:10px; background:none; color:#c9ccd2; font:600 14.5px Inter, sans-serif; cursor:pointer; white-space:nowrap }
#g-top .modes button:hover { background:#ffffff14; color:#fff } #g-top .modes button.on { background:var(--acc); color:#fff }
#g-top .modes svg { width:20px; height:20px; flex:none }
#g-top .tprog { margin-left:auto; display:flex; gap:14px }
#g-top .tprog div { min-width:98px; font-size:11.5px; color:#a9acb3; white-space:nowrap } #g-top .tprog b { color:#fff; font-size:13px }
#g-top .tprog i { display:block; height:5px; border-radius:3px; background:#ffffff22; margin-top:4px; overflow:hidden } #g-top .tprog u { display:block; height:100%; background:#4cc26a }
#g-top #g-search { width:220px; min-width:90px; flex-shrink:1; height:40px; border-radius:10px; border:1px solid #3a3d44; background:#22252b; color:#fff; padding:0 12px; font:500 14px Inter, sans-serif }
#g-top #g-search::placeholder { color:#9a9da5 }
#g-top > button { flex:none; width:44px; height:40px; border-radius:10px; border:1px solid #3a3d44; background:#22252b; color:#fff; font:600 14px Inter, sans-serif; cursor:pointer }
#g-top > button b { font-size:19px } #g-top > button.on { background:#fff; color:#14161a }
#g-top button:focus-visible, #g-top input:focus-visible, #g-view button:focus-visible, #g-view2 button:focus-visible, #g-panel button:focus-visible { outline:2px solid #ffb27f; outline-offset:1px }
#g-panel { top:var(--top); width:var(--pw); font-size:15.5px; background:#fff; box-shadow:-6px 0 24px #0000000f }
body.big #g-panel .body, body.big #g-panel .chipbar { zoom:1.18 }
#g-panel .body { padding:14px 20px 28px }
#g-panel .nav { padding:12px 14px; gap:10px; background:#fff; box-shadow:0 -6px 16px #0000000d }
#g-panel .nav button { flex:1; height:54px; border-radius:12px; font:700 15.5px Inter, sans-serif; padding:0 12px; border:1.5px solid var(--line) }
#g-panel .nav button.pri { flex:1.9; background:var(--ink); border-color:var(--ink) }
#g-panel .nav button.pri.ok { background:var(--ok); border-color:var(--ok) } #g-panel .nav button.pri.undo { background:#fff; color:var(--ink) }
#g-panel .nav .stepno { flex:1.1; text-align:center; font-size:12.5px; color:var(--mut); white-space:nowrap } .stepno b { color:var(--ink); font-size:15px }
.stepno i { display:block; height:5px; background:var(--line); border-radius:3px; margin-top:5px; overflow:hidden } .stepno u { display:block; height:100%; background:var(--acc) }
.phstrip { display:flex; gap:4px; margin:0 0 14px }
.ph { flex:0 0 14px; height:32px; border:0; border-radius:6px; background:#e6e4dd; cursor:pointer; padding:0 } .ph.past { background:#9fd3ad } .ph:hover { filter:brightness(.94) }
.ph.on { flex:1; background:#fff3ea; border:1.5px solid var(--acc); display:flex; align-items:center; justify-content:space-between; gap:8px; padding:0 10px; font:700 11.5px Inter, sans-serif; color:#9a3a06; text-transform:uppercase; letter-spacing:.04em; min-width:0 }
.ph.on span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap } .ph em { display:flex; gap:4px; flex:none }
.ph em i { width:8px; height:8px; border-radius:50%; background:#f0c9ad } .ph em i.p { background:var(--ok) } .ph em i.c { background:var(--acc); outline:2px solid #fbd9c2 }
.stephead { display:flex; gap:12px; align-items:flex-start }
.stephead .num { flex:none; width:46px; height:46px; border-radius:12px; background:var(--ink); color:#fff; font:700 22px Inter, sans-serif; display:grid; place-items:center }
.stephead h2 { font:700 22px/1.2 Inter, sans-serif; margin:2px 0 4px; letter-spacing:-.01em } .why { font-size:14.5px }
#g-panel h3 { font:700 12px Inter, sans-serif; display:flex; align-items:center; gap:8px }
#g-panel h3 .cnt, #g-panel h3 .hint { margin-left:auto; text-transform:none; letter-spacing:0 } #g-panel h3 .hint { font-weight:500 } .cnt.ok { background:#dff2e3; color:var(--ok) }
.task { padding:12px; margin:0 0 8px; border:1.5px solid var(--line); border-radius:12px; gap:12px; font-size:15px; line-height:1.4; background:#fff }
.task:hover { border-color:#b9b6ac } .task input { width:26px; height:26px; margin-top:0 } .task:has(input:checked) { background:#f1f8f2; border-color:#bfdcc3 }
.flags { border-radius:12px; padding:12px 14px; border-width:1.5px } .flags h3 svg { width:18px; height:18px } .flags p { font-size:14px }
.devs .dl { font-size:14px; padding:9px 12px; border-radius:9px }
.fold { margin-top:14px; border:1.5px solid var(--line); border-radius:12px; padding:0 12px } .fold[open] { padding-bottom:12px }
.fold > summary { cursor:pointer; font:600 14px Inter, sans-serif; padding:14px 2px; display:flex; align-items:center; gap:8px; color:var(--ink); margin:0 } .fold > summary .cnt { margin-left:auto }
.wirecta { border-radius:12px; padding:12px }
.btn { min-height:40px; border-radius:10px; font-size:13.5px; padding:0 12px }
.btn.big { display:flex; align-items:center; justify-content:center; gap:10px; height:52px; border-radius:12px; font:700 15px Inter, sans-serif; background:var(--acc); border-color:var(--acc) } .btn.big svg { width:20px; height:20px }
.wcard, .wcard.isdone { border:0; padding:0; background:none }
.wmk { background:var(--ink); color:#fff; border-radius:14px; padding:14px; gap:14px; font-size:14px; margin-bottom:0 } .wcard.isdone .wmk { background:var(--ok) }
.wmk .muted { color:#c3c6cc } .sleeve { font-size:30px; padding:8px 14px; color:#111 } .sw.big { width:26px; height:26px; border:2px solid #fff8 }
.endb { border:1.5px solid var(--line); border-radius:12px; padding:12px; margin-top:10px }
.eh { font-size:19px } .eh .dl { font-weight:700; color:var(--ink); text-decoration:none } .ab { width:30px; height:30px; font-size:15px } .el { font-size:14px; margin-left:38px }
.route { font-size:14px; margin:12px 2px 6px } .route span { font-size:13.5px; padding:3px 7px } .cutb { font-size:14px } .cores { font-size:13.5px }
.wtools select, .search { height:44px; font-size:14.5px; border-radius:10px } .wmprog { font-size:13px }
.wl { padding:10px 8px; font-size:14px; border-radius:8px } .wls { max-height:320px }
.wt { font-size:13.5px } .wt td { padding:9px 5px }
.chip { border-radius:14px; padding:12px 44px 12px 14px; font-size:14px } .chip > b { font-size:20px }
.chip .cb button { min-height:40px; padding:0 12px; font-size:13.5px; border-radius:9px } .chip .x { font-size:20px; width:38px; height:38px; right:3px; top:3px }
.note, .iss p, .part .pd, .facts { font-size:13.5px } .lnk { font-size:14px; padding:6px 0 }
#g-view { position:fixed; left:12px; top:calc(var(--top) + 12px); z-index:4; display:flex; flex-direction:column; flex-wrap:nowrap; gap:4px; background:#ffffffee; border:1px solid var(--line); border-radius:16px; padding:6px; box-shadow:0 6px 20px #00000022 }
#g-view button { width:66px; height:56px; border:0; border-radius:11px; background:none; color:var(--ink); cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; font:600 10.5px Inter, sans-serif; padding:0 }
#g-view button:hover { background:#f1efe9 } #g-view button.on { background:var(--ink); color:#fff } #g-view > i { height:1px; background:var(--line); margin:2px 8px; flex:none }
#g-view2 { position:fixed; left:100px; bottom:14px; z-index:4; flex-wrap:nowrap; background:#ffffffee; border:1px solid var(--line); border-radius:14px; padding:6px 8px; box-shadow:0 6px 20px #00000022 }
#g-view2 button { height:40px; padding:0 13px; border:1px solid var(--line); border-radius:9px; background:#fff; font:600 13px Inter, sans-serif; cursor:pointer; color:var(--ink) } #g-view2 button:hover { border-color:#b9b6ac }
#g-view2 .lbl { background:none; padding:0 4px }
.lab-scale { left:16px !important; bottom:18px !important }
#g-legend { left:100px; bottom:74px; width:270px; font-size:13.5px } #g-legend .lk { padding:7px 6px }
#g-collapse { right:var(--pw); width:22px; height:64px }
.g-tag { font-size:13px; padding:4px 8px } .g-end { font-size:13.5px; padding:5px 9px } .g-end small { font-size:11.5px }
#g-tip { font-size:13.5px; padding:8px 11px }
@media (max-width: 1180px) { #g-top .tprog { display:none } #g-top .modes button { padding:0 10px } #g-top #g-search { margin-left:auto } }
@media (max-width: 980px) { #g-top .modes span { display:none } #g-top .brand span { display:none } }
@media (max-width: 820px) { #g-panel { top:auto; height:52vh; width:auto; left:0; border-left:0; border-top:1px solid var(--line) } #g-view { flex-direction:row; left:8px; right:8px; top:calc(var(--top) + 8px); justify-content:space-between; border-radius:12px; padding:4px } #g-view button { width:auto; flex:1; height:46px } #g-view button span, #g-view > i, #g-view2 { display:none } #g-top #g-search { width:110px } #g-collapse { display:none } #g-legend { bottom:calc(52vh + 10px); left:10px } #g-helpcard .cols { grid-template-columns:1fr } }
@media print { #lab-gl, #g-tags, #g-top, #g-view, #g-view2, #g-legend, #g-helpcard, #g-collapse, #g-panel, #g-tip, .lab-ui { display:none !important } #g-print { display:block; font:11px Inter, sans-serif; color:#000 } #g-print h1 { font-size:18px } #g-print h2 { font-size:14px; margin:14px 0 4px } #g-print table { width:100%; border-collapse:collapse } #g-print th, #g-print td { border-bottom:1px solid #ccc; padding:3px 4px; text-align:left; vertical-align:top } #g-print tr { break-inside:avoid } }
</style>
</head>
<body>
<script>
// Any script error is shown on the page and left where the command-line tools can read it (scripts/audit_headless.mjs,
// scripts/shot.mjs): a guide that failed to load must never look like a blank but healthy page.
(function () {
  function show(msg) {
    var pre = document.getElementById('g-error')
    if (!pre) { pre = document.createElement('pre'); pre.id = 'g-error'; pre.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99;margin:0;padding:14px 18px;background:#b00020;color:#fff;font:13px/1.4 Consolas,monospace;white-space:pre-wrap;max-height:60vh;overflow:auto'; (document.body || document.documentElement).appendChild(pre) }
    pre.textContent += (pre.textContent ? '\\n\\n' : 'THE GUIDE DID NOT LOAD. Script error:\\n') + msg
  }
  addEventListener('error', function (e) { show((e.error && e.error.stack) || (e.message + ' at ' + e.filename + ':' + e.lineno)) })
  addEventListener('unhandledrejection', function (e) { show('Unhandled rejection: ' + ((e.reason && e.reason.stack) || e.reason)) })
})()
</script>
<header id="g-top"><div class="brand"></div><nav class="modes"></nav><div class="tprog"></div><input id="g-search" placeholder="Find a wire or part: B01081, TB1" list="g-sl" title="Type a wire number or a part tag, then Enter"><datalist id="g-sl"></datalist><button data-text title="Larger text, for reading at arm's length">A<b>A</b></button><button data-help title="How to move around and what the keys do (H)">?</button></header>
<div id="g-panel"><div class="chipbar"></div><div class="body"></div><div class="nav"></div></div>
<div id="g-tip"></div>
<div id="g-view"></div><div id="g-view2"></div><div id="g-legend"></div><div id="g-helpcard"></div><button id="g-collapse" title="Hide the side panel for a wider view (P)">›</button><div id="g-print"></div>
<script>window.GUIDE = ${JSON.stringify(GUIDE).replace(/<\//g, '<\\/')}</script>
<script type="module">
${safe(kit)}
</script>
<script type="module">
${safe(guide)}
</script>
</body>
</html>
`
// the file is named after the panel (JOB.panel "VFD-RT00-03" gives "VFD-RT00-03 Assembly Guide.html")
const out = join(here, `${L.JOB.panel.replace(/\s+/g, '')} Assembly Guide.html`)
writeFileSync(out, html)
console.log(`built ${out}  (${(html.length / 1e6).toFixed(2)} MB, ${SEGMENTS.length} wire segments, ${Object.keys(TEX).length} textures, ${Object.keys(MODELS).length} vendor models, ${Object.values(MODELS).reduce((t, m) => t + m.tri, 0)} vendor triangles)`)
