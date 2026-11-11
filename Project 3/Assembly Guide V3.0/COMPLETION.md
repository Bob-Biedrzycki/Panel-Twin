# Completion record: VFD-RT00-03 Assembly Guide V3.0 (2026-11-10)

Asked (Bob's review of V2.0): whether the ground feeder is supposed to go to GNDB0101; and that the drives' upper-row control wires ran through the lower terminal row.

Done and checked: see REVISIONS.md, V3.0. Audit PASS: 105 segments, 102 drawn, 176 ends, through 0, across 0, shared 0, tight bends 0, behind 0. Against V2.0: 91 identical, 13 changed, 1 new, 0 gone; nothing else moved.

Readings that need confirming:
- The ground junction on the lug is this guide's reading; sheet B01 does not show the lug. The incoming ground and the bond have no size on the drawings.
- Which row of the drive's control block stands forward is taken from how a two-level block is built and from the staggered rows on 520-UM001 p.42, not from a dimensioned drawing or the part. The 7 mm step is assumed.

Not verified in V3.0: the other two drives were not pictured close up (same block, same code); the Wire list, Parts and Issues panels were not re-read; nothing is checked against hardware. Why V1 and V2 passed the audit with wires through the lower row: the audit does not test a wire against the terminal blocks the guide builds inside its own device, so this was only catchable by looking. That is a gap in the audit worth closing in the skill.

---
# Completion record: VFD-RT00-03 Assembly Guide V2.0 (2026-11-10)

Asked (Bob, 2026-11-10): "Yes, fetch them" - the makers' 3D models for this panel's parts.

Done and checked: see REVISIONS.md, V2.0. Audit PASS with no tight bends: 104 segments, 101 drawn, 174 ends, through 0, across 0, shared 0, behind 0. Against V1.0: 39 wires identical, 65 changed (all on devices whose model changed, plus the mains), none added or lost.

Not verified in V2.0:
- The fuse block's height uses mounting-hole positions read off the two models (about 5 mm). Set it with a fuse in hand.
- The switch line lug and fuse block load lug landings are placed from each lug's bounding box, not from a measured hole.
- The 1489-M clamp depth and the drive's frame C power block are estimates.
- The top of rail A's breakers and the bottom of the supply were pictured; the Parts, Wire list and Issues panels were not re-read in V2.0.
- `npm install` fetched occt-import-js 0.0.23 into `tools/node_modules` (ignored by git) to convert the models.
- Everything listed under "Not verified" for V1.0 below still holds, except the stand-in models named above.

---
# Completion record: VFD-RT00-03 Assembly Guide V1.0 (2026-11-10)

## Asked

Bob, 2026-11-10: "build a panel twin for this job" with `10006 VFD-RT00-03.pdf` (Panel Twin skill).

## Done and checked

| What | How it was checked |
|---|---|
| Wire list: 98 conductors, 6 Ethernet cables, 11 drawn links, 9 field-only conductors, 6 open stubs, 43 strip terminals, as printed | Two independent readers (fresh agents, no knowledge of this session) read sheets B01, D01 and B02-B04, C01, N01, Z04, Z05 conductor by conductor against `data/wirelist.json`. Result: no wrong tag, terminal, wire number, size or line number. Their points acted on: the incoming ground is drawn to the middle of five unnumbered screws (list said "1"); two line numbers; the S1/S2 stubs on each drive were not recorded (now `stubs`, and a design issue). |
| Layout: 26 devices, 10 duct runs, 3 rails, 14 end anchors, 7 barrier positions | Measured on sheet Z02 with a millimetre grid drawn over 300-dpi crops (scale from the 44 x 56 in subpanel outline, which is drawn at true proportion). Parts with a maker's size are at that size. |
| Guide builds and loads | `node build.mjs`; headless audit ran with no script error. |
| Audit | `audit_headless.mjs --max-kinks 3`: PASS. 104 segments, 101 drawn (3 are the transformer's own links), 174 conductor ends, through a solid 0, across a device 0, shared line in a clamp 0, behind the plate 0, unresolved 0. Tight bends 3: B01021, B01022, B01023 (see below). |
| Looked at | 34 pictures read: the whole panel; every device group from the front (disconnect and fuses, TBB0106 and ground bar, rail A, drives, transformer, rail B, rail C); drives from below and the side; relays from above and below; the wire card, wire list, parts and issues panels. Found and fixed: strip marker cards unreadable (three rounds), five tight bends at the ground bar, example wording left on screen, wire cards showing a standard colour instead of the printed one. |

## The three tight bends

B01021, B01022, B01023 are printed 1 AWG. The fuse block poles are 24-30 mm to the right of the TBB0106 line lugs, 80 mm above them. A 12.5 mm conductor cannot make that step. The guide draws what is printed; it is a design issue, not a routing fault.

## Not verified

- **Nothing was checked against hardware or photos.** There are none for this job.
- **No maker's model was fetched for this panel.** Every 3D model came with the VFD 200 guide. The drives, disconnect, fuse block, enclosure, air conditioner and duct are stand-ins of a neighbouring size; ten device types are simple catalogue shapes.
- **Terminal positions** on the LPSC fuse holders, 1489-M breakers, 700-HLT1L1 relays and jacks come from the drawing symbols. Relay terminal positions (which screw is A1, A2, 11, 14) are assumed.
- **Drive terminal blocks** are the frame D arrangement scaled to frame C: order per 520-UM001, positions not measured.
- The 1494U-D60 / F60 dimensions and lug ranges were not read from a document (PartsLib has 1494U entries; not opened).
- Torque and wire range are cited only for the drive power terminals, the 24 V supply, 1492-J4, TBB0106, the ground bar and the lug. The rest say "no terminal data in the documents held".
- The Parts and Wire list panels were pictured once each, not read line by line. The printed run sheet was not opened.
- The guide was not opened by a person or tried on a tablet.

## Engine changes made for this panel (candidates to move into the skill)

Strip blocks at drawn positions with gaps, printed marks, centre jumpers, ground blocks and barriers from data; a `scale` on stand-in models that terminal blocks, covers and cuts follow; ground bar, air conditioner and transformer tags as constants; colour class and printed colour from the wire list; sheet names; a device right beside its duct no longer doubles back; fuses drawn at class J 60 A size when the gap is short; the example's receptacle, second plate and door devices removed.
