"""Cut drawing sheets into overlapping tiles you can actually read.

    python -I scripts/sheet_tiles.py <drawing.pdf> <out folder> [--pages 4-15] [--dpi 300] [--grid 4x3] [--text]

Panel drawing sets are often exported with no text layer (every character is a vector outline), so nothing can be
searched and a whole page at screen size is unreadable. This renders each page at --dpi and cuts it into a grid of
overlapping tiles (page_04_r1c2.png), plus one whole-page overview (page_04_all.png) to find your way.
--text prints how many characters of real text each page has first: 0 means the sheet must be read as images.
For one region at higher zoom: --clip page,x0,y0,x1,y1 (fractions of the page, 0-1), written as page_NN_clip.png.
Needs: pip install pymupdf
"""
import argparse
import os
import pymupdf

ap = argparse.ArgumentParser()
ap.add_argument('pdf'); ap.add_argument('out')
ap.add_argument('--pages', default=None); ap.add_argument('--dpi', type=int, default=300)
ap.add_argument('--grid', default='4x3'); ap.add_argument('--text', action='store_true')
ap.add_argument('--clip', default=None)
a = ap.parse_args()
doc = pymupdf.open(a.pdf)
os.makedirs(a.out, exist_ok=True)
if a.pages:
    lo, _, hi = a.pages.partition('-'); pages = range(int(lo), int(hi or lo) + 1)
else:
    pages = range(1, doc.page_count + 1)
if a.text:
    for n in pages:
        print(f'page {n}: {len(doc[n - 1].get_text("text").strip())} characters of text')
if a.clip:
    n, x0, y0, x1, y1 = [float(v) for v in a.clip.split(',')]
    p = doc[int(n) - 1]; r = p.rect
    c = pymupdf.Rect(r.x0 + x0 * r.width, r.y0 + y0 * r.height, r.x0 + x1 * r.width, r.y0 + y1 * r.height)
    f = os.path.join(a.out, f'page_{int(n):02d}_clip.png'); p.get_pixmap(dpi=a.dpi, clip=c).save(f); print('wrote', f)
else:
    cols, rows = [int(v) for v in a.grid.lower().split('x')]
    for n in pages:
        p = doc[n - 1]; r = p.rect
        p.get_pixmap(dpi=90).save(os.path.join(a.out, f'page_{n:02d}_all.png'))
        tw, th = r.width / cols, r.height / rows
        for i in range(rows):
            for j in range(cols):
                c = pymupdf.Rect(r.x0 + j * tw - tw * 0.08, r.y0 + i * th - th * 0.08, r.x0 + (j + 1) * tw + tw * 0.08, r.y0 + (i + 1) * th + th * 0.08) & r
                p.get_pixmap(dpi=a.dpi, clip=c).save(os.path.join(a.out, f'page_{n:02d}_r{i + 1}c{j + 1}.png'))
        print(f'page {n}: overview + {cols * rows} tiles')
