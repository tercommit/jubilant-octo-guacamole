// Logique pure du mini-jeu « Le trésor de La Buse » (aucune dépendance à React ni à Three.js).
import { CONFIG } from './config.js'
import { construireTuiles, etatTuile, regles, versMonde, DEPARTS } from './carte.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerCoureur, deplacerCoureurs, plusProche, opsArene } from '../../commun/arene/coureurs.js'
import { majLutte } from '../../commun/lutte.js'
import { majPieces } from '../../commun/arene/pieces.js'

/** Secondes de jeu écoulées (0 pendant les règles et le compte à rebours). */
export const horloge = (p) => CONFIG.duree - p.temps

/**
 * @param {{appareil: string, couleur: string}[]} joueurs
 */
export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = {
    ...deroule(CONFIG),
    tuiles: construireTuiles(aleatoire),
    pieces: [],
    coffre: null, // { x, z } quand il est apparu
    coffrePris: false,
    aleatoire,
  }
  p.regles = regles(p.tuiles, () => horloge(p))
  p.ops = opsArene(p.regles)
  p.joueurs = joueurs.map((j, i) => creerCoureur(j, i, ...versMonde(...DEPARTS[i]), p.regles))
  return p
}

/** Centres des tuiles où une pièce peut être posée : du sable qui ne sera pas sous l'eau avant 3 s. */
function emplacements(p) {
  const t = horloge(p)
  return [...p.tuiles.values()].filter((u) => etatTuile(u, t + 3) === 'sable').map((u) => [u.x, u.z])
}

/**
 * Avance la partie de `dt` secondes.
 * @returns évènements ({type: 'point', joueur, x, z} | {type: 'coffre', joueur} | {type: 'fin'} | {type: 'passer'} | ...)
 */
export function majPartie(p, dt, entrees) {
  const evts = []
  if (majDeroule(p, dt, entrees, evts) !== 'jeu') return evts

  deplacerCoureurs(p, dt, entrees, evts, p.regles)
  majLutte(p, dt, entrees, evts, p.ops)
  majPieces(p, evts, emplacements(p), {
    nombre: CONFIG.pieces.enPlus + p.joueurs.length * CONFIG.pieces.parJoueur,
    rayon: CONFIG.pieces.rayon,
    distanceMin: CONFIG.pieces.distanceMin,
  })

  // Le coffre de La Buse apparaît au centre de l'îlot à la fin
  if (!p.coffre && !p.coffrePris && p.temps <= CONFIG.coffre.tempsRestant) {
    p.coffre = { x: 0, z: 0 }
    evts.push({ type: 'apparition-coffre' })
  }
  if (p.coffre) {
    const g = plusProche(p.joueurs, p.coffre.x, p.coffre.z, CONFIG.coffre.rayon)
    if (g) {
      g.points += CONFIG.coffre.valeur
      evts.push({ type: 'point', joueur: g.index, x: p.coffre.x, z: p.coffre.z }, { type: 'coffre', joueur: g.index })
      p.coffre = null
      p.coffrePris = true
    }
  }
  return evts
}
