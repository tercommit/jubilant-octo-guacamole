// Îlot de sable du lagon : tuiles, rochers et horaire de la marée.
import { CONFIG } from './config.js'
import { cle, disque, anneau, grille, cercleLibre } from '../../commun/arene/hex.js'

const S = CONFIG.echelleTuile
export const HAUT_SOL = 0.2 * S // dessus des tuiles de sable
export const HAUT_EAU = 0.1 * S
export const { versMonde, versHex } = grille(S)

const paire = (liste) => liste.flatMap(([q, r]) => [[q, r], [-q, -r]])
const ROCHERS = paire([[2, -3], [-3, 1], [1, 2]])
export const DEPARTS = [[-3, 3], [0, 3], [3, -3], [0, -3]]

/**
 * Tuiles { q, r, x, z, type: 'sable' | 'eau' | 'rocher', submersion: s de jeu (Infinity = jamais) }.
 * L'horaire de la marée est tiré au hasard dans chaque anneau, symétrique par rapport au centre (équité).
 */
export function construireTuiles(aleatoire) {
  const tuiles = new Map()
  for (const [q, r] of disque(CONFIG.rayonCarte)) {
    const [x, z] = versMonde(q, r)
    const bord = anneau(q, r) === CONFIG.rayonCarte
    tuiles.set(cle(q, r), { q, r, x, z, type: bord ? 'eau' : 'sable', submersion: bord ? 0 : Infinity })
  }
  for (const [q, r] of ROCHERS) tuiles.get(cle(q, r)).type = 'rocher'

  for (const [n, debut, fin] of CONFIG.maree.anneaux) {
    // une moitié de l'anneau, l'autre moitié est son symétrique
    const moitie = [...tuiles.values()].filter((t) => anneau(t.q, t.r) === n && (t.q > 0 || (t.q === 0 && t.r > 0)))
    for (let i = moitie.length - 1; i > 0; i--) {
      const k = Math.floor(aleatoire() * (i + 1));
      [moitie[i], moitie[k]] = [moitie[k], moitie[i]]
    }
    moitie.forEach((t, i) => {
      const h = debut + ((fin - debut) * i) / Math.max(1, moitie.length - 1)
      t.submersion = h
      tuiles.get(cle(-t.q, -t.r)).submersion = h
    })
  }
  return tuiles
}

/** 'sable', 'alerte' (l'eau arrive), 'eau' ou 'rocher' à l'instant t (s de jeu). */
export function etatTuile(t, temps) {
  if (t.type === 'rocher') return 'rocher'
  if (temps >= t.submersion) return 'eau'
  if (temps >= t.submersion - CONFIG.maree.alerte) return 'alerte'
  return 'sable'
}

export function regles(tuiles, horloge) {
  const tuileEn = (x, z) => tuiles.get(cle(...versHex(x, z))) || null
  const praticable = (x, z) => { const t = tuileEn(x, z); return !!t && t.type !== 'rocher' }
  return {
    config: CONFIG,
    libre: (x, z, rayon) => cercleLibre(x, z, rayon, praticable),
    facteur: (x, z) => (etatTuile(tuileEn(x, z), horloge()) === 'eau' ? CONFIG.nage : 1),
    // dans l'eau, l'avatar s'enfonce jusqu'à mi-mollet
    hauteur: (x, z) => (etatTuile(tuileEn(x, z) ?? { submersion: 0 }, horloge()) === 'eau' ? HAUT_EAU : HAUT_SOL),
  }
}
