# V8 revisions (2026-11-09): oddities found by the audit

Bob asked for the remaining oddities to be fixed, accuracy of components and wire landings first, the screen second. Each item was found by `tools/audit.js` or by eye in Chrome, fixed, then checked by the audit again and by eye.

| Audit count | V7 | V8 |
|---|---|---|
| Wires passing through a solid | 4 | 0 |
| Clamps with conductors drawn on one line | 7 | 0 |
| Bends tighter than the wire | 70 | 24 |
| Points behind the subplate | 0 | 0 |

- [x] **W1-W6 direct.** Q1 load lugs to FU1 line lugs and FU1 load lugs to PDB1 line lugs run straight across. Checked in Chrome (W1).
- [x] **Off-plate ends.** Field, door, A/C and VM1 ends no longer double back at the duct. Audit: kinks 70 to 24.
- [x] **Shared clamps.** TB2-1 (W54, W62, jumper), TB2-2, TB2-3, TB2-4 and T1 X1 (W19, W20): conductors side by side. Audit: 0 shared.
- [x] **CBL-IOL-09.** Cores on CPL2 X01-1, X01-3, X01-4. V7 followed sheet 11's X03-1 and X04-1, shared with CBL-IOL-11 and -12, and one core ran 88 mm through CPL2. Design issue rewritten.
- [x] **IO1 exit.** Rays down Rockwell's model show the housing open from 12.8 to 36.8 mm across (the wire channel) and floored right of that. Wires run down in front of the screws in nine places per column, then into the channel. Checked in Chrome from the front and from below.
- [x] **PWS2 entry.** From below, as in photos PXL_20261105_180059974 (door closed) and _180108693 (door open).
- [x] **PDB2/PDB3 feed.** The wire clears the front of the block before it turns in. Audit: W73 and W80 no longer inside the block.
- [x] **Garbled characters.** `build.mjs` held double-encoded text for five symbols. Repaired; checked on the hint, the cable sizes and the done ticks.
- [x] **Screen.** Completed panel fitted to the window; Look from buttons; Wire colours key with show-only; Help card; hide the side panel. Each one used in Chrome at 1500 x 950; all 21 steps and five tabs open with no console messages.

Not done: the 24 remaining tight bends, the rail 3 module joints and a re-measure of the terminals the audit passes (README, Still open). The narrow-window layout was written but not checked on a phone-sized window.

# V7 revisions from Bob's review of V6 (2026-11-05)

- [x] **IO1 wires from the bottom.** Every OW16 wire now comes in from below and runs up the face of its column to the clamp under the pressure plate. Checked in Chrome.
- [x] **Drive front covers back on, x-rayed.** In the wiring steps and the Completed panel, the control cover, terminal guard and white lower cover stay on as glass, and the landings show through. Clicks go through the glass to the wires. The covers are still solid at the mounting step. Checked in Chrome.
- [x] **FU1 load lugs.** The wires went up behind the lugs. The openings, measured on Rockwell's model, are the underside at y -41.3 mm with the through-hole at z 43.7 mm; the V6 probe searched only to z 40.8. Each conductor now goes into its own lug. Checked in Chrome from the angle in Bob's image. Q1's load lugs were checked the same way: each wire goes into a walled opening in the lug's underside, so Q1 is unchanged.
- [x] **SI terminal blocks.** The 9-12 wires ran down through the 13-16 plug. The tiers are now stepped as on the real housing (inner plug front at 97 % of the depth, outer at 75 %), so the 1-4 and 9-12 wires leave in front of the outer plugs. The face rows are moved to the plug centres. Checked in Chrome from below.
- [x] **Audit.** 540 conductor ends: every tip is inside its own device, no exit run crosses another device, and no console errors in any step.

# V6 revisions from the shop photos (2026-11-05)

Source: Bob's seven photos of the build in progress, Drive folder "Partially Assembled Shop Photos" (PXL_20261105_180005897 to _180108693).

Each item is ticked only after it has been changed and then checked twice: once in the code or audit, and once by eye in Chrome against the photo.

## Terminal revisions

