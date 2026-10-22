// Squelette commun des mini-jeux d'arène : canvas, lumière, boucle de jeu, menu Start, HUD et écran de fin.
// Entrée : joueurs [{ appareil, couleur }]. Sortie : onTermine(classement, choix) avec choix 'rejouer' | 'menu' | 'passer'.
// enPartie : lancé depuis le plateau (l'écran de fin propose alors de revenir au plateau).
//
// `jeu` décrit le mini-jeu :
//   config (duree, sprint…), texte (voir HudPoints), creerPartie(joueurs), majPartie(p, dt, entrees) → évènements,
//   Decor : composant 3D qui reçoit partieRef, hauteurEffets, ciel, sol (couleurs de l'éclairage)
//   Camera : (facultatif) caméra qui reçoit partieRef et porte sa propre lumière ; sinon caméra fixe sur l'arène
import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lireEntrees } from '../entrees.js'
import { changerKit, avatarJoueur } from '../kit.js'
import { classementPasse } from '../menu.js'
import { Joueur, Effets, Camera } from './Scene.jsx'
import HudPoints, { etatHud } from './HudPoints.jsx'

function Boucle({ jeu, partieRef, effetsRef, setHud, onTermine }) {
  const accu = useRef(0)
  useFrame(({ clock }, dt) => {
    const p = partieRef.current
    const entrees = lireEntrees()
    const evts = jeu.majPartie(p, Math.min(dt, 0.05), entrees)
    for (const e of evts) {
      const t0 = clock.elapsedTime
      if (e.type === 'point' || e.type === 'arrivee') effetsRef.current.push({ x: e.x, y: e.y, z: e.z, couleur: p.joueurs[e.joueur].couleur, t0 })
      if (e.type === 'choc' || e.type === 'touche') effetsRef.current.push({ x: e.x, y: e.y, z: e.z, couleur: '#ffffff', t0 })
      if (e.type === 'elimine') effetsRef.current.push({ x: e.x, y: e.y, z: e.z, couleur: '#ff6a1f', t0 })
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
    if (evts.length > 0 || accu.current > 0.1) {
      accu.current = 0
      setHud(etatHud(p, jeu.config, (i) => avatarJoueur(i).nom))
    }
  })
  return null
}

export default function MinijeuArene({ jeu, joueurs, onTermine, enPartie = false }) {
  const partieRef = useRef(null)
  if (!partieRef.current) partieRef.current = jeu.creerPartie(joueurs)
  const effetsRef = useRef([])
  const [hud, setHud] = useState(null)
  const { Decor, ciel = '#9fd4e6', sol = '#3d5a2a', hauteurEffets = 0, brume } = jeu
  const CameraJeu = jeu.Camera

  return (
    <div className="minijeu" style={{ background: ciel }}>
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ fov: 42, near: 0.5, far: 200 }}>
        <color attach="background" args={[ciel]} />
        {brume && <fog attach="fog" args={[ciel, ...brume]} />}
        <hemisphereLight args={['#eaf6ff', sol, 0.9]} />
        {CameraJeu ? <CameraJeu partieRef={partieRef} /> : (
          <>
            <directionalLight
              position={[8, 18, 10]} intensity={1.8} castShadow
              shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14}
              shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0005}
            />
            <Camera />
          </>
        )}
        <Suspense fallback={null}>
          <Decor partieRef={partieRef} />
          {joueurs.map((_, i) => <Joueur key={i} partieRef={partieRef} index={i} sprint={jeu.config.sprint} />)}
          <Effets effetsRef={effetsRef} hauteur={hauteurEffets} />
          <Boucle jeu={jeu} partieRef={partieRef} effetsRef={effetsRef} setHud={setHud} onTermine={onTermine} />
        </Suspense>
      </Canvas>
      <HudPoints etat={hud} texte={jeu.texte} enPartie={enPartie} />
    </div>
  )
}
