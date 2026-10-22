# Mini-jeu — « Les vagues de Boucan »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Block Party** (Fall Guys)

## En une phrase (écran de règles)

**« Des murs d'eau déferlent sur la plage : glisse-toi dans les trous, saute les vagues basses… sinon tu finis dans le lagon ! »**

## Principe

Sur la plage de Boucan Canot (12 × 10 u), des vagues arrivent du fond et traversent la plage. Chaque vague est faite
de 8 blocs : **des trous** (on passe), **des blocs bas** (0,6 u : on les saute) et **des blocs hauts** (2,6 u : on les évite).
Chaque vague a au moins un trou et un bloc bas. Une vague pousse devant elle les joueurs qu'elle rattrape, jusqu'au lagon.
Les vagues sont de plus en plus rapides (3 → 6,5 u/s) et rapprochées (4,2 → 2,4 s), avec de plus en plus de blocs hauts.
Tomber à l'eau élimine.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 70 s, ou jusqu'à ce qu'il ne reste qu'un joueur (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les survivants d'abord (à égalité), puis les éliminés, du dernier tombé au premier ; égalité = même place |

## Paramètres (`game/src/minijeux/houle/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Plage | 12 × 10 u |
| Vagues | 8 blocs, 3 → 6,5 u/s, toutes les 4,2 → 2,4 s |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
