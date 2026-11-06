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
  if (/\bS[12]\b|Digital Common|E-STOP|TB5/.test(f)) return 'w24'
  if (/^W(54|19|20)$/.test(w.wire)) return 'w120'
  if (/PWS1 (1|4) \(OUT/.test(f) || /^W(22|23)$/.test(w.wire)) return 'w24'
  return 'w480'
}
let n = 0
for (const w of WL.wires) {
  const base = { label: w.wire || '', awg: w.awg, potential: w.potential, sheet: w.sheet, line: w.line, note: w.note || '', inferred: !!w.inferred, step: stepOf(w) }
  const via = viaOf(w.note)
  if (via && w.from.dev !== via[0] && w.to.dev !== via[0]) {
    SEGMENTS.push({ ...base, id: `s${n++}`, from: w.from, to: { dev: via[0], term: via[1] }, note: `${base.note}${base.note ? ' ' : ''}(Segment 1 of 2: to ${via[0]}-${via[1]}.)` })
    SEGMENTS.push({ ...base, id: `s${n++}`, from: { dev: via[0], term: `${via[1]}:field` }, to: w.to, note: `${base.note}${base.note ? ' ' : ''}(Segment 2 of 2: from ${via[0]}-${via[1]}.)` })
  } else SEGMENTS.push({ ...base, id: `s${n++}`, from: w.from, to: w.to })
}
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
  else if (iol && c.from.dev === 'VM1') { from = { dev: 'VM1', term: core.term_from }; to = end('TB4', core.term_to, true) }
  else if (/^TB/.test(c.from.dev)) { from = end(c.from.dev, core.term_from, true); to = { dev: c.to.dev, term: core.term_to } }
  else { from = { dev: c.from.dev, term: core.term_from }; to = end(c.to.dev, core.term_to, true) }
  const cores = c.cores.map((k) => `${k.potential ?? ''}: ${k.term_from} → ${k.term_to}${k.color ? ` (${k.color})` : ''}`).join('; ')
  // every core lands on its own terminal: keep them, with the M12/IO-Link pin number (potential "IOLn-p" -> p)
  const anl = /PLTC/.test(t)
  const coreList = c.cores.map((k, i) => {
    const pin = Number(/-(\d)$/.exec(k.potential ?? '')?.[1] ?? /^(\d)$/.exec(String(k.term_from))?.[1] ?? 0) || null
    const a = /^TB/.test(c.from.dev) || /TB\d-/.test(k.term_from) ? end(c.from.dev === 'TB4' || c.from.dev === 'TB3' ? c.from.dev : 'TB4', k.term_from, !(iol && c.from.dev === 'TB4')) : { dev: c.from.dev, term: k.term_from }
    const b = /TB\d-/.test(k.term_to) ? end(c.to.dev, k.term_to, true) : { dev: c.to.dev, term: k.term_to }
    return { from: a, to: b, pin, potential: k.potential ?? '', color: k.color ?? null, anl: anl ? (i === 0 ? 'BK' : i === 1 ? 'WH' : 'SH') : null }
  })
  SEGMENTS.push({ id: `s${n++}`, kind: iol ? 'iol' : 'field', label: c.cable, awg: iol ? '3×18' : anl ? '2×18 sh' : null, potential: c.cores.map((k) => k.potential).filter(Boolean).join(' / '), sheet: c.sheet, from, to, cores: coreList, cableType: t, note: `${c.note ? c.note + '. ' : ''}Cores: ${cores}`, step: iol ? 'wnet' : 'wfield' })
}

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
const T = await import(pathToFileURL(join(here, 'src', 'terminals.mjs')).href)

