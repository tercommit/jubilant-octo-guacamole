# Mini-jeu — « Fruits péi »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Perfect Match** (Fall Guys)

## En une phrase (écran de règles)

**« Mémorise les fruits sur les dalles. Quand un fruit est annoncé, cours sur une de ses dalles : toutes les autres tombent dans le lagon ! »**

## Principe

Seize dalles (4 × 4) flottent sur le lagon, chacune avec un fruit : letchi, mangue, ananas, banane, coco.
Chaque manche : **les fruits sont visibles** (5 s à la première manche, 2,5 s à la dernière), **puis cachés** pendant
qu'un fruit est annoncé (en grand au-dessus des dalles et dans le bandeau, avec un compte à rebours de 3 s),
**puis toutes les autres dalles tombent** pendant 2,5 s. Il y a toujours au moins deux bonnes dalles.
Les manches ont de 3 à 5 sortes de fruits. Tomber à l'eau élimine.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 6 manches (environ 70 s), ou jusqu'à ce qu'il ne reste qu'un joueur (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les survivants d'abord (aux manches survécues), puis les éliminés, du dernier tombé au premier ; égalité = même place |

## Paramètres (`game/src/minijeux/fruits/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Manches | 6 |
| Mémoire | 5 → 2,5 s |
| Annonce | 3 s |
| Fruits | 3 → 5 sortes |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
