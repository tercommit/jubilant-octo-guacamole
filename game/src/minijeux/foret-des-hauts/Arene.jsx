// Décor du cirque : tuiles Kenney recolorées en vert tropical + remparts KayKit.
import { Clone } from '@react-three/drei'
import { useModele } from '../../commun/modeles.jsx'
import { TUILES, versMonde, HAUT_SOL } from './carte.js'
import { CONFIG } from './config.js'

const TEX_KENNEY = 'kenney-hex/Textures/colormap-tropique.png'
const TEX_KAYKIT = 'kaykit/hexagons_medieval-tropique.png'
const FICHIER_TUILE = { herbe: 'grass', foret: 'grass-forest', riviere: 'river-straight', pont: 'bridge', rempart: 'grass' }

export default function Arene() {
  const tuiles = {
    grass: useModele('kenney-hex/grass.glb', TEX_KENNEY),
    'grass-forest': useModele('kenney-hex/grass-forest.glb', TEX_KENNEY),
    'river-straight': useModele('kenney-hex/river-straight.glb', TEX_KENNEY),
    bridge: useModele('kenney-hex/bridge.glb', TEX_KENNEY),
  }
  const decors = {
    mountain_A_grass_trees: useModele('kaykit/mountain_A_grass_trees.gltf', TEX_KAYKIT),
    mountain_B_grass_trees: useModele('kaykit/mountain_B_grass_trees.gltf', TEX_KAYKIT),
    hills_A_trees: useModele('kaykit/hills_A_trees.gltf', TEX_KAYKIT),
    trees_B_medium: useModele('kaykit/trees_B_medium.gltf', TEX_KAYKIT),
  }
  const S = CONFIG.echelleTuile

  return (
    <group>
      {[...TUILES.values()].map((t) => {
        const [x, z] = versMonde(t.q, t.r)
        // Rotation pseudo-aléatoire mais stable des décors, pour casser la répétition
        const rot = (((t.q * 7 + t.r * 13) % 6) + 6) % 6 * (Math.PI / 3)
        return (
          <group key={`${t.q},${t.r}`} position={[x, 0, z]}>
            <Clone object={tuiles[FICHIER_TUILE[t.type]]} scale={S} receiveShadow castShadow rotation-y={t.type === 'foret' ? rot : 0} />
            {t.decor && <Clone object={decors[t.decor]} castShadow receiveShadow position-y={HAUT_SOL} rotation-y={rot} />}
          </group>
        )
      })}
      {/* Socle sombre sous l'arène */}
      <mesh position={[0, -0.6, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[13, 6]} />
        <meshStandardMaterial color="#2c4a2f" />
      </mesh>
    </group>
  )
}
