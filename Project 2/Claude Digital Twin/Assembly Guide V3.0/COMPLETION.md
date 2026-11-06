# VFD 200 Assembly Guide V3.0: Completion Description

This is the fourth pass, dated 2026-11-04. It is in `Assembly Guide V3.0/`; V1.0 and V2.0 are unchanged.

## Wire landing accuracy

V2 placed terminals by eye. V3 corrects them by measuring every device face on a 2.5 % grid; the GLG isolators were rendered from the PDF at 900 dpi. Terminal order comes from the manuals: ifm AL1920 (80281466 p.5/p.9), 1769-PB2 (1769-IN028 p.5/p.11), 1769-OW16 (1769-IN062 p.8) and the PowerFlex 525 (520-UM001 p.32/36/42).

SI3 was the example in the request. Its top and bottom terminals now sit on the screws. On the other devices, these were several millimetres out in V2 and are fixed:
- PDB1, PDB2 and PDB3: load openings
- T1: X1 and X2
- Q1: lugs
- NS1: ports
- CB4: inputs
- The AL1920 pin order

In the wiring steps the drives have their covers off and the 1769 modules have their doors open, so each wire is seen landing on its screw. Every wire was checked to resolve to a terminal. There are no warnings, and all 191 runs build.

## Tools for the builder

- **Selecting a wire:**
  - Every other wire turns to glass and the selected wire turns orange, with a light running along it from end to end.
  - Double rings mark the clamps, and labels give the terminal and its position. For a cable, every core is ringed and named.
- **Trace route (T):** flies the camera along the wire from end to end.
- **Selecting a device:**
  - Its wires stay solid, and each terminal carries a tag with its marker, which turns green when that wire is done.
  - Tags that would overlap are dropped until you zoom in.
- **Selection bar:** jumps to the same item in Build steps, Wire it, Parts and Wires. Each tab shows the selection its own way:
  - Build steps: its step.
  - Wire it: that wire, or every wire on that device.
  - Parts: the device or devices, with the wire highlighted.
  - Wires: filtered to those devices.
- **Device names are links** everywhere.
- **Search box:** find a wire or device by name (W29, CB4…).
- **Esc** clears the selection.
- **Cut lengths:** each total is built up from the route length, the strip length from the documents, the service loop, the field end and the breakout. The sum is shown on every wire card.

## Realism

- **Enclosure:** built to Saginaw's own drawing:
  - door hinges and stainless 3-point handles;
  - subpanel stud pattern;
  - handle height.
- **RCP1:** a real duplex receptacle.
- **AL1920:** its real 105 mm depth.
- **Cable glands** in the enclosure floor take the field cables.
- **Terminal strips:** modelled from the real blocks.
- **Rail 3:** at the real device widths.

## Issues

**Modeling: 10 of 11 resolved.**
- **Resolved:** wire colours (now NFPA 79), door hinges (from the Saginaw drawing), the A/C, subplate 2 and RCP1 positions, cut lengths, field stubs, hidden terminals, missing documents, terminal strips and rail 3 overlap.
- **Open:** the GLG isolator's terminal numbering (no manufacturer document exists) and the 787-1668's depth (waiting on PartsLib request #10994).

**Design: 3 new issues.**
- **Subplate size:** subplate 1 is too small for the enclosure's stud pattern.
- **Rail 3 spacing:** it is drawn about 4 mm short for the real device widths.
- **Isolator numbering:** the drawings show no terminal numbering for the isolators.

The V2 "door hinge" issue is withdrawn, because Saginaw's drawing confirms sheet 2. The "VM1 port reversed" issue is now confirmed against the ifm manual.

## Not verified

- **Speed on a real GPU:** headless tests run at 48-55 fps with 772k triangles.
- **GLG terminal numbering:** check it against an isolator label before wiring SI1-SI6.
