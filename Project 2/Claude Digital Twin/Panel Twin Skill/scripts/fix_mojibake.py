"""Repair text that was saved through the wrong encoding (arrows, multiplication signs and ticks showing as "Ã¢â€ â€™").

    python -I scripts/fix_mojibake.py <file> [<file> ...]

This happens when a source file is rewritten by Windows PowerShell 5.1 (Get-Content | Set-Content / Out-File): UTF-8
is read as cp1252 and written back as UTF-8, once or twice over. The guide then shows garbage in its hint line, cable
sizes and done marks. This undoes it: every run of non-ASCII characters that decodes cleanly back to UTF-8 is replaced,
and text that is already right is left alone. It prints each repair. Prevention: never rewrite source files with
PowerShell; use an editor or the Edit tool.
"""
import re
import sys


def tobytes(run):
    out = bytearray()
    for ch in run:
        try:
            out += ch.encode('cp1252')
        except UnicodeEncodeError:
            if ord(ch) < 256:
                out.append(ord(ch))
            else:
                return None
    return bytes(out)


def fix(m):
    run = cur = m.group(0)
    for _ in range(3):
        b = tobytes(cur)
        if b is None:
            break
        try:
            nxt = b.decode('utf-8')
        except UnicodeDecodeError:
            break
        if nxt == cur:
            break
        cur = nxt
    if cur != run:
        print('  ', ascii(run), '->', ascii(cur))
    return cur


for path in sys.argv[1:]:
    s = open(path, encoding='utf-8').read()
    print(path)
    t = re.sub(r'[^\x00-\x7f]+', fix, s)
    if t != s:
        open(path, 'w', encoding='utf-8', newline='').write(t)
    else:
        print('   nothing to repair')
