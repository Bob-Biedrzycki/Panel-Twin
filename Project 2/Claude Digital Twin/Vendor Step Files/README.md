# VFD 200 vendor STEP files

Maker 3D models for every in-panel part of **VFD 200** (CPME 1082-01, `../../Draft rev18.pdf`, BOM sheets 16–18). They are the reference for dimensions and wire landings in the assembly guide. Collected 2026-11-05.

## What lives here

- **`component-register.csv`** is the one authoritative list: one row per part. Each row gives:
  - the part: tags, quantity, make, model, variant;
  - the model: status, source, source page link;
  - the local files: STEP path and sha256, drawings, the files as downloaded, and the date.

  It opens in Excel.
- **One folder per part**, `COMP-nnnn_<Maker>_<Model>/`:

  | Subfolder | Holds |
  |---|---|
  | `01_STEP_Vendor/` | The maker's file exactly as downloaded (zip or STEP), plus the STEP extracted from it under the maker's own name |
  | `02_Drawings/` | The maker's 2D drawings (PDF, DWG, DXF) and spec sheets, where offered |

- **`_tools/`**:
  - `components.json` holds the part data;
  - `fetch.py` downloads or files a download and logs it;
  - `fetch-log.csv` records every file's URL, date and sha256;
  - `build_register.py` rebuilds the register: `python -I _tools/build_register.py`.

## Model status values

| Status | Meaning |
|---|---|
| maker STEP | The manufacturer's own model: from the maker's site, or from the maker's catalog on 3Dfindit (CADENAS) |
| equivalent STEP (McMaster) | McMaster-Carr's model of a part that McMaster lists as equivalent (standard fuse bodies, standard TS35 rail). Replace it when the maker's model turns up |
| 2D drawing only | The maker offers only a dimensioned drawing; no 3D exists in the five sources |
| OPEN | No model yet; the register's notes say what is blocking it |

**Sources searched:**
- Every part: the maker's site.
- Parts the maker's site didn't cover: 3Dfindit, TraceParts and McMaster-Carr.
- BIMobject was not searched. It carries building products, not panel components.

**Self-drawn models:** none were made. Drawing our own is the last resort, and only once every source has nothing.

## Field devices

The BOM's field devices are not in this folder: sensors, cables, motors, converters and the Festo filter regulators. They are not mounted in the panel.
