# Plateau Réunion — prototype

Party game de plateau en 3D low poly (Three.js + React Three Fiber). Pour l'instant, seul le mini-jeu
**« Sentier de Mafate »** (Forêt des Hauts) est jouable, voir `docs/specs/minijeux/foret-des-hauts.md`.

## Lancer

```bash
npm install
npm run dev        # puis ouvrir l'URL affichée (aussi accessible depuis un mobile du même réseau)
```

- Chaque joueur appuie sur **A** de sa manette pour rejoindre la partie (de 2 à 4), puis J1 appuie sur **Start**.
- **Développement sans manette** : ajouter `?clavier` à l'URL (J1 = ZQSD/WASD + Espace, Échap = Start ;
  J2 = flèches + Entrée, Retour arrière = Start). `?solo` autorise une partie à 1 joueur.

## Organisation

```
src/
  commun/entrees.js        manettes (Gamepad API) + clavier de dev
  commun/avatars.js        avatars par défaut et couleurs des joueurs
  commun/modeles.jsx       chargement glTF, recoloration, avatars animés
  minijeux/foret-des-hauts/
    config.js              paramètres de jeu (durée, vitesses, sprint…)
    carte.js               carte hexagonale, collisions, apparition des balises
    logique.js             logique pure (sans rendu) : déplacements, balises, classement
    Arene.jsx, Scene.jsx   rendu 3D
    Hud.jsx                interface
public/assets/             modèles utilisés (Kenney, KayKit, Quaternius — CC0)
```

Les textures `*-tropique.png` sont des versions recolorées (vert tropical) des textures d'origine.

## Déploiement

Chaque push sur `main` compile `game/` et le publie sur GitHub Pages (`.github/workflows/pages.yml`).
Réglage à faire une fois : **Settings → Pages → Source : GitHub Actions**.
