#!/usr/bin/env node
// Builds "VFD200 Assembly Guide.html": one self-contained page (three.js from jsDelivr, everything else inlined).
//   src/layout.mjs        the panel as drawn, the BOM and the build steps
//   src/guide.js          the 3D scene and the guide panel
//   data/wirelist.json    every wire and cable on sheets 4-15 (transcribed from Draft rev18)
//   data/install_docs.json manufacturer documents found on the web, with the install facts read from them
//   data/partslib.json    PartsLib deep links per part number (optional; see tools/partslib_links.py)
//   assets/tex/*.webp     device faces cut from sheets 2 and 3 (tools/extract_textures.py)
//   vendor/lab-kit.js     the studio renderer (Machine Skill kit)
// Run: node build.mjs
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
const viaOf = (note) => { const m = /(?:passes through|via)\s+(TB\d)-(\d+)/i.exec(note ?? '') ?? /->\s*(TB\d)-(\d+)\s*->/.exec(note ?? ''); return m ? [m[1], m[2]] : null }
function stepOf(w) {
  const f = `${w.from.dev} ${w.from.term} ${w.to.dev} ${w.to.term}`
  if (w.sheet >= 9) return 'wfield'
  if (w.sheet === 8) return 'wnet'
  if (w.sheet === 7) return 'w24'
  if (w.sheet === 6) return 'w120'
  if (w.sheet === 5 || /\bS[12]\b|Digital Common|E-STOP|TB4/.test(f)) return 'w24'
  if (/^W(54|19|20)$/.test(w.wire)) return 'w120'
  if (/PWS1 (1|4) \(OUT/.test(f) || /^W(22|23)$/.test(w.wire)) return 'w24'
  return 'w480'
}
// V11 (review of sheets 4-15 against this list, 2026-11-09): sheet 4, lines 0402-0405, draws the incoming feeder (three
// dashed conductors to Q1 1L1, 3L2, 5L3) and the incoming ground conductor (dashed, to GB1 terminal 1). They were never
// in the list, so nothing landed on Q1's line lugs. They are site conductors: no number, no size, no entry point drawn.
const FEED_NOTE = 'Site conductor, by the installer: drawn dashed on sheet 4 with no wire number, no size and no entry point into the enclosure. Shown here as a short tail so its landing is clear.'
// (added after the cables, below, so every existing wire and cable keeps its place in the list and its lane in the ducts)
const FEEDERS = [['L1', '1L1'], ['L2', '3L2'], ['L3', '5L3']].map(([ph, t]) => ({ label: '', awg: null, awgDraw: '4', potential: `Incoming feeder ${ph}, 480Y/277 V`, from: { dev: 'Plant feeder', term: ph }, to: { dev: 'Q1', term: t }, sheet: 4, line: '0403', note: FEED_NOTE, step: 'wfield', feeder: true }))
FEEDERS.push({ label: '', awg: null, awgDraw: '6', potential: 'GND', from: { dev: 'Plant feeder', term: 'ground conductor' }, to: { dev: 'GND BAR', term: '1' }, sheet: 4, line: '0403', note: `${FEED_NOTE} Lands on GB1 terminal 1, the first tap, as drawn.`, step: 'wfield', feeder: true })
let n = 0
for (const w of WL.wires) {
  const base = { label: w.wire || '', awg: w.awg, potential: w.potential, sheet: w.sheet, line: w.line, note: w.note || '', inferred: !!w.inferred, step: stepOf(w) }
  const via = viaOf(w.note)
  if (via && w.from.dev !== via[0] && w.to.dev !== via[0]) {
    // V11: through TB5 the drawings put the wire number on the door side only (W24, W25 on sheet 5, W102 on sheet 8); the
    // drive or IO1 side of the terminal is drawn without a number. V10 printed the number on both.
    // V13 (rev20): the only wire still drawn this way is the E-STOP lamp wire W96 through TB4-1 (sheet 8; rev18: W102, TB5-5)
    const noNum = via[0] === 'TB4' && base.label
    SEGMENTS.push({ ...base, label: noNum ? '' : base.label, id: `s${n++}`, from: w.from, to: { dev: via[0], term: via[1] }, note: `${base.note}${base.note ? ' ' : ''}(Segment 1 of 2: to ${via[0]}-${via[1]}.${noNum ? ` No number on the drawing: ${base.label} is the door side of ${via[0]}-${via[1]}.` : ''})` })
    SEGMENTS.push({ ...base, id: `s${n++}`, from: { dev: via[0], term: `${via[1]}:field` }, to: w.to, note: `${base.note}${base.note ? ' ' : ''}(Segment 2 of 2: from ${via[0]}-${via[1]}.)` })
  } else SEGMENTS.push({ ...base, id: `s${n++}`, from: w.from, to: w.to })
}
// RCP1: the 1492-REC15 has one line/neutral/ground terminal block that feeds both outlets (Rockwell's 1492-REC 3D model;
// 1492-TD015 p.51 photo). Sheet 6's two jumpers between "L1-x" and "L2-x" have nothing to land on: they are not fitted.
for (const s of SEGMENTS) if (s.from.dev === 'RCP1' && s.to.dev === 'RCP1') { s.notFitted = true; s.note = `${s.note ? s.note + '. ' : ''}NOT FITTED: the 1492-REC15 feeds both outlets from its single L/N/G terminal block (Rockwell 1492-REC model), so this jumper is not needed.` }
// V9: Q1 to FU1 (W1-W3 on sheet 4). FU1 is the 1494U-F100 trailer fuse block: the fuses clip into the switch's load side
// and into the block (1494U-IN001 p.10), so there is no conductor to cut, mark or land.
for (const s of SEGMENTS) {
  if (s.notFitted) s.nfWhy = 'not fitted: the 1492-REC15 feeds both outlets itself'
  if ([s.from.dev, s.to.dev].sort().join() === 'FU1,Q1') { s.notFitted = true; s.nfWhy = 'not a wire: the LPJ-70SP fuse is the link from Q1 to FU1'; s.note = `${s.note ? s.note + '. ' : ''}NOT A WIRE: FU1 is a trailer fuse block. The fuse clips into the switch's load side and into the block, 113.0 mm below (1494U-IN001 p.10), and is the connection sheet 4 numbers ${s.label}.` }
}
// V12 (Bob left the sheet 5 junctions to this guide's judgment): W24 and W25 meet the DRV2 runs at junction dots on the
// way to E-STOP 12 and 21. A junction is made at a terminal, and the terminal strip is where it belongs: W24 is a jumper
// from TB5-1 to TB5-3 and W25 from TB5-2 to TB5-4, on the door side of the strip, and one conductor from TB5-3 and one
// from TB5-4 go to the door. V11 ran all four to the E-STOP: two wires under each contact screw and four conductors
// across the hinge where two do the job. Each numbered wire now runs between the two points the drawing connects it to.
// V13 (Draft rev20): the strip is now TB4 (TB4-2..5) and every segment but the last leg to the E-STOP has a number. W24, W26,
// W48 and W50 run from the drives to the drive side of TB4-2..5. On the door side, W25 (from TB4-2) meets W49 (from TB4-4) at
// a junction dot and one unnumbered leg goes on to E-STOP 12; W27 (TB4-3) meets W51 (TB4-5) the same way for E-STOP 21. The
// same reading as V12 (the junctions are made on the strip), now with sheet 15 to say on which terminals: rev20 sheet 15
// puts E-STOP 12 on TB4-2 and E-STOP 21 on TB4-3, and links TB4-2 with TB4-4 and TB4-3 with TB4-5. So W25 and W27 are the
// two conductors from TB4-2 and TB4-3 to the door (the drawing's unnumbered leg is their far end), and W49 and W51 are the
// jumpers from TB4-4 to TB4-2 and from TB4-5 to TB4-3, on the door side where sheet 5 draws them.
for (const s of SEGMENTS) {
  if (!/^W(25|27|49|51)$/.test(s.label) || s.from.dev !== 'TB4') continue
  const n = s.from.term
  s.from = { dev: 'TB4', term: `${n}:field` }
  if (s.label === 'W49' || s.label === 'W51') {
    const t = s.label === 'W49' ? '2' : '3', es = s.label === 'W49' ? '12' : '21', other = s.label === 'W49' ? 'W25' : 'W27'
    s.to = { dev: 'TB4', term: `${t}:field` }
    s.note = `Jumper on the door side of TB4, from TB4-${n} to TB4-${t} (sheet 15 links these two terminals): this is where the junction sheet 5 draws between ${s.label} and ${other} is made. It shares the TB4-${t} clamp with ${other}, which goes on to E-STOP ${es} (two 16 AWG conductors in one 1492-J4 clamp). Engineering to confirm (Design issues).`
  } else {
    const es = s.label === 'W25' ? '12' : '21', other = s.label === 'W25' ? 'W49' : 'W51'
    s.note = `From the door side of TB4-${n} to E-STOP ${es} (sheet 15: E-STOP ${es} is on TB4-${n}). Sheet 5 puts the number ${s.label} on the stretch from TB4-${n} to the junction with ${other} and leaves the last leg to the E-STOP unnumbered; with the junction made at TB4-${n} this is one conductor, marked ${s.label}. Engineering to confirm (Design issues).`
  }
}
// V11 (Bob: the T1 H3-H2 wire is screwy): sheet 4 draws an unnumbered red jumper between primary taps H2 and H3, the 480 V
// connection. On the transformer they are neighbouring screws on the primary board (H1 H3 H2 H4), joined by the flat
// metal link supplied with it, not by a wire. V10 drew a wire that ran 70 mm down past the transformer and back.
for (const s of SEGMENTS) if (s.from.dev === 'T1' && s.to.dev === 'T1') { s.link = true; s.label = s.label || 'T1 link'; s.note = `${s.note ? s.note + '. ' : ''}Fitted as the flat jumper link supplied with the transformer, under the H3 and H2 screws (480 V connection). Nothing to cut or mark. If the transformer came without its links, make it a short 14 AWG jumper and tell engineering.` }
const tbTerm = (s) => { const m = /(TB\d)-(\d+)\s*(\((T|B)\))?/.exec(s ?? ''); return m ? { dev: m[1], n: m[2], lvl: m[4] } : null }
for (const c of WL.cables) {
  const t = String(c.type ?? '')
  if (/Ethernet/i.test(t)) {
    SEGMENTS.push({ id: `s${n++}`, kind: 'eth', label: c.cable, awg: null, potential: 'Ethernet', sheet: c.sheet, from: c.from, to: c.to, note: c.note || 'RJ45 patch cord (type not specified)', step: 'wnet' })
    continue
  }
  const core = c.cores[Math.floor(c.cores.length / 2)] ?? c.cores[0] ?? {}
  const iol = /A1021803/.test(t)
  const end = (dev, termStr, field) => {
    const tb = tbTerm(termStr)
    if (tb) return { dev: tb.dev, term: `${tb.n}${tb.lvl ? ` (${tb.lvl})` : ''}${field ? ':field' : ''}` }
    return { dev, term: termStr }
  }
  let from, to
  if (iol && c.from.dev === 'TB4') { from = end('TB4', core.term_from, false); to = { dev: c.to.dev, term: core.term_to } }
  else if (iol && c.from.dev === 'VM1') { from = { dev: 'VM1', term: core.term_from }; to = { dev: c.to.dev, term: core.term_to } }   // V13 (rev20): VM1's cable goes straight to CPL2 X08
  else if (/^TB/.test(c.from.dev)) { from = end(c.from.dev, core.term_from, true); to = { dev: c.to.dev, term: core.term_to } }
  else { from = { dev: c.from.dev, term: core.term_from }; to = end(c.to.dev, core.term_to, true) }
  const cores = c.cores.map((k) => `${k.potential ?? ''}: ${k.term_from} → ${k.term_to}${k.color ? ` (${k.color})` : ''}`).join('; ')
  // every core lands on its own terminal: keep them, with the M12/IO-Link pin number (potential "IOLn-p" -> p)
  const anl = /PLTC/.test(t)
  const coreList = c.cores.map((k, i) => {
    const pin = Number(/-(\d)$/.exec(k.potential ?? '')?.[1] ?? /^(\d)$/.exec(String(k.term_from))?.[1] ?? 0) || null
    const a = /^TB/.test(c.from.dev) || /TB\d-/.test(k.term_from) ? end(c.from.dev === 'TB4' || c.from.dev === 'TB3' ? c.from.dev : 'TB4', k.term_from, !(iol && c.from.dev === 'TB4')) : { dev: c.from.dev, term: k.term_from }
    // V5: a shield whose far end is "GND BAR" lands on the ground bar (V4 put it on TB3-1), and the analog cores take the
    // colour the wire list gives them (V4 swapped white and black)
    const b = /TB\d-/.test(k.term_to) ? end(c.to.dev, k.term_to, true) : /GND BAR/i.test(k.term_to ?? '') ? { dev: 'GND BAR', term: `${c.cable} shield` } : { dev: c.to.dev, term: k.term_to }
    // V8: an IO-Link cable's three cores land on one port, pin = the core's own number (potential IOLn-p). Sheet 11 prints
    // CBL-IOL-09's L- and C/Q cores on "X03-1" and "X04-1" (a copy error: design issue), which are ports 3 and 4's L+ pins.
    // V7 drew them as printed, across two other ports' plugs. They land on X01-3 and X01-4, with the printed name kept.
    const port0 = /^(X0\d)-\d$/.exec(c.cores[0]?.term_to ?? '')?.[1], mt = /^(X0\d)-(\d)$/.exec(k.term_to ?? '')
    if (iol && /^CPL/.test(c.to.dev) && port0 && mt && pin && mt[1] !== port0) { b.term = `${port0}-${pin}`; b.printed = k.term_to }
    const anlCode = /white/i.test(k.color ?? '') ? 'WH' : /black/i.test(k.color ?? '') ? 'BK' : /shield|drain/i.test(k.color ?? '') ? 'SH' : (i === 0 ? 'BK' : i === 1 ? 'WH' : 'SH')
    return { from: a, to: b, pin, potential: k.potential ?? '', color: k.color ?? null, anl: anl ? anlCode : null }
  })
  SEGMENTS.push({ id: `s${n++}`, kind: iol ? 'iol' : 'field', label: c.cable, awg: iol ? '3×18' : anl ? '2×18 sh' : null, potential: c.cores.map((k) => k.potential).filter(Boolean).join(' / '), sheet: c.sheet, from, to, cores: coreList, cableType: t, note: `${c.note ? c.note + '. ' : ''}Cores: ${cores}`, step: iol ? 'wnet' : 'wfield' })
}

for (const f of FEEDERS) SEGMENTS.push({ ...f, id: `s${n++}`, inferred: false })
// ADDED: conductors the guide adds at someone's request that are on no sheet. They are not in data/wirelist.json (that
// file is the record of the drawings). First confirm on the sheets that both terminals are free. Each one needs:
//   - a comment here saying who asked (a name or a role) and the date
//   - `added: true`, and a note that begins "NOT ON THE DRAWINGS"
//   - `sheet`: the sheet whose step it is wired with; `step`: that step's id
//   - no invented wire number or potential number (label '', a potential that says what it is in words)
//   - a design issue asking engineering to add it to the sheets and number it; if an existing issue already describes
//     the gap, rewrite that one rather than leaving two that disagree
//   - a task and a flag on its step, added to L.STEPS right below (not in src/layout.mjs, which is the panel as drawn)
// They go last, after the feeders, so every existing segment keeps its id, its saved tick and its lane in the ducts.
//   { label: '', awg: '14', potential: '120 V AC from TB2-1 (not numbered)', from: { dev: 'TB2', term: '2' },
//     to: { dev: 'XX1', term: 'L' }, sheet: 6, line: '', step: 'w120', added: true, note: 'NOT ON THE DRAWINGS. ...' }
const ADDED = []
for (const a of ADDED) SEGMENTS.push({ ...a, id: `s${n++}`, inferred: false })
// tasks and flags for added conductors, for example:
//   { const st = L.STEPS.find((s) => s.id === 'w120'); st.tasks = [...st.tasks, 'NOT ON SHEET 6: ...']; st.flags = [...(st.flags ?? []), '...'] }

// ---------------------------------------------------------------- reference documents per BOM part number
const DOCS = {}
const docsRaw = existsSync(join(here, 'data/install_docs.json')) ? JSON.parse(rd('data/install_docs.json')) : []
for (const b of L.BOM) {
  const hits = docsRaw.filter((e) => { const p = `${e.part} ${(e.tags ?? []).join(' ')}`; return p.includes(b.pn) || (b.pn.startsWith('VTUX') && p.includes('VTUX')) || (b.pn.startsWith('MS4') && p.includes('MS4')) || (b.pn.startsWith('MS6') && p.includes('MS6')) })
  const web = [], facts = []
  for (const e of hits) for (const d of e.docs) {
    if (!d.url || /Not (read|fetched)/.test(d.key_install_facts ?? '') && !d.verified && d.kind === 'product page') continue
    if (d.doc_number && web.some((w) => w.doc_number === d.doc_number)) continue
    web.push({ title: `${e.manufacturer ?? ''} ${d.kind}`.trim(), doc_number: d.doc_number ?? '', url: d.url, verified: !!d.verified })
    if (d.verified && d.key_install_facts && !/^Not /.test(d.key_install_facts) && d.kind !== 'product page') facts.push(`${d.doc_number || d.kind}: ${d.key_install_facts}`)
  }
  web.sort((a, z) => Number(z.verified) - Number(a.verified))
  DOCS[b.pn] = { web: web.slice(0, 4), facts: [...new Set(facts)].slice(0, 3) }
}
if (existsSync(join(here, 'data/partslib.json'))) {
  const pl = JSON.parse(rd('data/partslib.json'))
  for (const [pn, links] of Object.entries(pl)) if (!pn.startsWith('_')) (DOCS[pn] ??= { web: [], facts: [] }).partslib = links
}
// facts read from the PartsLib copies come first (PartsLib is the reference the shop uses)
if (existsSync(join(here, 'data/install_facts.json'))) {
  const f = JSON.parse(rd('data/install_facts.json'))
  for (const [pn, list] of Object.entries(f)) if (!pn.startsWith('_')) { const d = (DOCS[pn] ??= { web: [], facts: [] }); d.facts = [...list, ...d.facts.filter((x) => !list.some((y) => y.slice(0, 12) === x.slice(0, 12)))].slice(0, 5) }
}

// ---------------------------------------------------------------- real envelopes from PartsLib records (data/partslib_records.json)
const REC = existsSync(join(here, 'data/partslib_records.json')) ? JSON.parse(rd('data/partslib_records.json')) : {}
for (const d of L.DEVICES) {
  const r = REC[d.pn]
  if (r?.d && !d.strip) { d.depth = d.rail ? +(r.d - 7.5).toFixed(1) : r.d; d.depthNote = `PartsLib record: ${r.dsrc ?? 'depth'}`; d.depthFrom = 'partslib' }
  if (r) d.rec = r
}
// ---------------------------------------------------------------- V10: every fuse is a part of its own
// (Bob: all fuses listed as a selectable part; best approximation for T1's.) guide.js draws each one in its holder.
const fitLast = 'Fitted last, after testing (step 21).'
for (const f of [
  { tag: 'FU1-L1', pn: 'LPJ-70SP', step: 'power', note: `Class J, 70 A. Bridges Q1's L1 pole to FU1 (trailer fuse block). ${fitLast}` },
  { tag: 'FU1-L2', pn: 'LPJ-70SP', step: 'power', note: `Class J, 70 A. Bridges Q1's L2 pole to FU1 (trailer fuse block). ${fitLast}` },
  { tag: 'FU1-L3', pn: 'LPJ-70SP', step: 'power', note: `Class J, 70 A. Bridges Q1's L3 pole to FU1 (trailer fuse block). ${fitLast}` },
  { tag: 'FU2-F', pn: 'FNQ-R-6', step: 'rail1', note: `Class CC, 6 A, in FU2's pull-out carrier (seen through the window on its front). ${fitLast}` },
  { tag: 'T1-F1', pn: 'FNQ-R-3-1/2', step: 't1', note: 'T1 primary fuse, H1 side (line 1L1). Sheet 4: class CC, 3.5 A. Not in the BOM: the part number is this guide\'s approximation.' },
  { tag: 'T1-F2', pn: 'FNQ-R-3-1/2', step: 't1', note: 'T1 primary fuse, H4 side (line 3L2). Sheet 4: class CC, 3.5 A. Not in the BOM: the part number is this guide\'s approximation.' },
  { tag: 'T1-F3', pn: 'FNM-10', step: 't1', note: 'T1 secondary fuse (X2, wire 2T1). Sheet 4: midget, 10 A. Not in the BOM: the part number is this guide\'s approximation.' },
]) L.DEVICES.push({ ...f, at: 'fuse' })
for (const b of L.BOM) { if (b.pn === 'LPJ-70SP') b.where = 'FU1-L1 / FU1-L2 / FU1-L3'; if (b.pn === 'FNQ-R-6') b.where = 'FU2-F' }
L.BOM.push(
  { pn: 'FNQ-R-3-1/2', mfr: 'Eaton Bussmann (approximation)', cls: 'Fuse', qty: '2', where: 'T1-F1 / T1-F2', desc: 'NOT IN THE BOM. Class CC time-delay fuse, 3.5 A, 600 V, 10.3 x 38 mm, for T1\'s two-pole primary fuse block. Sheet 4 gives the class and the rating; the part number is this guide\'s approximation: confirm before ordering', sheet: 4 },
  { pn: 'FNM-10', mfr: 'Eaton Bussmann (approximation)', cls: 'Fuse', qty: '1', where: 'T1-F3', desc: 'NOT IN THE BOM. Midget time-delay fuse, 10 A, 250 V, 10.3 x 38 mm, for T1\'s secondary fuse block. Sheet 4 gives the type and the rating; the part number is this guide\'s approximation: confirm before ordering', sheet: 4 },
)
{ const st = L.STEPS.find((s) => s.id === 't1'); if (st) st.parts = [...(st.parts ?? []), 'FNQ-R-3-1/2', 'FNM-10'] }
const T = await import(pathToFileURL(join(here, 'src', 'terminals.mjs')).href)

// ---------------------------------------------------------------- issues
// Design issues: for the engineer who drew the panel. Modeling issues: how this guide models what the drawings leave open,
// with what was done about each one.
const DESIGN_ISSUES = [
  'Subplate 1 is drawn 1118 x 1422 mm (44.0 x 56.0 in), but the enclosure\'s subpanel studs are 45.25 in apart across and 54.25 in up and down (Saginaw SCE-60XEL4918SSST drawing, rear view). A 44 in plate does not reach the outer studs. Confirm the subpanel size (Saginaw\'s matching subpanel) or add mounting bars.',
  'Rails 3 and 4 do not fit as drawn. Sheet 3 (rev20) draws NS2 overlapping NS1 by 1.5 mm and the AL1920s overlapping by 2.6 mm; an AL1920 is 50 mm wide (ifm 80281466 p.8). At real widths NS1 to PWS1 runs from 391 to 717 mm and still fits before the 734 mm rail end: move the end anchor to 718 mm. On rail 4 the six isolators are drawn at 20.5 mm pitch; a GLG is 22.5 mm wide (PartsLib), so the row runs from 124 to 259 mm, not 253 mm. TB1 is drawn 32 mm long; six 1492-J6 are 48.6 mm (989 to 1038 mm), which still fits before the rail end at 1051 mm.',
  'Isolator terminal numbering is not shown on the drawings, and the GLG-1xmA-1xmA has no manufacturer document. The wire list uses 3/4 (AOut), 9/10 (AIn) and 15/16 (Com/24V). V6 takes the numbering from the isolators\' own labels in the shop photos (2026-11-05): 5-8 outer top, 1-4 inner top, 9-12 inner bottom, 13-16 outer bottom. V5 had the two top rows swapped. Put the numbering on the drawings.',
  'Wire numbers not used in Draft rev20: W18, W46, W53, W55, W60, W61, W64, W66, W95, W99, W122-W127. Conductors still without a number: the two legs from the sheet 5 junctions to E-STOP 12 and 21, IO1 OUT 0 to TB4-1, the E-STOP 11-22 jumper, the two RCP1 jumpers, the ACU, CE1 and motor grounds, and the T1 H2-H3 link.',
  'No AWG printed for W26 and W48 (sheet 5), or for the two unnumbered legs to E-STOP 12 and 21. This guide draws them 16 AWG, like the rest of the safe-off circuit.',
  'Wire colours are not specified anywhere in the set. This guide follows NFPA 79 13.2.4: confirm or give the shop standard.',
  'Sheet 7: W87 is labelled "IO1" but its cross reference (0826) and sheet 8 put it on the E-STOP lamp X2.',
  'Sheet 7/8: W69, W76 and NS1 port 5 read "HM1" for HMI1.',
  'Sheet 11 (rev20), lines 1148-1151: the three CPL2 terminals that TT2\'s cable EVT005-06 lands on have no names printed. By position they are port 1: this guide lands the cable on X01-1, X01-3 and X01-4. Print the terminal names.',
  'Sheets 10 and 11: VM1\'s cable CBL-IOL-01 lands VM1 pin 5 (C/Q) on CPL2 X08-3 and VM1 pin 4 (L-) on X08-4. The AL1920 manual (ifm 80281466 p.5) has pin 3 = L- and pin 4 = C/Q, so the VM1 port is reversed. Rev20 renamed the two potentials (IOL16-3, IOL16-4) but left the landings as they were. This guide shows it as drawn: confirm before power is applied.',
  'EVC001 core colours disagree: EVC001-01 prints white on L- and blue on IO-Link; EVC001-02 brown on L+, white on L-, blue on IO-Link; EVC001-03 brown on L- and white on IO-Link.',
  'Sheet 15 (rev20) does not agree with sheets 4, 5 and 6. TB2: it shows RCP1 on both sides of TB2-3, and GB1-2 and T1-X1 on TB2-4, and shows nothing for CB5, FU2, the ACU or T1\'s 2T1; sheets 4 and 6 put T1 X1 (W19) and RCP1 (W65) on TB2-3 and the ACU neutral (W63) on TB2-4. TB4: it draws the 2-4 and 3-5 links on the interior side and leaves out the drives\' S1/S2; sheet 5 draws the links on the door side. This guide wires TB2 from sheets 4 and 6, and takes from sheet 15 only which TB4 terminals the E-STOP conductors leave from (TB4-2 and TB4-3).',
  'Sheet 4: W17 carries potential L16 where the other PDB1 outputs are named after their terminal (L3-x). T1\'s primary and secondary fuse terminals are both labelled 1L1/2T1.',
  'Sheet 4: W20 (ground/neutral bond, now 14 AWG) lands on a junction dot on the N conductor, not on a terminal. Rev20 sheet 15 puts "GB1 - 2" on TB2-4: if that is where the bond is made, draw it there on sheet 4.',
  'Sheet 6 draws RCP1 with four terminals (L1-1, L2-1, L1-2, L2-2), hot on L2-1 and L1-2, neutral on L1-1 and L2-2, and two jumpers between the outlets. The 1492-REC15 has one L/N/G terminal block feeding both outlets (Rockwell\'s 1492-REC 3D model; the 1492-TD015 p.51 photo shows the block at the top). This guide lands hot (CB5 T1) on L, neutral (W65) on N and ground (W62) on G, and leaves the two jumpers out. Correct sheet 6 to match the device.',
  'NEW (V5) Sheet 3 draws IO1 (1769-OW16) 34.6 mm wide, as a single-wide module. The OW16 is 1.5-wide: 118 x 87 x 52.5 mm (1769-IN062 p.14; Rockwell\'s CAD for it is the wide I/O case, 1769-IO_CASE_15 and 1769-IO_wide.dwg). At its real width IO1 runs to 312 mm, the 1769-ECR end cap to about 328 mm, and the end anchor after it moves 18 mm right, to 333 mm; the gap before NS1 (at 390 mm in rev20) takes it. Correct sheet 3.',
  'NEW (V6) Sheet 3 draws PWS2 (1769-PB2) left of PLC1 (1769-L30ER). The panel is built PLC1, PWS2, IO1 from the left (shop photos 2026-11-05; the subplate tags read in that order), and Rockwell requires the CompactLogix 5370 controller to be the leftmost module. Correct sheet 3: PLC1 from 135 mm, PWS2 from 190 mm.',
  'GB2 has no position on sheet 3; the A/C and subplate 2 have none on any sheet (this guide puts them on the left side wall). Confirm all three. (RCP1 is drawn on sheet 3 in rev20, between TB4 and CB5: that one is closed.)',
  'Spare isolators SI3-SI6 have no 24 V/Com power; TB3-5, 7, 10 and 12 have no field side.',
  'The air conditioner\'s tag on sheet 6 reads "Panel" (label ACU).',
  'BOM: 7 GLG isolators for 6 tags; GB1/GB2 in the BOM but the drawings only say "GND BAR"; Recpt-2 appears on no drawing. The "GLG-1xmA-1xmA" isolator is a generic DIN unit with no manufacturer documentation (the BOM names Eaton Bussmann). NEW (V13) 1492-J4: the rev20 BOM lists 8, sheet 15 draws 9 (TB2 four, TB4 five). 1492-EAJ35: still 21, with ten drawn on sheet 3. No patch cord is listed for Cable3 (plant network to NS2).',
  'BOM: SCE-16P14 (subplate 2) is Saginaw\'s 15 x 13 in subpanel for its 16 x 14 in enclosures (AutomationDirect cut sheet). It works as a flat plate on the side wall but needs its own mounting: confirm.',
  'BOM: only C2WH6 covers; the 3 in duct needs C3WH6. One LPJ-70SP for a 3-pole fuse block. No T1 fuses (2 x 3.5 A class CC, 1 x 10 A midget, sheet 4), floor stand, field entries (hubs, glands or gland plate: the Saginaw enclosure has only floor-kit provisions in its bottom), door bonding straps or E-STOP legend plate.',
  'NEW (V13) Sheet 3 (rev20) now lines FU1\'s poles up with Q1\'s (47 mm from the plate edge) and prints "Z = 113 mm per manual", which is how this guide has placed the trailer fuse block since V9 (1494U-IN001 p.10: DIM Z 4.449 in for 100 A, 600 V, class J). But the picture of FU1 on sheet 3 overlaps the picture of Q1 and sits about 60 mm higher than this guide places it, and the 113 mm dimension is drawn between two points inside the two pictures. This guide keeps the block where a 117.6 mm LPJ-70SP fuse reaches from the switch\'s load clips to the block\'s clips. Say on sheet 3 which two points Z is measured between.',
  'Eaton FAZ-NA p.6: "Eaton does not recommend the use of wire ferrules". CB3 and CB5 conductors go in bare; say so on the drawings if the shop standard is ferrules everywhere.',
]
DESIGN_ISSUES.unshift('Sheet 4 draws Q1 to FU1 as three 4 AWG conductors, W1-W3. FU1 (1494U-F100) is the trailer fuse block for the 1494U-D100 switch: it mounts under the switch at DIM Z, and the fuses themselves bridge from the fuse clips on the switch\'s load side to the clips on the block (1494U-IN001 p.10, in PartsLib; the shop photos show the clip plates on the switch). There is nothing to land W1-W3 on. This guide leaves them out and draws the three fuses. Rev20 still draws W1-W3 on sheet 4. Correct sheet 4, and order three LPJ-70SP (the BOM lists one).')
DESIGN_ISSUES.unshift(
  'Sheet 4, lines 0402-0405: the incoming feeder (three conductors to Q1 1L1, 3L2, 5L3) and the incoming ground conductor (to GB1 terminal 1) are drawn dashed with no wire number, no size and no entry point into the enclosure. Give the feeder and ground sizes, and say where they enter (the disconnect is at the top right; the Saginaw enclosure has floor-kit provisions only).',
  'NEW (V13) Sheet 5 (rev20), lines 0523-0582: the safe-off wiring is redrawn through TB4-2 to TB4-5 and numbered. W24, W26, W48 and W50 run from the drives to the terminals. On the other side W25 (from TB4-2) meets W49 (from TB4-4) at a junction dot, and one unnumbered leg goes on to E-STOP 12; W27 (TB4-3) meets W51 (TB4-5) the same way for E-STOP 21. A junction has to be made at a terminal. This guide makes it on the strip, on the terminals sheet 15 gives the E-STOP: W25 runs from TB4-2 to E-STOP 12 and W27 from TB4-3 to E-STOP 21, and W49 and W51 are jumpers from TB4-4 to TB4-2 and from TB4-5 to TB4-3, on the door side. One wire under each E-STOP contact screw, two safety conductors to the door. Confirm, give the last leg a number or say it is W25/W27, and print the sizes of W26 and W48.',
  'Sheet 12: the cross references printed beside SC5 and SC6 (1213-1220) point into the SC3 block, and those beside CPL3 (1251-1275) do not match either. Rev20 did not correct them.',
  'Sheet 8, about line 0825: IO1 terminal VAC-VDC 2 (the supply for OUT 8-15) is drawn with no conductor. Nothing uses OUT 8-15 today; it will need a feed if they are ever used.',
)
DESIGN_ISSUES.unshift(
  'NEW (V13) Draft rev20 renumbers most wires. W24, W25, W56-W59, W62, W63, W65, W67-W94, W96-W98 and W100-W121 now name different conductors than in rev18 (for example W62 was TB2-1 to CB5 and is now the RCP1 ground). Any markers, cut lists or wires already made to rev18 or to guide V12 are wrong for this revision: withdraw them. The revision block on every sheet still reads "A" with no description, so nothing on the drawings says they changed.',
  'NEW (V13) Sheet 2 (rev20) moves HMI1 and the E-STOP from the left door to the right door. The right door hinges on the removable centre post (Saginaw SCE-60XEL4918SSST drawing), so the door wiring (HMI1 24 V, 0 V, ground and Ethernet; five E-STOP conductors) has to cross to the door at the centre post, or loop from the handle side, and no route is drawn. This guide brings it forward from the duct below the drives at the centre post and across at the hinge edge. Say how the door loop is run and supported. Cable6 is listed as a 10 ft patch cord.',
  'NEW (V13) Sheets 11 and 12 (rev20) delete the 72-terminal strip and the 24 internal IO-Link cables: the 20 field cables (EVT005, EVT002, EVC001, EVC094) now land straight on the CPL1, CPL2 and CPL3 port plugs on rail 3. They have to come up from the floor through the bottom duct, a riser and the duct between rails 3 and 4, and the drawings show no entry, gland plate, strain relief or route for them, and no ferrule or strip length for the open ends. CPL3 ports X05 to X08 are now unwired.',
  'NEW (V13) Sheet 3 (rev20): Q1 and FU1 are 47 mm from the right edge and PDB1 20 mm, so FU1\'s load lugs are about 22 mm to the right of PDB1\'s line lugs and, with FU1 at Z = 113 mm, only about 75 mm above them. W4, W5 and W6 (4 AWG) have to make that offset in that height: a tight set for 4 AWG. Line PDB1 up under FU1, or lower it.',
  'NEW (V13) The subplate was part-built to rev18 (shop photos 2026-11-05). Rev20 moves TB1 from rail 1 to rail 4, CB3/CB2/CB1 along rail 1, NS1 and NS2 to rail 3, SI1-SI4 to rail 4, Q1 and FU1 about 30 mm right and 33 mm down, and the door devices to the other door. Confirm the shop is to rework what is built.',
)
DESIGN_ISSUES.unshift(
  'NEW (V14) The drawings give no datums and no tolerances for locating parts. This guide measures everything on subplate 1 from its top left corner (datum A the plate face, B the top edge, C the left edge: the corner sheet 3 dimensions from) and proposes three position tolerances: a 1 mm circle (±0.5 mm) for Q1, FU1 and the door cutouts, 3 mm (±1.5 mm) for ducts, rails and plate-mounted parts, and 6 mm (±3 mm along the rail) for DIN-rail parts. Confirm them or give the shop standard, and say whether the top left corner is the corner to work from once the plate is on its studs.',
  'NEW (V14) Sheet 3 dimensions the ducts, the rail ends and a few parts (Q1, FU1, Lug1, GB1, PDB1), but not the mounting holes of any plate-mounted part, the rail centre lines, or where each part sits along its rail. This guide takes those from the pictures on sheet 3, which are drawn to scale (1118 x 1422 mm over 505.68 x 643.56 pt: checked against the printed 20 mm at PDB1, 60 and 20 mm at Lug1 and the 130 mm width of a drive), so they are good to about 1 mm, not exact. Add ordinate dimensions and hole patterns to sheet 3.',
)
const MODELING_ISSUES = [
  { status: 'resolved', text: 'V14 The guide showed where each part goes only as a picture and as a few numbers in the step text.', how: 'Locate: every duct, rail, rail part, plate part and door cutout has its position from the same two edges (across from the left edge, down from the top edge), as a table on each mounting step, a card on each part, a mark-out drawing per step (panel, full screen and print), a CSV, and on the 3D panel itself: the two datum edges lit, a tape along each rail with a number at every part, and leaders to a selected part. The numbers are read back from the 3D model, so the picture and the numbers cannot disagree.' },
  { status: 'resolved', text: 'V14 Parts were up to 8 mm too far left and 10 mm too high towards the right and bottom of subplate 1 (V1 to V13).', how: 'The device pictures on sheet 3 were scaled at 1118 mm per 510 pt from (404, 50) pt. The plate is drawn 505.68 x 643.56 pt from (404.76, 51.24): 0.85 % larger across and 0.8 % down. Every picture-derived position is corrected. Checks against the sheet: PDB1 is now 20.0 mm from the right edge (printed 20), Lug1 61 mm down and 20 mm right of duct D4 (printed 60 and 20), a drive 130.5 mm wide (real 130), T1 162 mm (real 162), and rail parts sit on their rail centre lines (they were 2 to 7 mm above them). Ducts and rails always came from the printed dimensions and did not move.' },
  { status: 'open', text: 'V14 Mounting hole patterns are not in the guide.', how: 'Plate-mounted parts are located by their outline (and by sheet 3\'s printed dimensions where it has them: Q1, FU1, Lug1, GB1, PDB1). The hole patterns have to come from each maker\'s instruction, linked on the part. Next step: read them into the guide with citations.' },
  { status: 'open', text: 'V14 The tolerances shown are this guide\'s proposal.', how: 'No tolerance or datum is on the drawings (Design issues). The three classes are marked as proposed wherever they appear.' },
  { status: 'resolved', text: 'V13 The drawing set changed: Draft rev20 replaces Draft rev18, which V1 to V12 were built from.', how: 'Every sheet of rev20 was compared with rev18 (pixel comparison, then four independent readers on sheets 4 to 18), and the guide rebuilt to rev20. Door: HMI1 and the E-STOP on the right door at the new dimensions. Subplate: Q1, FU1 and Lug1 moved; rail 1 is FU2, CB3, CB2, CB1; NS1 and NS2 on rail 3; SI6 to SI1 on rail 4; TB1 at the right end of rail 4; RCP1 where sheet 3 now draws it. Wiring: 123 wires and 37 cables as in rev20, with its wire numbers; the 72-terminal strip and its 24 internal cables are gone and the field IO-Link cables land on the IO-Link masters; the old TB5 is TB4. Parts list as the rev20 BOM. The new wire list was then read against sheets 4 to 14 again by two more readers.' },
  { status: 'open', text: 'V13 FU1 sits about 60 mm lower than the picture on rev20 sheet 3.', how: 'The guide keeps FU1 where V9 put it relative to Q1: poles in line, the block where the LPJ-70SP fuses reach it (1494U-IN001 p.10, Z = 113 mm; shop photos). Rev20 prints the same Z but its picture overlaps Q1. Listed for engineering; it closes when the Z reference points are confirmed.' },
  { status: 'open', text: 'V13 W4, W5 and W6 (4 AWG, FU1 to PDB1) bend tighter than the audit allows (radius 7 to 7.7 mm on an 8.6 mm wire).', how: 'This is the geometry rev20 draws: FU1 is 22 mm to the right of PDB1 and close above it. The wires are drawn as they would have to be formed. Listed for engineering (Design issues).' },
  { status: 'open', text: 'V13 The door wiring route to the right door is this guide\'s assumption.', how: 'The wires leave the duct below the drives at the centre post and cross to the door at its hinge edge. No route is drawn; the lengths on the HMI1 and E-STOP wire cards depend on it.' },
  { status: 'resolved', text: 'V13 The field IO-Link cables were shown ending on the field side of a terminal strip.', how: 'They are shown landing on the CPL port plugs (pins 1, 3, 4), each core in its own opening, and leaving through the floor. They are site work: step 19 says to leave the plugs unwired.' },
  { status: 'resolved', text: 'V12 Sheet 5 does not say where the safe-off junctions are made. V11 ran W24, W25 and the two DRV2 conductors all the way to the E-STOP: two wires under each contact screw, four safety conductors across the hinge.', how: 'The junctions are made on TB5, which is what the strip is there for. W24 is a jumper from TB5-1 to TB5-3 and W25 from TB5-2 to TB5-4, on the door side; one conductor runs from TB5-3 to E-STOP 12 and one from TB5-4 to E-STOP 21. The circuit is the same as drawn. Bob left the choice to this guide; engineering to confirm (Design issues).' },
  { status: 'resolved', text: 'V11 A check of sheets 4 to 15 against the wire list, conductor by conductor, found the incoming feeder and incoming ground (sheet 4) missing, and W24, W25 and W102 printed on both sides of TB5 where the drawings number the door side only.', how: 'The three feeder conductors (to Q1 1L1, 3L2, 5L3) and the ground conductor (to GB1 terminal 1) are in the guide as site conductors, drawn as short tails at their landings. The drive and IO1 side of TB5-1, -2 and -5 carry no number. Everything else on sheets 4 to 15 matched: 119 wires and 61 cables. Four drawing points went to Design issues.' },
  { status: 'resolved', text: 'V11 T1: the H2-H3 jumper (480 V connection) was drawn as a wire that ran 70 mm down past the transformer and back up.', how: 'It is the flat metal link supplied with the transformer, between the two neighbouring screws on the primary board. It is listed as "T1 link", with nothing to cut or mark.' },
  { status: 'resolved', text: 'V10 PWS1 (WAGO 2787-2347): the wires went into the top of the housing, and a terminal block showed on the front that the fitted supply does not have there.', how: 'WAGO\'s model had been standing on its back since V4, its top turned to the front. Turned up as fitted (shop photos 2026-11-05): the blue 5-way output plug X2 stands on top at the front edge, the black 4-way input plug X1 hangs under the bottom at the front, and the label is the front. W22 and W23 go down into X2 (1-3 minus, 4-5 plus); W35-W37 and the ground W21 go up into X1 (L1 L2 L3 PE). The body is 137 mm deep, not 169.' },
  { status: 'resolved', text: 'V10 Fuses were not parts: FU1\'s were drawn but belonged to FU1, FU2\'s and T1\'s were not drawn.', how: 'Seven fuses are parts of their own, each clickable, findable and listed: FU1-L1, FU1-L2, FU1-L3 (LPJ-70SP), FU2-F (FNQ-R-6, seen through a window in the carrier), T1-F1 and T1-F2 (class CC, 3.5 A) and T1-F3 (midget, 10 A). T1\'s are an approximation: sheet 4 gives class and rating, the BOM lists none, and the part numbers shown (FNQ-R-3-1/2, FNM-10) are this guide\'s suggestion.' },
  { status: 'resolved', text: 'V9 FU1 was drawn as a separate fuse block wired to Q1 with W1-W3, with no fuses in it, and 125 mm below the switch body: further than a class J fuse is long.', how: 'It is a trailer fuse block (1494U-IN001 p.10). Its poles now line up with Q1\'s, its top is 113.0 mm below the switch body (DIM Z), the three LPJ-70SP fuses (Bussmann\'s model, 117.6 mm long) bridge the gap, and the two phase barriers stand between the poles. W1-W3 are listed as not a wire (Design issues).' },
  { status: 'resolved', text: 'V9 The drives\' control wires and Ethernet cords hung straight down the front of each drive, across the R/L1 to W/T3 legend and the power terminals.', how: 'They now cross to the left edge of the drive below the control module and run down beside the power terminals, each in its own place, so the legend and every power terminal stay in view.' },
  { status: 'resolved', text: 'V9 24 bends were still tighter than the wire (V8 audit): Ethernet cords leaving the NS1 jacks, 8 AWG at TB1 and the duct corners, IO-Link jackets at duct junctions, the TB2 jumpers.', how: 'Every corner of every run is now rounded to a radius that grows with the wire (at least three diameters where the run allows it), a cord leaving a front jack turns on an arc of its own size, and jumper loops stand taller.' },
  { status: 'resolved', text: 'NEW V3 drew every device as a box with its sheet 3 face on the front, so shapes, depths and terminal heights were approximate.', how: 'V4 builds 30 parts from the makers\' own STEP models (Vendor Step Files, tools/models.json): Q1, FU1, Lug1, CB3, CB5, DRV1/DRV2, PWS1, PWS2, IO1, ECR, CPL1-CPL3, CB4, NS1, PDB2/PDB3 with their NS35A adapters, RCP1, every 1492-J4/J6 terminal, end anchor and end barrier, the DIN rail and both Panduit ducts (cut to each run), the Saginaw enclosure with its own doors, hinges, handles and centre post, the A/C, subplate 2 and its brackets, the PanelView HMI and the E-STOP operator. Each sits at its real size, centred on its sheet 3 position, its back on the subplate, with the sheet 3 face image laid over its front so labels and markings still show.' },
  { status: 'resolved', text: 'NEW Wire ends stopped at a fixed fraction of the body depth, so on stepped devices a conductor could end in the air or inside the body.', how: '(V4; replaced in V5 by wires going into the real openings, above.) Every clamp now sits on the surface of the model: a ray from the front at the terminal\'s position finds the screw, opening or plug face. Checked for every wire end in the panel (464): 393 sit on a model surface, 27 on the drive and 1769 terminal blocks shown with their covers off, 42 on the TB3 1492-JD4 screws (no maker model: the documented clamp heights), and 2 (PWS1 X1 L2 and L3) inside the openings of its input plug.' },
  { status: 'resolved', text: 'NEW RCP1: sheet 6 names four receptacle terminals and two jumpers, and V3 drew a 45 mm box with four screws.', how: 'Rockwell\'s model shows one 3-way L/N/G terminal block at the top feeding both outlets. Hot, neutral and ground land on it; the two jumpers are marked not fitted in every list (Design issues). The receptacle is placed at its real 74 x 124 mm between TB5 and CB5.' },
  { status: 'resolved', text: 'NEW The 787-1668 depth waited on WAGO\'s manual (PartsLib request #10994).', how: 'WAGO\'s own STEP model (3Dfindit) gives the body: 42 x 127 mm face, 155 mm deep to the front of the plugs.' },
  { status: 'resolved', text: 'NEW Parts with no maker 3D model were plain boxes.', how: 'CB1/CB2 (140MT-F), FU2 (CHCC1DU), PDB1, T1, SI1-SI6, NS2 and GB1 are now built to their catalogue shape: terminal shoulders, raised operating faces, the MPCB rotary handles, the PDB smoked load cover, the transformer core, coil and terminal boards and two-level plug terminals on the isolators (PLC1 too in V4; V5 has its maker model). Envelopes come from PartsLib records where held. Wires land on those surfaces the same way.' },
  { status: 'resolved', text: 'V5 PLC1: Rockwell\'s 1769-L36ERM STEP (the L3 housing offered for the L30ER) meshed to nothing in occt-import-js, so V4 built PLC1 from its catalogue shape.', how: 'The file is read with cascadio (OpenCascade 7.8, tools/step_cascadio.py), which meshes all 535 solids. The circuit board inside (80 % of the triangles, invisible with the housing closed) is left out; the housing, door, LEDs and latches are Rockwell\'s, with the sheet 3 face laid on. The two Ethernet jacks open downwards under it.' },
  { status: 'resolved', text: 'V5 IO1: V4 narrowed Rockwell\'s OW16 model from 56.5 mm to 35 mm, believing the OW16 single-wide.', how: 'That was wrong. 1769-IN062 p.14 gives the OW16 as 118 x 87 x 52.5 mm, and Rockwell files its CAD under the wide I/O case (1769-IO_CASE_15, 1769-IO_wide.dwg; the single-wide modules get 1769-IO_CASE). IO1 is now Rockwell\'s model at full size; the end cap and the end anchor after it move 17.9 mm right (Design issues). The PartsLib record that said 35 mm is corrected too: 1769-IN062 is now stored in PartsLib and record 813 cites its p.14 for 52.5 x 87 x 118 mm.' },
  { status: 'resolved', text: 'V5 Wire ends sat on the face of a terminal rather than in it: conductors lay over screw heads (CB1/CB2, TB1), ran past box lugs (Q1, FU1), crossed the front of blocks (PTFIX) or ended on a drive terminal strip drawn in front of the drive cover.', how: 'Every wire now goes into its terminal\'s real opening. For the makers\' models the opening is found in the model itself: rays down the entry direction find the hole that reaches the clamp and is walled in round it, and the conductor stops inside the clamp body (124 ends). Q1 and FU1 use the lug positions read off Rockwell\'s models (sheet 3 put them 4-7 mm off). 1492-J4/J6 wires go into the entry valley behind the screw, read off the block profiles (204 ends on strips). Where a model has no opening drawn (catalogue-shape parts, flat-drawn push-ins) the wire enters through the face the clamp opens on, behind the screw, with a dark entry mark (108 ends). Each wire then leaves straight out of its device before it turns for the duct; front-entry wires in one column stand off in steps like a dressed comb. Audit of all 464 ends: every conductor tip is inside its own device, and no exit run passes through another device.' },
  { status: 'resolved', text: 'V5 Drives and 1769 modules: V4 drew the terminal blocks as flat bars in front of closed covers.', how: 'The covers really come off in the wiring steps and the Completed panel: the PowerFlex 525 control cover, its cable opening and the power terminal guard are separated out of Rockwell\'s model, and the 1769-OW16 and PB2 doors are their own solids. Behind them the terminal blocks are built where the manuals put them (520-UM001 p.36/42: two-tier control block, EtherNet/IP jack, power block at the bottom; 1769-IN028/IN062: the removable terminal block in its recess), and the wires enter from below or the front as on the real parts.' },
  { status: 'resolved', text: 'V5 Analog cables CBL-ANL-01/02: V4 landed the shields on TB3-1 and swapped the white and black cores.', how: 'The shields go to the ground bar, routed through the ducts from the cable breakout, as the wire list says; the cores take the colours the wire list gives them.' },
  { status: 'resolved', text: 'V5 Viewing: the camera could not go below the horizon or closer than 0.45 m, the renderer\'s own C (cut away) key fired with the guide\'s C (Completed panel) and sliced the panel open, and the panel rendered at 5-6 frames a second on an integrated GPU.', how: 'Orbit goes all the way round and under the panel and in to 4 cm, with the near plane following. The renderer\'s keys are off. Shadows are drawn only when something changes, two see-through materials that forced a second full render are replaced, wire end hardware is one draw per wire, the ducts are tessellated coarser, ambient occlusion pauses while the view moves, and the resolution steps down if frames are slow: about 3 times faster than V4 on the shop-style laptop GPU tested.' },
  { status: 'resolved', text: 'V6 Terminal positions on several devices were taken from sheet 3 or the manuals, and did not match the parts fitted in the shop (photos 2026-11-05).', how: 'Each was moved to where the photos show it (checklist: REVISIONS.md). Rail 3 is PLC1, PWS2, IO1 from the left, as built (sheet 3 has PWS2 first: design issue). PWS2\'s five-screw column is at the right of the module, and IO1\'s 18-screw block in the right of the module. PLC1\'s Ethernet jacks are under the right of its front. The drive power blocks\' lower row runs PE, DC-, DC+, BR, PE, offset right, with the ground on the right-hand PE. NS1\'s ports 1-8 run down the left column and its supply plug openings are under the bottom of the front. On SI1-SI6, 5-8 is the outer top row, as their labels read. T1\'s line wires land on its primary fuse block, and PDB1\'s taps are entered from below, between the barrier fins. Audit of all 540 conductor ends: every tip is inside its own device, and no exit run crosses another device.' },
  { status: 'resolved', text: 'V6 Several catalogue-shape parts and faces did not look like the parts fitted.', how: 'Rebuilt from the shop photos. SI1-SI6 have light green plugs, orange (5-8 / 1-4) and blue (9-12 / 13-16) number labels, the tag and the POWER lamp (tools/make_faces.py). T1 has its black foot plate, core and coil, and on the front the primary board, the two-pole primary fuse block, the one-pole secondary fuse block and the secondary board; it is 178 mm deep (PartsLib; V5 assumed 115). PDB1 is open, with four tall barrier fins and the tin connectors set back between them (V5 drew a smoked cover). CB1/CB2 are light grey with blue handles. PLC1 carries the L30ER face rectified from the photo (V5 showed sheet 3\'s L36ERM), and PWS2 and IO1 their photographed fronts, doors included (sheet 3\'s IO1 image is a 1769-HSC). The drives are black, with the printed R/L1 to W/T3 legend over the power block; the sheet 3 image of the white lower cover shows only while covers are on.' },
  { status: 'resolved', text: 'V7 Bob\'s review of V6: the IO1 wires came in from the front, the FU1 load wires went up behind the box lugs instead of into them, and the SI 9-12 wires ran down through the 13-16 plug. He also asked for the drive front covers to go back on, x-rayed.', how: 'IO1: every OW16 wire now comes in from the bottom and runs up the face of its column to the clamp under the pressure plate, as it is wired in the shop. FU1: the box lug openings were measured on Rockwell\'s model with rays from below (underside at y -41.3 mm, through-hole centred at z 43.7 mm on each pole); the V5/V6 probe searched only to z 40.8 and took the gap behind the lug, so each conductor now goes 13 mm up into its own lug. SI1-SI6: the plug tiers are stepped as on the real housing, each inner plug (1-4, 9-12) standing well in front of the outer one (front at 97 % of the depth against 75 %), so the inner wires leave in front of the outer plug. Drives: in the wiring steps and the Completed panel the control cover, terminal guard and white lower cover stay on as x-ray glass, the landings visible through them; clicks pass through the glass. Audit of all 540 conductor ends: every tip inside its own device, no exit run through another device.' },
  { status: 'resolved', text: 'V8 An audit of every conductor against every solid (tools/audit.js) found wires V7\'s checks missed: W1-W6 went 135 mm sideways into a duct and back between lugs that face each other; 60 wires and cables doubled back where they leave the plate; two or three conductors in one clamp were drawn as one; CBL-IOL-09\'s cores landed on three different ports; IO1\'s right-hand column left through the housing floor; the PTFIX feeds ran through the block.', how: 'W1-W6 run straight lug to lug. Off-plate ends leave in one run. Conductors sharing a clamp lie side by side. CBL-IOL-09 lands on X01-1, X01-3 and X01-4 (Design issues). IO1\'s wires run down in front of the screws and out through the open wire channel left of the block, measured on Rockwell\'s model; PWS2\'s come from below, as in the shop photos. The PTFIX feeds come in over the front. Audit of 464 ends: no wire through a solid, no shared line in a clamp; 24 tight bends remain (Ethernet plugs at NS1, 8 AWG at TB1 and the duct corners).' },
  { status: 'open', text: 'RCP1: Rockwell\'s 1492-REC family model has the GFCI face (TEST/RESET).', how: 'The REC15 body and terminal block are the same, but its face is a plain duplex.' },
  { status: 'resolved', text: 'V2 wire landings were read off the device faces by eye, and some were several millimetres out (SI1-SI6 bottom rows about 5 mm, PDB2/PDB3 lower outputs below the body, T1 X1/X2 about 9 mm, NS1 ports up to 10 mm, Q1 lugs, PDB1 load openings, CB4 inputs).', how: 'V3 measures every device face on a 2.5 % grid (the GLG at 900 dpi from the PDF) and takes terminal layouts from the manuals where they exist: AL1920 port and pin order from ifm 80281466 p.5/p.9 and the numbers printed on its face, 1769-PB2 from 1769-IN028 p.5/p.11, 1769-OW16 from 1769-IN062 p.8, the PowerFlex 525 blocks from 520-UM001 p.32/36/42. Each terminal says where its position comes from.' },
  { status: 'resolved', text: 'V2 marked the drive control and power blocks, the 1769-PB2 and OW16 terminals and the AL1920 pin order as approximate.', how: 'All four are now from their manuals (above). In the wiring steps the drives are shown with the control module cover and the terminal guard off, and the 1769 modules with their doors open, so every wire visibly lands on its screw.' },
  { status: 'resolved', text: 'Wire colours were an assumption with no basis given.', how: 'The guide now follows NFPA 79 (Electrical Standard for Industrial Machinery) 13.2.4: black for AC and DC power, red for ungrounded AC control, blue for ungrounded DC control, white for the AC grounded conductor, white with a blue stripe for the DC grounded conductor, green(-yellow) for protective earth. The drawings still give no colours: listed under Design issues.' },
  { status: 'resolved', text: 'The door hinges were assumed (V2 hinged the right door on its right edge and called sheet 2 wrong).', how: 'Saginaw\'s SCE-60XEL4918SSST drawing shows both doors hinged on their left edge, the right one on the removable centre post, with 3-point handles on the right: exactly as sheet 2 draws them. Modelled that way; the V2 design issue is withdrawn.' },
  { status: 'resolved', text: 'The A/C, subplate 2 and RCP1 had no position, and RCP1 was only a dashed outline.', how: 'Each has a definite modelled place: the A/C (Saginaw\'s model) on the upper left side wall, subplate 2 below it, and RCP1 (Rockwell\'s model) between TB5 and CB5 on rail 4, the only gap it fits. Whether those are the right places is a design question (Design issues).' },
  { status: 'resolved', text: 'Cut lengths were the routed length plus a flat 75 mm a side.', how: 'Each cut length is now built up: the routed length clamp to clamp, plus at each end the strip length from that terminal\'s document (10 mm where none is given) and a 50 mm service loop; 300 mm coiled at a field end; 100 mm at the door hinge, A/C or subplate 2; 60 mm of core breakout at each end of a multi-core cable. The wire card shows the sum.' },
  { status: 'resolved', text: 'Field wiring stopped as a stub below the bottom duct.', how: 'Field conductors and cables now run down to cable glands in the enclosure floor, where they leave the panel. Saginaw shows only floor-kit provisions in the bottom, so the gland plate and glands are a design item (Design issues).' },
  { status: 'resolved', text: 'Ten devices had no install document in PartsLib.', how: 'Requested in PartsLib (#10994-#11002; VTUX #7460). For V3 the public manufacturer copies were read directly where they exist: 1769-IN062 for the OW16 terminal layout and the Saginaw enclosure drawing for the doors, studs and handle. The values used are cited on each part.' },
  { status: 'resolved', text: 'Terminal strips used the sheet 3 symbol as their face, which is not to scale.', how: 'TB1-TB5 are modelled from the blocks themselves: real widths (1492-TD015, PartsLib), a screw in a recess near each end with the wire entry under it, two levels for the 1492-JD4.' },
  { status: 'resolved', text: 'Device envelopes on rail 3 overlapped as drawn.', how: 'SI1-SI4, the AL1920s, CB4 and PWS1 are placed at their real widths, end to end; the 4.4 mm the drawing is short is a design issue.' },
  { status: 'open', text: 'The GLG isolator\'s terminal numbering (beyond 9 AIn+ and 10 AIn-) has no manufacturer document, and no 3D model exists for it.', how: 'Marked on its part card. It closes when the isolator\'s label is checked.' },
]
const TERMINALS = { LAYOUTS: T.LAYOUTS, DEVICE_LAYOUT: T.DEVICE_LAYOUT, STRIP_LAYOUT: T.STRIP_LAYOUT, IOL_CORE: T.IOL_CORE }
const ISSUES_OLD = [
  'Wire numbers not used on the drawings: W18, W26, W27, W46-W53, W55, W56, W58, W59, W61, W66-W68, W70, W72, W101, W103-W105. 15 conductors (jumpers and grounds) have no number: give them one before marker printing.',
  'No AWG printed for W20, W24, W25 and W71.',
  'Sheet 7: W93 is labelled "IO1" but its cross reference (0826) and sheet 8 put it on the E-STOP lamp X2.',
  'Sheet 7/8: W75, W82 and NS1 port 5 read "HM1" for HMI1.',
  'Sheet 8: the NS1 cross reference for DRV2 reads (0527); DRV2\'s RJ45 is at line 0571. W60\'s cross reference (0505) points at DRV1\'s line.',
  'Sheet 11: CPL2 port terminals are printed X01-1, X02-1, X03-1, X04-1 (all L+). TB4 rows 29/30 repeat this. As printed, CBL-IOL-09\'s L- and C/Q cores would land on the L+ pins of ports 3 and 4, which CBL-IOL-11 and CBL-IOL-12 use. NEW (V8) This guide lands them on port 1 with the cable\'s L+ core: X01-3 (L-) and X01-4 (C/Q), as every other IO-Link cable is drawn. Correct sheet 11.',
  'Sheet 11: VM1 lands C/Q on CPL2 X08-3 and L- on X08-4, the reverse of every other port.',
  'EVC001 core colours disagree: on EVC001-02 brown is L+, on EVC001-03 brown is L- and white is IO-Link.',
  'Sheet 15 shows TB2, TB5-1..4 and TB4-1..3 as (TBD); sheets 5, 6, 10 and 11 show their connections (used here).',
  'Sheet 4: W17 carries potential L16 where the other PDB1 outputs are named after their terminal (L3-x). T1\'s primary and secondary fuse terminals are both labelled 1L1/2T1.',
  'Sheet 4: W20 (ground/neutral bond) lands on a junction dot on the N conductor, not on a terminal.',
  'Sheet 6: RCP1 hot lands on L2-1 and L1-2 and neutral on L1-1 and L2-2: check against the 1492-REC15 terminal markings.',
  'Spare isolators SI3-SI6 have no 24 V/Com power; TB3-5, 7, 10 and 12 have no field side.',
  'The air conditioner\'s tag on sheet 6 reads "Panel" (label ACU).',
  'BOM: 7 GLG isolators for 6 tags; GB1/GB2 in the BOM but the drawings only say "GND BAR"; Lug1 and Recpt-2 appear on no drawing. The "GLG-1xmA-1xmA" isolator is a generic DIN unit with no manufacturer documentation (the BOM names Eaton Bussmann).',
  'BOM: SCE-16P14 (subplate 2) is Saginaw\'s 15 x 13 in subpanel for its 16 x 14 in enclosures (AutomationDirect cut sheet). It works as a flat plate on the side wall but needs its own mounting: confirm.',
  'Sheet 3 cites Rockwell 1494U-IN007 for Q1\'s Z dimension; that instruction may be the 200 A version. Check the 1494U-D100 instruction (1494U-IN001 per Rockwell\'s product page).',
  'The wire colours shown in this guide are an assumed convention (480 V black, 120 V red/white, 24 V DC blue, 0 V white/blue, ground green/yellow): the drawings do not specify them.',
]

void ISSUES_OLD

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
const GUIDE = { JOB: L.JOB, BOM: L.BOM, ENC: L.ENC, DUCTS: L.DUCTS, RAILS: L.RAILS, DEVICES: L.DEVICES, ANCHORS: L.ANCHORS, PHASES: L.PHASES, STEPS: L.STEPS, TEX, SEGMENTS, DOCS, DESIGN_ISSUES, MODELING_ISSUES, TERMINALS, REC, PL_URL, VERSION: '14.0', MODELS, FIT }

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
<meta name="description" content="Step-by-step build guide for panel VFD 200 (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid) from Draft rev18: a 3D panel built in order, every wire routed and labelled, and the reference documents for each part.">
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
<header id="g-top"><div class="brand"></div><nav class="modes"></nav><div class="tprog"></div><input id="g-search" placeholder="Find a wire or part: W29, CB4" list="g-sl" title="Type a wire number or a part tag, then Enter"><datalist id="g-sl"></datalist><button data-text title="Larger text, for reading at arm's length">A<b>A</b></button><button data-help title="How to move around and what the keys do (H)">?</button></header>
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
// the file is named after the panel (JOB.panel "VFD 200" gives "VFD200 Assembly Guide.html")
const out = join(here, `${L.JOB.panel.replace(/\s+/g, '')} Assembly Guide.html`)
writeFileSync(out, html)
console.log(`built ${out}  (${(html.length / 1e6).toFixed(2)} MB, ${SEGMENTS.length} wire segments, ${Object.keys(TEX).length} textures, ${Object.keys(MODELS).length} vendor models, ${Object.values(MODELS).reduce((t, m) => t + m.tri, 0)} vendor triangles)`)
