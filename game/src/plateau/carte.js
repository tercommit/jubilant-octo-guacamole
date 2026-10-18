// Cases du plateau : une boucle de 30 cases autour de l'île, et le Chemin des Hauts qui la coupe par le milieu.
// Chaque case : { id, x, z, suivants: [id], zone: 'cote' | 'hauts', type }. La case 0 est le départ.
// Types (voir docs/specs/05-cases.md) : 'depart', 'bleue' (+zarlor), 'rouge' (−zarlor), 'chance', 'cyclone'.

const N = 30
const RX = 15, RZ = 10.5
const ESPACEMENT = 2.7

export const DEPART = 0
const FOURCHE = 4 // embranchement : on continue sur la côte ou on monte dans les Hauts
const REJOINT = 14

// Cases spéciales de la côte ; les autres sont bleues
const TYPES_COTE = {
  3: 'rouge', 6: 'chance', 8: 'rouge', 10: 'cyclone', 12: 'rouge', 17: 'rouge', 19: 'chance',
  21: 'rouge', 24: 'cyclone', 26: 'rouge', 28: 'chance',
}
// Chemin des Hauts, de la fourche vers la côte : plus court, mais plus risqué
const TYPES_HAUTS = ['bleue', 'rouge', 'bleue', 'chance', 'rouge', 'bleue', 'rouge']

function construire() {
  const cases = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2
    return { id: i, x: RX * Math.sin(a), z: RZ * Math.cos(a), suivants: [(i + 1) % N], zone: 'cote' }
  })

  // Chemin des Hauts : courbe de Bézier de la fourche à la case où il rejoint la côte
  const A = cases[FOURCHE], B = cases[REJOINT], C = { x: -1, z: 1 }
  const point = (t) => ({
    x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * C.x + t * t * B.x,
    z: (1 - t) ** 2 * A.z + 2 * (1 - t) * t * C.z + t * t * B.z,
  })
  const echant = Array.from({ length: 201 }, (_, i) => point(i / 200))
  const cumul = [0]
  for (let i = 1; i < echant.length; i++) cumul.push(cumul[i - 1] + Math.hypot(echant[i].x - echant[i - 1].x, echant[i].z - echant[i - 1].z))
  const total = cumul[cumul.length - 1]
  const n = Math.round(total / ESPACEMENT) - 1
  let precedent = A
  for (let k = 1; k <= n; k++) {
    const cible = (k / (n + 1)) * total
    const i = cumul.findIndex((c) => c >= cible)
    const c = { id: cases.length, ...echant[i], suivants: [], zone: 'hauts' }
    cases.push(c)
    precedent.suivants.push(c.id)
    precedent = c
  }
  precedent.suivants.push(REJOINT)

  for (const c of cases) {
    if (c.id === DEPART) c.type = 'depart'
    else if (c.zone === 'cote') c.type = TYPES_COTE[c.id] ?? 'bleue'
    else c.type = TYPES_HAUTS[c.id - N] ?? 'bleue'
  }
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
