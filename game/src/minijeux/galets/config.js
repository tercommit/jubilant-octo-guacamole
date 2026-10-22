// Paramètres du mini-jeu « Les galets traîtres » (voir docs/specs/minijeux/galets.md)
export const CONFIG = {
  duree: 90, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -3,
  delaiChute: 0.6,
  demiLargeur: 5,
  colonnes: 6, // galets par rangée
  rangees: 9,
  pasX: 1.65,
  pasZ: 1.55,
  taille: 1.4, // côté d'un galet
  premiereRangee: -5.5, // z de la première rangée de galets
  tremble: 0.1, // s entre le pas sur un faux galet et sa disparition
  leurres: 0.15, // part de vrais galets en plus du chemin, pour brouiller les pistes
}
