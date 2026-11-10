# Inputs: the wire list and the layout

## Reading a drawing set that has no text layer

Run `python -I scripts/sheet_tiles.py <pdf> <out> --text`. A page that reports 0 characters is drawn entirely as outlines: nothing can be searched or extracted, and a whole page at screen size is unreadable. Read it as images:

```sh
python -I scripts/sheet_tiles.py drawing.pdf out/tiles --pages 4-15 --dpi 300 --grid 4x3
python -I scripts/sheet_tiles.py drawing.pdf out/tiles --clip 4,0.0,0.0,0.45,0.4 --dpi 400    # one corner of sheet 4, closer
```

Look at the `_all.png` overview to find your way, then read every tile. Re-crop at higher dpi anything you cannot read with confidence. Never guess a wire number or a terminal you could not read: record it under `unreadable` in the wire list and say where on the sheet it is.

Schematic sheets carry line numbers down the side (0417, 0531). Record them: they are how a builder or an engineer finds the same wire on the sheet, and how cross references between sheets are checked.

## `data/wirelist.json`

The record of what the schematic sheets show. Top-level keys:

| Key | What it holds |
|---|---|
| `source` | Which drawing and sheets it was taken from |
| `wires` | One entry per conductor |
| `cables` | One entry per multi-core cable or patch cord |
| `terminals` | One row per terminal of each strip, from the terminal summary sheet (a cross-check; the guide does not read it) |
| `devices` | Each device tag, its part number and the terminals the drawings use on it (a cross-check) |
| `unreadable` | Anything on a sheet that could not be read, with its place |

A wire:

```json
{ "wire": "W32", "awg": "8", "potential": "L10", "color_if_shown": null,
  "from": { "dev": "CB2", "term": "T1" }, "to": { "dev": "DRV2", "term": "L1" },
  "sheet": 4, "line": "0459", "note": "" }
```

- `wire`: the number as printed, or `""` when the drawing gives none. Do not invent numbers.
- `awg`: as printed, or `null`. Do not guess a size.
- `term`: the terminal name as printed on the drawing. Extra words go in brackets after it: `"1L1 (H1 primary fuse)"`. The build matches the name before the bracket first.
- `inferred: true` when an end is your reading and not drawn (a conductor ending on a junction dot, say). Say why in `note`.
- A ground bar is `"dev": "GND BAR"`; the guide lands these on the next free tap of the bar. `"term": "1"` reserves tap 1.

A cable:

```json
{ "cable": "EVT005-01", "type": "EVT005", "from": { "dev": "LT1" }, "to": { "dev": "TB4" },
  "cores": [ { "color": null, "term_from": "1", "term_to": "TB4-4", "potential": "IOL1-1" }, ... ],
  "sheet": 11, "note": "core colours not shown; instrument pin 2 not used" }
```

Every core lands on its own terminal and is drawn in its own colour. An Ethernet patch cord has `"cores": []` and a `type` containing "Ethernet".

### Conventions that keep the guide honest

