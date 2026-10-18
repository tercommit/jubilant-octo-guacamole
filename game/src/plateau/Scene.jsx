// Rendu 3D du plateau : l'île, les cases, la vanille, les pions et la caméra.
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar, useModele } from '../commun/modeles.jsx'
import { useAvatar } from '../commun/kit.js'
import { CASES, LIAISONS } from './carte.js'
import { joueurActif } from './logique.js'

const HAUT_CASE = 0.25
const TEX_KAYKIT = 'kaykit/hexagons_medieval-tropique.png'

// Contour d'île irrégulier mais stable
function contour(rx, rz, bosses) {
  const s = new THREE.Shape()
  const n = 28
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 1 + bosses * Math.sin(a * 3 + 1) * 0.6 + bosses * Math.cos(a * 5) * 0.4
    const x = rx * k * Math.sin(a), y = rz * k * Math.cos(a)
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y)
  }
  return s
}

function hasard(n) {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

// Arbres et rochers loin des cases
const DECORS = (() => {
  const liste = []
  for (let i = 0; liste.length < 55 && i < 600; i++) {
    const a = hasard(i) * Math.PI * 2, r = Math.sqrt(hasard(i + 50))
    const x = Math.sin(a) * 18.5 * r, z = Math.cos(a) * 13.5 * r
    if (CASES.some((c) => Math.hypot(c.x - x, c.z - z) < 2)) continue
    if (Math.hypot(x + 7, z - 1) < 3.5) continue // montagne
    liste.push({ x, z, modele: ['tree', 'tree-pine', 'tree', 'rocks'][Math.floor(hasard(i + 99) * 4)], rot: hasard(i + 7) * 6.3, echelle: 1.3 + hasard(i + 3) })
  }
  return liste
})()

export function Ile() {
  const terre = useMemo(() => new THREE.ExtrudeGeometry(contour(20, 14.5, 0.06), { depth: 1.2, bevelEnabled: false }), [])
  const sable = useMemo(() => new THREE.ExtrudeGeometry(contour(21.6, 16, 0.06), { depth: 1, bevelEnabled: false }), [])
  const modeles = {
    tree: useModele('kenney-platformer/tree.glb'),
    'tree-pine': useModele('kenney-platformer/tree-pine.glb'),
    rocks: useModele('kenney-platformer/rocks.glb'),
  }
  const montagne = useModele('kaykit/mountain_A_grass_trees.gltf', TEX_KAYKIT)
  const colline = useModele('kaykit/hills_A_trees.gltf', TEX_KAYKIT)

  return (
    <group>
      {/* L'extrusion part du plan XY : on la couche pour que son dessus soit à y = 0 */}
      <mesh geometry={terre} rotation-x={Math.PI / 2} receiveShadow>
        <meshStandardMaterial color="#6dbe45" flatShading />
      </mesh>
      <mesh geometry={sable} rotation-x={Math.PI / 2} position-y={-0.25} receiveShadow>
        <meshStandardMaterial color="#efd9a7" flatShading />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.6}>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial color="#2d9cc4" />
      </mesh>
      {/* lagon plus clair autour de l'île */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.55} scale={[1, 0.74, 1]}>
        <circleGeometry args={[27, 32]} />
        <meshStandardMaterial color="#5cc6d8" transparent opacity={0.8} />
      </mesh>

      {/* Piton des Neiges, au milieu de l'île, et collines autour du Chemin des Hauts */}
      <Clone object={montagne} position={[-7, 0, 1]} scale={4.2} />
      <Clone object={colline} position={[9, 0, -2]} scale={2.6} rotation-y={1} />
      <Clone object={colline} position={[-1, 0, -6]} scale={2.2} rotation-y={2.5} />

      {DECORS.map((d, i) => (
        <Clone key={i} object={modeles[d.modele]} position={[d.x, 0, d.z]} rotation-y={d.rot} scale={d.echelle} />
      ))}
    </group>
  )
}

const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true })
const MAT_CASE = {
  bleue: mat('#3C7DE2'),
  rouge: mat('#D9483B'),
  chance: mat('#8E5BD6'),
  cyclone: mat('#2BB3C0'),
  depart: mat('#F2B134'),
}
// Le rebord indique la zone : clair sur la côte, vert dans les Hauts
const MAT_BORD = { cote: mat('#f4e9d8'), hauts: mat('#7fc46a') }
const MAT_SYMBOLE = { blanc: new THREE.MeshBasicMaterial({ color: '#ffffff' }), jaune: new THREE.MeshBasicMaterial({ color: '#FFD84A' }) }

