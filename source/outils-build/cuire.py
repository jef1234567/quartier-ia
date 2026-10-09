"""Cuit les modèles KayKit (CC0) retenus en un fichier modeles.json : index + géométrie en base64."""
import json, sys, pathlib, numpy as np
from gltf_lire import lire
R = pathlib.Path(sys.argv[1]); SORTIE = pathlib.Path(sys.argv[2])
PACKS = {
  "ville": ("KayKit-City-Builder-Bits-1.0/addons/kaykit_city_builder_bits/Assets/gltf", 5.5,
    "bench box_A box_B building_A building_C building_E building_G building_H bush car_hatchback car_sedan car_stationwagon dumpster firehydrant road_straight road_straight_crossing streetlight trafficlight_A watertower"),
  "meuble": ("KayKit-Furniture-Bits-1.0/addons/kaykit_furniture_bits/Assets/gltf", 0.9,
    "armchair book_set cabinet_medium_decorated cabinet_small cactus_medium_A cactus_small_A chair_A chair_B chair_C chair_stool couch_pillows lamp_standing lamp_table pictureframe_large_B pictureframe_medium rug_rectangle_A rug_oval_A rug_rectangle_stripes_A shelf_B_large_decorated shelf_B_small_decorated table_low table_medium table_medium_long table_small"),
  "proto": ("KayKit-Prototype-Bits-1.0/addons/kaykit_prototype_bits/Assets/gltf", 0.9,
    "Barrel_A Barrel_B Box_A Box_B Box_C Can_A Door_A Pallet_Small Pallet_Small_Decorated_A table_medium_Decorated target_stand_A"),
}
index, blocs, pos = {}, [], 0
def ajouter(a):
    global pos
    b = a.tobytes(); b += b"\0" * (-len(b) % 4); blocs.append(b); debut = pos; pos += len(b); return debut
for pack, (dossier, echelle, noms) in PACKS.items():
    for nom in noms.split():
        P, N, C, I = lire(R / dossier / (nom + ".gltf"))
        P = P * echelle; mn, mx = P.min(0), P.max(0)
        P[:, 0] -= (mn[0] + mx[0]) / 2; P[:, 2] -= (mn[2] + mx[2]) / 2; P[:, 1] -= mn[1]   # centré, posé au sol
        cle = nom if nom not in index else pack + "_" + nom
        index[cle] = {"n": len(P), "i": len(I), "t": [round(float(x), 3) for x in (mx - mn)],
                      "p": ajouter(P.astype("<f4")), "nm": ajouter(np.round(N * 127).astype(np.int8)),
                      "c": ajouter(np.round(C).astype(np.uint8)), "ix": ajouter(I.astype("<u2" if len(P) < 65536 else "<u4")), "u32": len(P) >= 65536}
SORTIE.mkdir(parents=True, exist_ok=True)
import base64
# Un seul fichier JSON : l'index et la géométrie encodée en base64 (les hébergeurs servent partout du JSON).
(SORTIE / "modeles.json").write_text(json.dumps({"index": index, "donnees": base64.b64encode(b"".join(blocs)).decode()}, separators=(",", ":")))
print(len(index), "modèles,", sum(m["n"] for m in index.values()), "sommets,", pos // 1024, "Ko")
