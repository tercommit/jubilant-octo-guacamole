// Paramètres du mini-jeu « Saute la canne » (voir docs/specs/minijeux/canne.md)
export const CONFIG = {
  duree: 75, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s : un saut monte à ~1,2 u
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -3,
  delaiChute: 0.4,
  rayonPiste: 7, // disque de la sucrerie ; il rétrécit sur la fin
  rayonFinal: 4.2,
  retrecit: [40, 70], // s : de quand à quand la piste rétrécit
  pilier: 0.9, // rayon du moulin au centre
  // Canne basse (à sauter) et canne haute (on la prend en pleine tête si on saute au mauvais moment)
  basse: { hauteur: 0.45, rayon: 0.24, vitesse: [1.1, 2.6] }, // rad/s, du début à la fin
  haute: { hauteur: 1.55, rayon: 0.22, vitesse: [0.8, 1.9], debut: 12 },
  longueur: 7.4,
  tailleJoueur: 1.2,
  recul: { force: 11, etourdi: 0.6, hauteur: 4 },
}
