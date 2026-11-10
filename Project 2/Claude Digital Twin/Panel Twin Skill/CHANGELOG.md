# Changelog

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