function etoile(branches, R, r) {
  const s = new THREE.Shape()
  for (let i = 0; i <= branches * 2; i++) {
    const a = (i / (branches * 2)) * Math.PI * 2, d = i % 2 ? r : R
    if (i === 0) s.moveTo(Math.sin(a) * d, Math.cos(a) * d); else s.lineTo(Math.sin(a) * d, Math.cos(a) * d)
  }
  return new THREE.ShapeGeometry(s)
}
const GEO_SYMBOLE = {
  barre: new THREE.BoxGeometry(0.75, 0.03, 0.2),
  etoile: etoile(5, 0.55, 0.24),
  arc: new THREE.RingGeometry(0.3, 0.42, 20, 1, 0, Math.PI * 1.4),
  arcPetit: new THREE.RingGeometry(0.1, 0.2, 16, 1, 0, Math.PI * 1.4),
}

/** Symbole posé sur la case : + bleue, − rouge, étoile chance, tourbillon cyclone (lisible sans les couleurs). */
function Symbole({ type }) {
  const y = HAUT_CASE + 0.03
  if (type === 'bleue' || type === 'rouge') return (
    <group position-y={y}>
      <mesh geometry={GEO_SYMBOLE.barre} material={MAT_SYMBOLE.blanc} />
      {type === 'bleue' && <mesh geometry={GEO_SYMBOLE.barre} material={MAT_SYMBOLE.blanc} rotation-y={Math.PI / 2} />}
    </group>
  )
  if (type === 'chance') return <mesh geometry={GEO_SYMBOLE.etoile} material={MAT_SYMBOLE.jaune} position-y={y} rotation-x={-Math.PI / 2} />
  if (type === 'cyclone') return (
    <group position-y={y} rotation-x={-Math.PI / 2}>
      <mesh geometry={GEO_SYMBOLE.arc} material={MAT_SYMBOLE.blanc} />
      <mesh geometry={GEO_SYMBOLE.arcPetit} material={MAT_SYMBOLE.blanc} rotation-z={Math.PI} />
    </group>
  )
  return null
}

export function Cases() {
  const liaisons = useMemo(() => LIAISONS.map(([a, b]) => {
    const A = CASES[a], B = CASES[b]
    return { x: (A.x + B.x) / 2, z: (A.z + B.z) / 2, l: Math.hypot(B.x - A.x, B.z - A.z), rot: Math.atan2(B.x - A.x, B.z - A.z) }
  }), [])
  return (
    <group>
      {liaisons.map((l, i) => (
        <mesh key={i} position={[l.x, 0.05, l.z]} rotation-y={l.rot} receiveShadow>
          <boxGeometry args={[0.5, 0.1, l.l]} />
          <meshStandardMaterial color="#d9c39a" flatShading />
        </mesh>
      ))}
      {CASES.map((c) => (
        <group key={c.id} position={[c.x, 0, c.z]}>
          <mesh position-y={HAUT_CASE / 2 - 0.02} material={MAT_BORD[c.zone]} receiveShadow castShadow>
            <cylinderGeometry args={[0.95, 1, HAUT_CASE - 0.04, 8]} />
          </mesh>
          <mesh position-y={HAUT_CASE - 0.01} material={MAT_CASE[c.type]} receiveShadow>
            <cylinderGeometry args={[0.78, 0.78, 0.04, 8]} />
          </mesh>
          <Symbole type={c.type} />
        </group>
      ))}
    </group>
  )
}

export function Vanille({ plateauRef }) {
  const groupe = useRef()
  const gousse = useRef()
  useFrame(({ clock }) => {
    const c = CASES[plateauRef.current.vanille]
    const t = clock.elapsedTime
    groupe.current.position.set(c.x, HAUT_CASE, c.z)
    gousse.current.rotation.y = t * 1.2
    gousse.current.position.y = 1.5 + Math.sin(t * 2.5) * 0.12
  })
  return (
    <group ref={groupe}>
      <group ref={gousse}>
        <mesh rotation-z={1.2} castShadow>
          <capsuleGeometry args={[0.13, 0.9, 4, 8]} />
          <meshStandardMaterial color="#4a2e1a" flatShading />
        </mesh>
        {/* fleur de vanille */}
        <mesh position={[0.45, 0.25, 0]}>
          <coneGeometry args={[0.2, 0.25, 5]} />
          <meshStandardMaterial color="#f3e7a0" flatShading />
        </mesh>
      </group>
      <mesh position-y={1.6}>
        <cylinderGeometry args={[0.2, 0.6, 3.2, 16, 1, true]} />
        <meshBasicMaterial color="#FFF3B0" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <ringGeometry args={[0.8, 1.05, 32]} />
        <meshBasicMaterial color="#FFE27A" />
      </mesh>
    </group>
  )
}

/** Position d'un pion : sur sa case (décalé si d'autres pions y sont) ou en plein saut. */
export function positionPion(p, index) {
  const j = p.joueurs[index]
  const actif = joueurActif(p)
  if (p.mouvement && actif?.index === index) {
    const A = CASES[p.mouvement.de], B = CASES[p.mouvement.vers]
    const t = Math.min(1, p.mouvement.t)
    return [A.x + (B.x - A.x) * t, HAUT_CASE + Math.sin(Math.PI * t) * 0.8, A.z + (B.z - A.z) * t]
  }
  const c = CASES[j.case]
  const ici = p.joueurs.filter((o) => o.case === j.case && !(p.mouvement && actif?.index === o.index))
  if (ici.length < 2) return [c.x, HAUT_CASE, c.z]
  const k = ici.indexOf(j)
  const a = (k / ici.length) * Math.PI * 2 + Math.PI / 4
  return [c.x + Math.sin(a) * 0.45, HAUT_CASE, c.z + Math.cos(a) * 0.45]
}

