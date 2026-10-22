// Cases du plateau : une boucle de 30 cases autour de l'île, et le Chemin des Hauts qui la coupe par le milieu.
// Chaque case : { id, x, y, z, suivants: [id], zone: 'cote' | 'hauts' }. La case 0 est le départ.
import ILE from './ile.json'
import { hauteurSol } from './ile.js'

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
