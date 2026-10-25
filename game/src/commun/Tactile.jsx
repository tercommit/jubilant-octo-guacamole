// Commandes tactiles à l'écran : un stick virtuel (à gauche) et les boutons A, B et Start (à droite).
// Elles pilotent l'appareil « tactile » de entrees.js, qui joue comme une manette.
import { useEffect, useRef, useState } from 'react'
import { majTactile, relacherTactile } from './entrees.js'

const RAYON = 48 // course du stick, en pixels

function Stick() {
  const base = useRef(null)
  const doigt = useRef(null)
  const [pos, setPos] = useState([0, 0])

  const bouger = (e) => {
    const r = base.current.getBoundingClientRect()
    let dx = (e.clientX - (r.left + r.width / 2)) / RAYON
    let dy = (e.clientY - (r.top + r.height / 2)) / RAYON
    const n = Math.hypot(dx, dy)
    if (n > 1) { dx /= n; dy /= n }
    majTactile({ x: dx, y: dy })
    setPos([dx, dy])
  }
  const lacher = (e) => {
    if (e.pointerId !== doigt.current) return
    doigt.current = null
    majTactile({ x: 0, y: 0 })
    setPos([0, 0])
  }

  return (
    <div
      ref={base}
      className="tactile-stick"
      data-testid="tactile-stick"
      onPointerDown={(e) => {
        if (doigt.current !== null) return
        doigt.current = e.pointerId
        e.currentTarget.setPointerCapture?.(e.pointerId)
        bouger(e)
      }}
      onPointerMove={(e) => { if (e.pointerId === doigt.current) bouger(e) }}
      onPointerUp={lacher}
      onPointerCancel={lacher}
    >
      <div className="tactile-pouce" style={{ transform: `translate(${pos[0] * RAYON}px, ${pos[1] * RAYON}px)` }} />
    </div>
  )
}

function Bouton({ nom, libelle }) {
  const [presse, setPresse] = useState(false)
  const lacher = () => { majTactile({ [nom]: false }); setPresse(false) }
  return (
    <button
      type="button"
      className={`tactile-bouton tactile-${nom} ${presse ? 'presse' : ''}`}
      aria-label={`Bouton ${libelle}`}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        majTactile({ [nom]: true })
        setPresse(true)
      }}
      onPointerUp={lacher}
      onPointerCancel={lacher}
      onContextMenu={(e) => e.preventDefault()}
    >
      {libelle}
    </button>
  )
}

export default function Tactile() {
  // Page masquée ou appel entrant : on relâche tout pour ne pas garder un bouton enfoncé
  useEffect(() => {
    const relacher = () => relacherTactile()
    window.addEventListener('blur', relacher)
    document.addEventListener('visibilitychange', relacher)
    return () => {
      relacher()
      window.removeEventListener('blur', relacher)
      document.removeEventListener('visibilitychange', relacher)
    }
  }, [])

  return (
    <div className="tactile" data-testid="tactile">
      <Stick />
      <div className="tactile-boutons">
        <Bouton nom="start" libelle="Start" />
        <Bouton nom="b" libelle="B" />
        <Bouton nom="a" libelle="A" />
      </div>
    </div>
  )
}
