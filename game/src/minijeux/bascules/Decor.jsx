// Décor des « Bascules » : pontons de bois et planches sur pivot au-dessus de l'étang de Saint-Paul.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from './config.js'
import { PISTE } from './logique.js'
import { Mer, Arrivee } from '../../commun/saut/decor.jsx'

const { demiLargeur } = CONFIG

function Bascule({ partieRef, index }) {
  const planche = useRef()
  const b = CONFIG.bascules[index]
  useFrame(() => {
    // un angle logique positif relève le bout côté départ (z croissants) : rotation x négative
    planche.current.rotation.x = -partieRef.current.angles[index]
  })
  return (
    <group position={[b.x, 0, b.z]}>
      <group ref={planche}>
        <mesh position-y={-0.15} castShadow receiveShadow>
          <boxGeometry args={[demiLargeur * 2, 0.3, b.demi * 2]} />
          <meshStandardMaterial color={index % 2 ? '#f2b134' : '#e2703a'} flatShading />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.02, s * (b.demi - 0.4)]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[demiLargeur * 2, 0.3]} />
            <meshStandardMaterial color="#fff4d6" />
          </mesh>
        ))}
      </group>
      {/* pivot */}
      <mesh position-y={-1.2} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.35, 0.35, demiLargeur * 2 + 0.4, 10]} />
        <meshStandardMaterial color="#5a5a62" flatShading />
      </mesh>
      <mesh position-y={-2.2}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#8a7a6a" flatShading />
      </mesh>
    </group>
  )
}

export default function Decor({ partieRef }) {
  return (
    <group>
      {CONFIG.pontons.map(([z1, z2], i) => (
        <mesh key={i} position={[0, -0.25, (z1 + z2) / 2]} receiveShadow castShadow>
          <boxGeometry args={[demiLargeur * 2, 0.5, z1 - z2]} />
          <meshStandardMaterial color="#9a6a42" flatShading />
        </mesh>
      ))}
      {CONFIG.bascules.map((_, i) => <Bascule key={i} partieRef={partieRef} index={i} />)}
      <Arrivee z={PISTE.zArrivee} demiLargeur={demiLargeur} />
      <Mer y={-1.6} couleur="#4e9a8a" />
      {/* songes (nénuphars) sur l'étang */}
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[((i * 7.3) % 20) - 10 + (i % 2 ? 6 : -6), -1.58, -((i * 3.7) % 44)]}>
          <circleGeometry args={[0.6 + (i % 3) * 0.2, 7]} />
          <meshStandardMaterial color="#5fae4a" />
        </mesh>
      ))}
    </group>
  )
}
