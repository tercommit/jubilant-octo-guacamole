// Paramètres du mini-jeu « Les cerceaux du lagon » (voir docs/specs/minijeux/cerceaux.md)
export const CONFIG = {
  duree: 60, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -2.5,
  delaiChute: 0.7,
  cerceaux: { enPlus: 2, rayon: 0.9, attente: 0.8 }, // (2 + nombre de joueurs) cerceaux à la fois
  points: { normal: 1, or: 3 },
  partOr: 0.3, // part des cerceaux dorés, perchés au-dessus des plateformes
}
