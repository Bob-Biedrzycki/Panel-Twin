# Review: the audit, looking, and reading the drawings

Three checks, each catching what the others cannot. Do all three before handing a version over, and again on anything you change afterwards.

## 1. The audit (`tools/audit.js`, `scripts/audit_headless.mjs`)

It samples every conductor and cable core every 1.5 mm from clamp to clamp and reports:

| Check | Meaning | What it usually points to |
|---|---|---|
| `through` | A wire is inside a solid for 3 mm or more (beyond the last 16 mm at each end, where it is meant to be in the clamp) | A terminal in the wrong place, a model in the wrong place or turned wrong, a wire leaving through a wall |
| `over` | A wire's path crosses the outline of a device it does not land on, outside any duct | A run across a device's face; a duct missing from the layout |
| `shared` | Two or more conductor ends at the same point | Two wires in one clamp drawn as one; or two entries for one wire |
| `kinks` | A bend tighter than 0.9 of the wire's diameter | A run doubling back; corners too close together |
| `behind` | A point behind the plate's face | A landing depth error |
| `notDrawn` | A segment that produced no wire | Both ends failed to resolve, or routing found no duct path |
| `unresolved` | An end that names a device or terminal the guide does not have. If the other end resolved, the wire is drawn as a tail to a floor gland, which looks deliberate | A typo in the wire list; a device not in the layout; a terminal not in its layout; a field device whose prefix is not in `FIELD_DEVICE` |
| `notFound` (information) | The opening was not found on the model; the wire enters behind the screw | Expected for catalogue-shape parts and flat-drawn push-ins (the example has 154 of 464); worth measuring for anything with a real lug |
| `overlap` (information) | Two devices' boxes overlap | Wrong width or position; or mating parts whose models include the joint (the example's three are bus modules) |
| `loose` (information) | A stretch outside every duct, more than 60 mm from either end | Tall devices and front-entry combs do this legitimately; a new long one is worth a look |

```sh
node "<skill>/scripts/audit_headless.mjs" "<guide folder>" --json "<scratch>/audit.json" [--max-kinks N]
```

The script prints one line per failure, one "for information" line, then `AUDIT: PASS` or `AUDIT: FAIL`. It exits 1 if anything is through, across, shared, behind, not drawn or unresolved, or if tight bends exceed `--max-kinks` (default 0). It exits 2, with the page's script error and the function it came from, if the guide did not load. The JSON holds everything, plus `devices` (every device's centre, front and box, in metres) and `routes` (every wire's ends, ducts, length and 21 points).

Run it on the previous version before you change anything, then compare:

```sh
node "<skill>/scripts/diff_routes.mjs" "<scratch>/before.json" "<scratch>/after.json"
```

It lists every wire that is new, gone or changed (ends, number, step, ducts, length, or moved by more than 0.05 mm) and how the audit counts moved. After a small change this is what shows nothing else moved; the audit alone only says nothing collides.

Report the numbers as they are. Tight bends should be zero. If some remain, pass `--max-kinks N`, and say which bends they are and why they stay. The example's two (W62 at TB2, the CBL-IOL-16 jacket at VM1) are named in its README.

## 2. Looking

The audit does not know what is right, only what collides. Look at every device close up from the front and from its wire-entry side, with `scripts/shot.mjs` or a browser. Compare with the photo or the maker's drawing. A short list of what looking has caught that the audit passed:

- a power supply on its back, its input plug on the "front"
- a controller face showing the wrong model number
- terminal blocks 8 mm too low behind a door
- control wires hanging across a drive's power terminals and legend
- a fuse block with no fuses in it, and too far from its switch for a fuse to reach
- a jumper drawn as a wire looping below a transformer and back

Device positions for `--view` are in the audit JSON under `devices` (`xc`, `yc`, `z1`, in metres). A view of one device: `--view 0,0,0.12,<xc>,<yc>,<z1>`; from below: elevation `-30`; from above: `30`. `--find TAG` selects a device or a numbered wire; `--find s195` selects a wire that has no number, by its segment id (the `routes` list in the JSON gives ids).

A picture takes from 10 seconds to about 2 minutes, depending on the machine and what else it is doing (the audit, which draws nothing, takes about 7 seconds). Run several at once in the background: each run has its own browser profile, so they do not collide. The script fails and prints the error if the guide threw. `--tab wire|parts|wires|issues` pictures the instructions panel: the wire card, the part page, the wire list, the issues.

The audit checks conductor ends that share a clamp, not two wires running side by side along a column. Where you add a wire beside another (a module's terminal column), look at that spot.

**Locating.** Picture a mounting step (the tape along the rail and the "Where it goes" table), `--tab locate`, `--locbig` (the full-screen mark-out drawing of the step) and a plate-mounted part's card. Compare each plate-mounted part's numbers with what the layout sheet prints for it. A mounting hole on a card must have a citation you have opened.

**How much to look at.** A new guide: every device, front and wire-entry side. A revision: the devices you changed, plus anything `diff_routes.mjs` shows moved; say that this is what you looked at.

## 3. Reading the drawings against the wire list

The wire list was transcribed by someone, possibly you, possibly long ago. Check it against the sheets before handover.

**Procedure.** For each schematic sheet: list every conductor, jumper, ground, shield and cable the sheet shows, with its number, size and the device and terminal at each end; compare with the wire list entries for that sheet; write down only the differences.

**Splitting it up.** A set of a dozen sheets is best read by several independent readers at once (subagents), two to four sheets each, because each reader needs many image tiles and a reader who did not write the list has no expectations about it. Give each reader:

- the PDF path and their sheet numbers, and the fact that it has no text layer
- the wire list path and its shape (`wires`, `cables`, the fields)
- how to make tiles (`scripts/sheet_tiles.py`), in their own scratch folder
- the categories to look for: a conductor or cable with no entry; a wrong device, terminal, number or size; unnumbered jumpers; grounds and bonds; shields; terminals wired on the sheet with nothing in the list; entries not on the sheet
- what is already known and handled, so they do not report it again
- the report shape: confirmed differences, possible differences they could not read (with the place on the sheet), and a count of conductors and cables on the sheet against entries in the list
- that it is read-only

Entries are often filed under the sheet where one end is drawn, so a sheet can legitimately have no entries of its own; ask readers to search the whole list by terminal before calling something missing.

**Then check each difference yourself** on the sheet (`sheet_tiles.py --clip`) before changing anything. A reader's report is a lead, not a finding. In the example, four readers covered twelve sheets in about four minutes; one real gap came back (the incoming feeder and ground), one numbering error, one drawing ambiguity, and three items that were bookkeeping only.

**What to do with a difference:**

| Difference | Action |
|---|---|
| On the sheet, not in the list | Add it. If it is site wiring with no entry point, show it as a tail at its landing |
| Asked for by someone, on no sheet | `ADDED` in `build.mjs`, marked "NOT ON THE DRAWINGS", no invented number, a design issue |
| In the list, not on the sheet | Find where it came from; remove it or state the reason it is there |
| Wrong terminal, number, size | Correct the list |
| The sheet is ambiguous (a junction dot, a missing terminal name) | Record as drawn, choose in `build.mjs` with a comment, raise a design issue with both readings |
| The sheet contradicts the hardware | Follow the hardware, cite the maker's document, raise a design issue |
| A misprint (a cross reference, a repeated label) | Record as printed, raise a design issue |

## What to say afterwards

State what was compared with what, how (images at what resolution, how many readers), the counts, each difference and what you did about it, and what was not covered (title, layout and BOM sheets, for instance). "Everything matched" is a claim about the sheets you read, so name them.
