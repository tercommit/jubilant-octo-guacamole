// Décor des « Cerceaux du lagon » : l'île à plateformes et les cerceaux (dorés au-dessus des plateformes).
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ILE } from '../../commun/saut/ile.js'
import { Ile } from '../../commun/saut/decor.jsx'

const MAX = 8
const ARBRES = [[-7.5, 2, 'tree', 1.6], [7.4, 2.6, 'tree-pine', 1.5], [-3.5, -7.4, 'tree-pine', 1.4], [3.8, -7.2, 'tree', 1.5], [6, 5.8, 'tree', 1.3], [-6.2, 5.6, 'tree-pine', 1.5]]

function Cerceaux({ partieRef }) {
  const pool = useRef([])
  useFrame(({ clock }) => {
    const cerceaux = partieRef.current.cerceaux
    pool.current.forEach((g, i) => {
      const c = cerceaux[i]
      g.visible = !!c
      if (!c) return
      g.position.set(c.x, c.y + Math.sin(clock.elapsedTime * 2 + c.id) * 0.05, c.z)
      g.rotation.y = c.angle
      g.children[0].material.color.set(c.or ? '#f2c230' : '#ff5fa2')
      g.children[0].material.emissive.set(c.or ? '#7a5a00' : '#5a0a2e')
    })
  })
  return Array.from({ length: MAX }, (_, i) => (
    <group key={i} ref={(g) => (pool.current[i] = g)} visible={false}>
      {/* le cerceau est dans le plan (x, y) de son groupe : on le traverse selon z */}
      <mesh castShadow>
        <torusGeometry args={[0.95, 0.1, 8, 24]} />
        <meshStandardMaterial emissiveIntensity={0.6} flatShading />
      </mesh>
    </group>
  ))
}

export default function Decor({ partieRef }) {
  return (
    <group>
      <Ile ILE={ILE} arbres={ARBRES} />
      <Cerceaux partieRef={partieRef} />
    </group>
  )
}
