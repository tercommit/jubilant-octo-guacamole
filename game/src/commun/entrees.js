// Entrées : manettes (Gamepad API) + clavier simulé en mode développement (?clavier).
// Chaque appareil est exposé sous la même forme : { id, x, y, a, b, start, connecte }.
// Les fronts (bouton qui vient d'être pressé) sont dans `appuis`.

export const MODE_CLAVIER = new URLSearchParams(window.location.search).has('clavier')

const ZONE_MORTE = 0.2

const CLAVIERS = [
  { id: 'clavier-1', haut: 'KeyW', bas: 'KeyS', gauche: 'KeyA', droite: 'KeyD', a: 'Space', b: 'ShiftLeft', start: 'Escape',
    // AZERTY
    haut2: 'KeyZ', gauche2: 'KeyQ' },
  { id: 'clavier-2', haut: 'ArrowUp', bas: 'ArrowDown', gauche: 'ArrowLeft', droite: 'ArrowRight', a: 'Enter', b: 'ShiftRight', start: 'Backspace' },
]

const touches = new Set()
// Frappes mémorisées jusqu'à la prochaine lecture : un appui très bref (entre deux images) n'est pas perdu.
const frappes = new Set()
if (MODE_CLAVIER) {
  window.addEventListener('keydown', (e) => {
    touches.add(e.code)
    if (!e.repeat) frappes.add(e.code)
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault()
  })
  window.addEventListener('keyup', (e) => touches.delete(e.code))
  window.addEventListener('blur', () => touches.clear())
}

const precedent = new Map()

function lireManette(gp) {
  let x = gp.axes[0] ?? 0
  let y = gp.axes[1] ?? 0
  const bt = (i) => !!gp.buttons[i]?.pressed
  // croix directionnelle (mapping standard : 12 haut, 13 bas, 14 gauche, 15 droite)
  if (bt(14)) x = -1
  if (bt(15)) x = 1
  if (bt(12)) y = -1
  if (bt(13)) y = 1
  const n = Math.hypot(x, y)
  if (n < ZONE_MORTE) { x = 0; y = 0 } else if (n > 1) { x /= n; y /= n }
  return { id: `manette-${gp.index}`, x, y, a: bt(0), b: bt(1), start: bt(9), connecte: gp.connected }
}

function lireClavier(c) {
  const t = (k) => touches.has(k)
  let x = (t(c.droite) ? 1 : 0) - (t(c.gauche) || (c.gauche2 && t(c.gauche2)) ? 1 : 0)
  let y = (t(c.bas) ? 1 : 0) - (t(c.haut) || (c.haut2 && t(c.haut2)) ? 1 : 0)
  const n = Math.hypot(x, y)
  if (n > 1) { x /= n; y /= n }
  return { id: c.id, x, y, a: t(c.a), b: t(c.b), start: t(c.start), connecte: true }
}

/** Lit tous les appareils. Retourne { etats: Map<id, etat>, appuis: Map<id, {a,b,start}> } */
export function lireEntrees() {
  const etats = new Map()
  const pads = navigator.getGamepads ? navigator.getGamepads() : []
  for (const gp of pads) if (gp) etats.set(`manette-${gp.index}`, lireManette(gp))
  if (MODE_CLAVIER) for (const c of CLAVIERS) etats.set(c.id, lireClavier(c))

  const appuis = new Map()
  for (const [id, e] of etats) {
    const p = precedent.get(id) || {}
    appuis.set(id, { a: e.a && !p.a, b: e.b && !p.b, start: e.start && !p.start })
    precedent.set(id, { a: e.a, b: e.b, start: e.start })
  }
  if (MODE_CLAVIER) {
    for (const c of CLAVIERS) {
      const ap = appuis.get(c.id)
      for (const k of ['a', 'b', 'start']) if (frappes.has(c[k])) ap[k] = true
    }
    frappes.clear()
  }
  return { etats, appuis }
}

export function nomAppareil(id) {
  if (id.startsWith('clavier')) return id === 'clavier-1' ? 'Clavier (ZQSD + Espace)' : 'Clavier (flèches + Entrée)'
  const gp = navigator.getGamepads?.()[Number(id.split('-')[1])]
  return gp ? gp.id.replace(/\(.*?\)/g, '').trim().slice(0, 32) || 'Manette' : 'Manette'
}
