// Paramètres du mini-jeu « Le moulin à cannes » (voir docs/specs/minijeux/moulin.md)
export const CONFIG = {
  duree: 70, // s
  decompte: 3, // s
  vitesse: 5, // u/s
  saut: 7.5, // u/s
  gravite: 24, // u/s²
  rayonJoueur: 0.38,
  chute: -4,
  delaiChute: 0.4,
  // Trois rouleaux côte à côte, d'axe x, qui tournent dans des sens alternés
  rouleaux: [{ x: -4.2, sens: 1 }, { x: 0, sens: -1 }, { x: 4.2, sens: 1 }],
  largeur: 4.1, // largeur d'un rouleau
  rayon: 7, // rayon des rouleaux
  lattes: 36, // lattes sur le tour d'un rouleau (chacune coupée en deux moitiés)
  vitesseRotation: [0.12, 0.3], // rad/s, du début à la fin
  glisse: 0.9, // on glisse vers le bord quand on s'éloigne du sommet
  angleMax: 0.85, // rad : au-delà, c'est trop raide, on tombe
  trous: 0.22, // part des lattes manquantes
}
