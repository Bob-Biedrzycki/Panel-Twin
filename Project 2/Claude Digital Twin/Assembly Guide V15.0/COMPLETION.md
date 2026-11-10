# VFD 200 Assembly Guide V15.0: Completion Description

## V15 (mounting holes; FU1 height)

V15 is in `Assembly Guide V15.0/`. V1.0 to V14.0 are unchanged.

**Asked:** mounting holes for the parts with reference material; nothing shown or guessed for the rest; then update the skill for this and for dimensioning, including the tolerance proposal.

**Done and checked:** see `REVISIONS.md` (V15).

**Not verified:** two offsets used to place the FU1 model (where the hole row is on each of Q1 and FU1) were measured on Rockwell's dimension drawings, about 1 mm each; they affect only where the model is drawn, not any number shown to the builder. The HMI cutout, E-STOP hole and A/C cutout documents were not read, so those parts show positions only.

## V14 (locating every item)

V14 is in `Assembly Guide V14.0/`. V1.0 to V13.0 are unchanged.

**Asked:** implement GD&T so assemblers can easily locate every item; make locating visual, intuitive and logical from first principles; leave existing features; focus on accuracy; Bob reviews before it goes into the skill.

**Done and checked:** see `REVISIONS.md` (V14). The Locate code is one block in `src/guide.js` (search "V14: LOCATE") plus small hooks; it carries its own styles.

**Decisions made for Bob to review:** the datum corner (top left of subplate 1, as sheet 3 dimensions); the three tolerance classes (proposed, not from a document); locating plate parts by outline; magenta for everything dimensional so it is not confused with a wire colour.

**Not verified:** see the unticked line in `REVISIONS.md`. The scale correction rests on the plate outline and four cross-checks against printed dimensions, not on a shop measurement.

## V13 (Draft rev20)

V13 is in `Assembly Guide V13.0/`. V1.0 to V12.0 are unchanged.

**Asked:** build the guide for the assemblers from Draft rev20.

**Done and checked:** see `REVISIONS.md` (V13). The engine is V12's with the audit hooks the Panel Twin Skill added; `src/guide.js` changes are the door (right door, new exit and route), RCP1's position, TB1's orientation and one wire-class rule.

**Not verified:**
- FU1's height against the hardware: carried from V9-V12 (1494U-IN001 p.10, shop photos); the manual was not re-read for V13.
- The door wiring route, and so the HMI1 and E-STOP cut lengths.
- No shop photo exists of the rev20 arrangement; positions are from sheet 3 and real widths.
- The BOM and terminal sheets (15-18) were read by one reader, not two.
- A full click-through in a browser (see REVISIONS).

## V12 (Bob's review of V11)

V12 is in `Assembly Guide V12.0/`. V1.0 to V11.0 are unchanged.

**Asked:** use discretion on the E-STOP safety wiring and hand back the completed product as the next revision.

**Done and checked:** the junctions are made on TB5 (W24 and W25 as jumpers, one conductor each to E-STOP 12 and 21); jumper dressing; handover notes rewritten. Audit and a look in Chrome under TB5.

**Not verified:** nothing in V12 was checked against the panel on the bench. The readings that depart from the drawings (sheet 5 junctions, FU1 trailer fuse block, T1 fuses and link, feeder) are all listed in the guide for engineering.

---

# V11.0 (kept for reference)

## V11 (2026-11-09, Bob's review of V10)

V11 is in `Assembly Guide V11.0/`. V1.0 to V10.0 are unchanged.

**Asked:** put Trace route last in the selection buttons (then Step, then Parts, Wire it first); fix the screwy T1 H3-H2 wire; review the original wiring diagram and make sure nothing is missing.

**Done and checked:**
- Buttons reordered; T1's jumper drawn as the maker's link.
- Sheets 4-15 read against the wire list. One gap found and filled: the incoming feeder and ground on sheet 4. One numbering error fixed at TB5. Everything else matched.

**Not verified or not done:**
- The sheet 5 junction (four door wires, or two with jumpers on TB5) is the drawing's ambiguity and is raised as a design issue.
- The T1 link was not checked against the transformer itself.
- Sheets 1-3 and 16-18 were not re-read.

