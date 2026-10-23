// Rendu des villes (villes.js) : maisons et objets des packs Kenney, animaux animés, et les monuments
// (église, temple tamoul, mosquée, phare, sucrerie, kiosque) construits en low poly.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clone, useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useModele } from '../commun/modeles.jsx'
import { url } from '../commun/avatars.js'
import { ELEMENTS } from './villes.js'

const MAISONS = ['a', 'c', 'g', 'k', 'o', 'r'].map((t) => `kenney-suburban/building-type-${t}.glb`)
const TEX_CREOLE = 'kenney-suburban/Textures/colormap-creole.png'
// Les monuments sont dessinés à l'échelle des maisons, puis grossis pour se repérer de loin (rayons de villes.js)
const MONUMENT = 1.3
const ANIMAUX = { vache: 'cow', poule: 'chick', cochon: 'pig', chien: 'dog', chat: 'cat', crabe: 'crab' }

function hasard(n) {
  const s = Math.sin(n * 57.3) * 15731.743
  return s - Math.floor(s)
}

const mat = (color, autres) => new THREE.MeshStandardMaterial({ color, flatShading: true, ...autres })
const M = {
  blanc: mat('#f4efe6'), creme: mat('#efe0bf'), pierre: mat('#9b8b78'), basalte: mat('#5d5650'), tole: mat('#c2412f'),
  toleGris: mat('#8a8f96'), brique: mat('#a4553a'), vert: mat('#2f8f62'), or: mat('#e8b93a', { metalness: 0.3 }),
  verre: mat('#ffe58a', { emissive: '#ffcf4a', emissiveIntensity: 0.8 }), terre: mat('#7a5a3c'),
  gopuram: ['#e85d75', '#f2b134', '#3c9ee2', '#5bbf6a', '#b06bd6'].map((c) => mat(c)),
}

/** Toit à deux pans : prisme triangulaire couché le long de z, faîte en haut. */
function Toit({ largeur, longueur, materiau, position }) {
  const r = largeur / Math.sqrt(3)
  return (
    <mesh position={[position[0], position[1] + r / 2, position[2]]} rotation-x={-Math.PI / 2} material={materiau} castShadow>
      <cylinderGeometry args={[r, r, longueur, 3]} />
    </mesh>
  )
}

const Boite = ({ t, m, p = [0, 0, 0] }) => (
  <mesh position={[p[0], p[1] + t[1] / 2, p[2]]} material={m} castShadow receiveShadow>
    <boxGeometry args={t} />
  </mesh>
)

const Cylindre = ({ r, h, m, p = [0, 0, 0], seg = 8 }) => (
  <mesh position={[p[0], p[1] + h / 2, p[2]]} material={m} castShadow receiveShadow>
    <cylinderGeometry args={[Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : r, h, seg]} />
  </mesh>
)

const Cone = ({ r, h, m, p = [0, 0, 0], seg = 8 }) => (
  <mesh position={[p[0], p[1] + h / 2, p[2]]} material={m} castShadow>
    <coneGeometry args={[r, h, seg]} />
  </mesh>
)

/** Église à clocher (cathédrale de Saint-Denis, Notre-Dame-des-Laves, Notre-Dame-des-Neiges…). */
function Eglise() {
  return (
    <group>
      <Boite t={[0.34, 0.26, 0.5]} m={M.blanc} p={[0, 0, -0.06]} />
      <Toit largeur={0.4} longueur={0.54} materiau={M.toleGris} position={[0, 0.26, -0.06]} />
      <Boite t={[0.16, 0.5, 0.16]} m={M.blanc} p={[0, 0, 0.22]} />
      <Cone r={0.12} h={0.24} m={M.toleGris} p={[0, 0.5, 0.22]} seg={4} />
      <Boite t={[0.015, 0.1, 0.015]} m={M.or} p={[0, 0.74, 0.22]} />
      <Boite t={[0.06, 0.015, 0.015]} m={M.or} p={[0, 0.79, 0.22]} />
    </group>
  )
}

/** Temple tamoul : enceinte blanche et gopuram à étages colorés. */
function Temple() {
  return (
    <group>
      <Boite t={[0.5, 0.1, 0.5]} m={M.blanc} />
      {M.gopuram.map((m, i) => (
        <Boite key={i} t={[0.34 - i * 0.05, 0.08, 0.24 - i * 0.03]} m={m} p={[0, 0.1 + i * 0.08, 0]} />
      ))}
      <mesh position-y={0.55} rotation-z={Math.PI / 2} material={M.or} castShadow>
        <capsuleGeometry args={[0.035, 0.1, 3, 6]} />
      </mesh>
    </group>
  )
}

