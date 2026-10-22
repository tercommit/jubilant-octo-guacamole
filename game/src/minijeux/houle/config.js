// Paramètres du mini-jeu « Les vagues de Boucan » (voir docs/specs/minijeux/houle.md)
export const CONFIG = {
  duree: 70, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -3,
  delaiChute: 0.4,
  demiLargeur: 6, // la plage fait 12 × 10
  demiProfondeur: 5,
  colonnes: 8, // chaque vague est faite de 8 blocs de 1,5 u
  epaisseur: 0.8,
  hauteurs: { bas: 0.6, haut: 2.6 }, // un bloc bas se saute, un bloc haut non
  vitesseVague: [3, 6.5], // u/s, du début à la fin
  intervalle: [4.2, 2.4], // s entre deux vagues, du début à la fin
  departVague: -11, // z où les vagues apparaissent
}
