// Menu Start (pause), partagé par le plateau et les mini-jeux. Logique pure.
// N'importe quel joueur ouvre le menu avec Start, le parcourt au stick (haut / bas) et valide avec A.
// Une manette déconnectée ouvre aussi le menu, qui reste ouvert tant qu'elle n'est pas revenue.

export const OPTIONS_MINIJEU = ['reprendre', 'passer', 'kit']
export const OPTIONS_PLATEAU = ['reprendre', 'kit']

/**
 * Met à jour la pause de `p` (champs pause, menu). Les choix autres que « reprendre » deviennent des évènements
 * ({ type: 'passer' } ou { type: 'kit' }) que l'appelant traite.
 * @returns true si le jeu est en pause
 */
export function majPause(p, entrees, evts, options) {
  const appuis = p.joueurs.map((j) => entrees.appuis.get(j.appareil) || {})
  const deconnecte = p.joueurs.some((j) => !entrees.etats.get(j.appareil)?.connecte)
  const reprendre = () => { p.pause = false; p.menu = null; evts.push({ type: 'pause', pause: false }) }

  if (!p.pause) {
    if (deconnecte || appuis.some((a) => a.start)) {
      p.pause = true
      p.menu = { options, selection: 0, sticks: {} }
      evts.push({ type: 'pause', pause: true })
    }
    return p.pause
  }

  p.menu.options = options
  p.menu.deconnecte = deconnecte
  if (appuis.some((a) => a.start) && !deconnecte) { reprendre(); return false }

  // Stick haut / bas : un cran par poussée, quel que soit le joueur
  for (const j of p.joueurs) {
    const y = entrees.etats.get(j.appareil)?.y ?? 0
    const sens = y > 0.6 ? 1 : y < -0.6 ? -1 : 0
    if (sens && sens !== (p.menu.sticks[j.appareil] ?? 0)) {
      p.menu.selection = (p.menu.selection + sens + options.length) % options.length
    }
    p.menu.sticks[j.appareil] = sens
  }

  if (appuis.some((a) => a.a)) {
    const choix = options[p.menu.selection]
    if (choix === 'reprendre') { if (!deconnecte) reprendre() } else evts.push({ type: choix })
  }
  return p.pause
}

/** Classement d'un mini-jeu passé : personne ne gagne de zarlor. */
export const classementPasse = (joueurs) => joueurs.map((j) => ({ joueur: j.index, place: null, zarlor: 0, passe: true }))