export function Pion({ plateauRef, index }) {
  const groupe = useRef()
  const anneau = useRef()
  const [anim, setAnim] = useState('Idle')
  const avatar = useAvatar(index)
  const j = plateauRef.current.joueurs[index]

  useFrame(({ clock }) => {
    const p = plateauRef.current
    const [x, y, z] = positionPion(p, index)
    groupe.current.position.set(x, y, z)
    const actif = joueurActif(p)?.index === index
    // le pion regarde vers la caméra, ou vers sa destination pendant un saut
    let angle = 0
    if (actif && p.mouvement) {
      const A = CASES[p.mouvement.de], B = CASES[p.mouvement.vers]
      angle = Math.atan2(B.x - A.x, B.z - A.z)
    }
    const cur = groupe.current.userData.angle ?? angle
    const d = Math.atan2(Math.sin(angle - cur), Math.cos(angle - cur))
    groupe.current.userData.angle = cur + d * 0.25
    groupe.current.children[0].rotation.y = groupe.current.userData.angle
    anneau.current.scale.setScalar(actif ? 1 + 0.12 * Math.sin(clock.elapsedTime * 6) : 1)

    let voulue = 'Idle'
    if (p.phase === 'fin') voulue = p.classement?.find((c) => c.joueur === index)?.place === 1 ? 'Victory' : 'Defeat'
    else if (actif && p.mouvement) voulue = 'Jump'
    if (voulue !== anim) setAnim(voulue)
  })

  return (
    <group ref={groupe}>
      <group>
        <Avatar avatar={avatar} animation={anim} />
      </group>
      <mesh ref={anneau} rotation-x={-Math.PI / 2} position-y={0.04}>
        <ringGeometry args={[0.38, 0.5, 32]} />
        <meshBasicMaterial color={j.couleur} />
      </mesh>
    </group>
  )
}

/** Flèches au-dessus des routes possibles à un embranchement ; la route choisie est en jaune. */
export function Fleches({ plateauRef }) {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const p = plateauRef.current
    const j = joueurActif(p)
    const opts = p.etape === 'choix' && j ? CASES[j.case].suivants : []
    refs.current.forEach((m, i) => {
      const id = opts[i]
      m.visible = id !== undefined
      if (!m.visible) return
      const c = CASES[j.case], s = CASES[id]
      const choisie = i === p.selection
      m.position.set(c.x + (s.x - c.x) * 0.55, 1.1 + (choisie ? Math.sin(clock.elapsedTime * 6) * 0.1 : 0), c.z + (s.z - c.z) * 0.55)
      // le cône pointe vers +y : on le couche dans la direction de la route
      m.rotation.set(0, Math.atan2(s.x - c.x, s.z - c.z), 0)
      m.children[0].material.color.set(choisie ? '#F2C230' : '#ffffff')
      m.scale.setScalar(choisie ? 1.25 : 1)
    })
  })
  return [0, 1].map((i) => (
    <group key={i} ref={(g) => (refs.current[i] = g)} visible={false}>
      <mesh rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.35, 0.8, 6]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  ))
}

/** Vue d'ensemble de l'île, ou gros plan sur le joueur qui joue. */
export function Camera({ plateauRef }) {
  const cible = useRef(new THREE.Vector3(0, 0, 0))
  const recul = useRef(1)
  const lumiere = useRef()

  useFrame(({ camera, size }, dt) => {
    const p = plateauRef.current
    const j = joueurActif(p)
    const aspect = size.width / size.height
    let vise = [0, 0, -0.5], r = Math.max(1, 1.45 / aspect) * 2.3
    if (j && p.etape !== null) {
      const [x, , z] = positionPion(p, j.index)
      vise = [x, 0, z]
      r = Math.max(1, 1.1 / aspect)
    }
    const k = Math.min(1, dt * 2.5)
    cible.current.lerp(new THREE.Vector3(...vise), k)
    recul.current += (r - recul.current) * k
    const c = cible.current
    camera.position.set(c.x, 9 * recul.current, c.z + 8 * recul.current)
    camera.lookAt(c.x, 0, c.z - 0.5)

    lumiere.current.position.set(c.x + 8, 20, c.z + 10)
    lumiere.current.target.position.copy(c)
    lumiere.current.target.updateMatrixWorld()
  })

  return (
    <directionalLight
      ref={lumiere} intensity={1.8} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-26} shadow-camera-right={26}
      shadow-camera-top={26} shadow-camera-bottom={-26} shadow-bias={-0.0005}
    />
  )
}
