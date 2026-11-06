# VFD 200 Assembly Guide V4.0: Completion Description

This is the fifth pass, dated 2026-11-05. It is in `Assembly Guide V4.0/`; V1.0 to V3.0 are unchanged.

## What was asked

- **Realism:** a more realistic and accurate V4 built from the vendor STEP files in `Vendor Step Files/`.
- **Completed panel:** a button that shows the finished panel with the front and the duct covers off.
- **Wiring:** accurate wire landing, with RCP1 and the other remaining wiring issues resolved.
- **Other parts:** substantially better models for the parts with no vendor STEP.

## What was done

**Vendor STEP models.** 32 of the register's STEP files were converted (OpenCascade via `occt-import-js`). They are used for 30 panel parts plus the rail, ducts and enclosure hardware.
- **Turning each model into panel axes:**
  - Each model was turned by viewing it from all sides (`tools/model_viewer.html`).
  - Each was then checked against the sheet 3 face with the terminal points drawn on (`tools/fit_check.html`).
  - Saginaw's enclosure model is drawn upside down. Turned over, its handles are on the right, matching Saginaw's sales drawing.
  - The 1492-J4/J6 blocks and the end anchors were checked in profile so the rail slot faces the subplate.
- **Placement:**
  - Each device sits at its real size on its sheet 3 position, back on the subplate.
  - The PTFIX blocks sit on their NS35A adapters.
  - Rail and duct runs are cut from the makers' straight lengths.
  - The enclosure doors swing on their own hinge edges, and the door hardware moves with its door.

**Completed panel button.** It shows all 189 wires and every part. The doors and centre post are off, the duct covers are off, and the drive covers and 1769 doors are open. An explanation shows in the side panel. It is toggled by the button or C; any step leaves it.

**Wire landing.**
- **Clamp depth:** each clamp sits on the real surface of its terminal, found by a ray onto the model.
- **Audit of all 464 wire ends:**
  - 393 are on a model surface;
  - 27 are on the exposed drive and 1769 blocks;
  - 42 are on TB3's documented screws;
  - 2 are in PWS1's plug openings.
- **Close-up check:** every wired device was rendered close up with its landing points marked and checked, in 28 views covering power entry, rail 1, the drives, rail 3, rail 4, T1 and the strips.

**RCP1.** The 1492-REC15 has a single L/N/G terminal block feeding both outlets (Rockwell model; 1492-TD015 p.51).
- **Landings:** hot, neutral and ground now land on it.
- **Jumpers:** sheet 6's two jumpers are marked not fitted in the 3D view, the wire list, the terminal table and the run sheet.
- **Position:** it is placed at its real 74 x 124 mm between TB5 and CB5, the only gap on rail 4 that fits.
- **Design issues:** both points are new entries.

**Other issues found and fixed in this pass:**
- **IO1:** Rockwell's OW16-page model is a 56.5 mm case. It was narrowed to 35 mm so it no longer overlaps PLC1 and the end cap.
- **787-1668 depth:** now set by WAGO's model, which closes the V3 open item.

**Parts without a STEP:** rebuilt to their catalogue shape. This covers:
- CB1/CB2, FU2, PDB1 and T1;
- SI1-SI6 and NS2;
- GB1 and PLC1.

**Docs:**
- **Issues tab:** design and modelling issues are updated, with V4 items marked.
- **Parts tab:** each card shows where its 3D shape comes from.

## Not verified

- **Speed on a shop laptop:**
  - This machine renders a frame in about 28 ms (about 35 fps), with 1.1 million vendor triangles.
  - V3 was 48-55 fps.
  - A slower GPU will be slower. Turning the panel stays usable, but this has not been tried on the shop's machines.
- **RCP1 L/N/G order:** not printed in any document held. Check the device label.
- **GLG terminal numbering:** check it against an isolator label before wiring SI1-SI6.
- **PLC1:** built from its catalogue shape, because Rockwell's STEP would not mesh.
