---
name: video-edgt
description: Produire un short vertical (9:16) de démonstration d'un skill EDG ou une pub pour le Cercle IA EdG-T / Quartier IA, avec HyperFrames, voix ElevenLabs et musique fournie. À utiliser pour toute nouvelle vidéo du cercle, ou pour reprendre la vidéo « La Fichette ».
---

# Vidéo Cercle IA EdG-T

Avant toute action, lire `videos/PROCESS.md` : c'est la source de vérité (préférences, charte, outils, pièges, état d'avancement). Ce skill n'en est que le déclencheur et la check-list.

## Règles permanentes
- Répondre en français. Poser les questions nécessaires, économiser les tokens, vérifier ce qu'on affirme, ne jamais mentir (dire ce qu'on n'a pas pu vérifier, par exemple l'écoute de l'audio).
- Dépôt public : aucun contenu sensible ou à diffusion restreinte. Exemples neutres (projet « espaces verts »).
- 1080×1920, ton décontracté, style animé et dynamique, **aucune mascotte**, pas de visage. Charte du Quartier IA (voir PROCESS.md).
- Ne pas créer de pull request sans demande explicite. Travailler sur la branche indiquée par la session, committer et pousser.

## Déroulé
1. **Brief** : sujet, durée (30 s par défaut), contenu exact du skill à montrer. Lire le `SKILL.md` du skill EDG concerné (zip fourni par l'utilisateur) et ne montrer que ce qu'il fait réellement.
2. **Script** découpé en lignes courtes + `SCRIPT.md`. Texte balisé pour **ElevenLabs Eleven v3** (balises entre crochets, pauses par « ... ») dans `SCRIPT-elevenlabs.md`. L'utilisateur génère la voix et fournit l'audio.
3. **Musique** : fournie par l'utilisateur, ou proposer des options gratuites (YouTube Audio Library en priorité Google, vérifier la licence).
4. **Storyboard** : `STORYBOARD.md` + esquisses `storyboard.html` (v1, puis plus dynamique), capture d'écran envoyée à l'utilisateur ; valider avant de construire.
5. **Calage** : transcrire la voix (`npx hyperframes transcribe … --language fr`) pour obtenir le début de chaque ligne ; en déduire les durées des scènes.
6. **Composition** : `index.html` monolithique, une timeline GSAP, scènes en `class="clip"`, polices locales (`public/fonts/`), pas d'emoji, `immediateRender:false` sur les `fromTo` répétés.
7. **Contrôles** : `npx hyperframes check` sans erreur, `snapshot` des moments clés, regarder les images.
8. **Rendu** : standard pour la revue (`renders/…-vN.mp4`), envoyer le fichier à l'utilisateur, recueillir ses retours (rythme, volume musique, prononciation), puis `--quality high` seulement après validation.
9. **Mémoire** : mettre à jour `videos/PROCESS.md` (état, nouveaux pièges) et pousser.

## À ne pas faire
- Ne pas affirmer qu'une voix ou une musique « sonne bien » sans l'avoir entendue.
- Ne pas supposer l'insigne en haute définition : l'actuel fait 250×329 px.
- Ne pas inventer les conditions de licence : citer la source, signaler quand elle est tierce.
