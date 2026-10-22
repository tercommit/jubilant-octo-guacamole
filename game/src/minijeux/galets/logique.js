// Logique pure du mini-jeu « Les galets traîtres » (à la Tip Toe) : course à travers une ravine pavée de galets.
// Seul un chemin caché est solide ; les faux galets tremblent puis s'enfoncent dès qu'on marche dessus.
// On tombe ? On repart du dernier point de passage. Les premiers arrivés gagnent.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu } from '../../commun/saut/physique.js'
import { classementCourse, majCourse, reapparaitre } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

const { demiLargeur, colonnes, rangees, pasX, pasZ, taille, premiereRangee } = CONFIG
export const ZFIN_GALETS = premiereRangee - (rangees - 1) * pasZ - taille / 2
export const PISTE = { zDepart: 1, zArrivee: ZFIN_GALETS - 6, passages: [1, ZFIN_GALETS - 1.5] }
const DEPARTS = [[-3, 1], [-1, 1], [1, 1], [3, 1]]

export const xGalet = (c) => (c - (colonnes - 1) / 2) * pasX
export const zGalet = (r) => premiereRangee - r * pasZ

/** Galets { c, r, x, z, vrai, pose (t du premier pas sur un faux) }. Le chemin solide avance d'une colonne au plus par rangée. */
function creerGalets(aleatoire) {
  const vrais = new Set()
  let c = Math.floor(aleatoire() * colonnes)
  for (let r = 0; r < rangees; r++) {
    vrais.add(`${c},${r}`)
    // parfois deux galets de suite sur la même rangée : le chemin serpente
    const pas = Math.floor(aleatoire() * 3) - 1
    const suivant = Math.max(0, Math.min(colonnes - 1, c + pas))
    if (suivant !== c && r < rangees - 1) vrais.add(`${suivant},${r}`)
    c = suivant
  }
  const galets = []
  for (let r = 0; r < rangees; r++) {
    for (let k = 0; k < colonnes; k++) {
      galets.push({ c: k, r, x: xGalet(k), z: zGalet(r), vrai: vrais.has(`${k},${r}`) || aleatoire() < CONFIG.leurres, pose: null })
    }
  }
  return galets
}

/** 'galet', 'tremble' ou 'coule' à l'instant t. */
export function etatGalet(g, t) {
  if (g.pose === null) return 'galet'
  return t - g.pose < CONFIG.tremble ? 'tremble' : 'coule'
}

const galetEn = (p, x, z) => p.galets.find((g) => Math.abs(x - g.x) <= taille / 2 + 0.08 && Math.abs(z - g.z) <= taille / 2 + 0.08)

const MONDE = {
  config: CONFIG,
  support(x, z, y, p) {
    if (y < -0.6 || Math.abs(x) > demiLargeur) return null
    if (z >= premiereRangee + taille / 2 || z <= ZFIN_GALETS) return z <= 3 ? { y: 0 } : null // berges
    const g = galetEn(p, x, z)
    return g && etatGalet(g, p.t) !== 'coule' ? { y: 0, galet: g } : null
  },
  // les parois de la ravine
  bloque: (x) => Math.abs(x) > demiLargeur - CONFIG.rayonJoueur,
  tombe: (j) => reapparaitre(j, PISTE, demiLargeur),
}

export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = { ...deroule(CONFIG), galets: creerGalets(aleatoire), arrives: 0 }
  p.joueurs = joueurs.map((j, i) => ({ ...creerSauteur(j, i, ...DEPARTS[i]), passage: 0, progression: 0 }))
  return p
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementCourse(p.joueurs)
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  for (const j of p.joueurs) {
    // marcher sur un faux galet le fait s'enfoncer (pour tout le monde)
    const g = enJeu(j) && j.sol ? j.surface?.galet : null
    if (g && !g.vrai && g.pose === null) { g.pose = p.t; evts.push({ type: 'piege', x: g.x, z: g.z }) }
    // on ne reste pas bloqué au fond de la berge d'arrivée
    if (j.z < PISTE.zArrivee - 3) j.z = PISTE.zArrivee - 3
  }
  majCourse(p, PISTE, evts)
  return evts
}
