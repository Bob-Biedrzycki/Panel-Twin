# VFD-RT00-03 Assembly Guide V2.0

Interactive build and wiring guide for panel VFD-RT00-03 (Westby Creamery, 10006 Intake Receiving VFD), made from `../10006 VFD-RT00-03.pdf` (Sharpe Engineering & Equipment, 16 sheets, initial release 06/24/26) with the Panel Twin skill 1.0.0. The first new panel taken through that skill. V2.0 replaces V1.0's stand-in models with the makers' own for the drives, disconnect, fuse block, motor breakers, 24 V supply, 1489-M breakers and duct, and moves the fuse block to where Rockwell's instruction puts it.

Open `VFD-RT00-03 Assembly Guide.html` (needs internet for three.js and fonts). Builder's page: `START HERE.txt`.

## What is in it

- 26 devices on the subpanel at the positions sheet Z02 draws (measured: the sheets have no dimensions), 6 fuses as parts, the enclosure and air conditioner.
- 98 conductors and 6 Ethernet cables from sheets B01-B04, C01, D01, N01: 101 drawn, 3 listed as "not a wire to make" (links on the transformer's own fuse blocks).
- 18 build steps, 71 tasks, with the flags to check with engineering.
- 25 design issues for the engineer, 11 modeling issues (the guide's own stand-ins and assumptions).

## Rebuild

```
node tools/make_wirelist.mjs      # data/wirelist.json, the record of the sheets
python -I tools/extract_textures.py "../10006 VFD-RT00-03.pdf" .
node build.mjs
node <skill>/scripts/audit_headless.mjs .
node --max-old-space-size=12000 tools/step_to_mesh.mjs KEY   # after npm install --prefix tools; STEP files in ../Vendor Step Files
```

## Where things are

| File | What |
|---|---|
| `tools/make_wirelist.mjs`, `data/wirelist.json` | The schematic sheets as printed, misprints included |
| `build.mjs` (top) | The guide's readings, each with its reason: tags, terminal plan (`TB_PLAN`), 1AWG, transformer links; the two issue lists |
| `src/layout.mjs` | Devices, ducts, rails, BOM, steps |
| `src/terminals.mjs`, `src/model_fit.mjs` | Terminal layouts; which model stands in for what |
| `src/guide.js` | The engine, adapted from the VFD 200 guide |

## Still open

- Makers' models not found: the Littelfuse fuse holders, the 700-HLT1L1 relay, the 1492-JG4, the Panduit jack and adapter, a 60 A class J fuse, the 12 in deep enclosure. The frame C drive's power terminal block is built to frame D's pattern.
- Terminal positions on the LPSC fuse holders, 1489-M breakers, 700-HLT1L1 relays and the jacks are from the drawing symbols, not makers' documents.
- Everything under Design issues, first of all: the drives' safe-off inputs (nothing is connected to S1/S2), the main rating (60 / 90 / 100 A), the 1AWG and 8AWG sizes, terminal numbering, sheet C01's labels.
- No shop photos yet.
