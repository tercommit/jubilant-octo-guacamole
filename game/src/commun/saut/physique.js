// Déplacements avec saut, communs aux mini-jeux « à la Fall Guys » : stick, saut (A), gravité, plateformes
// mobiles, murs, chutes dans le vide. Logique pure.
//
// `monde` décrit le terrain :
//   config : { vitesse, saut, gravite, rayonJoueur, chute (hauteur sous laquelle on est tombé), delaiChute }
//   support(x, z, y, p)  surface la plus haute sous (x, z) que l'on peut atteindre depuis la hauteur y
//                        (marche comprise) → { y, vx, vz } (vitesse de la surface, facultative) ou null
//   bloque(x, z, y, p)   (facultatif) un mur empêche-t-il de se tenir en (x, z) à la hauteur y ?
//   glisse(j, p)         (facultatif) poussée du sol sous un joueur posé → [vx, vz] (pente, tapis…)
//   tombe(j, p, evts)    le joueur a fini de tomber : on le fait réapparaître ou on l'élimine
import { LUTTE, champsLutte, libreLutte } from '../lutte.js'

const COYOTE = 0.1 // s : on peut encore sauter juste après avoir quitté le bord
const TAMPON = 0.12 // s : un appui sur A juste avant d'atterrir est pris en compte
export const MARCHE = 0.3 // on monte sans sauter une marche de cette hauteur

export function creerSauteur(j, index, x, z, y = 0) {
  return {
    ...j, index, x, y, z, vy: 0, angle: Math.PI, vitesse: 0,
    sol: true, depuisSol: 0, tampon: 0, kx: 0, kz: 0,
    etourdi: 0, invincible: 0, tombe: 0, horsJeu: false, elimine: null, arrive: null,
    points: 0, pret: false,
    ...champsLutte(),
  }
}

/** Le joueur est sur le terrain : ni éliminé, ni arrivé, ni en train de tomber, ni porté. */
export const enJeu = (j) => !j.horsJeu && j.arrive === null && j.tombe === 0 && libreLutte(j)

/** Déplacement horizontal qui glisse le long des murs. */
export function bouger(j, dx, dz, monde, p) {
  if (!monde.bloque) { j.x += dx; j.z += dz; return }
  if (!monde.bloque(j.x + dx, j.z + dz, j.y, p)) { j.x += dx; j.z += dz; return }
  if (!monde.bloque(j.x + dx, j.z, j.y, p)) { j.x += dx; return }
  if (!monde.bloque(j.x, j.z + dz, j.y, p)) j.z += dz
}

/** Repousse un joueur (obstacle, mur…), l'étourdit et le fait décoller un peu. */
export function toucher(j, dx, dz, { force, etourdi, invincible = 0, hauteur = 3 }, evts) {
  const n = Math.hypot(dx, dz) || 1
  j.kx = (dx / n) * force
  j.kz = (dz / n) * force
  j.etourdi = etourdi
  j.invincible = invincible
  if (j.sol) { j.vy = hauteur; j.sol = false }
  evts.push({ type: 'touche', joueur: j.index, x: j.x, y: j.y, z: j.z })
}

