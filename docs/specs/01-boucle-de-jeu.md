# 01 — Boucle de jeu

> Statut : brouillon v0.1 · 17/10/2026

## Déroulé d'une partie

1. **Préparation**
   - 1 à 4 joueurs rejoignent la partie en appuyant sur un bouton de leur manette, puis choisissent leur avatar.
   - Choix du nombre de tours : 10, 15 ou 20.
   - Chaque joueur commence avec **10 zarlor** et **0 vanille**.
   - L'ordre de jeu est tiré par un lancer de dé ; le plus haut commence.
2. **Tours** (répétés N fois, voir ci-dessous)
3. **Fin de partie** : classement final, puis écran de victoire.

## Déroulé d'un tour

1. **Phase plateau.** Dans l'ordre de jeu, chaque joueur :
   1. lance le dé (**1 à 10**) ;
   2. avance case par case, en choisissant sa direction aux embranchements ;
   3. s'il passe sur la case de la **vanille**, il peut l'acheter (voir plus bas) ;
   4. subit l'effet de la case d'arrivée (types de cases : à définir plus tard).
2. **Phase mini-jeu.** Une fois que tous les joueurs ont joué :
   1. un mini-jeu est tiré au sort, en évitant de reprendre celui du tour précédent ;
   2. un écran de règles l'explique en une phrase, avec les boutons utilisés ;
   3. les joueurs signalent qu'ils sont prêts, puis le mini-jeu dure 30 à 60 s ;
   4. les zarlor sont distribués selon le classement.
3. **Fin du tour.** Récapitulatif rapide des zarlor et des vanilles de chacun.

## Gains des mini-jeux

| Joueurs | 1er | 2e | 3e | 4e |
|---|---|---|---|---|
| 4 | 10 | 5 | 2 | 0 |
| 3 | 10 | 5 | 0 | — |
| 2 | 10 | 3 | — | — |
| 1 (solo) | 10 | — | — | — |

En cas d'égalité, les joueurs ex æquo reçoivent tous le gain de la meilleure place.

## La vanille

- Une gousse de vanille est posée sur une case du plateau.
- Quand un joueur **passe dessus ou s'y arrête**, il peut l'acheter pour **20 zarlor**.
- Après un achat, la vanille réapparaît sur une autre case, tirée au hasard, à au moins 10 cases de sa position précédente.
- Un joueur peut acheter une seule vanille par passage.

## Victoire

1. Le joueur qui a le **plus de vanilles** gagne.
2. En cas d'égalité : celui qui a le plus de **zarlor**.
3. Si l'égalité persiste : victoire partagée.

> Idée pour plus tard : des « bonus de fin de partie » à la Mario Party (le plus de mini-jeux gagnés, le plus de
> zarlor dépensés…), chacun rapportant +1 vanille.

## Ordre de jeu

L'ordre fixé au début reste le même pendant toute la partie.

## Commandes (manette)

| Action | Manette |
|---|---|
| Lancer le dé | A |
| Choisir une direction | Stick ou croix directionnelle, puis A |
| Acheter la vanille | A pour acheter, B pour refuser |
| Mini-jeux | Stick + A / B (détail dans chaque fiche) |
| Pause | Start / Options |

## Paramètres à équilibrer en test

| Paramètre | Valeur de départ |
|---|---|
| Zarlor au départ | 10 |
| Prix de la vanille | 20 |
| Dé | 1 à 10 |
| Durée d'un mini-jeu | 30 à 60 s |
| Distance minimale de réapparition de la vanille | 10 cases |

Ces valeurs seront regroupées dans un fichier de configuration pour pouvoir les ajuster sans toucher au code.
