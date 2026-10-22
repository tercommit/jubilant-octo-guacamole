// Paramètres du mini-jeu « Fruits péi » (voir docs/specs/minijeux/fruits.md)
export const CONFIG = {
  duree: 100, // s (les manches finissent avant)
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -3,
  delaiChute: 0.4,
  colonnes: 4, // dalles de 2,6 u, séparées de 0,3 u
  taille: 2.6,
  ecart: 0.3,
  // Chaque manche : on montre les fruits, on les cache et on annonce le bon, puis les autres dalles tombent
  manches: 6,
  memoire: [5, 4.5, 4, 3.5, 3, 2.5], // s pendant lesquelles les fruits sont visibles, manche par manche
  annonce: 3, // s entre l'annonce du fruit et la chute des dalles
  chuteDalles: 2.5, // s pendant lesquelles les mauvaises dalles sont tombées
  retour: 1.2, // s pour que les dalles remontent
  sortes: [3, 3, 4, 4, 5, 5], // nombre de fruits différents, manche par manche
}
