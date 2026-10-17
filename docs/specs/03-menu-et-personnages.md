# 03 — Menu Start et kits de personnages

> Statut : brouillon v0.1 · 17/10/2026

## Le menu Start

N'importe quel joueur ouvre le menu avec **Start**, sur le plateau comme dans un mini-jeu (y compris pendant
l'écran de règles). On le parcourt au **stick (haut / bas)**, on valide avec **A**, et **Start** le referme.

| Option | Où | Effet |
|---|---|---|
| Reprendre | partout | ferme le menu |
| Passer le mini-jeu | dans un mini-jeu, et sur le plateau à l'annonce du mini-jeu | le mini-jeu s'arrête et **personne ne gagne de zarlor** ; le bilan du tour l'indique |
| Personnages : Quaternius / KayKit | partout | change de kit tout de suite, même en pleine partie |

- En mode « mini-jeu seul » (depuis le salon), passer un mini-jeu enchaîne sur le suivant de la liste.
- Une manette déconnectée ouvre le menu, qui reste ouvert tant qu'elle n'est pas revenue.

## Les deux kits de personnages

| Kit | Document | Joueurs 1 à 4 |
|---|---|---|
| **Quaternius** | `avatars-reunion.pdf` | Ti Paul, Mei-Ling, Firmin, Priya |
| **KayKit Adventurers** | `avatars-reunion2.pdf` | Ti Jean, Granmèr Kal, La Buse, le guide de Mafate |

- Le kit se choisit aussi dans le **salon** (stick haut / bas de J1, ou en cliquant), et il est mémorisé par le
  navigateur. `?kit=kaykit` ou `?kit=quaternius` dans l'URL l'impose.
- Grand Diab et la Dame Blanche (KayKit) attendent l'écran de choix d'avatar.
- Les animations n'ont pas les mêmes noms dans les deux packs : la correspondance est dans
  `game/src/commun/modeles.jsx` (et page 5 de `avatars-reunion2.pdf`).
