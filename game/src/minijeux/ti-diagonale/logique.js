// Logique pure du mini-jeu (aucune dépendance à React ni à Three.js) : facile à tester.
import { CONFIG } from './config.js'
import { GAINS } from '../../commun/gains.js'
import {
  Z_DEPART, Z_ARRIVEE, DEPARTS_X, DEPARTS_ARRIERE, CANNES, PICS, COULEE, POINTS_PASSAGE,
  support, xMobile, angleCanne, etatPic, progression,
} from './piste.js'

/**
 * @param {{appareil: string, avatar: object, couleur: string}[]} joueurs
 */
export function creerPartie(joueurs, aleatoire = Math.random) {
  const js = joueurs.map((j, i) => ({
    ...j, index: i, x: DEPARTS_X[i], y: 0, z: Z_DEPART, vy: 0, angle: Math.PI,
    kx: 0, kz: 0, // recul après un choc
    sol: true, mobile: null, depuisSol: 0, tampon: 0,
    etourdi: 0, invincible: 0, tombe: 0,
    passage: 0, progression: 0, arrive: null, vitesse: 0, pret: false,
  }))
  return {
    phase: 'regles', // regles → decompte → jeu → fin
    pause: false,
    temps: CONFIG.duree,
    decompte: CONFIG.decompte,
    t: 0, // temps de jeu écoulé : anime tous les obstacles
    joueurs: js,
    roches: [],
    prochaineRoche: 0,
    numeroRoche: 0,
    arrives: 0,
    aleatoire,
  }
}

function toucher(j, dx, dz, evts) {
  const n = Math.hypot(dx, dz) || 1
  j.kx = (dx / n) * CONFIG.recul.force
  j.kz = (dz / n) * CONFIG.recul.force
  j.etourdi = CONFIG.recul.etourdi
  j.invincible = CONFIG.recul.invincible
  if (j.sol) { j.vy = 3; j.sol = false }
  evts.push({ type: 'touche', joueur: j.index, x: j.x, z: j.z })
}

function reapparaitre(j) {
  const r = CONFIG.rayonJoueur
  j.z = POINTS_PASSAGE[j.passage]
  j.x = Math.max(-CONFIG.demiLargeur + r, Math.min(CONFIG.demiLargeur - r, j.x))
  Object.assign(j, { y: 0.4, vy: 0, kx: 0, kz: 0, sol: false, mobile: null, etourdi: 0, invincible: CONFIG.chute.invincible })
}

function majJoueur(p, j, e, ap, dt, evts) {
  if (j.arrive !== null) { j.vitesse = 0; return }
  if (j.tombe > 0) {
    j.tombe -= dt
    if (j.tombe <= 0) { j.tombe = 0; reapparaitre(j) }
    return
  }
  j.etourdi = Math.max(0, j.etourdi - dt)
  j.invincible = Math.max(0, j.invincible - dt)
  j.tampon = ap.a ? CONFIG.tamponSaut : Math.max(0, j.tampon - dt)

  // Vitesse horizontale : stick (le vecteur d'entrée est déjà de norme ≤ 1) + recul
  let vx = 0, vz = 0
  const amp = Math.hypot(e.x, e.y)
  if (j.etourdi === 0 && amp > 0) {
    vx = e.x * CONFIG.vitesse
    vz = e.y * CONFIG.vitesse
    j.angle = Math.atan2(e.x, e.y)
  }
  j.vitesse = j.etourdi === 0 ? CONFIG.vitesse * amp : 0
  vx += j.kx
  vz += j.kz
  const amorti = Math.exp(-5 * dt)
  j.kx *= amorti
  j.kz *= amorti

  // Saut (avec un peu de tolérance avant l'atterrissage et après avoir quitté le bord)
  if (j.tampon > 0 && j.depuisSol < CONFIG.coyote && j.etourdi === 0) {
    j.vy = CONFIG.saut
    j.tampon = 0
    j.depuisSol = CONFIG.coyote
    j.sol = false
    j.mobile = null
    evts.push({ type: 'saut', joueur: j.index })
  }

  // Le radeau sur lequel on se tient nous emporte
  if (j.sol && j.mobile) j.x += xMobile(j.mobile, p.t) - xMobile(j.mobile, p.t - dt)

  // Une fois tombé dans la ravine, on ne contrôle plus rien
  if (j.y > -0.3) {
    const r = CONFIG.rayonJoueur
    j.x = Math.max(-CONFIG.demiLargeur + r, Math.min(CONFIG.demiLargeur - r, j.x + vx * dt))
    j.z = Math.min(DEPARTS_ARRIERE, j.z + vz * dt)
  }

  // Gravité et atterrissage
  j.vy -= CONFIG.gravite * dt
  j.y += j.vy * dt
  const s = support(j.x, j.z, p.t)
  if (s && j.vy <= 0 && j.y <= s.hauteur && j.y > s.hauteur - 0.5) {
    j.y = s.hauteur
    j.vy = 0
    j.sol = true
    j.mobile = s.mobile
    j.depuisSol = 0
  } else {
    j.sol = false
    j.mobile = null
    j.depuisSol += dt
  }

  if (j.y < CONFIG.chute.hauteur) {
    j.tombe = CONFIG.chute.delai
    evts.push({ type: 'chute', joueur: j.index })
    return
  }

  while (j.passage + 1 < POINTS_PASSAGE.length && j.z <= POINTS_PASSAGE[j.passage + 1]) j.passage++
  j.progression = Math.max(j.progression, progression(j.z))

  if (j.z <= Z_ARRIVEE) {
    j.arrive = CONFIG.duree - p.temps
    j.rangArrivee = ++p.arrives
    j.vitesse = 0
    evts.push({ type: 'arrivee', joueur: j.index, rang: j.rangArrivee })
  }
}

