// Décor de « Fruits péi » : seize dalles colorées sur le lagon, les fruits posés dessus, le fruit annoncé en grand.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from './config.js'
import { TYPES, hauteurDalle } from './logique.js'
import { Fruit } from '../../commun/saut/fruits.jsx'
import { Mer } from '../../commun/saut/decor.jsx'

const TEINTES = ['#ffd6e0', '#d6f0ff', '#e3ffd6', '#fff2c2']

function Dalle({ partieRef, index }) {
  const groupe = useRef()
  const fruits = useRef({})
  useFrame(({ clock }) => {
    const p = partieRef.current
    const d = p.dalles[index]
    groupe.current.position.set(d.x, hauteurDalle(p, d), d.z)
    const visible = p.phase !== 'jeu' ? false : p.etape === 'montre' || p.etape === 'chute'
    for (const t of TYPES) {
      const f = fruits.current[t]
      f.visible = visible && d.fruit === t
      f.rotation.y = clock.elapsedTime * 1.5 + index
      f.position.y = 0.2 + Math.sin(clock.elapsedTime * 3 + index) * 0.06
    }
  })
  return (
    <group ref={groupe}>
      <mesh position-y={-0.25} receiveShadow castShadow>
        <boxGeometry args={[CONFIG.taille, 0.5, CONFIG.taille]} />
        <meshStandardMaterial color={TEINTES[index % 4]} flatShading />
      </mesh>
      {TYPES.map((t) => <Fruit key={t} type={t} ref={(g) => (fruits.current[t] = g)} scale={1.6} visible={false} />)}
    </group>
  )
}

/** Le fruit annoncé tourne en grand au-dessus des dalles. */
function Annonce({ partieRef }) {
  const groupe = useRef()
  const fruits = useRef({})
  useFrame(({ clock }) => {
    const p = partieRef.current
    const visible = p.phase === 'jeu' && (p.etape === 'annonce' || p.etape === 'chute')
    groupe.current.rotation.y = clock.elapsedTime
    groupe.current.position.y = 6 + Math.sin(clock.elapsedTime * 2) * 0.3
    for (const t of TYPES) fruits.current[t].visible = visible && p.cible === t
  })
  return (
    <group ref={groupe} position={[0, 6, -9]}>
      {TYPES.map((t) => <Fruit key={t} type={t} ref={(g) => (fruits.current[t] = g)} scale={5} visible={false} />)}
    </group>
  )
}

export default function Decor({ partieRef }) {
  return (
    <group>
      {partieRef.current.dalles.map((_, i) => <Dalle key={i} partieRef={partieRef} index={i} />)}
      <Annonce partieRef={partieRef} />
      <Mer y={-1.5} couleur="#3fb8cf" />
    </group>
  )
}
