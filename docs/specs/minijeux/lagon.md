# Mini-jeu — Lagon : « Le trésor de La Buse »

> Statut : brouillon v0.1 · 17/10/2026 · Biome : Lagon (voir `biomes-minijeux.pdf`, page 2)

## En une phrase (écran de règles)

**« Ramasse les pièces d'or avant que la marée ne recouvre l'îlot ! Dans l'eau, on avance moins vite. »**

## Principe

Un îlot de sable au milieu du lagon de l'Ermitage. Des pièces d'or apparaissent sur le sable ; la marée monte
et recouvre l'îlot tuile par tuile, du bord vers le centre. À 15 s de la fin, le **coffre de La Buse** apparaît
au centre et vaut 3 pièces.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | **45 s** (après un compte à rebours de 3 s) |
| Commandes | Stick : se déplacer · **A** : sprint · **B** : pousser, attraper, lancer (voir `04-lutte.md`) · Start : menu |
| Victoire | Le plus de pièces ; égalité = même place (voir `01-boucle-de-jeu.md`) |

## L'arène

- Plateau hexagonal de rayon 5 (Kenney Hexagon Kit agrandi ×2) : sable, et un anneau d'eau tout autour.
- **6 rochers** infranchissables, placés symétriquement.
- **La marée** monte par anneaux : anneau 4 entre 6 et 16 s, anneau 3 entre 18 et 28 s, anneau 2 entre 30 et 38 s.
  Le centre reste toujours au sec. Dans chaque anneau, l'ordre est tiré au hasard, mais une tuile et sa symétrique
  sont recouvertes en même temps (équité). L'eau monte visiblement pendant 2,5 s avant qu'une tuile soit recouverte.
- **Dans l'eau**, on avance à 50 % de la vitesse.
- Décor : lagon turquoise, océan au large, bateau et ponton.

## Les pièces et le coffre

- Il y a toujours (2 + nombre de joueurs) pièces sur le sable, à au moins 3 u des joueurs et des autres pièces.
- Une pièce n'apparaît que sur une tuile qui ne sera pas sous l'eau avant 3 s ; une pièce rattrapée par la marée disparaît.
- Coffre de La Buse : au centre, à 15 s de la fin, vaut **3 pièces**.

## Paramètres (`game/src/minijeux/lagon/config.js`)

| Paramètre | Valeur |
|---|---|
| Durée | 45 s |
| Vitesse | 4,5 u/s (×0,5 dans l'eau) |
| Sprint | ×1,8 pendant 0,6 s, recharge 2,5 s |
| Rayon de ramassage | 0,8 u (coffre : 1 u) |
| Alerte avant la marée | 2,5 s |

## Plus tard

- Palmiers et cocotiers, tortues et poissons dans le lagon
- Vagues qui poussent les joueurs vers le centre
