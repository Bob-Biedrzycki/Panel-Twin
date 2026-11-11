# VFD 200 Assembly Guide V15.0 (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid)

An interactive build and wiring guide for panel **VFD 200**, made from `../../Draft rev20.pdf` (rev A, 18 sheets), the makers' 3D models in `../Vendor Step Files/`, and the shop photos of the build in progress. Open **`VFD200 Assembly Guide.html`** in Chrome or Edge (it needs internet for the 3D library). Builders: read `START HERE.txt`.

## What's new in V15 (Bob: mounting holes where we have the reference, nothing where we do not)

- **Mounting holes, from the makers' documents only.** The "Where it goes" card of a part shows its hole pattern, the screw or drill size, and the source, when a document gives it:

  | Part | What the document gives | Source |
  |---|---|---|
  | Q1 | 4 holes, 46.0 x 124.0 mm; columns at 1025 and 1071 mm from the left edge; 11/64 in pilot holes | Rockwell drawing 10001235194; 1494U-IN001 p.2; sheet 3 |
  | FU1 | 2 holes 46.0 mm apart, in line with Q1's; 113.0 mm (Z) below Q1's lower slots | Rockwell drawing 10001237277; 1494U-IN001 p.10; sheet 3 |
  | DRV1, DRV2 | 4 holes, 116.0 x 247.0 mm, M5 | 520-UM001 p.188, p.15 |
  | Lug1 | 2 holes 44.5 mm apart, 9/16 in | Burndy specification sheet |
  | GB1 | 2 holes 50.3 mm apart, first 65.2 mm from the end, #10 | ILSCO D167 page C-235 |
  | T1 | 4 slots 7.9 x 21.6 mm; width 135.1 or 111.0, depth 108.0 or 146.1 mm | SolaHD catalogue p.173, p.175 |
  | PDB1 | 3 hole columns only (26.2 mm in, 45.5 mm apart) | 1492-TD019 p.14 |

  Where a document gives the pattern but not where it sits inside the part's outline, the guide says so and says to mark through the part. **Nothing is shown, and nothing is estimated, for ducts, rails, HMI1, the E-STOP, the A/C, subplate 2 and VM1.**
- **FU1 was 53 mm too low since V9.** Reading 1494U-IN001 p.10 for the holes showed that DIM Z (113 mm) runs from the switch's lower mounting slots to the fuse block's mounting holes, which is also how rev20 sheet 3 dimensions it. Corrected. The fuse blades now reach the clips on both parts, and W4, W5 and W6 no longer bend too tightly. The V13 remark that sheet 3's picture of FU1 was wrong is withdrawn: the drawing was right.

### Audit

Through a solid 0, across a device 0, shared clamp 0, behind the plate 0, unresolved 0, not drawn 0; 171 segments, 320 ends. Two tight bends, the two V12 had: W56 at TB2 and the CBL-IOL-01 jacket at VM1.

### Open

- Sheet 3's 104 mm to Q1: it points about 13 mm below Rockwell's top hole row. No height is shown for Q1's holes until engineering answers; Rockwell's method is the template from the handle hole.
- Hole positions inside the outline for the drives, Lug1, GB1, T1 and PDB1's rows: not in the documents held.
- The tolerances and the datum corner are proposals until engineering confirms.

## What's new in V14 (Bob: locating every item, GD&T, accuracy)

Everything V13 had is still there. Added:

