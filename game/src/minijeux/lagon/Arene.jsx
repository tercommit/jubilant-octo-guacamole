// Décor du lagon : îlot de sable, marée qui monte tuile par tuile, coffre de La Buse, bateau au large.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import { useModele } from '../../commun/modeles.jsx'
import Pieces from '../../commun/arene/Pieces.jsx'
import { CONFIG } from './config.js'
import { HAUT_SOL, etatTuile } from './carte.js'
import { horloge } from './logique.js'

const S = CONFIG.echelleTuile
const EAU = new THREE.MeshStandardMaterial({ color: '#3fc1d3', transparent: true, opacity: 0.78, flatShading: true })

/** Nappe d'eau posée sur chaque tuile : elle monte pendant l'alerte, puis ondule. */
function Maree({ partieRef }) {
  const refs = useRef([])
  const tuiles = [...partieRef.current.tuiles.values()].filter((t) => t.submersion > 0)
  useFrame(({ clock }) => {
    const temps = horloge(partieRef.current)
    tuiles.forEach((t, i) => {
      const m = refs.current[i]
      const e = etatTuile({ ...t, type: 'sable' }, temps)
      m.visible = e !== 'sable'
      if (e === 'alerte') {
        const k = 1 - (t.submersion - temps) / CONFIG.maree.alerte
        m.position.y = HAUT_SOL - 0.2 + k * 0.23
      } else if (e === 'eau') {
        m.position.y = HAUT_SOL + 0.03 + Math.sin(clock.elapsedTime * 2 + t.q + t.r) * 0.03
      }
    })
  })
  return tuiles.map((t, i) => (
    <mesh key={i} ref={(m) => (refs.current[i] = m)} position={[t.x, 0, t.z]} material={EAU} visible={false} receiveShadow>
      <cylinderGeometry args={[S * 0.5774, S * 0.5774, 0.06, 6]} />
    </mesh>
  ))
}

function Coffre({ partieRef }) {
  const groupe = useRef()
  const modele = useModele('kenney-platformer/chest.glb')
  useFrame(({ clock }) => {
    const c = partieRef.current.coffre
    groupe.current.visible = !!c
    if (!c) return
    groupe.current.position.set(c.x, HAUT_SOL, c.z)
    groupe.current.children[0].rotation.y = clock.elapsedTime * 0.8
  })
  return (
    <group ref={groupe} visible={false}>
      <Clone object={modele} scale={2.6} castShadow />
      <mesh position-y={1.75}>
        <cylinderGeometry args={[0.2, 0.6, 3.5, 16, 1, true]} />
        <meshBasicMaterial color="#FFF3B0" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function Arene({ partieRef }) {
  const modeles = {
    sable: useModele('kenney-hex/sand.glb'),
    eau: useModele('kenney-hex/water.glb'),
    rocher: useModele('kenney-hex/sand-rocks.glb'),
  }
  const bateau = useModele('kenney-hex/unit-ship.glb')
  const ponton = useModele('kenney-hex/building-dock.glb')
  const tuiles = [...partieRef.current.tuiles.values()]

  return (
    <group>
      {tuiles.map((t) => (
        <Clone key={`${t.q},${t.r}`} object={modeles[t.type]} position={[t.x, 0, t.z]} scale={S} receiveShadow castShadow />
      ))}
      <Maree partieRef={partieRef} />
      <Pieces partieRef={partieRef} hauteur={HAUT_SOL} />
      <Coffre partieRef={partieRef} />

      {/* Lagon turquoise puis océan plus sombre au large */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.12}>
        <circleGeometry args={[16, 6]} />
        <meshStandardMaterial color="#47c4d6" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.08}>
        <circleGeometry args={[80, 32]} />
        <meshStandardMaterial color="#1f86b8" />
      </mesh>
      <Clone object={bateau} position={[-13, 0.1, -6]} rotation-y={0.8} scale={4} />
      <Clone object={ponton} position={[12.5, 0.1, 4]} rotation-y={-1} scale={3} />
    </group>
  )
}
