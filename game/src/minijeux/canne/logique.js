// Logique pure du mini-jeu « Saute la canne » (à la Jump Club) : deux cannes à sucre tournent autour du moulin.
// La basse balaie le sol (il faut sauter), la haute passe au-dessus des têtes (il ne faut pas sauter à ce moment-là).
// Être touché envoie valser, souvent hors de la piste. Le dernier debout gagne.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu, toucher } from '../../commun/saut/physique.js'
import { eliminer, classementSurvie, finSurvie } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

const DEPARTS = [[-4, 2], [4, -2], [2, 4], [-2, -4]]
const lerp = (a, b, k) => a + (b - a) * Math.min(1, Math.max(0, k))

/** Rayon de la piste à l'instant t. */
export function rayonPiste(t) {
  const [a, b] = CONFIG.retrecit
  return lerp(CONFIG.rayonPiste, CONFIG.rayonFinal, (t - a) / (b - a))
}

/** Angle de chaque canne : elles accélèrent au fil de la partie (intégrale d'une vitesse qui croît linéairement). */
function angle(c, t, sens) {
  const [v0, v1] = c.vitesse
  const t0 = c.debut ?? 0
  const u = Math.max(0, t - t0), T = CONFIG.duree - t0
  return sens * (v0 * u + ((v1 - v0) * u * u) / (2 * T))
}
export const angleBasse = (t) => angle(CONFIG.basse, t, 1)
export const angleHaute = (t) => angle(CONFIG.haute, t, -1) + Math.PI / 2
export const hauteActive = (t) => t >= CONFIG.haute.debut

const MONDE = {
  config: CONFIG,
  support(x, z, y, p) {
    const r = Math.hypot(x, z)
    return r <= rayonPiste(p.t) && y > -0.6 ? { y: 0 } : null
  },
  bloque: (x, z) => Math.hypot(x, z) < CONFIG.pilier + CONFIG.rayonJoueur,
  tombe: (j, p, evts) => eliminer(p, j, evts),
}

export function creerPartie(joueurs) {
  const p = { ...deroule(CONFIG) }
  p.joueurs = joueurs.map((j, i) => creerSauteur(j, i, ...DEPARTS[i]))
  return p
}

/** Une canne (segment qui tourne depuis le centre) touche-t-elle le joueur ? Renvoie la direction du coup. */
function coup(j, a, sens) {
  const ux = Math.cos(a), uz = Math.sin(a)
  const proj = j.x * ux + j.z * uz
  if (proj < CONFIG.pilier || proj > CONFIG.longueur) return null
  const dist = Math.abs(-j.x * uz + j.z * ux)
  return dist < CONFIG.rayonJoueur + 0.25 ? [-uz * sens, ux * sens] : null
}

function cannes(p, evts) {
  const { basse, haute, tailleJoueur, recul } = CONFIG
  for (const j of p.joueurs) {
    if (!enJeu(j) || j.invincible > 0) continue
    // canne basse : touche si les pieds sont plus bas que le haut de la canne
    let d = j.y < basse.hauteur + basse.rayon ? coup(j, angleBasse(p.t), 1) : null
    // canne haute : touche si la tête dépasse le bas de la canne
    if (!d && hauteActive(p.t) && j.y + tailleJoueur > haute.hauteur - haute.rayon) d = coup(j, angleHaute(p.t), -1)
    if (d) toucher(j, d[0], d[1], { ...recul, invincible: 0.5 }, evts)
  }
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementSurvie(p.joueurs)
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  cannes(p, evts)
  for (const j of p.joueurs) if (!j.horsJeu) j.affiche = '♥'
  finSurvie(p, evts)
  return evts
}
