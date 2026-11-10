# Skill review and test record

Panel Twin skill 1.0.0, reviewed and tested 2026-11-09 by the session that wrote it, using fresh agents that had no knowledge of that session.

## Verdict

- **Revising an existing guide: ready for team members to use.** Tested twice on a real task; every command in "Revising a guide" worked as written in the second round.
- **Starting a brand-new panel: ready to try, not proven.** The path is documented and the tools now report what goes wrong, but nobody has yet taken a second panel from drawings to a finished guide with this skill. The first person who does should expect to adapt the engine, and should add what they learn here.
- **What the skill adds over just handing someone the V12 folder is modest for a small change and should not be oversold.** See "With the skill and without" below.

## What was reviewed to write it

- All twelve versions of the VFD 200 guide and their `README.md`, `REVISIONS.md` and `COMPLETION.md` (V1 to V7 from earlier sessions, V8 to V12 in the authoring session).
- The reviewer's requests in each round and what they turned out to mean.
- The skills and tools the work used: Airsup's `machine` skill (its kit is the guide's renderer, and its repository is the framework this bundle follows), CPME's PartsLib (for makers' documents), the `skill-creator` skill (for the test method), the repository's save tool, pymupdf, headless Edge.
- The team's notes on makers' CAD sources, the STEP conversion pipeline, and the shop photos.

## Test 1: cold-read review

A fresh agent was told to read every file as a newcomer, verify each factual claim against the example, run the quick start as written, and find where it would get stuck on a new panel. It ran 37 tool calls over about 12 minutes.

**It confirmed:** every name `references/engine-map.md` points to exists; the data formats in `references/inputs.md` match the real files; the quick start builds, audits and pictures the example as described.

**Its comments, and what was done:**

| # | Comment | Done |
|---|---|---|
| 1 | The new-panel checklist cannot be followed in order: after the layout is replaced the page is blank until the engine blocks are done, and "audit clean after each step" is impossible | Checklist rewritten in three groups with the expected state at each step; SKILL.md says plainly that the guide does not stay working throughout |
| 2 | A script error gives a blank page, an unhelpful audit message, and "picture written" with exit 0 | The page now shows the error; the audit prints it with the function it came from; `shot.mjs` fails on it. Tested by breaking the layout on purpose |
| 3 | Two runs at once collide on a shared browser profile; output folders are not created; a stale `.html` can be the one audited | A throwaway profile per run, one retry, output folders created, the newest `.html` used with a warning, `--html` to choose |
| 4 | A mistyped device tag on one end is drawn as a field tail and counted as drawn | Ends that name no device or terminal are collected and fail the audit (`UNRESOLVED`). Tested with a deliberately wrong wire |
| 5 | `--max-kinks` defaulted to 2, the example's own two bends: a new panel got two free | Default 0; the example is run with `--max-kinks 2` and the PASS line says so |
| 6 | The audit did not print openings not found, overlaps, or count "behind"; device positions were promised in the JSON and were not there | All printed; "behind" fails; the JSON carries every device's position and every wire's route |
| 7 | `extract_textures.py` and `make_faces.py` are this job's scripts, presented as general tools | `references/inputs.md` now calls them templates and gives the steps to do it for a new job |
| 8 | `references/models.md` commands failed as written; the STEP folder location and the options were not stated; no way to picture a model | Commands fixed and tested; location and options stated; `shot.mjs --page` pictures the model viewer |
| 9 | `REVIEW.md` was referred to and did not exist | This file |
| 10 | "Everything else inlined" was false (web fonts) | Corrected everywhere; the guide needs internet where it is used |
| 11 | Wrong `at` values; `VERSION` is a property, not a constant; the output name was hard-coded | Corrected; the name and title now come from `JOB.panel` |
| 12 | Evals 2 to 4 need the drawing set, which was outside the bundle | `examples/drawings/Draft rev18.pdf` added |
| 13 | The description missed cut lists, wire labels, backplate, STEP models, photos, and could trigger on process twins | Description rewritten |
| 14 | No builder contract for parts with no model; no guidance for a different enclosure or a spreadsheet BOM | Sections added to `references/engine-map.md` and `references/inputs.md` |
| 15 | Pass-through terminals only work for strips tagged `TB` plus one digit | Documented with how to extend it. **Not changed in the engine** |
| 16 | CPME's PartsLib address is built into every guide | Documented as CPME-specific. **Not changed** |
| 17 | Repetition between files (the PowerShell warning, the photo rule, two stories told four times) | **Left.** Each file is read on its own |

## Test 2: a real revision, with the skill and without

**Task, as a user would type it:** "In the VFD 200 guide, IO1's VAC-VDC 2 terminal has no supply. Add a 16 AWG wire for it from PDB2 OUT8 on the 24 V sheet, as a new version, and make sure nothing else broke."

Three runs by fresh agents. The baseline was given only the V12 folder and told not to read the skill.

