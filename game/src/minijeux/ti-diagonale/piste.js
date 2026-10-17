// Tracé de la piste : sols, obstacles, points de passage. La piste part de z = 0 et file vers les z négatifs.
// Tous les sols ont leur dessus à y = 0 ; entre eux, c'est la ravine.
import { CONFIG } from './config.js'

export const Z_DEPART = -1.5
export const Z_ARRIVEE = -74
export const DEPARTS_X = [-3, -1, 1, 3]
export const DEPARTS_ARRIERE = 1.5 // on ne peut pas reculer derrière cette ligne

// Rectangles { x, z, l (largeur en x), p (profondeur en z) }
export const SOLS = [
  { x: 0, z: -9, l: 8, p: 22 }, // départ + cannes à sucre (z 2 → -20)
  { x: 0, z: -32.3, l: 8, p: 3.8 }, // replat entre les deux ravines (z -30.4 → -34.2)
  { x: 0, z: -62.65, l: 8, p: 35.1 }, // pics, coulée et arrivée (z -45.1 → -80.2)
]

// Ravine des galets : pierres fixes
export const GALETS = [
  ...[-3, 0, 3].map((x) => ({ x, z: -22, l: 1.8, p: 1.6 })),
  ...[-3.5, -1.2, 1.2, 3.5].map((x) => ({ x, z: -25.2, l: 1.5, p: 1.6 })),
  ...[-3, 0, 3].map((x) => ({ x, z: -28.4, l: 1.8, p: 1.6 })),
]

// Ravine des radeaux : plateformes qui glissent de gauche à droite
export const MOBILES = [
  { x: -2, z: -36, l: 2.2, p: 2.2, amplitude: 1.6, vitesse: 1.3, phase: 0 },
  { x: 2, z: -36, l: 2.2, p: 2.2, amplitude: 1.6, vitesse: 1.3, phase: 0 },
  { x: -2, z: -39.4, l: 2.2, p: 2.2, amplitude: 1.6, vitesse: 1.7, phase: Math.PI },
  { x: 2, z: -39.4, l: 2.2, p: 2.2, amplitude: 1.6, vitesse: 1.7, phase: Math.PI },
  { x: -2, z: -42.8, l: 2.2, p: 2.2, amplitude: 1.6, vitesse: 1.1, phase: Math.PI / 2 },
  { x: 2, z: -42.8, l: 2.2, p: 2.2, amplitude: 1.6, vitesse: 1.1, phase: Math.PI / 2 },
]

// Cannes à sucre qui tournent au ras du sol (sens : 1 ou -1)
export const CANNES = [
  { x: 0, z: -9.5, sens: 1, phase: 0 },
  { x: 0, z: -16, sens: -1, phase: Math.PI / 2 },
]

// Rangées de pics : 8 cases par rangée, qui sortent en vague
const RANGEES_PICS = [{ z: -48.5, sens: 1 }, { z: -52.5, sens: -1 }, { z: -56.5, sens: 1 }]
export const PICS = RANGEES_PICS.flatMap(({ z, sens }, r) =>
  Array.from({ length: 8 }, (_, i) => ({
    x: -3.5 + i, z, l: 1, p: 1.2,
    phase: (((sens > 0 ? i : 7 - i) / 8) * CONFIG.pics.periode + r * 0.4) % CONFIG.pics.periode,
  })))

// Coulée : les roches de basalte dévalent vers le départ
export const COULEE = { depart: -72.5, fin: -60.5 }

// Points de passage : on y réapparaît après une chute
export const POINTS_PASSAGE = [Z_DEPART, -19, -32.3, -46, -60]

export const LONGUEUR = Z_DEPART - Z_ARRIVEE

export function xMobile(m, t) {
  return m.x + m.amplitude * Math.sin(t * m.vitesse + m.phase)
}

export function angleCanne(c, t) {
  return c.sens * CONFIG.cannes.vitesse * t + c.phase
}

/** Position dans le cycle d'une case de pics : 'sortis', 'alerte' ou 'rentres'. */
export function etatPic(c, t) {
  const { periode, sortis, alerte } = CONFIG.pics
  const u = (((t + c.phase) % periode) + periode) % periode
  if (u < sortis) return 'sortis'
  if (u > periode - alerte) return 'alerte'
  return 'rentres'
}

const MARGE = 0.12 // un peu d'indulgence au bord des plateformes
const dedans = (r, x, z, cx = r.x) => Math.abs(x - cx) <= r.l / 2 + MARGE && Math.abs(z - r.z) <= r.p / 2 + MARGE

/** Sol sous (x, z) à l'instant t : { hauteur, mobile } ou null au-dessus du vide. */
export function support(x, z, t) {
  for (const s of SOLS) if (dedans(s, x, z)) return { hauteur: 0, mobile: null }
  for (const g of GALETS) if (dedans(g, x, z)) return { hauteur: 0, mobile: null }
  for (const m of MOBILES) if (dedans(m, x, z, xMobile(m, t))) return { hauteur: 0, mobile: m }
  return null
}

/** Progression sur la piste, de 0 (départ) à 1 (arrivée). */
export function progression(z) {
  return Math.min(1, Math.max(0, (Z_DEPART - z) / LONGUEUR))
}