function majSauteur(p, j, e, ap, dt, evts, monde) {
  const { config } = monde
  if (j.horsJeu || j.arrive !== null) { j.vitesse = 0; return }
  // porté par un autre joueur : c'est lui qui nous déplace (voir commun/lutte.js)
  if (j.portePar !== null) { j.vitesse = 0; return }
  if (j.tombe > 0) {
    // on continue de tomber, sans contrôle
    j.vy -= config.gravite * dt
    j.y += j.vy * dt
    j.tombe -= dt
    if (j.tombe <= 0) { j.tombe = 0; monde.tombe(j, p, evts) }
    return
  }
  j.etourdi = Math.max(0, j.etourdi - dt)
  j.invincible = Math.max(0, j.invincible - dt)
  j.tampon = ap.a ? TAMPON : Math.max(0, j.tampon - dt)

  // Vitesse horizontale : stick (norme ≤ 1) + recul + entraînement par le sol
  let vx = 0, vz = 0
  const amp = j.etourdi === 0 ? Math.hypot(e.x, e.y) : 0
  const vitesse = config.vitesse * (j.porte !== null ? LUTTE.porter.ralenti : 1)
  if (amp > 0) {
    vx = e.x * vitesse
    vz = e.y * vitesse
    j.angle = Math.atan2(e.x, e.y)
  }
  j.vitesse = vitesse * amp
  vx += j.kx
  vz += j.kz
  const amorti = Math.exp(-5 * dt)
  j.kx = Math.abs(j.kx) < 0.05 ? 0 : j.kx * amorti
  j.kz = Math.abs(j.kz) < 0.05 ? 0 : j.kz * amorti
  if (j.sol && j.surface) { vx += j.surface.vx ?? 0; vz += j.surface.vz ?? 0 }
  if (j.sol && monde.glisse) { const [gx, gz] = monde.glisse(j, p); vx += gx; vz += gz }

  // Saut
  if (j.tampon > 0 && j.depuisSol < COYOTE && j.etourdi === 0) {
    j.vy = config.saut
    j.tampon = 0
    j.depuisSol = COYOTE
    j.sol = false
    evts.push({ type: 'saut', joueur: j.index })
  }

  bouger(j, vx * dt, vz * dt, monde, p)

  // Gravité, atterrissage (seulement si on traverse la surface pendant cette image), marches
  const y0 = j.y
  j.vy -= config.gravite * dt
  j.y += j.vy * dt
  const s = monde.support(j.x, j.z, j.y, p)
  const marche = j.sol && s && s.y > j.y - 0.05 && s.y - j.y <= MARCHE
  if (s && (marche || (j.vy <= 0 && j.y <= s.y && y0 >= s.y - 0.05))) {
    j.y = s.y
    j.vy = 0
    j.sol = true
    j.surface = s
    j.depuisSol = 0
  } else {
    j.sol = false
    j.surface = null
    j.depuisSol += dt
  }

  if (j.y < config.chute) {
    j.tombe = config.delaiChute ?? 0.6
    j.etourdi = 0
    evts.push({ type: 'chute', joueur: j.index, x: j.x, z: j.z })
  }
}

/** Fait avancer tous les joueurs de `dt` secondes, puis les bousculades entre joueurs à la même hauteur. */
export function majSauteurs(p, dt, entrees, evts, monde) {
  for (const j of p.joueurs) {
    majSauteur(p, j, entrees.etats.get(j.appareil) || { x: 0, y: 0 }, entrees.appuis.get(j.appareil) || {}, dt, evts, monde)
  }
  const d = monde.config.rayonJoueur * 2
  const actifs = p.joueurs.filter(enJeu)
  for (let a = 0; a < actifs.length; a++) {
    for (let b = a + 1; b < actifs.length; b++) {
      const A = actifs[a], B = actifs[b]
      if (Math.abs(A.y - B.y) > 0.8) continue
      const dx = B.x - A.x, dz = B.z - A.z
      const dist = Math.hypot(dx, dz)
      if (dist > 0 && dist < d) {
        const push = (d - dist) / 2
        bouger(A, (-dx / dist) * push, (-dz / dist) * push, monde, p)
        bouger(B, (dx / dist) * push, (dz / dist) * push, monde, p)
      }
    }
  }
}

/** Pousser, porter, jeter (voir commun/lutte.js) : le joueur jeté part en cloche et peut tomber dans le vide. */
export function opsSaut(monde, p, evts) {
  return {
    actif: (j) => !j.horsJeu && j.arrive === null && j.tombe === 0,
    deplacer: (j, dx, dz) => bouger(j, dx, dz, monde, p),
    sonner: (j, dx, dz) => toucher(j, dx, dz, LUTTE.choc, evts),
    lancer(j, fx, fz) {
      Object.assign(j, { vy: 7, kx: fx * 12, kz: fz * 12, etourdi: LUTTE.jet.etourdi, sol: false, surface: null, depuisSol: COYOTE })
    },
    hauteurPortee: (porteur) => porteur.y + 1.15,
  }
}
