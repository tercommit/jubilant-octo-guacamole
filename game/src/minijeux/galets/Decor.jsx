// Décor des « Galets traîtres » : une ravine, ses berges et la grille de galets (vrais et faux, identiques).
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONFIG } from './config.js'
import { PISTE, ZFIN_GALETS, etatGalet } from './logique.js'
import { Mer, Arrivee } from '../../commun/saut/decor.jsx'

function Galets({ partieRef }) {
  const ref = useRef()
  const galets = partieRef.current.galets
  const objet = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => {
    const p = partieRef.current
    galets.forEach((g, i) => {
      const e = etatGalet(g, p.t)
      let y = -0.18, dx = 0
      if (e === 'tremble') dx = Math.sin(clock.elapsedTime * 70 + i) * 0.06
      if (e === 'coule') y -= Math.min(4, (p.t - g.pose - CONFIG.tremble) * 6)
      objet.position.set(g.x + dx, y, g.z)
      objet.rotation.y = (i * 0.7) % 0.4
      objet.scale.set(1, 1, 1)
      objet.updateMatrix()
      ref.current.setMatrixAt(i, objet.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, galets.length]} castShadow receiveShadow>
      <cylinderGeometry args={[CONFIG.taille * 0.62, CONFIG.taille * 0.68, 0.36, 7]} />
      <meshStandardMaterial color="#9a9aa3" flatShading />
    </instancedMesh>
  )
}

function Berge({ z1, z2 }) {
  return (
    <mesh position={[0, -0.5, (z1 + z2) / 2]} receiveShadow>
      <boxGeometry args={[CONFIG.demiLargeur * 2, 1, Math.abs(z1 - z2)]} />
      <meshStandardMaterial color="#7fb24a" flatShading />
    </mesh>
  )
}

export default function Decor({ partieRef }) {
  const debut = CONFIG.premiereRangee + CONFIG.taille / 2
  return (
    <group>
      <Berge z1={3} z2={debut} />
      <Berge z1={ZFIN_GALETS} z2={PISTE.zArrivee - 4} />
      <Arrivee z={PISTE.zArrivee} demiLargeur={CONFIG.demiLargeur} />
      <Galets partieRef={partieRef} />
      {/* parois de la ravine */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (CONFIG.demiLargeur + 1.5), 0, (3 + PISTE.zArrivee - 4) / 2]} receiveShadow>
          <boxGeometry args={[3, 6, 3 - PISTE.zArrivee + 4]} />
          <meshStandardMaterial color="#6e5a48" flatShading />
        </mesh>
      ))}
      <Mer y={-2.2} couleur="#4aa3b5" />
    </group>
  )
}
