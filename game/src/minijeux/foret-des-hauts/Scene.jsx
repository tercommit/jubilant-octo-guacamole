// Éléments animés de la scène : joueurs, balise, effets de prise.
import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar, useModele } from '../../commun/modeles.jsx'
import { CONFIG } from './config.js'
import { HAUT_SOL } from './carte.js'

export function Joueur({ partieRef, index }) {
  const groupe = useRef()
  const jauge = useRef()
  const anneau = useRef()
  const [anim, setAnim] = useState('Idle')
  const j = partieRef.current.joueurs[index]
  const totalRecharge = CONFIG.sprint.duree + CONFIG.sprint.recharge

  useFrame(() => {
    const p = partieRef.current
    const jj = p.joueurs[index]
    groupe.current.position.set(jj.x, jj.y, jj.z)
    // rotation lissée vers l'angle cible
    const cible = jj.angle
    const cur = groupe.current.userData.angle ?? cible
    let d = cible - cur
    d = Math.atan2(Math.sin(d), Math.cos(d))
    const a = cur + d * 0.3
    groupe.current.userData.angle = a
    groupe.current.children[0].rotation.y = a

    const charge = 1 - jj.recharge / totalRecharge
    jauge.current.scale.setScalar(Math.max(0.001, charge))
    anneau.current.material.opacity = jj.sprint > 0 ? 1 : 0.85

    let voulue = 'Idle'
    if (p.phase === 'fin') voulue = p.classement?.find((c) => c.joueur === index)?.place === 1 ? 'Victory' : 'Defeat'
    else if (p.phase === 'jeu' && jj.vitesse > 0.1) voulue = 'Run'
    if (voulue !== anim) setAnim(voulue)
  })

  return (
    <group ref={groupe}>
      <group>
        <Avatar avatar={j.avatar} animation={anim} />
      </group>
      {/* Anneau de couleur du joueur + jauge de sprint (le disque se remplit pendant la recharge) */}
      <mesh ref={anneau} rotation-x={-Math.PI / 2} position-y={0.03}>
        <ringGeometry args={[0.42, 0.55, 32]} />
        <meshBasicMaterial color={j.couleur} transparent />
      </mesh>
      <mesh ref={jauge} rotation-x={-Math.PI / 2} position-y={0.025}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color={j.couleur} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

export function Balise({ partieRef }) {
  const groupe = useRef()
  const drapeau = useRef()
  const sol = useRef()
  const modele = useModele('kenney-platformer/flag.glb')

  useFrame(({ clock }) => {
    const b = partieRef.current.balise
    const t = clock.elapsedTime
    groupe.current.visible = b.active
    groupe.current.position.set(b.x, HAUT_SOL, b.z)
    drapeau.current.rotation.y = t * 1.5
    drapeau.current.position.y = 0.1 + Math.sin(t * 3) * 0.08
    const s = 1 + 0.15 * Math.sin(t * 5)
    sol.current.scale.set(s, s, s)
  })

  return (
    <group ref={groupe}>
      <group ref={drapeau}>
        <Clone object={modele} scale={1.6} castShadow />
      </group>
      <mesh ref={sol} rotation-x={-Math.PI / 2} position-y={0.04}>
        <ringGeometry args={[0.7, 0.9, 40]} />
        <meshBasicMaterial color="#FFE27A" transparent opacity={0.9} />
      </mesh>
      {/* Faisceau lumineux visible de loin */}
      <mesh position-y={1.75}>
        <cylinderGeometry args={[0.15, 0.4, 3.5, 16, 1, true]} />
        <meshBasicMaterial color="#FFF3B0" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** Onde de couleur quand un joueur prend la balise. `effetsRef.current` : [{x, z, couleur, t0}] */
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
      m.position.set(e.x, HAUT_SOL + 0.05 + k * 0.8, e.z)
      m.scale.setScalar(0.5 + k * 2.5)
      m.material.opacity = 1 - k
      m.material.color.set(e.couleur)
    })
  })
  return [0, 1, 2, 3].map((i) => (
    <mesh key={i} ref={(m) => (pool.current[i] = m)} rotation-x={-Math.PI / 2} visible={false}>
      <ringGeometry args={[0.6, 0.8, 32]} />
      <meshBasicMaterial transparent depthWrite={false} />
    </mesh>
  ))
}

/** Caméra fixe qui recule en mode portrait pour que toute l'arène reste visible. */
export function Camera() {
  const { camera, size } = useThree()
  const aspect = size.width / size.height
  // En paysage, la hauteur de l'arène limite ; en portrait, c'est sa largeur.
  const recul = Math.max(1.2, 1.38 / aspect)
  camera.position.set(0, 21 * recul, 13 * recul)
  camera.fov = 42
  camera.far = 400
  camera.lookAt(0, 0, 0.9)
  camera.updateProjectionMatrix()
  return null
}
