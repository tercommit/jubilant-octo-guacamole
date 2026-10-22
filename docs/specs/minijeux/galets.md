# Mini-jeu — « Les galets traîtres »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Tip Toe** (Fall Guys)

## En une phrase (écran de règles)

**« Traverse la ravine sur les galets… mais un seul chemin est solide : les faux galets s'enfoncent dès qu'on marche dessus ! »**

## Principe

Une course : il faut traverser une ravine pavée de galets (9 rangées de 6). **Un seul chemin caché est solide**
(il avance d'au plus une colonne par rangée), plus 15 % de vrais galets en leurre. **Les faux galets**, identiques,
tremblent 0,1 s puis s'enfoncent pour le reste de la partie : les suivants voient où il ne faut pas marcher.
Tomber renvoie au dernier point de passage (le départ, puis la berge d'arrivée).

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 90 s, ou dès que tout le monde est arrivé (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les arrivés par ordre d'arrivée, puis les autres selon la distance parcourue ; égalité = même place |

## Paramètres (`game/src/minijeux/galets/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Galets | 9 rangées × 6 |
| Faux galets | s'enfoncent 0,1 s après le premier pas |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
