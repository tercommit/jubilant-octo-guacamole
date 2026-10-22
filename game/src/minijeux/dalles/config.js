// Paramètres du mini-jeu « Les dalles de la Fournaise » (voir docs/specs/minijeux/dalles.md)
export const CONFIG = {
  duree: 90, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // vitesse verticale au décollage (u/s)
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -3, // sous l'étage du bas : la lave
  delaiChute: 0.4,
  etages: [7, 3.5, 0], // hauteur de chaque étage, du haut vers le bas
  rayonCarte: 4, // tuiles hexagonales par étage : disque de rayon 4 (61 dalles)
  echelleTuile: 1.7,
  fissure: 0.55, // s entre le premier pas sur une dalle et sa chute
}
