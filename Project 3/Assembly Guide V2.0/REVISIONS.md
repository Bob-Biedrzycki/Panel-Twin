# Revisions

## V2.0 (2026-11-10): makers' models (Bob: "Yes, fetch them")

- [x] Downloaded from Rockwell: 25B-D013N104 (frame C), 1494U-D60, 1494U-F60, 1494U-FC60J, 140MT-D9E, 140MT-C-TE, 1606-XLE240E-3, 1489-M one pole; from Panduit: G2X3WH6 [files, sources and hashes in `../Vendor Step Files/register.csv`]
- [x] Converted nine models (`tools/step_to_mesh.mjs`) [sizes printed by the converter match the makers' dimensions: drive 110 x 185 x 220, supply 62 wide, breaker 45 wide]
- [x] Each new model looked at from six sides before fitting [the supply's label face and the 1489-M's clip end set their rotation; the supply's terminal positions agree with 1606-RM002 and the Z04 symbol to within 1 mm]
- [x] Terminals measured on the models (`tools/model_parts.mjs`): switch line lugs, fuse block load lugs, breaker screws, supply terminal blocks, 1489-M clamps
- [x] Drive control block moved to where the control module sits on frame C (10.5 mm right, 40 mm lower than on frame D, measured on the two models)
- [x] Fuse block placed by 1494U-IN001 p.10 (DIM Z 1.976 in for 60 A, 600 V class J), about 70 mm higher than sheet Z02 draws it [page read as an image; new design issue]
- [x] B01421 moved to TB120-1 terminal 4, supply on the lower screw and CBC0102 on the upper [the V1 choice ran the breaker wire a metre round]
- [x] Audit PASS, no tight bends (V1.0: three) [audit_headless.mjs, no --max-kinks]
- [x] Compared with V1.0 wire by wire: 39 identical, 65 changed, 0 new, 0 gone [diff_routes.mjs; the 65 are the wires on the devices that changed model, and the three main conductors]
- [x] Looked at every device that changed: disconnect and fuses, rail A breakers (front and above), drives (front and below), supply (front, above, below), 1489-M breakers [10 pictures]
- [ ] Not found: models for LPSC002ID / LPSC003ID, 700-HLT1L1, 1492-JG4, CADIN1IG and CJ688TGIW, LPJ-60SP, SCE-60XEL4912SSST
- [ ] Not fitted: 140MT-C-TE spacing adapters, 1494U-FC60J clips (downloaded and converted)
- [ ] Frame C power terminal block measured; relay, fuse holder and jack terminals from makers' documents
- [ ] Check against the built panel or shop photos
## V1.0 (2026-11-10): first version, from `10006 VFD-RT00-03.pdf`, initial release 06/24/26

Ticked only where the item was done and then checked; how is in brackets.

- [x] Drawing set read: text layer present on all 16 pages; every schematic and layout sheet read as images (tiles at 300 dpi, clips to 600 dpi)
- [x] Wire list transcribed as printed (`tools/make_wirelist.mjs`) [two independent readers: no differences in the entries; three notes corrected, six stubs added]
- [x] Layout measured off sheet Z02 [gridded crops; drive, rail and duct sizes agree with makers' sizes to about 1 mm]
- [x] BOM from the five bills of material on Z01-Z05 [read from the PDF text layer and the sheet images]
- [x] Device faces cut from Z02 for 14 devices [seen on the parts in the pictures]
- [x] Terminal layouts for this panel's parts; model fits; catalogue shapes for 10 device types [pictures of each]
- [x] Engine adapted (see COMPLETION.md) [builds, loads, audit runs]
- [x] Readings applied in `build.mjs`, each with its reason: tags, terminal plan, 1AWG as 14 AWG, transformer links [wire card pictured for B02061 and B01451]
- [x] Audit PASS with three named bends [audit_headless.mjs --max-kinks 3]
- [x] Every device group looked at from the front and the wire-entry side [34 pictures]
- [x] 23 design issues and 11 modeling issues written [Issues panel pictured]
- [x] START HERE, README, COMPLETION written
- [ ] Makers' models for this panel's parts
- [ ] Terminal positions from makers' documents for the fuse holders, 1489-M, 700-HLT1L1
- [ ] Check against the built panel or shop photos
