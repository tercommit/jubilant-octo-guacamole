// Paramètres du mini-jeu « La Ti Diagonale » (voir docs/specs/minijeux/ti-diagonale.md)
export const CONFIG = {
  duree: 60, // s
  decompte: 3, // s
  vitesse: 5, // unités/s
  saut: 7.5, // vitesse verticale au décollage (u/s)
  gravite: 24, // u/s²
  coyote: 0.1, // s : on peut encore sauter juste après avoir quitté le sol
  tamponSaut: 0.12, // s : un appui sur A juste avant d'atterrir est pris en compte
  rayonJoueur: 0.38,
  demiLargeur: 4, // la piste fait 8 u de large
  recul: { force: 7, etourdi: 0.55, invincible: 1 },
  chute: { hauteur: -3, delai: 0.6, invincible: 1.2 },
  cannes: { vitesse: 1.7, demiLongueur: 3.9, rayon: 0.2, hauteur: 0.6 },
  pics: { periode: 2.4, sortis: 1.2, alerte: 0.35, hauteur: 0.4 },
  roches: { rayon: 0.45, vitesse: 5.5, intervalle: [0.55, 0.9] },
}
