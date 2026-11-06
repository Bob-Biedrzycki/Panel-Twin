# VFD 200 Assembly Guide V4.0 (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid)

An interactive build and wiring guide for panel **VFD 200**, made from `../../Draft rev18.pdf` (rev A, 18 sheets) and the makers' 3D models in `../Vendor Step Files/`. V1.0 to V3.0 are kept unchanged beside this folder.

Open **`VFD200 Assembly Guide.html`** in Chrome or Edge. It is one self-contained file (about 12 MB) and needs internet access for the 3D library. PartsLib links need a cpme-usa.com Google sign-in.

## What's new in V4

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

- **PLC1:** Rockwell's 1769-L36ERM STEP does not mesh. OpenCascade reads 535 solids but no faces, in two versions. PLC1 is built from its catalogue shape.
- **IO1:** the model Rockwell offers on the 1769-OW16 page is its 56.5 mm I/O case. It is narrowed to the OW16's 35 mm.
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
| `tools/model_viewer.html`, `tools/fit_check.html` | Check a model from all sides, and against its sheet 3 face with the terminal points. Serve the folder over http to use them. |
| `vendor/lab-kit.js`, `build.mjs` | Renderer and build: `node build.mjs`. |
