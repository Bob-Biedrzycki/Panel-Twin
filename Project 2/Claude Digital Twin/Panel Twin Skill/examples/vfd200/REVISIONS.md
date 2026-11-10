# V15 revisions: mounting holes from documents; FU1 height

Bob: do what we can about mounting holes for the parts we have reference material for; show nothing and make no educated guess for the others.

- [x] **Documents read in PartsLib** (pages rendered or text read): Rockwell 10001235194 and 10001237277, 1494U-IN001 p.2 and p.10, 1492-TD019 p.14, 520-UM001 p.15 and p.188, Burndy K3A26U2N sheet, ILSCO D167 page, SolaHD catalogue p.173 and p.175.
- [x] **`HOLES` in `src/guide.js`**: seven parts with patterns, PDB1 with columns only; every number is printed in the cited document. Shown on the part card, in the step table, as centre lines on the mark-out drawing and on a selected part in 3D, in the CSV and the print sheets. Looked at: FU1 and DRV1 cards, the step 6 full-screen drawing.
- [x] **Cross-check.** Q1's right-hand hole column: sheet 3's 47 mm from the right edge and Rockwell's 3.32 in from the end of the mechanism both give 1071 mm. FU1's mounting notches fall on the 1025 and 1071 mm lines in the 3D model.
- [x] **FU1 moved up 53.5 mm** (`src/model_fit.mjs`): Z between hole rows. Looked at the power entry: fuse blades in the clips of both parts.
- [x] **Step text, issues, START HERE** brought in line.
- [x] **Audit.** PASS, two tight bends (V14: four).
- [ ] **Not done:** Q1, PDB1, Lug1, GB1 and T1 cards were not pictured; print and CSV not opened; no click-through by hand.

# V14 revisions: locating every item (GD&T), accuracy

Bob asked for GD&T so the assemblers can locate every item: more visual, intuitive and logical, from first principles; existing features left as they are; focus on accuracy.

- [x] **Datums A, B, C and baseline dimensions.** Positions are read back from the 3D model (so picture and number agree) in mm from the plate's top left corner. Checked: PDB1 right edge 1098 = 1118 - 20 (sheet 3 prints 20); Lug1 61 down, 20 right of D4 (prints 60, 20); DRV1 130.5 wide (real 130); T1 162 (real 162).
- [x] **Sheet 3 scale corrected** (`assets/tex/index.json`, `src/layout.mjs`, FU1 fit, RCP1, `tools/extract_textures.py`). Plate measured in both PDFs: 505.68 x 643.56 pt.
- [x] **Locate view, step tables, part cards, 3D overlay, full-screen drawing, print, CSV.** Looked at in pictures: step 11 in Build (tape along rail 4), Locate for steps 2, 3 and 10, the PDB1 and Q1 part cards, full-screen drawings for steps 3 and 11.
- [x] **Existing features.** Nothing removed; one tab and one tool button added. Wire landings re-checked at CPL2 after parts moved.
- [x] **Audit.** PASS, four tight bends (V13: five).
- [ ] **Not done:** print preview and the CSV download were not opened; the guide was not clicked through by hand; Locate was not pictured at phone width or with larger text; hole patterns not added.

# V13 revisions: Draft rev20

Bob sent Draft rev20 and asked for the guide for the assemblers.

- [x] **rev18 against rev20, every sheet.** Pixel comparison of all 18 sheets, then four independent readers (sheets 4-6, 7-10, 11-14, 15-18). Sheets 2, 3, 5, 15 and the TB2/TB4 blocks read again by hand at 260-300 dpi.
- [x] **Door.** HMI1 and E-STOP on the right door: 287 / 257 / 1400 mm and 168 / 550 / 935 mm (sheet 2). Checked in a picture of step 20.
- [x] **Subplate.** Device rectangles taken from the rev20 PDF (`tools/extract_textures.py`); strips and isolators at real widths. Checked in pictures of the whole panel, the power entry, rail 3, rail 4 left and right, and TB4.
- [x] **Wire list.** `data/wirelist.json` rewritten for rev20 (123 wires, 37 cables, no duplicate numbers). Read against sheets 4-14 again by two readers who had not seen it: no wrong number, size, device, terminal, potential or colour; five line-number references corrected.
- [x] **Readings in `build.mjs`.** Lamp wire W96 through TB4-1; W25/W27 to the E-STOP, W49/W51 as jumpers; VM1's cable straight to CPL2 X08.
- [x] **Parts list.** As the rev20 BOM (63 lines).
- [x] **Issues, step text, START HERE.** Rewritten for rev20.
- [x] **Audit.** PASS with five tight bends named in the README (V12 baseline: two).
- [ ] **Not done:** the guide was not opened by hand in a browser and clicked through step by step; the checks were the command-line audit and 13 pictures. Read in pictures: the Build view, and the wire cards for W49 and EVT005-06. The Wire list and Issues views were not looked at on screen.

