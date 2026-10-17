// Paramètres du mini-jeu « Fuis la coulée » (voir docs/specs/minijeux/volcan.md)
export const CONFIG = {
  duree: 45, // s
  decompte: 3, // s
  vitesse: 4.5, // unités/s
  sprint: { facteur: 1.8, duree: 0.6, recharge: 2.5 },
  rayonJoueur: 0.38,
  echelleTuile: 2,
  rayonCarte: 5,
  pieces: { parJoueur: 1, enPlus: 2, rayon: 0.8, distanceMin: 3 },
  // La lave sort du cratère et gagne un anneau toutes les `pas` secondes (± un peu de hasard)
  lave: { debut: 5, pas: 8, hasard: 0.8, alerte: 2 },
  bombes: { intervalle: [1.2, 2.2], alerte: 1.3, rayon: 1.3, visee: 2, recul: { force: 7, etourdi: 0.7, invincible: 1 } },
}
