// Décor du volcan : basalte, cratère, coulée qui gagne tuile par tuile, bombes volcaniques.
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
const LAVE = new THREE.MeshStandardMaterial({ color: '#ff6a1f', emissive: '#ff3d00', emissiveIntensity: 0.9, flatShading: true })

/** Nappe de lave sur chaque tuile : elle rougeoie pendant l'alerte, puis recouvre la tuile. */
function Coulee({ partieRef }) {
  const refs = useRef([])
  const tuiles = [...partieRef.current.tuiles.values()].filter((t) => t.lave < Infinity)
  const alertes = useRef(tuiles.map(() => new THREE.MeshBasicMaterial({ color: '#ff3d00', transparent: true, opacity: 0 })))
  useFrame(({ clock }) => {
    const temps = horloge(partieRef.current)
    const t0 = clock.elapsedTime
    tuiles.forEach((t, i) => {
      const [lave, alerte] = refs.current[i]
      const e = etatTuile(t, temps)
      lave.visible = e === 'lave'
      lave.position.y = HAUT_SOL + 0.03 + Math.sin(t0 * 1.5 + t.q * 2 + t.r) * 0.02
      alerte.visible = e === 'alerte'
      alertes.current[i].opacity = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t0 * 12))
    })
  })
  return tuiles.map((t, i) => (
    <group key={i} position={[t.x, 0, t.z]}>
      <mesh ref={(m) => ((refs.current[i] ??= [])[0] = m)} material={LAVE} visible={false}>
        <cylinderGeometry args={[S * 0.5774, S * 0.5774, 0.08, 6]} />
      </mesh>
      <mesh ref={(m) => ((refs.current[i] ??= [])[1] = m)} material={alertes.current[i]} position-y={HAUT_SOL + 0.02} rotation-x={-Math.PI / 2} visible={false}>
        <circleGeometry args={[S * 0.55, 6, Math.PI / 2]} />
      </mesh>
    </group>
  ))
}

const MAX_BOMBES = 6

function Bombes({ partieRef }) {
  const modele = useModele('kenney-platformer/bomb.glb')
  const bombes = useRef([])
  const cibles = useRef([])
  const explosions = useRef([])
  useFrame(({ clock }) => {
    const p = partieRef.current
    const { alerte, rayon } = CONFIG.bombes
    bombes.current.forEach((g, i) => {
      const b = p.bombes[i]
      g.visible = cibles.current[i].visible = !!b
      if (!b) return
      const k = b.reste / alerte // 1 → 0 pendant la chute
      g.position.set(b.x, HAUT_SOL + k * k * 14, b.z)
      g.rotation.z = clock.elapsedTime * 6
      cibles.current[i].position.set(b.x, HAUT_SOL + 0.04, b.z)
      cibles.current[i].scale.setScalar(rayon * (1.2 - 0.2 * k))
      cibles.current[i].material.opacity = 0.35 + 0.5 * (1 - k)
    })
    explosions.current.forEach((m, i) => {
      const e = p.explosions[i]
      m.visible = !!e
      if (!e) return
      const k = e.age / 0.6
      m.position.set(e.x, HAUT_SOL + 0.1 + k * 0.6, e.z)
      m.scale.setScalar(rayon * (0.6 + k * 1.6))
      m.material.opacity = 1 - k
    })
  })
  return (
    <>
      {Array.from({ length: MAX_BOMBES }, (_, i) => (
        <group key={i}>
          <group ref={(g) => (bombes.current[i] = g)} visible={false}>
            <Clone object={modele} scale={2.4} castShadow />
          </group>
          {/* zone d'impact */}
          <mesh ref={(m) => (cibles.current[i] = m)} rotation-x={-Math.PI / 2} visible={false}>
            <ringGeometry args={[0.85, 1, 32]} />
            <meshBasicMaterial color="#d62b1e" transparent depthWrite={false} />
          </mesh>
          <mesh ref={(m) => (explosions.current[i] = m)} rotation-x={-Math.PI / 2} visible={false}>
            <ringGeometry args={[0.5, 1, 32]} />
            <meshBasicMaterial color="#ffb02e" transparent depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export default function Arene({ partieRef }) {
  const modeles = {
    pierre: useModele('kenney-hex/stone.glb'),
    rocher: useModele('kenney-hex/stone-hill.glb'),
    cratere: useModele('kenney-hex/stone-mountain.glb'),
  }
  const tuiles = [...partieRef.current.tuiles.values()]

  return (
    <group>
      {tuiles.map((t) => (
        <Clone key={`${t.q},${t.r}`} object={modeles[t.type]} position={[t.x, 0, t.z]} scale={S} receiveShadow castShadow />
      ))}
      {/* lave au fond du cratère */}
      <mesh position-y={2.25}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 6]} />
        <meshBasicMaterial color="#ff6a1f" />
      </mesh>
      <pointLight position={[0, 3, 0]} color="#ff7a2e" intensity={8} distance={9} />
      <Coulee partieRef={partieRef} />
      <Pieces partieRef={partieRef} hauteur={HAUT_SOL} />
      <Bombes partieRef={partieRef} />

      {/* Plaine des Sables tout autour */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
        <circleGeometry args={[80, 32]} />
        <meshStandardMaterial color="#6b3f2e" />
      </mesh>
    </group>
  )
}
