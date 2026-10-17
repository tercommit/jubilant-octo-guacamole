// Éléments animés de la scène : joueurs, obstacles, effets, caméra qui suit le peloton.
import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar, useModele } from '../../commun/modeles.jsx'
import { useAvatar } from '../../commun/kit.js'
import { animationLutte } from '../../commun/lutte.js'
import { CONFIG } from './config.js'
import { CANNES, MOBILES, PICS, Z_DEPART, Z_ARRIVEE, xMobile, angleCanne, etatPic } from './piste.js'
import { Bloc } from './Piste.jsx'

export function Joueur({ partieRef, index }) {
  const groupe = useRef()
  const [anim, setAnim] = useState('Idle')
  const avatar = useAvatar(index)
  const j = partieRef.current.joueurs[index]

  useFrame(({ clock }) => {
    const p = partieRef.current
    const jj = p.joueurs[index]
    groupe.current.position.set(jj.x, jj.y, jj.z)
    // clignote quand il est invincible, disparaît pendant la chute
    groupe.current.visible = jj.tombe === 0 && (jj.invincible === 0 || Math.floor(clock.elapsedTime * 12) % 2 === 0)
    // rotation lissée vers l'angle cible
    const cible = jj.angle
    const cur = groupe.current.userData.angle ?? cible
    let d = cible - cur
    d = Math.atan2(Math.sin(d), Math.cos(d))
    const a = cur + d * 0.3
    groupe.current.userData.angle = a
    groupe.current.children[0].rotation.y = a

    let voulue = 'Idle'
    if (p.phase === 'fin') voulue = p.classement?.find((c) => c.joueur === index)?.place === 1 ? 'Victory' : 'Defeat'
    else if (jj.arrive !== null) voulue = 'Victory'
    else if (animationLutte(jj)) voulue = animationLutte(jj)
    else if (jj.etourdi > 0) voulue = 'RecieveHit'
    else if (!jj.sol) voulue = 'Jump'
    else if (p.phase === 'jeu' && jj.vitesse > 0.1) voulue = 'Run'
    if (voulue !== anim) setAnim(voulue)
  })

  return (
    <group ref={groupe}>
      <group>
        <Avatar avatar={avatar} animation={anim} />
      </group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <ringGeometry args={[0.42, 0.55, 32]} />
        <meshBasicMaterial color={j.couleur} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

/** Tige de canne à sucre : tronçons verts et jaunes séparés par des nœuds. */
function Canne() {
  const L = CONFIG.cannes.demiLongueur * 2
  const n = 10
  return (
    <group rotation-z={Math.PI / 2}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position-y={-L / 2 + (i + 0.5) * (L / n)} castShadow>
          <cylinderGeometry args={[CONFIG.cannes.rayon, CONFIG.cannes.rayon, L / n - 0.04, 7]} />
          <meshStandardMaterial color={i % 2 ? '#c8b44a' : '#9db83c'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function Cannes({ partieRef }) {
  const refs = useRef([])
  useFrame(() => {
    const t = partieRef.current.t
    CANNES.forEach((c, i) => { refs.current[i].rotation.y = -angleCanne(c, t) })
  })
  return CANNES.map((c, i) => (
    <group key={i} position={[c.x, 0, c.z]}>
      <group ref={(g) => (refs.current[i] = g)} position-y={0.35}>
        <Canne />
      </group>
      {/* moyeu */}
      <mesh position-y={0.3} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.6, 8]} />
        <meshStandardMaterial color="#6b4a2e" flatShading />
      </mesh>
    </group>
  ))
}

const BOIS = new THREE.MeshStandardMaterial({ color: '#b07a45', flatShading: true })
const BOIS_FONCE = new THREE.MeshStandardMaterial({ color: '#7a5030', flatShading: true })

export function Mobiles({ partieRef }) {
  const refs = useRef([])
  useFrame(() => {
    const t = partieRef.current.t
    MOBILES.forEach((m, i) => { refs.current[i].position.x = xMobile(m, t) })
  })
  return MOBILES.map((m, i) => (
    <group key={i} ref={(g) => (refs.current[i] = g)} position={[m.x, 0, 0]}>
      <Bloc x={0} z={m.z} l={m.l} p={m.p} epaisseur={0.3} herbe={BOIS} terre={BOIS_FONCE} />
    </group>
  ))
}

export function Pics({ partieRef }) {
  const modele = useModele('kenney-platformer/trap-spikes-large.glb')
  const refs = useRef([])
  useFrame((_, dt) => {
    const t = partieRef.current.t
    const h = CONFIG.pics.hauteur
    PICS.forEach((c, i) => {
      const e = etatPic(c, t)
      const cible = e === 'sortis' ? 0 : e === 'alerte' ? -h * 0.6 : -h - 0.05
      const g = refs.current[i]
      g.position.y += (cible - g.position.y) * Math.min(1, dt * 25)
    })
  })
  return PICS.map((c, i) => (
    <group key={i} position={[c.x, 0, c.z]}>
      <group ref={(g) => (refs.current[i] = g)}>
        <Clone object={modele} scale={[1.3, 1.6, 1.55]} />
      </group>
      {/* trappe au sol, toujours visible */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.012}>
        <planeGeometry args={[c.l - 0.08, c.p - 0.08]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
    </group>
  ))
}

const MAX_ROCHES = 24

export function Roches({ partieRef }) {
  const pool = useRef([])
  const R = CONFIG.roches.rayon
  useFrame(() => {
    const roches = partieRef.current.roches
    pool.current.forEach((m, i) => {
      const ro = roches[i]
      m.visible = !!ro
      if (!ro) return
      m.position.set(ro.x, R, ro.z)
      m.rotation.set(ro.z / R, ro.id, 0)
    })
  })
  return Array.from({ length: MAX_ROCHES }, (_, i) => (
    <mesh key={i} ref={(m) => (pool.current[i] = m)} visible={false} castShadow>
      <dodecahedronGeometry args={[R, 0]} />
      <meshStandardMaterial color="#3b3a40" flatShading />
    </mesh>
  ))
}

/** Onde de couleur (arrivée) ou étoiles blanches (choc). `effetsRef.current` : [{x, z, couleur, t0}] */
export function Effets({ effetsRef }) {
  const pool = useRef([])
  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    effetsRef.current = effetsRef.current.filter((e) => now - (e.t0 ??= now) < 0.6)
    pool.current.forEach((m, i) => {
      const e = effetsRef.current[i]
      m.visible = !!e
      if (!e) return
      const k = (now - e.t0) / 0.6
      m.position.set(e.x, 0.05 + k * 0.8, e.z)
      m.scale.setScalar(0.5 + k * 2.5)
      m.material.opacity = 1 - k
      m.material.color.set(e.couleur)
    })
  })
  return Array.from({ length: 8 }, (_, i) => (
    <mesh key={i} ref={(m) => (pool.current[i] = m)} rotation-x={-Math.PI / 2} visible={false}>
      <ringGeometry args={[0.6, 0.8, 32]} />
      <meshBasicMaterial transparent depthWrite={false} />
    </mesh>
  ))
}

/**
 * Caméra derrière le peloton : elle vise le milieu des coureurs encore en course et recule quand ils s'étalent.
 * La lumière (et son ombre) suit la caméra.
 */
export function Camera({ partieRef }) {
  const { camera, size } = useThree()
  const lumiere = useRef()
  const etat = useRef({ z: Z_DEPART - 4, recul: 1 })

  useFrame((_, dt) => {
    const p = partieRef.current
    const enCourse = p.joueurs.filter((j) => j.arrive === null)
    const zs = (enCourse.length ? enCourse : p.joueurs).map((j) => j.z)
    const zMin = Math.min(...zs), zMax = Math.max(...zs)
    const aspect = size.width / size.height
    const cibleZ = Math.max(Z_ARRIVEE + 3, Math.min(Z_DEPART - 4, (zMin + zMax) / 2 - 2))
    const cibleRecul = Math.max(1, 1.25 / aspect) * (1 + Math.min(1, (zMax - zMin) / 22) * 0.6)
    const k = Math.min(1, dt * 3)
    const e = etat.current
    e.z += (cibleZ - e.z) * k
    e.recul += (cibleRecul - e.recul) * k

    camera.position.set(0, 11 * e.recul, e.z + 9 * e.recul)
    camera.fov = 45
    camera.far = 300
    camera.lookAt(0, 0, e.z - 1.5)
    camera.updateProjectionMatrix()

    const l = lumiere.current
    l.position.set(6, 16, e.z + 8)
    l.target.position.set(0, 0, e.z - 2)
    l.target.updateMatrixWorld()
  })

  return (
    <directionalLight
      ref={lumiere} intensity={1.8} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14}
      shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-0.0005}
    />
  )
}
