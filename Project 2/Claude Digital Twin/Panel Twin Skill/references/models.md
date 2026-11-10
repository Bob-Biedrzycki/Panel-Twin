# Makers' 3D models

## Getting STEP files

Keep them outside the guide folder, one folder per component, with a register (CSV) of part number, source URL, date and file hash. The guide stores only the converted meshes.

What worked and what did not (found collecting the example's 33 models; sources change, so try, do not assume):

| Maker | How |
|---|---|
| Rockwell / Allen-Bradley | `https://configurator.rockwellautomation.com/api/Product/<CAT>` returns JSON listing documents; `/api/Doc/<file>.zip` downloads directly. The product web pages block scripts but open in a browser. |
| Eaton, Phoenix Contact, WAGO | 3Dfindit (needs a login; about 50 downloads a day; STEP AP214): CAD button, Activities panel, Download. |
| Panduit | `panduit.com/PanProductResource/en/<PN>/PartDrawingsN.stp`, no login |
| Burndy / Hubbell | `hubbellcdn.com/step3dfile/<PN>_MODEL-STEP.zip`, no login |
| AutomationDirect | `cdn.automationdirect.com/static/drawings/3d/step/<PN>.STEP`, no login |
| Saginaw | "Download CAD Package" on the part page; needs a real click |
| ifm | Links on the product page; scripted fetches are refused |
| TraceParts | A CAPTCHA on every download: ask the person to fetch those |

No public model was found for: Bussmann fuse holders (gated form), SolaHD transformers, ILSCO ground bars (2D only), Moxa (on request), some Rockwell families (F-frame 140MT, 1492-JD4, 1492-PDC). Build those from the catalogue drawing.

Downloading a file is the person's decision: say what, from where, and how big, and get a yes. Never complete a CAPTCHA or sign in for them.

## Converting

`tools/models.json` lists each model: a short key, the component id (`comp`), the part number (`pn`), the path to its STEP file (`step`), and optional settings: `deflection` and `angular` (tessellation tolerance), `reader: "cascadio"`, and filters for solids to leave out: `skipParts` (regular expressions on solid names) and `skipIndex` (part numbers) for `step_to_mesh.mjs`; `tolerance_mm`, `dropParts` and `keepFrontZ` for `step_cascadio.py`.

Both converters read STEP files from **`<guide folder>/../Vendor Step Files/`**, that is, a folder of that name beside the version folders, with the `step` paths in `models.json` relative to it. That is the `VENDOR` constant near the top of each script; change it if the job keeps them elsewhere.

```sh
npm install --prefix "<guide folder>/tools"                                         # once: occt-import-js
node --max-old-space-size=12000 "<guide folder>/tools/step_to_mesh.mjs" [KEY ...]   # all models, or the named ones
```

This writes `assets/models/<KEY>.bin` (compressed positions, normals, indices, per-part colours) and updates `assets/models/index.json` (source file, hash, part list, bounds, triangle count).

Some STEP files mesh to nothing in occt-import-js. For those set `"reader": "cascadio"` in `models.json` and run the fallback from a virtual environment outside the repo:

```sh
python -m venv <dir>; <dir>\Scripts\pip install cascadio trimesh numpy
<dir>\Scripts\python -I tools/step_cascadio.py KEY
```

Large assemblies carry parts nobody will see (a controller's whole circuit board was 80 % of its triangles). Drop them by solid name in the converter.

## Fitting: `src/model_fit.mjs`

```js
PWS1: { model: 'PRO2', rot: ['y-90', 'x90'], dy: -4, pins: { 1: [-51, 79, 115, 't'], ... } },
```

- `rot`: rotations about the world axes, applied in order, in degrees, to bring the maker's axes to panel axes (X right, Y up, Z out of the plate towards the viewer).
- The model is centred on the device's sheet rectangle with its back on the plate. `dx`, `dy` (mm on the sheet, Y down) shift it where the model's outline includes plugs or latches the sheet picture leaves out, or where the maker's instruction fixes its position relative to another part.
- `cover`: solids that come off for wiring (a drive's control cover, a module's door), by part index or by a box; `xray: true` keeps them on as glass.
- `pins`, `landings`: terminal positions in the model's own millimetres (see `landings.md`).

### Checking a fit

Picture a model from six sides, with a rotation applied, from the command line:

```sh
node "<skill>/scripts/shot.mjs" "<guide folder>" "<scratch>/PRO2.png" --size 2100x420 --page "tools/model_viewer.html?k=PRO2&s=330&v=front,right,top,bottom,back,left&rot=PRO2:y-90,x90"
```

(`rot=KEY:<rotations>` uses the same rotation names as `model_fit.mjs`, comma-separated; several models are `KEY:..;KEY2:..`.) In a browser pane, `node "<skill>/scripts/serve.mjs" "<guide folder>"` serves the same pages: `tools/fit_check.html` lays the sheet's face picture and the terminal points over a model, and `tools/part_picker.html` makes every solid hoverable, to find a cover's part numbers or a lug.

Then check it against something real:

1. **Orientation, against a photo or the maker's dimensioned drawing.** Outlines lie when two dimensions are close. Look for features that only face one way: the label, plugs and their colours, vents, the rail clip, the wire entries.
2. **Size, against the maker's document.** If the model and the layout sheet disagree, the model is usually right (check the install manual before "correcting" either).
3. **Position relative to neighbours.** Parts that mate (a fuse block under its switch, modules on a bus) are placed by the maker's instruction, not by two independent sheet rectangles.

Known traps from the example: an enclosure model drawn upside down; a power supply on its back; bus modules whose models are a few millimetres wider than their nominal width because they include the bus connector.

## Performance

The example has 1.25 million triangles of makers' models, and about 2 million drawn in the completed view with wires, ducts and built parts. On an integrated GPU what matters is:

- shadows redrawn only when something changes, not every frame
- no `transmission` materials (each forces a second full render): use plain opacity
- few draw calls: merge repeated static parts, one mesh per wire's end hardware
- coarser tessellation for big simple parts (ducts)

Measure by timing synchronous renders in one tab. Several guide tabs open at once share the GPU and make any of them look slow.
