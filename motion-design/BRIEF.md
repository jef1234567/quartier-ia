# Motion design: Cercle IA EDG-T

Fichier de suivi: brief, checklist et journal. À relire au début de chaque session.

## Brief (validé par l'utilisateur)
- **Produit**: le Cercle IA de l'EDG-T (École de Guerre-Terre)
- **Type**: vidéo promo, filière HyperFrames
- **Diffusion**: télévision, 16:9, 1920×1080 (confirmé)
- **Durée**: 30 à 45 s
- **Voix off**: oui, français, voix féminine, texte proposé par Claude
- **Musique**: épique, rendu qualitatif premium
- **Appel à l'action**: «Ne loupe pas encore le train» (interprétation à confirmer: on ne rate pas le train de l'IA)
- **Contraintes**: aucune
- **Lien avec le dépôt quartier-ia**: aucun (le dépôt sert d'espace de travail)

## Référence fournie: « Clip Cercle IA v2 »
- Source: `clip-cercle-ia-v2-projet.zip` (dossier uploadé en session, non versionné ici).
- Clip de 15 s, 1920×1080, 30 i/s, projet HyperFrames autonome: scène 3D low-poly de nuit (modèles KayKit CC0), GSAP + three.js r128, bande-son synthétique.
- Découpage: grue/chantier (0-3 s) → six lignes d'opération qui s'allument (3-6 s) → le train arrive et repart (6-10 s) → recul sur le bâtiment illuminé et carte finale (10-15 s).
- Voix du clip: «Vous avez des idées ? / L'envie de transformer, de prendre votre destin en main ? / Ne laissez pas partir le train… / Investissez-vous avec nous.»
- Reste à compléter dans la référence: QR code, mention de validation `[fonction]`.
- Mention portée par le clip: «NON PROTÉGÉ. Réalisé avec assistance IA.»

## Identité visuelle (relevée dans la référence)
- Fond nuit `#0b1222`, fond `#0f1522`, surface `#161e2e`, texte `#e6ebf4`, atténué `#9aa6bd`, trait `#2a3550`
- Bleu clair `#9db8ec`, bleu fort `#1d3f8f`, rouge `#ff6b5e`, rouge fort `#c1272d`, blanc `#f4f6fa` (tricolore bleu/blanc/rouge)
- Six lignes d'opération: `#a3acba`, `#5b9bff`, `#3cc2ad`, `#f0a838`, `#ef6f92`, `#a98cf0`
- Polices: IBM Plex Sans Condensed (titres), IBM Plex Mono (légendes)
- Insigne EdG-T: `assets/insigne-edgt.png` dans la référence, 156×188 px (trop petit pour une télé, demander une version plus grande ou vectorielle). À ne pas déposer dans un dépôt public sans accord.

## Décisions (utilisateur)
- Style: mixer 2D typographique/papier (quotidien) et 3D low-poly de nuit (Cercle IA), comme la référence
- Tutoiement. Appel à l'action: «Ne loupe pas encore le train» puis «Rejoins-nous» (pas de QR code)
- Insigne: utiliser celui de la référence (156×188 px) ou en trouver une version plus grande sur internet
- Durée: 45 s, cadence 120 bpm, coupes sur les temps forts

## Storyboard v1 (45 s, à valider)
| Plan | Temps | Image | Voix off | Son |
| --- | --- | --- | --- | --- |
| 1. Le quotidien | 0-9 s | 2D, palette grise et terne: tableau qui se remplit case par case, lignes «Copier. Coller. Recopier. Ressaisir.» qui s'empilent, pages de calendrier qui défilent, tampon répété | «Des tableaux recopiés à la main. Des comptes rendus refaits dix fois. Des heures perdues, encore et encore.» | tic-tac, stylo, machine à écrire, rythme monotone |
| 2. Le choc | 9-17 s | Coupe sèche. Écran noir, glitch, «IA» géant en typo cinétique, puis question qui se répète en écho: «Mais comment s'en servir ?» | «Et puis l'IA arrive. Vite. Très vite. Mais comment s'en servir ?» | silence, impact, montée de tension |
| 3. Le Cercle IA | 17-27 s | La feuille se déchire: le papier devient le sol 3D. Le bâtiment se construit, les six lignes d'opération s'allument. L'insigne apparaît. Trois mots, un par temps fort: AIDER, ACCOMPAGNER, TRANSFORMER | «Le Cercle IA de l'École de Guerre-Terre est là. Il aide. Il accompagne. Il transforme.» | entrée de la musique épique (ré mineur vers ré majeur) |
| 4. On s'adapte, on construit | 27-37 s | Caméra à hauteur d'homme. Les cartes 2D du plan 1 glissent dans la ville 3D et se remplissent toutes seules. Silhouettes low-poly qui s'organisent. Le train arrive au loin | «Passé le premier choc, on s'adapte. On apprend. On construit. Ensemble.» | montée progressive, percussions |
| 5. Vaincre | 37-45 s | Le train frôle la caméra, recul sur le bâtiment illuminé, drapeau tricolore. «NOUS ALLONS VAINCRE.» puis carte finale: insigne, «Cercle IA EdG-T», «Rejoins-nous». Bas d'écran: NON PROTÉGÉ, réalisé avec assistance IA | «Nous allons vaincre. Ne loupe pas encore le train. Rejoins-nous.» | apogée, coup final, résolution en ré majeur |

Aucun chiffre ni statistique inventé à l'écran (pas de «3 h → 3 min»).

## Questions ouvertes
- [x] Storyboard v1 et texte de voix off validés par l'utilisateur
- [ ] Voix off v1 à écouter et valider: Kokoro, voix `ff_siwis` (locale, via `hyperframes tts`). Nécessite un venv Python avec `kokoro-onnx soundfile` (variable `HYPERFRAMES_PYTHON`).
- [ ] Musique épique: pas de CLI heygen ici, donc génération par synthèse (comme la bande-son de la référence) ou fichier fourni par l'utilisateur
- [ ] Insigne: tenter de trouver une version plus grande, sinon rester sur celui de la référence

## Checklist de production (à suivre dans l'ordre)
1. [x] Brief de base
2. [x] Référence reçue et analysée
3. [x] Storyboard validé (scènes, durées, textes)
4. [x] Script de voix off validé (texte)
5. [ ] Identité visuelle et assets réunis (insigne HD)
6. [ ] Construction des scènes
7. [ ] Voix off et musique
8. [ ] Prévisualisation, retours scène par scène
9. [ ] Rendu final MP4 et test sur la télé

## Journal
- Brief initial enregistré.
- Réponses reçues (format 16:9, voix féminine, musique épique premium, pas de contrainte) et référence « Clip Cercle IA v2 » analysée. Storyboard et voix off proposés.
- Storyboard v1 et texte validés. Voix off v1 générée (Kokoro ff_siwis), en attente d'écoute. Route HyperFrames: /general-video.
- Voix Kokoro refusée. Voix de qualité: réseau d'environnement à ouvrir par l'utilisateur (option B). Constaté: api.openai.com et api.elevenlabs.io répondent, speech.platform.bing.com (edge-tts) bloqué. Il faut une clé API stockée dans l'environnement (jamais dans le chat) et la variable à lire doit être précisée.
- Sound design v1 jugé pas assez percutant. v2 générée (taiko, kicks, claps, roulements, crashs inversés), script dans le scratchpad `son/son2.py`.
- Insigne: utiliser celui de la référence.
