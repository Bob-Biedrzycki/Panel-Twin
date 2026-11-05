# VFD 200 Assembly Guide V5.0 (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid)

An interactive build and wiring guide for panel **VFD 200**, made from `../../Draft rev18.pdf` (rev A, 18 sheets) and the makers' 3D models in `../Vendor Step Files/`. V1.0 to V4.0 are kept unchanged beside this folder.

Open **`VFD200 Assembly Guide.html`** in Chrome or Edge. It is one self-contained file (about 14 MB) and needs internet access for the 3D library. PartsLib links need a cpme-usa.com Google sign-in.

## What's new in V5

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

- **PowerFlex 525 blocks:** Rockwell's model has no terminal blocks; they are placed from 520-UM001's figures, and their exact height under the cover is not dimensioned.
- **PartsLib:** the 1769-OW16 record says 35 mm wide; it is 52.5 mm.
- **RCP1:** Rockwell's family model has the GFCI face, and the L/N/G order is not printed in any document held.
- **GLG isolator:** its terminal numbering still has no manufacturer document.

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
| `tools/part_picker.html` | One model in panel axes with every solid hoverable (finding covers and lugs). |
| `tools/model_viewer.html`, `tools/fit_check.html` | Check a model from all sides, and against its sheet 3 face with the terminal points. Serve the folder over http to use them. |
| `vendor/lab-kit.js`, `build.mjs` | Renderer and build: `node build.mjs`. |
