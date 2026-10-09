# Quartier IA

Portail 3D du comité IA : un quartier à faire tourner, six lieux à ouvrir (accueil, bibliothèque, salle de classe, champ de bataille, salle tactique, atelier).

Prototype non officiel. Le dépôt est public : aucun contenu sensible ou à diffusion restreinte ne doit y figurer.

## Ajouter une entrée

Tout le contenu affiché tient dans `contenu.json`, à la racine.

1. Ouvre `contenu.json` et passe en édition.
2. Dans le lieu voulu, copie une entrée existante et colle-la à la suite.
3. Change `titre`, `resume` et `type` : `texte`, `lien` ou `outil`.
4. Pour un texte, remplis `contenu` (ajoute `"copiable": true` pour un prompt). Pour un lien ou un outil, remplis `url`.
5. Valide : la page publiée se met à jour au bout de quelques minutes.

Un outil HTML se dépose dans le dossier `outils/` et se référence par son chemin, par exemple `outils/gdh.html`.

## Modifier la scène

Les sources sont dans `source/` : `src/page.html` (interface), `src/scene.js` (scène 3D), `src/contenu.json`. Après modification :

    python3 source/build.py

puis recopie le contenu de `source/dist/site/` à la racine.

## Crédits

- Modèles 3D des véhicules, immeubles et meubles : KayKit, par Kay Lousberg (www.kaylousberg.com), licence CC0.
- Moteur 3D : three.js, licence MIT.