---

# V10.0 (kept for reference)

## V10 (2026-11-09, Bob's review of V9)

V10 is in `Assembly Guide V10.0/`. V1.0 to V9.0 are unchanged.

**Asked:** every fuse listed as a selectable part; a best approximation for the T1 fuses; the WAGO wires, outstanding for a while: do they go in the terminal block on the front?

**Done and checked** (in Chrome against the shop photos, plus the audit):
- PWS1 turned up as fitted; its wires land in the blue output plug on top and the black input plug underneath.
- Seven fuses are parts: FU1-L1/L2/L3, FU2-F, T1-F1/F2/F3.

**Not verified:**
- T1's fuse part numbers (FNQ-R-3-1/2, FNM-10) are a suggestion, not from the drawings.
- Four of the seven fuses were click-tested in the 3D view (T1-F1, T1-F3, FU1-L2, FU2-F); the other three are drawn the same way.

---

# V9.0 (kept for reference)

## V9 (2026-11-09, Bob's review of V8)

V9 is in `Assembly Guide V9.0/`. V1.0 to V8.0 are unchanged.

**Asked:** fix the bends; something someone mentioned about fuses and the fuse block; a couple of wires where they shouldn't be; a drastic makeover of the screen for installer ease of use. Bob also asked whether the smoother viewer was something V8 took care of.

**Done and checked** (audit, then by eye in Chrome; list in `REVISIONS.md`):
- FU1 as a trailer fuse block at DIM Z, with its three fuses and phase barriers; W1-W3 not a wire.
- Drive control wires and cords dressed down the left edge of each drive.
- Tight bends 24 to 2.
- The screen rebuilt round a top bar, a tool rail and one bottom bar of large buttons.

**Not verified or not done:**
- The fuse block reading is from the Rockwell instruction and the photos, not from the person who raised it.
- Which wires Bob saw out of place is not known; only the drive control wires were found.
- The smoother viewer: V8 changed nothing in the renderer. Timed here in one tab, a frame of the Completed panel took 7 ms in V7 (at 0.75 resolution), 24 ms in V8 and 16 ms in V9 (both at full resolution), so the difference Bob saw is more likely the conditions (other tabs sharing the GPU, the resolution the renderer settled on) than the guide.
- Two tight bends remain; T1 fuses are not drawn; the rail 3 joints and the terminals the audit passes were not re-measured.

---

# V8.0 (kept for reference)

## V8 (2026-11-09)

V8 is in `Assembly Guide V8.0/`. V1.0 to V7.0 are unchanged.

**Asked:** improve the latest version: there are still oddities, and the screen could be friendlier. Accuracy of components and wire landings first; the screen as a cherry on top.

**How the oddities were found:** a new audit (`tools/audit.js`) walks every conductor and cable core through the finished model and tests each point against every device's solid, compares every pair of conductor ends, and measures every bend. The shop photos were read again for PWS2.

**Done and checked** (audit before and after, then by eye in Chrome; list in `REVISIONS.md`):
- W1-W6 run straight between facing lugs.
- Off-plate ends leave in one run; 46 of 70 tight bends gone.
- Conductors sharing a clamp lie side by side.
- CBL-IOL-09 lands on one port.
- IO1's wires leave through the wire channel; PWS2's come from below; the PTFIX feeds come in over the front.
- Garbled characters repaired.
- Screen: fitted Completed panel, Look from buttons, wire colour key, help card, hide-panel.

**Not verified or not done:**
- 24 tight bends remain (README, Still open).
- The rail 3 module joints and the terminals the audit passes were not re-measured.
- The narrow-window layout was not checked on a phone-sized window.

---

## V7 (2026-11-05, Bob's review of V6)

V7 is in `Assembly Guide V7.0/`. V1.0 to V6.0 are unchanged.

**Asked:**
- IO1's wires always come in from the bottom.
- The drive front covers go back on, x-rayed.
- The FU1 load wires did not land in the lugs.
- One more pass on the SI terminal blocks.

