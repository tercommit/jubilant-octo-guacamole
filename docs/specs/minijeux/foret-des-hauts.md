# Mini-jeu — Forêt des Hauts : « Sentier de Mafate »

> Statut : brouillon v0.1 · 17/10/2026 · Biome : Forêt des Hauts (voir `biomes-minijeux.pdf`, page 3)

## En une phrase (écran de règles)

**« Cours jusqu'à la balise avant les autres ! La forêt te ralentit, la ravine ne se traverse que par les ponts. »**

## Principe

Une course d'orientation dans un cirque des Hauts. Une **balise** (un drapeau) apparaît quelque part sur la carte.
Le premier joueur qui la touche marque **1 point**, puis une nouvelle balise apparaît ailleurs. Quand le temps est
écoulé, le classement se fait au nombre de balises.

## Fiche technique

| | |
|---|---|
| Joueurs | 1 à 4, chacun pour soi |
| Durée | **45 s** (après un compte à rebours de 3 s) |
| Commandes | Stick gauche ou croix : se déplacer · **A** : sprint · Start : pause |
| Victoire | Le plus de balises ; égalité = même place (voir `01-boucle-de-jeu.md`) |

## L'arène

- Un plateau hexagonal d'un rayon de 5 tuiles (91 tuiles, Kenney Hexagon Kit agrandi ×2), recoloré en vert tropical.
- **La ravine :** une rivière traverse l'arène d'ouest en est. On ne peut pas la traverser à pied.
- **Deux ponts** sur la ravine, à gauche et à droite, sont les seuls passages.
- **Forêt dense** (tuiles `grass-forest`) : marcher dedans ralentit à **55 %** de la vitesse.
- **Remparts** (montagnes et collines KayKit) : infranchissables, ils créent des détours.
- **Bord de l'arène :** infranchissable.
- La carte est fixe dans la V1 (une seule disposition, symétrique pour l'équité).

## Les joueurs

- Les avatars viennent du pack Quaternius (voir `avatars-reunion.pdf`), avec les animations `Idle`, `Run` et `Victory`/`Defeat` à la fin.
- **Départ :** chaque joueur commence dans un coin différent, au sud pour les joueurs 1 et 2, au nord pour les joueurs 3 et 4.
- **Vitesse de base :** 4,5 unités/s.
- **Sprint (A) :** vitesse ×1,8 pendant 0,6 s, puis **2,5 s de recharge** (indiquée par une jauge sous le joueur).
- **Collisions entre joueurs :** les avatars se repoussent légèrement, ce qui permet de bousculer un adversaire.
- Chaque joueur porte une couleur (1 rouge, 2 bleu, 3 jaune, 4 vert), affichée par un anneau au sol et dans le HUD.

## La balise

- Elle apparaît sur une tuile praticable tirée au hasard, à **au moins 6 unités** de chaque joueur et de la balise précédente.
- Un faisceau lumineux vertical la rend visible de loin.
- Un joueur la prend en entrant dans un rayon de 0,9 unité : +1 point, petit effet visuel, et la suivante apparaît après **0,5 s**.
- Si deux joueurs la touchent dans la même image, le point va au plus proche.

## Interface

- **En haut :** le temps restant.
- **Dans les coins :** le score de chaque joueur, à sa couleur.
- **Avant la partie :** l'écran de règles (la phrase ci-dessus et les boutons), puis « Prêt ? » (chaque joueur appuie sur A), puis le compte à rebours 3, 2, 1, Partez !
- **Fin :** « Temps écoulé ! », puis le classement avec les zarlor gagnés (10 / 5 / 2 / 0 selon le nombre de joueurs).

## Intégration

Le mini-jeu est un module autonome :

- **Entrée :** la liste des joueurs (index de manette, avatar, couleur).
- **Sortie :** le classement (`[{ joueur, points, place }]`), que le jeu principal convertit en zarlor.

En attendant le jeu principal, le mini-jeu se lance seul, avec un écran où les manettes rejoignent la partie.

## Paramètres (fichier de configuration)

| Paramètre | Valeur |
|---|---|
| Durée | 45 s |
| Vitesse de base | 4,5 u/s |
| Ralentissement en forêt | ×0,55 |
| Sprint | ×1,8 pendant 0,6 s, recharge 2,5 s |
| Rayon de prise de la balise | 0,9 u |
| Distance minimale d'apparition | 6 u |

## Mode développement

Pour tester sans manette, le clavier peut simuler les joueurs : J1 = ZQSD + Espace, J2 = flèches + Entrée.
Ce mode est réservé au développement et s'active avec `?clavier` dans l'URL.

## Plus tard

- Brume qui réduit la visibilité, pluie qui rend les ponts glissants
- Balise dorée qui vaut 3 points dans les 10 dernières secondes
- Plusieurs dispositions de carte
