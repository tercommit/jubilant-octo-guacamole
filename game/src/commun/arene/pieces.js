// Pièces d'or à ramasser (Lagon, Volcan). Logique pure.
// Les pièces se posent au centre des tuiles ; une pièce dont la tuile devient dangereuse disparaît.
import { plusProche } from './coureurs.js'

const cleXZ = (x, z) => `${x.toFixed(2)},${z.toFixed(2)}`

/**
 * @param emplacements [[x, z]] centres des tuiles où une pièce peut se trouver en ce moment
 * @param options { nombre, rayon, distanceMin }
 */
export function majPieces(p, evts, emplacements, { nombre, rayon, distanceMin }) {
  p.pieces ??= []
  p.numeroPiece ??= 0
  const valides = new Set(emplacements.map(([x, z]) => cleXZ(x, z)))
  p.pieces = p.pieces.filter((pc) => valides.has(cleXZ(pc.x, pc.z)))

  for (const pc of [...p.pieces]) {
    const g = plusProche(p.joueurs, pc.x, pc.z, rayon)
    if (!g) continue
    g.points++
    p.pieces = p.pieces.filter((x) => x !== pc)
    evts.push({ type: 'point', joueur: g.index, x: pc.x, z: pc.z })
  }

  // On complète, loin des joueurs et des autres pièces. Quand l'arène rétrécit, on rapproche un peu, mais jamais
  // sous les pieds d'un joueur (sinon il ramasserait une pièce à chaque image) : s'il n'y a pas la place, on en pose moins.
  for (let essai = 0; p.pieces.length < nombre && essai < 40; essai++) {
    const [x, z] = emplacements[Math.floor(p.aleatoire() * emplacements.length)] ?? []
    if (x === undefined) break
    const dJoueurs = essai < 30 ? distanceMin : rayon + 1.5
    const loin = p.joueurs.every((j) => Math.hypot(j.x - x, j.z - z) >= dJoueurs)
      && p.pieces.every((pc) => Math.hypot(pc.x - x, pc.z - z) >= (essai < 30 ? distanceMin : 1))
    if (loin) p.pieces.push({ id: ++p.numeroPiece, x, z })
  }
}
