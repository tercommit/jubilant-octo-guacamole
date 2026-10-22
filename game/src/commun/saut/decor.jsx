// Éléments de décor communs aux mini-jeux « à la Fall Guys » : mer, ligne d'arrivée.
import { Clone } from '@react-three/drei'
import { useModele } from '../modeles.jsx'

/** Grande étendue d'eau (ou de lave) sous l'arène. */
export function Mer({ y = -2.5, couleur = '#2d9cc4', emissive }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color={couleur} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.8 : 0} roughness={0.4} />
    </mesh>
  )
}

/** Ligne d'arrivée en damier à z, entre deux drapeaux. */
export function Arrivee({ z, demiLargeur, y = 0 }) {
  const drapeau = useModele('kenney-platformer/flag.glb')
  const cases = Math.round(demiLargeur * 2 / 0.5)
  return (
    <group position={[0, y, z]}>
      {Array.from({ length: cases * 2 }, (_, i) => {
        const col = i % cases, rang = Math.floor(i / cases)
        return (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[-demiLargeur + 0.25 + col * 0.5, 0.02, -0.25 + rang * 0.5]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial color={(col + rang) % 2 ? '#1f2a37' : '#ffffff'} />
          </mesh>
        )
      })}
      <Clone object={drapeau} position={[-demiLargeur - 0.3, 0, 0]} scale={2} />
      <Clone object={drapeau} position={[demiLargeur + 0.3, 0, 0]} scale={2} />
    </group>
  )
}

/** L'île à plateformes de commun/saut/ile.js : sable, herbe, rochers plats et quelques arbres. */
export function Ile({ ILE, arbres = [] }) {
  const modeles = {
    tree: useModele('kenney-platformer/tree.glb'),
    'tree-pine': useModele('kenney-platformer/tree-pine.glb'),
  }
  return (
    <group>
      <mesh position-y={-0.6} receiveShadow>
        <cylinderGeometry args={[ILE.rayon + 0.6, ILE.rayon + 1.2, 1.2, 28]} />
        <meshStandardMaterial color="#efd9a7" flatShading />
      </mesh>
      <mesh position-y={-0.48} receiveShadow>
        <cylinderGeometry args={[ILE.rayon - 0.9, ILE.rayon - 0.9, 1, 28]} />
        <meshStandardMaterial color="#6dbe45" flatShading />
      </mesh>
      {ILE.plateformes.map((pl, i) => (
        <mesh key={i} position={[pl.x, pl.h / 2, pl.z]} castShadow receiveShadow>
          <cylinderGeometry args={[pl.r, pl.r * 1.08, pl.h, 9]} />
          <meshStandardMaterial color="#8d8a94" flatShading />
        </mesh>
      ))}
      {arbres.map(([x, z, modele, echelle], i) => (
        <Clone key={i} object={modeles[modele]} position={[x, 0, z]} scale={echelle} />
      ))}
      <Mer y={-0.9} couleur="#3fb8cf" />
    </group>
  )
}
