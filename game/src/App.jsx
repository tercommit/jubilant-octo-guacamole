// Salon : les manettes rejoignent la partie (de 1 à 4 joueurs), J1 choisit une partie sur le plateau ou un mini-jeu seul.
import { useEffect, useRef, useState } from 'react'
import { lireEntrees, nomAppareil, MODE_CLAVIER } from './commun/entrees.js'
import { AVATARS, COULEURS_JOUEURS } from './commun/avatars.js'
import { MINIJEUX } from './minijeux/index.js'
import Plateau from './plateau/Plateau.jsx'
import { creerPlateau, finMinijeu } from './plateau/logique.js'

const PARAMS = new URLSearchParams(window.location.search)

const MODES = [{ id: 'plateau', nom: 'Partie sur le plateau' }, ...MINIJEUX]

function Salon({ inscrits, setInscrits, choix, setChoix, onLancer }) {
  const [appareils, setAppareils] = useState([])
  const etatRef = useRef(inscrits)
  etatRef.current = inscrits
  const lancerRef = useRef(onLancer)
  lancerRef.current = onLancer
  const choixRef = useRef(choix)
  choixRef.current = choix
  const stickJ1 = useRef(0)

  useEffect(() => {
    let id
    const tick = () => {
      const { etats, appuis } = lireEntrees()
      const ids = [...etats.keys()]
      setAppareils((prev) => (prev.join() === ids.join() ? prev : ids))
      let liste = etatRef.current
      for (const [app, a] of appuis) {
        const deja = liste.includes(app)
        if (a.a && !deja && liste.length < 4) liste = [...liste, app]
        else if (a.b && deja) liste = liste.filter((x) => x !== app)
        else if (a.start && deja && liste[0] === app) { lancerRef.current(liste); return }
      }
      if (liste !== etatRef.current) { etatRef.current = liste; setInscrits(liste) }
      // J1 choisit le mode avec le stick (gauche / droite)
      const sx = liste[0] ? etats.get(liste[0])?.x ?? 0 : 0
      const sens = sx > 0.6 ? 1 : sx < -0.6 ? -1 : 0
      if (sens && sens !== stickJ1.current) {
        const n = (choixRef.current + sens + MODES.length) % MODES.length
        choixRef.current = n
        setChoix(n)
      }
      stickJ1.current = sens
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [setInscrits, setChoix])

  return (
    <div className="salon">
      <h1>Plateau Réunion</h1>
      <div className="choix-minijeu">
        {MODES.map((m, i) => (
          <button key={m.id} className={i === choix ? 'actif' : ''} onClick={() => setChoix(i)}>{m.nom}</button>
        ))}
      </div>
      <div className="places">
        {[0, 1, 2, 3].map((i) => {
          const app = inscrits[i]
          return (
            <div key={i} className={`place ${app ? 'prise' : ''}`} style={{ '--c': COULEURS_JOUEURS[i] }}>
              <div className="numero">J{i + 1}</div>
              {app ? (
                <>
                  <div className="avatar">{AVATARS[i].nom}</div>
                  <div className="appareil">{nomAppareil(app)}</div>
                </>
              ) : (
                <div className="attente">Appuie sur <b>A</b></div>
              )}
            </div>
          )
        })}
      </div>
      <p className="aide">
        {inscrits.length >= 1
          ? <>J1 : <b>←&nbsp;→</b> choisir · <b>Start</b> lancer{inscrits.length === 1 ? ' en solo' : ''} · <b>B</b> pour quitter sa place</>
          : <>Appuie sur <b>A</b> de ta manette pour rejoindre la partie.</>}
      </p>
      <p className="petit">
        {appareils.length === 0 && 'Aucune manette détectée : branche-la ou connecte-la en Bluetooth, puis appuie sur un bouton.'}
        {MODE_CLAVIER && ' Mode clavier : J1 = ZQSD/WASD + Espace (Échap = Start), J2 = flèches + Entrée (Retour arrière = Start).'}
      </p>
    </div>
  )
}

export default function App() {
  const [inscrits, setInscrits] = useState([])
  const [choix, setChoix] = useState(Math.max(0, MODES.findIndex((m) => m.id === PARAMS.get('jeu'))))
  // { mode: 'plateau' | id de mini-jeu, joueurs, numero, minijeu (pendant une partie : mini-jeu en cours) }
  const [partie, setPartie] = useState(null)
  const plateauRef = useRef(null)

  const lancer = (liste) => {
    const joueurs = liste.map((appareil, i) => ({ appareil, avatar: AVATARS[i], couleur: COULEURS_JOUEURS[i] }))
    const mode = MODES[choix].id
    if (mode === 'plateau') plateauRef.current = creerPlateau(joueurs, MINIJEUX.map((m) => m.id))
    setPartie({ mode, joueurs, numero: (partie?.numero ?? 0) + 1, minijeu: null })
  }

  if (partie?.mode === 'plateau') {
    if (partie.minijeu) {
      const { Composant } = MINIJEUX.find((m) => m.id === partie.minijeu)
      return (
        <Composant
          key={partie.numero}
          joueurs={partie.joueurs}
          enPartie
          onTermine={(classement) => {
            finMinijeu(plateauRef.current, classement)
            setPartie({ ...partie, minijeu: null })
          }}
        />
      )
    }
    return (
      <Plateau
        plateauRef={plateauRef}
        onMinijeu={(id) => setPartie({ ...partie, minijeu: id, numero: partie.numero + 1 })}
        onQuitter={() => { plateauRef.current = null; setPartie(null) }}
      />
    )
  }

  if (partie) {
    const { Composant } = MINIJEUX.find((m) => m.id === partie.mode)
    return (
      <Composant
        key={partie.numero}
        joueurs={partie.joueurs}
        onTermine={(classement, choixFin) => {
          console.info('Classement', classement)
          if (choixFin === 'rejouer') setPartie({ ...partie, numero: partie.numero + 1 })
          else setPartie(null)
        }}
      />
    )
  }
  return <Salon inscrits={inscrits} setInscrits={setInscrits} choix={choix} setChoix={setChoix} onLancer={lancer} />
}
