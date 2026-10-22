// Logique pure du mini-jeu « Fruits péi » (à la Perfect Match) : mémorise les fruits des dalles, rejoins le fruit
// annoncé avant que les autres dalles tombent dans le lagon. Les survivants marquent un point par manche.
import { CONFIG } from './config.js'
import { deroule, majDeroule } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut } from '../../commun/saut/physique.js'
import { eliminer, classementSurvie, finSurvie } from '../../commun/saut/regles.js'
import { majLutte } from '../../commun/lutte.js'

export const TYPES = ['letchi', 'mangue', 'ananas', 'banane', 'coco']
const NOMS = { letchi: 'Letchi', mangue: 'Mangue', ananas: 'Ananas', banane: 'Banane', coco: 'Coco' }
const PAS = CONFIG.taille + CONFIG.ecart
const DEPARTS = [[-1.3, -1.3], [1.3, 1.3], [1.3, -1.3], [-1.3, 1.3]]

/** Dalles { x, z, fruit } en grille, centrées. */
function creerDalles() {
  const n = CONFIG.colonnes
  const dalles = []
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) dalles.push({ x: (i - (n - 1) / 2) * PAS, z: (k - (n - 1) / 2) * PAS, fruit: null })
  return dalles
}

const dalleEn = (p, x, z) => p.dalles.find((d) => Math.abs(x - d.x) <= CONFIG.taille / 2 + 0.1 && Math.abs(z - d.z) <= CONFIG.taille / 2 + 0.1)

/** La dalle est-elle en place (pas tombée) ? */
export const enPlace = (p, d) => !(p.etape === 'chute' && d.fruit !== p.cible)

/** Hauteur d'affichage de la dalle : elle plonge pendant la chute et remonte ensuite. */
export function hauteurDalle(p, d) {
  if (p.etape === 'chute' && d.fruit !== p.cible) return -Math.min(6, (p.depuis ** 2) * 10)
  if (p.etape === 'retour' && p.tombees?.has(d)) return -6 * (1 - p.depuis / CONFIG.retour)
  return 0
}

const MONDE = {
  config: CONFIG,
  support(x, z, y, p) {
    const d = dalleEn(p, x, z)
    return d && enPlace(p, d) && y > -0.6 ? { y: 0 } : null
  },
  tombe: (j, p, evts) => eliminer(p, j, evts),
}

function nouvelleManche(p) {
  const sortes = TYPES.slice(0, CONFIG.sortes[p.manche])
  for (const d of p.dalles) d.fruit = sortes[Math.floor(p.aleatoire() * sortes.length)]
  p.cible = sortes[Math.floor(p.aleatoire() * sortes.length)]
  // au moins deux bonnes dalles, éloignées si possible
  const bonnes = p.dalles.filter((d) => d.fruit === p.cible)
  for (let k = bonnes.length; k < 2; k++) {
    const autres = p.dalles.filter((d) => d.fruit !== p.cible)
    autres[Math.floor(p.aleatoire() * autres.length)].fruit = p.cible
  }
  p.etape = 'montre'
  p.depuis = 0
}

export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = { ...deroule(CONFIG), dalles: creerDalles(), manche: 0, etape: 'montre', depuis: 0, cible: null, aleatoire }
  nouvelleManche(p)
  p.joueurs = joueurs.map((j, i) => creerSauteur(j, i, ...DEPARTS[i]))
  return p
}

function majManche(p, dt, evts) {
  p.depuis += dt
  const nom = NOMS[p.cible]
  if (p.etape === 'montre') {
    p.annonce = 'Mémorise les fruits !'
    if (p.depuis >= CONFIG.memoire[p.manche]) { p.etape = 'annonce'; p.depuis = 0; evts.push({ type: 'annonce', fruit: p.cible }) }
  } else if (p.etape === 'annonce') {
    p.annonce = `${nom} ! ${Math.ceil(CONFIG.annonce - p.depuis)}`
    if (p.depuis >= CONFIG.annonce) {
      p.etape = 'chute'
      p.depuis = 0
      p.tombees = new Set(p.dalles.filter((d) => d.fruit !== p.cible))
    }
  } else if (p.etape === 'chute') {
    p.annonce = nom
    if (p.depuis >= CONFIG.chuteDalles) {
      // manche survécue
      for (const j of p.joueurs) if (j.elimine === null) { j.points++; j.affiche = `${j.points} manche${j.points > 1 ? 's' : ''}` }
      p.etape = 'retour'
      p.depuis = 0
    }
  } else if (p.etape === 'retour') {
    p.annonce = null
    if (p.depuis >= CONFIG.retour) {
      p.manche++
      if (p.manche >= CONFIG.manches) return true
      nouvelleManche(p)
    }
  }
  return false
}

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') p.classement = classementSurvie(p.joueurs)
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  majLutte(p, dt, entrees, evts, opsSaut(MONDE, p, evts))
  const termine = majManche(p, dt, evts)
  if (finSurvie(p, evts)) return evts
  if (termine) {
    p.phase = 'fin'
    p.classement = classementSurvie(p.joueurs)
    evts.push({ type: 'fin' })
  }
  return evts
}
