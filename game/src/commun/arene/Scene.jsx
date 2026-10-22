// Éléments de scène communs aux arènes : joueurs (avec jauge de sprint s'il y en a une), effets de prise, caméra fixe.
import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Avatar } from '../modeles.jsx'
import { useAvatar } from '../kit.js'
import { animationLutte } from '../lutte.js'

/** `sprint` : { duree, recharge } pour la jauge (facultatif : sans sprint, pas de jauge). */
export function Joueur({ partieRef, index, sprint }) {
  const groupe = useRef()
  const jauge = useRef()
  const anneau = useRef()
  const [anim, setAnim] = useState('Idle')
  const avatar = useAvatar(index)
  const j = partieRef.current.joueurs[index]
  const totalRecharge = sprint ? sprint.duree + sprint.recharge : 1

  useFrame(({ clock }) => {
    const p = partieRef.current
    const jj = p.joueurs[index]
    groupe.current.position.set(jj.x, jj.y, jj.z)
    // invisible quand il est hors jeu, clignote quand il est invincible
    groupe.current.visible = !jj.horsJeu && (!(jj.invincible > 0) || Math.floor(clock.elapsedTime * 12) % 2 === 0)
    // rotation lissée vers l'angle cible
    const cible = jj.angle
    const cur = groupe.current.userData.angle ?? cible
    let d = cible - cur
    d = Math.atan2(Math.sin(d), Math.cos(d))
    const a = cur + d * 0.3
    groupe.current.userData.angle = a
    groupe.current.children[0].rotation.y = a

    const charge = sprint ? 1 - jj.recharge / totalRecharge : 0
    jauge.current.scale.setScalar(Math.max(0.001, charge))
    anneau.current.material.opacity = jj.sprint > 0 ? 1 : 0.85

    let voulue = 'Idle'
    if (p.phase === 'fin') voulue = p.classement?.find((c) => c.joueur === index)?.place === 1 ? 'Victory' : 'Defeat'
    else if (animationLutte(jj)) voulue = animationLutte(jj)
    else if (jj.etourdi > 0) voulue = 'RecieveHit'
    else if (jj.sol === false && p.phase === 'jeu') voulue = 'Jump'
    else if (p.phase === 'jeu' && jj.vitesse > 0.1) voulue = 'Run'
    if (voulue !== anim) setAnim(voulue)
  })

  return (
    <group ref={groupe}>
      <group>
        <Avatar avatar={avatar} animation={anim} />
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

/** Onde de couleur quand un joueur marque. `effetsRef.current` : [{x, y (facultatif), z, couleur, t0}] */
export function Effets({ effetsRef, hauteur }) {
  const pool = useRef([])
  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    effetsRef.current = effetsRef.current.filter((e) => now - (e.t0 ??= now) < 0.6)
    pool.current.forEach((m, i) => {
      const e = effetsRef.current[i]
      m.visible = !!e
      if (!e) return
      const k = (now - e.t0) / 0.6
      m.position.set(e.x, (e.y ?? hauteur) + 0.05 + k * 0.8, e.z)
      m.scale.setScalar(0.5 + k * 2.5)
      m.material.opacity = 1 - k
      m.material.color.set(e.couleur)
    })
  })
  return Array.from({ length: 6 }, (_, i) => (
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
