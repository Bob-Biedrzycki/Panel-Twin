# Engine map: what each file does, and what is specific to VFD 200

The example is one working guide, not a library. Its engine is general in how it works and specific in what it knows. This file tells you which is which, so a new panel replaces the right things and keeps the rest.

## Files

| File | What it is | For a new panel |
|---|---|---|
| `build.mjs` | Reads everything, applies the guide's readings to the wire list, inlines it all into one HTML page. Holds the page's HTML and CSS | Keep the mechanism; rewrite the special cases, issues, title and VERSION |
| `src/layout.mjs` | The panel as drawn: enclosure, ducts, rails, devices, BOM, steps | Rewrite |
| `data/wirelist.json` | The schematic sheets, transcribed | Rewrite |
| `src/terminals.mjs` | Terminal layouts per device type; which layout each tag uses; strip layouts | Keep the types you reuse, add new ones |
| `src/model_fit.mjs` | Which maker's model stands in for each device and part; rotations; pins | Rewrite the device table; keep hardware you reuse (rails, ducts, terminals, anchors) |
| `src/guide.js` | The scene, devices, landings, routing, wires, selection, the screen | Keep; replace the blocks listed below |
| `assets/models/`, `assets/tex/` | Converted models, device faces | Replace |
| `data/install_docs.json`, `install_facts.json`, `partslib*.json` | Document links and install facts per part number (optional) | Replace or empty |
| `vendor/lab-kit.js` | The studio renderer (Airsup machine skill kit, MIT) | Keep |
| `tools/audit.js` | The audit's checks, run in the page | Keep |
| `tools/` (rest) | STEP conversion, texture extraction, model viewers | Keep |

## `build.mjs`, top to bottom

| Block | What it does | VFD 200-specific |
|---|---|---|
| `stepOf(w)` | Which wiring step a wire belongs to | Yes: by this job's sheet numbers and a few wire numbers. Rewrite |
| `viaOf(note)` and the wires loop | Splits a pass-through entry into two segments; drops the number on the unnumbered side | The `TB5` rule is this job's. Keep the mechanism |
| Not-fitted loops | Marks wires the hardware makes impossible, with the reason (`s.notFitted`, `s.nfWhy`) | Yes: RCP1 jumpers, Q1 to FU1 |
| Re-ending loop | Makes junctions at a terminal strip (W24, W25 as jumpers) | Yes |
| Link loop | Marks a conductor that is a supplied metal link (`s.link`) | Yes: T1 H2-H3 |
| `FEEDERS` | Site conductors added after the cables so nothing else moves | Yes |
| Cables loop | Cores, colours, shields, remapping a misprinted core to its own port | The port remap rule is this job's |
| Fuses block | Adds each fuse as a device and the missing ones to the parts list | Yes |
| `ADDED` | Conductors added at someone's request that are on no sheet (empty in the example; the comment gives the pattern) | Keep the mechanism |
| `DESIGN_ISSUES`, `MODELING_ISSUES` | The two issue lists. A design issue that starts `NEW (V9) ` and a modeling issue that starts `V9 ` get a version badge on the Issues view | Rewrite. Keep the two-list discipline |
| `PL_URL` | The address of CPME's PartsLib, for part links | CPME-specific: change or empty it elsewhere |
| `GUIDE`, the page template | Data handed to the page; HTML and CSS; the error handler that shows a script error on the page | The title and file name come from `JOB.panel`; rewrite the description |

`build.mjs` mentions `tools/partslib_links.py` in a comment; that script made `data/partslib.json` for the example and is not in the bundle. The file is optional.

## `src/guide.js`, by section

General (keep): frame and helpers; materials; vendor model loading and face decals; scene groups; ducts, rails and subplate (drawn from `layout.mjs`); `landing`, `finishLanding`, `leadOut`; the duct graph, `entry`, `route`, `wirePoints`; `roundCorners`; `sideBySide`, `directRun`; `buildConductor`, `buildCable`, `buildLink`, `buildFeeder`; `addFuse`; markers; steps and visibility; tags; selection and tracing; picking; wire-by-wire mode; the guide panel; the toolbar, colour key, help card; the `?audit`, `?shot`, `?complete`, `?find`, `?view` hooks at the end.

Specific to VFD 200 (replace, remove, or generalise):

