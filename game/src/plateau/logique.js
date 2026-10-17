// Logique pure du plateau (aucune dépendance à React ni à Three.js) : réglages, ordre de jeu, tours, vanille, fin.
// Phases : reglages → ordre → annonceOrdre → tour → annonceMinijeu → minijeu → bilan → (tour suivant | fin)
// Pendant la phase « tour », `etape` : lancer → de → pas (→ choix | achat) … → arrive
import { CONFIG } from './config.js'
import { CASES, DEPART, distances } from './carte.js'

/**
 * @param joueurs [{ appareil, avatar, couleur }]
 * @param minijeux identifiants des mini-jeux à tirer au sort
 */
export function creerPlateau(joueurs, minijeux, aleatoire = Math.random) {
  const p = {
    phase: 'reglages',
    choixTours: 0,
    tours: null,
    tour: 1,
    joueurs: joueurs.map((j, i) => ({
      ...j, index: i, zarlor: CONFIG.zarlorDepart, vanilles: 0, case: DEPART, deOrdre: null, gain: 0,
    })),
    ordre: [],
    rang: 0, // position dans l'ordre de jeu du joueur qui joue
    etape: null,
    de: null,
    pas: 0,
    mouvement: null, // { de, vers, t } pendant un saut de case
    selection: 0, // route choisie à un embranchement
    vanille: null,
    minijeux,
    minijeu: null,
    dernierMinijeu: null,
    pause: false,
    message: null,
    attente: 0, // temps passé dans la phase en cours (évite qu'un appui en double saute un écran)
    minuteur: 0,
    sticks: {},
    aleatoire,
  }
  p.vanille = tirerVanille(p, DEPART)
  return p
}

function tirerVanille(p, loinDe) {
  const d = distances(loinDe)
  const candidates = CASES.filter((c) => d[c.id] >= CONFIG.distanceVanille && c.id !== DEPART)
  return candidates[Math.floor(p.aleatoire() * candidates.length)].id
}

export const joueurActif = (p) => (p.phase === 'tour' ? p.joueurs[p.ordre[p.rang]] : null)

function message(p, texte) {
  p.message = { texte, reste: CONFIG.dureeMessage }
}

function changerPhase(p, phase) {
  p.phase = phase
  p.attente = 0
}

function avancer(p, evts) {
  const j = joueurActif(p)
  if (p.pas === 0) { p.etape = 'arrive'; p.minuteur = CONFIG.dureeArrivee; return }
  const c = CASES[j.case]
  if (c.suivants.length > 1) { p.etape = 'choix'; p.selection = 0; evts.push({ type: 'choix' }); return }
  sauter(p, c.suivants[0])
}

function sauter(p, vers) {
  p.mouvement = { de: joueurActif(p).case, vers, t: 0 }
  p.etape = 'pas'
}

/** Applique les gains d'un mini-jeu ([{ joueur, place, zarlor }]) et passe au bilan du tour. */
export function finMinijeu(p, classement) {
  for (const j of p.joueurs) j.gain = 0
  for (const c of classement) {
    const j = p.joueurs[c.joueur]
    j.gain = c.zarlor
    j.zarlor += c.zarlor
  }
  p.dernierMinijeu = p.minijeu
  changerPhase(p, 'bilan')
}

/** Classement final : vanilles, puis zarlor ; les ex æquo partagent la place. */
export function classementFinal(joueurs) {
  const score = (j) => j.vanilles * 10000 + j.zarlor
  const tri = [...joueurs].sort((a, b) => score(b) - score(a))
  let place = 0
  return tri.map((j, i) => {
    if (i === 0 || score(j) < score(tri[i - 1])) place = i + 1
    return { joueur: j.index, place, vanilles: j.vanilles, zarlor: j.zarlor }
  })
}

/**
 * Avance le plateau de `dt` secondes.
 * @param entrees { etats: Map, appuis: Map } (voir commun/entrees.js)
 * @returns évènements : 'de', 'pas', 'achat', 'minijeu' (avec id), 'quitter', …
 */
