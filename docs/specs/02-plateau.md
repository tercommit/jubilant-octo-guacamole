# 02 — Le plateau (V1)

> Statut : brouillon v0.1 · 17/10/2026 · Implémenté dans `game/src/plateau/`

## L'île

- La vraie Réunion en low poly : forme et relief tirés du MNT Copernicus GLO-30 (`cartes/export_plateau.py`,
  1 unité = 2,4 km, altitudes exagérées ×4). On y reconnaît le Piton des Neiges et ses trois cirques,
  le massif de la Fournaise et la Plaine des Cafres entre les deux. Lagon clair près du rivage.
- Des arbres dans les bas et les forêts, des rochers en altitude, jamais sur les cases ni les chemins.

## Les villes

Dix-huit villes sont posées à leur vraie place (`game/src/plateau/villes.js`), autour de la côte et dans les Hauts.
Chacune a quelques cases créoles (toit de tôle rouge ou vert), des animaux animés et un élément qui la fait reconnaître :

| Ville | Ce qu'on y voit |
|---|---|
| Saint-Denis | cathédrale, mosquée, canons du Barachois |
| Sainte-Suzanne | le phare de Bel-Air |
| Saint-André | temple tamoul, champs de canne |
| Saint-Benoît, Sainte-Rose, Cilaos | leur église (Notre-Dame-des-Laves, Notre-Dame-des-Neiges) |
| Saint-Pierre | kiosque du front de mer, marché, barques |
| Saint-Louis | la sucrerie du Gol et sa cheminée, canne et charrette |
| Saint-Paul | la tombe de La Buse, marché forain |
| Le Port | un navire et ses tonneaux |
| Saint-Leu | barques et crabes |
| Plaine des Cafres | les vaches |
| Sainte-Marie, Saint-Joseph, Saint-Philippe, Le Tampon, Plaine-des-Palmistes, Hell-Bourg | cases, cultures, cochons, poules, cocotiers, fontaine |

Les éléments se placent seuls autour du centre de la ville, à côté des cases et des chemins, jamais dessus ;
sur une pente, un bâtiment repose sur un socle de pierre. Modèles : packs Kenney (CC0), voir l'expo des assets.
Les monuments (église, temple, mosquée, phare, sucrerie, kiosque) sont construits en low poly dans `Villes.jsx`.

## Les cases

- **La côte** : une boucle de **30 cases** (bleues) qui fait le tour de l'île à quelques kilomètres du rivage.
  La case 0 (jaune) est le départ, vers Saint-Louis ; on tourne dans le sens Saint-Pierre → Saint-Joseph → Saint-Benoît.
- **Le Chemin des Hauts** : à la case 4 (Saint-Pierre), un **embranchement** permet de monter par la route
  des Plaines (Le Tampon, Plaine des Cafres, Plaine des Palmistes : 6 cases vertes) pour rejoindre la côte à la
  case 16 (Saint-Benoît). Il est plus court (7 pas au lieu de 12) : il sert surtout à aller chercher la vanille
  quand elle est de ce côté.
- Les cases et les chemins épousent le relief : le terrain est aplani dessous.
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
| Menu (reprendre, personnages ; à l'annonce du mini-jeu : le passer) | Start |

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
