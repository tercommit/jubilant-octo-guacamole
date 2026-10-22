// Décor des dalles de la Fournaise : trois étages de dalles hexagonales au-dessus d'un lac de lave.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONFIG } from './config.js'
import { etatDalle } from './logique.js'
import { Mer } from '../../commun/saut/decor.jsx'

const COULEURS = ['#f6c453', '#f08a4b', '#d9534f'] // étage du haut → étage du bas
const FISSURE = new THREE.Color('#fff4d6')
const RAYON = CONFIG.echelleTuile * 0.5774 * 0.94

function Etage({ partieRef, index }) {
  const ref = useRef()
  const dalles = useMemo(() => [...partieRef.current.etages[index].values()], [partieRef, index])
  const base = useMemo(() => new THREE.Color(COULEURS[index]), [index])
  const objet = useMemo(() => new THREE.Object3D(), [])
  const couleur = useMemo(() => new THREE.Color(), [])
  useEffect(() => {
    dalles.forEach((_, i) => ref.current.setColorAt(i, base))
    ref.current.instanceColor.needsUpdate = true
  }, [dalles, base])

  useFrame(({ clock }) => {
    const p = partieRef.current
    const m = ref.current
    dalles.forEach((d, i) => {
      const e = etatDalle(d, p.t)
      let y = CONFIG.etages[index] - 0.2, dx = 0, s = 1
      if (e === 'fissure') {
        // la dalle tremble et pâlit avant de tomber
        dx = Math.sin(clock.elapsedTime * 60 + i) * 0.05
        couleur.copy(base).lerp(FISSURE, (p.t - d.casse) / CONFIG.fissure)
        m.setColorAt(i, couleur)
      } else if (e === 'tombee') {
        const k = p.t - d.casse - CONFIG.fissure
        y -= k * k * 12
        s = k > 0.8 ? 0 : 1
      }
      objet.position.set(d.x + dx, y, d.z)
      objet.scale.setScalar(s)
      objet.updateMatrix()
      m.setMatrixAt(i, objet.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, dalles.length]} castShadow receiveShadow>
      <cylinderGeometry args={[RAYON, RAYON * 0.9, 0.4, 6]} />
      <meshStandardMaterial flatShading />
    </instancedMesh>
  )
}

export default function Decor({ partieRef }) {
  return (
    <group>
      {CONFIG.etages.map((_, i) => <Etage key={i} partieRef={partieRef} index={i} />)}
      <Mer y={CONFIG.chute + 0.5} couleur="#d9481c" emissive="#8a1f05" />
      {/* parois du cratère */}
      <mesh position-y={CONFIG.chute + 4}>
        <cylinderGeometry args={[16, 18, 10, 12, 1, true]} />
        <meshStandardMaterial color="#7a4a3a" flatShading side={THREE.BackSide} />
      </mesh>
      <pointLight position={[0, CONFIG.chute + 2, 0]} color="#ff7a2e" intensity={30} distance={14} />
    </group>
  )
}
