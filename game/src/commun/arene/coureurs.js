// Déplacements des joueurs dans une arène vue de dessus : stick, sprint (A), chocs, bousculades. Logique pure.
//
// `regles` décrit l'arène :
//   config : { vitesse, rayonJoueur, sprint: { facteur, duree, recharge } }
//   libre(x, z, rayon) : un joueur peut-il se tenir là ?
//   facteur(x, z) : multiplicateur de vitesse du sol (forêt, eau…)
//   hauteur(x, z) : hauteur du sol

export function creerCoureur(j, index, x, z, regles) {
  return {
    ...j, index, x, z, y: regles.hauteur(x, z), angle: z > 0 ? Math.PI : 0,
    vitesse: 0, points: 0, sprint: 0, recharge: 0, pret: false,
    etourdi: 0, invincible: 0, kx: 0, kz: 0, // chocs (bombes…)
  }
}

function glisser(j, dx, dz, regles) {
  const r = regles.config.rayonJoueur
  if (regles.libre(j.x + dx, j.z + dz, r)) { j.x += dx; j.z += dz; return }
  // glissement le long des obstacles
  if (regles.libre(j.x + dx, j.z, r)) { j.x += dx; return }
  if (regles.libre(j.x, j.z + dz, r)) j.z += dz
}

/** Repousse un joueur et l'étourdit un instant. */
export function sonner(j, dx, dz, { force, etourdi, invincible }) {
  const n = Math.hypot(dx, dz) || 1
  j.kx = (dx / n) * force
  j.kz = (dz / n) * force
  j.etourdi = etourdi
  j.invincible = invincible
}

export function deplacerCoureurs(p, dt, entrees, evts, regles) {
  const { config } = regles
  const etat = (j) => entrees.etats.get(j.appareil) || { x: 0, y: 0 }
  const appui = (j) => entrees.appuis.get(j.appareil) || {}

  for (const j of p.joueurs) {
    if (j.horsJeu) { j.vitesse = 0; continue }
    const e = etat(j)
    j.recharge = Math.max(0, j.recharge - dt)
    j.sprint = Math.max(0, j.sprint - dt)
    j.etourdi = Math.max(0, j.etourdi - dt)
    j.invincible = Math.max(0, j.invincible - dt)
    if (appui(j).a && j.recharge === 0 && j.etourdi === 0) {
      j.sprint = config.sprint.duree
      j.recharge = config.sprint.duree + config.sprint.recharge
      evts.push({ type: 'sprint', joueur: j.index })
    }
    const amp = j.etourdi > 0 ? 0 : Math.hypot(e.x, e.y)
    const v = config.vitesse * amp * regles.facteur(j.x, j.z) * (j.sprint > 0 ? config.sprint.facteur : 1)
    if (amp > 0) {
      j.angle = Math.atan2(e.x, e.y)
      glisser(j, (e.x / amp) * v * dt, (e.y / amp) * v * dt, regles)
    }
    if (j.kx || j.kz) {
      glisser(j, j.kx * dt, j.kz * dt, regles)
      const amorti = Math.exp(-6 * dt)
      j.kx = Math.abs(j.kx) < 0.05 ? 0 : j.kx * amorti
      j.kz = Math.abs(j.kz) < 0.05 ? 0 : j.kz * amorti
    }
    j.vitesse = v
  }

  // Bousculades : séparation des cercles
  const d = config.rayonJoueur * 2
  const actifs = p.joueurs.filter((j) => !j.horsJeu)
  for (let a = 0; a < actifs.length; a++) {
    for (let b = a + 1; b < actifs.length; b++) {
      const A = actifs[a], B = actifs[b]
      const dx = B.x - A.x, dz = B.z - A.z
      const dist = Math.hypot(dx, dz)
      if (dist > 0 && dist < d) {
        const push = (d - dist) / 2
        const nx = dx / dist, nz = dz / dist
        glisser(A, -nx * push, -nz * push, regles)
        glisser(B, nx * push, nz * push, regles)
      }
    }
  }
  for (const j of p.joueurs) j.y = regles.hauteur(j.x, j.z)
}

/** Le joueur le plus proche de (x, z) dans un rayon donné, ou null. */
export function plusProche(joueurs, x, z, rayon) {
  let gagnant = null, best = Infinity
  for (const j of joueurs) {
    if (j.horsJeu) continue
    const dist = Math.hypot(j.x - x, j.z - z)
    if (dist <= rayon && dist < best) { best = dist; gagnant = j }
  }
  return gagnant
}
