# 00 — Vision

> Statut : brouillon v0.1 · 17/10/2026

## Pitch

Un party game de plateau en 3D low poly, jouable dans le navigateur, façon Mario Party, qui se passe à La Réunion.
De 1 à 4 joueurs, sur le même écran, avancent sur un plateau inspiré de l'île, s'affrontent dans des mini-jeux
(lagon, volcan, forêt des Hauts, kartier créole…) et collectionnent des **gousses de vanille**, achetées avec des **zarlor**.

## Public

- Familles et groupes d'amis, réunionnais ou non.
- Parties courtes, règles comprises en une minute, aucun compte à créer.

## Piliers

1. **Fun immédiat.** On prend une manette et on joue. Chaque mini-jeu s'explique en une phrase.
2. **Identité péi.** Lieux, personnages, objets et vocabulaire de La Réunion, présentés avec tendresse et humour,
   jamais en caricature.
3. **Ensemble, au même endroit.** On joue côte à côte, sur un seul écran.
4. **Lisible et coloré.** Low poly, couleurs franches, une lecture claire même sur petit écran.

## Décisions prises

| Sujet | Décision |
|---|---|
| Mode de jeu | **Même écran** (local), pas de réseau en V1 |
| Joueurs | **1 à 4 humains** (solo possible), pas de bots |
| Durée | Nombre de tours choisi au lancement : **10** (~25 min), **15** ou **20** |
| Plateforme | **Mobile d'abord** (navigateur sur téléphone et tablette), puis ordinateur |
| Commandes | **Une manette par joueur, obligatoire sur tous les supports** (Gamepad API) |
| Moteur | **Three.js + React Three Fiber**, assets en glTF/GLB |
| Monnaie | **Zarlor** |
| Objectif | **Gousses de vanille** : le joueur qui en a le plus à la fin gagne |

## Commandes : une manette par joueur

- **Chaque joueur a sa manette**, quel que soit le support (téléphone, tablette, ordinateur, écran branché sur TV).
- Manettes gérées via la **Gamepad API** du navigateur : Bluetooth sur mobile, USB ou Bluetooth sur ordinateur.
  À tester en priorité : manettes Xbox, PlayStation, Switch Pro et modèles génériques.
- L'écran sert uniquement à **afficher** le jeu : il n'y a pas de commandes tactiles en jeu.
- **Tactile et souris** restent possibles dans les menus (écran titre, réglages), en secours.
- **Écran d'association** au lancement : chaque joueur appuie sur un bouton de sa manette pour rejoindre la partie
  (de 1 à 4 joueurs), puis choisit son avatar avec cette manette.
- **Manette déconnectée en cours de partie :** le jeu se met en pause et attend qu'elle soit reconnectée.
- **Schéma de boutons unique** pour tout le jeu : stick ou croix pour se déplacer, A pour valider ou agir,
  B pour annuler ou pour l'action secondaire. Aucun mini-jeu n'utilise plus de 2 boutons plus le stick.

## Hors périmètre de la V1

- Bots / joueurs contrôlés par l'ordinateur
- Forme définitive de l'île (le plateau de la V1 est un circuit simple)
- Types de cases spéciales (on les définira plus tard)
- Sons et musique (maloya, séga) : prévus, mais après la V1

## Contenu visé pour la V1

- 1 plateau simple (une boucle d'environ 30 cases)
- 4 à 6 avatars jouables (voir `avatars-reunion.pdf`)
- 4 mini-jeux : **Lagon**, **Volcan**, **Forêt des Hauts**, **parcours d'obstacles** (voir `biomes-minijeux.pdf`)
- 2 kits de personnages au choix : Quaternius et KayKit (voir `avatars-reunion.pdf`, `avatars-reunion2.pdf`)
- Écran titre, choix des joueurs et des avatars, choix du nombre de tours, écran de fin
