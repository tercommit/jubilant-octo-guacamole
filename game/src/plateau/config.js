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
}
