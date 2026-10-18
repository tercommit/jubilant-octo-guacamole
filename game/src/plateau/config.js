// Paramètres du plateau (voir docs/specs/01-boucle-de-jeu.md et 02-plateau.md)
export const CONFIG = {
  tours: [10, 15, 20],
  zarlorDepart: 10,
  prixVanille: 20,
  de: 10, // dé de 1 à 10
  distanceVanille: 10, // la vanille réapparaît à au moins 10 cases
  dureePas: 0.3, // s pour sauter d'une case à la suivante
  dureeDe: 0.9, // s d'affichage du résultat du dé
  dureeArrivee: 0.7, // s de pause à l'arrivée avant le joueur suivant
  dureeMessage: 1.8, // s
  // Cases spéciales (docs/specs/05-cases.md)
  gainBleue: 3,
  perteRouge: 3,
  dureeEffet: 1.8, // s de pause à l'arrivée sur une case qui a un effet
  chance: [ // tirage pondéré
    { effet: 'gain', zarlor: 5, poids: 4 },
    { effet: 'gain', zarlor: 10, poids: 1 },
    { effet: 'cotisation', zarlor: 2, poids: 2 }, // chaque autre joueur donne 2 zarlor (solo : +5)
    { effet: 'vanille', poids: 2 }, // le car jaune dépose le joueur 2 cases avant la vanille
  ],
}
