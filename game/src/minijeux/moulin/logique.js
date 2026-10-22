// Logique pure du mini-jeu « Le moulin à cannes » (à la Roll Out) : trois énormes rouleaux de moulin tournent sous
// les pieds, chacun dans son sens. Des lattes manquent : il faut éviter les trous et ne pas glisser vers le bord.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut } from '../../commun/saut/physique.js'
import { eliminer, classementSurvie, finSurvie } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

const { rayon: R, lattes: N, largeur: L } = CONFIG
const DEPARTS = [[-4.2, 0], [4.2, 0], [0, -0.8], [0, 0.8]]

/** Angle de rotation d'un rouleau (vitesse qui croît linéairement). */
export function rotation(r, t) {
  const [v0, v1] = CONFIG.vitesseRotation
  return r.sens * (v0 * t + ((v1 - v0) * t * t) / (2 * CONFIG.duree))
}
const vitesseAngulaire = (r, t) => r.sens * (CONFIG.vitesseRotation[0] + (CONFIG.vitesseRotation[1] - CONFIG.vitesseRotation[0]) * Math.min(1, t / CONFIG.duree))

/** Lattes de chaque rouleau : manque[rouleau][latte * 2 + moitié]. Les lattes autour du sommet sont pleines au départ. */
function creerLattes(aleatoire) {
  return CONFIG.rouleaux.map(() => Array.from({ length: N * 2 }, (_, k) => {
    const latte = Math.floor(k / 2)
    const pres = latte < 3 || latte > N - 4
    return !pres && aleatoire() < CONFIG.trous
  }))
}

/** Rouleau sous x, ou -1. */
const rouleauEn = (x) => CONFIG.rouleaux.findIndex((r) => Math.abs(x - r.x) <= L / 2)

/** Latte (dans le repère du rouleau) qui se trouve à l'angle a (0 = sommet) : [indice, moitié]. */
function latteEn(r, x, a, t) {
  const u = (((a - rotation(r, t)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  return Math.floor(u / ((2 * Math.PI) / N)) * 2 + (x < r.x ? 0 : 1)
}

const MONDE = {
  config: CONFIG,
  support(x, z, y, p) {
    const i = rouleauEn(x)
    if (i < 0 || Math.abs(z) >= R * Math.sin(CONFIG.angleMax)) return null
    const a = Math.asin(z / R)
    const r = CONFIG.rouleaux[i]
    if (p.manque[i][latteEn(r, x, a, p.t)]) return null
    const h = Math.sqrt(R * R - z * z) - R
    if (y < h - 0.6) return null
    // la surface entraîne le joueur (vitesse tangentielle ≈ ω R)
    return { y: h, vz: vitesseAngulaire(r, p.t) * R * Math.cos(a) }
  },
  // plus on s'éloigne du sommet, plus on glisse vers le bord
  glisse: (j) => [0, (j.z / R) * CONFIG.glisse * CONFIG.gravite * 0.25],
  tombe: (j, p, evts) => eliminer(p, j, evts),
}

export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = { ...deroule(CONFIG), manque: creerLattes(aleatoire) }
  p.joueurs = joueurs.map((j, i) => creerSauteur(j, i, ...DEPARTS[i]))
  return p
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementSurvie(p.joueurs)
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  for (const j of p.joueurs) if (!j.horsJeu) j.affiche = '♥'
  finSurvie(p, evts)
  return evts
}
