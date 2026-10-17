// Paramètres du mini-jeu « Sentier de Mafate » (voir docs/specs/minijeux/foret-des-hauts.md)
export const CONFIG = {
  duree: 45, // s
  decompte: 3, // s
  vitesse: 4.5, // unités/s
  ralentissementForet: 0.55,
  sprint: { facteur: 1.8, duree: 0.6, recharge: 2.5 },
  rayonBalise: 0.9,
  distanceMinBalise: 6,
  delaiNouvelleBalise: 0.5,
  rayonJoueur: 0.38,
  echelleTuile: 2, // tuiles Kenney (1 u) agrandies ×2
  rayonCarte: 5,
}

// Gains en zarlor selon le nombre de joueurs (docs/specs/01-boucle-de-jeu.md)
export const GAINS = { 2: [10, 3], 3: [10, 5, 0], 4: [10, 5, 2, 0] }
