// Décor des « Portes des cases » : une cour en terre battue, des façades de cases créoles et leurs portes.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import { CONFIG } from './config.js'
import { PISTE, xPorte } from './logique.js'
import { Arrivee } from '../../commun/saut/decor.jsx'
import { useModele } from '../../commun/modeles.jsx'

const { demiLargeur, largeurPorte, pilier, epaisseur, hauteur } = CONFIG
const TEINTES = ['#2f7fb8', '#3c9a5a', '#c43f3f', '#e2a23c', '#7a4fb0']

/** Une porte : elle bascule vers l'arrière quand elle s'ouvre. */
function Porte({ partieRef, r, i }) {
  const charniere = useRef()
  useFrame(() => {
    const p = partieRef.current
    const porte = p.rangees[r].portes[i]
    const k = porte.ouverte === null ? 0 : Math.min(1, (p.t - porte.ouverte) / 0.35)
    charniere.current.rotation.x = -k * (Math.PI / 2) * 0.98
  })
  return (
    <group ref={charniere} position={[xPorte(i), 0, CONFIG.rangees[r].z - epaisseur / 2]}>
      <mesh position={[0, hauteur * 0.4, epaisseur / 2]} castShadow>
        <boxGeometry args={[largeurPorte * 0.96, hauteur * 0.8, epaisseur * 0.6]} />
        <meshStandardMaterial color={TEINTES[(i + r) % TEINTES.length]} flatShading />
      </mesh>
      {/* croisillons */}
      <mesh position={[0, hauteur * 0.4, epaisseur / 2 + 0.17]}>
        <boxGeometry args={[largeurPorte * 0.8, 0.12, 0.05]} />
        <meshStandardMaterial color="#f4e9d8" />
      </mesh>
    </group>
  )
}

/** Façade : piliers, linteau et lambrequins au-dessus des portes. */
function Facade({ z }) {
  const xs = Array.from({ length: CONFIG.portesParRangee + 1 }, (_, i) => xPorte(i) - (largeurPorte + pilier) / 2)
  return (
    <group position-z={z}>
      {xs.map((x, i) => (
        <mesh key={i} position={[x, hauteur / 2, 0]} castShadow>
          <boxGeometry args={[pilier, hauteur, epaisseur * 1.2]} />
          <meshStandardMaterial color="#f4f1ea" flatShading />
        </mesh>
      ))}
      <mesh position={[0, hauteur * 0.9, 0]} castShadow>
        <boxGeometry args={[demiLargeur * 2 + 0.6, hauteur * 0.2, epaisseur * 1.3]} />
        <meshStandardMaterial color="#f4f1ea" flatShading />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} position={[-demiLargeur + 0.25 + i * ((demiLargeur * 2) / 24), hauteur * 0.76, epaisseur * 0.66]} rotation-x={Math.PI}>
          <coneGeometry args={[0.18, 0.3, 3]} />
          <meshStandardMaterial color="#c43f3f" flatShading />
        </mesh>
      ))}
      {/* toit de tôle */}
      <mesh position={[0, hauteur + 0.3, -0.6]} rotation-x={-0.5} castShadow>
        <boxGeometry args={[demiLargeur * 2 + 1, 0.1, 2]} />
        <meshStandardMaterial color="#b84a3a" flatShading />
      </mesh>
    </group>
  )
}

export default function Decor({ partieRef }) {
  const arbre = useModele('kenney-platformer/tree.glb')
  const longueur = 3 - (PISTE.zArrivee - 4)
  return (
    <group>
      <mesh position={[0, -0.5, 3 - longueur / 2]} receiveShadow>
        <boxGeometry args={[demiLargeur * 2 + 1, 1, longueur]} />
        <meshStandardMaterial color="#c9784a" flatShading />
      </mesh>
      {CONFIG.rangees.map((r, ir) => (
        <group key={ir}>
          <Facade z={r.z} />
          {r.vraies !== undefined && Array.from({ length: CONFIG.portesParRangee }, (_, i) => <Porte key={i} partieRef={partieRef} r={ir} i={i} />)}
        </group>
      ))}
      <Arrivee z={PISTE.zArrivee} demiLargeur={demiLargeur} />
      {/* bord de la cour : murets et arbres */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (demiLargeur + 0.4), 0.4, 3 - longueur / 2]}>
            <boxGeometry args={[0.4, 0.8, longueur]} />
            <meshStandardMaterial color="#8a8a8a" flatShading />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <Clone key={i} object={arbre} position={[s * (demiLargeur + 2), 0, -i * 7]} scale={2.2} />
          ))}
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.6}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#6dbe45" />
      </mesh>
    </group>
  )
}
