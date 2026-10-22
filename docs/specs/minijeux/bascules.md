# Mini-jeu — « Les bascules »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **See Saw** (Fall Guys)

## En une phrase (écran de règles)

**« Traverse l'étang de Saint-Paul sur les bascules : elles penchent sous ton poids… et sous celui des autres ! Les premiers arrivés gagnent. »**

## Principe

Une course sur l'étang de Saint-Paul : des pontons fixes et, entre eux, trois longues planches posées sur un pivot.
**Une bascule penche du côté où pèsent les joueurs** (jusqu'à 0,38 rad) et revient doucement à l'horizontale.
On glisse vers le bas d'une planche penchée ; son bout relevé fait mur (on attend qu'il redescende, ou on saute dessus).
Tomber à l'eau renvoie au dernier ponton.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 80 s, ou dès que tout le monde est arrivé (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les arrivés par ordre d'arrivée, puis les autres selon la distance parcourue ; égalité = même place |

## Paramètres (`game/src/minijeux/bascules/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Bascules | 3, de 9,5 u, décalées |
| Angle max | 0,38 rad |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