# V12 revisions: Bob's review of V11

Bob left the sheet 5 junction choice to the guide and asked for the completed product as the next revision.

- [x] **Safe-off junctions on TB5.** W24: TB5-1 to TB5-3. W25: TB5-2 to TB5-4. TB5-3 to E-STOP 12 and TB5-4 to E-STOP 21, one conductor each. `build.mjs` re-ends the two segments; the wire list file itself is unchanged. Checked in Chrome under TB5.
- [x] **Jumper dressing.** Jumpers on one device loop at stepped depths; a jumper under 110 mm long carries one marker. Checked in Chrome.
- [x] **Audit.** Through 0, across a device 0, shared 0, tight bends 2 (W62, CBL-IOL-16), 464 ends. All 21 steps and five views open with no console messages.
- [x] **Handover.** `START HERE.txt` rewritten for the current screen; README's open list brought up to date.

Left for engineering (Design issues in the guide): the sheet 5 junctions, FU1 as a trailer fuse block, T1's fuse part numbers, feeder size and entry.

# V11 revisions (2026-11-09): Bob's review of V10

- [x] **Selection buttons.** Wire it, Wires, Parts, Step, Trace route; for a part: Wire it, Its wires, Part, Its step. Checked in Chrome.
- [x] **T1 H3-H2.** A flat link between the two screws (`buildLink`), listed as "T1 link, nothing to cut". Checked in Chrome.
- [x] **Wiring diagram review, sheets 4-15.** Four readers took the sheets as images against the wire list; each difference they reported was then checked on the drawing.

| Sheets | Drawing | List | Result |
|---|---|---|---|
| 4 | 45 conductors | 41 entries | Incoming feeder (3) and ground (1) missing: added |
| 5 | 9 safety conductors | 5 entries, split through TB5 by the build | Match; numbering fixed, junction raised as a design issue |
| 6-8 | 44 conductors, 9 cables | same | Match |
| 9-10 | 8 conductors, 3 Ethernet, 1 cable | filed under sheets 7, 8, 11 | Match |
| 11-12 | 44 cables | 44 cables | Match |
| 13-14 | 29 conductors, 8 cables | same | Match |
| 15 | terminal summary | every landing in the list | Match |

- [x] **Feeder and ground.** Tails at Q1 1L1/3L2/5L3 and GB1 tap 1 (reserved; other grounds start at tap 2). Seen in Chrome at Q1; the ground was confirmed built on tap 1 but not looked at close up.
- [x] **TB5 numbers.** The drive and IO1 side of TB5-1, -2, -5 has no number.
- [x] **Audit.** Through 0, across a device 0, shared 0, tight bends 2, 462 ends. All 21 steps and five views open with no console messages.

Not done: the sheet 5 junction reading was left as it was; sheets 1-3 and 16-18 were not re-read.

# V10 revisions (2026-11-09): Bob's review of V9

- [x] **PWS1 wires.** Bob asked whether the WAGO wires go in the terminal block on the front. The shop photos (PXL_20261105_180010024 and _180056294) show the blue output plug on top and the black input plug under the bottom, both at the front edge, and no block on the front. WAGO's model had been turned 90 degrees too far since V4 (`rot` y-90 only); it now has x90 as well. Pins set on the plugs in the model's own mm. Checked in Chrome from above and below against the photos.
- [x] **Fuses as parts.** FU1-L1/L2/L3, FU2-F, T1-F1/F2/F3 are devices of their own (`build.mjs` adds them, `addFuse` in `guide.js` draws them). Selected T1-F1 and FU2-F in Chrome: tag, outline and part card show. T1's fuse clips redrawn 30 mm apart to hold a 38 mm cartridge.
- [x] **Audit.** Through 0, across a device 0, shared 0, tight bends 2 (W62, CBL-IOL-16), 458 ends. No console messages.

Click test: a click on T1-F1, T1-F3, FU1-L2 and on FU2's window each selected that fuse. FU2-F is reached through the window on the carrier's front, or by Find.

# V9 revisions (2026-11-09): Bob's review of V8

Bob asked for: the bends fixed; "something about fuses and the fuse block" that someone had mentioned; a couple of wires that were where they shouldn't be; a drastic makeover of the screen for the installer.

| Audit count | V8 | V9 |
|---|---|---|
| Wires passing through a solid | 0 | 0 |
| Wires across the face of a device they do not land on (new check) | 0 | 0 |
| Clamps with conductors drawn on one line | 0 | 0 |
| Bends tighter than the wire | 24 | 2 |
| Conductor ends | 464 | 458 |

