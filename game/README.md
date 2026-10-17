# Plateau Réunion — prototype

Party game de plateau en 3D low poly (Three.js + React Three Fiber). Le **plateau** est jouable
(voir `docs/specs/02-plateau.md`), avec quatre mini-jeux tirés au sort à chaque tour, jouables aussi seuls
(fiches dans `docs/specs/minijeux/`) :

- **« Sentier de Mafate »** (Forêt des Hauts) : course d'orientation vers des balises
- **« La Ti Diagonale »** : parcours d'obstacles
- **« Le trésor de La Buse »** (Lagon) : pièces à ramasser avant la marée
- **« Fuis la coulée »** (Volcan) : pièces à ramasser en fuyant la lave et les bombes

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
  `?jeu=lagon` ou `?jeu=volcan` présélectionne le jeu ; `?kit=kaykit` impose le kit.
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
  plateau/                 le plateau : cases (carte.js), logique des tours (logique.js), rendu 3D, HUD
  minijeux/index.js        liste des mini-jeux (salon et tirage au sort)
  minijeux/foret-des-hauts/, lagon/, volcan/
    config.js              paramètres de jeu (durée, vitesses, sprint…)
    carte.js               carte hexagonale, collisions, horaires (marée, lave)
    logique.js             logique pure (sans rendu)
    Arene.jsx              décor 3D
  minijeux/ti-diagonale/   parcours d'obstacles (config, piste, logique, rendu, HUD)
public/assets/             modèles utilisés (Kenney, KayKit, Quaternius — CC0)
```

Les textures `*-tropique.png` sont des versions recolorées (vert tropical) des textures d'origine.
Les textures de `kaykit-adventurers/textures/` sont les versions péi des personnages KayKit (voir `avatars-reunion2.pdf`).

## Déploiement

Chaque push sur `main` compile `game/` et le publie sur GitHub Pages (`.github/workflows/pages.yml`).
Réglage à faire une fois : **Settings → Pages → Source : GitHub Actions**.
