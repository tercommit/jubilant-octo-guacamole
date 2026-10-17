// Plaine des Sables : tuiles de basalte, cratère au centre et horaire de la coulée.
import { CONFIG } from './config.js'
import { cle, disque, anneau, grille, cercleLibre } from '../../commun/arene/hex.js'

const S = CONFIG.echelleTuile
export const HAUT_SOL = 0.2 * S
export const { versMonde, versHex } = grille(S)

const paire = (liste) => liste.flatMap(([q, r]) => [[q, r], [-q, -r]])
const ROCHERS = paire([[3, -1], [-1, 3], [2, 1]])
export const DEPARTS = [[-4, 4], [0, 4], [4, -4], [0, -4]]

/**
 * Tuiles { q, r, x, z, type: 'pierre' | 'rocher' | 'cratere', lave: s de jeu où la lave arrive (Infinity = jamais) }.
 * Horaire symétrique par rapport au centre, pour l'équité.
 */
export function construireTuiles(aleatoire) {
  const { debut, pas, hasard } = CONFIG.lave
  const tuiles = new Map()
  for (const [q, r] of disque(CONFIG.rayonCarte)) {
    const [x, z] = versMonde(q, r)
    tuiles.set(cle(q, r), { q, r, x, z, type: 'pierre', lave: Infinity })
  }
  tuiles.get(cle(0, 0)).type = 'cratere'
  for (const [q, r] of ROCHERS) tuiles.get(cle(q, r)).type = 'rocher'
  for (const t of tuiles.values()) {
    // l'anneau extérieur reste toujours sûr : on peut survivre jusqu'au bout
    if (t.type === 'cratere' || anneau(t.q, t.r) === CONFIG.rayonCarte || !(t.q > 0 || (t.q === 0 && t.r > 0))) continue
    const h = debut + (anneau(t.q, t.r) - 1) * pas + aleatoire() * pas * hasard
    t.lave = h
    tuiles.get(cle(-t.q, -t.r)).lave = h
  }
  return tuiles
}

/** 'pierre', 'alerte' (la lave arrive), 'lave', 'rocher' ou 'cratere' à l'instant t (s de jeu). */
export function etatTuile(t, temps) {
  if (t.type !== 'pierre') return t.type
  if (temps >= t.lave) return 'lave'
  if (temps >= t.lave - CONFIG.lave.alerte) return 'alerte'
  return 'pierre'
}

export function regles(tuiles) {
  const tuileEn = (x, z) => tuiles.get(cle(...versHex(x, z))) || null
  const praticable = (x, z) => tuileEn(x, z)?.type === 'pierre'
  return {
    config: CONFIG,
    tuileEn,
    libre: (x, z, rayon) => cercleLibre(x, z, rayon, praticable),
    facteur: () => 1,
    hauteur: () => HAUT_SOL,
  }
}