- [x] **1. Rail 3 order.** The shop mounted PLC1 (1769-L30ER) leftmost, then PWS2 (1769-PB2), then IO1. The subplate tags read PLC1, PWS2, IO1. Rockwell also requires the CompactLogix 5370 controller to be the leftmost module. Sheet 3 draws PWS2 first; V5 followed it, and its models overlapped by about 4 mm.
- [x] **2. PWS2 terminals.** The five-screw column sits at the right of the module, upper middle, with the fuse window to its left. V5 had it about 8 mm too low. From the top: not used, not used, +24 V DC, DC neutral, chassis ground; the blue wire lands on the third screw.
- [x] **3. IO1 terminal block.** The 18-screw block sits in the right part of the module, beside an open wire channel; V5 centred it. The two columns are the OUT 0/2/4/6/VAC-VDC 2/8-14 column (left, half a pitch lower) and the VAC-VDC 1/OUT 1-15 column (right).
- [x] **4. PLC1 Ethernet jacks.** Both open downwards under "1 (Front) 2 (Rear)", at the right of the front face; V5 had them left of centre.
- [x] **5. Drive power blocks.** The top row is unchanged: R/L1 S/L2 T/L3 U/T1 V/T2 W/T3. The lower row runs PE, DC-, DC+, BR and PE, under T/L3 to past W/T3, and the shop lands the green ground on the right-hand PE. V5 had one PE and the lower row under the left half.
- [x] **6. NS1 port numbers.** The ports printed on the switch are 1-8 down the left column and 9-16 down the right (rows 1/9 to 8/16). V5 numbered odd ports left and even ports right.
- [x] **7. NS1 supply.** A three-way push-in plug (US, GND, earth) sits at the bottom of the front, levers above and three round wire openings on its lower sloping front. The wires go up into those openings, which the probe found in Phoenix's model. V5 had them entering underneath the housing, off the plug.
- [x] **8. SI1-SI6 top terminals.** The labels read 5 6 7 8 above 1 2 3 4, so 5-8 is the outer top row and 1-4 the inner. V5 had them the other way round. The bottom rows (9-12 inner, 13-16 outer) were right.
- [x] **9. T1 terminals.** The primary terminal board is on the left of the front and the two-pole primary fuse block in the middle. The line wires (1L1, 3L2) land on its lower terminals with red rings and leave downwards. The secondary board and the one-pole secondary fuse block are on the right.
- [x] **10. PDB1 taps.** The load taps sit on each pole's connector between tall barrier fins, with the wires entering from below.

## Catalogue-shape (homemade) model detail

- [x] **11. SI1-SI6 (GLG isolators).** Green housing, two plug tiers at each end with the screws on the front and the wire entries in the end, an orange number label at the top and a blue one at the bottom, and the white tag. The face is drawn from the photo to the model's own bands (tools/make_faces.py), so each screw on it sits on its plug.
- [x] **12. T1.** Black foot plate wider than the transformer, the coil and core, and on the front the primary board, fuse blocks and secondary board as in the photo.
- [x] **13. PDB1.** Open block with four tall black barrier fins and a tin connector per pole; V5 had a smoked cover.
- [x] **14. CB1/CB2 (140MT).** Light grey body and blue rotary handle, as fitted; V5 had a dark grey body and a black handle.
- [x] **15. Faces from the photos.** PLC1 now reads L30ER (V5 showed sheet 3's L36ERM), and PWS2 and IO1 (LED panel and door; V5 had no IO1 face) are rectified from the straight-on photo. Each door carries its part of the image, and the recess behind it stays plain. NS2 (NAT-102) was compared and needed no change.
- [x] **16. Drives.** Black, as fitted, with the printed R/L1 to W/T3 legend over the power block and the fan on the underside. The sheet 3 image of the white lower cover shows only while covers are on.


All 16 were done and checked on 2026-11-05. The checks were the wire-end audit (540 ends: every tip inside its own device, no exit run through another device) and close-ups in Chrome against the photos. NS2 needed no change: its sheet 3 face already matches the NAT-102 in the photo.
