"""V6: front faces for parts whose sheet 3 image does not match the parts fitted in the shop (photos 2026-11-05).

GLG isolators (SI1-SI6): the sheet 3 face is a plain green outline. The fitted isolators carry an orange number label
(5 6 7 8 over 1 2 3 4) under the top plugs, a white tag and POWER LED on the green front, and a blue label
(9 10 11 12 over 13 14 15 16) over the bottom plugs, with light green plugs. The face is drawn here to the same
bands as the catalogue-shape model (guide.js PROC.GLG) and the terminal rows in terminals.mjs, so each screw on the
face sits on the modelled plug.

Run from this folder:  python -I tools/make_faces.py   (needs pillow; uses Windows' Arial)
Writes assets/tex/SI1.webp ... SI6.webp (same rectangles in assets/tex/index.json).
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(HERE, 'assets', 'tex')
FONT = r'C:\Windows\Fonts\arialbd.ttf'
FONT_R = r'C:\Windows\Fonts\arial.ttf'

# colours sampled from the shop photo of SI5/SI6 (PXL_20261105_180005897), lifted to their lit values
HOUSING = (46, 150, 72)
PLUG = (110, 196, 120)
ORANGE = (230, 118, 44)
BLUE = (44, 104, 204)
INK = (24, 24, 24)

# bands, as fractions of the face height from the top (match PROC.GLG and LAYOUTS.GLG)
B = {'outerTop': (0.0, 0.105), 'innerTop': (0.105, 0.175), 'orange': (0.175, 0.29), 'front': (0.29, 0.71),
     'blue': (0.71, 0.83), 'innerBot': (0.83, 0.935), 'outerBot': (0.935, 1.0)}
COLS = [0.22, 0.41, 0.59, 0.78]
ROWS = {'5-8': 0.071, '1-4': 0.139, '9-12': 0.906, '13-16': 0.975}


def glg_face(tag, W=250, H=1100):
    im = Image.new('RGB', (W, H), HOUSING)
    d = ImageDraw.Draw(im)
    f_num = ImageFont.truetype(FONT, int(W * 0.13))
    f_tag = ImageFont.truetype(FONT_R, int(W * 0.25))
    f_small = ImageFont.truetype(FONT_R, int(W * 0.07))
    y = lambda v: int(v * H)
    # plugs: light green, a round screw recess and slotted screw at each terminal, the wire entries at the outer ends
    for k in ('outerTop', 'innerTop', 'innerBot', 'outerBot'):
        a, b = B[k]
        d.rectangle([int(W * 0.06), y(a), int(W * 0.94), y(b)], fill=PLUG, outline=(70, 140, 80), width=2)
    for name, v in ROWS.items():
        for u in COLS:
            cx, cy, r = int(u * W), y(v), int(W * 0.075)
            d.ellipse([cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3], fill=(40, 96, 52))
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(176, 182, 178), outline=(90, 96, 92), width=2)
            d.line([cx - r + 3, cy + r - 3, cx + r - 3, cy - r + 3], fill=(60, 64, 62), width=3)
    for v in (0.012, 0.988):
        for u in COLS:
            cx = int(u * W); d.rectangle([cx - 12, y(v) - 8, cx + 12, y(v) + 8], fill=(20, 40, 24))
    # orange label: 5 6 7 8 over 1 2 3 4
    a, b = B['orange']; m = (a + b) / 2
    d.rectangle([int(W * 0.03), y(a), int(W * 0.97), y(b)], fill=ORANGE)
    d.line([int(W * 0.03), y(m), int(W * 0.97), y(m)], fill=(120, 60, 20), width=2)
    for row, (lo, hi) in ((('5', '6', '7', '8'), (a, m)), (('1', '2', '3', '4'), (m, b))):
        for u, t in zip(COLS, row):
            d.text((int(u * W), y((lo + hi) / 2)), t, font=f_num, fill=INK, anchor='mm')
    # white tag and POWER lamp on the green front
    d.rectangle([int(W * 0.1), y(0.34), int(W * 0.9), y(0.45)], fill=(246, 246, 242))
    d.text((W // 2, y(0.395)), tag, font=f_tag, fill=INK, anchor='mm')
    d.ellipse([int(W * 0.2) - 7, y(0.52) - 7, int(W * 0.2) + 7, y(0.52) + 7], fill=(70, 120, 60))
    d.text((int(W * 0.3), y(0.52)), 'POWER', font=f_small, fill=(170, 60, 40), anchor='lm')
    # blue label: 9 10 11 12 over 13 14 15 16
    a, b = B['blue']; m = (a + b) / 2
    d.rectangle([int(W * 0.03), y(a), int(W * 0.97), y(b)], fill=BLUE)
    d.line([int(W * 0.03), y(m), int(W * 0.97), y(m)], fill=(20, 40, 90), width=2)
    f_num2 = ImageFont.truetype(FONT, int(W * 0.105))
    for row, (lo, hi) in ((('9', '10', '11', '12'), (a, m)), (('13', '14', '15', '16'), (m, b))):
        for u, t in zip(COLS, row):
            d.text((int(u * W), y((lo + hi) / 2)), t, font=f_num2, fill=INK, anchor='mm')
    return im


def _coeffs(dst, src):
    """Perspective coefficients mapping output (dst) points to photo (src) points, for Image.transform."""
    import numpy as np
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    return np.linalg.solve(np.array(A, float), np.array(b, float)).tolist()


# 1769 faces rectified from the straight-on shop photo PXL_20261105_180059974 (doors closed). Corners are photo pixels
# (TL, TR, BR, BL) of each module's front from its top edge to the bottom of its vents; v0/v1: where that span sits on
# the module's full height (the rest, the latches, is filled with the housing grey).
PHOTO_1769 = 'PXL_20261105_180059974.jpg'
FACES_1769 = {
    # PLC1 is a 1769-L30ER: the sheet 3 image is the L36ERM's face
    'PLC1': {'quad': [(926, 504), (1590, 504), (1550, 2100), (716, 2100)], 'mm': (55, 132), 'v': (0.058, 0.965)},
    # PWS2: down to the bottom of the door only (the photo has the +24 V wire hanging across the vents below it)
    'PWS2': {'quad': [(1644, 650), (2376, 650), (2384, 1830), (1560, 1830)], 'mm': (70, 131.7), 'v': (0.04, 0.793)},
    'IO1': {'quad': [(2404, 660), (3030, 660), (3130, 2100), (2396, 2100)], 'mm': (52.5, 131), 'v': (0.055, 0.955)},
}


def face_1769(src_dir, key, pxmm=8):
    f = FACES_1769[key]
    W, H = int(f['mm'][0] * pxmm), int(f['mm'][1] * pxmm)
    v0, v1 = f['v']
    h = int((v1 - v0) * H)
    photo = Image.open(os.path.join(src_dir, PHOTO_1769)).convert('RGB')
    part = photo.transform((W, h), Image.PERSPECTIVE, _coeffs([(0, 0), (W, 0), (W, h), (0, h)], f['quad']), Image.BICUBIC)
    out = Image.new('RGB', (W, H), (214, 215, 211))
    out.paste(part, (0, int(v0 * H)))
    return out


if __name__ == '__main__':
    import sys
    for n in range(1, 7):
        tag = f'SI{n}'
        glg_face(tag).save(os.path.join(TEX, f'{tag}.webp'), quality=92)
        print('wrote', tag)
    # the shop photos are not in the repo (they live in Drive): pass their folder to rebuild the 1769 faces
    if len(sys.argv) > 1:
        for key in FACES_1769:
            face_1769(sys.argv[1], key).save(os.path.join(TEX, f'{key}.webp'), quality=92)
            print('wrote', key)
