# Petit Saut

Un mini jeu de plate-forme 2D en pixel art, jouable dans le navigateur.
Il est écrit en HTML, CSS et JavaScript, sans aucune dépendance.

**Jouer :** https://tercommit.github.io/jubilant-octo-guacamole/ (une fois GitHub Pages activé)

## Commandes

| Action  | Clavier                    | Mobile        |
|---------|----------------------------|---------------|
| Bouger  | ← → ou Q / D (ou A / D)    | Boutons ◀ ▶  |
| Sauter  | Espace, ↑, Z ou W          | Bouton ▲      |
| Pause   | P ou Échap                 |               |

Plus on maintient le saut, plus on saute haut. Pour écraser un slime, il faut lui sauter dessus.

## Contenu

- 3 niveaux, avec des pièces, des ennemis, des piques et un drapeau d'arrivée
- 3 vies (en cas de mort, le niveau recommence)
- Les sons sont générés en direct avec la Web Audio API (aucun fichier audio)

## Fichiers

- `index.html` : la page, l'interface et les contrôles tactiles
- `game.js` : le moteur (physique, collisions, ennemis, affichage)
- `sprites.js` : tout le pixel art, dessiné sous forme de texte
- `levels.js` : les cartes des niveaux, modifiables à la main (la légende est en haut du fichier)

## Publier avec GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.

## Licence

Tout le projet (code, graphismes, niveaux) est placé dans le domaine public sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `LICENSE`.

Pour remplacer les graphismes, les packs de [Kenney](https://kenney.nl/assets) (par exemple
« Pixel Platformer ») sont eux aussi en CC0 et utilisent des tuiles de 16×16 px.
