# VFD 200 Assembly Guide V3.0 (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid)

An interactive build and wiring guide for panel **VFD 200**, made from `../../Draft rev18.pdf` (rev A, 18 sheets). V1.0 and V2.0 are kept unchanged beside this folder.

Open **`VFD200 Assembly Guide.html`** in Chrome or Edge. It is one file and needs internet access for the 3D library. PartsLib links need a cpme-usa.com Google sign-in.

## What's new in V3

**Wire landings**
- **Every device face was measured** on a 2.5 % grid. The GLG isolators were measured from the PDF at 900 dpi.
- **Terminal layouts come from the manuals wherever one exists:**
  - AL1920: port and pin order from ifm 80281466 p.5/p.9 and the pin numbers printed on its face.
  - 1769-PB2: 1769-IN028 p.5/p.11.
  - 1769-OW16: 1769-IN062 p.8.
  - PowerFlex 525 control and power blocks: 520-UM001 p.32/36/42.
- **V2 landings that were off by several millimetres are corrected:**
  - SI1-SI6: the bottom rows.
  - PDB1 and PDB2/PDB3: the load openings.
  - T1: X1 and X2.
  - Q1: the lugs.
  - NS1: the ports.
  - CB4: the inputs.
- **Every terminal names its source,** marked measured or documented.
- **Covers come off for wiring.** In the wiring steps the drives show their control module cover and terminal guard off, and the 1769 modules show their doors open, so every wire visibly lands on its screw.
- **Terminal strips are modelled from the real blocks,** not the sheet 3 symbol, which is not to scale.
- **Rail 3 devices are at their real widths.** Sheet 3 overlaps them; that is now a design issue.

**Selection and tracing**
- **Click any wire or part.** Everything else turns to glass, so the selection can be followed through the bundles.
  - A selected wire turns orange, with a light running along it from end A to end B.
  - It gets double rings at both clamps, plus labels giving the terminal and where it is on the device. For a cable that means every core.
- **Trace route** (button or T) flies the camera along the wire from end to end.
- **Selecting a device:**
  - Its wires stay solid, and a tag on each of its terminals shows the terminal and its marker.
  - The tag turns green when that wire is done.
- **A selection bar** sits at the top of the panel with Step / Wire it / Parts / Wires. Switching tabs keeps the selection, and each tab shows it:
  - **Build steps** jumps to the step it belongs to.
  - **Wire it** opens on that wire, or works through every wire on the selected device.
  - **Parts** shows the device card and its terminal table. For a wire, it shows both end devices with that wire highlighted.
  - **Wires** filters the list to wires on the selected device, or on both ends of the selected wire.
- **Device names everywhere are links** to select that device.
- **Search box** (top left): type W29, CB4, TB4… and press Enter. **Esc** clears the selection.

**Realism**
- **Enclosure from the Saginaw SCE-60XEL4918SSST drawing:**
  - Both doors hinge on their left edge, the right one on the removable centre post.
  - Stainless 3-point handles on the right.
  - Subpanel studs at Saginaw's 45.25 × 54.25 in pattern.
  - Flange handle at 7.88 in below the top.
- **RCP1** is a full 1492-REC15 duplex receptacle.
- **Field cables** run to cable glands in the enclosure floor.
- **The AL1920** is its real 105 mm deep, with plugs in two depths.

**Cut lengths** now add up: the routed length, plus at each end the strip length from that terminal's document and a 50 mm service loop. Field ends get 300 mm coiled, the door/A/C/subplate 2 ends 100 mm, and cable breakouts 60 mm. The breakdown is on every wire card.

**Issues:** design issues are tracked (new ones are marked). All but one of the modeling issues are resolved; the Issues tab says how each was handled.

## Files

| Path | What it is |
|---|---|
| `VFD200 Assembly Guide.html` | The guide. Built; do not edit it by hand. |
| `src/terminals.mjs` | Every device's terminal positions, entry side and source. |
| `src/layout.mjs`, `src/guide.js` | Panel data and build steps; the 3D scene, router, selection and panel. |
| `data/*.json` | Wire list, PartsLib records and links, install facts, web documents. |
| `assets/tex/` | Device faces from sheets 2 and 3. |
| `tools/extract_textures.py`, `tools/detect_terminals.py` | Recut the faces; overlay detected screws on the terminal layouts. |
| `vendor/lab-kit.js`, `build.mjs` | Renderer and build: `node build.mjs`. |

## Still open

- **The GLG isolator's terminal numbering** beyond 9/10 has no manufacturer document. Check it against the label on the isolator.
- **The 787-1668's depth** waits for WAGO's manual (PartsLib request #10994).
