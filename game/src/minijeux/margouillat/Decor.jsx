// Décor de « La queue du margouillat » : l'île à plateformes, et une queue verte qui frétille derrière chaque porteur.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ILE } from '../../commun/saut/ile.js'
import { Ile } from '../../commun/saut/decor.jsx'

const ARBRES = [[-7.2, 3, 'tree-pine', 1.6], [7.4, 2, 'tree', 1.6], [-4, -7.2, 'tree', 1.4], [4.2, -7, 'tree-pine', 1.5], [5.6, 6, 'tree-pine', 1.4], [-5.8, 6, 'tree', 1.4]]

function Queue({ partieRef, index }) {
  const groupe = useRef()
  const queue = useRef()
  useFrame(({ clock }) => {
    const j = partieRef.current.joueurs[index]
    groupe.current.visible = j.queue && !j.horsJeu
    groupe.current.position.set(j.x, j.y, j.z)
    groupe.current.rotation.y = j.angle
    queue.current.rotation.y = Math.sin(clock.elapsedTime * (j.vitesse > 0.1 ? 14 : 5)) * 0.5
    // une queue qu'on vient d'attraper clignote : on ne peut pas la reprendre tout de suite
    queue.current.visible = !(j.protegeQueue > 0) || Math.floor(clock.elapsedTime * 10) % 2 === 0
  })
  return (
    <group ref={groupe} visible={false}>
      <group ref={queue} position={[0, 0.45, -0.25]}>
        <mesh position-z={-0.45} rotation-x={-Math.PI / 2 - 0.25} castShadow>
          <coneGeometry args={[0.13, 0.95, 6]} />
          <meshStandardMaterial color="#5fc24a" emissive="#1f5a12" emissiveIntensity={0.5} flatShading />
        </mesh>
      </group>
    </group>
  )
}

export default function Decor({ partieRef }) {
  return (
    <group>
      <Ile ILE={ILE} arbres={ARBRES} />
      {partieRef.current.joueurs.map((_, i) => <Queue key={i} partieRef={partieRef} index={i} />)}
    </group>
  )
}
