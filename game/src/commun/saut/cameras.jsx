// Caméras des mini-jeux « à la Fall Guys ». Chacune porte sa lumière, dont l'ombre suit ce qu'elle regarde.
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { enJeu } from './physique.js'

function Lumiere({ lumiere, etendue }) {
  return (
    <directionalLight
      ref={lumiere} intensity={1.8} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-etendue} shadow-camera-right={etendue}
      shadow-camera-top={etendue} shadow-camera-bottom={-etendue} shadow-bias={-0.0005}
    />
  )
}

function placerLumiere(l, x, y, z) {
  l.position.set(x + 8, y + 18, z + 10)
  l.target.position.set(x, y, z)
  l.target.updateMatrixWorld()
}

/**
 * Caméra d'arène : vue plongeante qui garde toute l'arène (de rayon `rayon`) à l'écran, recule en portrait,
 * et, avec `suivreY`, monte ou descend avec les joueurs encore en jeu (arènes à étages).
 */
export function cameraArene({ rayon = 10, suivreY = false, hauteur = 0, angle = 1 } = {}) {
  return function CameraArene({ partieRef }) {
    const { camera, size } = useThree()
    const lumiere = useRef()
    const y = useRef(hauteur)
    useFrame((_, dt) => {
      const p = partieRef.current
      if (suivreY) {
        const ys = p.joueurs.filter((j) => !j.horsJeu).map((j) => j.y)
        const cible = ys.length ? Math.max(hauteur, ...ys) - 0.5 : y.current
        y.current += (cible - y.current) * Math.min(1, dt * 1.5)
      }
      const recul = Math.max(1.2, 1.38 / (size.width / size.height)) * (rayon / 10)
      camera.position.set(0, y.current + 21 * recul * angle, 13 * recul / angle)
      camera.fov = 42
      camera.far = 400
      camera.lookAt(0, y.current, 0.9 * (rayon / 10))
      camera.updateProjectionMatrix()
      placerLumiere(lumiere.current, 0, y.current, 0)
    })
    return <Lumiere lumiere={lumiere} etendue={rayon * 1.5} />
  }
}

/** Caméra de course : derrière le peloton (piste vers les z négatifs), elle recule quand les coureurs s'étalent. */
export function cameraCourse({ zDepart, zArrivee }) {
  return function CameraCourse({ partieRef }) {
    const { camera, size } = useThree()
    const lumiere = useRef()
    const etat = useRef({ z: zDepart - 4, y: 0, recul: 1 })
    useFrame((_, dt) => {
      const p = partieRef.current
      const enCourse = p.joueurs.filter((j) => j.arrive === null && !j.horsJeu)
      const suivis = enCourse.length ? enCourse : p.joueurs
      const zs = suivis.map((j) => j.z)
      const ys = suivis.filter(enJeu).map((j) => j.y)
      const zMin = Math.min(...zs), zMax = Math.max(...zs)
      const aspect = size.width / size.height
      const cibleZ = Math.max(zArrivee + 3, Math.min(zDepart - 4, (zMin + zMax) / 2 - 2))
      const cibleY = ys.length ? Math.max(0, ys.reduce((a, b) => a + b, 0) / ys.length) : etat.current.y
      const cibleRecul = Math.max(1, 1.25 / aspect) * (1 + Math.min(1, (zMax - zMin) / 22) * 0.6)
      const k = Math.min(1, dt * 3)
      const e = etat.current
      e.z += (cibleZ - e.z) * k
      e.y += (cibleY - e.y) * k * 0.5
      e.recul += (cibleRecul - e.recul) * k
      camera.position.set(0, e.y + 11 * e.recul, e.z + 9 * e.recul)
      camera.fov = 45
      camera.far = 300
      camera.lookAt(0, e.y, e.z - 1.5)
      camera.updateProjectionMatrix()
      placerLumiere(lumiere.current, 0, e.y, e.z - 2)
    })
    return <Lumiere lumiere={lumiere} etendue={18} />
  }
}
