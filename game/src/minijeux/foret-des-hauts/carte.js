// Carte hexagonale du cirque : types de tuiles, conversions et règles de déplacement.
import { CONFIG } from './config.js'

const S = CONFIG.echelleTuile
const R = CONFIG.rayonCarte
export const HAUT_SOL = 0.2 * S // dessus des tuiles d'herbe

const cle = (q, r) => `${q},${r}`
// Ajoute une paire symétrique par rapport au centre (carte équitable pour 4 joueurs).
const paire = (liste) => liste.flatMap(([q, r]) => (q === 0 && r === 0 ? [[0, 0]] : [[q, r], [-q, -r]]))

const PONTS = [[-3, 0], [3, 0]]
const FORET = paire([[-1, 3], [-2, 2], [2, 1], [-4, 3], [3, 2], [-1, 1], [1, 2]])
// Décors infranchissables : [q, r, modèle]
const REMPARTS = [
  ...paire([[0, 2]]).map(([q, r]) => [q, r, 'mountain_A_grass_trees']),
  ...paire([[-4, 1]]).map(([q, r]) => [q, r, 'mountain_B_grass_trees']),
  ...paire([[-3, 5]]).map(([q, r]) => [q, r, 'hills_A_trees']),
  ...paire([[5, -2], [2, 3]]).map(([q, r]) => [q, r, 'trees_B_medium']),
]
export const DEPARTS = [[-4, 4], [0, 4], [4, -4], [0, -4]]

export function versMonde(q, r) {
  return [S * (q + r / 2), S * 0.866 * r]
}

export function versHex(x, z) {
  const r = z / (S * 0.866)
  const q = x / S - r / 2
  // arrondi en coordonnées cubiques
  let rx = Math.round(q), rz = Math.round(r), ry = Math.round(-q - r)
  const dx = Math.abs(rx - q), dz = Math.abs(rz - r), dy = Math.abs(ry + q + r)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dz > dy) rz = -rx - ry
  return [rx, rz]
}

function construire() {
  const tuiles = new Map()
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (Math.abs(q + r) > R) continue
      let type = 'herbe'
      if (r === 0) type = 'riviere'
      tuiles.set(cle(q, r), { q, r, type, decor: null })
    }
  }
  for (const [q, r] of PONTS) tuiles.get(cle(q, r)).type = 'pont'
  for (const [q, r] of FORET) tuiles.get(cle(q, r)).type = 'foret'
  for (const [q, r, modele] of REMPARTS) Object.assign(tuiles.get(cle(q, r)), { type: 'rempart', decor: modele })
  return tuiles
}

export const TUILES = construire()

export function tuileEn(x, z) {
  const [q, r] = versHex(x, z)
  return TUILES.get(cle(q, r)) || null
}

export const praticable = (t) => !!t && (t.type === 'herbe' || t.type === 'foret' || t.type === 'pont')

// Tuiles atteignables depuis le premier départ (parcours en largeur) : les balises n'apparaissent que là.
const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]
function atteignables() {
  const vues = new Set([cle(...DEPARTS[0])])
  const file = [DEPARTS[0]]
  while (file.length) {
    const [q, r] = file.shift()
    for (const [dq, dr] of VOISINS) {
      const k = cle(q + dq, r + dr)
      if (!vues.has(k) && praticable(TUILES.get(k))) { vues.add(k); file.push([q + dq, r + dr]) }
    }
  }
  return vues
}
const ATTEIGNABLES = atteignables()

/** Un cercle de rayon `rayon` centré en (x, z) tient-il entièrement sur du praticable ? */
export function positionLibre(x, z, rayon) {
  if (!praticable(tuileEn(x, z))) return false
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    if (!praticable(tuileEn(x + Math.cos(a) * rayon, z + Math.sin(a) * rayon))) return false
  }
  return true
}

/** Hauteur du sol sous le joueur (le pont fait une petite bosse). */
export function hauteurSol(x, z) {
  const t = tuileEn(x, z)
  if (t?.type !== 'pont') return HAUT_SOL
  const [, cz] = versMonde(t.q, t.r)
  const u = (z - cz) / (S * 0.58)
  return HAUT_SOL + 0.5 * Math.max(0, 1 - u * u)
}

export function facteurVitesse(x, z) {
  return tuileEn(x, z)?.type === 'foret' ? CONFIG.ralentissementForet : 1
}

export function positionDepart(i) {
  const [q, r] = DEPARTS[i]
  return versMonde(q, r)
}

/** Tire une position de balise sur une tuile d'herbe, loin des joueurs et de la balise précédente. */
export function tirerBalise(eviter, aleatoire = Math.random) {
  const candidates = [...TUILES.values()].filter(
    (t) => (t.type === 'herbe' || t.type === 'foret') && ATTEIGNABLES.has(cle(t.q, t.r)))
  for (let essai = 0; essai < 200; essai++) {
    const t = candidates[Math.floor(aleatoire() * candidates.length)]
    const [x, z] = versMonde(t.q, t.r)
    if (eviter.every(([ex, ez]) => Math.hypot(ex - x, ez - z) >= CONFIG.distanceMinBalise)) return [x, z]
  }
  const t = candidates[Math.floor(aleatoire() * candidates.length)]
  return versMonde(t.q, t.r)
}
