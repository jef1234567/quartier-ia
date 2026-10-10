# Skills de motion design

Ce dossier contient des skills importés tels quels depuis trois dépôts publics, sans modification. Claude Code les charge automatiquement quand il est ouvert à la racine de ce dépôt. Ils ne changent rien au portail publié.

## Provenance

| Source | Skills | Version importée (commit) | Licence |
| --- | --- | --- | --- |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), dossier `skills/` | 21 skills : `hyperframes` (point d'entrée), `hyperframes-*`, `motion-graphics`, `general-video`, `media-use`, `slideshow`, `figma`, `embedded-captions`, `faceless-explainer`, `music-to-video`, `pr-to-video`, `product-launch-video`, `talking-head-recut`, `remotion-to-hyperframes` | `6f3f86a9` | Apache 2.0 |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | 12 skills `remotion-*` | `32b241b9` | Licence Remotion (voir plus bas) |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | `motion-design` | `f9a8a041` | MIT |

Import réalisé le 10 octobre 2026. Les textes de licence sont dans `.claude/licences-tiers/`.

## Points d'attention

### Télémétrie et rapports de retour HyperFrames

Les skills HyperFrames demandent à l'agent d'envoyer, après un rendu réussi, un rapport `npx hyperframes feedback` (note et commentaire) vers un canal que le skill décrit lui-même comme public. Le skill `media-use` et la commande `hyperframes` envoient aussi des compteurs d'usage anonymes à PostHog.

Le fichier `.claude/settings.json` de ce dépôt désactive ces envois par les deux variables prévues par HyperFrames : `HYPERFRAMES_NO_TELEMETRY=1` et `DO_NOT_TRACK=1`. Elles ne valent que pour les sessions Claude Code ouvertes dans ce dépôt. Dans un terminal ordinaire, lancer une fois :

    npx hyperframes telemetry disable

### Services payants et clés d'API

Rien n'est exigé pour écrire une composition et la rendre en MP4 en local. Certaines fonctions optionnelles (voix de synthèse, musique ou images générées, rendu dans le cloud) appellent des services externes et lisent des clés dans l'environnement : `HEYGEN_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `ELEVENLABS_API_KEY`. Les skills Remotion de cartographie utilisent des clés MapTiler, Mapbox ou Google Maps. Ne jamais écrire une clé dans ce dépôt, qui est public.

### Licence Remotion

Le dépôt `remotion-dev/skills` ne contient pas de fichier de licence. Il est extrait du dépôt principal de Remotion, placé sous la [licence Remotion](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md), qui n'est pas une licence open source : usage gratuit pour les particuliers et les structures de 3 personnes au plus, licence payante au-delà. À vérifier avant tout usage au profit d'une organisation.

### Scripts embarqués

Les skills HyperFrames contiennent des scripts (`.mjs`, `.cjs`, `.sh`, `.py`) que l'agent peut exécuter. Un contrôle ciblé a été fait à l'import (recherche de commandes téléchargées puis exécutées, de code obscurci, d'accès à des fichiers d'identifiants, de consignes cachées) et n'a rien relevé d'autre que la télémétrie décrite ci-dessus. Ce contrôle n'est pas une relecture ligne à ligne.

## Utilisation sur un poste

Prérequis HyperFrames : Node.js 22 ou plus, FFmpeg.

    npx hyperframes init ma-video
    cd ma-video
    npx hyperframes render

Dans Claude Code, ouvert à la racine de ce dépôt, commencer la demande par `/hyperframes` pour une vidéo HTML, ou par `/remotion-best-practices` pour un projet Remotion. Le skill `motion-design` apporte les principes d'animation (rythme, courbes d'accélération, durées) quel que soit l'outil.

## Mise à jour

Ces copies sont figées à la date d'import. Pour les rafraîchir depuis les sources :

    npx skills add heygen-com/hyperframes
    npx skills add remotion-dev/skills
    npx skills add LottieFiles/motion-design-skill