- [x] **Fuse block.** No record of the remark was found in past sessions. Read from 1494U-IN001 p.10 (PartsLib) and the shop photo of the switch (clip plates on its load side): FU1 is a trailer fuse block, the fuses are the link. FU1 moved 8.0 mm left and 12.4 mm up to DIM Z = 113.0 mm; three LPJ-70SP and two phase barriers drawn; W1-W3 listed as not a wire; steps 8 and 13 and the design issues rewritten. Checked in Chrome. **To confirm with whoever raised it.**
- [x] **Drive control wires.** Dressed down the left edge of each drive. Checked in Chrome on DRV1 and DRV2; audit: nothing through the drive.
- [x] **Bends.** Corner rounding by wire size on every run, duct turns closer than 30 mm merged, front-entry cords leave on their own arc, wires from deep devices drop into the duct from the front, jumper loops open out, VM1 tail straightened, duct crossings go over. Audit: 24 to 2.
- [x] **Screen.** Top bar, tool rail, look-from dock, phase strip, large tasks, wire card, one bottom bar, larger text, resume at the last step. Used in Chrome at 1500 x 950 and at phone width (375 x 812); all 21 steps and five views open with no console messages.
- [ ] **Other stray wires.** Not identified: Bob did not say which, and the new "across a device" check finds none.

Not done: W62 and CBL-IOL-16 bends; T1 fuses; the rail 3 module joints; a re-measure of terminals the audit passes.

# V8 revisions (2026-11-09): oddities found by the audit

Bob asked for the remaining oddities to be fixed, accuracy of components and wire landings first, the screen second. Each item was found by `tools/audit.js` or by eye in Chrome, fixed, then checked by the audit again and by eye.

| Audit count | V7 | V8 |
|---|---|---|
| Wires passing through a solid | 4 | 0 |
| Clamps with conductors drawn on one line | 7 | 0 |
| Bends tighter than the wire | 70 | 24 |
| Points behind the subplate | 0 | 0 |

- [x] **W1-W6 direct.** Q1 load lugs to FU1 line lugs and FU1 load lugs to PDB1 line lugs run straight across. Checked in Chrome (W1).
- [x] **Off-plate ends.** Field, door, A/C and VM1 ends no longer double back at the duct. Audit: kinks 70 to 24.
- [x] **Shared clamps.** TB2-1 (W54, W62, jumper), TB2-2, TB2-3, TB2-4 and T1 X1 (W19, W20): conductors side by side. Audit: 0 shared.
- [x] **CBL-IOL-09.** Cores on CPL2 X01-1, X01-3, X01-4. V7 followed sheet 11's X03-1 and X04-1, shared with CBL-IOL-11 and -12, and one core ran 88 mm through CPL2. Design issue rewritten.
- [x] **IO1 exit.** Rays down Rockwell's model show the housing open from 12.8 to 36.8 mm across (the wire channel) and floored right of that. Wires run down in front of the screws in nine places per column, then into the channel. Checked in Chrome from the front and from below.
- [x] **PWS2 entry.** From below, as in photos PXL_20261105_180059974 (door closed) and _180108693 (door open).
- [x] **PDB2/PDB3 feed.** The wire clears the front of the block before it turns in. Audit: W73 and W80 no longer inside the block.
- [x] **Garbled characters.** `build.mjs` held double-encoded text for five symbols. Repaired; checked on the hint, the cable sizes and the done ticks.
- [x] **Screen.** Completed panel fitted to the window; Look from buttons; Wire colours key with show-only; Help card; hide the side panel. Each one used in Chrome at 1500 x 950; all 21 steps and five tabs open with no console messages.

Not done: the 24 remaining tight bends, the rail 3 module joints and a re-measure of the terminals the audit passes (README, Still open). The narrow-window layout was written but not checked on a phone-sized window.

# V7 revisions from Bob's review of V6 (2026-11-05)

- [x] **IO1 wires from the bottom.** Every OW16 wire now comes in from below and runs up the face of its column to the clamp under the pressure plate. Checked in Chrome.
- [x] **Drive front covers back on, x-rayed.** In the wiring steps and the Completed panel, the control cover, terminal guard and white lower cover stay on as glass, and the landings show through. Clicks go through the glass to the wires. The covers are still solid at the mounting step. Checked in Chrome.
- [x] **FU1 load lugs.** The wires went up behind the lugs. The openings, measured on Rockwell's model, are the underside at y -41.3 mm with the through-hole at z 43.7 mm; the V6 probe searched only to z 40.8. Each conductor now goes into its own lug. Checked in Chrome from the angle in Bob's image. Q1's load lugs were checked the same way: each wire goes into a walled opening in the lug's underside, so Q1 is unchanged.
- [x] **SI terminal blocks.** The 9-12 wires ran down through the 13-16 plug. The tiers are now stepped as on the real housing (inner plug front at 97 % of the depth, outer at 75 %), so the 1-4 and 9-12 wires leave in front of the outer plugs. The face rows are moved to the plug centres. Checked in Chrome from below.
- [x] **Audit.** 540 conductor ends: every tip is inside its own device, no exit run crosses another device, and no console errors in any step.

