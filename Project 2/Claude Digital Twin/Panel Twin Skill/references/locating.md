# Locating: datums, positions, mounting holes, tolerances

The guide tells a builder where every item goes the way a builder measures: a tape or a square hooked on an edge. This file says how that is set up, what may be shown, and how to check it. The code is one block in `src/guide.js` (search `LOCATE`); it carries its own styles and hooks into the screen in a dozen marked places.

## The idea

- **Three datums.** A is the face of the subplate, B its top edge, C its left edge. Use the corner the layout sheet itself dimensions from; if the sheet dimensions from another corner, move B and C to it rather than converting.
- **Baseline dimensions only.** Every position is given from B and C, never from the previous part. A chain adds every error along it; a baseline does not.
- **Numbers come from the model.** `LOC.ITEMS` is read back from the placed 3D parts (`DEV` boxes), the ducts and the rails. The picture and the number therefore cannot disagree, and correcting a position in `layout.mjs` corrects both. Do not keep a second table of positions.
- **Other surfaces use their own datums.** Door cutouts are given from the door's own edges, as the door sheet dimensions them (`DOOR_ITEMS`).
- **What sheet prints, quote.** Where the layout sheet prints a dimension for a part, put it in `PRINTED` verbatim, with what it runs between. It is the check on the ordinates.

## What the builder gets

| Where | What |
|---|---|
| Locate view (top bar) | Per mounting step: mark-out drawing (datum edges, an ordinate per item), table (left and right edge, top and bottom edge or rail centre line, mm and inches, what a rail part sits against, tolerance), full-screen drawing (a rail step zooms to its rail), print sheets, CSV |
| Build view | A "Where it goes" table on every mounting step. The mark-out step lists everything drilled for: ducts, rails, plate parts |
| Part page | A "Where it goes" card first: two numbers, a check dimension, tolerance, what the sheet prints, and the mounting holes if a document gives them |
| 3D panel | Datum edges lit; a tape along each rail with a number at every part's left edge; leaders and numbers to a selected part; hole columns as centre lines. The Dimensions button (L) turns it off. It shows in the mounting phases and in Locate, not while wiring |

One colour (magenta) is kept for everything dimensional, so nothing dimensional is mistaken for a wire.

## Check the scale of the layout sheet before trusting any picture

Most positions are scaled from the layout sheet's pictures. Measure the scale; do not assume it.

1. Find the plate's outline in the PDF (`page.get_drawings()`: the large filled rectangle) and read its size in points. Divide the printed plate size by it. In the example the 1118 x 1422 mm plate is 505.68 x 643.56 pt: 2.2109 and 2.2096 mm per point, origin (404.76, 51.24) pt.
2. Check against printed dimensions that do not depend on the outline: a duct width, a part's distance from an edge, a part's real width from its maker's document. The example's checks: PDB1 20.0 mm from the right edge (printed 20), a drive 130 mm wide (130 in 520-UM001), T1 162 mm (162 in the catalogue).
3. A new revision of the same sheet can shift on the page: measure the origin again.

The example carried a 0.85 % scale error for thirteen versions (1118 mm taken as 510 pt). It put parts up to 8 mm too far left and 10 mm too high, and rail parts 2 to 7 mm off their rails. Ducts and rails were right because they came from printed dimensions, which is why nobody saw it. `tools/extract_textures.py` now writes true mm (`TRUE_X0`, `TRUE_KX`, ...).

## Mounting holes and cutouts: documents only

`HOLES` in the `LOCATE` block holds a part's mounting holes. The rule is strict, because a hole in the wrong place cannot be moved:

- **Every number is printed in a maker's document or on the drawing set, and the entry cites it** (document, page or drawing number). Nothing is scaled off a picture, taken from a similar part, or worked out by assuming a pattern is centred.
- **A part with no document shows nothing.** No placeholder, no "typical", no estimate. The part's page then gives its outline position only.
- **Give exactly as much as the document gives.** A pattern with no position inside the outline is shown as a pattern, with the words "mark through the part". Hole columns that documents fix on the plate go in `cols` and are drawn as centre lines. A height the documents disagree about is left out and raised as a design issue.
- **Two documents agreeing is worth saying.** In the example sheet 3's 47 mm from the right edge and Rockwell's 3.32 in from the end of the mechanism both put Q1's right-hand holes at 1071 mm.

