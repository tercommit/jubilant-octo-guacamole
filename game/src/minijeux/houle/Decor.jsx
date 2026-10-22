// Décor des « Vagues de Boucan » : la plage, le lagon tout autour et les murs d'eau qui déferlent.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from './config.js'
import { xColonne, LARGEUR } from './logique.js'
import { Mer } from '../../commun/saut/decor.jsx'

const MAX_VAGUES = 6

function Vague({ partieRef, index }) {
  const groupe = useRef()
  const blocs = useRef([])
  useFrame(({ clock }) => {
    const v = partieRef.current.vagues[index]
    groupe.current.visible = !!v
    if (!v) return
    groupe.current.position.z = v.z
    blocs.current.forEach((b, i) => {
      const type = v.blocs[i]
      b.visible = type !== 'trou'
      if (type === 'trou') return
      const h = CONFIG.hauteurs[type]
      b.scale.y = h
      b.position.y = h / 2 + Math.sin(clock.elapsedTime * 4 + i) * 0.03
      b.children[0].material.color.set(type === 'bas' ? '#4fc3e0' : '#1f7fb8')
    })
  })
  return (
    <group ref={groupe} visible={false}>
      {Array.from({ length: CONFIG.colonnes }, (_, i) => (
        <group key={i} ref={(g) => (blocs.current[i] = g)} position-x={xColonne(i)}>
          <mesh castShadow>
            <boxGeometry args={[LARGEUR * 0.98, 1, CONFIG.epaisseur]} />
            <meshStandardMaterial color="#1f7fb8" flatShading transparent opacity={0.92} />
          </mesh>
          {/* écume */}
          <mesh position-y={0.5}>
            <boxGeometry args={[LARGEUR * 0.98, 0.06, CONFIG.epaisseur * 1.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function Decor({ partieRef }) {
  return (
    <group>
      <mesh position-y={-0.5} receiveShadow>
        <boxGeometry args={[CONFIG.demiLargeur * 2, 1, CONFIG.demiProfondeur * 2]} />
        <meshStandardMaterial color="#f1dcaa" flatShading />
      </mesh>
      {/* les vagues arrivent de la passe, au fond : un platier sous l'eau */}
      <mesh position={[0, -0.95, -8]} receiveShadow>
        <boxGeometry args={[CONFIG.demiLargeur * 2, 0.5, 6]} />
        <meshStandardMaterial color="#c9b98a" flatShading />
      </mesh>
      {Array.from({ length: MAX_VAGUES }, (_, i) => <Vague key={i} partieRef={partieRef} index={i} />)}
      <Mer y={-1.2} couleur="#2fa9c9" />
    </group>
  )
}
