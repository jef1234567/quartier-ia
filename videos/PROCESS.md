# Process de production des vidéos — Cercle IA EdG-T (Quartier IA)

Mémoire du projet : à relire au début de toute nouvelle vidéo. Dépôt public : aucun contenu sensible ou à diffusion restreinte.

## Préférences de l'utilisateur
- Poser les questions nécessaires, économiser les tokens, vérifier ce qu'on affirme, ne jamais mentir.
- Réponses en français. Public : tous les officiers de l'EdG-T. Format smartphone vertical 9:16 (1080×1920).
- Ton décontracté, style animé (texte cinétique, pastilles, pages), **aucune mascotte**, pas de visage. Du peps : fonds de couleur, titres géants, coupes franches.
- Exemples sans contenu sensible : utiliser un projet « espaces verts », jamais de sujets nucléaires ou opérationnels.
- Signature : insigne EdG (`videos/fichette-short/public/logo-edg.png`, 250×329 px, basse définition) + « Cercle IA EdG-T » + « Rejoins le quartier ».

## Charte graphique (Quartier IA, lue dans `source/src/page.html`)
Fond crème #E8E5DF · texte #1B1F2A · gris #666B78 · trait #D6D2CA · rouge #D3262E · laiton #8F7228 · blanc.
Titres Marcellus (graisse 400 seulement), texte IBM Plex Sans, données IBM Plex Mono. Style « capsule » : pastilles à contour épais, ombre décalée légère.
Sur fond encre, utiliser #FF5A60 (rouge clair) et #D0AE57 (laiton clair) pour le contraste. Polices locales dans `public/fonts/` (woff2 latin, téléchargés depuis Google Fonts).

## Chaîne d'outils retenue
- **Claude** : script, storyboard, code. **HyperFrames** (choix de l'utilisateur) : composition HTML + GSAP rendue en MP4. Remotion non utilisé.
- **Voix** : ElevenLabs, modèle **Eleven v3** (les balises `[sighs]`, `[curious]`, `[excited]`… ne fonctionnent qu'avec v3, pas Multilingual v2 ; pauses par « ... »). Forfait gratuit : usage non commercial + mention ElevenLabs (vérifié sur sites tiers, pas sur leurs conditions officielles). Google Flow s'est révélé difficile pour l'utilisateur ; Google AI Studio (synthèse vocale Gemini) est une alternative ; Kokoro local (`ff_siwis`) fonctionne en secours.
- **Musique** : fichier fourni par l'utilisateur (`Fichette_IA_Tech_Beat.m4a`, 2 min 41, ~126 BPM). Pistes gratuites possibles : YouTube Audio Library (vérifier la licence), Flow Music de Google Labs (filigrane SynthID).
- Mascotte supprimée sur demande.

## Pipeline suivi (workflow `faceless-explainer` de HyperFrames)
1. Brief → `BRIEF.md`. 2. Charte → `frame.md` (preset `capsule` corrigé à la main : fond crème, texte IBM Plex Sans). 3. Script + storyboard → `SCRIPT.md`, `STORYBOARD.md` (validés en chat). 4. Esquisses → `storyboard.html` (v1, puis v2 plus dynamique), validées. 5. Audio fourni par l'utilisateur. 6. Composition `index.html` (7 scènes, timeline GSAP unique). 7. `npx hyperframes check` puis rendu `npx hyperframes render`.
Les scènes sont calées sur le début de chaque ligne de voix, mesuré par transcription locale (`npx hyperframes transcribe … --model small --language fr`).

## Pièges rencontrés (à ne pas refaire)
- Esquisse HTML : les unités `cqw` ne rendaient pas correctement dans la capture ; remplacées par `calc(N * var(--u))`.
- Texte blanc sur pastilles blanches : forcer `color:#1B1F2A` sur `.pill`/`.card`.
- `hyperframes check` : `immediateRender:false` sur les `fromTo` répétés sur la même propriété d'un élément ; polices avec `@font-face` locaux ; pas d'emoji (police absente au rendu) ; chaque `<audio>` a un `id`.
- `npx hyperframes beats` exige un `<audio data-timeline-role="music">` dans la composition. L'analyse n'a pas donné de grille régulière : musique non calée sur les temps forts.
- La transcription locale se trompe sur certains mots (« à quatre paysages ») : les textes affichés viennent de `SCRIPT.md`, pas de la transcription.

## État au 2026-10-12 (projet `videos/fichette-short/`)
- Rendu v1 standard : `renders/fichette-v1.mp4` (28 s, voix + musique). **Pas encore validé par l'utilisateur** : à écouter (équilibre voix/musique à 30 %, prononciation « A4 paysage » et « nom normé »).
- Reste : retours de l'utilisateur, éventuelle insigne haute définition, rendu final `--quality high`.
- Contenu du skill Fichette respecté dans la vidéo : A4 paysage, deux colonnes, conférence/visite/sujet, décodage des notes, sources ouvertes, bouton « Enregistrer la fichette » (nom normé + PDF), le rédacteur relit et valide, installation « 5 min » (confirmée par l'utilisateur).

## Pour une nouvelle vidéo (démo d'un autre skill EDG, autre short)
Copier la démarche : brief, script, storyboard v1/v2 en `storyboard.html`, validation, voix ElevenLabs v3 en une piste (texte balisé), musique, composition HyperFrames, `check`, rendu standard, retours, rendu final. Réutiliser la charte et `public/fonts/`.
