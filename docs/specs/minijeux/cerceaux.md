# Mini-jeu — « Les cerceaux du lagon »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Hoopsie Daisy** (Fall Guys)

## En une phrase (écran de règles)

**« Passe à travers les cerceaux : 1 point le rose, 3 points le doré perché au-dessus d'une plateforme. Saute pour les attraper ! »**

## Principe

Sur une petite île ronde avec quatre plateformes de pierre (à monter d'un saut), des cerceaux sont plantés un peu
partout : **les roses** (1 point) au sol, **les dorés** (3 points) au-dessus des plateformes. Il faut **passer à travers**
(dans un sens ou dans l'autre). Un cerceau pris réapparaît ailleurs 0,8 s plus tard. Il y a toujours (2 + nombre de
joueurs) cerceaux. Tomber à l'eau fait réapparaître au centre.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 60 s (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Aux points ; égalité = même place ; égalité = même place |

## Paramètres (`game/src/minijeux/cerceaux/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Cerceaux | 2 + nombre de joueurs, 30 % de dorés |
| Points | 1 (rose), 3 (doré) |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
