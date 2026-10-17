// Logique pure du mini-jeu (aucune dépendance à React ni à Three.js) : facile à tester.
import { CONFIG } from './config.js'
import { GAINS } from '../../commun/gains.js'
import { positionLibre, facteurVitesse, positionDepart, tirerBalise, hauteurSol } from './carte.js'

/**
 * @param {{appareil: string, avatar: object, couleur: string}[]} joueurs
 */
export function creerPartie(joueurs, aleatoire = Math.random) {
  const js = joueurs.map((j, i) => {
    const [x, z] = positionDepart(i)
    return {
      ...j, index: i, x, z, y: hauteurSol(x, z), angle: z > 0 ? Math.PI : 0,
      vitesse: 0, points: 0, sprint: 0, recharge: 0, pret: false,
    }
  })
  return {
    phase: 'regles', // regles → decompte → jeu → fin
    pause: false,
    temps: CONFIG.duree,
    decompte: CONFIG.decompte,
    joueurs: js,
    balise: { x: 0, z: 0, active: false, attente: 0, numero: 0 },
    derniereBalise: null,
    aleatoire,
  }
}

function placerBalise(p) {
  const eviter = p.joueurs.map((j) => [j.x, j.z])
  if (p.derniereBalise) eviter.push(p.derniereBalise)
  const [x, z] = tirerBalise(eviter, p.aleatoire)
  Object.assign(p.balise, { x, z, active: true, numero: p.balise.numero + 1 })
}

function deplacer(j, dx, dz) {
  const r = CONFIG.rayonJoueur
  if (positionLibre(j.x + dx, j.z + dz, r)) { j.x += dx; j.z += dz; return }
  // glissement le long des obstacles
  if (positionLibre(j.x + dx, j.z, r)) { j.x += dx; return }
  if (positionLibre(j.x, j.z + dz, r)) j.z += dz
}

/**
 * Avance la partie de `dt` secondes.
 * @param entrees { etats: Map, appuis: Map } (voir commun/entrees.js)
 * @returns liste d'évènements ({type: 'balise', joueur} | {type: 'fin'} | ...)
 */
export function majPartie(p, dt, entrees) {
  const evts = []
  const etat = (j) => entrees.etats.get(j.appareil)
  const appui = (j) => entrees.appuis.get(j.appareil) || {}

  // Pause : Start de n'importe quel joueur, ou manette déconnectée
  if (p.phase === 'jeu' || p.phase === 'decompte') {
    const deconnecte = p.joueurs.some((j) => !etat(j)?.connecte)
    if (deconnecte) p.pause = true
    else if (p.joueurs.some((j) => appui(j).start)) { p.pause = !p.pause; evts.push({ type: 'pause', pause: p.pause }) }
  }
  if (p.pause) return evts

  if (p.phase === 'regles') {
    for (const j of p.joueurs) if (appui(j).a && !j.pret) { j.pret = true; evts.push({ type: 'pret', joueur: j.index }) }
    if (p.joueurs.every((j) => j.pret)) { p.phase = 'decompte'; evts.push({ type: 'decompte' }) }
    return evts
  }

  if (p.phase === 'decompte') {
    p.decompte -= dt
    if (p.decompte <= 0) { p.phase = 'jeu'; placerBalise(p); evts.push({ type: 'partez' }) }
    return evts
  }

  if (p.phase !== 'jeu') return evts

  p.temps -= dt
  if (p.temps <= 0) {
    p.temps = 0
    p.phase = 'fin'
    p.classement = classement(p.joueurs)
    evts.push({ type: 'fin' })
    return evts
  }

  // Déplacements
  for (const j of p.joueurs) {
    const e = etat(j) || { x: 0, y: 0 }
    j.recharge = Math.max(0, j.recharge - dt)
    j.sprint = Math.max(0, j.sprint - dt)
    if (appui(j).a && j.recharge === 0) {
      j.sprint = CONFIG.sprint.duree
      j.recharge = CONFIG.sprint.duree + CONFIG.sprint.recharge
      evts.push({ type: 'sprint', joueur: j.index })
    }
    const amp = Math.hypot(e.x, e.y)
    const v = CONFIG.vitesse * amp * facteurVitesse(j.x, j.z) * (j.sprint > 0 ? CONFIG.sprint.facteur : 1)
    if (amp > 0) {
      j.angle = Math.atan2(e.x, e.y)
      deplacer(j, (e.x / amp) * v * dt, (e.y / amp) * v * dt)
    }
    j.vitesse = v
  }

  // Bousculades : séparation des cercles
  const d = CONFIG.rayonJoueur * 2
  for (let a = 0; a < p.joueurs.length; a++) {
    for (let b = a + 1; b < p.joueurs.length; b++) {
      const A = p.joueurs[a], B = p.joueurs[b]
      const dx = B.x - A.x, dz = B.z - A.z
      const dist = Math.hypot(dx, dz)
      if (dist > 0 && dist < d) {
        const push = (d - dist) / 2
        const nx = dx / dist, nz = dz / dist
        deplacer(A, -nx * push, -nz * push)
        deplacer(B, nx * push, nz * push)
      }
    }
  }
  for (const j of p.joueurs) j.y = hauteurSol(j.x, j.z)

  // Balise
  const bal = p.balise
  if (bal.active) {
    let gagnant = null, best = Infinity
    for (const j of p.joueurs) {
      const dist = Math.hypot(j.x - bal.x, j.z - bal.z)
      if (dist <= CONFIG.rayonBalise && dist < best) { best = dist; gagnant = j }
    }
    if (gagnant) {
      gagnant.points++
      bal.active = false
      bal.attente = CONFIG.delaiNouvelleBalise
      p.derniereBalise = [bal.x, bal.z]
      evts.push({ type: 'balise', joueur: gagnant.index, x: bal.x, z: bal.z })
    }
  } else {
    bal.attente -= dt
    if (bal.attente <= 0) placerBalise(p)
  }
  return evts
}

/** Classement avec égalités : les ex æquo partagent la meilleure place et le meilleur gain. */
export function classement(joueurs) {
  const tri = [...joueurs].sort((a, b) => b.points - a.points)
  const gains = GAINS[joueurs.length] || GAINS[4]
  let place = 0
  return tri.map((j, i) => {
    if (i === 0 || j.points < tri[i - 1].points) place = i + 1
    return { joueur: j.index, points: j.points, place, zarlor: gains[place - 1] ?? 0 }
  })
}
