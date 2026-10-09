"""Assemble le site à partir de src/ : version artefact, version GitHub Pages, version de test locale."""
import json, pathlib, shutil, sys

racine = pathlib.Path(__file__).parent
src, dist = racine / "src", racine / "dist"
contenu = json.loads((src / "contenu.json").read_text(encoding="utf-8"))  # échoue si le JSON est invalide
page = (src / "page.html").read_text(encoding="utf-8")
page = page.replace("/*__SCENE__*/", (src / "scene.js").read_text(encoding="utf-8"))
page = page.replace("__CONTENU__", json.dumps(contenu, ensure_ascii=False).replace("</", "<\\/"))
tete, corps = page.split("<!--CORPS-->")

shutil.rmtree(dist, ignore_errors=True)
site = dist / "site"
(site / "outils").mkdir(parents=True)
(dist / "quartier-ia.html").write_text(tete + corps, encoding="utf-8")  # fragment pour l'artefact
complet = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
           + tete + "</head>\n<body>\n" + corps + "</body>\n</html>\n")
(site / "index.html").write_text(complet, encoding="utf-8")
shutil.copy(src / "contenu.json", site / "contenu.json")
shutil.copy(src / "outils" / "gdh.html", site / "outils" / "gdh.html")
shutil.copy(src / "modeles.json", site / "modeles.json")
(site / "CREDITS.txt").write_text("Modèles 3D : KayKit City Builder Bits, Furniture Bits et Prototype Bits, par Kay Lousberg (www.kaylousberg.com), licence CC0.\nMoteur 3D : three.js (licence MIT).\n", encoding="utf-8")

if len(sys.argv) > 1:  # test local : Three.js servi depuis un dossier voisin
    (site / "test.html").write_text(complet.replace("https://cdn.jsdelivr.net/npm/three@0.147.0/", "vendor/"), encoding="utf-8")
    shutil.copytree(sys.argv[1], site / "vendor", ignore=shutil.ignore_patterns(".git"))
print("ok", sum(len(l["entrees"]) for l in contenu["lieux"]), "entrées")
