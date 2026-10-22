# 05 — Les mini-jeux « à la Fall Guys » : le socle saut

> Statut : brouillon v0.1 · 22/10/2026 · Implémenté dans `game/src/commun/saut/`

Dix mini-jeux reprennent des manches de Fall Guys, à la sauce réunionnaise. Ils partagent un même socle,
différent des arènes à sprint (Sentier de Mafate, Lagon, Volcan) : **A saute** au lieu de sprinter.

| Fall Guys | Mini-jeu | Type | Fiche |
|---|---|---|---|
| Hex-A-Gone | Les dalles de la Fournaise | survie | `minijeux/dalles.md` |
| Perfect Match | Fruits péi | survie | `minijeux/fruits.md` |
| Jump Club | Saute la canne | survie | `minijeux/canne.md` |
| Block Party | Les vagues de Boucan | survie | `minijeux/houle.md` |
| Roll Out | Le moulin à cannes | survie | `minijeux/moulin.md` |
| Tip Toe | Les galets traîtres | course | `minijeux/galets.md` |
| Door Dash | Les portes des cases | course | `minijeux/portes.md` |
| See Saw | Les bascules | course | `minijeux/bascules.md` |
| Hoopsie Daisy | Les cerceaux du lagon | points | `minijeux/cerceaux.md` |
| Tail Tag | La queue du margouillat | points | `minijeux/margouillat.md` |

## Commandes

Stick : se déplacer · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu.

## Physique (`physique.js`)

- Vitesse 5 u/s ; saut à 7,5 u/s avec une gravité de 24 u/s² : un saut monte à ≈ 1,2 u et dure ≈ 0,6 s.
- Un peu d'indulgence : on peut encore sauter 0,1 s après avoir quitté un bord, et un appui sur A 0,12 s avant
  d'atterrir est pris en compte. On monte sans sauter une marche de 0,3 u.
- Chaque mini-jeu décrit son terrain : les surfaces (qui peuvent bouger et entraîner les joueurs), les murs,
  les pentes où l'on glisse, et ce qui arrive quand on tombe.
- Un joueur poussé ou jeté par un autre part en cloche et peut tomber dans le vide.

## Les trois façons de gagner (`regles.js`)

- **Survie** : tomber élimine. Les survivants d'abord, puis les éliminés, du dernier tombé au premier.
  Fin anticipée quand il ne reste qu'un joueur (aucun en solo).
- **Course** : tomber renvoie au dernier point de passage. Les arrivés par ordre d'arrivée, puis les autres
  selon la distance parcourue ; le score affiché est le pourcentage du parcours.
- **Points** : on marque des points ; tomber fait réapparaître.

Les gains en zarlor sont ceux de `01-boucle-de-jeu.md` (10, 5, 2, 0 à quatre joueurs ; égalité = même gain).