# V6 revisions from the shop photos (2026-11-05)

Source: Bob's seven photos of the build in progress, Drive folder "Partially Assembled Shop Photos" (PXL_20261105_180005897 to _180108693).

Each item is ticked only after it has been changed and then checked twice: once in the code or audit, and once by eye in Chrome against the photo.

## Terminal revisions

- [x] **1. Rail 3 order.** The shop mounted PLC1 (1769-L30ER) leftmost, then PWS2 (1769-PB2), then IO1. The subplate tags read PLC1, PWS2, IO1. Rockwell also requires the CompactLogix 5370 controller to be the leftmost module. Sheet 3 draws PWS2 first; V5 followed it, and its models overlapped by about 4 mm.
- [x] **2. PWS2 terminals.** The five-screw column sits at the right of the module, upper middle, with the fuse window to its left. V5 had it about 8 mm too low. From the top: not used, not used, +24 V DC, DC neutral, chassis ground; the blue wire lands on the third screw.
- [x] **3. IO1 terminal block.** The 18-screw block sits in the right part of the module, beside an open wire channel; V5 centred it. The two columns are the OUT 0/2/4/6/VAC-VDC 2/8-14 column (left, half a pitch lower) and the VAC-VDC 1/OUT 1-15 column (right).
- [x] **4. PLC1 Ethernet jacks.** Both open downwards under "1 (Front) 2 (Rear)", at the right of the front face; V5 had them left of centre.
- [x] **5. Drive power blocks.** The top row is unchanged: R/L1 S/L2 T/L3 U/T1 V/T2 W/T3. The lower row runs PE, DC-, DC+, BR and PE, under T/L3 to past W/T3, and the shop lands the green ground on the right-hand PE. V5 had one PE and the lower row under the left half.
- [x] **6. NS1 port numbers.** The ports printed on the switch are 1-8 down the left column and 9-16 down the right (rows 1/9 to 8/16). V5 numbered odd ports left and even ports right.
- [x] **7. NS1 supply.** A three-way push-in plug (US, GND, earth) sits at the bottom of the front, levers above and three round wire openings on its lower sloping front. The wires go up into those openings, which the probe found in Phoenix's model. V5 had them entering underneath the housing, off the plug.
- [x] **8. SI1-SI6 top terminals.** The labels read 5 6 7 8 above 1 2 3 4, so 5-8 is the outer top row and 1-4 the inner. V5 had them the other way round. The bottom rows (9-12 inner, 13-16 outer) were right.
- [x] **9. T1 terminals.** The primary terminal board is on the left of the front and the two-pole primary fuse block in the middle. The line wires (1L1, 3L2) land on its lower terminals with red rings and leave downwards. The secondary board and the one-pole secondary fuse block are on the right.
- [x] **10. PDB1 taps.** The load taps sit on each pole's connector between tall barrier fins, with the wires entering from below.

## Catalogue-shape (homemade) model detail

- [x] **11. SI1-SI6 (GLG isolators).** Green housing, two plug tiers at each end with the screws on the front and the wire entries in the end, an orange number label at the top and a blue one at the bottom, and the white tag. The face is drawn from the photo to the model's own bands (tools/make_faces.py), so each screw on it sits on its plug.
- [x] **12. T1.** Black foot plate wider than the transformer, the coil and core, and on the front the primary board, fuse blocks and secondary board as in the photo.
- [x] **13. PDB1.** Open block with four tall black barrier fins and a tin connector per pole; V5 had a smoked cover.
- [x] **14. CB1/CB2 (140MT).** Light grey body and blue rotary handle, as fitted; V5 had a dark grey body and a black handle.
- [x] **15. Faces from the photos.** PLC1 now reads L30ER (V5 showed sheet 3's L36ERM), and PWS2 and IO1 (LED panel and door; V5 had no IO1 face) are rectified from the straight-on photo. Each door carries its part of the image, and the recess behind it stays plain. NS2 (NAT-102) was compared and needed no change.
- [x] **16. Drives.** Black, as fitted, with the printed R/L1 to W/T3 legend over the power block and the fan on the underside. The sheet 3 image of the white lower cover shows only while covers are on.


All 16 were done and checked on 2026-11-05. The checks were the wire-end audit (540 ends: every tip inside its own device, no exit run through another device) and close-ups in Chrome against the photos. NS2 needed no change: its sheet 3 face already matches the NAT-102 in the photo.
