# Panel Twin

One repo for everything in `Documents\Panel Twin`, set up 2026-11-05 (Bob, chat, "go ahead and set it up"):
- `Project 1/`: the VP1 panel twin and SCADA simulator.
- `Project 2/`: the VFD 200 work for CPME 1082-01:
  - the drawing set;
  - Claude's assembly guides V1-V3;
  - the Codex twin;
  - `Vendor Step Files/`.

GitHub: https://github.com/Bob-Biedrzycki/Panel-Twin. Commits made before 2026-11-05 were made in `Project 2/` as a local repo, so their paths have no `Project 2/` prefix.

## How this repo saves

This file only says *how* to save. The rules themselves are Bob's global git rules: the day's branch, staging by name, a save after each piece of work, Bob merges to main.

- **Save:** `python -I tools/save.py --message "<what changed and why>" <path> [<path> ...]`. It does four things in order:
  - starts or uses `daily/<today>`;
  - writes the Drive pointers;
  - pushes large files to Google Drive;
  - stages the listed paths by name, commits, and pushes the branch.
- **Large files:** they go to the Google Drive store named in `drive-store.json` (My Drive > Panel Twin):
  - every file of 5 MiB or more;
  - every STEP, zip, PDF, DWG, DXF and IGES file under `*/*/Vendor Step Files/`.

  Git keeps a `<file>.drive` pointer for each one; the file itself is gitignored. To use the store directly, run `python -I tools/drive_store.py` with `scan`, `pull` or `verify`.
- **Transport:** rclone, through the machine's `cpme-drive` sign-in. If `save.py` reports that the Drive or GitHub sign-in is missing, stop and tell Bob.
