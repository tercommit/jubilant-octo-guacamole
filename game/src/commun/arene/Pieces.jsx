// Rendu des pièces d'or (voir pieces.js) : elles tournent et flottent au-dessus du sol.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import { useModele } from '../modeles.jsx'

const MAX = 10

export default function Pieces({ partieRef, hauteur }) {
  const modele = useModele('kenney-platformer/coin-gold.glb')
  const pool = useRef([])
  useFrame(({ clock }) => {
    const pieces = partieRef.current.pieces ?? []
    const t = clock.elapsedTime
    pool.current.forEach((g, i) => {
      const pc = pieces[i]
      g.visible = !!pc
      if (!pc) return
      g.position.set(pc.x, hauteur + 0.25 + Math.sin(t * 3 + pc.id) * 0.08, pc.z)
      g.rotation.y = t * 2.5 + pc.id
    })
  })
  return Array.from({ length: MAX }, (_, i) => (
    <group key={i} ref={(g) => (pool.current[i] = g)} visible={false}>
      <Clone object={modele} scale={2.2} castShadow />
    </group>
  ))
}
