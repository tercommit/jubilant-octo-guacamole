// Paramètres du mini-jeu « Les portes des cases » (voir docs/specs/minijeux/portes.md)
export const CONFIG = {
  duree: 60, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -3,
  delaiChute: 0.5,
  demiLargeur: 6.2,
  portesParRangee: 5,
  largeurPorte: 2,
  pilier: 0.44,
  epaisseur: 0.5,
  hauteur: 3, // on ne saute pas par-dessus
  rangees: [{ z: -7, vraies: 3 }, { z: -14, vraies: 3 }, { z: -21, vraies: 2 }, { z: -28, vraies: 2 }],
  zArrivee: -34,
  rebond: { force: 9, etourdi: 0.5, invincible: 0.4, hauteur: 2.5 },
}
