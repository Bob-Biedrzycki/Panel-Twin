# ABARTA VFD 200 - drawing-based twin

Open **vfd200-digital-twin.html** in a modern browser with internet access (Three.js and fonts load from CDNs).

Drag to orbit; scroll to zoom. Use the controls to open/close doors, change frequency, inspect cutaway/exploded/x-ray views, and simulate E-stop, supply isolation or network loss. After restoring a condition, use Reset / arm to restart. This restart policy is illustrative.

The 28-second **vfd200-digital-twin.mp4** gives a walkthrough. **DESIGN-REVIEW.md** contains the page-referenced findings, equations, assumptions and missing commissioning inputs. **verification.json** contains the simulation test results and local rendering performance. **source-manifest.json** identifies and hashes the unchanged source PDF.

This is an offline panel review demonstrator with approximate geometry and assumed motor-load dynamics. It has no live plant connection, imported PLC code, validated CIP sequence or certified safety model. Live responsiveness was below 30 fps in the local headless test; use the video for a consistently timed walkthrough.

Re-record on this host from this folder:

    node scripts/record.mjs vfd200-digital-twin.html vfd200-digital-twin.mp4 --w 1280 --h 720 --fps 24 --ss 1

Scripts use the locally bundled Playwright installation. On another computer, install Playwright and point scripts/lib/browser.mjs to that installation. FFmpeg is required for recording. The HTML itself does not require Node or Python.
