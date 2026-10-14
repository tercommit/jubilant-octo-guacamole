# La Gardienne (V3)

Jeu web jouable dans le navigateur, en fausse 3D. La gardienne lance une boule de feu, puis la caméra plonge
derrière la boule et on la suit dans la forêt. On la guide seulement **à gauche ou à droite**, en penchant le
téléphone. L'histoire et les règles sont dans `HISTOIRE.md`.

**Jouer :** https://tercommit.github.io/jubilant-octo-guacamole/archives/v3/

## Comment jouer

1. Toucher **Commencer**. Sur iPhone, Safari demande l'accès aux mouvements : accepter.
2. Tenir le téléphone en paysage, comme on est bien installé, sans bouger : c'est la calibration.
3. **Toucher l'écran** pour lancer une boule de feu. La caméra la suit.
4. **Pencher le téléphone à gauche ou à droite**, comme un volant : la boule se décale de ce côté.
5. Passer dans les cibles pour les brûler (la boule les traverse) et éviter les troncs, qui l'éteignent.
   Au bout du chemin, on revient à la gardienne pour le tir suivant. Les cibles brûlées le restent.

- La barre en haut de l'écran montre le chemin en miniature : les cibles restantes, les troncs et la boule.
- **Appui long** (1 s) avant un lancer : recalibrer.
- **Inverser G/D** (écran d'accueil) : si la boule part du mauvais côté.
- **Sans gyroscope** : pendant la course, garder le doigt sur la moitié gauche ou droite de l'écran,
  ou utiliser les flèches du clavier (Espace pour lancer). Le doigt marche aussi avec le gyroscope.
- La progression (zone atteinte) est sauvegardée dans le navigateur.

## Ce qui change par rapport à la V2

- Vue de poursuite en fausse 3D au lieu de la vue de côté.
- Seulement gauche / droite, sans inertie ni tremblement : beaucoup plus simple à guider.
- Nouveau fond pour la lisière : une fin de journée calme et immobile, à la place du travelling animé.

## Contenu actuel

1. **La lisière** : cristaux et pièges à découvert, pour apprendre à viser.
2. **Le sous-bois** : troncs et arbre couché à contourner.
3. **La forêt profonde** : chauves-souris et bêtes d'ombre qui bougent de gauche à droite.

Graphismes, bruitages et musique d'ambiance viennent de ressources libres (CC0), listées dans
`assets/CREDITS.md`. La musique se coupe depuis l'écran d'accueil (bouton **Musique**) ou avec la touche M.

À venir : le cœur corrompu (vents magiques, contrôles inversés), puis le chasseur et l'entité.

## Fichiers

- `index.html` : la page et l'écran d'accueil
- `js/tilt.js` : lecture du gyroscope et calibration
- `js/zones.js` : les zones (cibles, troncs, couleurs, longueur du chemin) et les textes de l'histoire
- `js/assets.js` : chargement des images et des sons
- `js/game.js` : le jeu (lancer, vue de poursuite, collisions, affichage)
- `assets/` : images, sons et musique, avec leurs crédits dans `assets/CREDITS.md`
- `player.png` : la gardienne (planche d'images de la magicienne)

## Licence

Le code est placé dans le domaine public sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `../../LICENSE`.

Les ressources de `assets/` sont aussi en CC0, par leurs auteurs respectifs (voir `assets/CREDITS.md`).

**Exception :** la gardienne (`player.png`) n'est pas couverte par CC0. Elle est tirée du pack
« sample (idle & walk) » publié sur itch.io (fichier 16345894 du projet 4245635), retournée pour
regarder vers la droite. Elle reste soumise à la licence choisie par son auteur ou autrice.
