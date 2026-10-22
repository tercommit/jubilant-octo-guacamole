// Logique pure du mini-jeu « La queue du margouillat » (à la Tail Tag) : certains joueurs ont une queue de
// margouillat ; B près d'un porteur la lui vole. Chaque seconde avec une queue rapporte un point, et en avoir une
// à la fin rapporte un bonus.
import { CONFIG } from './config.js'
import { deroule, majDeroule, classer } from '../../commun/arene/deroule.js'
import { creerSauteur, majSauteurs, opsSaut, enJeu } from '../../commun/saut/physique.js'
import { majLutte } from '../../commun/lutte.js'
import { mondeIle } from '../../commun/saut/ile.js'

const MONDE = mondeIle(CONFIG)
const DEPARTS = [[-2.8, 2.8], [2.8, -2.8], [2.8, 2.8], [-2.8, -2.8]]

export function creerPartie(joueurs, aleatoire = Math.random) {
  const p = { ...deroule(CONFIG), aleatoire }
  p.joueurs = joueurs.map((j, i) => ({ ...creerSauteur(j, i, ...DEPARTS[i]), queue: false, protegeQueue: 0 }))
  // la moitié des joueurs (au moins un) commence avec une queue
  const ordre = p.joueurs.map((j) => j.index).sort(() => aleatoire() - 0.5)
  for (const i of ordre.slice(0, Math.max(1, Math.floor(joueurs.length / 2)))) p.joueurs[i].queue = true
  return p
}

/** B près d'un porteur : on lui vole sa queue. Renvoie les appareils dont l'appui sur B a servi. */
function vols(p, entrees, evts) {
  const servis = new Set()
  for (const j of p.joueurs) {
    if (j.queue || !enJeu(j) || j.etourdi > 0 || !entrees.appuis.get(j.appareil)?.b) continue
    let cible = null, dmin = CONFIG.portee
    for (const o of p.joueurs) {
      if (!o.queue || o.protegeQueue > 0 || !enJeu(o) || Math.abs(o.y - j.y) > 1) continue
      const d = Math.hypot(o.x - j.x, o.z - j.z)
      if (d < dmin) { dmin = d; cible = o }
    }
    if (!cible) continue
    cible.queue = false
    cible.etourdi = Math.max(cible.etourdi, CONFIG.sonne)
    j.queue = true
    j.protegeQueue = CONFIG.protection
    servis.add(j.appareil)
    evts.push({ type: 'point', joueur: j.index, x: cible.x, y: cible.y, z: cible.z })
  }
  return servis
}

const classement = (joueurs) => classer(joueurs, (j) => Math.floor(j.points), (j) => ({
  points: Math.floor(j.points),
  detail: `${Math.floor(j.points)} pts${j.queue ? ' · queue à la fin' : ''}`,
}))

export function majPartie(p, dt, entrees) {
  const evts = []
  const etape = majDeroule(p, dt, entrees, evts)
  if (etape === 'fin') {
    for (const j of p.joueurs) if (j.queue) j.points += CONFIG.bonusFin
    p.classement = classement(p.joueurs)
  }
  if (etape !== 'jeu') return evts

  majSauteurs(p, dt, entrees, evts, MONDE)
  // un appui sur B qui a volé une queue ne sert pas aussi à pousser
  const servis = vols(p, entrees, evts)
  const appuis = new Map([...entrees.appuis].map(([id, a]) => [id, servis.has(id) ? { ...a, b: false } : a]))
  majLutte(p, dt, { ...entrees, appuis }, evts, opsSaut(MONDE, p, evts))
  for (const j of p.joueurs) {
    j.protegeQueue = Math.max(0, j.protegeQueue - dt)
    if (j.queue) j.points += dt
    j.affiche = `${Math.floor(j.points)}${j.queue ? ' 🦎' : ''}`
  }
  return evts
}