- **Datums.** Every position on subplate 1 is measured from the same two edges: datum C, the left edge (across), and datum B, the top edge (down); datum A is the plate face. Baseline dimensions only: nothing is measured from one part to the next, so errors do not add up. Door cutouts use the right door's own top and handle edges, as sheet 2 does.
- **Locate (new view, top bar).** For each mounting step: a mark-out drawing with the datum edges and an ordinate for every item, a table (left and right edge, top and bottom edge or rail centre line, mm and inches, what it sits against on a rail, how closely to hold it), a full-screen drawing (a rail step zooms to its rail), printable mark-out sheets and a positions CSV.
- **On the 3D panel.** In the mounting steps the two datum edges are lit; each rail carries a tape from the left edge with a number at every part; a selected part gets a leader from each edge with its two numbers, and a check dimension at its far corner. The Dimensions button (L) turns it off.
- **On each step and part.** Mounting steps have a "Where it goes" table; each part's page starts with a "Where it goes" card. Step 3 (mark out and drill) lists everything that is drilled for: ducts, rails and plate-mounted parts.
- **Tolerances.** Three classes shown as a feature control frame and in words: a 1 mm circle (Q1, FU1, door cutouts), 3 mm (ducts, rails, plate parts), 6 mm along the rail (rail parts). **The drawings give none: these are proposed**, and say so wherever they appear (Design issues).
- **Accuracy: the sheet 3 scale.** Building this showed that V1 to V13 read sheet 3's pictures 0.85 % too small: parts were up to 8 mm too far left and 10 mm too high towards the right and bottom of the plate, and rail parts sat 2 to 7 mm above their rails. Corrected; PDB1 now lands 20.0 mm from the right edge, as sheet 3 prints, and the drives measure 130 mm.

### Audit

Through a solid 0, across a device 0, shared clamp 0, behind the plate 0, unresolved 0, not drawn 0; 171 segments, 320 ends. Four tight bends: W5 and W6 (FU1 to PDB1, the geometry rev20 draws), W56 at TB2, the CBL-IOL-01 jacket at VM1. Every wire moved slightly from V13 because the parts moved to their true positions.

### Open

- Mounting hole patterns are not in the guide: plate parts are located by outline, and by sheet 3's printed dimensions where it has them.
- The tolerances and the datum corner are proposals until engineering confirms.
- Everything open in V13.

## What's new in V13 (Draft rev20)

Bob sent Draft rev20 and asked for the guide for the assemblers. Rev20 is a re-arrangement of the same panel, so V13 is V12 rebuilt to it.

- **Door (sheet 2):** HMI1 and the E-STOP are on the right door, at the new dimensions.
- **Subplate (sheet 3):** Q1, FU1 and Lug1 moved; rail 1 is FU2, CB3, CB2, CB1; NS1 and NS2 are on rail 3; all six isolators (SI6 to SI1), TB4, RCP1, CB5, TB2 and TB1 are on rail 4.
- **Wiring (sheets 4-14):** 123 wires and 37 cables, with rev20's wire numbers (most changed). The 72-terminal TB4 and its 24 internal IO-Link cables are gone: the 20 field cables land on the CPL1-CPL3 plugs. The old TB5 is TB4; the safe-off wiring is W24-W27 and W48-W51.
- **Parts (sheets 16-18):** 1492-J4 quantity 8, three Ethernet patch cord lines added, the MS4 filter regulator removed.
- **Issues:** rewritten for rev20. Five are new and matter before building: the renumbering (old markers are wrong), the door wiring route to a door hinged on the centre post, field cables landing on the IO-Link masters with no entry or route drawn, the tight FU1 to PDB1 offset for W4-W6, and rework of what the shop already built to rev18.

### Audit

Through a solid 0, across a device 0, shared clamp 0, behind the plate 0, unresolved 0, not drawn 0; 171 segments, 320 conductor ends. Five tight bends: W56 at TB2 and the CBL-IOL-01 jacket at VM1 (the same two as V12, under their rev20 names), and W4, W5, W6 between FU1 and PDB1, which is the geometry rev20 draws (Design issues).

### Open

- The Z reference for FU1 (the sheet 3 picture is about 60 mm higher than the guide places it).
- The door wiring route; the lengths of the HMI1 and E-STOP wires depend on it.
- The sheet 5 junctions (W25/W49, W27/W51): the guide makes them on TB4-2 and TB4-3.
- Everything open in V12 that rev20 did not change (GLG terminal numbering, T1 fuses, field entries, GB2, A/C and subplate 2 positions).

## What's new in V12 (Bob's review of V11)

Bob left the one open choice to the guide: where the safe-off junctions on sheet 5 are made.

