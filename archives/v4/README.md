# Démo V4

Le gameplay de la V3, et rien d'autre : pas d'histoire, pas de personnage, pas de décor ni de musique.
Tout est dessiné avec des formes simples.

**Jouer :** https://tercommit.github.io/jubilant-octo-guacamole/archives/v4/

## Comment jouer

1. **Toucher l'écran** (ou Espace) pour lancer la boule.
2. **Garder le doigt** sur la moitié gauche ou droite de l'écran (ou flèches) pour la décaler.
3. Traverser les **carrés jaunes** (fixes) et **bleus** (qui bougent) pour les brûler.
   Les **troncs noirs** éteignent la boule.

Six boules pour six cibles. Quand toutes les cibles sont brûlées, ou qu'il n'y a plus de boules, le niveau recommence.

## Ce qui change par rapport à la V3

La V4 part d'une copie de la V3, dont on a retiré tout ce qui n'est pas le gameplay :

- histoire, gardienne, cerf, écran d'accueil, textes et zones nommées ;
- décors illustrés, sprites, musique et bruitages enregistrés (`assets/`, `player.png`, `HISTOIRE.md`) ;
- gyroscope et calibration (`js/tilt.js`) : on guide au doigt ou au clavier ;
- les trois zones (`js/zones.js`) : un seul niveau, qui recommence.

Le moteur (vue de poursuite, vitesse, virage, collisions) est le même que dans la V3.

## Fichiers

- `index.html` : la page
- `js/game.js` : tout le jeu, avec le niveau en haut du fichier (`LEVEL`)
- `apercu.jpg` : l'image de la page d'accueil

## Licence

[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `../../LICENSE`.
