// Mini-jeu « Sentier de Mafate » (Forêt des Hauts).
// Entrée : joueurs [{ appareil, avatar, couleur }]. Sortie : onTermine(classement, choix) avec choix 'rejouer' | 'menu'.
import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { creerPartie, majPartie } from './logique.js'
import { lireEntrees } from '../../commun/entrees.js'
import Arene from './Arene.jsx'
import { Joueur, Balise, Effets, Camera } from './Scene.jsx'
import Hud from './Hud.jsx'

function Boucle({ partieRef, effetsRef, setHud, onTermine }) {
  const accu = useRef(0)
  useFrame(({ clock }, dt) => {
    const p = partieRef.current
    const entrees = lireEntrees()
    const evts = majPartie(p, Math.min(dt, 0.05), entrees)
    let urgent = evts.length > 0
    for (const e of evts) {
      if (e.type === 'balise') effetsRef.current.push({ x: e.x, z: e.z, couleur: p.joueurs[e.joueur].couleur, t0: clock.elapsedTime })
    }
    // Écran de fin : A pour rejouer, B pour revenir au menu
    if (p.phase === 'fin' && (p.finDepuis = (p.finDepuis ?? 0) + dt) > 1.5) {
      for (const j of p.joueurs) {
        const a = entrees.appuis.get(j.appareil) || {}
        if (a.a) return onTermine(p.classement, 'rejouer')
        if (a.b) return onTermine(p.classement, 'menu')
      }
    }
    accu.current += dt
    if (urgent || accu.current > 0.1) {
      accu.current = 0
      setHud({
        phase: p.phase, pause: p.pause, temps: p.temps, decompte: p.decompte, classement: p.classement,
        finPrete: (p.finDepuis ?? 0) > 1.5,
        joueurs: p.joueurs.map((j) => ({ points: j.points, pret: j.pret, couleur: j.couleur, nom: j.avatar.nom })),
      })
    }
  })
  return null
}

export default function ForetDesHauts({ joueurs, onTermine }) {
  const partieRef = useRef(null)
  if (!partieRef.current) partieRef.current = creerPartie(joueurs)
  const effetsRef = useRef([])
  const [hud, setHud] = useState(null)

  return (
    <div className="minijeu">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ fov: 42, near: 0.5, far: 200 }}>
        <color attach="background" args={['#9fd4e6']} />
        <hemisphereLight args={['#eaf6ff', '#3d5a2a', 0.9]} />
        <directionalLight
          position={[8, 18, 10]} intensity={1.8} castShadow
          shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14}
          shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0005}
        />
        <Camera />
        <Suspense fallback={null}>
          <Arene />
          <Balise partieRef={partieRef} />
          {joueurs.map((_, i) => <Joueur key={i} partieRef={partieRef} index={i} />)}
          <Effets effetsRef={effetsRef} />
          <Boucle partieRef={partieRef} effetsRef={effetsRef} setHud={setHud} onTermine={onTermine} />
        </Suspense>
      </Canvas>
      <Hud etat={hud} />
    </div>
  )
}
