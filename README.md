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
- Sauvegarde automatique du niveau atteint dans le navigateur (`localStorage`) : à la réouverture, on reprend au même niveau, ou on clique sur « Nouvelle partie » (touche N)
- Les sons sont générés en direct avec la Web Audio API (aucun fichier audio)

## Fichiers

- `index.html` : la page, l'interface et les contrôles tactiles
- `game.js` : le moteur (physique, collisions, ennemis, affichage)
- `sprites.js` : le pixel art des décors, ennemis et pièces, dessiné sous forme de texte
- `player.png` : la planche d'images du personnage (attente et marche)
- `levels.js` : les cartes des niveaux, modifiables à la main (la légende est en haut du fichier)

## Publier avec GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.

## Licence

Le code, les niveaux et les graphismes de `sprites.js` sont placés dans le domaine public sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `LICENSE`.

**Exception :** le personnage (`player.png`) n'est pas couvert par CC0. Il est tiré du pack
« sample (idle & walk) » publié sur itch.io (fichier 16345894 du projet 4245635), réduit à 50 %
et retourné pour regarder vers la droite. Il reste soumis à la licence choisie par son auteur ou autrice.

Pour remplacer les graphismes, les packs de [Kenney](https://kenney.nl/assets) (par exemple
« Pixel Platformer ») sont eux aussi en CC0 et utilisent des tuiles de 16×16 px.
