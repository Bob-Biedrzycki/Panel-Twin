"""Find the terminal screws on each device face (OpenCV Hough circles) and compare them with src/terminals.mjs.

Writes tools/out/<tag>_terminals.png: the face with detected circles (green) and the layout's pins (red, labelled),
and tools/out/detected.json: detected circle centres as (u, v) fractions of the face, per device.
Run: node -e "..." dumps the layouts first (see main), or:  python tools/detect_terminals.py
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(HERE, 'assets', 'tex')
OUT = os.path.join(HERE, 'tools', 'out')

# device tag -> (texture key, expected screw diameter in mm, min / max diameter factor)
DEVICES = {
    'CB1': ('CB1', 6.0), 'CB3': ('CB3', 5.5), 'CB5': ('CB5', 5.5), 'FU2': ('FU2', 6.0),
    'SI1': ('SI1', 3.2), 'T1': ('T1', 7.5), 'Q1': ('Q1', 8.0), 'FU1': ('FU1', 7.0), 'PDB1': ('PDB1', 6.0),
    'PDB2': ('PDB2', 3.2), 'PDB3': ('PDB3', 3.2), 'CB4': ('CB4', 4.0), 'PWS1': ('PWS1', 3.5),
    'CPL1': ('CPL1', 3.0), 'GB1': ('GB1', 3.5), 'NS2': ('NS2', 5.0),
}


def layouts():
    js = ("import('" + os.path.join(HERE, 'src', 'terminals.mjs').replace('\\', '/').replace('C:', 'file:///C:') +
          "').then(m => console.log(JSON.stringify({ L: m.LAYOUTS, D: m.DEVICE_LAYOUT })))")
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def main():
    os.makedirs(OUT, exist_ok=True)
    idx = json.load(open(os.path.join(TEX, 'index.json')))
    lay = layouts()
    found = {}
    for tag, (key, dia) in DEVICES.items():
        info = idx[key]
        im = cv2.imread(os.path.join(TEX, info['file']), cv2.IMREAD_UNCHANGED)
        if im.shape[2] == 4:
            a = im[:, :, 3:4] / 255.0
            im = (im[:, :, :3] * a + 200 * (1 - a)).astype(np.uint8)
        s = 4
        big = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
        g = cv2.GaussianBlur(cv2.cvtColor(big, cv2.COLOR_BGR2GRAY), (5, 5), 1.2)
        wmm = info['X1'] - info['X0']
        pxmm = big.shape[1] / wmm
        r0 = dia / 2 * pxmm
        c = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.2, minDist=r0 * 1.5, param1=110, param2=22, minRadius=int(r0 * 0.6), maxRadius=int(r0 * 1.5))
        pts = [] if c is None else [(float(x / big.shape[1]), float(y / big.shape[0]), float(r / pxmm * 2)) for x, y, r in c[0]]
        found[tag] = sorted(pts, key=lambda p: (round(p[1], 2), p[0]))
        vis = big.copy()
        for u, v, d in pts:
            cv2.circle(vis, (int(u * big.shape[1]), int(v * big.shape[0])), int(d / 2 * pxmm), (0, 200, 0), 2)
        L = lay['L'].get(lay['D'].get(tag, ''), {}).get('pins', {})
        for name, (u, v, z, e) in L.items():
            if '#' in name or len(name) > 12:
                continue
            p = (int(u * big.shape[1]), int(v * big.shape[0]))
            cv2.drawMarker(vis, p, (0, 0, 255), cv2.MARKER_CROSS, 14, 2)
            cv2.putText(vis, name, (p[0] + 4, p[1] - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)
        cv2.imwrite(os.path.join(OUT, f'{tag}_terminals.png'), vis)
        print(tag, len(pts), 'circles; px/mm', round(pxmm, 1))
    json.dump(found, open(os.path.join(OUT, 'detected.json'), 'w'), indent=1)
    return 0


if __name__ == '__main__':
    sys.exit(main())
