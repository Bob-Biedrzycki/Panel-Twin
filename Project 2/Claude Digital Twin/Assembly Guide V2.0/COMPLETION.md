# VFD 200 Assembly Guide V2.0: Completion Description

Third pass, 2026-11-04. It is built in `Assembly Guide V2.0/`; V1.0 is unchanged beside it.

## The two required fixes

- **Remove the front:** a *Remove front* button (or F) takes off both doors and the whole front frame: the frame, centre post, handle flange, drip edge and gasket. The inside is then in clear view at any step.
- **Selection bug:** the camera used to start each flight from its last saved view, not from where you had orbited to, and the orbit control kept its leftover drag momentum, so the model turned and the selection ended up off screen. Now every flight starts from the real camera position with that momentum stopped. Selecting a part or a wire pans and zooms to it at your current angle. To test it, I rotated the view by hand, then selected CB1 and then W29. Both landed centred, with the angle unchanged.

## Wiring accuracy

- **Real terminals:** every conductor lands on its real terminal. Positions are read off the device faces on sheet 3 and the manual figures in PartsLib, using PartsLib's pin names.
- **Real wire ends:** wires enter each clamp from the side it opens to, with a ferrule or a bare end as the device's document says.
- **Cables broken out:** each multi-core cable has its own jacket, a stripped breakout and coloured cores. The 25 IO-Link cables run TB4 n/n+1/n+2 to the AL1920 pins 1, 3 and 4; the field cables land on the TB3/TB4 field sides.
- **TB4 correction:** PartsLib gives a 1492-J4 as 6.1 mm wide, not 5.1. TB2, TB4 and TB5 are rebuilt at that pitch. TB4 is now the 439 mm that sheet 3 draws, and V1's "TB4 drawn too long" issue was mine and is withdrawn.
- **Routing:** AC power and 24 V/signal are kept apart wherever the ducts allow. The ducts where they still share are reported (520-UM001 p.37).
- **Fixed in this pass:** the 480 V feed to PWS1 (W35-W37) had been grouped and coloured as 24 V.

## Realism

- **Real depths** from the PartsLib records: DRV 212 mm with heatsink fins and the control module, T1 178 mm, PDB1 99.6 mm, Q1 92 mm, FU1 76 mm, PWS1 137.5 mm, the HMI bezel 297 × 252 mm, and the A/C at its catalogue size.
- **Terminal hardware** on every device: screw heads, push-in releases, RJ45 jacks and anchor screws.
- **Smaller details:** DIN shoulders and vent slots, VM1's tube fittings, E-STOP contact blocks, HMI clips and the door gasket.
- **Device faces** are also bump maps, and every device has an engraved tag plate.

## Tools for the builder

- **Wire-by-wire mode:**
  - It works through each wiring step in bench order.
  - For every wire it gives the marker, size, colour and cut length, and both ends: terminal, where it is on the device, end type, cited torque and strip length. It also gives the duct route.
  - The 3D view ghosts all other wires and rings both clamps.
  - "Done" ticks are saved.
- **Terminal tables:** each device has a table of what lands on every terminal.
- **Wires tab:**
  - A CSV marker list, with positions, ends and routes.
  - A printable run sheet grouped by step, with tick boxes.
  - A cut list, by size and colour, with +10 % and a ferrule count.
- **Duct names:** D1-D9 are labelled on the ducts.

## Issues tab

- **Design issues (23)**, for the engineer, now include where power and control are forced to share ducts.
- **Modeling issues (12):** 7 resolved, 5 open. The open ones are the assumed wire colours, the A/C, subplate 2, RCP1 and the door hinges, the approximate cut lengths, the 10 documents requested in PartsLib, and field-side stubs.

## Not verified

- I checked everything with screenshots from a headless browser. That renders at about 21-24 fps with 596k triangles, so check the speed on a real PC.
- Terminal positions marked "approx" in the guide are the drive control block, the PB2 and OW16 blocks, and the AL1920 pin order inside a plug. Confirm each against the hardware.
