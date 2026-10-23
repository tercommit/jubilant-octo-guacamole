// Relief de l'île du plateau : la vraie Réunion (MNT Copernicus GLO-30), réduite et exagérée par cartes/export_plateau.py.
import * as THREE from 'three'
import ILE from './ile.json'

const { colonnes, lignes, x0, z0, pas, pasZ, y: Y } = ILE.grille
export const SOL = ILE.sol
const KM_PAR_HAUTEUR = ILE.kmParUnite / ILE.exageration

/** Hauteur du relief brut en (x, z), interpolée entre les sommets de la grille. */
export const hauteurSol = (x, z) => hauteurRelief(Y, x, z)

/** Altitude réelle (m) correspondant à une hauteur de la scène. */
export const altitude = (y) => Math.max(0, (y - SOL) * KM_PAR_HAUTEUR * 1000)

// Couleurs low poly : rivage, savanes et champs, forêts des Hauts, remparts, sommets
const C = {
  sable: new THREE.Color('#efd9a7'),
  bas: new THREE.Color('#6dbe45'),
  moyen: new THREE.Color('#58a83c'),
  foret: new THREE.Color('#3f8a35'),
  lande: new THREE.Color('#9a8a5c'),
  roche: new THREE.Color('#857464'),
  cime: new THREE.Color('#d9d2c7'),
  fond: new THREE.Color('#e3d3a0'),
  large: new THREE.Color('#1d6f96'),
}

function couleurFace(y, pente, cible) {
  if (y < SOL) return cible.copy(C.fond).lerp(C.large, Math.min(1, -y / 1.1))
  const m = altitude(y)
  if (m < 40) return cible.copy(C.sable)
  if (pente < 0.5 && m > 150) return cible.copy(C.roche) // remparts et falaises des cirques
  if (m < 600) return cible.copy(C.bas)
  if (m < 1300) return cible.copy(C.moyen)
  if (m < 1900) return cible.copy(C.foret)
  if (m < 2500) return cible.copy(C.lande)
  return cible.copy(m < 2800 ? C.roche : C.cime)
}

const lisse = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k) }

/**
 * Relief aplani sous les cases et les chemins pour que le plateau y repose : hauteur de chaque sommet de la grille.
 * cases : [{ x, y, z }] ; segments : [[A, B]] entre deux cases.
 */
export function reliefAplani(cases, segments) {
  const ys = new Float32Array(Y.length)
  for (let k = 0; k < Y.length; k++) {
    const x = x0 + (k % colonnes) * pas, z = z0 + Math.floor(k / colonnes) * pasZ
    let y = Y[k], poids = 0, cible = y
    for (const c of cases) {
      const w = 1 - lisse(1.05, 1.6, Math.hypot(x - c.x, z - c.z))
      if (w > poids) { poids = w; cible = c.y }
    }
    for (const [A, B] of segments) {
      const dx = B.x - A.x, dz = B.z - A.z
      const t = Math.min(1, Math.max(0, ((x - A.x) * dx + (z - A.z) * dz) / (dx * dx + dz * dz)))
      const w = 1 - lisse(0.4, 0.95, Math.hypot(x - A.x - dx * t, z - A.z - dz * t))
      if (w > poids) { poids = w; cible = A.y + (B.y - A.y) * t }
    }
    if (y >= SOL) y += (cible - 0.03 - y) * poids
    ys[k] = y
  }
  return ys
}

/** Hauteur d'un relief (brut ou aplani) en (x, z), interpolée entre les sommets de la grille. */
export function hauteurRelief(ys, x, z) {
  const h = (i, j) => ys[Math.min(lignes - 1, Math.max(0, j)) * colonnes + Math.min(colonnes - 1, Math.max(0, i))]
  const u = (x - x0) / pas, v = (z - z0) / pasZ
  const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j
  return (h(i, j) * (1 - fu) + h(i + 1, j) * fu) * (1 - fv) + (h(i, j + 1) * (1 - fu) + h(i + 1, j + 1) * fu) * fv
}

/** Géométrie du relief : ys vient de reliefAplani (la ligne 0 de la grille au nord). */
export function geometrieIle(ys) {
  const g = new THREE.PlaneGeometry(pas * (colonnes - 1), pasZ * (lignes - 1), colonnes - 1, lignes - 1)
  g.rotateX(-Math.PI / 2) // la ligne 0 (nord) part vers -z
  g.translate(x0 + (pas * (colonnes - 1)) / 2, 0, z0 + (pasZ * (lignes - 1)) / 2)
  const pos = g.attributes.position
  for (let k = 0; k < pos.count; k++) pos.setY(k, ys[k])

  // Faces à plat, une couleur par triangle
  const plat = g.toNonIndexed()
  plat.computeVertexNormals()
  const p = plat.attributes.position, n = plat.attributes.normal
  const couleurs = new Float32Array(p.count * 3)
  const c = new THREE.Color()
  for (let k = 0; k < p.count; k += 3) {
    couleurFace((p.getY(k) + p.getY(k + 1) + p.getY(k + 2)) / 3, n.getY(k), c)
    for (let s = 0; s < 3; s++) c.toArray(couleurs, (k + s) * 3)
  }
  plat.setAttribute('color', new THREE.BufferAttribute(couleurs, 3))
  return plat
}

/** Points de la grille à terre, pour poser le décor. */
export function pointsTerre() {
  const pts = []
  for (let j = 0; j < lignes; j++) {
    for (let i = 0; i < colonnes; i++) {
      const y = Y[j * colonnes + i]
      if (y >= SOL) pts.push({ x: x0 + i * pas, z: z0 + j * pasZ, y })
    }
  }
  return pts
}
