---
name: panel-twin
description: Build or revise an interactive 3D assembly and wiring guide ("panel twin", "digital twin of the panel", "assembly guide") for an electrical control panel from its drawing set, BOM, makers' STEP models and shop photos - one HTML file where an installer steps through the build, sees every device at real size on the backplate, and follows every wire from clamp to clamp with its marker, size, route and cut length. Use this whenever someone asks for a panel twin, a 3D or interactive build guide, wire-by-wire instructions, a wire marker list, run sheet or cut list for a control panel, VFD panel, PLC panel or enclosure; wants a panel drawing set turned into something the shop can build from; wants makers' STEP models put on a panel layout; wants a panel's wiring diagram checked against its wire list; sends shop photos to update a panel model; or says wires, terminals or parts in an existing panel guide look wrong ("that wire is screwy", "does this land on the front?", "there are still oddities"). Not for process or SCADA simulations, and not for a 3D model of how one machine works.
---

# Panel Twin

You turn a control panel's drawing set into the thing the person at the bench actually wants: the panel in 3D at real size, built up step by step, every wire landing in the real opening of the real terminal, and one screen that tells them what to do next.

The output is always a folder, one per version, named `Assembly Guide V<N>.0`:

1. `<Panel> Assembly Guide.html`: one page that opens from disk. Everything is inlined except three.js (jsDelivr) and three web fonts (Google Fonts), so it needs internet where it is used.
2. `START HERE.txt`, `README.md`, `REVISIONS.md`, `COMPLETION.md`: the handover, what changed, the checklist, what was not verified.
3. The source it was built from (`build.mjs`, `src/`, `data/`, `assets/`, `tools/`, `vendor/`).

