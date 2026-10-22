// Paramètres du mini-jeu « Les bascules » (voir docs/specs/minijeux/bascules.md)
export const CONFIG = {
  duree: 80, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -3,
  delaiChute: 0.6,
  demiLargeur: 2.6, // largeur des planches et des pontons
  // Pontons fixes (z de début et de fin) et bascules (centre, demi-longueur, décalage x) entre eux
  pontons: [[3, -3], [-12.5, -14.5], [-24, -26], [-35.5, -44]],
  bascules: [{ z: -7.75, demi: 4.75, x: 0 }, { z: -19.25, demi: 4.75, x: -1.2 }, { z: -30.75, demi: 4.75, x: 1.2 }],
  angleMax: 0.38, // rad
  raideur: 2.2, // rappel vers l'horizontale
  poids: 0.9, // effet d'un joueur sur la bascule, selon sa distance au pivot
  amorti: 2.4,
  glisse: 9, // on glisse vers le bas de la planche
  zArrivee: -40,
}
