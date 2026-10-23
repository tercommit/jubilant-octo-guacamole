// Les villes de l'île : quelques maisons, des animaux et un élément de culture pour chacune, posés autour de leur
// vraie position (même projection que cartes/export_plateau.py), à côté des cases et des chemins, jamais dessus.
import { SOL, hauteurSol } from './ile.js'
import { hauteurPlateau, distanceCase, distanceChemin } from './carte.js'

// Projection de cartes/export_plateau.py : longitude, latitude → unités du plateau (1 unité = 2,4 km)
const BBOX = [55.19, -21.41, 55.86, -20.84]
const LON0 = (BBOX[0] + BBOX[2]) / 2, LAT0 = (BBOX[1] + BBOX[3]) / 2
const KX = (111.32 * Math.cos((LAT0 * Math.PI) / 180)) / 2.4, KZ = 110.54 / 2.4
const unites = (lon, lat) => [(lon - LON0) * KX, (LAT0 - lat) * KZ]

/** Rayon d'emprise de chaque type d'élément ; `mer` : posé sur l'eau du lagon. */
export const TYPES = {
  maison: { r: 0.36 }, eglise: { r: 0.4 }, temple: { r: 0.36 }, mosquee: { r: 0.38 }, phare: { r: 0.2 },
  sucrerie: { r: 0.48 }, kiosque: { r: 0.32 }, etal: { r: 0.18 }, charrette: { r: 0.18 }, fontaine: { r: 0.3 },
  lanterne: { r: 0.06 }, palmier: { r: 0.14 }, canon: { r: 0.15 }, tonneau: { r: 0.09 }, tombe: { r: 0.2 },
  canne: { r: 0.34 }, mais: { r: 0.28 }, fleurs: { r: 0.08 },
  vache: { r: 0.12 }, poule: { r: 0.1 }, cochon: { r: 0.11 }, chien: { r: 0.1 }, chat: { r: 0.1 }, crabe: { r: 0.11 },
  barque: { r: 0.22, mer: true }, navire: { r: 0.42, mer: true },
}

const fois = (n, type) => Array(n).fill(type)

// Le premier élément est le monument de la ville : il est placé au plus près de son centre.
// (`note` : ce que la ville montre, pour s'y retrouver)
export const VILLES = [
  { nom: 'Saint-Denis', lon: 55.4504, lat: -20.8823, note: 'cathédrale, mosquée Noor-e-Islam, canons du Barachois',
    elements: ['eglise', 'mosquee', ...fois(3, 'maison'), ...fois(2, 'canon'), ...fois(2, 'palmier'), 'lanterne', 'chat'] },
  { nom: 'Sainte-Marie', lon: 55.5491, lat: -20.897, note: 'champs de canne',
    elements: ['canne', ...fois(2, 'maison'), ...fois(2, 'poule'), 'fleurs'] },
  { nom: 'Sainte-Suzanne', lon: 55.6079, lat: -20.9061, note: 'le phare de Bel-Air',
    elements: ['phare', ...fois(2, 'maison'), 'palmier', 'chien'] },
  { nom: 'Saint-André', lon: 55.6503, lat: -20.9632, note: 'temple tamoul du Colosse, canne',
    elements: ['temple', ...fois(2, 'canne'), ...fois(2, 'maison'), 'vache', 'fleurs'] },
  { nom: 'Saint-Benoît', lon: 55.7128, lat: -21.034, note: 'église, pêche aux bichiques',
    elements: ['eglise', ...fois(2, 'maison'), 'barque', 'poule', 'chat'] },
  { nom: 'Sainte-Rose', lon: 55.7965, lat: -21.1275, note: 'Notre-Dame-des-Laves',
    elements: ['eglise', 'maison', ...fois(2, 'palmier'), 'poule'] },
  { nom: 'Saint-Philippe', lon: 55.7678, lat: -21.3587, note: 'vanille et cochons de cour',
    elements: ['maison', 'cochon', ...fois(2, 'poule'), 'palmier', 'fleurs'] },
  { nom: 'Saint-Joseph', lon: 55.6197, lat: -21.3779, note: 'canne et charrette',
    elements: ['canne', ...fois(2, 'maison'), 'charrette', 'chien', 'cochon'] },
  { nom: 'Saint-Pierre', lon: 55.4781, lat: -21.3393, note: 'kiosque du front de mer, marché couvert, barques',
    elements: ['kiosque', ...fois(2, 'etal'), ...fois(3, 'maison'), ...fois(2, 'barque'), ...fois(2, 'palmier'), 'chat'] },
  { nom: 'Le Tampon', lon: 55.5153, lat: -21.278, note: 'les maisons des hauts',
    elements: [...fois(3, 'maison'), 'mais', 'poule', 'chien'] },
  { nom: 'Plaine des Cafres', lon: 55.567, lat: -21.21, note: 'les vaches de la Plaine',
    elements: [...fois(4, 'vache'), 'maison', 'fleurs'] },
  { nom: 'Plaine-des-Palmistes', lon: 55.627, lat: -21.135, note: 'palmistes et cases',
    elements: [...fois(2, 'maison'), ...fois(3, 'palmier'), 'vache'] },
  { nom: 'Saint-Louis', lon: 55.4113, lat: -21.2861, note: 'la sucrerie du Gol',
    elements: ['sucrerie', ...fois(2, 'canne'), 'charrette', ...fois(2, 'maison')] },
  { nom: 'Saint-Leu', lon: 55.2876, lat: -21.1709, note: 'barques de pêcheurs et crabes',
    elements: [...fois(2, 'maison'), ...fois(2, 'barque'), ...fois(2, 'crabe'), ...fois(2, 'palmier'), 'lanterne'] },
  { nom: 'Saint-Paul', lon: 55.27, lat: -21.0097, note: 'tombe de La Buse au cimetière marin, marché forain',
    elements: ['tombe', ...fois(2, 'etal'), ...fois(2, 'maison'), ...fois(2, 'palmier'), 'chien'] },
  { nom: 'Le Port', lon: 55.2925, lat: -20.937, note: 'le port et ses navires',
    elements: ['navire', ...fois(3, 'tonneau'), ...fois(2, 'maison'), 'chat'] },
  { nom: 'Cilaos', lon: 55.4719, lat: -21.1347, note: 'Notre-Dame-des-Neiges, lentilles',
    elements: ['eglise', ...fois(3, 'maison'), 'mais'] },
  { nom: 'Hell-Bourg', lon: 55.5676, lat: -21.0636, note: 'cases créoles et jardins',
    elements: [...fois(3, 'maison'), 'fontaine', ...fois(2, 'fleurs')] },
]

