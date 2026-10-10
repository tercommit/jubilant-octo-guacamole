# Petit Saut

Un mini jeu de plate-forme 2D en pixel art, jouable dans le navigateur.
Il est écrit en HTML, CSS et JavaScript, sans aucune dépendance.

**Jouer :** https://tercommit.github.io/jubilant-octo-guacamole/archives/v1/

> Version archivée (V1) : conservée telle quelle dans ce dossier, et toujours jouable.

## Commandes

| Action  | Clavier                    | Mobile        |
|---------|----------------------------|---------------|
| Bouger  | Flèches ou Z Q S D (ou W A S D) | Croix ◀ ▲ ▼ ▶ |
| Sauter  | Espace, ↑, Z ou W          | Bouton A      |
| Entrer, boire, lire (sur l'île) | Espace ou Entrée | Bouton A |
| Bouclier (une fois trouvé) | X                | Bouton B      |
| Ravageuse (une fois trouvée, coûte une vie) | C | Bouton R, à maintenir ½ s |
| Pause   | P ou Échap                 |               |

Plus on maintient le saut, plus on saute haut. Pour écraser un slime, il faut lui sauter dessus.

## Contenu

- L'île de Brumelune, vue de dessus (style Pokémon) : on s'y déplace case par case et on entre
  dans les missions. Les arbres passent devant le personnage (effet 2.5D).
- 3 missions (forêt brumeuse, marais empoisonné, volcan) : chacune ouvre, dans la brume, le chemin de la suivante
- La forêt brumeuse donne le bouclier (2 s d'invincibilité, 4 s de recharge) et fait tomber des
  pluies de slime des nuages de brume
- Le marais donne la ravageuse (détruit tous les ennemis à l'écran, coûte une vie), avec un gardien
  de pierre, des slimes à piques et du poison
- Le volcan se termine par le combat contre le Roi des slimes, avec deux fins possibles
- Des lanternes servent de points de reprise après une mort
- La source de soin, au centre de l'île, redonne toutes les vies : c'est le seul endroit où se soigner
- 3 vies (en cas de mort, la mission recommence ; sans vie, on se réveille près de la source)
- Sauvegarde automatique dans le navigateur (`localStorage`) : missions terminées, vies, pièces et position
  sur l'île. Pour recommencer, cliquer sur « Nouvelle partie » (touche N)
- L'histoire et les règles prévues sont décrites dans `HISTOIRE.md`
- Les sons sont générés en direct avec la Web Audio API (aucun fichier audio)

## Fichiers

- `index.html` : la page, l'interface et les contrôles tactiles
- `game.js` : le moteur (physique, collisions, ennemis, affichage)
- `world.js` : l'île (carte modifiable à la main, légende en haut du fichier), les missions et les textes
- `boss.js` : le Roi des slimes, le combat final et les deux fins
- `sprites.js` : le pixel art des décors, ennemis et pièces, dessiné sous forme de texte
- `player.png` : la planche d'images du personnage (attente et marche)
- `levels.js` : les cartes des niveaux, modifiables à la main (la légende est en haut du fichier)

## Publier avec GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.

## Licence

Le code, les niveaux et les graphismes de `sprites.js` sont placés dans le domaine public sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `../../LICENSE`.

**Exception :** le personnage (`player.png`) n'est pas couvert par CC0. Il est tiré du pack
« sample (idle & walk) » publié sur itch.io (fichier 16345894 du projet 4245635), retourné pour regarder vers la droite.
Il reste soumis à la licence choisie par son auteur ou autrice.

Pour remplacer les graphismes, les packs de [Kenney](https://kenney.nl/assets) (par exemple
« Pixel Platformer ») sont eux aussi en CC0 et utilisent des tuiles de 16×16 px.
