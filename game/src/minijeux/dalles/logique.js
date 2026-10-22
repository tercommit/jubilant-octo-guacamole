// Logique pure du mini-jeu « Les dalles de la Fournaise » (à la Hex-A-Gone) : chaque dalle touchée se fissure
// puis tombe ; on dégringole d'étage en étage jusqu'à la lave. Le dernier debout gagne.
import { CONFIG } from './config.js'
import { cle, disque, grille } from '../../commun/arene/hex.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu } from '../../commun/saut/physique.js'
import { eliminer, classementSurvie, finSurvie } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

export const { versMonde, versHex } = grille(CONFIG.echelleTuile)
const DEPARTS = [[-2, 2], [2, -2], [2, 0], [-2, 0]]

/** 'entiere', 'fissure' ou 'tombee' à l'instant t. */
export function etatDalle(d, t) {
  if (d.casse === null) return 'entiere'
  return t - d.casse < CONFIG.fissure ? 'fissure' : 'tombee'
}

const MONDE = {
  config: CONFIG,
  support(x, z, y, p) {
    const k = cle(...versHex(x, z))
    for (let e = 0; e < CONFIG.etages.length; e++) {
      const h = CONFIG.etages[e]
      if (h > y + 0.3) continue
      const d = p.etages[e].get(k)
      if (d && etatDalle(d, p.t) !== 'tombee') return { y: h, etage: e, dalle: d }
    }
    return null
  },
  tombe: (j, p, evts) => eliminer(p, j, evts),
}

export function creerPartie(joueurs) {
  const etages = CONFIG.etages.map(() => {
    const m = new Map()
    for (const [q, r] of disque(CONFIG.rayonCarte)) {
      const [x, z] = versMonde(q, r)
      m.set(cle(q, r), { q, r, x, z, casse: null })
    }
    return m
  })
  const p = { ...deroule(CONFIG), etages }
  p.joueurs = joueurs.map((j, i) => creerSauteur(j, i, ...versMonde(...DEPARTS[i]), CONFIG.etages[0]))
  return p
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementSurvie(p.joueurs)
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))

  for (const j of p.joueurs) {
    // la dalle sous les pieds commence à se fissurer
    if (enJeu(j) && j.sol && j.surface?.dalle && j.surface.dalle.casse === null) j.surface.dalle.casse = p.t
    if (j.horsJeu) continue
    // étage actuel (du bas : 1, 2, 3) ; il départage les survivants à la fin du temps
    const e = CONFIG.etages.findIndex((h) => j.y >= h - 0.5)
    j.points = e < 0 ? 0 : CONFIG.etages.length - e
    j.affiche = `étage ${j.points}`
  }
  finSurvie(p, evts)
  return evts
}
