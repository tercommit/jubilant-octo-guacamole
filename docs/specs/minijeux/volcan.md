# Mini-jeu — Volcan : « Fuis la coulée »

> Statut : brouillon v0.1 · 17/10/2026 · Biome : Volcan (voir `biomes-minijeux.pdf`, page 4)

## En une phrase (écran de règles)

**« La lave sort du cratère : si tu la touches, tu es éliminé ! Ramasse les pièces et gare aux bombes volcaniques. »**

## Principe

Sur la Plaine des Sables, au pied du Piton de la Fournaise. La lave sort du cratère, au centre, et gagne l'arène
anneau par anneau : les joueurs sont repoussés vers le bord pendant qu'ils ramassent des pièces. **Toucher la lave élimine.** Des bombes
volcaniques tombent près des joueurs.

C'est le miroir du Lagon : au Lagon, l'arène rétrécit vers le centre ; au Volcan, elle rétrécit vers le bord.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | **45 s** (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sprint · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Les survivants d'abord (classés aux pièces), puis les éliminés, du dernier sorti au premier ; égalité = même place |

## L'arène

- Plateau hexagonal de rayon 5 en basalte (Kenney Hexagon Kit agrandi ×2).
- **Le cratère** au centre et **6 rochers** symétriques sont infranchissables.
- **La coulée** : la lave atteint l'anneau 1 vers 5 s, puis un anneau de plus toutes les 8 s environ
  (avec un peu de hasard, symétrique pour l'équité). L'anneau extérieur reste sûr jusqu'à la fin.
  Une tuile rougeoie pendant 2 s avant que la lave arrive.
- **Toucher la lave élimine** le joueur pour le reste du mini-jeu (il garde ses pièces, mais est classé après
  tous les survivants). Être jeté dans la lave par un autre joueur compte aussi (voir `04-lutte.md`).
- **Fin anticipée** : quand il ne reste qu'un survivant (ou aucun en solo), le mini-jeu s'arrête.

## Les bombes volcaniques

- Toutes les 1,2 à 2,2 s, une bombe vise un joueur au hasard (à 2 u près).
- Un cercle rouge au sol annonce l'impact 1,3 s à l'avance, pendant que la bombe tombe.
- À l'impact, les joueurs à moins de 1,3 u sont repoussés et étourdis 0,7 s (ils ne perdent pas de pièce).

## Les pièces

Comme au Lagon : (2 + nombre de joueurs) pièces, seulement sur des tuiles que la lave n'atteindra pas avant 3 s.

## Paramètres (`game/src/minijeux/volcan/config.js`)

| Paramètre | Valeur |
|---|---|
| Durée | 45 s |
| Vitesse | 4,5 u/s |
| Sprint | ×1,8 pendant 0,6 s, recharge 2,5 s |
| Lave | début 5 s, un anneau toutes les 8 s, alerte 2 s |
| Lave | élimine |
| Bombes | toutes les 1,2 à 2,2 s, alerte 1,3 s, rayon 1,3 u |

## Plus tard

- Fumerolles et lave animée (shader)
- Rochers qui servent d'abri contre les bombes
