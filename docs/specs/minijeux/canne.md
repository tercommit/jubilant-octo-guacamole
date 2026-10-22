# Mini-jeu — « Saute la canne »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Jump Club / Jump Showdown** (Fall Guys)

## En une phrase (écran de règles)

**« Les cannes du moulin tournent de plus en plus vite : saute par-dessus la canne basse, mais pas sous la canne haute ! Le dernier sur la piste gagne. »**

## Principe

Sur la piste ronde d'une vieille sucrerie, deux cannes à sucre tournent autour du moulin central.
**La canne basse** balaie le sol (à 0,45 u) : il faut la sauter. **La canne haute** (à 1,55 u, à partir de 12 s)
tourne dans l'autre sens : elle passe au-dessus d'un joueur debout, mais frappe celui qui saute à ce moment-là.
Être touché envoie valser (recul fort). Les deux cannes accélèrent, et **la piste rétrécit** de 7 à 4,2 u de rayon
entre 40 et 70 s. Tomber de la piste élimine.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 75 s, ou jusqu'à ce qu'il ne reste qu'un joueur (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les survivants d'abord (à égalité), puis les éliminés, du dernier tombé au premier ; égalité = même place |

## Paramètres (`game/src/minijeux/canne/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Canne basse | 1,1 → 2,6 rad/s |
| Canne haute | 0,8 → 1,9 rad/s, dès 12 s |
| Piste | rayon 7 → 4,2 u entre 40 et 70 s |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
