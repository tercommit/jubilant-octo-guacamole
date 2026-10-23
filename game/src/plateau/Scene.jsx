// Rendu 3D du plateau : l'île (le relief de La Réunion) et ses villes, les cases, la vanille, les pions et la caméra.
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar, useModele } from '../commun/modeles.jsx'
import { useAvatar } from '../commun/kit.js'
import { CASES, LIAISONS, DEPART, RELIEF } from './carte.js'
import { geometrieIle, pointsTerre, altitude } from './ile.js'
import { joueurActif } from './logique.js'
import { Villes } from './Villes.jsx'
import { loinDesVilles } from './villes.js'

const HAUT_CASE = 0.25

function hasard(n) {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

// Arbres dans les bas et les forêts, rochers en altitude ; rien sur les cases, les chemins ni les villes
const DECORS = (() => {
  const pts = pointsTerre()
  const liste = []
  const loinDuPlateau = (x, z) => CASES.every((c) => Math.hypot(c.x - x, c.z - z) > 1.7) &&
    LIAISONS.every(([a, b]) => {
      const A = CASES[a], B = CASES[b], dx = B.x - A.x, dz = B.z - A.z
      const t = Math.min(1, Math.max(0, ((x - A.x) * dx + (z - A.z) * dz) / (dx * dx + dz * dz)))
      return Math.hypot(x - A.x - dx * t, z - A.z - dz * t) > 1
    })
  for (let i = 0; liste.length < 70 && i < 3000; i++) {
    const p = pts[Math.floor(hasard(i) * pts.length)]
    const m = altitude(p.y)
    if (m < 60 || m > 2400 || !loinDuPlateau(p.x, p.z) || !loinDesVilles(p.x, p.z, 0.4)) continue
    const modele = m > 1800 ? 'rocks' : ['tree', 'tree-pine', 'tree', 'tree-pine', 'rocks'][Math.floor(hasard(i + 99) * 5)]
    liste.push({ x: p.x, y: p.y - 0.05, z: p.z, modele, rot: hasard(i + 7) * 6.3, echelle: 0.45 + hasard(i + 3) * 0.35 })
  }
  return liste
})()

export function Ile() {
  const relief = useMemo(() => geometrieIle(RELIEF), [])
  const modeles = {
    tree: useModele('kenney-platformer/tree.glb'),
    'tree-pine': useModele('kenney-platformer/tree-pine.glb'),
    rocks: useModele('kenney-platformer/rocks.glb'),
  }

  return (
    <group>
      <mesh geometry={relief} receiveShadow castShadow>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>
      {/* la mer, transparente : le lagon clair près du rivage, le bleu profond au large */}
      <mesh rotation-x={-Math.PI / 2} position-y={0}>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial color="#2d9cc4" transparent opacity={0.55} roughness={0.3} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.21}>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial color="#1d6f96" />
      </mesh>

      {DECORS.map((d, i) => (
        <Clone key={i} object={modeles[d.modele]} position={[d.x, d.y, d.z]} rotation-y={d.rot} scale={d.echelle} />
      ))}
      <Villes />
    </group>
  )
}

const MAT_CASE = {
  cote: new THREE.MeshStandardMaterial({ color: '#3C7DE2', flatShading: true }),
  hauts: new THREE.MeshStandardMaterial({ color: '#2f9e5a', flatShading: true }),
  depart: new THREE.MeshStandardMaterial({ color: '#F2B134', flatShading: true }),
  bord: new THREE.MeshStandardMaterial({ color: '#f4e9d8', flatShading: true }),
}

export function Cases() {
  const liaisons = useMemo(() => LIAISONS.map(([a, b]) => {
    const A = CASES[a], B = CASES[b]
    const l = Math.hypot(B.x - A.x, B.z - A.z)
    return {
      x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2,
      l: Math.hypot(l, B.y - A.y), rot: Math.atan2(B.x - A.x, B.z - A.z), pente: -Math.atan2(B.y - A.y, l),
    }
  }), [])
  return (
    <group>
      {liaisons.map((l, i) => (
        <group key={i} position={[l.x, l.y + 0.05, l.z]} rotation-y={l.rot}>
          <mesh rotation-x={l.pente} receiveShadow>
            <boxGeometry args={[0.5, 0.1, l.l]} />
            <meshStandardMaterial color="#d9c39a" flatShading />
          </mesh>
        </group>
      ))}
      {CASES.map((c) => (
        <group key={c.id} position={[c.x, c.y, c.z]}>
          <mesh position-y={HAUT_CASE / 2 - 0.02} material={MAT_CASE.bord} receiveShadow castShadow>
            <cylinderGeometry args={[0.95, 1, HAUT_CASE - 0.04, 8]} />
          </mesh>
          <mesh position-y={HAUT_CASE - 0.01} material={c.id === DEPART ? MAT_CASE.depart : MAT_CASE[c.zone]} receiveShadow>
            <cylinderGeometry args={[0.78, 0.78, 0.04, 8]} />
          </mesh>
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
    groupe.current.position.set(c.x, c.y + HAUT_CASE, c.z)
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
    return [A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t + HAUT_CASE + Math.sin(Math.PI * t) * 0.8, A.z + (B.z - A.z) * t]
  }
  const c = CASES[j.case]
  const ici = p.joueurs.filter((o) => o.case === j.case && !(p.mouvement && actif?.index === o.index))
  if (ici.length < 2) return [c.x, c.y + HAUT_CASE, c.z]
  const k = ici.indexOf(j)
  const a = (k / ici.length) * Math.PI * 2 + Math.PI / 4
  return [c.x + Math.sin(a) * 0.45, c.y + HAUT_CASE, c.z + Math.cos(a) * 0.45]
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
      m.position.set(c.x + (s.x - c.x) * 0.55, c.y + (s.y - c.y) * 0.55 + 1.1 + (choisie ? Math.sin(clock.elapsedTime * 6) * 0.1 : 0), c.z + (s.z - c.z) * 0.55)
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
    let vise = [0, 0, 0.5], r = Math.max(1, 1.3 / aspect) * 2.5
    if (j && p.etape !== null) {
      const [x, y, z] = positionPion(p, j.index)
      vise = [x, y - HAUT_CASE, z]
      r = Math.max(1, 1.1 / aspect)
    }
    const k = Math.min(1, dt * 2.5)
    cible.current.lerp(new THREE.Vector3(...vise), k)
    recul.current += (r - recul.current) * k
    const c = cible.current
    camera.position.set(c.x, c.y + 9 * recul.current, c.z + 8 * recul.current)
    camera.lookAt(c.x, c.y, c.z - 0.5)

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
