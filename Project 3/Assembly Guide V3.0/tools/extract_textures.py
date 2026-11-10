"""Device faces for the VFD-RT00-03 guide, cut from layout sheet Z02 (PDF page 13).

usage: python -I extract_textures.py "<10006 VFD-RT00-03.pdf>" "<guide folder>"

Sheet Z02 draws the subpanel at true proportion: its outline is 452.6 pt wide for 1117.6 mm (44 in), 2.46933 mm per
point, top left corner at (199.6, 106.0) pt on the displayed page. Each face is the rectangle the device has in
src/layout.mjs (mm from the plate's top left), written to assets/tex/<TAG>.webp with its rectangle in index.json.
"""
import io, json, re, sys
from pathlib import Path
import pymupdf
from PIL import Image

K, PX0, PY0, PPM = 2.46933, 199.6, 106.0, 12.0
pdf, guide = sys.argv[1], Path(sys.argv[2])
layout = (guide / "src" / "layout.mjs").read_text(encoding="utf-8")
out = guide / "assets" / "tex"
page = pymupdf.open(pdf)[12]
index = {}
for m in re.finditer(r"\{ tag: '([^']+)'[^\n]*?tex: '([^']+)'[^\n]*?r: \[([\d., ]+)\]", layout):
    tag, tex, r = m.group(1), m.group(2), [float(v) for v in m.group(3).split(",")]
    X0, X1, Yt, Yb = r
    clip = pymupdf.Rect(PX0 + X0 / K, PY0 + Yt / K, PX0 + X1 / K, PY0 + Yb / K)
    pm = page.get_pixmap(matrix=pymupdf.Matrix(PPM * K, PPM * K), clip=clip, alpha=False)
    im = Image.open(io.BytesIO(pm.tobytes("png"))).convert("RGB")
    im.save(out / f"{tex}.webp", "WEBP", quality=88)
    index[tex] = {"file": f"{tex}.webp", "X0": X0, "X1": X1, "Yt": Yt, "Yb": Yb}
    print(tag, im.size)
(out / "index.json").write_text(json.dumps(index, indent=1), encoding="utf-8")
print(len(index), "faces")
