# VFD 200 Assembly Guide V2.0 (CPME 1082-01, ABARTA Coca-Cola CIP Double Skid)

An interactive build and wiring guide for panel **VFD 200**, made from `../../Draft rev18.pdf` (rev A, 18 sheets). V1.0 is kept unchanged in `../Assembly Guide V1.0/`.

Open **`VFD200 Assembly Guide.html`** in Chrome or Edge. It is one file and needs internet access for the 3D library. PartsLib links need a cpme-usa.com Google sign-in.

## What's new in V2

**Wiring accuracy**
- **Every conductor lands on its real terminal.** Terminal positions come from the device faces on sheet 3 (screw heads, push-ins, plugs) and from the manual figures in PartsLib, using PartsLib's pin names. The manual figures used are 520-UM001 p.36 and p.42, 1769-IN028 p.11, and 1492-TD019 p.14.
- **Wires enter each clamp from the side it opens to.** They end in a ferrule or a bare end. Bare ends are used on the Eaton FAZ breakers, because Eaton does not recommend ferrules (FAZ-NA p.6), and in the 8-4 AWG lugs.
- **Multi-core cables are broken out into their cores.**
  - The 25 IO-Link cables run from TB4 terminals n/n+1/n+2 to the AL1920 port pins 1, 3 and 4.
  - The M12 and instrument cables land on the TB3/TB4 field sides.
  - Each cable has a jacket and a stripped breakout at both ends, and its cores are coloured by pin.
- **TB2, TB4 and TB5 are built at 6.1 mm per terminal**, the real 1492-J4 width (1492-TD015 p.2). TB4 is now 439 mm, as drawn on sheet 3.
- **Routing keeps AC power and 24 V/signal apart** wherever the drawn ducts allow, following 520-UM001 p.37. The ducts where they still share are reported as a design issue.
- **Every device has an engraved tag plate** on the subplate. Every duct run is named (D1-D9) on its floor, so a route like "D3 → D4 → D5" can be followed on the panel.

**Realism**
- **Device envelopes come from the PartsLib records:**
  - DRV1/DRV2 212 mm deep (520-TD001 p.15), with heatsink fins and the control module;
  - T1 178 mm, PDB1 99.6 mm, Q1 92 mm, FU1 76 mm, PWS1 137.5 mm, GB1 19 mm;
  - the HMI bezel 297 × 252 mm;
  - the A/C 254 × 480 × 190.5 mm.
- **Terminal hardware is modelled on every device:**
  - screw heads, push-in releases and RJ45 jacks;
  - end anchors with their screws;
  - DIN-device shoulders with vent slots;
  - VM1's 32 tube fittings;
  - E-STOP contact blocks;
  - HMI mounting clips;
  - the door gasket.
- **Device faces double as bump maps**, so moulded detail catches the light.

**Tools for the builder**
- **Wire it** (tab, or *Wire them one by one* on any wiring step) takes you through every conductor in a step, in bench order. Each wire shows:
  - the marker, AWG, colour, cut length, sheet and line;
  - both ends: device, terminal, where that terminal is on the device ("bottom row, 2nd of 3 from the left"), the end type, and the torque, wire range and strip length cited from the device's documents;
  - the duct route and the drawing note.

  The 3D view ghosts every other wire, rings and labels both clamps, and frames them. Tick *Done* and it moves to the next wire; progress is remembered on this computer. Keys: ← → to move, Enter for done.
- **Parts:** click any device for its terminal table: every terminal, the marker on it, where it goes, and whether it is done.
- **Wires tab:** the marker list as CSV (now with terminal positions, end types and routes), a printable **run sheet** grouped by step with tick boxes, and a **cut list**: runs, total metres, +10 % and markers per conductor size and colour, cable lengths and the ferrule count.
- **Remove front** (button or F) takes off the doors and the whole front frame for a clear view inside. **Reset view** (R) returns to the step's camera.
- Clicking a part or a wire now pans and zooms to it without turning the model, from wherever you have orbited to. This was the selection bug.

**Issues tab:** split into **Design issues**, for the engineer who drew the panel, and **Modeling issues**, which say how the guide handles each gap and whether it is resolved.

## Files

| Path | What it is |
|---|---|
| `VFD200 Assembly Guide.html` | The guide. Built; do not edit it by hand. |
| `src/layout.mjs` | The panel as drawn: BOM, devices and positions, ducts, rails, build steps. |
| `src/terminals.mjs` | Where every terminal is on each device, which way the wire enters, and the source of each layout. |
| `src/guide.js` | The 3D scene, wire router, wire mode and guide panel. |
| `data/wirelist.json` | Every wire, cable and terminal on sheets 4-15, transcribed from the PDF. |
| `data/partslib_records.json` | Envelopes, clearances, torques and wire ranges from the PartsLib part records. |
| `data/partslib.json`, `data/install_facts.json` | PartsLib deep links to the install pages, and the values read from them. |
| `data/install_docs.json` | Manufacturer documents found on the web. |
| `assets/tex/` | Device faces cut from sheets 2 and 3 (`tools/extract_textures.py`). |
| `vendor/lab-kit.js`, `build.mjs` | Renderer and build: `node build.mjs` (Node 18+). |

## Still assumed (Modeling issues tab)

- **Wire colours:** none are given on the drawings.
- **Positions not drawn:** the A/C, subplate 2 and RCP1. The A/C and subplate 2 are placed on the left side wall; RCP1 is a dashed outline on rail 4.
- **Door hinge:** the right door is hinged on its right edge.
- **Hidden terminals:** some positions are approximate where the terminals are hidden on the drawing. These are the drive control block, the 1769-PB2 and OW16 blocks under their doors, and the pin order inside an AL1920 plug. Each is marked "approx" in the guide.
- **Cut lengths:** routed length plus 75 mm per end. Cut long and trim.
- **Field wiring:** motors, instruments and the plant network are shown as stubs leaving the bottom duct.

## PartsLib requests still open

#10994-#11002, plus #7460 for VTUX: 787-1668, 800H, 2711P-UM007, 1769-IN062, FL SWITCH 1116N, NAT-102, the enclosure drawing, the 1494U-D100 instruction and DN-ASB2-10. When the PDFs arrive, add their page links to `data/partslib.json` and the values to `TERM_SPEC` in `src/guide.js`, then rebuild.