- **Pass-through terminals.** When a conductor runs device to terminal strip to device and the drawing gives one number, write one entry and name the strip in the note: `"via TB5-3"` or `"-> TB5-1 ->"`. The build splits it into two physical segments. Check on the sheet which side of the terminal carries the number; in the example the numbers were on the door side only. The build recognises strips tagged `TB` plus one digit (`viaOf`, `tbTerm` and the cables loop in `build.mjs` all match `TB\d`); for other tags (`X1`, `TB12`) extend those three patterns, taking care that a plug name like `X01-1` is not read as a strip.
- **Additions.** A conductor someone asks for that is on no sheet does not go in this file. It goes in `ADDED` in `build.mjs` (the comment there gives the pattern), with no invented number, and is raised as a design issue.
- **Device names.** A far end at a field device must match the job's field prefixes (`FIELD_DEVICE` in `src/guide.js`), or the audit reports it as UNRESOLVED. That is deliberate: a mistyped tag must not pass as site wiring.
- **Junction dots.** A junction on a schematic has to be made at a terminal somewhere. If the drawing does not say where, record the conductor as drawn, mark it in the note, raise a design issue, and make the choice in `build.mjs` with a comment. The usual right answer is a jumper on the terminal strip.
- **Field and site wiring.** A far end at a field device (motor, instrument) or the plant supply is given its device name; the build routes it to a gland or, when no entry is drawn, shows a short tail at the landing. Dashed, unnumbered conductors still count: the incoming feeder and ground are wires.
- **Jumpers and links.** Record every unnumbered jumper the sheet draws, including the ones makers supply as hardware (a transformer's voltage link). The build decides how each is drawn.
- **Things the hardware makes impossible.** If the BOM part cannot take the conductor as drawn (a trailer fuse block has no line lugs; a receptacle has one terminal block where the sheet shows four terminals), record the drawing, and mark the entry not fitted in `build.mjs` with the maker's document as the reason.
- **Known misprints.** Record them as printed, with a note. The correction is applied in `build.mjs`.

## `src/layout.mjs`

All positions are millimetres on the layout sheet, measured from the top left of the subplate, X to the right and Y down.

| Export | What it holds |
|---|---|
| `JOB` | Project, job number, panel name, drawing name, revision, sheet count |
| `ENC` | The enclosure and subplate in metres: width, body height, depth, wall, hood, floor height, subplate width and height |
| `BOM` | Every BOM line: `pn`, `mfr`, `cls`, `qty`, `where` (the tags), `desc`, `sheet`; `field: true` for parts not in the panel |
| `DUCTS` | Each wire duct run: `id` (D1...), `r` `[X0, X1, Ytop, Ybottom]`, `size` (`2x2`, `3x2`) |
| `RAILS` | Each DIN rail: centre line `y`, `x0`, `x1`, name |
| `ANCHORS` | End anchor positions along each rail |
| `DEVICES` | Every device (below) |
| `PHASES`, `STEPS` | The build order (below) |

A device:

```js
{ tag: 'IO1', pn: '1769-OW16', at: 'sub1', rail: 'r3', tex: 'IO1', face: 'line', depth: 87,
  depthNote: '1769-IN062 p.14 (118 x 87 x 52.5 mm)', body: '#d0d1cf', step: 'rail3',
  r: [260.3, 312.8, 837.4, 968.4], xNote: 'real width 52.5 mm; sheet 3 draws it 34.6 mm: see Design issues' }
```

- `at`: `sub1` (the main subplate), `sub2` (the side plate), `door`, `enc` (on the enclosure itself). `build.mjs` adds fuses with `at: 'fuse'` (drawn inside another device); they are not written here.
- `r`: its rectangle on the sheet. Omit it and the face picture's rectangle (`assets/tex/index.json`) is used.
- `depthNote`, `xNote`, `note`: where a dimension or position comes from, and any departure from the drawing. They are shown on the part.
- A terminal strip has `strip: { n, pitch, h, depth, x0, kind }` and a `rail`.

A step:

```js
{ id: 'w24', phase: 'P4', title: '24 V DC distribution (sheet 7)', show: ['all-sub1'], wires: { sheet: [7] },
  view: { az: 0, el: 6, dist: 1.4, target: [-0.05, 0.75, 0.06] }, parts: [], why: '...', tasks: ['...'], flags: ['...'] }
```

- `tasks` are what the builder ticks. Write each as one action with its numbers and its document: "CB3 FAZ-D2-3-NA (2 A, 3-pole) at 573-625 mm."
- `flags` are things to check with engineering before doing the step.
- Which step a wire belongs to is decided in `build.mjs` (`stepOf`), by sheet by default.

The BOM usually arrives as a spreadsheet or as BOM sheets in the drawing set. Each line becomes one object in `BOM`; `where` holds the device tags that use it, exactly as they appear in `DEVICES`.

The version number is the `VERSION: '12.0'` property of the `GUIDE` object in `build.mjs` (`scripts/new_version.mjs` sets it). The built file's name and the page title come from `JOB.panel`.

## Device faces

Each device's front is a picture laid over its model: `assets/tex/<TAG>.webp`, with its rectangle on the layout sheet (mm) in `assets/tex/index.json`:

```json
"FU2": { "file": "FU2.webp", "X0": 138.7, "X1": 157.7, "Yt": 141.4, "Yb": 214 }
```

`tools/extract_textures.py` and `tools/make_faces.py` in the example are **this job's scripts, kept as templates**, not general tools. `extract_textures.py` hard-codes the drawing's path, the layout sheet's scale and plate origin, and a rectangle per device; `make_faces.py` hard-codes shop photo names and pixel corners. For a new job, copy the approach:

1. Render the layout sheet with pymupdf. Find two points whose real distance you know (the subplate's corners and its dimensioned width) to get points per millimetre and the plate's top-left origin.
2. For each device, find its rectangle on the sheet (crop and look, as in `scripts/sheet_tiles.py --clip`), convert to plate millimetres, save the crop as WebP, and write the rectangle to `index.json`.
3. Where the sheet has no face picture, or the wrong one, and a straight-on photo of the fitted part exists, rectify the photo to a flat face with a perspective transform instead. Where there is neither, leave the face off: a plain model is better than a wrong label.

`tools/detect_terminals.py` (needs OpenCV) was an early helper for finding screw heads on a face picture; it is not part of the workflow.
