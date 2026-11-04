# VFD 200 Assembly Guide: Completion Description

Second pass, 2026-11-04. The SCADA simulator and the live twin are dropped; this pass turns `Draft rev18.pdf` into a guide for the person building the panel.

**`VFD200 Assembly Guide.html`** (one file, about 1.6 MB) takes the builder through 21 steps in a logical shop order:

1. Enclosure.
2. Cutouts.
3. Plate layout.
4. Ducts, then rails.
5. The plate-mounted power entry.
6. Rail 1.
7. Drives.
8. T1.
9. Rail 3.
10. Rail 4.
11. Subplate 2.
12. Wiring by voltage: 480 V, 120 V, 24 V and safety, network and IO-Link, field terminals.
13. Install the subplates.
14. Door devices.
15. A/C and handle.
16. Covers and checks.

At every step a 3D panel shows what is installed so far, with the new parts outlined and tagged.

## How each goal was met

**Realistic parts.** Every device face is the manufacturer's own image or line drawing taken from sheets 2 and 3. It sits at its sheet 3 position on a body of catalogue depth, with real DIN rails, slotted duct, end anchors and the stainless enclosure, and is rendered with studio lighting.

**Labelled wiring.** All 104 numbered wires on sheets 4-15 are routed through the ducts from terminal to terminal, along with the unnumbered jumpers and grounds, 25 IO-Link cables, 9 Ethernet cords and the field cables, each with a marker at both ends. The Wires tab lists every run: marker, AWG, both ends, sheet, line, potential, an approximate cut length and the drawing note. A CSV of the marker list can be downloaded.

**References.** Each part links into Todd's PartsLib: its part record and the exact installation pages, such as 520-UM001 p.15/16/36, 1769-UM021 p.63/66, 1769-IN028 p.9/11, the WAGO Pro 2 manual p.30 and the Saginaw A/C manual pp.7-8. The key torques, clearances and wire ranges are quoted on the part card with their page. PartsLib's MCP connector was down (the gcloud login had expired), so the links were collected through the signed-in browser.

## What to raise with engineering (all listed on the Issues tab)

1. **Wire numbers.** 15 conductors have no wire number, and the numbers W18 to W105 have gaps. W20, W24, W25 and W71 have no AWG.
2. **Wrong labels and cross-references.** W93 is labelled IO1 but goes to the E-STOP lamp. "HM1" is used for HMI1. Two NS1 and W60 cross references are wrong. CPL2's port pins are mislabelled, and VM1's C/Q and L- are reversed.
3. **Sheet 15 shows TBD** for terminals that other sheets connect.
4. **Missing positions.** RCP1, GB2, the A/C and subplate 2 have no position. TB4 is drawn about 446 mm long but needs about 370 mm.
5. **BOM gaps.**
   - T1's fuses are missing.
   - Only one LPJ-70SP is listed; FU1 needs three.
   - C3WH6 covers, the floor stand, field entries and bonding straps are missing.
   - There are 7 GLG isolators for 6 tags.
   - SCE-16P14 is a subpanel for a 16 × 14 in enclosure.
   - Sheet 3 cites 1494U-IN007, which is the 200 A edition.
6. **Missing documents.** Nine are now requested in PartsLib (#10994-#11002); VTUX was already requested (#7460). The README lists them.

Wire colours, door hinges and positions not drawn are assumptions; they are stated on the page and in the README.
