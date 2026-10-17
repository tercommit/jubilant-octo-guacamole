// Paramètres du mini-jeu « Le trésor de La Buse » (voir docs/specs/minijeux/lagon.md)
export const CONFIG = {
  duree: 45, // s
  decompte: 3, // s
  vitesse: 4.5, // unités/s
  nage: 0.5, // vitesse dans l'eau
  sprint: { facteur: 1.8, duree: 0.6, recharge: 2.5 },
  rayonJoueur: 0.38,
  echelleTuile: 2,
  rayonCarte: 5,
  pieces: { parJoueur: 1, enPlus: 2, rayon: 0.8, distanceMin: 3 },
  coffre: { tempsRestant: 15, valeur: 3, rayon: 1 },
  // La marée monte anneau par anneau : [anneau, début, fin] (s de jeu). Le centre reste toujours au sec.
  maree: { anneaux: [[4, 6, 16], [3, 18, 28], [2, 30, 38]], alerte: 2.5 },
}
