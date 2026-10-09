"""Lecture minimale d'un .gltf KayKit : géométrie fusionnée, transformée, couleurs cuites depuis l'atlas."""
import json, pathlib, numpy as np
from PIL import Image

TYPES = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
_atlas = {}

def _mat(n):
    if "matrix" in n: return np.array(n["matrix"], dtype=np.float64).reshape(4, 4).T
    m = np.eye(4)
    if "scale" in n: m = np.diag(list(n["scale"]) + [1.0]) @ m
    if "rotation" in n:
        x, y, z, w = n["rotation"]
        r = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w), 0], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w), 0],
                      [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y), 0], [0, 0, 0, 1]])
        m = r @ m
    if "translation" in n:
        t = np.eye(4); t[:3, 3] = n["translation"]; m = t @ m
    return m

def lire(chemin):
    chemin = pathlib.Path(chemin); g = json.loads(chemin.read_text())
    bufs = [(chemin.parent / b["uri"]).read_bytes() for b in g["buffers"]]
    def acc(i):
        a = g["accessors"][i]; bv = g["bufferViews"][a["bufferView"]]; dt = np.dtype(TYPES[a["componentType"]]); n = NCOMP[a["type"]]
        debut = bv.get("byteOffset", 0) + a.get("byteOffset", 0); pas = bv.get("byteStride", 0) or dt.itemsize * n
        brut = np.frombuffer(bufs[bv["buffer"]], dtype=np.uint8, count=pas * (a["count"] - 1) + dt.itemsize * n, offset=debut)
        if pas == dt.itemsize * n: return brut.view(dt).reshape(a["count"], n).copy()
        return np.stack([brut[k*pas:k*pas+dt.itemsize*n].view(dt) for k in range(a["count"])])
    def couleurs(mat_i, uv, nb):
        m = g["materials"][mat_i] if mat_i is not None else {}; pbr = m.get("pbrMetallicRoughness", {})
        base = np.array(pbr.get("baseColorFactor", [1, 1, 1, 1])[:3])
        if "baseColorTexture" in pbr and uv is not None:
            img = g["images"][g["textures"][pbr["baseColorTexture"]["index"]]["source"]]["uri"]; f = chemin.parent / img
            if not f.exists(): f = next(chemin.parent.parent.glob("textur*/" + pathlib.Path(img).name))
            if f not in _atlas: _atlas[f] = np.asarray(Image.open(f).convert("RGB"), dtype=np.float64)
            t = _atlas[f]; h, w = t.shape[:2]
            px = np.clip((np.mod(uv[:, 0], 1.0) * w).astype(int), 0, w - 1); py = np.clip((np.mod(uv[:, 1], 1.0) * h).astype(int), 0, h - 1)
            return np.clip(t[py, px] * base, 0, 255)
        return np.tile(np.clip(base * 255, 0, 255), (nb, 1))
    P, N, C, I = [], [], [], []; decal = 0
    def visiter(i, parent):
        nonlocal decal
        n = g["nodes"][i]; m = parent @ _mat(n)
        if "mesh" in n:
            for pr in g["meshes"][n["mesh"]]["primitives"]:
                at = pr["attributes"]; p = acc(at["POSITION"]).astype(np.float64)
                nrm = acc(at["NORMAL"]).astype(np.float64) if "NORMAL" in at else np.tile([0, 1.0, 0], (len(p), 1))
                uv = acc(at["TEXCOORD_0"]).astype(np.float64) if "TEXCOORD_0" in at else None
                idx = acc(pr["indices"]).reshape(-1).astype(np.int64) if "indices" in pr else np.arange(len(p))
                P.append(p @ m[:3, :3].T + m[:3, 3]); nm = nrm @ np.linalg.inv(m[:3, :3])
                N.append(nm / np.maximum(np.linalg.norm(nm, axis=1, keepdims=True), 1e-9))
                C.append(couleurs(pr.get("material"), uv, len(p))); I.append(idx + decal); decal += len(p)
        for c in n.get("children", []): visiter(c, m)
    for r in g["scenes"][g.get("scene", 0)]["nodes"]: visiter(r, np.eye(4))
    return np.concatenate(P), np.concatenate(N), np.concatenate(C), np.concatenate(I)