/** Mosquée : salle blanche, dôme vert et minaret. */
function Mosquee() {
  return (
    <group>
      <Boite t={[0.4, 0.22, 0.36]} m={M.creme} />
      <mesh position-y={0.22} material={M.vert} castShadow>
        <sphereGeometry args={[0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Cylindre r={0.045} h={0.62} m={M.creme} p={[0.2, 0, 0.17]} />
      <Cone r={0.06} h={0.12} m={M.vert} p={[0.2, 0.62, 0.17]} />
      <mesh position-y={0.4} material={M.or}><sphereGeometry args={[0.025, 6, 4]} /></mesh>
    </group>
  )
}

/** Phare blanc et rouge (Bel-Air, Sainte-Suzanne), sa lanterne tourne la nuit comme le jour. */
function Phare() {
  const feu = useRef()
  useFrame((_, dt) => { feu.current.rotation.y += dt * 1.5 })
  return (
    <group>
      <Cylindre r={[0.085, 0.12]} h={0.36} m={M.blanc} />
      <Cylindre r={[0.07, 0.085]} h={0.18} m={M.tole} p={[0, 0.36, 0]} />
      <Cylindre r={0.1} h={0.02} m={M.basalte} p={[0, 0.54, 0]} />
      <Cylindre r={0.06} h={0.09} m={M.verre} p={[0, 0.56, 0]} />
      <Cone r={0.075} h={0.08} m={M.tole} p={[0, 0.65, 0]} />
      <mesh ref={feu} position-y={0.6}>
        <boxGeometry args={[0.9, 0.02, 0.02]} />
        <meshBasicMaterial color="#fff2b0" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Sucrerie (le Gol) : bâtiment de pierre, toit de tôle et grande cheminée de brique. */
function Sucrerie() {
  return (
    <group>
      <Boite t={[0.32, 0.24, 0.5]} m={M.pierre} />
      <Toit largeur={0.36} longueur={0.54} materiau={M.toleGris} position={[0, 0.24, 0]} />
      <Cylindre r={[0.045, 0.07]} h={0.85} m={M.brique} p={[-0.2, 0, 0.18]} />
      <Cylindre r={0.05} h={0.04} m={M.basalte} p={[-0.2, 0.85, 0.18]} />
    </group>
  )
}

/** Kiosque du front de mer : socle, colonnes et toit rouge. */
function Kiosque() {
  return (
    <group>
      <Cylindre r={0.24} h={0.05} m={M.blanc} seg={8} />
      {Array.from({ length: 6 }, (_, i) => (
        <Cylindre key={i} r={0.012} h={0.2} m={M.blanc} p={[Math.cos(i * 1.047) * 0.19, 0.05, Math.sin(i * 1.047) * 0.19]} seg={4} />
      ))}
      <Cone r={0.29} h={0.16} m={M.tole} p={[0, 0.25, 0]} />
      <mesh position-y={0.43} material={M.or}><sphereGeometry args={[0.025, 6, 4]} /></mesh>
    </group>
  )
}

/** Tombe de La Buse au cimetière marin de Saint-Paul : pierre tombale, drapeau pirate et coffre. */
function Tombe({ modeles }) {
  return (
    <group>
      <Boite t={[0.14, 0.05, 0.24]} m={M.basalte} />
      <Boite t={[0.12, 0.14, 0.03]} m={M.pierre} p={[0, 0.05, -0.1]} />
      <Clone object={modeles.drapeau} position={[0.14, 0, -0.06]} scale={0.24} />
      <Clone object={modeles.coffre} position={[-0.05, 0.05, 0.14]} rotation-y={0.5} scale={0.11} />
    </group>
  )
}

/** Champ (canne à sucre ou maïs) : rangées de plants sur la terre. */
function Champ({ plant, n, ecart, echelle, graine }) {
  return (
    <group>
      <Boite t={[n[0] * ecart + 0.06, 0.03, n[1] * ecart + 0.06]} m={M.terre} />
      {Array.from({ length: n[0] * n[1] }, (_, i) => {
        const x = ((i % n[0]) - (n[0] - 1) / 2) * ecart, z = (Math.floor(i / n[0]) - (n[1] - 1) / 2) * ecart
        return <Clone key={i} object={plant} position={[x, 0.02, z]} rotation-y={hasard(graine + i) * 6.3} scale={echelle * (0.85 + hasard(graine - i) * 0.3)} />
      })}
    </group>
  )
}

/** Plant d'un pack dont on remplace la couleur (le bambou du Nature Kit devient de la canne). */
function useTeinte(chemin, couleur) {
  const modele = useModele(chemin)
  return useMemo(() => {
    modele.traverse((o) => { if (o.isMesh) o.material = mat(couleur) })
    return modele
  }, [modele, couleur])
}

/** Animal Kenney (Cube Pets) avec son animation : il broute, se repose ou danse. */
function Animal({ espece, graine }) {
  const { scene, animations } = useGLTF(url(`kenney-pets/animal-${espece}.glb`))
  const objet = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => { if (o.isMesh) o.castShadow = true })
    return c
  }, [scene])
  const { actions } = useAnimations(animations, objet)
  useEffect(() => {
    const nom = ['idle', 'eat', 'idle', 'eat', 'dance'][Math.floor(hasard(graine) * 5)]
    const a = actions[nom]
    a?.reset().play()
    if (a) { a.time = hasard(graine + 1) * a.getClip().duration; a.timeScale = 0.8 + hasard(graine + 2) * 0.4 }
    return () => a?.stop()
  }, [actions, graine])
  return <primitive object={objet} scale={0.14} />
}

function Element({ e, modeles, plants }) {
  const g = e.graine
  switch (e.type) {
    case 'maison': {
      const i = Math.floor(hasard(g) * MAISONS.length)
      return <Clone object={hasard(g + 9) < 0.6 ? modeles.creoles[i] : modeles.maisons[i]} scale={0.46} />
    }
    case 'eglise': return <group scale={MONUMENT}><Eglise /></group>
    case 'temple': return <group scale={MONUMENT}><Temple /></group>
    case 'mosquee': return <group scale={MONUMENT}><Mosquee /></group>
    case 'phare': return <group scale={MONUMENT}><Phare /></group>
    case 'sucrerie': return <group scale={MONUMENT}><Sucrerie /></group>
    case 'kiosque': return <group scale={MONUMENT}><Kiosque /></group>
    case 'tombe': return <Tombe modeles={modeles} />
    case 'etal': return <Clone object={hasard(g) < 0.5 ? modeles.etalRouge : modeles.etalVert} scale={0.3} />
    case 'charrette': return <Clone object={modeles.charrette} scale={0.32} />
    case 'fontaine': return <Clone object={modeles.fontaine} scale={0.28} />
    case 'lanterne': return <Clone object={modeles.lanterne} scale={0.3} />
    case 'palmier': return <Clone object={hasard(g) < 0.5 ? modeles.palmier : modeles.palmierPenche} scale={0.15 + hasard(g + 1) * 0.05} />
    case 'canon': return <Clone object={modeles.canon} scale={0.14} />
    case 'tonneau': return <Clone object={modeles.tonneau} scale={0.11} />
    case 'fleurs': return <Clone object={modeles.fleurs} scale={0.8} />
    case 'barque': return <Clone object={modeles.barque} scale={0.15} />
    case 'navire': return <Clone object={modeles.navire} scale={0.085} />
    case 'canne': return <Champ plant={plants.canne} n={[3, 3]} ecart={0.2} echelle={0.55} graine={g} />
    case 'mais': return <Champ plant={plants.mais} n={[3, 2]} ecart={0.17} echelle={0.33} graine={g} />
    default: return ANIMAUX[e.type] ? <Animal espece={ANIMAUX[e.type]} graine={g} /> : null
  }
}

/** Les villes de l'île : bâtiments, animaux et éléments de culture. */
export function Villes() {
  const modeles = {
    maisons: MAISONS.map((m) => useModele(m)),
    creoles: MAISONS.map((m) => useModele(m, TEX_CREOLE)),
    etalRouge: useModele('kenney-town/stall-red.glb'),
    etalVert: useModele('kenney-town/stall-green.glb'),
    charrette: useModele('kenney-town/cart.glb'),
    fontaine: useModele('kenney-town/fountain-round.glb'),
    lanterne: useModele('kenney-town/lantern.glb'),
    palmier: useModele('kenney-pirate/palm-straight.glb'),
    palmierPenche: useModele('kenney-pirate/palm-bend.glb'),
    barque: useModele('kenney-pirate/boat-row-small.glb'),
    navire: useModele('kenney-pirate/ship-small.glb'),
    drapeau: useModele('kenney-pirate/flag-pirate.glb'),
    coffre: useModele('kenney-pirate/chest.glb'),
    canon: useModele('kenney-pirate/cannon.glb'),
    tonneau: useModele('kenney-pirate/barrel.glb'),
    fleurs: useModele('kenney-nature/flower_redA.glb'),
  }
  const plants = {
    canne: useTeinte('kenney-nature/crops_bambooStageB.glb', '#a9c64a'),
    mais: useModele('kenney-nature/crops_cornStageD.glb'),
  }

  return (
    <group>
      {ELEMENTS.map((e, i) => (
        <group key={i} position={[e.x, e.y, e.z]}>
          {e.socle > 0 && (
            <mesh position-y={-e.socle / 2} material={M.pierre} receiveShadow castShadow>
              <boxGeometry args={[e.r * 1.9, e.socle, e.r * 1.9]} />
            </mesh>
          )}
          <group rotation-y={e.rot}>
            <Element e={e} modeles={modeles} plants={plants} />
          </group>
        </group>
      ))}
    </group>
  )
}