function obstacles(p, j, evts) {
  if (j.invincible > 0 || j.tombe > 0 || j.arrive !== null) return
  const r = CONFIG.rayonJoueur

  // Cannes à sucre : segment qui tourne autour de son centre
  const C = CONFIG.cannes
  for (const c of CANNES) {
    if (j.y >= C.hauteur) continue
    const a = angleCanne(c, p.t)
    const ux = Math.cos(a), uz = Math.sin(a)
    const rx = j.x - c.x, rz = j.z - c.z
    const proj = Math.max(-C.demiLongueur, Math.min(C.demiLongueur, rx * ux + rz * uz))
    if (Math.hypot(rx - proj * ux, rz - proj * uz) < r + C.rayon) {
      // poussé dans le sens où la canne balaie
      const s = Math.sign(proj || 1) * c.sens
      return toucher(j, -uz * s, ux * s, evts)
    }
  }

  // Pics
  if (j.y < CONFIG.pics.hauteur) {
    for (const c of PICS) {
      if (etatPic(c, p.t) !== 'sortis') continue
      if (Math.abs(j.x - c.x) < c.l / 2 + r * 0.5 && Math.abs(j.z - c.z) < c.p / 2 + r * 0.5) return toucher(j, 0, 1, evts)
    }
  }

  // Roches de la coulée
  const R = CONFIG.roches.rayon
  for (const ro of p.roches) {
    if (j.y < 2 * R * 0.85 && Math.hypot(j.x - ro.x, j.z - ro.z) < r + R) {
      return toucher(j, Math.sign(j.x - ro.x) * 0.5, 1, evts)
    }
  }
}

function majRoches(p, dt) {
  const R = CONFIG.roches
  for (const ro of p.roches) ro.z += R.vitesse * dt
  p.roches = p.roches.filter((ro) => ro.z < COULEE.fin)
  p.prochaineRoche -= dt
  if (p.prochaineRoche <= 0) {
    const [min, max] = R.intervalle
    p.prochaineRoche = min + p.aleatoire() * (max - min)
    p.roches.push({ id: ++p.numeroRoche, x: (p.aleatoire() * 2 - 1) * (CONFIG.demiLargeur - 0.6), z: COULEE.depart })
  }
}

/**
 * Avance la partie de `dt` secondes.
 * @param entrees { etats: Map, appuis: Map } (voir commun/entrees.js)
 * @returns liste d'évènements ({type: 'saut' | 'touche' | 'chute' | 'arrivee', joueur} | {type: 'fin'} | ...)
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
    // Les obstacles tournent déjà pendant le compte à rebours
    p.t += dt
    majRoches(p, dt)
    if (p.decompte <= 0) { p.phase = 'jeu'; evts.push({ type: 'partez' }) }
    return evts
  }

  if (p.phase !== 'jeu') return evts

  p.t += dt
  p.temps -= dt
  majRoches(p, dt)

  for (const j of p.joueurs) {
    majJoueur(p, j, etat(j) || { x: 0, y: 0 }, appui(j), dt, evts)
    obstacles(p, j, evts)
  }

  // Bousculades : séparation des cercles, entre joueurs à la même hauteur
  const d = CONFIG.rayonJoueur * 2
  const enCourse = p.joueurs.filter((j) => j.tombe === 0 && j.arrive === null)
  for (let a = 0; a < enCourse.length; a++) {
    for (let b = a + 1; b < enCourse.length; b++) {
      const A = enCourse[a], B = enCourse[b]
      if (Math.abs(A.y - B.y) > 0.8) continue
      const dx = B.x - A.x, dz = B.z - A.z
      const dist = Math.hypot(dx, dz)
      if (dist > 0 && dist < d) {
        const push = (d - dist) / 2
        const nx = dx / dist, nz = dz / dist
        A.x -= nx * push; A.z -= nz * push
        B.x += nx * push; B.z += nz * push
        for (const J of [A, B]) J.x = Math.max(-CONFIG.demiLargeur + CONFIG.rayonJoueur, Math.min(CONFIG.demiLargeur - CONFIG.rayonJoueur, J.x))
      }
    }
  }

  if (p.temps <= 0 || p.joueurs.every((j) => j.arrive !== null)) {
    p.temps = Math.max(0, p.temps)
    p.phase = 'fin'
    p.classement = classement(p.joueurs)
    evts.push({ type: 'fin' })
  }
  return evts
}

/**
 * Classement : d'abord les arrivés (par temps), puis les autres selon la distance parcourue.
 * Les ex æquo partagent la meilleure place et le meilleur gain.
 */
export function classement(joueurs) {
  const score = (j) => (j.arrive !== null ? 2 - j.arrive / 1000 : Math.round(j.progression * 100) / 100)
  const tri = [...joueurs].sort((a, b) => score(b) - score(a))
  const gains = GAINS[joueurs.length] || GAINS[4]
  let place = 0
  return tri.map((j, i) => {
    if (i === 0 || score(j) < score(tri[i - 1])) place = i + 1
    return { joueur: j.index, arrive: j.arrive, progression: j.progression, place, zarlor: gains[place - 1] ?? 0 }
  })
}
