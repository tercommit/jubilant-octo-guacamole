// Règles communes des mini-jeux « à la Fall Guys » : élimination, fin de survie, classements, courses.
import { classer } from '../arene/deroule.js'

/** Élimine un joueur pour le reste du mini-jeu (il disparaît). */
export function eliminer(p, j, evts) {
  j.horsJeu = true
  j.elimine = p.t
  j.affiche = '✗'
  evts.push({ type: 'elimine', joueur: j.index, x: j.x, y: Math.max(j.y, 0), z: j.z })
}

/** Survie : d'abord les survivants (aux points), puis les éliminés, du dernier sorti au premier. */
export const classementSurvie = (joueurs) =>
  classer(joueurs, (j) => (j.elimine === null ? 1e6 + j.points : j.elimine), (j) => ({ elimine: j.elimine !== null }))

/** Fin anticipée d'une survie : plus personne, ou un seul survivant à plusieurs. Renvoie true si c'est fini. */
export function finSurvie(p, evts) {
  const survivants = p.joueurs.filter((j) => j.elimine === null).length
  if (survivants > 0 && (p.joueurs.length === 1 || survivants > 1)) return false
  p.phase = 'fin'
  p.classement = classementSurvie(p.joueurs)
  evts.push({ type: 'fin' })
  return true
}

/** Course : les arrivés par ordre d'arrivée, puis les autres selon la distance parcourue. */
export const classementCourse = (joueurs) =>
  classer(joueurs, (j) => (j.arrive !== null ? 1e6 - j.arrive : Math.round(j.progression * 100)), (j) => ({
    detail: j.arrive !== null ? `arrivé en ${j.arrive.toFixed(1)} s` : `${Math.round(j.progression * 100)} % du parcours`,
  }))

/**
 * Course vers les z négatifs : progression, points de passage (on y réapparaît après une chute), arrivée.
 * piste : { zDepart, zArrivee, passages: [z] }
 */
export function majCourse(p, piste, evts) {
  for (const j of p.joueurs) {
    if (j.arrive !== null || j.horsJeu) continue
    if (j.tombe === 0 && j.sol) while (j.passage + 1 < piste.passages.length && j.z <= piste.passages[j.passage + 1]) j.passage++
    j.progression = Math.max(j.progression ?? 0, Math.min(1, Math.max(0, (piste.zDepart - j.z) / (piste.zDepart - piste.zArrivee))))
    j.affiche = `${Math.round(j.progression * 100)} %`
    if (j.z <= piste.zArrivee && j.tombe === 0) {
      j.arrive = p.duree - p.temps
      j.rang = (p.arrives = (p.arrives ?? 0) + 1)
      j.affiche = ['1er', '2e', '3e', '4e'][j.rang - 1] + ' ✓'
      evts.push({ type: 'arrivee', joueur: j.index, x: j.x, y: j.y, z: j.z })
    }
  }
  if (p.joueurs.every((j) => j.arrive !== null)) {
    p.phase = 'fin'
    p.classement = classementCourse(p.joueurs)
    evts.push({ type: 'fin' })
  }
}

/** Réapparition au dernier point de passage d'une course, dans la largeur de la piste. */
export function reapparaitre(j, piste, demiLargeur) {
  const r = 0.4
  Object.assign(j, {
    z: piste.passages[j.passage], x: Math.max(-demiLargeur + r, Math.min(demiLargeur - r, j.x * 0.5)),
    y: 0.6, vy: 0, kx: 0, kz: 0, sol: false, surface: null, etourdi: 0, invincible: 1,
  })
}
