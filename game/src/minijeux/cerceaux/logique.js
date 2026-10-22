// Logique pure du mini-jeu « Les cerceaux du lagon » (à la Hoopsie Daisy) : passer à travers un cerceau rapporte
// un point, trois pour un cerceau doré perché au-dessus d'une plateforme. Les cerceaux réapparaissent ailleurs.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu } from '../../commun/saut/physique.js'
import { majLutte } from '../../commun/lutte.js'
import { ILE, mondeIle } from '../../commun/saut/ile.js'

const MONDE = mondeIle(CONFIG)
const DEPARTS = [[-2.8, 2.8], [2.8, 2.8], [-2.8, -2.8], [2.8, -2.8]]
const HAUTEUR_CORPS = 0.6 // le milieu du corps, au-dessus des pieds

/** Un nouveau cerceau, loin des joueurs et des autres cerceaux. */
function nouveauCerceau(p) {
  for (let essai = 0; essai < 40; essai++) {
    const or = p.aleatoire() < CONFIG.partOr
    let x, z, y
    if (or) {
      const pl = ILE.plateformes[Math.floor(p.aleatoire() * ILE.plateformes.length)]
      x = pl.x; z = pl.z; y = pl.h + 1
    } else {
      const a = p.aleatoire() * Math.PI * 2, r = 2.8 + p.aleatoire() * (ILE.rayon - 4)
      x = Math.sin(a) * r; z = Math.cos(a) * r; y = 1
      if (ILE.plateformes.some((pl) => Math.hypot(x - pl.x, z - pl.z) < pl.r + 1.2)) continue
    }
    if (p.cerceaux.some((c) => Math.hypot(c.x - x, c.z - z) < 2.5)) continue
    if (p.joueurs?.some((j) => Math.hypot(j.x - x, j.z - z) < 2)) continue
    p.cerceaux.push({ id: ++p.numero, x, y, z, angle: p.aleatoire() * Math.PI, or })
    return
  }
}

export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = { ...deroule(CONFIG), cerceaux: [], numero: 0, attentes: [], aleatoire }
  p.joueurs = joueurs.map((j, i) => ({ ...creerSauteur(j, i, ...DEPARTS[i]), cotes: {} }))
  for (let k = 0; k < CONFIG.cerceaux.enPlus + joueurs.length; k++) nouveauCerceau(p)
  return p
}

/** Passer à travers : on change de côté du cerceau, près de son centre. */
function passages(p, dt, evts) {
  for (const j of p.joueurs) {
    if (!enJeu(j)) continue
    for (const c of [...p.cerceaux]) {
      const nx = Math.sin(c.angle), nz = Math.cos(c.angle)
      const dx = j.x - c.x, dz = j.z - c.z
      const d = dx * nx + dz * nz
      const cote = Math.sign(d)
      const avant = j.cotes[c.id]
      j.cotes[c.id] = cote
      if (avant === undefined || avant === cote || Math.abs(d) > 0.8) continue
      const lateral = Math.abs(dx * nz - dz * nx)
      const vertical = Math.abs(j.y + HAUTEUR_CORPS - c.y)
      if (Math.hypot(lateral, vertical) > CONFIG.cerceaux.rayon) continue
      j.points += c.or ? CONFIG.points.or : CONFIG.points.normal
      evts.push({ type: 'point', joueur: j.index, x: c.x, y: c.y - 0.6, z: c.z })
      p.cerceaux = p.cerceaux.filter((x) => x !== c)
      p.attentes.push(CONFIG.cerceaux.attente)
    }
  }
  p.attentes = p.attentes.map((t) => t - dt)
  while (p.attentes.length && p.attentes[0] <= 0) { p.attentes.shift(); nouveauCerceau(p) }
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  passages(p, dt, evts)
  return evts
}
