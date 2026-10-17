// Logique pure du mini-jeu « Fuis la coulée » (aucune dépendance à React ni à Three.js).
import { CONFIG } from './config.js'
import { construireTuiles, etatTuile, regles, versMonde, DEPARTS } from './carte.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerCoureur, deplacerCoureurs, sonner, enJeu, opsArene } from '../../commun/arene/coureurs.js'
import { majLutte } from '../../commun/lutte.js'
import { majPieces } from '../../commun/arene/pieces.js'
import { GAINS } from '../../commun/gains.js'

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
  p.ops = opsArene(p.regles)
  p.joueurs = joueurs.map((j, i) => ({ ...creerCoureur(j, i, ...versMonde(...DEPARTS[i]), p.regles), horsJeu: false, elimine: null }))
  return p
}

const sures = (p, delai = 0) => {
  const t = horloge(p) + delai
  return [...p.tuiles.values()].filter((u) => etatTuile(u, t) === 'pierre')
}

/** Toucher la lave élimine pour le reste du mini-jeu. */
function brulures(p, evts) {
  for (const j of p.joueurs) {
    // porté ou en vol : on ne touche pas le sol (c'est en retombant que ça compte)
    if (!enJeu(j)) continue
    const t = p.regles.tuileEn(j.x, j.z)
    if (!t || etatTuile(t, horloge(p)) !== 'lave') continue
    j.horsJeu = true
    j.elimine = horloge(p)
    evts.push({ type: 'elimine', joueur: j.index, x: j.x, z: j.z })
  }
}

/**
 * Classement : d'abord les survivants (aux pièces), puis les éliminés, du dernier sorti au premier.
 * Les ex æquo partagent la meilleure place et le meilleur gain.
 */
export function classement(joueurs) {
  const score = (j) => (j.elimine === null ? 1e6 + j.points : j.elimine)
  const tri = [...joueurs].sort((a, b) => score(b) - score(a))
  const gains = GAINS[joueurs.length] || GAINS[4]
  let place = 0
  return tri.map((j, i) => {
    if (i === 0 || score(j) < score(tri[i - 1])) place = i + 1
    return { joueur: j.index, points: j.points, elimine: j.elimine !== null, place, zarlor: gains[place - 1] ?? 0 }
  })
}

function majBombes(p, dt, evts) {
  const B = CONFIG.bombes
  p.explosions = p.explosions.filter((e) => (e.age += dt) < 0.6)
  for (const b of p.bombes) b.reste -= dt
  for (const b of p.bombes.filter((x) => x.reste <= 0)) {
    p.explosions.push({ x: b.x, z: b.z, age: 0 })
    evts.push({ type: 'explosion', x: b.x, z: b.z })
    for (const j of p.joueurs) {
      if (!enJeu(j) || j.invincible > 0) continue
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
    const cibles = p.joueurs.filter(enJeu)
    if (cibles.length) {
      const c = cibles[Math.floor(p.aleatoire() * cibles.length)]
      const a = p.aleatoire() * Math.PI * 2, d = p.aleatoire() * B.visee
      p.bombes.push({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, reste: B.alerte })
    }
  }
}

/**
 * Avance la partie de `dt` secondes.
 * @returns évènements ({type: 'point' | 'elimine' | 'explosion' | 'touche' | 'fin' | 'passer' …})
 */
export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classement(p.joueurs)
  if (etape !== 'jeu') return evts

  deplacerCoureurs(p, dt, entrees, evts, p.regles)
  majLutte(p, dt, entrees, evts, p.ops)
  brulures(p, evts)
  majBombes(p, dt, evts)
  majPieces(p, evts, sures(p, 3).map((u) => [u.x, u.z]), {
    nombre: CONFIG.pieces.enPlus + p.joueurs.length * CONFIG.pieces.parJoueur,
    rayon: CONFIG.pieces.rayon,
    distanceMin: CONFIG.pieces.distanceMin,
  })

  // Fin anticipée : plus personne en course, ou un seul survivant à plusieurs
  const survivants = p.joueurs.filter((j) => j.elimine === null).length
  if (survivants === 0 || (p.joueurs.length > 1 && survivants === 1)) {
    p.phase = 'fin'
    p.classement = classement(p.joueurs)
    evts.push({ type: 'fin' })
  }
  return evts
}
