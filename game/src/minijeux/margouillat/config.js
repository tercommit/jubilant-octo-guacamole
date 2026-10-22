// Paramètres du mini-jeu « La queue du margouillat » (voir docs/specs/minijeux/margouillat.md)
export const CONFIG = {
  duree: 60, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -2.5,
  delaiChute: 0.7,
  portee: 1.5, // distance pour attraper une queue
  protection: 1.5, // s pendant lesquelles une queue qu'on vient d'attraper ne peut pas être reprise
  sonne: 0.4, // s : celui qui perd sa queue est un instant sonné
  bonusFin: 10, // points pour qui a une queue à la fin
}
