// Déroulé commun des mini-jeux à points : règles → « Prêt ? » → compte à rebours → jeu chronométré → fin.
// Logique pure, partagée par les arènes (Sentier de Mafate, Lagon, Volcan).
import { majPause, OPTIONS_MINIJEU } from '../menu.js'
import { GAINS } from '../gains.js'

/** Champs de déroulé à mettre dans l'état d'une partie. */
export const deroule = (config) => ({
  phase: 'regles', // regles → decompte → jeu → fin
  pause: false,
  menu: null,
  temps: config.duree,
  decompte: config.decompte,
})

/**
 * Fait avancer le déroulé de `dt` secondes.
 * @returns 'depart' (la partie commence), 'jeu' (la partie tourne), 'fin' (le temps vient de s'écouler) ou null
 */
export function majDeroule(p, dt, entrees, evts) {
  if (p.phase !== 'fin' && majPause(p, entrees, evts, OPTIONS_MINIJEU)) return null
  const appui = (j) => entrees.appuis.get(j.appareil) || {}

  if (p.phase === 'regles') {
    for (const j of p.joueurs) if (appui(j).a && !j.pret) { j.pret = true; evts.push({ type: 'pret', joueur: j.index }) }
    if (p.joueurs.every((j) => j.pret)) { p.phase = 'decompte'; evts.push({ type: 'decompte' }) }
    return null
  }
  if (p.phase === 'decompte') {
    p.decompte -= dt
    if (p.decompte <= 0) { p.phase = 'jeu'; evts.push({ type: 'partez' }); return 'depart' }
    return null
  }
  if (p.phase !== 'jeu') return null

  p.temps -= dt
  if (p.temps <= 0) {
    p.temps = 0
    p.phase = 'fin'
    p.classement = classementPoints(p.joueurs)
    evts.push({ type: 'fin' })
    return 'fin'
  }
  return 'jeu'
}

/** Classement aux points : les ex æquo partagent la meilleure place et le meilleur gain. */
export function classementPoints(joueurs) {
  const tri = [...joueurs].sort((a, b) => b.points - a.points)
  const gains = GAINS[joueurs.length] || GAINS[4]
  let place = 0
  return tri.map((j, i) => {
    if (i === 0 || j.points < tri[i - 1].points) place = i + 1
    return { joueur: j.index, points: j.points, place, zarlor: gains[place - 1] ?? 0 }
  })
}