**Done and checked (each close up in Chrome, plus the full audit):**
- **IO1:** every OW16 wire comes in from below and runs up the face of its column to the clamp under its pressure plate.
- **Drives:** in the wiring steps and the Completed panel, the control cover, power terminal guard and white lower cover stay on as x-ray glass, and the landings show through them. Clicks pass through the glass. At the mounting step the covers are solid.
- **FU1:** the lug openings were measured on Rockwell's model with rays from below: each lug's underside is at y -41.3 mm, with the through-hole at z 43.7 mm on the pole centre line. V6's probe searched only to z 40.8 and took the gap behind the lug. Each conductor now goes 13 mm up into its own lug.
- **Q1:** checked the same way. Each wire goes into a walled opening in the lug's underside, so Q1 is unchanged.
- **SI1-SI6:** the plug tiers are stepped as on the real housing (inner plug front at 97 % of the depth, outer at 75 %), so the 1-4 and 9-12 wires leave in front of the outer plugs, not through them. The face's screw rows are centred on the plugs.
- **Audit:** all 540 conductor ends land inside their own device, with no exit run through another device. No console errors in any step.

**Not verified:** the isolators' real tier depths are taken from the photos' proportions, not from a dimensioned drawing (there is still no GLG document).

---

# V6.0 (kept for reference)

This is the seventh pass, dated 2026-11-05.

## What was asked

- **Shop photos:** resolve the remaining landing issues and the detail of the catalogue-shape ("homemade") models, using Bob's seven photos of the build in progress (Drive, "Partially Assembled Shop Photos").
- **Terminal blocks:** locate them better.
- **Checklist:** make a list of the terminal revisions and check each one off.
- **Checks:** resolve and double-check everything in the model before handing back.

## How it was done

**The photos.**
- Each was read at full resolution, and close crops were made of every device they show.
- Measurements came from the straight-on views: the 1769 modules (OW16 = 52.5 mm as the ruler), the drive power block, the NS1/SI/PDB rail, T1 and PDB1.
- The module fronts were rectified to flat faces with a perspective transform (`tools/make_faces.py`).

**The models.** Where a maker's model exists, the photo was compared with the model's own surface.
- Method: the model was probed in the browser, with rays against the finished geometry. This is how the PB2 recess floor (73.5 mm) and the NS1 supply plug were placed.
- Mismatches are not forced: where the photo and the maker's model disagree, the maker's model wins on geometry and the photo on arrangement.

**The checklist.** It is in `REVISIONS.md`. Every item was ticked only after two checks: the code or audit, then a close-up in Chrome against the photo.

## Terminal revisions (all done and checked)

1. **Rail 3 order.**
   - **Change:** PLC1 (1769-L30ER) now sits leftmost, then PWS2 (1769-PB2), then IO1.
   - **Why:** this is the order on the panel, and the subplate tags read PLC1, PWS2, IO1. Rockwell also requires the CompactLogix 5370 controller to be leftmost.
   - **Sheet 3** draws PWS2 first; this is a new design issue. V5 followed sheet 3, and its two models also overlapped by about 4 mm.
2. **PWS2.**
   - The five-screw column is at 80 % across, 43-77 % down, with the fuse window to its left.
   - From the top: not used, not used, +24 V (the blue wire), DC neutral, chassis ground.
   - The block sits on the recess floor measured on Rockwell's model.
3. **IO1.** The 18-screw block is in the right of the module (columns at 65.5 % and 86 %), beside the open wire channel; V5 centred it.
4. **PLC1.** The Ethernet jacks open downwards at 68 % across (V5: 40 %).
5. **Drive power blocks.**
   - The upper row is R/L1 S/L2 T/L3 U/T1 V/T2 W/T3.
   - The lower row is set back and offset right: PE (under T/L3), DC-, DC+, BR, PE. The ground lands on the right-hand PE, which is green as fitted.
   - The upper wires drop past the front of the lower row, as in the photo, and the printed legend is on the front edge above.
