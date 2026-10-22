# Plateau Réunion — prototype

Party game de plateau en 3D low poly (Three.js + React Three Fiber). Le **plateau** est jouable
(voir `docs/specs/02-plateau.md`), avec quatorze mini-jeux tirés au sort à chaque tour, jouables aussi seuls
(fiches dans `docs/specs/minijeux/`) :

- **« Sentier de Mafate »** (Forêt des Hauts) : course d'orientation vers des balises
- **« La Ti Diagonale »** : parcours d'obstacles
- **« Le trésor de La Buse »** (Lagon) : pièces à ramasser avant la marée
- **« Fuis la coulée »** (Volcan) : pièces à ramasser en fuyant la lave et les bombes

Et dix mini-jeux **à la Fall Guys**, où **A** fait sauter (voir `docs/specs/05-saut.md`) :

- survie : **« Les dalles de la Fournaise »** (Hex-A-Gone), **« Fruits péi »** (Perfect Match),
  **« Saute la canne »** (Jump Club), **« Les vagues de Boucan »** (Block Party), **« Le moulin à cannes »** (Roll Out)
- course : **« Les galets traîtres »** (Tip Toe), **« Les portes des cases »** (Door Dash), **« Les bascules »** (See Saw)
- points : **« Les cerceaux du lagon »** (Hoopsie Daisy), **« La queue du margouillat »** (Tail Tag)

Deux kits de personnages au choix (Quaternius ou KayKit), et un menu Start pour passer un mini-jeu :
voir `docs/specs/03-menu-et-personnages.md`. Dans tous les mini-jeux, **B** sert à pousser, attraper et
lancer les autres joueurs : voir `docs/specs/04-lutte.md`.

## Lancer

```bash
npm install
npm run dev        # puis ouvrir l'URL affichée (aussi accessible depuis un mobile du même réseau)
```

- Chaque joueur appuie sur **A** de sa manette pour rejoindre la partie (de 1 à 4 : le solo est possible).
  J1 choisit « Partie sur le plateau » ou un mini-jeu avec le stick (gauche / droite), puis appuie sur **Start**.
  Stick haut / bas : kit de personnages. `?jeu=plateau`, `?jeu=foret-des-hauts`, `?jeu=ti-diagonale`,
  `?jeu=lagon`, `?jeu=volcan`… (l'identifiant d'un mini-jeu, voir `src/minijeux/index.js`) présélectionne le jeu ;
  `?kit=kaykit` impose le kit.
- **Expo des assets** : `expo.html` (lien en bas du salon) montre en 3D chaque modèle utilisé, son pack,
  sa licence et les jeux où il apparaît. Catalogue : `src/expo/catalogue.js` (à compléter quand un modèle est ajouté).
- **Survol du plateau** : `survol.html` montre l'île du plateau telle qu'en jeu, sans pion ni partie :
  glisser pour se déplacer, clic droit / deux doigts pour tourner, molette / pincer pour zoomer.
- **Développement sans manette** : ajouter `?clavier` à l'URL (J1 = ZQSD/WASD + Espace, Échap = Start ;
  J2 = flèches + Entrée, Retour arrière = Start).

## Organisation

```
src/
  commun/entrees.js        manettes (Gamepad API) + clavier de dev
  commun/avatars.js        avatars des deux kits et couleurs des joueurs
  commun/kit.js            kit de personnages choisi (Quaternius / KayKit), mémorisé
  commun/modeles.jsx       chargement glTF, recoloration, avatars animés (deux kits)
  commun/menu.js           menu Start (logique) ; MenuPause.jsx pour l'affichage
  commun/lutte.js          pousser, porter, jeter entre joueurs (tous les mini-jeux)
  commun/gains.js          zarlor gagnés selon la place
  commun/arene/            socle des mini-jeux d'arène : déroulé, déplacements, pièces, rendu, HUD
  commun/saut/             socle des mini-jeux à la Fall Guys : saut et chutes, règles (survie, course), caméras, décor
  plateau/                 le plateau : île (ile.js, ile.json), cases (carte.js), logique des tours (logique.js), rendu 3D, HUD
  minijeux/index.js        liste des mini-jeux (salon et tirage au sort)
  minijeux/foret-des-hauts/, lagon/, volcan/
    config.js              paramètres de jeu (durée, vitesses, sprint…)
    carte.js               carte hexagonale, collisions, horaires (marée, lave)
    logique.js             logique pure (sans rendu)
    Arene.jsx              décor 3D
  minijeux/ti-diagonale/   parcours d'obstacles (config, piste, logique, rendu, HUD)
  minijeux/dalles/, fruits/, canne/, houle/, moulin/, galets/, portes/, bascules/, cerceaux/, margouillat/
                           les mini-jeux à la Fall Guys (config, logique, Decor, composant)
  expo/                    page « Expo des assets » (catalogue.js + vitrine 3D)
  survol/                  page « Survol du plateau » (le décor du plateau, sans partie)
public/assets/             modèles utilisés (Kenney, KayKit, Quaternius — CC0)
```

Les textures `*-tropique.png` sont des versions recolorées (vert tropical) des textures d'origine.
Les textures de `kaykit-adventurers/textures/` sont les versions péi des personnages KayKit (voir `avatars-reunion2.pdf`).

## Déploiement

Chaque push sur `main` compile `game/` et le publie sur GitHub Pages (`.github/workflows/pages.yml`).
Réglage à faire une fois : **Settings → Pages → Source : GitHub Actions**.
