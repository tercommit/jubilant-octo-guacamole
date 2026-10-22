// Logique pure du mini-jeu « Les portes des cases » (à la Door Dash) : des rangées de portes de cases créoles barrent
// la cour. Les vraies portes s'ouvrent quand on fonce dedans ; les fausses, identiques, renvoient en arrière.
// Les premiers arrivés gagnent.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu, toucher } from '../../commun/saut/physique.js'
import { classementCourse, majCourse, reapparaitre } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

const { demiLargeur, portesParRangee: N, largeurPorte, pilier, epaisseur, hauteur } = CONFIG
export const PISTE = { zDepart: 1, zArrivee: CONFIG.zArrivee, passages: [1] }
const DEPARTS = [[-3, 1.5], [-1, 1.5], [1, 1.5], [3, 1.5]]
const PAS = largeurPorte + pilier

/** Centre x de la porte i d'une rangée. */
export const xPorte = (i) => (i - (N - 1) / 2) * PAS

/** Rangées { z, portes: [{ vraie, ouverte (t) }] } : les vraies portes sont tirées au sort. */
function creerRangees(aleatoire) {
  return CONFIG.rangees.map(({ z, vraies }) => {
    const ordre = Array.from({ length: N }, (_, i) => i).sort(() => aleatoire() - 0.5)
    const vraiesPortes = new Set(ordre.slice(0, vraies))
    return { z, portes: Array.from({ length: N }, (_, i) => ({ vraie: vraiesPortes.has(i), ouverte: null })) }
  })
}

/** Porte (ou pilier) qui occupe (x, z) : { rangee, i } pour une porte, { rangee, i: -1 } pour un pilier, ou null. */
function obstacleEn(p, x, z, marge) {
  for (const rangee of p.rangees) {
    if (Math.abs(z - rangee.z) > epaisseur / 2 + marge) continue
    for (let i = 0; i < N; i++) {
      if (Math.abs(x - xPorte(i)) <= largeurPorte / 2 - marge * 0.2) return rangee.portes[i].ouverte === null ? { rangee, i } : null
    }
    return { rangee, i: -1 }
  }
  return null
}

const MONDE = {
  config: CONFIG,
  support: (x, z, y) => (Math.abs(x) <= demiLargeur + 0.5 && z <= 3 && z >= CONFIG.zArrivee - 4 && y > -0.6 ? { y: 0 } : null),
  bloque: (x, z, y, p) => Math.abs(x) > demiLargeur - CONFIG.rayonJoueur || z > 2.6 || (y < hauteur && !!obstacleEn(p, x, z, CONFIG.rayonJoueur)),
  tombe: (j) => reapparaitre(j, PISTE, demiLargeur),
}

export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = { ...deroule(CONFIG), rangees: creerRangees(aleatoire), arrives: 0 }
  p.joueurs = joueurs.map((j, i) => ({ ...creerSauteur(j, i, ...DEPARTS[i]), passage: 0, progression: 0 }))
  return p
}

/** Foncer dans une porte : la vraie s'ouvre, la fausse renvoie en arrière. */
function portes(p, entrees, evts) {
  for (const j of p.joueurs) {
    if (!enJeu(j) || j.etourdi > 0) continue
    const e = entrees.etats.get(j.appareil) || { y: 0 }
    if (e.y > -0.3) continue // il faut pousser vers l'avant
    const o = obstacleEn(p, j.x, j.z - 0.12, CONFIG.rayonJoueur)
    if (!o || o.i < 0 || j.z < o.rangee.z) continue
    const porte = o.rangee.portes[o.i]
    if (porte.vraie) {
      porte.ouverte = p.t
      evts.push({ type: 'porte', x: xPorte(o.i), y: 1, z: o.rangee.z })
    } else {
      toucher(j, 0, 1, CONFIG.rebond, evts)
    }
  }
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementCourse(p.joueurs)
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  portes(p, entrees, evts)
  majCourse(p, PISTE, evts)
  return evts
}