Where to look, in order: the maker's dimension drawing for the exact part (often a separate drawing from the manual), the installation instruction (drilling templates, hole sizes, screw sizes), the technical data or catalogue page. If the team has a parts database (CPME: PartsLib), read the pages there and cite them. Read the figure, not just the table: a column of letters means nothing until the figure says what each letter runs between.

**A dimension between two parts needs its two ends read off the figure.** The example placed a fuse block 53 mm wrong for six versions by reading "DIM Z" as the gap between two mouldings; the maker's figure draws it between the two rows of mounting holes, and the layout sheet dimensioned it the same way all along. When a model and the drawing's picture disagree, read the document before deciding the drawing is wrong.

What the example holds, as a pattern for the entries:

| Part | Given | Source |
|---|---|---|
| Q1 | 4 holes 46.0 x 124.0; columns 1025, 1071; 11/64 in pilot holes | Rockwell drawing 10001235194; 1494U-IN001 p.2; sheet 3 |
| FU1 | 2 holes 46.0 apart; 113.0 mm (Z) below Q1's slots | Rockwell drawing 10001237277; 1494U-IN001 p.10 |
| DRV1, DRV2 | 4 holes 116.0 x 247.0, M5 | 520-UM001 p.188, p.15 |
| Lug1 | 2 holes 44.5 apart, 9/16 in | Burndy sheet |
| GB1 | 2 holes 50.3 apart, first 65.2 from the end, #10 | ILSCO page C-235 |
| T1 | 4 slots 7.9 x 21.6; two widths, two depths | SolaHD catalogue p.173, p.175 |
| PDB1 | 3 columns only | 1492-TD019 p.14 |
| ducts, rails, HMI, E-STOP, A/C, valve plate | nothing | no document read |

## Tolerances: a proposal, and say so

Panel drawings rarely carry datums or tolerances. The guide proposes three classes and marks them as proposed everywhere they appear, with a design issue asking engineering to confirm them or give the shop standard. Do not present them as the drawing's.

| Class | Position tolerance | Plain words | Used for | Why |
|---|---|---|---|---|
| C, critical fit | ⌀1 mm to A, B, C | within ±0.5 mm | parts another part must line up with: a disconnect and its handle, a fuse block under its switch, door cutouts | a mechanism or a seal depends on it |
| F, fixed to the plate | ⌀3 mm to A, B, C | within ±1.5 mm | ducts, rails, plate-mounted parts | drilled or screwed down, cannot be moved later; wire lengths and clearances depend on it |
| S, on a DIN rail | ⌀6 mm to A, B, C | within ±3 mm along the rail | rail-mounted parts and end anchors | it slides: the order and what it sits against matter more than the number |

Each is shown as a feature control frame (position symbol, zone, A, B, C) with the plain words beside it. If engineering gives real tolerances, replace `TOL` and drop the word "proposed"; if a maker's document gives one (a cutout tolerance), it goes with that part's document entry, not in `TOL`.

## Job-specific parts of the block

`PRINTED`, `HOLES`, `DOOR_ITEMS` and the class rule (`it.cls`) are this job's. `new_panel.mjs`'s checklist has you empty the first three before anything else, so a new panel never shows the example's holes.

## Checking it

- Pictures: `shot.mjs --step N` on a mounting step (tape and table), `--step N --tab locate`, `--find TAG --tab parts` (the card), `--step N --locbig` (the full-screen drawing).
- For every plate-mounted part compare the card's numbers with what the sheet prints.
- After moving anything, run the audit and `diff_routes.mjs`: every wire on a moved part moves.
- Say what was not opened (print, CSV, narrow screen).
