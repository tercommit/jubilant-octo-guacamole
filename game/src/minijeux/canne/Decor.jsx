// Décor de « Saute la canne » : la piste ronde d'une vieille sucrerie, le moulin au centre et ses deux cannes.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from './config.js'
import { rayonPiste, angleBasse, angleHaute, hauteActive } from './logique.js'
import { Mer } from '../../commun/saut/decor.jsx'

/** Une canne à sucre : tige verte à nœuds, qui part du moulin. */
function Canne({ rayon }) {
  const L = CONFIG.longueur - CONFIG.pilier
  return (
    <group>
      <mesh position-x={CONFIG.pilier + L / 2} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[rayon, rayon, L, 8]} />
        <meshStandardMaterial color="#9bc53d" flatShading />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position-x={CONFIG.pilier + 0.5 + i * (L / 7)} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[rayon * 1.12, rayon * 1.12, 0.08, 8]} />
          <meshStandardMaterial color="#6b8f2a" flatShading />
        </mesh>
      ))}
    </group>
  )
}

export default function Decor({ partieRef }) {
  const piste = useRef()
  const basse = useRef()
  const haute = useRef()
  useFrame(() => {
    const t = partieRef.current.t
    const r = rayonPiste(t)
    piste.current.scale.set(r, 1, r)
    // rotation-y de three tourne dans l'autre sens que l'angle (x, z) de la logique
    basse.current.rotation.y = -angleBasse(t)
    haute.current.rotation.y = -angleHaute(t)
    haute.current.visible = hauteActive(t) || Math.floor(t * 4) % 2 === 0
  })
  return (
    <group>
      <mesh ref={piste} position-y={-0.3} receiveShadow>
        <cylinderGeometry args={[1, 0.95, 0.6, 40]} />
        <meshStandardMaterial color="#e9c98f" flatShading />
      </mesh>
      {/* moulin */}
      <mesh position-y={1.2} castShadow>
        <cylinderGeometry args={[CONFIG.pilier, CONFIG.pilier * 1.1, 2.4, 10]} />
        <meshStandardMaterial color="#8a5a3b" flatShading />
      </mesh>
      <mesh position-y={2.5}>
        <coneGeometry args={[CONFIG.pilier * 1.3, 0.8, 10]} />
        <meshStandardMaterial color="#b23a2e" flatShading />
      </mesh>
      <group ref={basse} position-y={CONFIG.basse.hauteur}><Canne rayon={CONFIG.basse.rayon} /></group>
      <group ref={haute} position-y={CONFIG.haute.hauteur}><Canne rayon={CONFIG.haute.rayon} /></group>
      <Mer y={-2} couleur="#7bb662" />
    </group>
  )
}
