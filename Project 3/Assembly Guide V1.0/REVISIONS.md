# Revisions

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