6. **NS1 port numbers.** Ports 1-8 run down the left column and 9-16 down the right, as printed on the switch; V5 had odd ports left and even right.
7. **NS1 supply.** The US and GND wires go up into the round openings of the three-way plug under the bottom of the front. The probe found those openings in Phoenix's model.
8. **SI1-SI6.** 5-8 is the outer top row and 1-4 the inner, as the isolators' labels read; V5 had them swapped. The wires to 3/4 land on the inner plug.
9. **T1.**
   - The line wires (1L1 to the H1 fuse, 3L2 to the H4 fuse) land on the primary fuse block's lower terminals and leave downwards.
   - 2T1 lands on the secondary fuse block, and X1 on the secondary board.
   - The pin lookup now takes the terminal's own name (1L1) before the name in brackets (H1).
10. **PDB1.** The connector faces sit at 72 % of the depth between the fins; the line wires come in from above and the taps from below.

## Catalogue-shape models and faces (all done and checked)

11. **SI1-SI6 (GLG).**
    - Light green two-tier plugs, top and bottom.
    - An orange 5 6 7 8 / 1 2 3 4 label, a white tag with a POWER lamp, and a blue 9-12 / 13-16 label.
    - The face is drawn to the model's own bands, so each screw on the face sits on its plug.
12. **T1.**
    - A black foot plate with four slotted feet, the laminated core with end brackets, and the black coil.
    - On the front: the primary board (four screws between barriers), the two-pole primary fuse block, the one-pole secondary fuse block and the secondary board.
    - Depth is 178 mm (PartsLib; V5 assumed 115).
13. **PDB1.** Open: four tall black barrier fins the full depth (99.6 mm, PartsLib), pole bodies and tin connectors, and the white label on the left fin.
14. **CB1/CB2.** Light grey bodies with blue handles.
15. **Faces.**
    - **Rectified from the photo:**
      - PLC1 now reads CompactLogix L30ER, with the MAC label and USB; V5 showed sheet 3's L36ERM.
      - PWS2 shows its A-B label and door.
      - IO1 shows its AC/DC OUT relay LED panel and orange-striped door; sheet 3's image for IO1 is a 1769-HSC, so V5 had no face.
    - **Doors:** each door carries its part of the image. The recess behind a door stays plain when the door is off.
    - **NS2:** its sheet 3 face already matches the NAT-102 in the photo, so it is unchanged.
16. **Drives.**
    - Black, as fitted, with the keypad module from the sheet 3 image.
    - The white lower front cover in the sheet 3 image shows only while covers are on. With the covers off, the drive is black with the R/L1 to W/T3 legend and the power block, as in the photo.

## How it was checked

- **Audit of all 540 conductor ends** (wires and cable cores):
  - every end has a landing;
  - 384 are found in a model's own openings;
  - every tip is inside its own device;
  - no exit run passes through another device.
- **Close-ups in Chrome against the photos:**
  - PLC1, PWS2 and IO1, doors on and off;
  - the PLC1 jacks from below;
  - the DRV1 power block;
  - NS1's ports and its supply plug from below;
  - SI5/SI6 top terminals;
  - T1, PDB1, and CB1/CB2.
- **The whole guide:** all 21 steps and every tab load with no console errors.
- **Speed:** about 2 ms a frame steady and 9 ms when the shadows redraw, so there is no slowdown from the new faces and parts.

## Not verified

- **T1 markings:** the order of the terminals down each board. The photos show the boards but not their markings, so sheet 3's order (H1 H3 H2 H4, X2 X1) is used.
- **PowerFlex 525 control I/O block:** the photos show the control cover still on, so it is still placed from 520-UM001's figures.
- **Rail 4 spacing:** TB3/TB4 positions along rail 4 agree with sheet 3 within what the oblique photo can resolve.
- **Not yet fitted or not in the photos:**
  - TB5, CB5 and RCP1 were not yet fitted;
  - FU2, CB3, GB1 and the door devices are not in the photos.
- **Still open from V5:** the RCP1 L/N/G order, its GFCI-face model, and the absence of a GLG manufacturer document.
- **V5 HTML in Drive:** the rebuilt V5 guide, which carries only the PartsLib text change, is kept aside until the old V5 copy in Drive is cleared. V6 carries the same change.
