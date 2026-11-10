"""Cut each device's front face out of the layout sheets of Draft rev18.pdf as a texture.

Sheet 3 (subplate layout) and sheet 2 (door layout) carry the manufacturers' front-view
images and vector drawings of every device at true scale. This script renders each
device's rectangle at high resolution, so the 3D guide shows the real faces.

Run from this folder:  python tools/extract_textures.py
Writes assets/tex/<key>.jpg (needs pymupdf and pillow).
"""
import io
import json
import os
import sys

import pymupdf as fitz
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(HERE, '..', '..', 'Draft rev20.pdf')
OUT = os.path.join(HERE, 'assets', 'tex')

# sheet 3: subplate 1 is drawn 1118 mm across 510 pt, its top left corner at (404, 50) pt
K3 = 1118 / 510
X3, Y3 = 404, 50

# key: (X0, X1, Ytop, Ybottom) in subplate mm (sheet 3), px per mm
# V13 (Draft rev20): only the devices that moved or are new on sheet 3 are cut again; every other face keeps its file and
# its entry in assets/tex/index.json (the pictures are the same in rev18 and rev20).
SHEET3 = {
    'CB3': (490, 543.5, 123, 229, 6),
    'CB2': (632, 686.4, 107, 244, 6),
    'CB1': (686.4, 741, 107, 244, 6),
    'Q1': (972, 1149, 63, 289, 4),
    'FU1': (974, 1107, 276, 347.5, 5),
    'LUG1': (883, 932, 63, 157, 6),
    'NS1': (389, 430, 832, 969, 7),
    'NS2': (430, 452, 849, 953, 8),
    'SI6': (125, 146, 1187, 1288, 8),
    'SI5': (146, 166.5, 1187, 1288, 8),
    'SI4': (166.5, 188, 1187, 1288, 8),
    'SI3': (188, 209, 1187, 1288, 8),
    'SI2': (209, 229.5, 1187, 1288, 8),
    'SI1': (229.5, 251, 1187, 1288, 8),
    'PDB2': (336, 380, 1216, 1265, 9),
    'PDB3': (387, 446, 1216, 1265, 9),
    'TB3': (479.6, 552.2, 1205, 1270, 10),
    'RCP1': (763, 838.5, 1174, 1300, 6),
    'CB5': (843.5, 862.2, 1185, 1291, 8),
}

SHEET2 = {}

def clip3(X0, X1, Yt, Yb):
    return fitz.Rect(X3 + X0 / K3, Y3 + Yt / K3, X3 + X1 / K3, Y3 + Yb / K3)


def save(pix, key):
    im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    path = os.path.join(OUT, f'{key}.jpg')
    im.save(path, quality=88, optimize=True)
    return im.size


def mm_x(pt):
    return round((pt - X3) * K3, 1)


def mm_y(pt):
    return round((pt - Y3) * K3, 1)


def fit(im, cap=2048):
    if max(im.size) > cap:
        im = im.copy()
        im.thumbnail((cap, cap), Image.LANCZOS)
    return im


def from_images(doc, page, rect, pxmm):
    """Compose the raw embedded images whose centres fall in rect (no dimension text or tags), trimmed."""
    infos = [i for i in page.get_image_info(xrefs=True) if i['xref']]
    hits = []
    for i in infos:
        b = fitz.Rect(i['bbox'])
        c = (b.tl + b.br) / 2
        if rect.contains(c) and b.width < rect.width * 1.25 and b.height < rect.height * 1.25:
            hits.append(i)
    if not hits:
        return None
    u = fitz.Rect(hits[0]['bbox'])
    for i in hits[1:]:
        u |= fitz.Rect(i['bbox'])
    s = pxmm * K3  # px per point
    canvas = Image.new('RGBA', (max(1, round(u.width * s)), max(1, round(u.height * s))), (0, 0, 0, 0))
    for i in hits:
        pix = fitz.Pixmap(doc, i['xref'])
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGBA')
        smask = doc.extract_image(i['xref']).get('smask')
        if smask:
            m = fitz.Pixmap(doc, smask)
            im.putalpha(Image.open(io.BytesIO(m.tobytes('png'))).convert('L').resize(im.size))
        b = fitz.Rect(i['bbox'])
        w, h = max(1, round(b.width * s)), max(1, round(b.height * s))
        canvas.alpha_composite(im.resize((w, h), Image.LANCZOS), (round((b.x0 - u.x0) * s), round((b.y0 - u.y0) * s)))
    box = canvas.getbbox() or (0, 0, canvas.width, canvas.height)
    canvas = canvas.crop(box)
    r = fitz.Rect(u.x0 + box[0] / s, u.y0 + box[1] / s, u.x0 + box[2] / s, u.y0 + box[3] / s)
    return canvas, r


# devices whose faces are the manufacturers' images on the sheet (tags and dimension text left out)
FROM_IMAGES = {'CB1', 'CB2', 'CB3', 'FU2', 'DRV1', 'DRV2', 'Q1', 'FU1', 'PDB1', 'GB1', 'PWS2', 'PLC1', 'IO1', 'ECR',
               'SI1', 'SI2', 'SI3', 'SI4', 'SI5', 'SI6', 'CPL1', 'CPL2', 'CPL3', 'CB4', 'PWS1', 'T1', 'NS1', 'NS2',
               'PDB2', 'PDB3', 'CB5', 'VM1', 'BRACKET', 'ANCHOR', 'RCP1'}


def main():
    os.makedirs(OUT, exist_ok=True)
    doc = fitz.open(PDF)
    p3, p2 = doc[2], doc[1]
    with open(os.path.join(OUT, 'index.json')) as fh:
        index = json.load(fh)
    done = []
    for key, (X0, X1, Yt, Yb, pxmm) in SHEET3.items():
        if key in FROM_IMAGES:
            got = from_images(doc, p3, clip3(X0, X1, Yt, Yb), pxmm)
            if got is not None:
                im, r = got
                fit(im).save(os.path.join(OUT, f'{key}.png'), optimize=True)
                index[key] = {'file': f'{key}.png', 'X0': mm_x(r.x0), 'X1': mm_x(r.x1), 'Yt': mm_y(r.y0), 'Yb': mm_y(r.y1)}
                print(key, 'image', im.size)
                done.append(key)
                continue
        dpi = round(pxmm * K3 * 72)  # px per point = px per mm x mm per point
        pix = p3.get_pixmap(dpi=dpi, clip=clip3(X0, X1, Yt, Yb), alpha=False)
        print(key, 'render', save(pix, key))
        index[key] = {'file': f'{key}.jpg', 'X0': X0, 'X1': X1, 'Yt': Yt, 'Yb': Yb}
        done.append(key)
    for key, (r, dpi) in SHEET2.items():
        im, _ = from_images(doc, p2, fitz.Rect(*r), dpi / 72 / K3)
        fit(im).save(os.path.join(OUT, f'{key}.png'), optimize=True)
        index[key] = {'file': f'{key}.png', 'sheet': 2}
        print(key, 'image', im.size)
    # WebP for the page (alpha kept), then the index points at the WebP files
    for key in done:
        v = index[key]
        src = os.path.join(OUT, v['file'])
        im = Image.open(src)
        dst = os.path.splitext(src)[0] + '.webp'
        im.save(dst, 'WEBP', quality=86, method=6)
        os.remove(src)
        v['file'] = os.path.basename(dst)
    with open(os.path.join(OUT, 'index.json'), 'w') as fh:
        json.dump(index, fh, indent=1)
    return 0


if __name__ == '__main__':
    sys.exit(main())
