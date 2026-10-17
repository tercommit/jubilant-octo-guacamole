// Chargement et préparation des modèles glTF : clonage, recoloration, texture de biome, avatars animés.
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useGLTF, useTexture, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSquelette } from 'three/addons/utils/SkeletonUtils.js'
import { url } from './avatars.js'

// Animations jouées une seule fois (la pose finale est conservée)
const UNE_FOIS = new Set(['Victory', 'Defeat', 'Jump', 'RecieveHit', 'Pousser', 'Porte'])

// Lutte (commun/lutte.js) : animations du pack Quaternius
const ANIMS_QUATERNIUS = { Pousser: 'Punch', Porter: 'Run_Carry', PorterArret: 'Walk_Carry', Porte: 'Jump' }

// KayKit : les animations du squelette Rig_Medium portent d'autres noms. Pas d'animation de victoire : il saute de joie.
// Le pack gratuit n'a pas d'animation « porter » : le porteur court normalement.
const ANIMS_KAYKIT = {
  Idle: 'Idle_A', Run: 'Running_A', Jump: 'Jump_Full_Short', RecieveHit: 'Hit_A', Victory: 'Jump_Full_Short', Defeat: 'Hit_B',
  Pousser: 'Throw', Porter: 'Running_A', PorterArret: 'Idle_B', Porte: 'Jump_Idle',
}
const UNE_FOIS_KAYKIT = new Set(['Jump', 'RecieveHit', 'Defeat', 'Pousser'])
// Les KayKit sont plus petits que les Quaternius : même hauteur à l'écran
const ECHELLE_KAYKIT = 1.45

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/** Clone un modèle statique en remplaçant sa texture (ex. version « tropique ») et en activant les ombres. */
export function useModele(chemin, texture = null) {
  const { scene } = useGLTF(url(chemin))
  // Les hooks ne peuvent pas être conditionnels : sans texture de remplacement, on charge un pixel vide.
  const tex = useTexture(texture ? url(texture) : PIXEL)
  return useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      if (texture && o.material?.map) {
        const m = o.material.clone()
        tex.flipY = false
        tex.colorSpace = THREE.SRGBColorSpace
        tex.magFilter = m.map.magFilter
        tex.minFilter = m.map.minFilter
        m.map = tex
        o.material = m
      }
    })
    return c
  }, [scene, tex, texture])
}

/** Avatar animé, quel que soit son kit. Il se charge à part : changer de kit ne fait pas disparaître la scène. */
export function Avatar(props) {
  return (
    <Suspense fallback={null}>
      {props.avatar.kit === 'kaykit' ? <AvatarKayKit key={props.avatar.id} {...props} /> : <AvatarQuaternius key={props.avatar.id} {...props} />}
    </Suspense>
  )
}

/** Avatar Quaternius animé et recoloré. */
function AvatarQuaternius({ avatar, animation = 'Idle', echelle = 0.45 }) {
  const groupe = useRef()
  const { scene, animations } = useGLTF(url(avatar.fichier))
  const modele = useMemo(() => {
    const c = cloneSquelette(scene)
    c.traverse((o) => {
      if (!o.isMesh && !o.isSkinnedMesh) return
      o.castShadow = true
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const nouveaux = mats.map((m) => {
        const couleur = Object.entries(avatar.couleurs).find(([k]) => m.name === k || m.name.startsWith(k))
        if (!couleur) return m
        const n = m.clone()
        n.color = new THREE.Color(couleur[1])
        return n
      })
      o.material = Array.isArray(o.material) ? nouveaux : nouveaux[0]
    })
    return c
  }, [scene, avatar])
  const { actions } = useAnimations(animations, groupe)

  useEffect(() => {
    const a = actions[ANIMS_QUATERNIUS[animation] ?? animation] || actions.Idle
    if (!a) return
    a.reset().fadeIn(0.15).play()
    if (UNE_FOIS.has(animation)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true }
    return () => { a.fadeOut(0.15) }
  }, [animation, actions])

  return (
    <group ref={groupe} scale={echelle}>
      <primitive object={modele} />
    </group>
  )
}

/** Avatar KayKit : texture recolorée, pièces masquées, animations prises dans les fichiers du squelette Rig_Medium. */
function AvatarKayKit({ avatar, animation = 'Idle', echelle = 0.45 }) {
  const groupe = useRef()
  const { scene } = useGLTF(url(avatar.fichier))
  const general = useGLTF(url('kaykit-adventurers/Rig_Medium_General.glb'))
  const mouvement = useGLTF(url('kaykit-adventurers/Rig_Medium_MovementBasic.glb'))
  const tex = useTexture(url(avatar.texture))
  const modele = useMemo(() => {
    const c = cloneSquelette(scene)
    c.traverse((o) => {
      if (!o.isMesh && !o.isSkinnedMesh) return
      if (avatar.masquer?.includes(o.name)) { o.visible = false; return }
      o.castShadow = true
      const m = o.material.clone()
      tex.flipY = false
      tex.colorSpace = THREE.SRGBColorSpace
      if (m.map) { tex.magFilter = m.map.magFilter; tex.minFilter = m.map.minFilter }
      m.map = tex
      o.material = m
    })
    return c
  }, [scene, tex, avatar])
  const clips = useMemo(() => [...general.animations, ...mouvement.animations], [general, mouvement])
  const { actions } = useAnimations(clips, groupe)

  useEffect(() => {
    const a = actions[ANIMS_KAYKIT[animation]] || actions.Idle_A
    if (!a) return
    a.reset().fadeIn(0.15).play()
    if (UNE_FOIS_KAYKIT.has(animation)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true } else a.setLoop(THREE.LoopRepeat, Infinity)
    return () => { a.fadeOut(0.15) }
  }, [animation, actions])

  return (
    <group ref={groupe} scale={echelle * ECHELLE_KAYKIT}>
      <primitive object={modele} />
    </group>
  )
}
