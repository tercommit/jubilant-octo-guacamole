// Survol 3D de La Réunion : le relief réel (MNT Copernicus GLO-30, voir cartes/export_survol.py), sans personnage.
// 1 unité = 1 km ; l'altitude est exagérée pour mieux lire le relief.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Html, MapControls } from '@react-three/drei'
import * as THREE from 'three'
import { url } from '../commun/avatars.js'

const EXAGERATION = 1.6
const FOND_MARIN = -0.3 // les points en mer descendent : la côte plonge sous l'eau
const HAUTEUR_MIN_CAMERA = 0.5 // au-dessus du relief

const LIEUX = [
  { nom: 'Piton des Neiges', lon: 55.4775, lat: -21.0995, altitude: 3070 },
  { nom: 'Piton de la Fournaise', lon: 55.7135, lat: -21.244, altitude: 2632 },
  { nom: 'Grand Bénare', lon: 55.4215, lat: -21.1163, altitude: 2898 },
  { nom: 'Cirque de Mafate', lon: 55.43, lat: -21.06 },
  { nom: 'Cirque de Salazie', lon: 55.525, lat: -21.05 },
  { nom: 'Cirque de Cilaos', lon: 55.47, lat: -21.14 },
  { nom: 'Plaine des Cafres', lon: 55.58, lat: -21.215 },
  { nom: 'Saint-Denis', lon: 55.4504, lat: -20.8823 },
  { nom: 'Saint-Pierre', lon: 55.4781, lat: -21.3393 },
  { nom: 'Saint-Paul', lon: 55.27, lat: -21.0096 },
  { nom: 'Saint-Benoît', lon: 55.7128, lat: -21.034 },
]

/** Charge le relief : dimensions et altitudes (décimètres). */
function useRelief() {
  const [relief, setRelief] = useState(null)
  useEffect(() => {
    Promise.all([
      fetch(url('reunion/relief.json')).then((r) => r.json()),
      fetch(url('reunion/relief.bin')).then((r) => r.arrayBuffer()),
    ]).then(([infos, donnees]) => setRelief({ ...infos, altitudes: new Uint16Array(donnees) }))
  }, [])
  return relief
}

/** Outils de position : lon/lat → x/z, et hauteur de la scène en (x, z). */
function repere(relief) {
  const { colonnes, lignes, bbox: [ouest, sud, est, nord], largeurKm, hauteurKm, altitudes } = relief
  const metres = (i, j) => altitudes[Math.min(lignes - 1, Math.max(0, j)) * colonnes + Math.min(colonnes - 1, Math.max(0, i))] / 10
  return {
    largeurKm, hauteurKm,
    versScene: (lon, lat) => [((lon - ouest) / (est - ouest) - 0.5) * largeurKm, ((nord - lat) / (nord - sud) - 0.5) * hauteurKm],
    altitude: (x, z) => metres(Math.round((x / largeurKm + 0.5) * (colonnes - 1)), Math.round((z / hauteurKm + 0.5) * (lignes - 1))),
    hauteur(x, z) {
      const m = this.altitude(x, z)
      return m > 0 ? (m / 1000) * EXAGERATION : FOND_MARIN
    },
  }
}

function Terrain({ relief }) {
  const texture = useLoader(THREE.TextureLoader, url('reunion/texture.jpg'))
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const geometrie = useMemo(() => {
    const { colonnes, lignes, largeurKm, hauteurKm, altitudes } = relief
    const g = new THREE.PlaneGeometry(largeurKm, hauteurKm, colonnes - 1, lignes - 1)
    g.rotateX(-Math.PI / 2) // la ligne 0 (nord) part vers -z
    const pos = g.attributes.position
    for (let k = 0; k < pos.count; k++) {
      const m = altitudes[k] / 10
      pos.setY(k, m > 0 ? (m / 1000) * EXAGERATION : FOND_MARIN)
    }
    g.computeVertexNormals()
    return g
  }, [relief])
  return (
    <mesh geometry={geometrie} receiveShadow>
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  )
}

// Le fond marin prolonge, à perte de vue, la couleur des fonds de la texture (cartes/export_survol.py)
function Mer() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={0.005}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#2b7da3" transparent opacity={0.82} roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={FOND_MARIN - 0.01}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#1c5e80" roughness={1} />
      </mesh>
    </>
  )
}

function Etiquettes({ outils }) {
  return LIEUX.map((l) => {
    const [x, z] = outils.versScene(l.lon, l.lat)
    const y = outils.hauteur(x, z)
    return (
      <Html key={l.nom} position={[x, Math.max(y, 0) + 0.4, z]} center className={`lieu ${l.altitude ? 'sommet' : ''}`}>
        {l.nom}
        {l.altitude && <small>{l.altitude} m</small>}
      </Html>
    )
  })
}

/** Garde la caméra au-dessus du relief et le point visé au-dessus de l'île. */
function Garde({ outils, controles }) {
  useFrame(({ camera }) => {
    const c = controles.current
    if (!c) return
    const lim = 45
    c.target.x = THREE.MathUtils.clamp(c.target.x, -lim, lim)
    c.target.z = THREE.MathUtils.clamp(c.target.z, -lim, lim)
    c.target.y = 0
    const sol = Math.max(outils.hauteur(camera.position.x, camera.position.z), 0) + HAUTEUR_MIN_CAMERA
    if (camera.position.y < sol) camera.position.y = sol
  })
  return null
}

export default function Survol() {
  const relief = useRelief()
  const outils = useMemo(() => relief && repere(relief), [relief])
  const controles = useRef()
  const [noms, setNoms] = useState(false)
  const [tour, setTour] = useState(true)

  return (
    <div className="survol">
      <Canvas camera={{ position: [-18, 30, 52], fov: 45, near: 0.1, far: 1000 }} dpr={[1, 2]}>
        <color attach="background" args={['#a9d8ea']} />
        <fog attach="fog" args={['#bfe3ef', 70, 230]} />
        <hemisphereLight args={['#ffffff', '#4a6a3a', 1.1]} />
        <directionalLight position={[-40, 50, -20]} intensity={2.2} />
        <Mer />
        {outils && (
          <>
            <Suspense fallback={null}><Terrain relief={relief} /></Suspense>
            {noms && <Etiquettes outils={outils} />}
            <Garde outils={outils} controles={controles} />
          </>
        )}
        <MapControls
          ref={controles}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={140}
          maxPolarAngle={1.45}
          autoRotate={tour}
          autoRotateSpeed={0.4}
          onStart={() => setTour(false)}
        />
      </Canvas>

      {!relief && <div className="chargement">Chargement du relief…</div>}

      <div className="bandeau">
        <a href="./">← Jeu</a>
        <h1>Survol de La Réunion</h1>
        <div className="boutons">
          <button className={noms ? 'actif' : ''} onClick={() => setNoms(!noms)}>Noms des lieux</button>
          <button className={tour ? 'actif' : ''} onClick={() => setTour(!tour)}>Tour auto</button>
        </div>
      </div>
      <p className="aide">
        <span className="souris">Glisser : se déplacer · Clic droit : tourner · Molette : zoom</span>
        <span className="tactile">Un doigt : se déplacer · Deux doigts : tourner et zoomer</span>
        <span className="credit">Relief : Copernicus DEM GLO-30, altitudes exagérées ×{EXAGERATION}</span>
      </p>
    </div>
  )
}