export function majPlateau(p, dt, entrees) {
  const evts = []
  const etat = (j) => entrees.etats.get(j.appareil) || { x: 0, y: 0 }
  const appui = (j) => entrees.appuis.get(j.appareil) || {}
  const quelquun = (bouton) => p.joueurs.some((j) => appui(j)[bouton])
  // Stick gauche / droite : un cran par poussée
  const cran = (j) => {
    const x = etat(j).x
    const sens = x > 0.6 ? 1 : x < -0.6 ? -1 : 0
    const avant = p.sticks[j.appareil] ?? 0
    p.sticks[j.appareil] = sens
    return sens !== avant ? sens : 0
  }

  // Pause : Start de n'importe quel joueur, ou manette déconnectée (pas pendant un mini-jeu, qui gère la sienne)
  if (p.phase !== 'reglages' && p.phase !== 'minijeu') {
    if (p.joueurs.some((j) => !entrees.etats.get(j.appareil)?.connecte)) p.pause = true
    else if (quelquun('start')) { p.pause = !p.pause; evts.push({ type: 'pause', pause: p.pause }) }
  }
  if (p.pause) return evts

  p.attente += dt
  if (p.message && (p.message.reste -= dt) <= 0) p.message = null
  const pret = p.attente > 0.4

  switch (p.phase) {
    case 'reglages': {
      const j1 = p.joueurs[0]
      const s = cran(j1)
      if (s) p.choixTours = (p.choixTours + s + CONFIG.tours.length) % CONFIG.tours.length
      if (appui(j1).a) { p.tours = CONFIG.tours[p.choixTours]; changerPhase(p, 'ordre') }
      break
    }

    case 'ordre': {
      // Chaque joueur lance le dé ; tirage sans remise, donc jamais d'égalité
      const pris = p.joueurs.map((j) => j.deOrdre).filter((v) => v !== null)
      for (const j of p.joueurs) {
        if (j.deOrdre !== null || !appui(j).a || !pret) continue
        const libres = Array.from({ length: CONFIG.de }, (_, i) => i + 1).filter((v) => !pris.includes(v))
        j.deOrdre = libres[Math.floor(p.aleatoire() * libres.length)]
        pris.push(j.deOrdre)
        evts.push({ type: 'deOrdre', joueur: j.index, valeur: j.deOrdre })
      }
      if (p.joueurs.every((j) => j.deOrdre !== null)) {
        p.ordre = [...p.joueurs].sort((a, b) => b.deOrdre - a.deOrdre).map((j) => j.index)
        changerPhase(p, 'annonceOrdre')
      }
      break
    }

    case 'annonceOrdre':
      if (p.attente > 1 && quelquun('a')) { changerPhase(p, 'tour'); p.rang = 0; p.etape = 'lancer' }
      break

    case 'tour': {
      const j = joueurActif(p)
      const a = appui(j)
      if (p.etape === 'lancer') {
        if (a.a && pret) {
          p.de = 1 + Math.floor(p.aleatoire() * CONFIG.de)
          p.pas = p.de
          p.etape = 'de'
          p.minuteur = CONFIG.dureeDe
          evts.push({ type: 'de', joueur: j.index, valeur: p.de })
        }
      } else if (p.etape === 'de') {
        if ((p.minuteur -= dt) <= 0) avancer(p, evts)
      } else if (p.etape === 'pas') {
        const m = p.mouvement
        m.t += dt / CONFIG.dureePas
        if (m.t >= 1) {
          j.case = m.vers
          p.mouvement = null
          p.pas--
          evts.push({ type: 'pas', joueur: j.index, case: j.case })
          if (j.case === p.vanille) {
            if (j.zarlor >= CONFIG.prixVanille) { p.etape = 'achat'; break }
            message(p, `Pas assez de zarlor pour la vanille (${CONFIG.prixVanille})`)
          }
          avancer(p, evts)
        }
      } else if (p.etape === 'choix') {
        const opts = CASES[j.case].suivants
        const e = etat(j)
        if (Math.hypot(e.x, e.y) > 0.5) {
          // la route dont la direction ressemble le plus à celle du stick
          const c = CASES[j.case]
          let best = -Infinity
          opts.forEach((id, i) => {
            const dx = CASES[id].x - c.x, dz = CASES[id].z - c.z
            const s = (dx * e.x + dz * e.y) / Math.hypot(dx, dz)
            if (s > best) { best = s; p.selection = i }
          })
        }
        if (a.a) sauter(p, opts[p.selection])
      } else if (p.etape === 'achat') {
        if (a.a) {
          j.zarlor -= CONFIG.prixVanille
          j.vanilles++
          p.vanille = tirerVanille(p, j.case)
          message(p, `${j.avatar.nom} achète une gousse de vanille !`)
          evts.push({ type: 'achat', joueur: j.index })
          avancer(p, evts)
        } else if (a.b) avancer(p, evts)
      } else if (p.etape === 'arrive') {
        if ((p.minuteur -= dt) <= 0) {
          p.rang++
          p.de = null
          if (p.rang < p.ordre.length) { p.etape = 'lancer'; p.attente = 0 } else {
            const choix = p.minijeux.filter((id) => id !== p.dernierMinijeu)
            const liste = choix.length ? choix : p.minijeux
            p.minijeu = liste[Math.floor(p.aleatoire() * liste.length)]
            p.etape = null
            changerPhase(p, 'annonceMinijeu')
          }
        }
      }
      break
    }

    case 'annonceMinijeu':
      if (p.attente > 1 && quelquun('a')) { changerPhase(p, 'minijeu'); evts.push({ type: 'minijeu', id: p.minijeu }) }
      break

    case 'bilan':
      if (p.attente > 1 && quelquun('a')) {
        if (p.tour >= p.tours) {
          p.classement = classementFinal(p.joueurs)
          changerPhase(p, 'fin')
        } else {
          p.tour++
          p.rang = 0
          p.etape = 'lancer'
          changerPhase(p, 'tour')
        }
      }
      break

    case 'fin':
      if (p.attente > 1.5 && quelquun('a')) evts.push({ type: 'quitter' })
      break
  }
  return evts
}
