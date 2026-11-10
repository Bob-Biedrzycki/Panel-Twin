#!/usr/bin/env node
// Start a new panel guide from the worked example.
//   node scripts/new_panel.mjs "<destination folder>"   (for example "...\<Job>\Assembly Guide V1.0")
// Copies examples/vfd200 (engine, data, models, tools) without its built HTML and its VFD 200 write-ups, and writes
// PANEL-CHECKLIST.md: the files to replace with the new panel's data, in the order that keeps the guide building.
// The copy still IS the VFD 200 guide until you replace its data: build it and run the audit first to prove the
// toolchain on this machine, then work down the checklist, building and auditing after every step.
import { cp, mkdir, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)), src = join(here, '..', 'examples', 'vfd200')
const dest = resolve(process.argv[2] ?? '')
if (!process.argv[2]) { console.error('usage: node scripts/new_panel.mjs "<destination folder>"'); process.exit(2) }
if (existsSync(dest) && (await readdir(dest)).length) { console.error(`${dest} is not empty: choose a new folder (each version of a guide gets its own folder, earlier ones are never edited)`); process.exit(2) }
await mkdir(dest, { recursive: true })
const SKIP = new Set(['README.md', 'COMPLETION.md', 'REVISIONS.md', 'START HERE.txt', 'node_modules'])
await cp(src, dest, { recursive: true, filter: (p) => !SKIP.has(basename(p)) && !p.endsWith('.html.drive') && !(p.endsWith('.html') && dirname(p) === src) })
await writeFile(join(dest, 'PANEL-CHECKLIST.md'), `# New panel checklist

This folder is a copy of the VFD 200 worked example. As it stands it builds and its audit passes:

    node "<this folder>/build.mjs"
    node "<skill>/scripts/audit_headless.mjs" "<this folder>" --max-kinks 2

Run both now, to prove the toolchain on this machine. Then work down the list. The engine is one working guide, not
a library: it will NOT stay working at every step. Each line says what to expect. Whenever the page does not load,
the audit prints the script error with the function it came from; references/engine-map.md says what that block is.
Details for every step are in the skill's SKILL.md and references/.

**A. Clear out VFD 200's readings (the guide still builds and loads; the audit result changes, and that is fine)**

- [ ] 1. \`build.mjs\`: empty the job-specific blocks near the top: the not-fitted loops, the W24/W25 re-ending loop,
      the T1 link loop, \`FEEDERS\`, the cable port remap, the fuses block (the \`for (const f of [...])\` list and the
      two \`L.BOM.push\`), \`ADDED\`. Empty \`DESIGN_ISSUES\` and \`MODELING_ISSUES\`. Set \`VERSION: '1.0'\`. Rewrite
      \`stepOf\` for your sheet numbers once your steps exist (line 2 below). The page title and the output file name
      come from \`JOB.panel\`.
      Expect: builds, loads, audit runs (it will report differences from the example: W1-W3 drawn again, and so on).

**B. Replace the panel (the guide stops loading until this group is done)**

- [ ] 2. \`src/layout.mjs\`: JOB, ENC, BOM, DUCTS, RAILS, DEVICES, ANCHORS, PHASES, STEPS for the new panel
      (references/inputs.md). Keep the step ids the engine groups by, or change \`ALL_SUB1\` and \`stepTags\` with them.
- [ ] 3. \`data/wirelist.json\`: every wire and cable on the new drawings (references/inputs.md).
- [ ] 4. \`assets/tex/\` and \`assets/tex/index.json\`: device faces (references/inputs.md: the extraction script is a
      per-job template).
- [ ] 5. \`tools/models.json\`, \`assets/models/\`: the makers' STEP models, converted (references/models.md).
- [ ] 6. \`src/model_fit.mjs\`: which model stands in for which device and how it is turned. Picture each with the
      model viewer and check it against a photo or the maker's drawing.
- [ ] 7. \`src/terminals.mjs\`: terminal layouts and entry sides for each device type; \`DEVICE_LAYOUT\`.
- [ ] 8. \`src/guide.js\`: the panel-specific blocks, in the order references/engine-map.md lists them: the enclosure,
      \`VSTYLE\`, \`PROC\` builders, terminal-block builders, end barriers, hand-placed devices, fuses, side plate and
      door devices, \`FIELD_DEVICE\` and the other off-plate ends in \`endpoint\`, \`tailFor\`, \`term\` special cases,
      \`DUCT_CLASS\`, \`kindOf\`, \`TERM_SPEC\`, \`whereText\`. Remove VFD 200's, add the new panel's.
      Expect: after each block, build and run the audit; it names the next error until the page loads.
      Then: the audit runs. UNRESOLVED and NOT DRAWN lines are wire-list ends with no device or terminal yet.

**C. Make it right**

- [ ] 9. Audit: nothing through, across, shared, behind, not drawn, unresolved; tight bends zero or named.
- [ ] 10. Every device looked at close up, front and wire-entry side (scripts/shot.mjs).
- [ ] 11. The drawings re-read against the wire list by independent readers (references/review.md).
- [ ] 12. \`build.mjs\`: this panel's readings (not-fitted wires, links, feeders, additions), each with its reason;
      DESIGN_ISSUES and MODELING_ISSUES.
- [ ] 13. \`README.md\`, \`START HERE.txt\`, \`REVISIONS.md\`, \`COMPLETION.md\` written for this panel. Delete this file.
`)
console.log(`new panel folder: ${dest}\nnext: node "${join(dest, 'build.mjs')}", then the audit (--max-kinks 2), then work down PANEL-CHECKLIST.md`)
