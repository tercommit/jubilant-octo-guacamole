// Logique pure du mini-jeu « Les bascules » (à la See Saw) : course sur des planches posées sur un pivot au-dessus
// de l'étang de Saint-Paul. Le poids des joueurs les fait pencher : trop d'un côté, et tout le monde glisse à l'eau.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu } from '../../commun/saut/physique.js'
import { classementCourse, majCourse, reapparaitre } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

const { demiLargeur, pontons, bascules } = CONFIG
export const PISTE = { zDepart: 1, zArrivee: CONFIG.zArrivee, passages: pontons.map(([a, b]) => (a + b) / 2) }
PISTE.passages[0] = 1
const DEPARTS = [[-1.8, 1], [-0.6, 1], [0.6, 1], [1.8, 1]]

/** Hauteur de la planche b en z : l'angle a > 0 relève le bout côté départ (z les plus grands). */
export const hauteurPlanche = (b, a, z) => (z - b.z) * Math.tan(a)

const MONDE = {
  config: CONFIG,
  support(x, z, y, p) {
    if (y < -1.2) return null
    for (const [z1, z2] of pontons) if (z <= z1 && z >= z2 && Math.abs(x) <= demiLargeur) return { y: 0 }
    for (let i = 0; i < bascules.length; i++) {
      const b = bascules[i]
      if (Math.abs(z - b.z) <= b.demi && Math.abs(x - b.x) <= demiLargeur) return { y: hauteurPlanche(b, p.angles[i], z), bascule: i }
    }
    return null
  },
  // on glisse vers le bas de la planche
  glisse: (j, p) => (j.surface?.bascule !== undefined ? [0, -Math.sin(p.angles[j.surface.bascule]) * CONFIG.glisse] : [0, 0]),
  // le bout relevé d'une bascule fait mur : on attend qu'il redescende, ou on saute dessus
  bloque(x, z, y, p) {
    if (z > 2.6 || z < CONFIG.zArrivee - 3.5) return true
    const s = MONDE.support(x, z, y, p)
    return !!s && s.bascule !== undefined && s.y > y + 0.35
  },
  tombe: (j) => reapparaitre(j, PISTE, demiLargeur),
}

export function creerPartie(joueurs) {
  const p = { ...deroule(CONFIG), angles: bascules.map(() => 0), vitesses: bascules.map(() => 0), arrives: 0 }
  p.joueurs = joueurs.map((j, i) => ({ ...creerSauteur(j, i, ...DEPARTS[i]), passage: 0, progression: 0 }))
  return p
}

/** Chaque bascule penche du côté où pèsent les joueurs, et revient doucement à l'horizontale. */
function majBascules(p, dt) {
  bascules.forEach((b, i) => {
    let couple = 0
    for (const j of p.joueurs) if (enJeu(j) && j.sol && j.surface?.bascule === i) couple += (j.z - b.z) / b.demi
    const acc = -couple * CONFIG.poids - CONFIG.raideur * p.angles[i] - CONFIG.amorti * p.vitesses[i]
    p.vitesses[i] += acc * dt
    p.angles[i] += p.vitesses[i] * dt
    if (Math.abs(p.angles[i]) > CONFIG.angleMax) { p.angles[i] = Math.sign(p.angles[i]) * CONFIG.angleMax; p.vitesses[i] = 0 }
  })
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementCourse(p.joueurs)
  if (etape !== 'jeu') return evts

  majBascules(p, dt)
  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  majCourse(p, PISTE, evts)
  return evts
}
