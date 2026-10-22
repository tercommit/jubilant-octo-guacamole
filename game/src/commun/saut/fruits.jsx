// Fruits péi en low poly (formes simples), pour les mini-jeux.
export const FRUITS = {
  letchi: { nom: 'Letchi', couleur: '#c8323c' },
  mangue: { nom: 'Mangue', couleur: '#f5a623' },
  ananas: { nom: 'Ananas', couleur: '#f2c230' },
  banane: { nom: 'Banane', couleur: '#f7d94c' },
  coco: { nom: 'Coco', couleur: '#7a4e2d' },
}

export function Fruit({ type, ...props }) {
  const c = FRUITS[type].couleur
  return (
    <group {...props}>
      {type === 'letchi' && (
        <>
          <mesh position-y={0.32} castShadow><icosahedronGeometry args={[0.32, 1]} /><meshStandardMaterial color={c} flatShading /></mesh>
          <mesh position-y={0.66}><cylinderGeometry args={[0.03, 0.03, 0.12, 5]} /><meshStandardMaterial color="#5b3a1e" /></mesh>
        </>
      )}
      {type === 'mangue' && (
        <mesh position-y={0.34} scale={[0.8, 1, 0.65]} rotation-z={0.4} castShadow>
          <sphereGeometry args={[0.38, 8, 6]} /><meshStandardMaterial color={c} flatShading />
        </mesh>
      )}
      {type === 'ananas' && (
        <>
          <mesh position-y={0.32} castShadow><cylinderGeometry args={[0.24, 0.28, 0.6, 8]} /><meshStandardMaterial color={c} flatShading /></mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position-y={0.78} rotation={[0.35, (i / 5) * Math.PI * 2, 0]}>
              <coneGeometry args={[0.08, 0.42, 4]} /><meshStandardMaterial color="#3f8a35" flatShading />
            </mesh>
          ))}
        </>
      )}
      {type === 'banane' && (
        <mesh position-y={0.42} rotation-z={Math.PI / 2} castShadow>
          <torusGeometry args={[0.36, 0.11, 6, 10, Math.PI * 0.8]} /><meshStandardMaterial color={c} flatShading />
        </mesh>
      )}
      {type === 'coco' && (
        <mesh position-y={0.34} castShadow><dodecahedronGeometry args={[0.34, 0]} /><meshStandardMaterial color={c} flatShading /></mesh>
      )}
    </group>
  )
}