// ---------------------------------------------------------------- issues
// Design issues: for the engineer who drew the panel. Modeling issues: how this guide models what the drawings leave open,
// with what was done about each one.
const DESIGN_ISSUES = [
  'Wire numbers not used on the drawings: W18, W26, W27, W46-W53, W55, W56, W58, W59, W61, W66-W68, W70, W72, W101, W103-W105. 15 conductors (jumpers and grounds) have no number: give them one before marker printing.',
  'No AWG printed for W20, W24, W25 and W71.',
  'Wire colours are not specified anywhere in the set. Give a colour standard (this guide shows an assumed one).',
  'Sheet 7: W93 is labelled "IO1" but its cross reference (0826) and sheet 8 put it on the E-STOP lamp X2.',
  'Sheet 7/8: W75, W82 and NS1 port 5 read "HM1" for HMI1.',
  'Sheet 8: the NS1 cross reference for DRV2 reads (0527); DRV2\'s RJ45 is at line 0571. W60\'s cross reference (0505) points at DRV1\'s line.',
  'Sheet 11: CPL2 port terminals are printed X01-1, X02-1, X03-1, X04-1 (all L+). TB4 rows 29/30 repeat this.',
  'Sheet 11: VM1 lands C/Q on CPL2 X08-3 and L- on X08-4, the reverse of every other port (PartsLib AL1920 pins: 3 = L-, 4 = C/Q).',
  'EVC001 core colours disagree: on EVC001-02 brown is L+, on EVC001-03 brown is L- and white is IO-Link.',
  'Sheet 15 shows TB2, TB5-1..4 and TB4-1..3 as (TBD); sheets 5, 6, 10 and 11 show their connections (used here).',
  'Sheet 4: W17 carries potential L16 where the other PDB1 outputs are named after their terminal (L3-x). T1\'s primary and secondary fuse terminals are both labelled 1L1/2T1.',
  'Sheet 4: W20 (ground/neutral bond) lands on a junction dot on the N conductor, not on a terminal: say where the bond is made (X1 or TB2-3).',
  'Sheet 6: RCP1 hot lands on L2-1 and L1-2 and neutral on L1-1 and L2-2: check against the 1492-REC15 terminal markings.',
  'Sheet 6: RCP1, and the second ground bar GB2, have no position on sheet 3. The A/C and subplate 2 have no position on any sheet.',
  'Sheet 2 draws the right door as a copy of the left (hinge at the centre post). Confirm the hinge side of each door.',
  'Spare isolators SI3-SI6 have no 24 V/Com power; TB3-5, 7, 10 and 12 have no field side.',
  'The air conditioner\'s tag on sheet 6 reads "Panel" (label ACU).',
  'BOM: 7 GLG isolators for 6 tags; GB1/GB2 in the BOM but the drawings only say "GND BAR"; Lug1 and Recpt-2 appear on no drawing. The "GLG-1xmA-1xmA" isolator is a generic DIN unit with no manufacturer documentation (the BOM names Eaton Bussmann).',
  'BOM: SCE-16P14 (subplate 2) is Saginaw\'s 15 x 13 in subpanel for its 16 x 14 in enclosures (AutomationDirect cut sheet). It works as a flat plate on the side wall but needs its own mounting: confirm.',
  'BOM: only C2WH6 covers; the 3 in duct needs C3WH6. One LPJ-70SP for a 3-pole fuse block. No T1 fuses (2 x 3.5 A class CC, 1 x 10 A midget, sheet 4), floor stand, field entries (hubs, glands), door bonding straps or E-STOP legend plate.',
  'Sheet 3 cites Rockwell 1494U-IN007 for Q1\'s Z dimension; that is the 200 A edition. The 100 A instruction is 1494U-IN001 (requested in PartsLib, #11001).',
  'Eaton FAZ-NA p.6: "Eaton does not recommend the use of wire ferrules". CB3 and CB5 conductors go in bare; say so on the drawings if the shop standard is ferrules everywhere.',
]
const MODELING_ISSUES = [
  { status: 'resolved', text: 'V1 built TB4 at 5.1 mm per terminal and reported the drawn 446 mm as wrong.', how: 'A 1492-J4 is 6.1 mm wide (1492-TD015 p.2, PartsLib record 1025). At 6.1 mm, 72 terminals take 439 mm, which matches sheet 3. TB2, TB4 and TB5 are rebuilt at 6.1 mm and the design issue is withdrawn.' },
  { status: 'resolved', text: 'V1 drew each multi-core cable (IO-Link, M12 field, instrument pair) as one conductor to its middle terminal.', how: 'Every core now lands on its own terminal: TB4 n/n+1/n+2 to the AL1920 port pins 1, 3 and 4, field cables on the TB3/TB4 field sides. Each cable is a jacket with a breakout at both ends; core colours follow the IO-Link M12 convention (pin 1 brown, 3 blue, 4 black).' },
  { status: 'resolved', text: 'V1 placed terminals by rough fractions of each device face.', how: 'Each terminal is now placed at its screw, push-in or plug, read off the device faces on sheet 3 and the manual figures (520-UM001 p.36/p.42, 1769-IN028 p.11, 1492-TD019 p.14), using the PartsLib pin names. Wires enter from the side the clamp opens to. Where a terminal is hidden (drive control block, 1769-PB2 and OW16 terminals under their doors, AL1920 pin order inside a plug), the part card says so.' },
  { status: 'resolved', text: 'V1 device depths were catalogue guesses.', how: 'Depths come from the PartsLib records where they exist: DRV 212 mm (520-TD001 p.15), T1 178 mm, PDB1 99.6 mm, Q1 92 mm, FU1 76 mm, PWS1 137.5 mm, GB1 19 mm, HMI bezel 297 x 252 mm. The remaining devices are marked approximate on their part card.' },
  { status: 'resolved', text: 'V1 routed every wire by the shortest path through the ducts, so 480 V and 24 V/signal shared ducts freely.', how: 'Routing now keeps AC power and DC/signal apart wherever the drawn ducts allow, following 520-UM001 p.37 (control and signal at least 0.3 m from power). The ducts where they still have to share are listed under Design issues.' },
  { status: 'resolved', text: 'V1 assigned GB1 taps arbitrarily.', how: 'Taps are numbered 1-14 down the bar and given out in wire-list order. The tap number shows on each wire card, so the shop can follow it or change it.' },
  { status: 'resolved', text: 'V1 wire ends stopped at the device face.', how: 'Every conductor ends in a ferrule (control and 120 V), a bare stripped end (Eaton FAZ breakers; Eaton does not recommend ferrules, FAZ-NA p.6) or a lug (power above 10 AWG), entering the clamp from its open side.' },
  { status: 'open', text: 'Wire colours are assumed: 480 V black, 120 V red/white, 24 V DC blue, 0 V white/blue, ground green/yellow, IO-Link cores brown/blue/black.', how: 'The drawings give none (see Design issues). Change WC in src/guide.js when the standard is set.' },
  { status: 'open', text: 'The A/C, subplate 2, RCP1 and the door hinges are placed by assumption.', how: 'The A/C and subplate 2 are on the left side wall, RCP1 is a dashed outline in the free space on rail 4, and the right door hinges on its right edge. Each waits on a design answer.' },
  { status: 'open', text: 'Cut lengths are route length plus 75 mm per end.', how: 'They suit ordering and pre-cutting, not final lengths. Cut long and trim at the terminal.' },
  { status: 'open', text: 'Ten devices have no install document in PartsLib, so their notes are thinner.', how: 'Requested in PartsLib on 2026-11-04 (#10994-#11002; VTUX already #7460). Add the page links to data/partslib.json when the PDFs arrive.' },
  { status: 'open', text: 'Field-side wiring (motors, instruments, plant network) is shown as a stub leaving the bottom duct.', how: 'It is installed on site and not part of the panel build.' },
]
const TERMINALS = { LAYOUTS: T.LAYOUTS, DEVICE_LAYOUT: T.DEVICE_LAYOUT, STRIP_LAYOUT: T.STRIP_LAYOUT, IOL_CORE: T.IOL_CORE }
const ISSUES_OLD = [
  'Wire numbers not used on the drawings: W18, W26, W27, W46-W53, W55, W56, W58, W59, W61, W66-W68, W70, W72, W101, W103-W105. 15 conductors (jumpers and grounds) have no number: give them one before marker printing.',
  'No AWG printed for W20, W24, W25 and W71.',
  'Sheet 7: W93 is labelled "IO1" but its cross reference (0826) and sheet 8 put it on the E-STOP lamp X2.',
  'Sheet 7/8: W75, W82 and NS1 port 5 read "HM1" for HMI1.',
  'Sheet 8: the NS1 cross reference for DRV2 reads (0527); DRV2\'s RJ45 is at line 0571. W60\'s cross reference (0505) points at DRV1\'s line.',
  'Sheet 11: CPL2 port terminals are printed X01-1, X02-1, X03-1, X04-1 (all L+). TB4 rows 29/30 repeat this.',
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
const GUIDE = { JOB: L.JOB, BOM: L.BOM, ENC: L.ENC, DUCTS: L.DUCTS, RAILS: L.RAILS, DEVICES: L.DEVICES, ANCHORS: L.ANCHORS, PHASES: L.PHASES, STEPS: L.STEPS, TEX, SEGMENTS, DOCS, DESIGN_ISSUES, MODELING_ISSUES, TERMINALS, REC, PL_URL, VERSION: '2.0' }

// ---------------------------------------------------------------- the page
const kit = rd('vendor/lab-kit.js')
const guide = rd('src/guide.js')
const safe = (s) => s.replace(/<\/script/gi, '<\\/script')
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VFD 200 Assembly Guide</title>
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
.wdet { position:sticky; bottom:-24px; background:#fff; border:1px solid var(--acc); border-radius:10px; padding:10px 12px; margin-top:10px; box-shadow:0 -6px 18px #0001 }
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
#g-help { position:fixed; left:24px; top:18px; z-index:4; font:12px Inter, sans-serif; color:var(--mut); background:#f3f2eecc; padding:6px 10px; border-radius:8px }
#g-view { position:fixed; left:24px; top:52px; z-index:4; display:flex; gap:6px }
#g-view button { border:1px solid var(--line); background:#fffffff0; border-radius:8px; padding:7px 10px; font:600 12.5px Inter, sans-serif; cursor:pointer; color:var(--ink) }
#g-view button.on { background:var(--ink); color:#fff; border-color:var(--ink) }
#g-view kbd { font:600 10px 'JetBrains Mono', monospace; opacity:.6; margin-left:4px }
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
@media (max-width: 820px) { #g-panel { top:auto; height:52vh; width:auto; left:0; border-left:0; border-top:1px solid var(--line) } #g-help { display:none } }
@media print { #lab-gl, #g-tags, #g-help, #g-view, #g-panel, #g-tip, .lab-ui { display:none !important } #g-print { display:block; font:11px Inter, sans-serif; color:#000 } #g-print h1 { font-size:18px } #g-print h2 { font-size:14px; margin:14px 0 4px } #g-print table { width:100%; border-collapse:collapse } #g-print th, #g-print td { border-bottom:1px solid #ccc; padding:3px 4px; text-align:left; vertical-align:top } #g-print tr { break-inside:avoid } }
</style>
</head>
<body>
<div id="g-panel"><div id="g-head"></div><div class="tabs"></div><div class="body"></div><div class="nav"></div></div>
<div id="g-tip"></div>
<div id="g-help">Drag to turn · scroll to zoom · right-drag to pan · click a part or a wire · ← → to step</div><div id="g-view"></div><div id="g-print"></div>
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
const out = join(here, 'VFD200 Assembly Guide.html')
writeFileSync(out, html)
console.log(`built ${out}  (${(html.length / 1e6).toFixed(2)} MB, ${SEGMENTS.length} wire segments, ${Object.keys(TEX).length} textures)`)
