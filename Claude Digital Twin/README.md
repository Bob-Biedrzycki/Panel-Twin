# VFD 200 Assembly Guide (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid)

An interactive build guide for panel **VFD 200**, made from `../Draft rev18.pdf` (rev A, 18 sheets). It walks an assembler through the panel in a logical order. At each step a 3D panel shows exactly what is installed so far; every wire is routed through the ducts and labelled at both ends; and every part links to its installation pages in Todd's PartsLib.

Open **`VFD200 Assembly Guide.html`** in Chrome or Edge. It is one file and needs internet access for the 3D library. PartsLib links need a cpme-usa.com Google sign-in.

## What the builder gets

- **21 build steps in five phases:**
  1. Prepare the enclosure.
  2. Lay out subplate 1 (ducts and rails).
  3. Mount the components, rail by rail.
  4. Wire it: 480 V, 120 V, 24 V and safety, network and IO-Link, field terminals.
  5. Install and finish: subplates in, door devices, A/C, handle, covers and checks.

  Each step has a checklist (ticks are saved in the browser), the reason for the order, the parts with their references, and the drawing or BOM problems to raise with engineering.
- **The 3D panel**, built up step by step:
  - Device faces are the manufacturers' images and drawings taken from sheets 2 and 3, placed at their sheet 3 coordinates, on bodies at catalogue depth.
  - The wireway and DIN rails are as drawn.
  - The enclosure, doors, A/C, handle and subplate 2 are modelled.
  - The parts added in each step are outlined and tagged.
  - Click any part to open its card. Click any wire to see where it goes.
- **Wiring, from sheets 4-15:**
  - 191 conductor and cable runs: 104 numbered wires, the jumpers and grounds, 25 IO-Link cables, 9 Ethernet cords and the field cables to the terminal field sides.
  - Each run is routed through the duct network from terminal to terminal.
  - Each wire carries heat-shrink markers at both ends.
  - The **Wires** tab lists them with marker, AWG, from, to, sheet, line, potential, an approximate cut length and the drawing note.
  - **Download marker list (CSV)** gives a file for the label printer.
- **References, from PartsLib** (`data/partslib.json`, `data/install_facts.json`):
  - Deep links to the part record and to the exact pages of the installation manual. Examples: 520-UM001 p.15 for mounting and p.36 for terminal torque; 1769-UM021 p.66 for minimum spacing; 1769-IN028 p.11; the WAGO Pro 2 manual p.30; the Saginaw A/C manual pp.7-8.
  - The key install values read from those pages: torque, clearance, wire range and strip length, each with document and page.
  - Manufacturer web links are a fallback; links nobody opened are marked "(unchecked)".
- **Issues tab:** every drawing and BOM discrepancy found while building the guide, in one list for engineering.

## Files

| Path | What it is |
|---|---|
| `VFD200 Assembly Guide.html` | The guide. Built; do not edit it by hand. |
| `src/layout.mjs` | The panel as drawn: BOM, devices and positions, ducts, rails, and the build steps (text and camera). |
| `src/guide.js` | The 3D scene, wire router and guide panel. |
| `data/wirelist.json` | Every wire, cable and terminal on sheets 4-15, transcribed from the PDF. |
| `data/partslib.json`, `data/install_facts.json` | PartsLib links and the install facts read from them (2026-11-04). |
| `data/install_docs.json` | Manufacturer documents found on the web, with what was read from them. |
| `assets/tex/` | Device faces cut from sheets 2 and 3 (`tools/extract_textures.py`). |
| `vendor/lab-kit.js` | The studio renderer (from the Machine skill), vendored so the build works anywhere. |
| `build.mjs` | `node build.mjs` rebuilds the HTML from the above. |

To change a step, a device position or a wire: edit `src/layout.mjs` or `data/*.json`, then run `node build.mjs` (Node 18+). To recut the device faces: `python tools/extract_textures.py` (needs pymupdf and pillow).

## What is assumed and what to confirm

- **Wire colours** are an assumed convention: 480 V black, 120 V red/white, 24 V DC blue, 0 V white/blue, ground green/yellow. The drawings do not give them.
- **Positions not drawn:** the A/C, subplate 2 and RCP1. The A/C and subplate 2 are placed on the left side wall. RCP1 is shown as a dashed outline in the free space on rail 4.
- **Door hinges:** the right door is hinged on its right edge. Sheet 2 draws it as a copy of the left door, which puts its hinge at the centre post.
- **Device depths** are catalogue envelopes. The ones not read from a document are marked approximate on the part card.
- **Wire routes** are the shortest path through the drawn ducts. Cut lengths are route length plus 75 mm at each end. Treat both as a guide, not a cut list.
- **Off-plate wires:** wires to field devices end in a stub below the bottom duct marked "to field". Door wires run along the left wall to the hinge and on to the device.
- **TB4** is built at the real pitch (72 × 5.1 mm from 401 mm). The drawing shows it about 446 mm long.

## Not in PartsLib yet (request or upload these)

- 787-1668 (WAGO EPSITRON).
- 800H-FRXJTQH2RA5 installation instruction.
- 2711P PanelView Plus 7 **Standard** user manual: 2711P-UM007, which has the cutout. Only the Performance manual, UM008, is held.
- 1769-OW16 installation instruction (1769-IN062).
- Phoenix FL SWITCH 1116N (1085219).
- Moxa NAT-102.
- Festo VTUX operating instructions.
- Saginaw SCE-60XEL4918SSST drawing.
- 1494U-D100 installation instruction for the 100 A frame. 1494U-IN007, which sheet 3 cites, is the 200 A edition.
- AutomationDirect DN-ASB2-10.
- The GLG isolator, which has no manufacturer documentation.

The web search found public copies of several of these; see `data/install_docs.json`.

## History

The first pass (the live digital twin and SCADA simulator) was dropped on 2026-11-04, when the focus moved to building the panel. It is in git history up to commit `3a8f0cb`.
