// Décor du « Moulin à cannes » : trois rouleaux en lattes, avec leurs trous, au-dessus d'une cuve de vesou.
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONFIG } from './config.js'
import { rotation } from './logique.js'
import { Mer } from '../../commun/saut/decor.jsx'

const { rayon: R, lattes: N, largeur: L } = CONFIG
const COULEURS = ['#c98f4a', '#e2b36a']

function Rouleau({ partieRef, index }) {
  const groupe = useRef()
  const lattes = useRef()
  const r = CONFIG.rouleaux[index]
  useEffect(() => {
    const manque = partieRef.current.manque[index]
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    for (let k = 0; k < N * 2; k++) {
      // la latte k couvre l'angle [latte, latte + 1] × 2π/N à partir du sommet (dans le sens de z croissant)
      const a = (Math.floor(k / 2) + 0.5) * ((2 * Math.PI) / N)
      o.position.set((k % 2 ? 0.25 : -0.25) * L, Math.cos(a) * (R - 0.15), Math.sin(a) * (R - 0.15))
      o.rotation.set(a, 0, 0)
      o.scale.set(manque[k] ? 0 : 1, 1, 1)
      o.updateMatrix()
      lattes.current.setMatrixAt(k, o.matrix)
      lattes.current.setColorAt(k, c.set(COULEURS[Math.floor(k / 2) % 2]))
    }
    lattes.current.instanceMatrix.needsUpdate = true
    lattes.current.instanceColor.needsUpdate = true
  }, [partieRef, index])
  useFrame(() => {
    // dans la logique, la rotation fait avancer la surface vers les z croissants : c'est un angle x positif ici
    groupe.current.rotation.x = rotation(r, partieRef.current.t)
  })
  return (
    <group position={[r.x, -R, 0]}>
      <group ref={groupe}>
        <instancedMesh ref={lattes} args={[null, null, N * 2]} castShadow receiveShadow>
          <boxGeometry args={[L / 2 * 0.97, 0.3, 2 * R * Math.sin(Math.PI / N) * 0.96]} />
          <meshStandardMaterial flatShading />
        </instancedMesh>
        {/* flasques en bout de rouleau */}
        {[-1, 1].map((s) => (
          <mesh key={s} position-x={(s * L) / 2} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[R * 0.7, R * 0.7, 0.15, 12]} />
            <meshStandardMaterial color="#6b4a2e" flatShading />
          </mesh>
        ))}
      </group>
      {/* axe */}
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.6, 0.6, L + 0.6, 10]} />
        <meshStandardMaterial color="#4a4a52" flatShading />
      </mesh>
    </group>
  )
}

export default function Decor({ partieRef }) {
  return (
    <group>
      {CONFIG.rouleaux.map((_, i) => <Rouleau key={i} partieRef={partieRef} index={i} />)}
      <Mer y={-6} couleur="#c9a646" />
    </group>
  )
}
