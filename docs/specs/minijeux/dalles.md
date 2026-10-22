# Mini-jeu — « Les dalles de la Fournaise »

> Statut : brouillon v0.1 · 22/10/2026 · Inspiré de **Hex-A-Gone** (Fall Guys)

## En une phrase (écran de règles)

**« Chaque dalle touchée se fissure puis tombe. Saute, change d'étage… le dernier debout au-dessus de la lave gagne ! »**

## Principe

Dans le cratère de la Fournaise, trois étages de dalles hexagonales (disques de rayon 4, soit 61 dalles par étage)
sont suspendus au-dessus d'un lac de lave, à 7 u, 3,5 u et 0 u. **Une dalle sur laquelle on pose le pied se fissure**
(elle tremble et pâlit) **et tombe 0,55 s plus tard**. On dégringole d'étage en étage ; tomber dans la lave élimine.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | 90 s, ou jusqu'à ce qu'il ne reste qu'un joueur (aucun en solo) (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les survivants d'abord (le plus haut étage gagne), puis les éliminés, du dernier tombé au premier ; égalité = même place |

## Paramètres (`game/src/minijeux/dalles/config.js`)

| Paramètre | Valeur |
|---|---|
| Vitesse | 5 u/s |
| Saut | 7,5 u/s (≈ 1,2 u de haut), gravité 24 u/s² |
| Étages | 7, 3,5 et 0 u |
| Dalles | disque de rayon 4, tuiles de 1,7 u |
| Fissure | 0,55 s avant la chute |

Le saut, les chutes et la lutte viennent du socle commun `game/src/commun/saut/` (voir `../05-saut.md`).
