# Mes jeux web

Des jeux jouables dans le navigateur, en HTML, CSS et JavaScript, sans dépendance.
Chaque version est conservée dans `archives/` et reste jouable.

**Page d'accueil (toutes les versions) :** https://tercommit.github.io/jubilant-octo-guacamole/

| Version | Jeu | Dossier | Jouer |
|---------|-----|---------|-------|
| V4 | **Démo de gameplay** : la mécanique de la V3 seule, en formes simples, au doigt ou au clavier | `archives/v4/` | https://tercommit.github.io/jubilant-octo-guacamole/archives/v4/ |
| V3 | **La Gardienne** : on suit la boule de feu en fausse 3D, guidée à gauche ou à droite | `archives/v3/` | https://tercommit.github.io/jubilant-octo-guacamole/archives/v3/ |
| V2 | **La Gardienne** : boules de feu guidées au gyroscope (mise de côté, contrôle peu pratique) | `archives/v2/` | https://tercommit.github.io/jubilant-octo-guacamole/archives/v2/ |
| V1 | **Petit Saut** : plate-forme en pixel art, île de Brumelune et Roi des slimes | `archives/v1/` | https://tercommit.github.io/jubilant-octo-guacamole/archives/v1/ |

Chaque dossier a son propre README (contenu, commandes, fichiers, crédits).

## Méthode : une nouvelle version = une copie

- La **version en cours** (la plus récente) peut encore être ajustée sur place.
- Dès qu'on passe à la suivante, elle est **figée** : son dossier dans `archives/` ne change plus.
- Une nouvelle version commence par une **copie complète** de la dernière version
  (ou de celle qu'on choisit) dans un nouveau dossier `archives/vN/`, dans un commit à part.
- Les changements se font ensuite **uniquement dans cette copie**, dans les commits suivants.
  L'historique montre ainsi exactement ce qui a changé d'une version à l'autre.
- La page d'accueil (`index.html`) reçoit une carte pour la nouvelle version, en haut ; les cartes
  des autres versions ne changent pas.

## Fichiers

- `index.html` : la page d'accueil, avec un lien vers chaque version
- `archives/v1/` à `archives/v4/` : les versions, chacune avec un `apercu.jpg` pour la page d'accueil
- `LICENSE` : la licence du code (CC0)

## Publier avec GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.

## Licence

Le code est placé dans le domaine public sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `LICENSE`.
Les exceptions (personnage de la magicienne, ressources de la V2) sont détaillées dans le README
de chaque version.
