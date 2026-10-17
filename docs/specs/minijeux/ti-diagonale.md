# Mini-jeu — Parcours d'obstacles : « La Ti Diagonale »

> Statut : brouillon v0.1 · 17/10/2026 · Clin d'œil au Grand Raid (la « Diagonale des Fous »), en version courte

## En une phrase (écran de règles)

**« Cours jusqu'à l'arrivée ! Saute par-dessus les cannes, les ravines et les pics, et gare aux roches de la coulée. »**

## Principe

Une course sur un sentier plein d'obstacles, vue de derrière. Le premier qui passe la ligne d'arrivée gagne.
Quand le temps est écoulé, ceux qui ne sont pas arrivés sont classés selon la distance parcourue.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | **60 s au maximum** (après un compte à rebours de 3 s) ; fin dès que tout le monde est arrivé |
| Commandes | Stick gauche ou croix : courir · **A** : sauter · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu (voir `03-menu-et-personnages.md`) |
| Victoire | Ordre d'arrivée, puis distance parcourue ; égalité = même place (voir `01-boucle-de-jeu.md`) |

## Le sentier (de l'avant vers l'arrière)

La piste fait 8 u de large et environ 72 u de long, bordée de berges boisées. Au loin, le Piton de la Fournaise.

1. **Les cannes à sucre** : deux tiges de canne tournent au ras du sol, en sens opposés. Il faut les sauter.
2. **La ravine des galets** : trois rangées de galets de basalte au-dessus de l'eau, à franchir en sautant.
3. **La ravine des radeaux** : trois rangées de radeaux en bois qui glissent de gauche à droite. Le radeau emporte le joueur.
4. **Les pics** : trois rangées de pièges qui sortent du sol en vague. Ils frémissent juste avant de sortir.
5. **La coulée** : des roches de basalte dévalent vers les joueurs, dans des couloirs tirés au hasard.
6. **L'arrivée** : ligne à damier sous une arche.

## Règles

- **Choc** (canne, pic, roche) : le joueur est repoussé, étourdi 0,55 s, puis invincible 1 s (il clignote).
- **Chute dans la ravine** : le joueur réapparaît 0,6 s plus tard au dernier point de passage franchi
  (départ, avant les galets, entre les deux ravines, avant les pics, avant la coulée).
- **Bousculades** : les avatars se repoussent légèrement, comme dans « Sentier de Mafate ».
- Les obstacles tournent déjà pendant le compte à rebours, pour qu'on voie leur rythme.
- **Caméra** : elle suit le milieu du peloton et recule quand les joueurs s'étalent.

## Interface

- **En haut :** le temps restant.
- **Dans les coins :** la progression de chaque joueur (en %), puis sa place une fois arrivé.
- **Avant / pendant / fin :** mêmes écrans que les autres mini-jeux (règles, « Prêt ? », 3-2-1, menu Start, classement et zarlor).

## Intégration

Même contrat que les autres mini-jeux : entrée = liste des joueurs, sortie = classement
(`[{ joueur, arrive, progression, place, zarlor }]`).

## Paramètres (`game/src/minijeux/ti-diagonale/config.js`)

| Paramètre | Valeur |
|---|---|
| Durée max | 60 s |
| Vitesse de course | 5 u/s |
| Saut | 7,5 u/s, gravité 24 u/s² (≈ 1,2 u de haut, ≈ 3 u de long) |
| Tolérances | 0,1 s après le bord, 0,12 s d'appui anticipé |
| Cannes | 1,7 rad/s, longueur 7,8 u |
| Pics | cycle de 2,4 s, sortis 1,2 s |
| Roches | rayon 0,45 u, 5,5 u/s, une toutes les 0,55 à 0,9 s |

## Plus tard

- Raccourcis risqués (passage étroit plus court)
- Sons : bruit de la canne, plouf dans la ravine
- Plusieurs tracés tirés au hasard
