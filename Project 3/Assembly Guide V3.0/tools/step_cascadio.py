"""Convert a vendor STEP file that occt-import-js cannot mesh, using cascadio (OpenCascade 7.8 through Python).

Writes the same files as step_to_mesh.mjs: assets/models/<key>.bin (gzip of [Uint16 quantised positions][Uint32 indices]
per part) and the model's entry in assets/models/index.json. Parts are grouped by colour, as step_to_mesh.mjs does.

V5: the Rockwell 1769-L36ERM file (PLC1) meshes to nothing in occt-import-js 0.0.21 and 0.0.23; cascadio meshes all of it.

Run (once): python -m venv <dir outside the repo>; <dir>\\Scripts\\pip install cascadio trimesh numpy
Then:       <dir>\\Scripts\\python -I tools/step_cascadio.py <key> [tolerance mm]   (key from tools/models.json)
models.json options for these files: reader "cascadio", tolerance_mm, dropParts (regex on solid names), keepFrontZ (mm).
"""
import gzip, hashlib, json, os, sys, tempfile
import numpy as np
import cascadio, trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VENDOR = os.path.join(os.path.dirname(ROOT), 'Vendor Step Files')

key = sys.argv[1]
cfg = json.load(open(os.path.join(HERE, 'models.json'), encoding='utf-8'))['models'][key]
tol = float(sys.argv[2]) if len(sys.argv) > 2 else float(cfg.get('tolerance_mm', 0.25))
src = os.path.join(VENDOR, cfg['step'])
glb = os.path.join(tempfile.gettempdir(), f'{key}_cascadio.glb')
cascadio.step_to_glb(src, glb, tol_linear=tol, tol_angular=0.6, tol_relative=False, merge_primitives=True, use_parallel=True)
scene = trimesh.load(glb)
os.remove(glb)

import re
# dropParts: names of solids to leave out (regex on the solid's name), unless they reach the model's front (z >= keepFrontZ mm).
# The Rockwell controller model carries its whole circuit board (U.., C.., P.. reference designators): 80 % of its
# triangles and none of it visible with the housing closed.
drop = re.compile(cfg['dropParts']) if cfg.get('dropParts') else None
front = float(cfg.get('keepFrontZ', 1e9))
groups = {}
dropped = 0
for name in scene.graph.nodes_geometry:
    tf, gname = scene.graph[name]
    g = scene.geometry[gname]
    if not len(g.faces):
        continue
    base = re.split(r'_[0-9a-f]+$', name)[0].split('_')[0]
    if drop and drop.search(base):
        vz = trimesh.transformations.transform_points(g.vertices, tf)[:, 2].max() * 1000.0
        if vz < front:
            dropped += len(g.faces)
            continue
    col = None
    try:
        m = g.visual.material
        c = getattr(m, 'baseColorFactor', None)
        if c is not None:
            col = tuple(round(float(v) / (255.0 if max(c) > 1.0 else 1.0), 3) for v in c[:3])
    except AttributeError:
        pass
    if col is None and hasattr(g.visual, 'face_colors'):
        col = tuple(round(float(v) / 255.0, 3) for v in g.visual.face_colors[0][:3])
    v = trimesh.transformations.transform_points(g.vertices, tf) * 1000.0     # glb is metres; the guide's models are mm
    grp = groups.setdefault(col, {'P': [], 'I': [], 'n': 0})
    grp['P'].append(v)
    grp['I'].append(np.asarray(g.faces, dtype=np.int64) + grp['n'])
    grp['n'] += len(v)

parts = []
for col, grp in groups.items():
    P = np.concatenate(grp['P']); I = np.concatenate(grp['I']).reshape(-1)
    # weld duplicate vertices (cascadio writes each face separately) so the gzip stays small
    q = np.round(P, 3)
    uniq, inv = np.unique(q, axis=0, return_inverse=True)
    I = inv.reshape(-1)[I]
    parts.append({'color': list(col) if col else None, 'P': uniq, 'I': I})

lo = np.min([p['P'].min(0) for p in parts], 0); hi = np.max([p['P'].max(0) for p in parts], 0)
span = np.maximum(hi - lo, 1e-6)
chunks, meta, tri = [], [], 0
for k, p in enumerate(parts):
    qv = np.round((p['P'] - lo) / span * 65535).astype('<u2')
    chunks += [qv.tobytes(), p['I'].astype('<u4').tobytes()]
    meta.append({'name': f'colour group {k}', 'mesh': k, 'color': p['color'], 'nv': int(len(p['P'])), 'ni': int(len(p['I']))})
    tri += len(p['I']) // 3
out = os.path.join(ROOT, 'assets', 'models')
data = gzip.compress(b''.join(chunks), 9)
open(os.path.join(out, f'{key}.bin'), 'wb').write(data)
idx_path = os.path.join(out, 'index.json')
index = json.load(open(idx_path, encoding='utf-8'))
raw = open(src, 'rb').read()
index[key] = {'step': os.path.relpath(src, os.path.dirname(ROOT)).replace('\\', '/'), 'sha256': hashlib.sha256(raw).hexdigest(),
              'comp': cfg['comp'], 'pn': cfg['pn'], 'reader': f'cascadio {getattr(cascadio, "__version__", "")}'.strip() + f', tolerance {tol} mm',
              'lo': [round(float(x), 3) for x in lo], 'hi': [round(float(x), 3) for x in hi], 'parts': meta, 'tri': tri, 'bytes': len(data)}
json.dump(index, open(idx_path, 'w', encoding='utf-8', newline='\n'), indent=1)
print(f'{key}: dropped {dropped} hidden triangles; {len(parts)} parts, {tri} triangles, {len(data) // 1024} KB gz, size {" x ".join(f"{s:.1f}" for s in span)} mm')
