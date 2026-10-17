// Logique pure du mini-jeu « Fuis la coulée » (aucune dépendance à React ni à Three.js).
import { CONFIG } from './config.js'
import { construireTuiles, etatTuile, regles, versMonde, DEPARTS } from './carte.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerCoureur, deplacerCoureurs, sonner } from '../../commun/arene/coureurs.js'
import { majPieces } from '../../commun/arene/pieces.js'

/** Secondes de jeu écoulées (0 pendant les règles et le compte à rebours). */
export const horloge = (p) => CONFIG.duree - p.temps

/**
 * @param {{appareil: string, couleur: string}[]} joueurs
 */
export function creerPartie(joueurs, aleatoire = Math.random) {
  const tuiles = construireTuiles(aleatoire)
  const p = {
    ...deroule(CONFIG),
    tuiles,
    regles: regles(tuiles),
    pieces: [],
    bombes: [], // { x, z, reste } : la bombe tombe quand reste atteint 0
    explosions: [], // { x, z, age } pour le rendu
    prochaineBombe: CONFIG.bombes.intervalle[1],
    aleatoire,
  }
  p.joueurs = joueurs.map((j, i) => ({ ...creerCoureur(j, i, ...versMonde(...DEPARTS[i]), p.regles), horsJeu: false, retour: 0 }))
  return p
}

const sures = (p, delai = 0) => {
  const t = horloge(p) + delai
  return [...p.tuiles.values()].filter((u) => etatTuile(u, t) === 'pierre')
}

function brulures(p, evts) {
  const { brulure } = CONFIG
  for (const j of p.joueurs) {
    if (j.horsJeu || j.invincible > 0) continue
    const t = p.regles.tuileEn(j.x, j.z)
    if (!t || etatTuile(t, horloge(p)) !== 'lave') continue
    j.points = Math.max(0, j.points - brulure.perte)
    j.horsJeu = true
    j.retour = brulure.horsJeu
    evts.push({ type: 'brule', joueur: j.index, x: j.x, z: j.z })
  }
}

function retours(p, dt) {
  for (const j of p.joueurs) {
    if (!j.horsJeu || (j.retour -= dt) > 0) continue
    // réapparaît sur la tuile sûre la plus proche
    let best = null, dmin = Infinity
    for (const u of sures(p, 1)) {
      const d = Math.hypot(u.x - j.x, u.z - j.z)
      if (d < dmin) { dmin = d; best = u }
    }
    if (best) Object.assign(j, { x: best.x, z: best.z, kx: 0, kz: 0 })
    j.horsJeu = false
    j.invincible = CONFIG.brulure.invincible
  }
}

function majBombes(p, dt, evts) {
  const B = CONFIG.bombes
  p.explosions = p.explosions.filter((e) => (e.age += dt) < 0.6)
  for (const b of p.bombes) b.reste -= dt
  for (const b of p.bombes.filter((x) => x.reste <= 0)) {
    p.explosions.push({ x: b.x, z: b.z, age: 0 })
    evts.push({ type: 'explosion', x: b.x, z: b.z })
    for (const j of p.joueurs) {
      if (j.horsJeu || j.invincible > 0) continue
      const dx = j.x - b.x, dz = j.z - b.z
      if (Math.hypot(dx, dz) < B.rayon) {
        sonner(j, dx || 0.01, dz, B.recul)
        evts.push({ type: 'touche', joueur: j.index })
      }
    }
  }
  p.bombes = p.bombes.filter((x) => x.reste > 0)

  // Les bombes visent un joueur au hasard, à un pas près
  if ((p.prochaineBombe -= dt) <= 0) {
    const [min, max] = B.intervalle
    p.prochaineBombe = min + p.aleatoire() * (max - min)
    const cibles = p.joueurs.filter((j) => !j.horsJeu)
    if (cibles.length) {
      const c = cibles[Math.floor(p.aleatoire() * cibles.length)]
      const a = p.aleatoire() * Math.PI * 2, d = p.aleatoire() * B.visee
      p.bombes.push({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, reste: B.alerte })
    }
  }
}

/**
 * Avance la partie de `dt` secondes.
 * @returns évènements ({type: 'point' | 'brule' | 'explosion' | 'touche' | 'fin' | 'passer' …})
 */
export function majPartie(p, dt, entrees) {
  const evts = []
  if (majDeroule(p, dt, entrees, evts) !== 'jeu') return evts

  deplacerCoureurs(p, dt, entrees, evts, p.regles)
  brulures(p, evts)
  retours(p, dt)
  majBombes(p, dt, evts)
  majPieces(p, evts, sures(p, 3).map((u) => [u.x, u.z]), {
    nombre: CONFIG.pieces.enPlus + p.joueurs.length * CONFIG.pieces.parJoueur,
    rayon: CONFIG.pieces.rayon,
    distanceMin: CONFIG.pieces.distanceMin,
  })
  return evts
}
