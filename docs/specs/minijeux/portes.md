# Mini-jeu — « Les portes des cases »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Door Dash** (Fall Guys)

## En une phrase (écran de règles)

**« Fonce dans les portes des cases créoles : les vraies s'ouvrent, les fausses te renvoient en arrière ! Les premiers arrivés gagnent. »**

## Principe

Une course à travers quatre façades de cases créoles (lambrequins, tôle rouge), de 5 portes chacune.
**Les vraies portes s'ouvrent** quand on fonce dedans (stick vers l'avant) ; **les fausses**, identiques, renvoient en
arrière. Une fois ouverte, une porte le reste pour tout le monde. 3 vraies portes dans les deux premières façades,
2 dans les deux dernières.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 60 s, ou dès que tout le monde est arrivé (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les arrivés par ordre d'arrivée, puis les autres selon la distance parcourue ; égalité = même place |

## Paramètres (`game/src/minijeux/portes/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Façades | 4, de 5 portes |
| Vraies portes | 3, 3, 2, 2 |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
