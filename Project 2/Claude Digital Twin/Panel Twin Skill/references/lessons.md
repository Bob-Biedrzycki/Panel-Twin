# Lessons from twelve rounds on VFD 200

The example guide went from V1 to V12 between 2026-11-04 and 2026-11-09, each version a review round with the engineer who owns the job. This is what each round found and the rule it left behind. The full record is in `examples/vfd200/README.md`, `REVISIONS.md` and `COMPLETION.md`.

| Round | What was wrong or asked | What fixed it | The rule |
|---|---|---|---|
| V1-V3 | Devices were boxes with the layout picture on the front; wire ends were read off the faces by eye and were millimetres out | Device faces measured on a grid; terminal layouts taken from the makers' manuals; strips modelled from the block, not the layout symbol | Layout symbols are not to scale. Positions come from makers' documents, with the source recorded |
| V4 | Shapes, depths and terminal heights were approximate | 30 parts drawn from the makers' own STEP models at real size; a completed-panel view; a receptacle found to have one terminal block where the sheet drew four terminals | Use the maker's model wherever one exists. When the hardware cannot take what the sheet draws, follow the hardware and raise a design issue |
| V5 | Wires sat on terminal faces, ran past lugs, ended on closed covers; a module had been narrowed to match the drawing; the view was slow | Every wire goes into the opening found on the model; covers come off; the module restored to its real 52.5 mm; rendering made three times faster | A wire ends in an opening. Never resize a maker's model to fit a drawing: check the install manual |
| V6 | The built panel differed from the layout sheet | Shop photos read at full resolution: rail order, terminal block positions, port numbering, plug positions, faces rectified from the photo | Photos of the real build overrule the layout sheet on arrangement; the maker's model overrules the photo on geometry. Keep a checklist and tick an item only after it is changed and then checked |
| V7 | Reviewer: module wires come in from the bottom; drive covers back on as x-ray; fuse block load wires not in their lugs; isolator plugs | Entry sides corrected; x-ray covers; lug openings measured with rays; stepped plug tiers | When a reviewer tells you how it is wired in the shop, that is the answer. Measure openings; do not trust a probe's first hit |
| V8 | "There are still oddities", unspecified | A new audit of every conductor against every solid found what eye checks had missed: detours between facing lugs, runs doubling back, shared clamps, a cable on three ports, wires through a housing floor; garbled characters | When the complaint is vague, build the instrument that finds candidates. Fix causes. Say which you fixed and that you cannot know they are the ones meant |
| V9 | Bends; "someone mentioned the fuse block"; a couple of wires where they shouldn't be; a drastic screen makeover | Corner rounding by wire size; the fuse block found to be a trailer block that hangs under the switch with fuses as the link (maker's instruction); drive control wires dressed to the side; the screen rebuilt for the installer | Go to the maker's instruction for how parts mate. A reading you reached alone is labelled as one and listed for confirmation |
| V10 | "Do the WAGO wires go in the block on the front?"; fuses should be selectable parts | The supply's model had been on its back since V4; turned up to match the photo; seven fuses made parts, three of them an approximation marked as such | A question is a request to find out. Check orientation against a photo, not the outline. Approximations are allowed when asked for and always labelled |
| V11 | Button order; a screwy transformer jumper; review the wiring diagram | Buttons reordered as asked; the jumper drawn as the maker's link; twelve sheets read against the wire list by four readers: the incoming feeder and ground had been missing all along | Read the drawings against the list before handover, with readers who did not write it. Dashed and unnumbered conductors are still wires |
| V12 | "Use your discretion" on an ambiguous junction | Junctions made on the terminal strip with jumpers; stated, reasoned, left listed for engineering | When handed a decision, make it, explain it in a paragraph, keep it open under Issues |

## Patterns across the rounds

- **Each instrument finds a different class of error.** The audit found collisions. Looking found wrong parts and wrong orientations. Reading the sheets found missing wires. The maker's documents found how parts mate. No one of them would have been enough.
- **The longest-lived errors were the ones nobody had a reason to question**: a model on its back (six versions), a missing feeder (eleven). Both were found the first time someone checked against an independent source.
- **The reviewer rarely lists what is wrong.** They say it looks odd. The work is turning that into a list, fixing the list, and being honest that the list is yours.
- **Every round changed something that departs from the drawings.** Each is written down where the builder meets it and under Issues. By V12 there were nine, collected on one page of `START HERE.txt`.
- **Versions are cheap; trust is not.** Copy, change, check, hand over. Never edit what was handed over.

## Things that cost time and need not again

- PowerShell rewriting a source file double-encoded every arrow and tick in the page. Two versions shipped with garbage in the hint line before anyone traced it.
- Piping a save command into `Select-Object -First N` stopped it after the upload and before the commit.
- A renderer's built-in hotkeys fired alongside the page's own (C opened a cut-away). Turn the kit's hotkeys off.
- `transmission` materials and per-frame shadow maps took an integrated GPU to 5 frames a second.
- Inserting new segments in the middle of the list moved every later wire to a different lane in the ducts. Add new segments at the end.
- A terminal list's own cross-check table had four cable names off by one; nothing read it, so nothing broke, and nothing caught it either.

## Rounds 13 to 15

| Round | What happened | The rule it left |
|---|---|---|
| 13 | The drawing set went from rev18 to rev20: door devices on the other door, half the subplate rearranged, a 72-terminal strip deleted, most wire numbers changed. The revision block still read "A". | Difference the two PDFs page by page before reading anything. Rewrite the wire list by script from readers' findings, then have other readers check it. Tell the builder first that old markers are wrong |
| 13 | The guide's own V12 could not be audited: it predated the audit hook. | Baseline from the copy that has the hooks; say which copy |
| 13 | The guide judged the new sheet's picture of a fuse block wrong and kept its own placement. | It was the guide that was wrong (round 15). When the model and the drawing disagree, read the maker's figure before saying so |
| 14 | Asked for GD&T so assemblers can locate every item. | Datums and baseline dimensions from the plate's own corner; numbers read back from the model; tolerances proposed and marked as proposed |
| 14 | Checking the new numbers against printed dimensions showed every picture-derived position was 0.85 % out, for thirteen versions. | Measure the sheet's scale from the plate outline and check it against printed dimensions |
| 15 | Asked for mounting holes where there is reference material and nothing where there is not. | `HOLES`: documents only, cited, exactly as much as the document gives; no entry means nothing shown |
| 15 | Reading the maker's page for the holes showed DIM Z runs between two rows of mounting holes, not between two mouldings: the fuse block had been 53 mm low since round 9, and three "tight bends" blamed on the drawing were the guide's. | Read what a dimension runs between off the figure, not the table |
