// Grille hexagonale (coordonnées axiales q, r ; tuiles « pointe en haut » comme le Kenney Hexagon Kit).

export const cle = (q, r) => `${q},${r}`
export const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]

/** Distance en tuiles depuis le centre. */
export const anneau = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2

/** Toutes les tuiles d'un disque de rayon R. */
export function disque(R) {
  const liste = []
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (Math.abs(q + r) <= R) liste.push([q, r])
  return liste
}

/** Conversions pour des tuiles de taille S (1 u dans le kit, agrandies dans les arènes). */
export function grille(S) {
  return {
    versMonde: (q, r) => [S * (q + r / 2), S * 0.866 * r],
    versHex(x, z) {
      const r = z / (S * 0.866)
      const q = x / S - r / 2
      // arrondi en coordonnées cubiques
      let rx = Math.round(q), rz = Math.round(r)
      const ry = Math.round(-q - r)
      const dx = Math.abs(rx - q), dz = Math.abs(rz - r), dy = Math.abs(ry + q + r)
      if (dx > dy && dx > dz) rx = -ry - rz
      else if (dz > dy) rz = -rx - ry
      return [rx, rz]
    },
  }
}

/** Un cercle de rayon `rayon` centré en (x, z) tient-il entièrement sur du praticable ? */
export function cercleLibre(x, z, rayon, praticableEn) {
  if (!praticableEn(x, z)) return false
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    if (!praticableEn(x + Math.cos(a) * rayon, z + Math.sin(a) * rayon)) return false
  }
  return true
}
