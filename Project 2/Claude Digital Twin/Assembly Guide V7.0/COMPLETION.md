# VFD 200 Assembly Guide V7.0: Completion Description

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
