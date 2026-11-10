# Changelog

## 1.1.0

Locating, mounting holes and a scale correction, from three more review rounds on VFD 200 (V13 to V15).

- **Locate.** Every duct, rail, rail part, plate part and door cutout has its position from two datum edges (B top, C left; A the plate face), as baseline dimensions read back from the 3D model: a Locate view (mark-out drawing per step, table in mm and inches, full-screen drawing, print sheets, CSV), a "Where it goes" table on each mounting step and card on each part, and on the 3D panel the datum edges, a tape along each rail and leaders to a selected part. New `references/locating.md`; SKILL.md step 7.
- **Mounting holes: documents only.** `HOLES` holds a part's hole pattern only when a maker's document or the drawing gives it, with the citation. No document, nothing shown.
- **Tolerance proposal.** Three position classes (1, 3 and 6 mm zones to A, B, C) shown as feature control frames and plain words, always marked as proposed.
- **Scale check.** The layout sheet's scale is measured from the plate outline and checked against printed dimensions. The example had been 0.85 % small; corrected.
- **Drawing revisions.** How to take a new revision of the drawing set (difference the PDFs, readers per sheet group, wire list rewritten by script and re-read).
- **Worked example** is now Assembly Guide V15.0, built from Draft rev20 (`examples/drawings/`): door devices on the right door, the rev20 subplate, 123 wires and 37 cables, FU1 at DIM Z between the mounting-hole rows. Audit: PASS with two tight bends, as before.
- `scripts/shot.mjs`: `--tab locate`, `--locbig`. `scripts/new_panel.mjs`: checklist items 1b and 11b. Evals: rev20 names, one new eval (holes with and without a document).
- Not changed: the audit (`tools/audit.js`), the other scripts, the four V12 posters (four Locate posters added).

## 1.0.0

First bundle, made from the VFD 200 panel twin (CPME 1082-01) after twelve review rounds.

- `SKILL.md` and seven reference files.
- Scripts: `new_panel.mjs`, `new_version.mjs`, `audit_headless.mjs`, `diff_routes.mjs`, `shot.mjs`, `serve.mjs`, `sheet_tiles.py`, `fix_mojibake.py`.
- Five evals; review and test record in `REVIEW.md`.
- Worked example `examples/vfd200/`: Assembly Guide V12.0 as handed over, plus these engine changes made for the skill. What a builder sees is the same except the two display fixes.
  - `src/guide.js`: the `?audit=1` hook (result, device positions and every wire's route left in the page); `?shot`, `?complete`, `?find`, `?view` page parameters; Find accepts a segment id (`s195`); ends that name no device or terminal are collected (`UNRESOLVED`); `FIELD_DEVICE` named; `s.added` wires read "NOT ON THE DRAWINGS"; guards on two blocks that looked devices up by name.
  - `src/guide.js` display fixes: version badges on the Issues view work for V10 and later (V11's design issues showed "V4"); modeling issues likewise.
  - `build.mjs`: `ADDED` (empty, with the pattern); the page shows a script error instead of a blank page; the title and file name come from `JOB.panel`; the byte-order mark at the start of the file removed.
  - `tools/audit.js`: unchanged from V12.

### After the first review (same release)

A cold-read review and a with-skill / no-skill test found: runs colliding on a shared browser profile, script errors hidden behind a blank page and a "picture written" success, a mistyped device tag passing as a field wire, two free tight bends, no way to start a revision or to compare two versions, device positions promised but not in the audit output, and a new-panel checklist that could not be followed in the order given. All fixed above; the record is in `REVIEW.md`.
