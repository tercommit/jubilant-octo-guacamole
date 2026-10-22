// Expo des assets : une vitrine 3D de chaque modèle utilisé, avec son pack, sa licence et les jeux où il apparaît.
// Une seule toile WebGL (drei <View>) dessine toutes les vignettes.
import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, View } from '@react-three/drei'
import * as THREE from 'three'
import { url } from '../commun/avatars.js'
import { Avatar, useModele } from '../commun/modeles.jsx'
import { JEUX, PACKS, TEXTURES } from './catalogue.js'

const ANIMATIONS = [
  { id: 'Idle', nom: 'Repos' }, { id: 'Run', nom: 'Course' }, { id: 'Victory', nom: 'Victoire' },
  { id: 'Defeat', nom: 'Défaite' }, { id: 'Pousser', nom: 'Pousser' }, { id: 'Porter', nom: 'Porter' },
]

/** Cadre le contenu (taille et centre) dès qu'il est chargé, et le fait tourner ; glisser le tourne à la main. */
function Socle({ rotation, children }) {
  const pivot = useRef()
  const contenu = useRef()
  const cadre = useRef(false)
  useFrame((_, dt) => {
    if (!cadre.current) {
      const boite = new THREE.Box3().setFromObject(contenu.current)
      if (!boite.isEmpty()) {
        const taille = boite.getSize(new THREE.Vector3())
        const s = 1.7 / Math.max(taille.x, taille.y, taille.z)
        const centre = boite.getCenter(new THREE.Vector3())
        contenu.current.scale.setScalar(s)
        contenu.current.position.set(-centre.x * s, -centre.y * s, -centre.z * s)
        cadre.current = true
      }
    }
    if (!rotation.current.glisse) rotation.current.y += dt * 0.5
    pivot.current.rotation.y = rotation.current.y
  })
  return (
    <group ref={pivot}>
      <group ref={contenu}>{children}</group>
    </group>
  )
}

function Modele({ fichier, texture }) {
  return <primitive object={useModele(fichier, texture)} />
}

function Vignette({ children }) {
  const rotation = useRef({ y: Math.random() * Math.PI * 2, glisse: false, x: 0 })
  const glisser = {
    onPointerDown: (e) => { rotation.current.glisse = true; rotation.current.x = e.clientX; e.currentTarget.setPointerCapture(e.pointerId) },
    onPointerMove: (e) => {
      if (!rotation.current.glisse) return
      rotation.current.y += (e.clientX - rotation.current.x) * 0.012
      rotation.current.x = e.clientX
    },
    onPointerUp: () => { rotation.current.glisse = false },
    onPointerCancel: () => { rotation.current.glisse = false },
  }
  return (
    <View className="vue" {...glisser}>
      <PerspectiveCamera makeDefault position={[0, 1.1, 3.3]} fov={35} onUpdate={(c) => c.lookAt(0, 0, 0)} />
      <hemisphereLight args={['#ffffff', '#8a7a60', 1.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.8} />
      <Suspense fallback={null}>
        <Socle rotation={rotation}>{children}</Socle>
      </Suspense>
    </View>
  )
}

function Etiquettes({ jeux }) {
  if (!jeux.length) return <div className="jeux"><span className="pas-utilise">Pas encore attribué</span></div>
  if (jeux.length === Object.keys(JEUX).length) return <div className="jeux"><span>Partout</span></div>
  return <div className="jeux">{jeux.map((j) => <span key={j}>{JEUX[j]}</span>)}</div>
}

function Carte({ titre, sousTitre, jeux, children }) {
  return (
    <figure className="carte">
      <Vignette>{children}</Vignette>
      <figcaption>
        <b>{titre}</b>
        <code>{sousTitre}</code>
        <Etiquettes jeux={jeux} />
      </figcaption>
    </figure>
  )
}

export default function Expo() {
  const [filtre, setFiltre] = useState(null)
  const [animation, setAnimation] = useState('Idle')
  const garde = (a) => !filtre || a.jeux.includes(filtre)
  const total = PACKS.reduce((n, p) => n + (p.modeles?.length ?? 0) + (p.avatars?.length ?? 0), 0)

  return (
    <>
      <main className="expo">
        <header>
          <a className="retour" href="./">← Retour au jeu</a> · <a className="retour" href="./survol.html">Survoler l’île en 3D</a>
          <h1>Expo des assets</h1>
          <p>
            Les {total} modèles 3D et les textures qui donnent vie à <b>Plateau Réunion</b>. Tous sont sous licence
            libre CC0 ; certains ont été recolorés ou repeints pour l’île. Fais glisser une vignette pour la tourner.
          </p>
          <nav className="filtres">
            <button className={!filtre ? 'actif' : ''} onClick={() => setFiltre(null)}>Tout</button>
            {Object.entries(JEUX).map(([id, nom]) => (
              <button key={id} className={filtre === id ? 'actif' : ''} onClick={() => setFiltre(id)}>{nom}</button>
            ))}
          </nav>
        </header>

        {PACKS.map((pack) => {
          const avatars = pack.avatars?.filter(garde) ?? []
          const modeles = pack.modeles?.filter(garde) ?? []
          if (!avatars.length && !modeles.length) return null
          return (
            <section key={pack.id}>
              <h2>{pack.nom}</h2>
              <p className="credit">
                {pack.auteur} · <a href={pack.lien} target="_blank" rel="noreferrer">page du pack</a> · licence {pack.licence}
              </p>
              <p className="note">{pack.note}</p>
              {avatars.length > 0 && (
                <div className="animations">
                  {ANIMATIONS.map((a) => (
                    <button key={a.id} className={animation === a.id ? 'actif' : ''} onClick={() => setAnimation(a.id)}>{a.nom}</button>
                  ))}
                </div>
              )}
              <div className="grille">
                {avatars.map((a) => (
                  <Carte key={a.id} titre={a.nom} sousTitre={a.fichier.split('/').pop()} jeux={a.jeux}>
                    <Avatar avatar={a} animation={animation} echelle={1} />
                  </Carte>
                ))}
                {modeles.map((m) => (
                  <Carte key={m.fichier} titre={m.nom} sousTitre={m.fichier.split('/').pop()} jeux={m.jeux}>
                    <Modele fichier={m.fichier} texture={m.texture} />
                  </Carte>
                ))}
              </div>
            </section>
          )
        })}

        {!filtre && (
          <section>
            <h2>Textures retouchées</h2>
            <p className="note">Versions recolorées pour la végétation tropicale, et peintures péi des personnages KayKit.</p>
            <div className="grille textures">
              {TEXTURES.map((t) => (
                <figure key={t.apres} className="carte">
                  <div className={`images ${t.avant ? 'paire' : ''}`}>
                    {t.avant && <img src={url(t.avant)} alt="Texture d’origine" loading="lazy" />}
                    <img src={url(t.apres)} alt={t.nom} loading="lazy" />
                  </div>
                  <figcaption>
                    <b>{t.nom}</b>
                    <code>{t.avant ? 'origine → retouchée' : t.apres.split('/').pop()}</code>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <footer>
          Modèles : <a href="https://kenney.nl" target="_blank" rel="noreferrer">Kenney</a>,{' '}
          <a href="https://kaylousberg.com" target="_blank" rel="noreferrer">Kay Lousberg (KayKit)</a>,{' '}
          <a href="https://quaternius.com" target="_blank" rel="noreferrer">Quaternius</a> — domaine public (CC0). Merci à eux !
        </footer>
      </main>
      <Canvas className="toile" dpr={[1, 2]}>
        <View.Port />
      </Canvas>
    </>
  )
}
