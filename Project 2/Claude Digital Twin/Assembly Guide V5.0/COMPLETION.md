# VFD 200 Assembly Guide V5.0: Completion Description

This is the sixth pass, dated 2026-11-05. It is in `Assembly Guide V5.0/`; V1.0 to V4.0 are unchanged.

## What was asked

- **PLC1:** resolve the Rockwell STEP file that would not mesh (V4 built PLC1 from its catalogue shape).
- **IO1:** resolve the OW16 model being a 56.5 mm case that V4 narrowed to 35 mm.
- **Landings:** fix the wire landings shown in Bob's four photos (drive control terminals, CB1/CB2 and the PTFIX block, Q1's lugs, FU1's lugs) and check them all.
- **Orbit:** the view could no longer be turned in every direction.
- **Checks:** everything resolved and checked in the model in Chrome before handing back.

## What was done

**PLC1: Rockwell's own model.**
- **Why V4 failed:** occt-import-js reads the 1769-L36ERM file's 535 solids but meshes none of their faces.
- **Fix:** the file is now read with cascadio (OpenCascade 7.8 through Python), which meshes all of it. The new tool `tools/step_cascadio.py` writes the same model format as `step_to_mesh.mjs`.
- **What is left out:** the circuit board inside the model, which is 80 % of the triangles and not visible with the housing closed.
- **Result:** the housing, door, LEDs and latches are Rockwell's, with the sheet 3 face laid on. The two Ethernet jacks open downwards.

**IO1: full size, and a drawing error found.**
- **V4 was wrong:** the narrowing to 35 mm was a mistake. 1769-IN062 p.14 gives the OW16 as 118 x 87 x 52.5 mm. Rockwell files its CAD under the wide I/O case (1769-IO_CASE_15, 1769-IO_wide.dwg), while the single-wide modules get 1769-IO_CASE.
- **Now:** IO1 is Rockwell's model at full size.
- **Knock-on moves:**
  - the 1769-ECR end cap moves 17.9 mm right;
  - the end anchor after it moves from 316 to 334 mm, into the 52 mm gap before SI1.
- **Design issue:** sheet 3 draws IO1 single-wide.
- **For Bob:** PartsLib record 813 (1769-OW16) still says 35 mm wide and should be corrected.

**Wire landings: every wire goes into its terminal's real opening.**
- **Openings in the makers' models (124 ends):**
  - rays down each terminal's entry direction find the hole that reaches the clamp and is walled in round it;
  - the conductor stops inside the clamp body (a box lug no longer has copper sticking out of its far side).
- **Q1 and FU1:** their lug positions are read off Rockwell's models. Sheet 3 put them 4-7 mm off, which is why the wires in the photo missed the lugs.
- **1492-J4/J6 strips (204 ends):** the wire goes into the entry valley behind the screw, read off each block's profile.
- **Parts with no opening drawn (108 ends):** the catalogue-shape parts and flat-drawn push-ins. The wire enters through the face the clamp opens on, behind the screw, with a dark entry mark. CB1/CB2 in the photo are now right.
- **Built blocks (28 ends):** the drives and 1769 modules (next item).
- **Leaving the device:**
  - every wire runs straight out of its device before it turns for the duct, so it never crosses a device's face (Q1's load wires in the photo came in sideways through the switch);
  - front-entry terminals in one column stand off in steps like a dressed comb (CB4's eight outputs);
  - PTFIX (PDB2/PDB3) wires go into the front push-ins, and the 6 mm² feed is front too.
- **Drives and 1769 modules:**
  - the covers really come off in the wiring steps and the Completed panel: the PowerFlex 525 control cover, its cable opening and the power terminal guard are separated out of Rockwell's model, and the 1769-OW16 and PB2 doors are their own solids;
  - the terminal blocks behind them are built where the manuals put them (520-UM001 p.36/42; 1769-IN028/IN062);
  - drive control and power wires enter from below and drop out of the bottom of the drive, and the EtherNet/IP plug goes in from below.
- **Audit of all 464 wire ends:** every conductor tip is inside its own device, and no exit run passes through another device.
- **Found and fixed on the way:**
  - the analog cables' shields now go to the ground bar (V4 put them on TB3-1);
  - their white and black cores were swapped.

**Orbit.**
- **Range:** the view turns all the way round and under the panel, and zooms in to 4 cm. V4 stopped at the horizon and at 0.45 m; the near plane now follows the zoom.
- **C key:** the renderer's own C (cut away) key fired with the guide's C (Completed panel) and sliced the panel open; the renderer's keys are now off.

**Speed.** On this laptop's integrated GPU, Chrome showed the panel at about 5-6 frames a second in V4. Changes:
- **Shadows:** drawn only when something changes.
- **See-through parts:** two transmission materials that forced a second full render are replaced (RJ45 plugs, PDB1 cover).
- **Wire ends:** each wire's end hardware is now one draw.
- **Ducts:** tessellated coarser.
- **While turning:** ambient occlusion pauses while the view moves, and the resolution steps down if frames are slow.

Measured the same way at the 480 V wiring step: 156 ms a frame in V4, about 45-50 ms in V5.

**How it was checked.**
- **In Chrome:** every wired device was viewed close up from several angles, including from below, in the Completed panel view:
  - Q1, FU1 and PDB1;
  - CB1-CB3, FU2 and TB1;
  - the drives (control block, jack and power block);
  - T1;
  - PWS2, PLC1, IO1 and ECR;
  - SI1-SI6, CPL1-CPL3, CB4 and PWS1;
  - NS1, NS2, PDB2 and PDB3;
  - TB2-TB5, RCP1, CB5 and GB1.
- **Interaction:** wire selection, tracing, the wiring steps and the last step were exercised with no console errors.

## Not verified

- **Frame rate on the shop's own machines.** Measured here on an AMD Radeon 860M at 2219 x 1215. Other guide tabs open in the same Chrome share the GPU and slow both.
- **PowerFlex 525 block positions:**
  - Rockwell's model has no terminal blocks inside it;
  - the control and power blocks are placed from the manual's figures, inside the cavity the cover leaves;
  - their exact height under the cover is not dimensioned in any document held.
- **Still open from V4:**
  - the RCP1 L/N/G order;
  - GLG terminal numbering;
  - RCP1's GFCI-face family model.
