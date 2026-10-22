// Survol du plateau : l'île telle qu'elle est en jeu (décor et cases), sans pion ni partie, à parcourir librement.
import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import * as THREE from 'three'
import { Ile, Cases } from '../plateau/Scene.jsx'

/** Garde le point visé au-dessus de l'île et la caméra au-dessus de l'eau. */
function Garde({ controles }) {
  useFrame(({ camera }) => {
    const c = controles.current
    if (!c) return
    c.target.x = THREE.MathUtils.clamp(c.target.x, -24, 24)
    c.target.z = THREE.MathUtils.clamp(c.target.z, -18, 18)
    c.target.y = 0
    if (camera.position.y < 1) camera.position.y = 1
  })
  return null
}

export default function Survol() {
  const controles = useRef()
  const [tour, setTour] = useState(true)

  return (
    <div className="survol">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ position: [0, 22, 30], fov: 45, near: 0.5, far: 400 }}>
        <color attach="background" args={['#9fd4e6']} />
        <fog attach="fog" args={['#9fd4e6', 70, 160]} />
        <hemisphereLight args={['#eaf6ff', '#3d5a2a', 0.9]} />
        <directionalLight
          position={[8, 20, 10]} intensity={1.8} castShadow
          shadow-mapSize={[2048, 2048]} shadow-camera-left={-26} shadow-camera-right={26}
          shadow-camera-top={26} shadow-camera-bottom={-26} shadow-bias={-0.0005}
        />
        <Suspense fallback={null}>
          <Ile />
          <Cases />
        </Suspense>
        <MapControls
          ref={controles}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={70}
          maxPolarAngle={1.4}
          autoRotate={tour}
          autoRotateSpeed={0.5}
          onStart={() => setTour(false)}
        />
        <Garde controles={controles} />
      </Canvas>

      <div className="bandeau">
        <a href="./">← Jeu</a>
        <h1>Survol du plateau</h1>
        <div className="boutons">
          <button className={tour ? 'actif' : ''} onClick={() => setTour(!tour)}>Tour auto</button>
        </div>
      </div>
      <p className="aide">
        <span className="souris">Glisser : se déplacer · Clic droit : tourner · Molette : zoom</span>
        <span className="tactile">Un doigt : se déplacer · Deux doigts : tourner et zoomer</span>
      </p>
    </div>
  )
}
