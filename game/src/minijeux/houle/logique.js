// Logique pure du mini-jeu « Les vagues de Boucan » (à la Block Party) : des murs d'eau avancent sur la plage.
// Chaque vague a des trous et des parties basses : il faut s'y glisser ou sauter, sinon la vague pousse dans le lagon.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu } from '../../commun/saut/physique.js'
import { eliminer, classementSurvie, finSurvie } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

const LARGEUR = (CONFIG.demiLargeur * 2) / CONFIG.colonnes
const DEPARTS = [[-3, 1], [3, 1], [-1, 3], [1, 3]]
const lerp = (a, b, k) => a + (b - a) * Math.min(1, Math.max(0, k))

/** Centre x de la colonne i. */
export const xColonne = (i) => -CONFIG.demiLargeur + LARGEUR * (i + 0.5)
export { LARGEUR }

/** Bloc de vague qui occupe (x, z) à la hauteur y, ou null. */
function blocEn(p, x, z, y, marge = 0) {
  for (const v of p.vagues) {
    if (Math.abs(z - v.z) > CONFIG.epaisseur / 2 + marge) continue
    const i = Math.floor((x + CONFIG.demiLargeur) / LARGEUR)
    const type = v.blocs[i]
    if (type && type !== 'trou' && y < CONFIG.hauteurs[type]) return { v, type }
  }
  return null
}

const MONDE = {
  config: CONFIG,
  support(x, z, y) {
    return Math.abs(x) <= CONFIG.demiLargeur && Math.abs(z) <= CONFIG.demiProfondeur && y > -0.6 ? { y: 0 } : null
  },
  // on ne traverse pas une vague en marchant (on peut sauter par-dessus un bloc bas)
  bloque: (x, z, y, p) => !!blocEn(p, x, z, y + 0.05, CONFIG.rayonJoueur),
  tombe: (j, p, evts) => eliminer(p, j, evts),
}

/** Une vague : 8 blocs, au moins un trou et un bloc bas, de plus en plus de blocs hauts au fil du temps. */
function nouvelleVague(p) {
  const k = p.t / CONFIG.duree
  const blocs = Array.from({ length: CONFIG.colonnes }, () => {
    const u = p.aleatoire()
    return u < 0.35 - k * 0.15 ? 'trou' : u < 0.65 - k * 0.1 ? 'bas' : 'haut'
  })
  const libre = (type) => { const i = Math.floor(p.aleatoire() * CONFIG.colonnes); blocs[i] = type; return i }
  if (!blocs.includes('trou')) libre('trou')
  if (!blocs.includes('bas')) libre('bas')
  p.vagues.push({ id: ++p.numero, z: CONFIG.departVague, blocs })
}

export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = { ...deroule(CONFIG), vagues: [], numero: 0, prochaine: 1.5, aleatoire }
  p.joueurs = joueurs.map((j, i) => creerSauteur(j, i, ...DEPARTS[i]))
  return p
}

function majVagues(p, dt) {
  const k = p.t / CONFIG.duree
  const v = lerp(...CONFIG.vitesseVague, k)
  for (const vague of p.vagues) vague.z += v * dt
  p.vagues = p.vagues.filter((vague) => vague.z < 12)
  if ((p.prochaine -= dt) <= 0) {
    p.prochaine = lerp(...CONFIG.intervalle, k)
    nouvelleVague(p)
  }
  // La vague pousse devant elle les joueurs qu'elle rattrape
  for (const j of p.joueurs) {
    if (!enJeu(j)) continue
    const b = blocEn(p, j.x, j.z, j.y, CONFIG.rayonJoueur)
    if (b) j.z = b.v.z + CONFIG.epaisseur / 2 + CONFIG.rayonJoueur + 0.01
  }
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementSurvie(p.joueurs)
  if (etape !== 'jeu') return evts

  majVagues(p, dt)
  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  for (const j of p.joueurs) if (!j.horsJeu) j.affiche = '♥'
  finSurvie(p, evts)
  return evts
}
