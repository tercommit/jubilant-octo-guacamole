// Décor fixe de la piste : sols, galets, berges, arbres, départ, arrivée et volcan au loin.
import { useMemo } from 'react'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import { useModele } from '../../commun/modeles.jsx'
import { SOLS, GALETS, Z_ARRIVEE, Z_DEPART } from './piste.js'

const HERBE = new THREE.MeshStandardMaterial({ color: '#6dbe45', flatShading: true })
const TERRE = new THREE.MeshStandardMaterial({ color: '#8a5a3b', flatShading: true })
const BERGE = new THREE.MeshStandardMaterial({ color: '#4f9a3a', flatShading: true })
const BASALTE = new THREE.MeshStandardMaterial({ color: '#4a4a52', flatShading: true })

/** Bloc de terre recouvert d'herbe, dessus à y = haut. */
export function Bloc({ x, z, l, p, haut = 0, epaisseur = 1.4, herbe = HERBE, terre = TERRE }) {
  return (
    <group position={[x, haut, z]}>
      <mesh position-y={-0.1} material={herbe} receiveShadow castShadow>
        <boxGeometry args={[l, 0.2, p]} />
      </mesh>
      <mesh position-y={-0.2 - epaisseur / 2} material={terre} receiveShadow>
        <boxGeometry args={[l - 0.06, epaisseur, p - 0.06]} />
      </mesh>
    </group>
  )
}

function textureDamier(colonnes, lignes) {
  const c = document.createElement('canvas')
  c.width = colonnes * 8
  c.height = lignes * 8
  const g = c.getContext('2d')
  for (let i = 0; i < colonnes; i++) {
    for (let j = 0; j < lignes; j++) {
      g.fillStyle = (i + j) % 2 ? '#1f2a37' : '#ffffff'
      g.fillRect(i * 8, j * 8, 8, 8)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Arrivee() {
  const drapeau = useModele('kenney-platformer/flag.glb')
  const sol = useMemo(() => textureDamier(16, 2), [])
  const banniere = useMemo(() => textureDamier(24, 2), [])
  return (
    <group position-z={Z_ARRIVEE}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow>
        <planeGeometry args={[8, 1]} />
        <meshStandardMaterial map={sol} />
      </mesh>
      {[-4.3, 4.3].map((x) => (
        <group key={x} position-x={x}>
          <mesh position-y={1.6} castShadow>
            <boxGeometry args={[0.3, 3.2, 0.3]} />
            <meshStandardMaterial color="#c9372c" flatShading />
          </mesh>
          <Clone object={drapeau} position-y={3.2} scale={1.2} />
        </group>
      ))}
      <mesh position-y={3} castShadow>
        <boxGeometry args={[8.9, 0.6, 0.12]} />
        <meshStandardMaterial map={banniere} />
      </mesh>
    </group>
  )
}

// Décors posés sur les berges, de façon pseudo-aléatoire mais stable
function hasard(n) {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}
const PLANTES = Array.from({ length: 70 }, (_, i) => {
  const cote = i % 2 ? 1 : -1
  return {
    modele: ['tree', 'tree-pine', 'tree', 'rocks', 'grass', 'flowers'][Math.floor(hasard(i) * 6)],
    x: cote * (5.2 + hasard(i + 100) * 6),
    z: 4 - (i / 70) * 90 + hasard(i + 200) * 1.2,
    rot: hasard(i + 300) * Math.PI * 2,
    echelle: 1.4 + hasard(i + 400) * 1.2,
  }
})

export default function Piste() {
  const modeles = {
    tree: useModele('kenney-platformer/tree.glb'),
    'tree-pine': useModele('kenney-platformer/tree-pine.glb'),
    rocks: useModele('kenney-platformer/rocks.glb'),
    grass: useModele('kenney-platformer/grass.glb'),
    flowers: useModele('kenney-platformer/flowers.glb'),
  }

  return (
    <group>
      {SOLS.map((s, i) => <Bloc key={i} {...s} />)}
      {GALETS.map((g, i) => <Bloc key={i} {...g} herbe={BASALTE} terre={BASALTE} epaisseur={1.2} />)}
      {/* Remblai derrière la ligne de départ */}
      <Bloc x={0} z={5} l={8} p={6} />

      {/* Berges surélevées de chaque côté : elles bordent la piste sur toute sa longueur */}
      {[-1, 1].map((c) => (
        <Bloc key={c} x={c * 10.2} z={-38} l={12} p={96} haut={0.6} epaisseur={2.6} herbe={BERGE} />
      ))}
      {PLANTES.map((d, i) => (
        <Clone key={i} object={modeles[d.modele]} position={[d.x, 0.6, d.z]} rotation-y={d.rot} scale={d.echelle} />
      ))}

      {/* Eau de la ravine */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.5, -38]}>
        <planeGeometry args={[12, 100]} />
        <meshStandardMaterial color="#3a9fc6" transparent opacity={0.9} />
      </mesh>

      {/* Ligne de départ */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, Z_DEPART - 1]}>
        <planeGeometry args={[8, 0.25]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <Arrivee />

      {/* Le Piton de la Fournaise au loin */}
      <group position={[6, -2, -125]}>
        <mesh>
          <cylinderGeometry args={[6, 34, 26, 9]} />
          <meshStandardMaterial color="#7a5a4a" flatShading />
        </mesh>
        <mesh position-y={13.2}>
          <cylinderGeometry args={[4.5, 6, 0.6, 9]} />
          <meshBasicMaterial color="#ff6a2b" />
        </mesh>
      </group>
    </group>
  )
}
