// Lutte entre joueurs, commune à tous les mini-jeux : pousser, porter, jeter. Logique pure.
//
// Tout passe par B :
//   - B : on pousse (petite ruée vers l'avant) ; le joueur touché est repoussé et étourdi ;
//   - B devant un joueur étourdi : on l'attrape et on le porte au-dessus de la tête (on avance moins vite) ;
//   - B en portant : on le jette devant soi.
// Le joueur porté se libère en martelant A, sinon il est relâché au bout de quelques secondes.
// Après une poussée, un lâcher ou un atterrissage, le joueur est « protégé » un instant : on ne peut ni le pousser
// ni l'attraper (pas d'enchaînement sans fin), mais la lave, la ravine ou les obstacles l'atteignent toujours.
//
// Chaque mini-jeu fournit ses `ops` :
//   actif(j)              le joueur peut-il agir / être attrapé ? (pas tombé, pas arrivé, pas hors jeu…)
//   deplacer(j, dx, dz)   déplacement respectant les obstacles
//   sonner(j, dx, dz)     repousser + étourdir (le mini-jeu choisit force et durée)
//   lancer(j, fx, fz)     mettre en vol le joueur jeté dans la direction (fx, fz)
//   voler(j, dt)          (facultatif) faire avancer un vol commencé par lancer ; renvoie false à l'atterrissage
//   hauteurPortee(p)      hauteur à laquelle le porteur tient le joueur porté

export const LUTTE = {
  portee: 1.6, // distance (centre à centre) pour attraper
  poussee: { duree: 0.18, vitesse: 9, recharge: 0.9 },
  choc: { force: 6, etourdi: 1, invincible: 0 }, // le joueur poussé (assez longtemps pour être attrapé)
  porter: { duree: 2.5, evasion: 0.35, ralenti: 0.7, recharge: 1 },
  jet: { distance: 5, duree: 0.6, hauteur: 1.6, etourdi: 0.7 },
  protection: { poussee: 0.3, lache: 1, jet: 1.4 }, // s pendant lesquelles on ne peut plus être poussé ni attrapé
}

export const champsLutte = () => ({ poussee: 0, rechargeB: 0, porte: null, portePar: null, tempsPorte: 0, vol: null, protege: 0 })

/** Le joueur est-il libre de ses mouvements (ni porté, ni en vol) ? */
export const libreLutte = (j) => j.portePar === null && !j.vol

const devant = (j) => [Math.sin(j.angle), Math.cos(j.angle)]

function relacher(p, porteur, evts) {
  const t = p.joueurs[porteur.porte]
  porteur.porte = null
  porteur.rechargeB = LUTTE.porter.recharge
  if (!t) return
  t.portePar = null
  t.x = porteur.x
  t.z = porteur.z
  t.y = porteur.y
  t.protege = LUTTE.protection.lache
  if ('vy' in t) t.vy = 0
  evts.push({ type: 'relache', joueur: t.index })
  return t
}

export function majLutte(p, dt, entrees, evts, ops) {
  const appui = (j) => entrees.appuis.get(j.appareil) || {}

  for (const j of p.joueurs) {
    j.rechargeB = Math.max(0, j.rechargeB - dt)
    j.protege = Math.max(0, j.protege - dt)

    // En vol après un lancer
    if (j.vol && ops.voler && !ops.voler(j, dt)) {
      j.vol = null
      evts.push({ type: 'atterrit', joueur: j.index, x: j.x, z: j.z })
    }

    // Porté : on se débat en martelant A
    if (j.portePar !== null) {
      const porteur = p.joueurs[j.portePar]
      if (appui(j).a) porteur.tempsPorte -= LUTTE.porter.evasion
      continue
    }

    // Porteur : on lance avec B, ou on lâche si on est sonné, tombé… ou si l'autre s'est libéré
    if (j.porte !== null) {
      j.tempsPorte -= dt
      if (!ops.actif(j) || j.etourdi > 0 || j.tempsPorte <= 0) { relacher(p, j, evts); continue }
      if (appui(j).b) {
        const t = relacher(p, j, evts)
        const [fx, fz] = devant(j)
        ops.lancer(t, fx, fz)
        t.protege = LUTTE.protection.jet
        evts.push({ type: 'jet', joueur: j.index, cible: t.index })
      }
      continue
    }

    if (!ops.actif(j) || j.vol) continue

    // Ruée de la poussée : le premier joueur touché est repoussé
    if (j.poussee > 0) {
      j.poussee = Math.max(0, j.poussee - dt)
      const [fx, fz] = devant(j)
      ops.deplacer(j, fx * LUTTE.poussee.vitesse * dt, fz * LUTTE.poussee.vitesse * dt)
      for (const o of p.joueurs) {
        if (o === j || !ops.actif(o) || !libreLutte(o) || o.invincible > 0 || o.protege > 0) continue
        const dx = o.x - j.x, dz = o.z - j.z
        if (Math.abs((o.y ?? 0) - (j.y ?? 0)) < 0.8 && Math.hypot(dx, dz) < 0.9) {
          ops.sonner(o, dx || fx, dz || fz)
          o.protege = LUTTE.protection.poussee
          evts.push({ type: 'choc', joueur: o.index, par: j.index, x: o.x, z: o.z })
          j.poussee = 0
          break
        }
      }
      continue
    }

    if (!appui(j).b || j.etourdi > 0) continue

    // B : attraper un joueur étourdi devant soi (même juste après l'avoir poussé), sinon pousser
    const [fx, fz] = devant(j)
    let cible = null, dmin = Infinity
    for (const o of p.joueurs) {
      if (o === j || !ops.actif(o) || !libreLutte(o) || o.porte !== null || !(o.etourdi > 0) || o.protege > 0) continue
      const dx = o.x - j.x, dz = o.z - j.z
      const d = Math.hypot(dx, dz)
      if (d < LUTTE.portee && (dx * fx + dz * fz) / (d || 1) > 0.2 && Math.abs((o.y ?? 0) - (j.y ?? 0)) < 0.8 && d < dmin) {
        dmin = d
        cible = o
      }
    }
    if (cible) {
      j.porte = cible.index
      j.tempsPorte = LUTTE.porter.duree
      cible.portePar = j.index
      cible.etourdi = 0
      cible.kx = 0
      cible.kz = 0
      evts.push({ type: 'attrape', joueur: j.index, cible: cible.index })
    } else if (j.rechargeB === 0) {
      j.poussee = LUTTE.poussee.duree
      j.rechargeB = LUTTE.poussee.recharge
      evts.push({ type: 'pousse', joueur: j.index })
    }
  }

  // Le joueur porté suit son porteur, au-dessus de sa tête
  for (const j of p.joueurs) {
    if (j.porte === null) continue
    const t = p.joueurs[j.porte]
    t.x = j.x
    t.z = j.z
    t.y = ops.hauteurPortee(j)
    t.angle = j.angle
  }
}

/** Animation de lutte à jouer en priorité, ou null. */
export function animationLutte(j) {
  if (j.portePar !== null || j.vol) return 'Porte'
  if (j.porte !== null) return j.vitesse > 0.1 ? 'Porter' : 'PorterArret'
  if (j.poussee > 0) return 'Pousser'
  return null
}
