// Le plateau de jeu. L'état de la partie (`plateauRef`) vit dans App : il survit pendant que les mini-jeux s'affichent.
// onMinijeu(id) : lancer un mini-jeu ; onQuitter() : fin de partie, retour au salon.
import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { majPlateau, joueurActif } from './logique.js'
import { lireEntrees } from '../commun/entrees.js'
import { Ile, Cases, Vanille, Pion, Fleches, Camera } from './Scene.jsx'
import Hud from './Hud.jsx'

function Boucle({ plateauRef, setHud, onMinijeu, onQuitter }) {
  const accu = useRef(0)
  useFrame((_, dt) => {
    const p = plateauRef.current
    const evts = majPlateau(p, Math.min(dt, 0.05), lireEntrees())
    for (const e of evts) {
      if (e.type === 'minijeu') return onMinijeu(e.id)
      if (e.type === 'quitter') return onQuitter()
    }
    accu.current += dt
    if (evts.length > 0 || accu.current > 0.1) {
      accu.current = 0
      const actif = joueurActif(p)
      setHud({
        phase: p.phase, etape: p.etape, pause: p.pause, tour: p.tour, tours: p.tours, choixTours: p.choixTours,
        de: p.de, pas: p.pas, message: p.message?.texte, minijeu: p.minijeu, ordre: p.ordre, classement: p.classement,
        actif: actif?.index ?? null,
        joueurs: p.joueurs.map((j) => ({
          nom: j.avatar.nom, couleur: j.couleur, zarlor: j.zarlor, vanilles: j.vanilles, deOrdre: j.deOrdre, gain: j.gain,
        })),
      })
    }
  })
  return null
}

export default function Plateau({ plateauRef, onMinijeu, onQuitter }) {
  const [hud, setHud] = useState(null)
  const nb = plateauRef.current.joueurs.length

  return (
    <div className="minijeu">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ fov: 45, near: 0.5, far: 400 }}>
        <color attach="background" args={['#9fd4e6']} />
        <hemisphereLight args={['#eaf6ff', '#3d5a2a', 0.9]} />
        <Camera plateauRef={plateauRef} />
        <Suspense fallback={null}>
          <Ile />
          <Cases />
          <Vanille plateauRef={plateauRef} />
          <Fleches plateauRef={plateauRef} />
          {Array.from({ length: nb }, (_, i) => <Pion key={i} plateauRef={plateauRef} index={i} />)}
          <Boucle plateauRef={plateauRef} setHud={setHud} onMinijeu={onMinijeu} onQuitter={onQuitter} />
        </Suspense>
      </Canvas>
      <Hud etat={hud} />
    </div>
  )
}
