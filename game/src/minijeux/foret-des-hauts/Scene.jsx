// Balise (drapeau) que les joueurs doivent atteindre.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import { useModele } from '../../commun/modeles.jsx'
import { HAUT_SOL } from './carte.js'

export function Balise({ partieRef }) {
  const groupe = useRef()
  const drapeau = useRef()
  const sol = useRef()
  const modele = useModele('kenney-platformer/flag.glb')

  useFrame(({ clock }) => {
    const b = partieRef.current.balise
    const t = clock.elapsedTime
    groupe.current.visible = b.active
    groupe.current.position.set(b.x, HAUT_SOL, b.z)
    drapeau.current.rotation.y = t * 1.5
    drapeau.current.position.y = 0.1 + Math.sin(t * 3) * 0.08
    const s = 1 + 0.15 * Math.sin(t * 5)
    sol.current.scale.set(s, s, s)
  })

  return (
    <group ref={groupe}>
      <group ref={drapeau}>
        <Clone object={modele} scale={1.6} castShadow />
      </group>
      <mesh ref={sol} rotation-x={-Math.PI / 2} position-y={0.04}>
        <ringGeometry args={[0.7, 0.9, 40]} />
        <meshBasicMaterial color="#FFE27A" transparent opacity={0.9} />
      </mesh>
      {/* Faisceau lumineux visible de loin */}
      <mesh position-y={1.75}>
        <cylinderGeometry args={[0.15, 0.4, 3.5, 16, 1, true]} />
        <meshBasicMaterial color="#FFF3B0" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