- **They are made on TB5.** W24 is a jumper from TB5-1 to TB5-3 and W25 from TB5-2 to TB5-4, on the door side of the strip. One conductor runs from TB5-3 to E-STOP 12 and one from TB5-4 to E-STOP 21.
- **Why:** a junction has to be made at a terminal, and the strip is the place for it. It puts one wire under each E-STOP contact screw and two safety conductors across the door hinge. V11's reading put two under each screw and four across the hinge. The circuit is the same as drawn either way.
- **Still for engineering to confirm:** it is listed under Design issues with both readings.
- Jumpers on one strip now loop at different depths so they pass over each other, and a short jumper carries one marker.
- `START HERE.txt` is rewritten for the screen as it is now.

**Audit:** 464 conductor ends, 190 wires and cables drawn. No wire through a solid, none across a device it does not land on, no shared line in a clamp, 2 tight bends.

---

## What was new in V11 (2026-11-09, Bob's review of V10)

The checklist is in `REVISIONS.md`.

**The wiring diagram, checked against the guide**

Sheets 4 to 15 of Draft rev18 were read conductor by conductor against `data/wirelist.json` (the PDF has no text layer, so it was read as images, at 230 to 600 dpi).

- **Missing, now added:** sheet 4's incoming feeder (three conductors to Q1 1L1, 3L2, 5L3) and incoming ground conductor (to GB1 terminal 1). They are site conductors with no number, size or entry point on the drawing, so they are drawn as short tails at their landings and listed under Field wiring.
- **Wrong, now fixed:** W24, W25 and W102 were printed on both sides of TB5. The drawings number the door side only; the drive and IO1 side has no number.
- **Everything else matched:** all 119 numbered and unnumbered wires and all 61 cables, with the right devices, terminals, numbers and sizes.
- **Four drawing points raised as design issues:** feeder and ground size and entry; where the W24/W25 junctions on sheet 5 are made (see Still open); SC5/SC6 cross references on sheet 12; IO1 VAC-VDC 2 unwired on sheet 8.
- A cable-name slip in the list's own terminal table (TB4-49 to -60) is corrected; the guide does not use that table.

**T1 H3-H2:** the 480 V jumper is the flat metal link supplied with the transformer, between the two neighbouring screws. V10 drew a wire that ran 70 mm down past the transformer and back.

**Selection buttons:** Wire it, Wires, Parts, Step, Trace route (Trace route last).

**Audit:** 462 conductor ends, 190 wires and cables drawn. No wire through a solid, none across a device it does not land on, 2 tight bends.

---

## What was new in V10 (2026-11-09, Bob's review of V9)

The checklist is in `REVISIONS.md`.

**PWS1 (WAGO Pro 2, 2787-2347): where its wires go**
- **Not into a block on the front.** The fitted supply has none there (shop photos 2026-11-05).
- **Output, X2:** the blue 5-way plug standing on top of the supply at the front edge. Poles 1-3 are minus, 4-5 plus. W22 goes down into pole 1 and W23 into pole 4.
- **Input, X1:** the black 4-way plug under the bottom at the front: L1, L2, L3, PE. W35-W37 and the ground W21 go up into it.
- **Why it looked wrong since V4:** WAGO's model was standing on its back, its top turned to the front. So the black input plug showed on the "front", the blue output plug was hidden against the plate, and the wires went into bare housing. It is now turned up as fitted, and the body is 137 mm deep, not 169.

