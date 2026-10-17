// Logique pure du mini-jeu (aucune dépendance à React ni à Three.js) : facile à tester.
import { CONFIG } from './config.js'
import { positionLibre, facteurVitesse, positionDepart, tirerBalise, hauteurSol } from './carte.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerCoureur, deplacerCoureurs, plusProche, opsArene } from '../../commun/arene/coureurs.js'
import { majLutte } from '../../commun/lutte.js'

const REGLES = { config: CONFIG, libre: positionLibre, facteur: facteurVitesse, hauteur: hauteurSol }
const OPS = opsArene(REGLES)

/**
 * @param {{appareil: string, couleur: string}[]} joueurs
 */
export function creerPartie(joueurs, aleatoire = Math.random) {
  return {
    ...deroule(CONFIG),
    joueurs: joueurs.map((j, i) => creerCoureur(j, i, ...positionDepart(i), REGLES)),
    balise: { x: 0, z: 0, active: false, attente: 0, numero: 0 },
    derniereBalise: null,
    aleatoire,
  }
}

function placerBalise(p) {
  const eviter = p.joueurs.map((j) => [j.x, j.z])
  if (p.derniereBalise) eviter.push(p.derniereBalise)
  const [x, z] = tirerBalise(eviter, p.aleatoire)
  Object.assign(p.balise, { x, z, active: true, numero: p.balise.numero + 1 })
}

/**
 * Avance la partie de `dt` secondes.
 * @param entrees { etats: Map, appuis: Map } (voir commun/entrees.js)
 * @returns liste d'évènements ({type: 'point', joueur, x, z} | {type: 'fin'} | {type: 'passer'} | ...)
 */
export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'depart') placerBalise(p)
  if (etape !== 'jeu') return evts

  deplacerCoureurs(p, dt, entrees, evts, REGLES)
  majLutte(p, dt, entrees, evts, OPS)

  // Balise : si deux joueurs la touchent dans la même image, le point va au plus proche
  const bal = p.balise
  if (bal.active) {
    const gagnant = plusProche(p.joueurs, bal.x, bal.z, CONFIG.rayonBalise)
    if (gagnant) {
      gagnant.points++
      bal.active = false
      bal.attente = CONFIG.delaiNouvelleBalise
      p.derniereBalise = [bal.x, bal.z]
      evts.push({ type: 'point', joueur: gagnant.index, x: bal.x, z: bal.z })
    }
  } else {
    bal.attente -= dt
    if (bal.attente <= 0) placerBalise(p)
  }
  return evts
}
