// Chargement et préparation des modèles glTF : clonage, recoloration, texture de biome, avatars animés.
import { useEffect, useMemo, useRef } from 'react'
import { useGLTF, useTexture, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSquelette } from 'three/addons/utils/SkeletonUtils.js'
import { url } from './avatars.js'

// Animations jouées une seule fois (la pose finale est conservée)
const UNE_FOIS = new Set(['Victory', 'Defeat', 'Jump', 'RecieveHit'])

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

/** Avatar Quaternius animé et recoloré. */
export function Avatar({ avatar, animation = 'Idle', echelle = 0.45 }) {
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
    const a = actions[animation] || actions.Idle
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
