# Clip Cercle IA EdG-T — version 2

Clip d'accroche de 15 secondes, 1920 × 1080, 30 images par seconde, avec bande-son. Le projet est écrit au format HyperFrames (une page HTML dont l'animation se pilote par le temps) et ne dépend d'aucun service en ligne : bibliothèques, polices, modèles 3D, insigne et son sont dans le dossier.

NON PROTÉGÉ. Réalisé avec assistance IA.

## Voir le clip sans rien installer

Double-cliquer sur `index.html`. Le clip se lance en qualité allégée ; un clic le relance avec le son, la barre d'espace le met en pause. Cet aperçu est géré par `apercu.js`, qui reste inactif pendant un rendu.

## Découpage

| Plan | Temps | Image | Texte |
| --- | --- | --- | --- |
| 1 | 0 – 3 s | grue rapide sur le chantier, le bâtiment se construit | 01 — Vous avez des idées ? |
| 2 | 3 – 6 s | caméra à hauteur d'homme, les six lignes d'opération s'allument puis les fenêtres | 02 — L'envie de transformer, de prendre votre destin en main ? |
| 3 | 6 – 10 s | au ras de la voie, le train arrive, s'arrête, repart en frôlant la caméra | 03 — Ne laissez pas partir le train. |
| 4 | 10 – 15 s | recul lent sur le bâtiment illuminé | carte finale : Investissez-vous avec nous. |

Les coupes et les temps forts tombent sur une pulsation de 120 à la minute.

## Produire le MP4

Le MP4 fourni a été produit par `outils/rendu.mjs` (navigateur sans interface, une capture par image, assemblage et mixage par FFmpeg) :

    node outils/rendu.mjs                                # rendu final, long sans carte graphique
    node outils/rendu.mjs --qualite brouillon --images 1.2,4.6,8.6,13   # images de contrôle rapides

Ce script demande Node.js 22 ou plus, FFmpeg et le module `playwright` (chemin possible par la variable `PLAYWRIGHT_MODULE`).

Avec HyperFrames, depuis ce dossier :

    npx hyperframes check
    npx hyperframes render -o renders/clip-cercle-ia.mp4

Ces deux commandes n'ont pas pu être essayées : l'environnement de création n'avait pas accès à npm.

## Comment l'image est faite

Tout est dans `index.html`, fonction `rendre(t)`.

- **Flou de mouvement et lissage** : chaque image est la moyenne de six sous-images prises à des instants et des décalages légèrement différents.
- **Halos** : les sources lumineuses dépassent la valeur du blanc ; une passe de halo (`vendor/three-bloom.js`) les fait rayonner.
- **Lumière au sol** : la nuit, les fenêtres, les lampadaires et le phare éclairent le sol par des taches de lumière posées à plat, pas par de vrais projecteurs.
- **Ombres de contact** : dégradé sombre en pied de mur et tache d'ombre sous le bâtiment.
- **Étalonnage** : hautes lumières comprimées sans perdre la teinte, ombres froides, lumières chaudes, vignette, grain.

## Modifier

| Quoi | Où dans `index.html` |
| --- | --- |
| Couleurs | bloc `:root` en tête de la feuille de style, lu aussi par la scène 3D |
| Textes | sections `texte-1`, `texte-2`, `texte-3` et `calque-carte` |
| Rythme | table `T` au début du script, en secondes |
| Caméras | fonction `prise(t)`, un cas par plan |
| Décor | bloc « décor : modèles KayKit » |

## Bande-son

`assets/bande-son.wav` est entièrement calculée par `outils/bande-son.py` (Python, numpy, scipy) : nappe en ré mineur qui s'ouvre en ré majeur à la carte, un coup sourd par pièce posée, six notes pour les six lignes, roulement, échappement, frein et sifflet du train, souffle à chaque coupe. Niveau visé : -16 LUFS.

Elle a été réglée à la mesure, sans écoute. Pour la remplacer par une musique ou une voix, déposer le fichier dans `assets/` et changer l'attribut `src` de la balise `<audio id="bande-son">`, ou ajouter une seconde balise `<audio>` avec son propre `data-start`. Si le rythme du clip change, reporter les temps dans la table `T` du script Python.

## À compléter

- **QR code** : remplacer le contenu du bloc `id="qr"` par l'image du code.
- **Mention de validation** : remplacer `[fonction]` dans le bloc `id="ia"`.
- **Insigne** : l'image fournie fait 156 × 188 pixels ; une version plus grande ou vectorielle serait plus nette.

## Éléments tiers

| Élément | Version | Licence |
| --- | --- | --- |
| GSAP (`vendor/gsap.min.js`) | 3.15.0 | licence standard GSAP, gratuite, non open source |
| three.js (`vendor/three.min.js`, `vendor/three-bloom.js`) | r128 | MIT |
| Modèles KayKit City Builder Bits (`assets/modeles-kaykit.js`), Kay Lousberg | repris du dépôt quartier-ia | CC0 |
| IBM Plex Sans Condensed, IBM Plex Mono | | SIL Open Font License 1.1 |

L'insigne de l'École de Guerre – Terre vient de la charte du Cercle IA. À ne pas déposer dans un dépôt public sans accord.
