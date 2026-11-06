"""save.py - the Panel Twin save tool (the one the global git rules name for this repo).

One command does a save:
  1. Puts the checkout on today's branch daily/<YYYY-MM-DD>. If it is on an earlier daily branch, today's branch is
     started from the current commit (no files change). It refuses on main and on any other branch.
  2. Writes Drive pointers for large files and pushes them to the Google Drive store (tools/drive_store.py).
     If the Drive push fails, nothing is committed.
  3. Stages the listed paths by name. A listed folder is expanded to its changed, new and deleted files, one by one.
     Large files are gitignored, so their .drive pointers are staged instead. .gitignore is staged when its Drive
     block changed.
  4. Commits with the message and pushes the day's branch to origin.

Usage (from anywhere):
  python -I tools/save.py --message "What changed and why" PATH [PATH ...]
  python -I tools/save.py --message-file msg.txt --paths-file paths.txt
The pull request and the merge to main are Bob's (global rules).
"""
from __future__ import annotations

import argparse
import datetime as dt
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PY = sys.executable


def git(*args, check=True, capture=True) -> str:
    r = subprocess.run(["git", *args], cwd=REPO, capture_output=capture, text=True, encoding="utf-8", errors="replace")
    if check and r.returncode != 0:
        sys.exit(f"REFUSED: git {' '.join(args[:3])} failed:\n{(r.stderr or '').strip()}")
    return (r.stdout or "").strip()


def ensure_branch() -> str:
    today = f"daily/{dt.date.today().isoformat()}"
    head = git("rev-parse", "--abbrev-ref", "HEAD")
    if head == today:
        return today
    if not head.startswith("daily/"):
        sys.exit(f"REFUSED: the checkout is on '{head}'. Saves go on daily branches only; tell Bob.")
    if git("branch", "--list", today):
        sys.exit(f"REFUSED: {today} exists but the checkout is on {head}; tell Bob rather than switching.")
    git("switch", "-c", today)  # starts today's branch at the current commit; no working-tree change
    print(f"started {today} from {head}")
    return today


def expand(paths: list[str]) -> list[str]:
    files: list[str] = []
    for p in paths:
        rel = Path(p).resolve().relative_to(REPO).as_posix() if Path(p).is_absolute() else p.replace("\\", "/")
        full = REPO / rel
        if full.is_dir():
            out = git("ls-files", "-z", "--others", "--modified", "--deleted", "--exclude-standard", "--", rel)
            files += [f for f in out.split("\0") if f]
        elif full.exists() or git("ls-files", "--", rel):
            ignored = subprocess.run(["git", "check-ignore", "-q", "--", rel], cwd=REPO).returncode == 0
            if ignored and (REPO / (rel + ".drive")).exists():
                files.append(rel + ".drive")
            elif not ignored:
                files.append(rel)
        else:
            sys.exit(f"REFUSED: {rel} does not exist and is not tracked")
    return sorted(set(files))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--paths-file")
    ap.add_argument("--message")
    ap.add_argument("--message-file")
    ap.add_argument("--no-push", action="store_true", help="commit only; do not push to GitHub")
    a = ap.parse_args()
    paths = list(a.paths)
    if a.paths_file:
        paths += [l.strip() for l in Path(a.paths_file).read_text(encoding="utf-8-sig").splitlines() if l.strip()]
    msg = a.message or (Path(a.message_file).read_text(encoding="utf-8-sig") if a.message_file else "")
    if not paths or not msg.strip():
        sys.exit("REFUSED: give the paths to save and a message saying what changed and why")

    branch = ensure_branch()
    for step in (["pointers"], ["push"]):
        r = subprocess.run([PY, "-I", str(REPO / "tools" / "drive_store.py"), *step], cwd=REPO)
        if r.returncode != 0:
            sys.exit(f"REFUSED: drive_store.py {step[0]} failed; nothing committed. Tell Bob.")

    files = expand(paths)
    if git("status", "--porcelain", "--", ".gitignore"):
        files.append(".gitignore")
    if not files:
        print("nothing to save in the listed paths")
        return
    for i in range(0, len(files), 100):
        git("add", "--", *files[i:i + 100])
    git("commit", "-m", msg.strip(), capture=False)
    if not a.no_push:
        git("push", "-u", "origin", branch, capture=False)
    print(f"saved {len(files)} file(s) on {branch}")
    print(git("status", "--short") or "working tree clean")


if __name__ == "__main__":
    main()
