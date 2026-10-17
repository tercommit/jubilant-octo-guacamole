# 02 — Le plateau (V1)

> Statut : brouillon v0.1 · 17/10/2026 · Implémenté dans `game/src/plateau/`

## L'île

- Une île low poly ovale (la forme définitive viendra plus tard), entourée du lagon.
- Au milieu, le Piton des Neiges ; des arbres et des rochers un peu partout.

## Les cases

- **La côte** : une boucle de **30 cases** (bleues) qui fait le tour de l'île. La case 0 (jaune) est le départ.
- **Le Chemin des Hauts** : à la case 4, un **embranchement** permet de couper par le milieu de l'île
  (7 cases vertes) pour rejoindre la côte à la case 14. Il est un peu plus court (8 pas au lieu de 10) :
  il sert surtout à aller chercher la vanille quand elle est de ce côté.
- Les cases n'ont pas encore d'effet (types de cases : à définir plus tard).

## Déroulé (voir `01-boucle-de-jeu.md`)

1. **Réglages** : J1 choisit le nombre de tours (10, 15 ou 20).
2. **Qui commence ?** Chacun appuie sur A pour lancer le dé. Le tirage est sans remise : pas d'égalité possible.
3. **Tours** : chaque joueur lance le dé (A), avance case par case, choisit sa route à l'embranchement
   (stick, puis A), et peut acheter la vanille en passant dessus (A acheter, B refuser).
4. **Mini-jeu** tiré au sort (jamais le même deux fois de suite), puis bilan du tour avec les zarlor gagnés.
5. **Fin** : classement par vanilles, puis zarlor.

## Commandes

| Action | Manette |
|---|---|
| Lancer le dé | A |
| Choisir la route | Stick vers la flèche, puis A |
| Acheter la vanille | A acheter · B refuser |
| Écrans de transition | A (n'importe quel joueur) |
| Pause | Start |

## Caméra

Vue d'ensemble de l'île pendant les écrans de transition ; gros plan qui suit le pion du joueur qui joue.

## Solo

On peut jouer seul (plateau et mini-jeux). En solo, un mini-jeu rapporte toujours 10 zarlor :
un barème selon la performance reste à définir.

## Paramètres (`game/src/plateau/config.js`)

| Paramètre | Valeur |
|---|---|
| Tours | 10, 15 ou 20 |
| Zarlor au départ | 10 |
| Prix de la vanille | 20 |
| Dé | 1 à 10 |
| Distance minimale de réapparition de la vanille | 10 cases |
