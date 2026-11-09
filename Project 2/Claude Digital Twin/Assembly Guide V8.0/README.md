# VFD 200 Assembly Guide V8.0 (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid)

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

- **Tight bends (V8 audit, 24):** the Ethernet plugs at NS1 (9), 8 AWG wires at TB1 and the drive duct corners (7), four IO-Link jackets, the two TB2 jumpers, and W1/W3 where Q1's lugs sit 8 mm left of FU1's.
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
