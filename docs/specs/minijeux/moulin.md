# Mini-jeu — « Le moulin à cannes »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Roll Out** (Fall Guys)

## En une phrase (écran de règles)

**« Les rouleaux du moulin tournent sous tes pieds, chacun dans son sens. Évite les trous, reste en haut… et ne finis pas dans la cuve de vesou ! »**

## Principe

Trois énormes rouleaux de moulin (rayon 7 u, 4,1 u de large) tournent côte à côte, dans des sens alternés,
de plus en plus vite (0,12 → 0,3 rad/s). Ils sont faits de lattes ; **22 % des demi-lattes manquent** (jamais au sommet
au départ). Le rouleau entraîne les joueurs, et **on glisse vers le bord** quand on s'éloigne du sommet.
Tomber (dans un trou ou par le bord) élimine.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 70 s, ou jusqu'à ce qu'il ne reste qu'un joueur (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les survivants d'abord (à égalité), puis les éliminés, du dernier tombé au premier ; égalité = même place |

## Paramètres (`game/src/minijeux/moulin/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Rouleaux | 3, rayon 7 u, 36 lattes coupées en deux |
| Rotation | 0,12 → 0,3 rad/s |
| Trous | 22 % des demi-lattes |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