**Fuses are parts**
- Seven fuses can each be clicked, found and looked up: **FU1-L1, FU1-L2, FU1-L3** (LPJ-70SP), **FU2-F** (FNQ-R-6, seen through a window in the carrier's front), **T1-F1, T1-F2** (primary) and **T1-F3** (secondary).
- **T1's are an approximation.** Sheet 4 gives 2 x 3.5 A class CC and 1 x 10 A midget; the BOM lists none. They are drawn as 10.3 x 38 mm cartridges between clips on T1's fuse blocks, and listed under Parts as FNQ-R-3-1/2 and FNM-10, marked "not in the BOM" and "approximation". Confirm the part numbers before ordering.

**Audit:** unchanged from V9: no wire through a solid, none across a device it does not land on, 2 tight bends.

---

## What was new in V9 (2026-11-09, Bob's review of V8)

The checklist is in `REVISIONS.md`.

**Fuses and the fuse block**
- **FU1 is a trailer fuse block** (1494U-IN001 p.10, in PartsLib). It hangs under Q1, its poles in line with the switch, its top 113.0 mm (DIM Z, 4.449 in, for 100 A 600 V class J) below the switch body. V8 had it 8 mm to the right and 12.4 mm too low: a 125 mm gap, wider than the fuse is long.
- **The three LPJ-70SP fuses are drawn** (Bussmann's model), bridging from the switch to the block, with the two phase barriers between the poles.
- **W1-W3 are not wires.** Sheet 4 numbers the Q1 to FU1 link W1-W3, 4 AWG, but the fuses make it. They are listed as "not a wire" and are a new design issue. **This is a reading of the Rockwell instruction and the shop photos: confirm it with whoever raised the fuse block.**

**Wires**
- **Drive control wires and Ethernet cords** cross to the left edge of each drive and run down beside the power terminals. V8 hung them down the middle, over the legend and the terminals.
- **Bends:** every corner of every run is rounded to a radius that grows with the wire. Tight bends: 24 in V8, 2 now (W62 at TB2, CBL-IOL-16 at VM1).
- **VM1 cables** run along the wall at their own height; V8 climbed 100 mm past VM1 and came back.
- **A cable that only crosses a duct** goes over it instead of dipping into it.

**Screen, laid out for the person building the panel**
- **Top bar:** Build, Wire, Parts, Wire list, Issues as large buttons; tasks and wires done; Find; larger text (AA); Help.
- **Build:** the phases as a strip with this phase's steps as dots, a numbered step, tasks as large tick rows with a count, parts and documents folded away until wanted.
- **Wire:** the marker as large as a label, both ends in their own boxes, route and cut length.
- **One bar of large buttons at the bottom,** always in the same place: Back / Next step in Build, Back / Done, next wire / Skip in Wire. Next turns green when the step's tasks are all ticked.
- **Tool rail on the 3D view:** Finished, Doors off, Reset, Closer, Further, Colours, Wide view. Look-from buttons under the view.
- **It opens at the step it was left at.**

**Audit:** 458 conductor ends (W1-W3 gone). No wire through a solid, none across the face of a device it does not land on, no shared line in a clamp.

---

# V8.0 (kept for reference)

An interactive build and wiring guide for panel **VFD 200**, made from `../../Draft rev18.pdf` (rev A, 18 sheets), the makers' 3D models in `../Vendor Step Files/`, and Bob's shop photos of the build in progress (2026-11-05, Drive folder "Partially Assembled Shop Photos"). V1.0 to V7.0 are kept unchanged beside this folder.

Open **`VFD200 Assembly Guide.html`** in Chrome or Edge. It is one self-contained file (about 14 MB) and needs internet access for the 3D library. PartsLib links need a cpme-usa.com Google sign-in.

## What's new in V8 (2026-11-09: oddities found by a new audit, and an easier screen)

The audit is `tools/audit.js`. It walks every conductor from clamp to clamp and looks for wires inside solids, conductors drawn on top of each other, and bends no wire makes. The checklist is at the top of `REVISIONS.md`.

**Wires and landings**
- **Q1 to FU1 to PDB1 (W1-W6):** the 4 AWG conductors go straight from each lug to the lug facing it. V7 took them 135 mm sideways into a duct and back.
- **Field, door, A/C and VM1 ends:** 60 wires and cables doubled back about 8 mm where they leave the plate, which drew a kink. They now leave in one run.
- **Two wires in one clamp** (TB2-1 to TB2-4, T1 X1) lie side by side. V7 drew them as one wire.
- **CBL-IOL-09:** its L- and C/Q cores land on CPL2 X01-3 and X01-4, with its L+ core. Sheet 11 prints them as X03-1 and X04-1, which are ports 3 and 4; V7 drew them there, across two other plugs. Design issue updated.
- **IO1 (1769-OW16):** the wires still come in from the bottom and up their column, now in front of the screws, each in its own place, and leave through the open wire channel left of the block. V7 ran a column's wires down one line, and the right column out through the floor of the housing.
- **PWS2 (1769-PB2):** wires come up from under the module, as the shop photos show. V7 brought them in from the front.
- **PDB2 and PDB3 feeds:** the 6 mm² feed comes in over the front of the block. V7 ran its last 15 mm through the block.

**Screen**
- **Completed panel** fits the whole subplate in the window, whatever its shape. V7 cut off the top and bottom rails.
- **Look from** buttons: front, left, right, above, below, at the same zoom.
- **Wire colours** (K): what each colour is and how many there are. Click one to show only those wires.
- **Help** (H): one card with the mouse moves and the keys. It opens by itself the first time.
- **Hide the side panel** (P, or the tab on its edge) for a full-width view.
- The view is centred in the space beside the panel, and the toolbar wraps on a narrow window.
- Arrows, multiplication signs and ticks that showed as garbled characters (the hint line, cable sizes, done marks) are fixed.

**Audit result:** 464 conductor ends. No wire passes through a solid, no two conductors share a line in a clamp, no point is behind the subplate. 24 tight bends remain (listed under Still open).

## What was new in V7 (Bob's review of V6)

- **IO1:** the OW16 wires come in from the bottom and run up the face of their column to the clamp, as wired in the shop.
- **FU1:** each load wire goes up into its own box lug. The openings were measured on Rockwell's model; V6 took the gap behind the lug.
- **SI1-SI6:** the plug tiers are stepped as on the real housing. The 1-4 and 9-12 wires leave in front of the outer plugs instead of running through them.
- **Drives:** the front covers stay on in the wiring steps and the Completed panel, drawn as x-ray glass, so every landing shows through them. Clicks go through the glass.
- **Audit:** all 540 conductor ends land inside their own device, and no exit run crosses another device.

## What was new in V6

Every change was taken from the shop photos and checked twice: in the code or audit, then by eye in Chrome against the photo. The checklist is `REVISIONS.md`.

- **Rail 3 is in the built order: PLC1, PWS2, IO1.** That is the order the subplate tags read, and Rockwell requires the controller to be leftmost. Sheet 3 draws PWS2 first; that is now a design issue.
- **Terminal positions from the photos:**
  - PWS2's five-screw column sits at the right of the module, with +24 V on the third screw.
  - IO1's 18-screw block sits in the right of the module, beside an open wire channel.
  - PLC1's Ethernet jacks are under the right of its front.
  - **Drive power blocks:** the lower row runs PE, DC-, DC+, BR, PE; the ground lands on the right-hand PE, and the printed legend sits above.
  - NS1 ports 1-8 run down the left column, and its supply plug is at the bottom of the front.
  - SI1-SI6 have 5-8 as the outer top row and 1-4 as the inner.
  - T1's line wires land on its primary fuse block.
  - PDB1's taps are entered from below, between its barrier fins.
- **Catalogue-shape parts rebuilt as fitted:**
  - SI1-SI6: green plugs, orange and blue number labels.
  - T1: foot plate, primary and secondary boards and fuse blocks on its front, 178 mm deep (PartsLib).
  - PDB1: open, with four tall barrier fins.
  - CB1/CB2: light grey with blue handles.
- **Faces from the photos:**
  - PLC1 now reads L30ER; V5 showed sheet 3's L36ERM.
  - PWS2 and IO1 carry their real fronts, door included; IO1 had none in V5.
  - The drives are black, as fitted, with the white lower cover shown only while covers are on.
- **Audit:** all 540 conductor ends (wires and cable cores) land inside their own device, and no exit run crosses another device.

## What was new in V5

- **PLC1 is Rockwell's own model.** The 1769-L36ERM STEP that would not mesh in V4 is read with cascadio (`tools/step_cascadio.py`); its circuit board is left out.
- **IO1 at its real size, 52.5 mm.** The OW16 is a 1.5-wide module (1769-IN062 p.14). V4's narrowing to 35 mm was wrong. The end cap and end anchor move 17.9 mm right; sheet 3's single-wide IO1 is a design issue.
- **Every wire goes into its terminal's real opening:**
  - into the hole found in the maker's model, or behind the screw where the model draws none;
  - into the entry valley of each 1492-J4/J6;
  - into the front push-ins of the PTFIX blocks.
  
  It then runs straight out of its device before turning for the duct. Q1 and FU1 lugs are placed from Rockwell's models. Audit: all 464 ends sit inside their own device, and no exit run crosses another device.
- **Covers really come off.** The PowerFlex 525 control cover and terminal guard, and the 1769-OW16 and PB2 doors, are taken off the makers' models in the wiring steps and the Completed panel. The terminal blocks behind them are built from the manuals, and the drive wires enter from below.
- **Analog cable shields** go to the ground bar, and their core colours are fixed.
- **Orbit all the way round**, under the panel included, and zoom in to 4 cm. The C key no longer also slices the panel open.
- **About 3 times faster** on an integrated GPU than V4.

## What was new in V4

**The makers' own 3D models.** 30 parts are drawn from the STEP files in `Vendor Step Files/` (component register COMP-0001 to COMP-0043), at their real size. Each is centred on its sheet 3 position with its back on the subplate, and the sheet 3 face image is laid over its front surfaces so labels and markings still show.
- **Devices:**
  - Q1, FU1 and Lug1;
  - CB3 and CB5;
  - DRV1 and DRV2;
  - PWS1, PWS2, IO1, ECR, CPL1-CPL3 and CB4;
  - NS1;
  - PDB2 and PDB3 on their PTFIX-NS35A adapters;
  - RCP1.
- **Rail hardware:** every 1492-J4 and J6 terminal, the end anchors and end barriers, and the DIN rail.
- **Wire duct:** both Panduit ducts, each cut to its run length.
- **Enclosure:** Saginaw's SCE-60XEL4918SSST with its own doors, hinges, 3-point handles and removable centre post, plus the A/C, subplate 2 and its DN-ASB2-10 brackets.
- **Door:** the PanelView Plus 7 and the 800H E-STOP operator.

**Completed panel button** (or C). It shows the finished panel with:
- every part and all 189 wires in place;
- the doors and centre post off;
- the duct covers off;
- the drive covers and 1769 doors open, so each landing can be checked against the panel on the bench.

**Accurate wire landings.**
- **Where each clamp sits:** on the real surface of its terminal. A ray from the front finds the screw, push-in opening or plug face on the model.
- **Audit of the 464 wire ends in the panel:**
  - 393 are on a model surface;
  - 27 are on the drive and 1769 terminal blocks, shown with their covers off;
  - 42 are on the TB3 1492-JD4 screws, which have no maker model;
  - 2 are inside the openings of PWS1's input plug.
- **Every device was checked close up** with its landings marked.

**RCP1 resolved.**
- **Terminals:** the 1492-REC15 has one L/N/G terminal block at the top that feeds both outlets. This comes from Rockwell's model and the 1492-TD015 p.51 photo.
  - Hot (CB5 T1), neutral (W71) and ground land there.
  - Sheet 6's two receptacle jumpers are marked **not fitted** everywhere.
- **Size and position:** RCP1 is 74 x 124 mm, not V3's 45 mm box. It now sits in the only gap on rail 4 it fits, between TB5 and CB5.

**Better models where no STEP exists.** CB1 and CB2 (140MT-F), FU2 (CHCC1DU), PDB1, T1, SI1-SI6 (GLG), NS2 (NAT-102), GB1 and PLC1 are built to their catalogue shape, and wires land on those surfaces too. Each one has:
- terminal shoulders;
- raised operating faces and rotary handles;
- the PDB's smoked load cover;
- the transformer's core, coil and terminal boards;
- the isolators' two-level plug terminals;
- the 1769-L3 door.

**Parts tab:** every card says where its 3D shape comes from: the maker's STEP (register id and file) or its catalogue drawing.

## Still open

- **E-STOP safety wiring (sheet 5):** the guide makes the junctions on TB5 (V12). The drawing does not say where they are made, so engineering should confirm.
- **Fuse block and fuses:** FU1 as a trailer fuse block with no W1-W3 wires (V9), and T1's fuse part numbers (V10), are the guide's readings and have not been confirmed by engineering.
- **T1 link:** drawn as the maker's flat link. Not checked against the transformer on the bench: the shop photos do not show the primary board's screws closely enough.
- **Sheets 1-3 and 16-18** (title, layout, BOM) were not part of the V11 check.
- **"Wires where they shouldn't be":** Bob saw a couple in V8 and did not say which. V9 moves the drive control wires and cords, which were the only ones the audit and a look round found out of place. If others remain, click them and say which.
- **T1 fuses:** drawn and listed as an approximation (V10); the part numbers are not from the drawings.
- **PWS1 plug poles:** the wire openings are placed across each plug's width from WAGO's model; the pole order (1 at the left) is as printed on the face.
- **Tight bends (2):** W62 at TB2 and the CBL-IOL-16 jacket at VM1.
- **Rail 3 module joints:** Rockwell's 1769 models are 1.4 to 5.7 mm wider than the modules' nominal widths (bus connectors and latches), so the boxes of PLC1, PWS2, IO1 and the end cap overlap by 3 to 6 mm. Not checked against the real joint.
- **IO1 OUT 15** (not wired): a ferrule there would foul the housing floor as the block is placed from the photo.
- **Not looked at in V8:** terminal positions on devices the audit passes (T1, PDB1, NS1, the isolators, the drives' control blocks) were not re-measured.
- **PowerFlex 525 control block:** Rockwell's model has no terminal blocks. The power block now follows the shop photo; the control I/O block is still placed from 520-UM001's figures, because the photos show the control cover still on.
- **RCP1:** Rockwell's family model has the GFCI face, and the L/N/G order is not printed in any document held.
- **GLG isolator:** the numbering now comes from the isolators' own labels in the photos. There is still no manufacturer document.
- **T1 terminal order down each board:** the photos show the boards but not their markings. The guide uses sheet 3's order (H1 H3 H2 H4, X2 X1).
- **Not yet photographed:** TB5, CB5 and RCP1 were not yet fitted, and FU2, CB3, GB1 and the door devices are not in the photos.

## Files

| Path | What it is |
|---|---|
| `VFD200 Assembly Guide.html` | The guide. Built; do not edit it by hand. |
| `src/model_fit.mjs` | Which vendor model stands in for each device and how it is turned into panel axes. |
| `src/terminals.mjs` | Every device's terminal positions, entry side and source. |
| `src/layout.mjs`, `src/guide.js` | Panel data and build steps; the 3D scene, models, router, selection and panel. |
| `assets/models/` | The vendor STEP files converted to compressed meshes (`index.json` names each source STEP and its sha256). |
| `data/*.json`, `assets/tex/` | Wire list, PartsLib records and links, install facts; device faces from sheets 2 and 3. |
| `tools/models.json`, `tools/step_to_mesh.mjs` | STEP conversion: `cd tools; npm install` once, then `node --max-old-space-size=12000 tools/step_to_mesh.mjs [key...]`. |
| `tools/step_cascadio.py` | STEP files occt-import-js cannot mesh (PLC1): `python -m venv <dir>`, `<dir>\Scripts\pip install cascadio trimesh numpy`, then `<dir>\Scripts\python -I tools/step_cascadio.py L3`. |
| `tools/make_faces.py` | V6 faces: the SI1-SI6 isolator faces (drawn), and PLC1, PWS2, IO1 rectified from the shop photo: `python -I tools/make_faces.py "<folder with the shop photos>"`. |
| `REVISIONS.md` | The V8 audit checklist, then V7's and V6's. |
| `tools/audit.js` | The V8 audit. Serve this folder over http, open the guide, then in the console: `(await import('/tools/audit.js')).run()`. |
| `tools/part_picker.html` | One model in panel axes with every solid hoverable (finding covers and lugs). |
| `tools/model_viewer.html`, `tools/fit_check.html` | Check a model from all sides, and against its sheet 3 face with the terminal points. Serve the folder over http to use them. |
| `vendor/lab-kit.js`, `build.mjs` | Renderer and build: `node build.mjs`. |
