"""Download maker CAD files into the component folders, unchanged, and record sha256.

Usage: python -I _tools/fetch.py <COMP folder name> <subfolder> <url> [<url> ...]
Writes each file to <COMP>/<subfolder>/<name from url>, then appends a line to _tools/fetch-log.csv
(date, folder, file, url, bytes, sha256). Zips are listed (not extracted) so the log shows what they hold.
"""
import csv, datetime, hashlib, pathlib, sys, urllib.parse, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG = ROOT / "_tools" / "fetch-log.csv"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"


def fetch(comp, sub, url):
    name = urllib.parse.unquote(url.rstrip("/").split("/")[-1].split("?")[0])
    dest_dir = ROOT / comp / sub
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / name
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    dest.write_bytes(data)
    sha = hashlib.sha256(data).hexdigest()
    inner = ""
    if name.lower().endswith(".zip"):
        try:
            with zipfile.ZipFile(dest) as z:
                inner = "; ".join(f"{i.filename} ({i.file_size})" for i in z.infolist())
        except zipfile.BadZipFile:
            inner = "NOT A ZIP"
    new = not LOG.exists()
    with LOG.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "folder", "file", "url", "bytes", "sha256", "zip_contents"])
        w.writerow([datetime.date.today().isoformat(), f"{comp}/{sub}", name, url, len(data), sha, inner])
    print(f"{comp}/{sub}/{name}  {len(data)} B  {sha[:12]}  {inner}")


def adopt(comp, sub, path, source):
    """Move a file downloaded in Chrome into <comp>/<sub>/ unchanged and log it with its source page."""
    import shutil
    src = pathlib.Path(path)
    dest_dir = ROOT / comp / sub
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / src.name
    shutil.move(str(src), dest)
    data = dest.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    inner = ""
    if dest.suffix.lower() == ".zip":
        with zipfile.ZipFile(dest) as z:
            inner = "; ".join(f"{i.filename} ({i.file_size})" for i in z.infolist() if not i.is_dir())
    new = not LOG.exists()
    with LOG.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "folder", "file", "url", "bytes", "sha256", "zip_contents"])
        w.writerow([datetime.date.today().isoformat(), f"{comp}/{sub}", dest.name, source, len(data), sha, inner])
    print(f"{comp}/{sub}/{dest.name}  {len(data)} B  {sha[:12]}  {inner[:300]}")


if __name__ == "__main__":
    if sys.argv[1] == "--adopt":
        adopt(*sys.argv[2:6])
        sys.exit()
    comp, sub, *urls = sys.argv[1:]
    for u in urls:
        try:
            fetch(comp, sub, u)
        except Exception as e:  # report and keep going
            print(f"FAILED {u}: {e}")
