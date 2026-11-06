"""Build component-register.csv from _tools/components.json, the component folders and _tools/fetch-log.csv.

- Extracts STEP files from the downloaded archives into 01_STEP_Vendor/ (archives are kept unchanged).
- Extracts 2D drawings (pdf, dwg, dxf) found in STEP archives into 02_Drawings/.
- Records every STEP's path and sha256 so the register is the source of truth for the assembly guide.
Run: python -I _tools/build_register.py   (from the Vendor Step Files folder or anywhere)
"""
import csv, hashlib, json, pathlib, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
STEP_EXT = {".stp", ".step"}
DRAW_EXT = {".pdf", ".dwg", ".dxf"}


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def extract(folder):
    stepdir, drawdir = folder / "01_STEP_Vendor", folder / "02_Drawings"
    for z in list(stepdir.glob("*.zip")) + list(stepdir.glob("*.ZIP")):
        with zipfile.ZipFile(z) as zf:
            for info in zf.infolist():
                name = pathlib.PurePosixPath(info.filename).name
                ext = pathlib.Path(name).suffix.lower()
                if info.is_dir() or not name:
                    continue
                target = stepdir / name if ext in STEP_EXT else drawdir / name if ext in DRAW_EXT else None
                if target and not target.exists():
                    target.parent.mkdir(exist_ok=True)
                    target.write_bytes(zf.read(info))
    for z in list(drawdir.glob("*.zip")) + list(drawdir.glob("*.ZIP")) if drawdir.exists() else []:
        with zipfile.ZipFile(z) as zf:
            for info in zf.infolist():
                name = pathlib.PurePosixPath(info.filename).name
                if name and pathlib.Path(name).suffix.lower() in DRAW_EXT and not (drawdir / name).exists():
                    (drawdir / name).write_bytes(zf.read(info))


def rel(p):
    return p.relative_to(ROOT).as_posix()


def main():
    comps = json.loads((ROOT / "_tools" / "components.json").read_text(encoding="utf-8"))["components"]
    log = list(csv.DictReader(open(ROOT / "_tools" / "fetch-log.csv", encoding="utf-8")))
    rows = []
    for c in comps:
        folder = ROOT / c["folder"] if c["folder"] else None
        steps, draws, originals, dates = [], [], [], set()
        if folder and folder.exists():
            extract(folder)
            sd, dd = folder / "01_STEP_Vendor", folder / "02_Drawings"
            steps = sorted(p for p in sd.iterdir() if p.suffix.lower() in STEP_EXT) if sd.exists() else []
            draws = sorted(p for p in dd.iterdir() if p.suffix.lower() in DRAW_EXT) if dd.exists() else []
            for r in log:
                if r["folder"].split("/")[0] == c["folder"]:
                    originals.append(f'{r["folder"]}/{r["file"]}')
                    dates.add(r["date"])
        rows.append({
            "component_id": c["id"],
            "tags": c["tags"],
            "qty": c["qty"],
            "category": c["category"],
            "description": c["description"],
            "make": c["manufacturer"],
            "model": c["model"],
            "variant": c["variant"],
            "model_status": c["status"],
            "model_source": c["source"],
            "source_link": c["link"],
            "step_file": " | ".join(rel(p) for p in steps),
            "step_sha256": " | ".join(sha(p) for p in steps),
            "drawings": " | ".join(rel(p) for p in draws),
            "downloaded_files": " | ".join(originals),
            "local_folder": rel(folder) if folder and folder.exists() else "",
            "obtained_on": " | ".join(sorted(dates)),
            "notes": c["notes"],
        })
    out = ROOT / "component-register.csv"
    with open(out, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    have = sum(1 for r in rows if r["step_file"])
    print(f"{out.name}: {len(rows)} components, {have} with a STEP, {len(rows) - have} without")
    for r in rows:
        print(f'{r["component_id"]}  {r["model_status"]:<40} {r["model"][:30]:<30} {r["step_file"].split("/")[-1][:50]}')


if __name__ == "__main__":
    main()