| | With skill, round 1 | Without skill | With skill, round 2 (after the fixes) |
|---|---|---|---|
| New version folder, built, V13.0 | Yes | Yes | Yes |
| Wire drawn, both ends in their openings | Yes | Yes | Yes |
| Added last, so no existing wire moved | Yes | Yes | Yes |
| Earlier version untouched | Yes | Yes | Yes |
| Audit before and after reported; nothing through, across or shared | Yes | Yes (in a browser, by hand) | Yes |
| Every existing wire shown unchanged | Yes (own script) | Yes (own script) | Yes (`diff_routes.mjs`: 195 identical, 0 changed, 1 new) |
| Wire list left as the record of the drawings | Yes | No (added a new section to it) | Yes |
| No invented wire number | Yes | **No (called it W101)** | Yes |
| Builder told it is not on the drawings | Yes | Yes | Yes |
| Read the sheets to confirm the terminals were free | No | No | Yes |
| Handover documents updated | Yes | Yes | Yes |
| Checks passed | 10 of 11 | 9 of 11 | 11 of 11 |
| Time | 26 min | 13 min | 15 min |
| Tokens | 254,000 | 256,000 | 195,000 |

I checked the outputs myself: the version numbers, where the wire was put, whether a number was invented, and an independent audit of the round-one with-skill guide (PASS).

**What this shows, honestly:**

- The baseline did the job well. V12's own documents and comments are good enough that a careful agent gets most of the way without the skill. Its two misses are exactly the two conventions the skill states: do not invent a wire number, and keep the wire list as the record of the drawings.
- In round 1 the skill made the run slower, not faster. The screenshot and audit tools collided with another run and failed without saying why. That was the skill's fault and is fixed.
- Both round-1 agents wrote their own script to prove no other wire moved. That is now `diff_routes.mjs`, and the round-2 agent used it in under a second.
- Round 2 was a little slower than the baseline and used a quarter fewer tokens, with every check passing. Two caveats: it is one run, and **round 2 was easier than it should have been**, because the comment I had written in `build.mjs` to show the pattern used this exact wire as its example. The example in the comment has since been changed to a different wire. Treat round 2 as showing the commands work, not as a fair measure of speed.

**Round 2's comments, and what was done:**

| Comment | Done |
|---|---|
| Pictures took 1 to 2 minutes each, not the 10 to 60 seconds stated | Timing corrected; the skill says to run them in the background, several at once |
| `shot.mjs` could not show the wire card, wire list or issues | `--tab wire|parts|wires|issues` added and tested |
| The printed run sheet ignored an added wire | Fixed in the example engine |
| "A task and a flag on its step" did not say where | The `build.mjs` comment now says where and shows how |
| Nothing said what to do with an existing design issue the change makes stale | Now says to rewrite it |
| Nothing said to read the sheets before adding a requested wire | Added |
| No convention for where check outputs live | Stated |
| The audit has no wire-beside-wire check along a run | Documented as a limit; **not built** |
| "From below: elevation -30" looked like it showed the top | I re-ran it: the lower terminals are nearer the camera, so it is from below. **Wording left.** Worth a second opinion |
| The selection header still reads "(no number)" for an added wire; a two-row block's lower row is called "middle row" | **Not fixed** |

## What I tested myself

- Every script on the example: `new_panel`, `new_version`, `audit_headless` (PASS with `--max-kinks 2`, FAIL without, FAIL on an unresolved end, exit 2 with the script error on a broken layout), `diff_routes`, `shot` (finished panel, a part, a numbered wire, an unnumbered wire by id, a camera position, a tab, the model viewer), `serve` (served a file; the round-2 agent used it with a browser), `sheet_tiles` (text check, tiles; `--clip` was run by the cold-read agent), `fix_mojibake` (a doubly mis-encoded test file repaired to match the original, a correct file left alone).
- The example after the engine changes: same audit numbers as V12 as handed over (through 0, across 0, shared 0, behind 0, 2 tight bends, 464 ends, 190 drawn).

## Not tested

- **A new panel, end to end.** The largest gap. Eval 5 has not been run.
- Evals 1, 3 and 4 as written (eval 1's steps were exercised by the cold-read agent; eval 3's method was used in the authoring session on all twelve sheets).
- Whether the description triggers the skill when it should and not when it should not. The skill-creator's trigger-optimisation loop was not run.
- Any machine other than the authoring one (Windows 11, Node 24, Python 3.14, Edge). The scripts look for Chrome on macOS and Linux but that was not run.
- STEP conversion from the bundle (the example ships converted models; the converters were last run in the sessions that made V4 and V5).
- The skill-creator's browser review viewer was not generated: each test output is a 14 MB guide folder, and the review is written up here instead.
- Nothing in the example has been checked against the real panel on the bench.

## Suggested next steps for whoever picks this up

1. Run eval 5 on a real second panel and record every place the engine had to change. Each one is a candidate to move from "specific to VFD 200" to "driven by data".
2. Generalise the `TB\d` pass-through pattern and move the PartsLib address into data.
3. Add a wire-beside-wire check to the audit.
4. Run the description trigger test with the team's real phrasing.