Look at `examples/vfd200/` first. It is a complete, real guide (CPME 1082-01, panel VFD 200: 47 devices, 166 wires and cables, 33 makers' models) that went through fifteen review rounds with the engineer who owns the job, including one change of drawing revision. `examples/posters/` shows what it looks like; its drawing set is `examples/drawings/Draft rev20.pdf`. Every rule below was learned on it; `references/lessons.md` says how.

All the commands below take full paths, so you never need to change directory. `<skill>` is this folder.

## The bar

A guide is wrong in a way that matters when a builder would do the wrong thing because of it, or stop trusting it. It is not done while any of these is true:

- a wire or cable on the drawings is not in the guide, or is in the guide and not on the drawings, without a stated reason shown to the builder
- a wire ends on the face of a device, in bare housing, or in the wrong terminal, instead of in the opening it goes into
- a wire passes through a solid, across the face of a device it does not land on, or shares a line with another wire
- a device is the wrong size, turned the wrong way, or in the wrong place against the drawing or the photo
- a number on a wire card (marker, size, terminal, torque, cut length) is not from a document and does not say so
- a part cannot be found from the plate's edges: its position from the two datum edges is missing, or is not the position the 3D panel shows
- a mounting hole, cutout or tolerance is shown that no document gives. Holes with no document are not shown at all; tolerances the drawings do not give are marked as proposed
- the guide departs from the drawings anywhere and does not say so, both at that step and under Issues
- a claim of "checked" is not backed by the audit, a picture you looked at, or the document page you read

`AUDIT: PASS` is one of three checks, not the bar. It says nothing collides. It does not know whether a terminal is the right one, a model is the right way up, or a wire is missing.

Two kinds of finding come out of this work and they must not be mixed. **Design issues** are for the engineer who drew the panel: the drawing is wrong, silent or contradicts the hardware. **Modeling issues** are the guide's own assumptions. When the drawings and the hardware disagree, the guide follows the hardware, says so, and lists it as a design issue. It never silently "fixes" a drawing.

## Two jobs

**Revising an existing guide** (most of the work on a real panel) is well supported and tested: go to "Revising a guide" below.

**A new panel** starts from the worked example and replaces its data. The engine is one working guide, not a library, so the guide will not stay working at every step of that replacement; `references/engine-map.md` and the checklist say what to expect. This path has not yet been run end to end on a second panel (`REVIEW.md`). Expect to adapt the engine and say so in your handover.

## New panel workflow

### 1. Gather what exists (no code)

Find or ask for each of these, and write down which you have:

- **The drawing set** (PDF): layout sheet(s), schematic sheets, terminal summary, BOM. Run `python -I "<skill>/scripts/sheet_tiles.py" "<pdf>" "<scratch>" --text` first: a page with 0 characters of text has no text layer and must be read as images.
- **The BOM** with manufacturer part numbers (a spreadsheet becomes the `BOM` array in `src/layout.mjs`, one object per line).
- **Makers' 3D models** (STEP) for as many devices as can be had. `references/models.md` lists which sources worked and which are blocked.
- **Makers' documents** for terminal layouts, torques, strip lengths and mounting dimensions: the manufacturer's install instruction or technical data PDF for each part number. If the team has a parts database (CPME: PartsLib, through its MCP tools or the `partslib-load` skill), use it and cite page numbers.
- **Photos of the real build**, if any part of it exists. Photos overrule the layout drawing on arrangement; the maker's model overrules the photo on geometry.
- **Earlier work**: a previous version of the guide, earlier sessions, the team's notes. Search before you start.

### 2. Start from the worked example

```sh
node "<skill>/scripts/new_panel.mjs" "<job folder>/Assembly Guide V1.0"
node "<job folder>/Assembly Guide V1.0/build.mjs"
node "<skill>/scripts/audit_headless.mjs" "<job folder>/Assembly Guide V1.0" --max-kinks 2
```

The new folder is a copy of the VFD 200 guide and prints `AUDIT: PASS` (with its two known tight bends). Prove that first: it tells you the toolchain works on this machine before any of your own changes are in the way. Then work down `PANEL-CHECKLIST.md` in the new folder. It says, for each step, what state to expect: the guide stops loading when the layout is replaced and comes back when the panel-specific blocks of the engine are done, and the audit tells you the script error when it does not load.

### 3. Transcribe the wiring: `data/wirelist.json`

Every conductor and cable on the schematic sheets, one entry each: wire number, size, potential, the device and terminal at each end, sheet and line number, and a note for anything odd. `references/inputs.md` has the schema and the conventions.

Transcribe what is drawn, including its mistakes, and put the guide's reading in `build.mjs` where it is visible and commented, not in the data. The wire list is the record of the drawing; the build is where the reading is applied. That separation is what lets someone check the list against the sheets later.

### 4. Lay the panel out: `src/layout.mjs`

The enclosure, subplate, ducts, DIN rails and every device with its tag, part number, rectangle on the layout sheet, depth and install step; the BOM; the build phases and steps with their tasks.

Real widths come from the makers' documents, not from the layout sheet: layout symbols are often not to scale (the example found a 52.5 mm module drawn at 34.6 mm). When they disagree, place the device at its real size and raise a design issue.

**Measure the layout sheet's scale before scaling anything from it.** Read the plate's outline out of the PDF and divide the printed plate size by it, then check the result against two or three printed dimensions (`references/locating.md`). The example ran thirteen versions on a scale that was 0.85 % small, which put parts up to 10 mm out at the far side of the plate.

### 5. Makers' models: `tools/models.json`, `src/model_fit.mjs`

Convert each STEP file to a compressed mesh, then say which model stands in for which device and how it is turned into panel axes (X right, Y up, Z out of the plate). `references/models.md`.

**Check every model's orientation against a photo or the maker's dimensioned drawing, not against its outline.** A model whose height and depth are nearly equal will sit happily on its back with its top facing you; the example's power supply did exactly that for six versions. Picture the model from six sides:

```sh
node "<skill>/scripts/shot.mjs" "<guide folder>" "<scratch>/KEY.png" --page "tools/model_viewer.html?k=KEY&v=front,right,top,bottom,back,left&s=330"
```

Devices with no maker model are built from their catalogue shape (`references/engine-map.md`, PROC builders). A device with neither gets a plain box with its face picture, which is acceptable for a first version and must be listed as a modeling issue.

### 6. Terminals and landings: `src/terminals.mjs`, `src/model_fit.mjs`

For each device type: where each terminal is, and which way the wire enters. Then the guide finds the opening on the model and puts the conductor in it. `references/landings.md`.

The order of trust for a terminal's position: the maker's model (measure it), then the maker's manual figure, then a photo of the fitted part, then the layout sheet's face picture (often several millimetres off). Record the source in the layout's `src` string; the guide shows it on the part.

### 7. Locating: datums, positions, mounting holes, tolerances

The guide says where every item goes from the same two edges of the plate, because that is how a builder measures: datum B the top edge, datum C the left edge, datum A the plate face, baseline dimensions only. The numbers are read back from the 3D model, so the engine does this for any panel once the layout is right; what you supply is in the `LOCATE` block of `src/guide.js` (`references/locating.md`):

- `PRINTED`: what the layout sheet prints as a dimension for a part, quoted, as the check on the ordinates.
- `DOOR_ITEMS`: door cutouts from the door's own edges, as the door sheet dimensions them.
- `HOLES`: mounting holes, **only where a maker's document or the drawing gives them, each with its citation**. No document, no entry, and the guide then shows nothing for that part: no estimate, no "typical", no pattern assumed centred. Where a document gives a pattern but not where it sits in the outline, give the pattern and say "mark through the part".
- Tolerances: drawings rarely give any. The guide proposes three classes (a 1, 3 and 6 mm position zone to A, B, C) and marks them as proposed, with a design issue. Replace them when engineering gives real ones.

A dimension between two parts (a fuse block under its switch) has to be read off the maker's figure for what it runs between; the example had one wrong for six versions.

### 8. Build, then audit

```sh
node "<guide folder>/build.mjs"
node "<skill>/scripts/audit_headless.mjs" "<guide folder>" --json "<scratch>/audit.json"
```

The audit walks every conductor through the finished model and fails if anything is through a solid, across a device it does not land on, sharing a line in a clamp, behind the plate, not drawn, landing on a device or terminal that does not exist, or bent tighter than the wire. If the page threw a script error it prints the error. `references/review.md` explains each line of its output.

Fix causes, not symptoms: a wire through a housing usually means the terminal or the model is in the wrong place, not that the wire needs a detour. Tight bends should be zero; if some remain, pass `--max-kinks N` and name them in the handover. Do not raise it to make a problem go away.

Keep check outputs (JSON, pictures, sheet tiles) out of the version folder: in a scratch folder, or a `checks` folder beside the version folders if the team wants them kept.

### 9. Look at it like the person who has to build from it (required)

```sh
node "<skill>/scripts/shot.mjs" "<guide folder>" "<scratch>/whole.png" --complete
node "<skill>/scripts/shot.mjs" "<guide folder>" "<scratch>/cb4.png" --complete --find CB4
node "<skill>/scripts/shot.mjs" "<guide folder>" "<scratch>/io1-below.png" --complete --view 0,-30,0.12,<xc>,<yc>,<z1>
```

`<xc>,<yc>,<z1>` for every device are in the audit JSON under `devices`. A picture takes from 10 seconds to 2 minutes depending on the machine, so run several at once in the background rather than one after another. Add `--tab wire|parts|wires|issues` to picture what the instructions panel says. Read every picture you make. Go device by device: from the front, and from the side the wires enter. For each one ask: is this the part in the photo or the catalogue; is it the right way round; does each wire go into an opening; could a hand and a screwdriver actually do this. Where you have a photo, put the two side by side.

Picture the locating too: a mounting step (`--step N`), its Locate view (`--step N --tab locate`), its full-screen mark-out drawing (`--step N --locbig`) and a plate-mounted part's card (`--find TAG --tab parts`).

For a new guide, do this for every device, not a sample: in the example, each round of looking found something the audit had passed. If a browser pane is available, `node "<skill>/scripts/serve.mjs" "<guide folder>"` serves it; `window.guide` has `DEV`, `WIRES`, `flyTo`, `select`, `showComplete`.

### 10. Read the drawings against the wire list (required before a first handover)

Go through every schematic sheet conductor by conductor and compare with `data/wirelist.json`. `references/review.md` gives the procedure, including how to split the sheets across independent readers and what to tell them. Report only differences, then check each one on the sheet yourself before acting on it. In the example this found the incoming feeder and ground, which had been missing for eleven versions because they are drawn dashed and unnumbered.

### 11. The screen

The engine's screen is already laid out for an installer: views along the top, one bar of large buttons at the bottom that never moves, a tool rail on the 3D view, progress always in sight, a larger-text toggle, and it reopens at the step it was left at. Keep those properties when you change it. `references/screen.md`.

### 12. Hand over

Write, for this version:

- `START HERE.txt`: one page for the builder. How to open it, what the screen does, and a list of everything in the guide that is not as the drawings show it.
- `README.md`: what is new in this version, what is still open.
- `REVISIONS.md`: the checklist for this round. Tick an item only after it was changed and then checked, and say how it was checked.
- `COMPLETION.md`: what was asked, what was done and checked, what was not verified.

Then tell the person, in this order: what state it is in and whether it is saved; what you changed; anything that departs from the drawings or rests on your own reading and needs someone to confirm it; the audit numbers; what you did not check. Save the work the way the repository says to (some repos have a save tool and store large files outside git; the built HTML is about 14 MB).

## Revising a guide

```sh
node "<skill>/scripts/new_version.mjs" "<...>/Assembly Guide V12.0"          # makes V13.0 beside it, VERSION set
node "<skill>/scripts/audit_headless.mjs" "<...>/Assembly Guide V12.0" --json "<scratch>/before.json" --max-kinks 2
#   ... make the change in V13.0 ...
node "<...>/Assembly Guide V13.0/build.mjs"
node "<skill>/scripts/audit_headless.mjs" "<...>/Assembly Guide V13.0" --json "<scratch>/after.json" --max-kinks 2
node "<skill>/scripts/diff_routes.mjs" "<scratch>/before.json" "<scratch>/after.json"
```

- **Never edit a version that was handed over.** It is the record of what the builder was given; the next round has to be comparable with it.
- **Audit the last version before changing anything**, so you can say what your change did.
- **`diff_routes.mjs` answers "did anything else move?"** It compares every wire in the two versions. When it shows only the changes you meant, you need to look closely only at the devices you touched, and you say that is what you did. When it shows more, look at those too.
- **Re-read the drawings (step 10) only if the wire list or a reading of the drawings changed.**
- **A new revision of the drawing set** is a revision of the guide, not a new panel. Compare the two PDFs page by page first (render both, difference them), then have readers list what changed per sheet group; rewrite the wire list by script from those findings, and have readers who have not seen it check it against the new sheets. Wire numbers can change wholesale: say so to the builder first, because markers made from the last revision are then wrong.
- **When a part moves**, its Locate numbers, mark-out drawing and wire routes follow by themselves. Re-check what the sheet prints for it (`PRINTED`) and its `HOLES` entry.
- **When the complaint is vague** ("still oddities"), find candidates yourself (audit, then pictures of every device), and say which you found and fixed and that you could not tell whether these were the ones meant.
- **When the reviewer mentions something a third person said** ("someone mentioned the fuse block"), search earlier sessions and notes; if there is no record, go to the maker's instruction for that part and say your fix is a reading to be confirmed.
- **A question** ("do the wires go in the front?") is a request to find out from the hardware, the photos and the maker's document, answer it, and fix the model if the answer shows it is wrong.
- **A wire the person asks you to add that is on no sheet**: first read the sheets (`sheet_tiles.py`) to confirm both terminals are free and that it really is on no sheet. Then it goes in `ADDED` in `build.mjs` (the comment there gives the full pattern), not in the wire list: no invented wire number or potential, a note beginning "NOT ON THE DRAWINGS", a task and a flag on its step, and a design issue asking engineering to add it to the sheets (rewrite an existing issue about the same gap rather than leaving two that disagree). Add new segments at the end, never in the middle: a wire's place in the list is its lane in the ducts and its saved tick. Then read what the builder will be told: `shot.mjs --find s<id> --tab wire`, and `--tab wires`, `--tab issues`.
- **When the reviewer hands you a decision** ("use your discretion"), make it, say what you chose and why in one paragraph, and leave it listed for engineering.
- **Fix what you find on the way**, and say that you did, separately from what was asked.

## Reference files

| Read | When |
|---|---|
| `references/inputs.md` | Writing `wirelist.json` and `layout.mjs`; reading sheets with no text layer; device faces |
| `references/models.md` | Getting and converting makers' STEP models; orientation; performance |
| `references/landings.md` | Terminal positions, openings, how wires leave devices, special cases |
| `references/locating.md` | Datums and baseline dimensions, checking the sheet's scale, mounting holes from documents only, the tolerance proposal |
| `references/engine-map.md` | What each source file and each block of `guide.js` does; what is VFD 200-specific; writing a builder for a part with no model |
| `references/review.md` | The audit's output line by line, looking at devices, the drawing review, what to report |
| `references/screen.md` | The installer screen and why it is the way it is |
| `references/lessons.md` | What each of the twelve review rounds found and the rule it left behind |

## Requirements

Node 18+, Python 3 with `pymupdf` and `pillow`, Edge or Chrome for the command-line audit and pictures, and internet access. STEP conversion needs `npm install` in the guide's `tools/` folder (occt-import-js) and, for the fallback reader, `pip install cascadio trimesh numpy` in a virtual environment.

On Windows, do not rewrite source files with PowerShell (`Get-Content | Set-Content`): it corrupts every non-ASCII character and can add a byte-order mark; `scripts/fix_mojibake.py` repairs the text. Do not pipe a long-running save or build into `Select-Object -First N`: PowerShell stops the process once it has its lines.
