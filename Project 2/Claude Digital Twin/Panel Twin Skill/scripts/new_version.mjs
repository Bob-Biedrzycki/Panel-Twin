#!/usr/bin/env node
// Start the next version of a guide for a review round.
//   node scripts/new_version.mjs "<...>/Assembly Guide V12.0" [13.0]
// Copies the whole folder to "Assembly Guide V<next>.0" beside it (next = last + 1 unless given), without the built
// HTML, any Drive pointer (*.drive) and node_modules, and sets VERSION in the copy's build.mjs. The last version is
// not touched: a version that was handed over is the record of what the builder was given, so it is never edited.
// Then: audit the LAST version first (so you know what was already true), make the change in the new folder, build,
// audit, compare (scripts/diff_routes.mjs), and add this round to README.md, REVISIONS.md, COMPLETION.md, START HERE.txt.
import { cp, readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const last = resolve(process.argv[2] ?? '')
if (!process.argv[2] || !existsSync(join(last, 'build.mjs'))) { console.error('usage: node scripts/new_version.mjs "<last version folder>" [new version number]\n(the folder must hold build.mjs)'); process.exit(2) }
const m = /^(.*?V)(\d+)(?:\.(\d+))?$/.exec(basename(last))
const ver = process.argv[3] ?? (m ? `${Number(m[2]) + 1}.0` : null)
if (!ver) { console.error(`cannot read a version number from "${basename(last)}": give the new one, for example 2.0`); process.exit(2) }
const dest = join(dirname(last), m ? `${m[1]}${ver}` : `${basename(last)} V${ver}`)
if (existsSync(dest) && (await readdir(dest)).length) { console.error(`${dest} already exists`); process.exit(2) }
await cp(last, dest, { recursive: true, filter: (p) => basename(p) !== 'node_modules' && !p.endsWith('.drive') && !(p.toLowerCase().endsWith('.html') && dirname(p) === last) })
const bp = join(dest, 'build.mjs'), src = await readFile(bp, 'utf8')
const next = src.replace(/VERSION: '[^']*'/, `VERSION: '${ver}'`)
if (next === src) console.error("note: could not find VERSION: '...' in build.mjs (it is a property of the GUIDE object); set it by hand")
await writeFile(bp, next)
console.log(`new version folder: ${dest}\nVERSION set to ${ver} in build.mjs. The last version was not changed.`)
