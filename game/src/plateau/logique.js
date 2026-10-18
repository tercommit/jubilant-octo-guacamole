// Logique pure du plateau (aucune dépendance à React ni à Three.js) : réglages, ordre de jeu, tours, vanille,
// cases spéciales, fin.
// Phases : reglages → ordre → annonceOrdre → tour → annonceMinijeu → minijeu → bilan → (tour suivant | fin)
// Pendant la phase « tour », `etape` : lancer → de → pas (→ choix | achat) … → arrive
import { CONFIG } from './config.js'
import { CASES, DEPART, distances } from './carte.js'
import { majPause, OPTIONS_PLATEAU, OPTIONS_MINIJEU } from '../commun/menu.js'

/**
 * @param joueurs [{ appareil, couleur }]
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
    menu: null,
    message: null, // { texte, joueur?, autre?, reste }
    fileMessages: [], // messages qui attendent leur tour
    minijeuPasse: false,
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

/** Message temporaire ; avec `joueur`, le HUD le préfixe du nom de son avatar (et le suffixe de celui d'`autre`). */
function message(p, texte, joueur = null, autre = null) {
  const m = { texte, joueur, autre, reste: CONFIG.dureeMessage }
  if (p.message) p.fileMessages.push(m) // le message en cours reste lisible jusqu'au bout
  else p.message = m
}

function changerPhase(p, phase) {
  p.phase = phase
  p.attente = 0
}

function avancer(p, evts) {
  const j = joueurActif(p)
  if (p.pas === 0) {
    const effet = effetCase(p, j, evts)
    p.etape = 'arrive'
    p.minuteur = effet ? CONFIG.dureeEffet : CONFIG.dureeArrivee
    return
  }
  const c = CASES[j.case]
  if (c.suivants.length > 1) { p.etape = 'choix'; p.selection = 0; evts.push({ type: 'choix' }); return }
  sauter(p, c.suivants[0])
}

const hasard = (p, liste) => liste[Math.floor(p.aleatoire() * liste.length)]

/** Effet de la case où le joueur s'arrête (voir docs/specs/05-cases.md). @returns true s'il y en a un */
function effetCase(p, j, evts) {
  const type = CASES[j.case].type
  const autres = p.joueurs.filter((o) => o !== j)
  let effet = null

  if (type === 'bleue') {
    j.zarlor += CONFIG.gainBleue
    message(p, `gagne ${CONFIG.gainBleue} zarlor`, j.index)
    effet = { gain: CONFIG.gainBleue }
  } else if (type === 'rouge') {
    const perte = Math.min(CONFIG.perteRouge, j.zarlor)
    j.zarlor -= perte
    message(p, perte ? `perd ${perte} zarlor : kass la tèt !` : "n'a plus rien à perdre…", j.index)
    effet = { gain: -perte }
  } else if (type === 'chance') {
    const total = CONFIG.chance.reduce((t, c) => t + c.poids, 0)
    let r = p.aleatoire() * total
    let tirage = CONFIG.chance.find((c) => (r -= c.poids) < 0) ?? CONFIG.chance[0]
    if (tirage.effet === 'cotisation' && !autres.length) tirage = { effet: 'gain', zarlor: 5 }
    if (tirage.effet === 'gain') {
      j.zarlor += tirage.zarlor
      message(p, tirage.zarlor >= 10 ? `gagne le gros lot du loto : ${tirage.zarlor} zarlor !` : `trouve ${tirage.zarlor} zarlor sous un galet !`, j.index)
    } else if (tirage.effet === 'cotisation') {
      for (const o of autres) {
        const don = Math.min(tirage.zarlor, o.zarlor)
        o.zarlor -= don
        j.zarlor += don
      }
      message(p, `fête son anniversaire : chacun lui donne ${tirage.zarlor} zarlor !`, j.index)
    } else if (tirage.effet === 'vanille') {
      j.case = caseAvant(p, p.vanille, 2)
      message(p, 'monte dans le car jaune : direction la vanille !', j.index)
    }
    effet = { chance: tirage.effet }
  } else if (type === 'cyclone') {
    if (autres.length) {
      // échange de place avec un autre joueur
      const o = hasard(p, autres)
      ;[j.case, o.case] = [o.case, j.case]
      message(p, 'se fait emporter par le cyclone : échange de place avec', j.index, o.index)
      effet = { avec: o.index }
    } else {
      j.case = hasard(p, CASES.filter((c) => c.id !== j.case)).id
      message(p, 'se fait emporter par le cyclone !', j.index)
      effet = {}
    }
  }
  if (effet) evts.push({ type: 'case', joueur: j.index, case: type, ...effet })
  return effet !== null
}

/** Une case située `n` pas avant `cible` (au hasard s'il y a plusieurs chemins). */
function caseAvant(p, cible, n) {
  let c = cible
  for (let k = 0; k < n; k++) c = hasard(p, CASES.filter((x) => x.suivants.includes(c))).id
  return c
}

function sauter(p, vers) {
  p.mouvement = { de: joueurActif(p).case, vers, t: 0 }
  p.etape = 'pas'
}

/** Applique les gains d'un mini-jeu ([{ joueur, place, zarlor }]) et passe au bilan du tour. */
export function finMinijeu(p, classement) {
  p.minijeuPasse = classement.every((c) => c.passe)
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

  // Menu Start (pas pendant un mini-jeu, qui a le sien). À l'annonce d'un mini-jeu, on peut le passer.
  if (p.phase !== 'reglages' && p.phase !== 'minijeu') {
    const options = p.phase === 'annonceMinijeu' ? OPTIONS_MINIJEU : OPTIONS_PLATEAU
    const enPause = majPause(p, entrees, evts, options)
    if (evts.some((e) => e.type === 'passer')) {
      p.pause = false
      p.menu = null
      finMinijeu(p, [])
      return evts
    }
    if (enPause) return evts
  }

  p.attente += dt
  if (p.message && (p.message.reste -= dt) <= 0) p.message = p.fileMessages.shift() ?? null
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
          message(p, 'achète une gousse de vanille !', j.index)
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
