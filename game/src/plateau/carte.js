// Cases du plateau : une boucle de 30 cases autour de l'île, et le Chemin des Hauts qui la coupe par le milieu.
// Chaque case : { id, x, y, z, suivants: [id], zone: 'cote' | 'hauts' }. La case 0 est le départ.
import ILE from './ile.json'
import { hauteurSol, reliefAplani, hauteurRelief } from './ile.js'

// Tracé tiré de la vraie Réunion (cartes/export_plateau.py) : la côte à quelques kilomètres du rivage,
// la fourche à Saint-Pierre et le Chemin des Hauts par la route des Plaines jusqu'à Saint-Benoît.
export const DEPART = 0
const FOURCHE = ILE.fourche // embranchement : on continue sur la côte ou on monte dans les Hauts
const REJOINT = ILE.rejoint

function construire() {
  const N = ILE.cote.length
  const cases = ILE.cote.map(([x, z], i) => ({ id: i, x, z, suivants: [(i + 1) % N], zone: 'cote' }))
  let precedent = cases[FOURCHE]
  for (const [x, z] of ILE.hauts) {
    const c = { id: cases.length, x, z, suivants: [], zone: 'hauts' }
    cases.push(c)
    precedent.suivants.push(c.id)
    precedent = c
  }
  precedent.suivants.push(REJOINT)
  // Chaque case repose sur le relief
  for (const c of cases) c.y = Math.max(hauteurSol(c.x, c.z), 0.1)
  return cases
}

export const CASES = construire()

/** Liaisons à dessiner : [de, vers] */
export const LIAISONS = CASES.flatMap((c) => c.suivants.map((s) => [c.id, s]))

/** Relief de l'île aplani sous les cases et les chemins, et sa hauteur en (x, z). */
export const RELIEF = reliefAplani(CASES, LIAISONS.map(([a, b]) => [CASES[a], CASES[b]]))
export const hauteurPlateau = (x, z) => hauteurRelief(RELIEF, x, z)

/** Distance de (x, z) au chemin le plus proche. */
export function distanceChemin(x, z) {
  let d = Infinity
  for (const [a, b] of LIAISONS) {
    const A = CASES[a], B = CASES[b], dx = B.x - A.x, dz = B.z - A.z
    const t = Math.min(1, Math.max(0, ((x - A.x) * dx + (z - A.z) * dz) / (dx * dx + dz * dz)))
    d = Math.min(d, Math.hypot(x - A.x - dx * t, z - A.z - dz * t))
  }
  return d
}

/** Distance de (x, z) au centre de la case la plus proche. */
export const distanceCase = (x, z) => Math.min(...CASES.map((c) => Math.hypot(c.x - x, c.z - z)))

/** Distance en nombre de cases, dans les deux sens (parcours en largeur). */
export function distances(depuis) {
  const voisins = CASES.map(() => [])
  for (const [a, b] of LIAISONS) { voisins[a].push(b); voisins[b].push(a) }
  const d = CASES.map(() => Infinity)
  d[depuis] = 0
  const file = [depuis]
  while (file.length) {
    const c = file.shift()
    for (const v of voisins[c]) if (d[v] === Infinity) { d[v] = d[c] + 1; file.push(v) }
  }
  return d
}
