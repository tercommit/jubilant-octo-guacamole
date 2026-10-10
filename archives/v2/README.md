# La Gardienne

Jeu web 2D jouable dans le navigateur. On lance des boules de feu, puis on courbe leur trajectoire
en **inclinant le téléphone** (gyroscope). L'histoire et les règles sont dans `HISTOIRE.md`.

**Jouer :** https://tercommit.github.io/jubilant-octo-guacamole/archives/v2/

> Version archivée (V2) : le contrôle au gyroscope s'est révélé peu pratique. Elle reste jouable.

## Comment jouer

1. Toucher **Commencer**. Sur iPhone, Safari demande l'accès aux mouvements : accepter.
2. Tenir le téléphone comme on est bien installé, sans bouger : c'est la calibration.
3. **Toucher l'écran n'importe où** pour lancer une boule de feu.
4. **Pencher le téléphone** pendant qu'elle vole : elle accélère dans ce sens. Elle a de
   l'inertie, et tremble un peu : c'est la rage de la gardienne.
5. Brûler toutes les cibles de la zone avec un nombre de tirs limité. Une boule traverse les
   cibles : une bonne courbe peut en brûler plusieurs. Les troncs l'éteignent.

- **Appui long** (1 s) n'importe où : recalibrer.
- **Inverser G/D, Inverser H/B** (écran d'accueil) : si un axe part dans le mauvais sens.
- **Sans gyroscope** : glisser le doigt pour courber la boule, ou flèches et Espace au clavier.
- La progression (zone atteinte) est sauvegardée dans le navigateur.

## Contenu actuel

1. **La lisière** : cristaux et piège à découvert, pour apprendre à doser. Fond : un travelling animé à travers la forêt au crépuscule.
2. **Le sous-bois** : troncs et branche à contourner.
3. **La forêt profonde** : chauves-souris et bête d'ombre qui bougent.

Graphismes, bruitages et musique d'ambiance viennent de ressources libres (CC0), listées dans
`assets/CREDITS.md`. La musique se coupe depuis l'écran d'accueil (bouton **Musique**) ou avec la touche M.

À venir : le cœur corrompu (vents magiques, contrôles inversés), puis le chasseur et l'entité.

## Fichiers

- `index.html` : la page et l'écran d'accueil
- `js/tilt.js` : lecture du gyroscope et calibration
- `js/zones.js` : les zones (cibles, obstacles, couleurs) et les textes de l'histoire
- `js/assets.js` : chargement des images et des sons
- `js/game.js` : le jeu (boule de feu, collisions, affichage)
- `assets/` : images, sons et musique, avec leurs crédits dans `assets/CREDITS.md`
- `player.png` : la gardienne (planche d'images de la magicienne)
- `test-gyro/` : la page de test du gyroscope

## Publier avec GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.

## Licence

Le code est placé dans le domaine public sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `../../LICENSE`.

Les ressources de `assets/` sont aussi en CC0, par leurs auteurs respectifs (voir `assets/CREDITS.md`).

**Exception :** la gardienne (`player.png`) n'est pas couverte par CC0. Elle est tirée du pack
« sample (idle & walk) » publié sur itch.io (fichier 16345894 du projet 4245635), retournée pour
regarder vers la droite. Elle reste soumise à la licence choisie par son auteur ou autrice.
