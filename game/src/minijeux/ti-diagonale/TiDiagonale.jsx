// Mini-jeu « La Ti Diagonale » (parcours d'obstacles).
// Entrée : joueurs [{ appareil, couleur }]. Sortie : onTermine(classement, choix) avec choix 'rejouer' | 'menu' | 'passer'.
// enPartie : lancé depuis le plateau (l'écran de fin propose alors de revenir au plateau).
import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { creerPartie, majPartie } from './logique.js'
import { lireEntrees } from '../../commun/entrees.js'
import { changerKit, avatarJoueur } from '../../commun/kit.js'
import { classementPasse } from '../../commun/menu.js'
import Piste from './Piste.jsx'
import { Joueur, Cannes, Mobiles, Pics, Roches, Effets, Camera } from './Scene.jsx'
import Hud from './Hud.jsx'

function Boucle({ partieRef, effetsRef, setHud, onTermine }) {
  const accu = useRef(0)
  useFrame(({ clock }, dt) => {
    const p = partieRef.current
    const entrees = lireEntrees()
    const evts = majPartie(p, Math.min(dt, 0.05), entrees)
    let urgent = evts.length > 0
    for (const e of evts) {
      if (e.type === 'arrivee') effetsRef.current.push({ x: p.joueurs[e.joueur].x, z: p.joueurs[e.joueur].z, couleur: p.joueurs[e.joueur].couleur, t0: clock.elapsedTime })
      if (e.type === 'touche') effetsRef.current.push({ x: e.x, z: e.z, couleur: '#ffffff', t0: clock.elapsedTime })
      if (e.type === 'passer') return onTermine(classementPasse(p.joueurs), 'passer')
      if (e.type === 'kit') changerKit()
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
        phase: p.phase, menu: p.menu && { ...p.menu }, temps: p.temps, decompte: p.decompte, classement: p.classement,
        finPrete: (p.finDepuis ?? 0) > 1.5,
        joueurs: p.joueurs.map((j) => ({
          progression: j.progression, rang: j.rangArrivee, pret: j.pret, couleur: j.couleur, nom: avatarJoueur(j.index).nom,
        })),
      })
    }
  })
  return null
}

export default function TiDiagonale({ joueurs, onTermine, enPartie = false }) {
  const partieRef = useRef(null)
  if (!partieRef.current) partieRef.current = creerPartie(joueurs)
  const effetsRef = useRef([])
  const [hud, setHud] = useState(null)

  return (
    <div className="minijeu">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ fov: 45, near: 0.5, far: 300 }}>
        <color attach="background" args={['#9fd4e6']} />
        <fog attach="fog" args={['#9fd4e6', 60, 160]} />
        <hemisphereLight args={['#eaf6ff', '#3d5a2a', 0.9]} />
        <Camera partieRef={partieRef} />
        <Suspense fallback={null}>
          <Piste />
          <Cannes partieRef={partieRef} />
          <Mobiles partieRef={partieRef} />
          <Pics partieRef={partieRef} />
          <Roches partieRef={partieRef} />
          {joueurs.map((_, i) => <Joueur key={i} partieRef={partieRef} index={i} />)}
          <Effets effetsRef={effetsRef} />
          <Boucle partieRef={partieRef} effetsRef={effetsRef} setHud={setHud} onTermine={onTermine} />
        </Suspense>
      </Canvas>
      <Hud etat={hud} enPartie={enPartie} />
    </div>
  )
}