| Where (search for) | What it assumes |
|---|---|
| `the enclosure:` section | One two-door free-standing enclosure with a hood, from `ENC` and a Saginaw model; door swing, handles, centre post |
| `const VSTYLE` | Colours for models that carry none, by model key |
| `const PROC` | Catalogue-shape builders for this job's parts without models (motor protector, fuse holder, distribution block, transformer, isolator, NAT, ground bar) keyed by terminal layout name |
| `function pf525Blocks` | PowerFlex 525 frame D control and power terminal blocks, and their wire dressing |
| `function rtbBlock`, `function l3Ports` | Compact I/O (1769) removable terminal blocks and controller Ethernet jacks |
| `end barriers` block | Names TB1 and TB2 |
| `RCP1 1492-REC15` block | A device with no position on the layout sheet, placed by hand on rail 4 |
| `FU2 (CHCC1DU)` and `T1 (E750WB)` fuse blocks | Where this job's fuses sit |
| `subplate 2` and `door devices` sections | A second plate on the left side wall with VM1; HMI1 and E-STOP on the left door |
| `const FIELD_DEVICE` | The prefixes of this job's field device tags (`MTR`, `FM`, `CE`, `LT`, `TT`, `SC`, `Plant`). An end at anything else that is not a device is reported as UNRESOLVED |
| `function endpoint` | Off-plate ends by device name: `Panel`/`ACU`, `HMI1`, `E-STOP`, `VM1` |
| `function tailFor`, `glandAt` | Where door, wall and floor tails go |
| `function term` | `TB1` has its drive side at the bottom; `RCP1` terminal names fold onto L, N, G |
| `function whereText` | Plain-words position of a terminal, per layout type |
| `const DUCT_CLASS` | Which duct ids carry AC and which DC |
| `const kindOf` | Wire colour class from sheet number, potential and device names. Entirely this job's |
| `const TERM_SPEC` | Torque, wire range and strip length per part number, with citations |
| `stepTags`, `ALL_SUB1` | Step group names matching `layout.mjs` |

Work through this table with the new panel's parts in hand. Where the new panel has a part of a type the example already knows (a 1492-J4 strip, a PowerFlex 525, a 1769 module), reuse its block and check it against the new job's documents. Where it has a new type, write its layout, its model fit and, if needed, its builder, then look at it.

## A part with no maker's model: writing a `PROC` builder

`PROC` in `src/guide.js` maps a terminal-layout name (the value in `DEVICE_LAYOUT`) to a function that returns the part's shape. It receives one object `g`: the device's box in machine metres (`x0`, `x1`, `yT`, `yB`, `w`, `h`, `xc`, `yc`, `z0`, `z1`, `dep`), its body material `bm`, the device record `d` and its layout `lay`. It returns a list of `[geometries, material, options]`, one entry per material. The helper `blk(g, u0, u1, v0, v1, zf0, zf1, r)` makes a box from fractions of the face (u across, v down) and of the depth; `cyl` and `box` are in the helpers section. `{ noDecal: true }` keeps the face picture off that piece.

Build to the catalogue drawing's proportions: a base on the rail or plate, terminal shoulders where the terminals are, the operating face, anything a builder recognises the part by. Read `CHCC` (a fuse holder, three lines) first and `E750WB` (a transformer with boards, fuse blocks and clips) for a full one. A device with a layout name that has no builder, and no model, is drawn as a plain DIN body or box with its face picture.

Terminal blocks that sit behind covers (`pf525Blocks`, `rtbBlock`) are built the same way but also fill `dv.landings[name] = { tip, mouth, e, via?, clear? }` for each terminal, in machine metres.

## The enclosure

The `the enclosure:` section builds one free-standing two-door enclosure with a sloped hood from `ENC` (metres) and the maker's model when there is one (`PART_MODEL.enclosure`). For a different kind (a single-door wall box, no hood), set `ENC` to its dimensions, set `HOOD: 0`, and simplify that section: one door, its hinge side, one handle. The subplate, ducts and rails are drawn from `layout.mjs` and need nothing.

## Debugging in the page

`window.guide` exposes `DEV` (every device: box, model, layout, landings), `WIRES` (per segment: curve, ends, kind), `G` (the data), `soupOf(dv)` (triangles), `flyTo`, `select`, `showStep`, `showComplete`, `term`, `PZ` (the plate's face), `SX`/`SY` (sheet mm to machine metres). `tools/audit.js` can be imported and run in the console: `(await import('/tools/audit.js')).run()`.