function hasard(n) {
  const s = Math.sin(n * 91.7) * 23421.631
  return s - Math.floor(s)
}

/** Points du bord de l'emprise d'un élément, et son centre. */
const emprise = (x, z, r) => [[x, z], [x + r, z], [x - r, z], [x, z + r], [x, z - r]]

function convient(x, z, r, mer, places) {
  if (places.some((p) => Math.hypot(p.x - x, p.z - z) < r + p.r + 0.04)) return false
  if (distanceCase(x, z) < 0.95 + r) return false
  const pts = emprise(x, z, r)
  if (mer) return pts.every(([a, b]) => { const h = hauteurSol(a, b); return h < SOL - 0.08 && h > -0.7 })
  if (distanceChemin(x, z) < 0.28 + r) return false
  if (!pts.every(([a, b]) => hauteurSol(a, b) >= SOL + 0.01)) return false
  const hs = pts.map(([a, b]) => hauteurPlateau(a, b))
  return Math.max(...hs) - Math.min(...hs) < 0.45 // pas sur un rempart
}

/** Place les éléments de chaque ville en spirale autour de son centre, au premier endroit libre. */
function placer() {
  const places = []
  VILLES.forEach((v, iv) => {
    const [cx, cz] = unites(v.lon, v.lat)
    v.x = cx
    v.z = cz
    // le monument d'abord, puis les plus grands éléments : les petits se glissent entre eux
    const [monument, ...reste] = v.elements
    ;[monument, ...reste.sort((a, b) => TYPES[b].r - TYPES[a].r)].forEach((type, ie) => {
      const { r, mer } = TYPES[type]
      const graine = iv * 100 + ie
      for (let k = 0; k < 500; k++) {
        const a = k * 2.39996 + hasard(graine) * 6.28, d = 0.16 * Math.sqrt(k)
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d
        if (!convient(x, z, r, mer, places)) continue
        // Sur une pente, un bâtiment repose sur un socle de pierre (une terrasse) à demi enterré ; les petits suivent le sol
        const hs = emprise(x, z, r).map(([a, b]) => hauteurPlateau(a, b))
        const bas = Math.min(...hs), haut = Math.max(...hs)
        let y = bas - 0.02, socle = 0
        if (mer) y = 0
        else if (r < 0.15) y = hauteurPlateau(x, z) - 0.01
        else if (haut - bas > 0.1) { y = bas + (haut - bas) * 0.6; socle = y - bas + 0.04 }
        // les bâtiments regardent vers le centre de la ville, les animaux et les bateaux n'importe où
        const rot = mer || ['vache', 'poule', 'cochon', 'chien', 'chat', 'crabe'].includes(type)
          ? hasard(graine + 0.5) * 6.28
          : Math.atan2(cx - x, cz - z) + (hasard(graine + 0.3) - 0.5) * 0.6
        places.push({ ville: iv, type, x, y, z, r, rot, socle, graine })
        return
      }
      if (import.meta.env?.DEV) console.warn(`${v.nom} : pas de place pour « ${type} »`)
    })
  })
  return places
}

export const ELEMENTS = placer()

/** Vrai si (x, z) est libre de tout élément des villes, avec une marge. */
export const loinDesVilles = (x, z, marge) => ELEMENTS.every((e) => Math.hypot(e.x - x, e.z - z) > e.r + marge)
