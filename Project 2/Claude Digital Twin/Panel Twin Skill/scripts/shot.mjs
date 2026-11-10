#!/usr/bin/env node
// Take a picture of a built guide from the command line, to LOOK at a landing or a part without opening a browser.
//   node scripts/shot.mjs "<guide folder>" "<out.png>" [--step 13] [--complete] [--find W29|CB4|s195] [--view az,el,dist,x,y,z]
//                         [--size 1600x1000] [--wait 12] [--html "<name>.html"] [--page "tools/model_viewer.html?k=KEY&..."]
//                         [--tab wire|parts|wires|issues|locate] [--locbig]
// --locbig opens the full-screen mark-out drawing of the step (with --step N): where every item of that step goes.
// --find takes a wire number, a device tag, or a segment id (s195) for a wire that has no number.
// --tab opens a view in the instructions panel: with --find, "wire" shows that wire's card and "parts" the part's page;
//   "wires" the wire list, "issues" the issues. Use it to read what the builder will be told.
// --view is the camera: azimuth and elevation in degrees, distance (0.1 is a close-up of one device, 1 the whole panel),
//   and the point looked at in machine metres (x right, y up from the floor, z out of the plate). Every device's
//   position is in the audit JSON under "devices" (node scripts/audit_headless.mjs "<folder>" --json audit.json):
//   a front view of one device is --view 0,0,0.12,<xc>,<yc>,<z1>; from below use elevation -30, from above 30.
// --page pictures another page in the folder instead of the guide (the model viewer, to check a model's orientation).
// The script fails if the guide threw a script error, and prints it. Paths may be absolute: no need to cd anywhere.
// Write pictures to a scratch folder, not into the guide's version folder. Read every picture you make.
import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { findBrowser, pickHtml, serve, headless, preText } from './lib/browser.mjs'

const args = process.argv.slice(2)
const VAL = new Set(['--step', '--find', '--view', '--size', '--wait', '--html', '--page', '--tab'])
const pos = args.filter((a, i) => !a.startsWith('--') && !VAL.has(args[i - 1]))
if (pos.length < 2) { console.error('usage: node scripts/shot.mjs "<guide folder>" "<out.png>" [--complete] [--step N] [--find TAG] [--view az,el,dist,x,y,z]'); process.exit(2) }
const dir = resolve(pos[0]), out = resolve(pos[1])
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const exe = findBrowser(), page = opt('--page', null), html = page ? null : await pickHtml(dir, opt('--html', null))
const { server, base } = await serve(dir)
const q = new URLSearchParams({ shot: '1' })
if (opt('--step')) q.set('step', opt('--step'))
if (args.includes('--complete')) q.set('complete', '1')
if (opt('--find')) q.set('find', opt('--find'))
if (opt('--view')) q.set('view', opt('--view'))
if (opt('--tab')) q.set('tab', opt('--tab'))
if (args.includes('--locbig')) q.set('locbig', '1')
const [w, h] = opt('--size', '1600x1000').split('x').map(Number), wait = Number(opt('--wait', 12)) * 1000
const url = page ? `${base}${page}` : `${base}${encodeURIComponent(html)}?${q}`
await mkdir(dirname(out), { recursive: true }); await rm(out, { force: true })
let err = ''
for (let attempt = 1; attempt <= 2 && !existsSync(out); attempt++) {
  const r = await headless(exe, [`--window-size=${w},${h}`, `--virtual-time-budget=${wait}`, `--screenshot=${out}`], url, wait + 180000)
  err = r.err
  if (!existsSync(out) && attempt === 1) console.error('no picture from the browser on the first try; trying once more')
}
// a second, quick look at the page for a script error: a picture of a broken guide is not a picture of the guide
let pageError = null
if (!page) { const r = await headless(exe, ['--virtual-time-budget=20000', '--dump-dom'], url, 120000); pageError = preText(r.out, 'g-error') }
server.close()
if (pageError) { console.error(`THE GUIDE DID NOT LOAD: a script error in the page (the picture, if any, shows the error, not the guide).\n${pageError}`); process.exit(2) }
if (!existsSync(out)) { console.error(`no picture was written.\nBrowser output: ${err.trim().split('\n').slice(-6).join('\n  ') || '(none)'}`); process.exit(2) }
console.log(`wrote ${out}  (${url.slice(base.length)})`)
