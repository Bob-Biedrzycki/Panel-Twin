# Contributing

The skill gets better in three ways: more worked examples, a more general engine, and a sharper `SKILL.md`.

## A new worked example

1. Build the guide with the skill, through at least one review round with the engineer who owns the job.
2. Put it in `examples/<job>/` with its source, data, converted models and built HTML, and its `README.md`, `REVISIONS.md` and `COMPLETION.md`.
3. `node scripts/audit_headless.mjs examples/<job>` must print `AUDIT: PASS`. State the numbers in the pull request.
4. Add posters to `examples/posters/` with `scripts/shot.mjs`.
5. Add what the job taught to `references/lessons.md`: what was wrong, what fixed it, the rule.

## Engine changes (`src/guide.js`, `build.mjs`, `tools/audit.js`)

- Every example must still build and pass its audit with the same or better numbers. Attach before and after.
- Moving something from "specific to one panel" to "driven by data" is the most valuable kind of change. Update `references/engine-map.md` when you do.
- No build step beyond `node build.mjs`, and no runtime dependency other than three.js from the pinned CDN and the three web fonts.
- Add new segments at the end of the list, never in the middle: a wire's place in the list is its lane in the ducts.

## Changes to `SKILL.md` and the references

- Say why, not only what. A rule with its reason survives a case the rule did not foresee.
- Keep `SKILL.md` under about 250 lines; detail goes in `references/`.
- Run the evals in `evals/evals.json` (at least 1 and 2) with a fresh agent that is given the skill folder and told not to open `evals/`, plus the same task with no skill as a baseline. Ask each for a "Friction" section. Add what you learn to `REVIEW.md`. Evals 2 to 4 use the example's drawing set in `examples/drawings/`; eval 4 needs a photo you supply.

## House rules

- Real sizes, real terminals, real documents. A number on a wire card comes from a document or says it does not.
- The guide never silently departs from the drawings. Design issues for the engineer; modeling issues for the guide's own assumptions.
- "Checked" means the audit, a picture someone looked at, or a document page someone read.
- Never rewrite source files with PowerShell.
