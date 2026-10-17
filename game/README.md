# Plateau Réunion — prototype

Party game de plateau en 3D low poly (Three.js + React Three Fiber). Le **plateau** est jouable
(voir `docs/specs/02-plateau.md`), avec deux mini-jeux tirés au sort à chaque tour, jouables aussi seuls :
**« Sentier de Mafate »** (Forêt des Hauts, voir `docs/specs/minijeux/foret-des-hauts.md`) et
**« La Ti Diagonale »** (parcours d'obstacles, voir `docs/specs/minijeux/ti-diagonale.md`).

## Lancer

```bash
npm install
npm run dev        # puis ouvrir l'URL affichée (aussi accessible depuis un mobile du même réseau)
```

- Chaque joueur appuie sur **A** de sa manette pour rejoindre la partie (de 1 à 4 : le solo est possible).
  J1 choisit « Partie sur le plateau » ou un mini-jeu avec le stick (gauche / droite), puis appuie sur **Start**.
  `?jeu=plateau`, `?jeu=foret-des-hauts` ou `?jeu=ti-diagonale` présélectionne le choix.
- **Développement sans manette** : ajouter `?clavier` à l'URL (J1 = ZQSD/WASD + Espace, Échap = Start ;
  J2 = flèches + Entrée, Retour arrière = Start).

## Organisation

```
src/
  commun/entrees.js        manettes (Gamepad API) + clavier de dev
  commun/avatars.js        avatars par défaut et couleurs des joueurs
  commun/modeles.jsx       chargement glTF, recoloration, avatars animés
  commun/gains.js          zarlor gagnés selon la place
  plateau/                 le plateau : cases (carte.js), logique des tours (logique.js), rendu 3D, HUD
  minijeux/index.js        liste des mini-jeux (salon et tirage au sort)
  minijeux/foret-des-hauts/
    config.js              paramètres de jeu (durée, vitesses, sprint…)
    carte.js               carte hexagonale, collisions, apparition des balises
    logique.js             logique pure (sans rendu) : déplacements, balises, classement
    Arene.jsx, Scene.jsx   rendu 3D
    Hud.jsx                interface
  minijeux/ti-diagonale/   parcours d'obstacles (même organisation : config, piste, logique, rendu, HUD)
public/assets/             modèles utilisés (Kenney, KayKit, Quaternius — CC0)
```

Les textures `*-tropique.png` sont des versions recolorées (vert tropical) des textures d'origine.

## Déploiement

Chaque push sur `main` compile `game/` et le publie sur GitHub Pages (`.github/workflows/pages.yml`).
Réglage à faire une fois : **Settings → Pages → Source : GitHub Actions**.
