# Mini-jeu — « La queue du margouillat »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Tail Tag** (Fall Guys)

## En une phrase (écran de règles)

**« Vole les queues de margouillat avec B ! Chaque seconde avec une queue rapporte un point, et en avoir une à la fin rapporte 10 points de plus. »**

## Principe

Sur la même île à plateformes que les cerceaux. La moitié des joueurs (au moins un) commence avec une queue de
margouillat. **B près d'un porteur (1,5 u) lui vole sa queue** ; il est un instant sonné. Une queue qu'on vient
d'attraper clignote et ne peut pas être reprise pendant 1,5 s. Loin d'un porteur, B pousse comme d'habitude.
**Chaque seconde avec une queue rapporte un point**, et avoir une queue à la fin rapporte 10 points.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 60 s (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : voler une queue (près d'un porteur), sinon pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Aux points ; égalité = même place ; égalité = même place |

## Paramètres (`game/src/minijeux/margouillat/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Queues | la moitié des joueurs, au moins une |
| Vol | B à moins de 1,5 u |
| Protection | 1,5 s |
| Bonus de fin | 10 points |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
