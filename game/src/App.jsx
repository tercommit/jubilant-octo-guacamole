// Lancement autonome des mini-jeux : les manettes rejoignent la partie, J1 choisit le mini-jeu, puis on joue.
import { useEffect, useRef, useState } from 'react'
import { lireEntrees, nomAppareil, MODE_CLAVIER } from './commun/entrees.js'
import { AVATARS, COULEURS_JOUEURS } from './commun/avatars.js'
import ForetDesHauts from './minijeux/foret-des-hauts/ForetDesHauts.jsx'
import TiDiagonale from './minijeux/ti-diagonale/TiDiagonale.jsx'

const PARAMS = new URLSearchParams(window.location.search)
const MIN_JOUEURS = PARAMS.has('solo') ? 1 : 2

const MINIJEUX = [
  { id: 'foret-des-hauts', nom: 'Sentier de Mafate', Composant: ForetDesHauts },
  { id: 'ti-diagonale', nom: 'La Ti Diagonale', Composant: TiDiagonale },
]

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
        else if (a.start && deja && liste[0] === app && liste.length >= MIN_JOUEURS) { lancerRef.current(liste); return }
      }
      if (liste !== etatRef.current) { etatRef.current = liste; setInscrits(liste) }
      // J1 choisit le mini-jeu avec le stick (gauche / droite)
      const sx = liste[0] ? etats.get(liste[0])?.x ?? 0 : 0
      const sens = sx > 0.6 ? 1 : sx < -0.6 ? -1 : 0
      if (sens && sens !== stickJ1.current) {
        const n = (choixRef.current + sens + MINIJEUX.length) % MINIJEUX.length
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
        {MINIJEUX.map((m, i) => (
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
        {inscrits.length >= MIN_JOUEURS
          ? <>J1 : <b>←&nbsp;→</b> choisir le mini-jeu · <b>Start</b> lancer · <b>B</b> pour quitter sa place</>
          : <>Il faut au moins {MIN_JOUEURS} joueur{MIN_JOUEURS > 1 ? 's' : ''} avec une manette.</>}
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
  const [choix, setChoix] = useState(Math.max(0, MINIJEUX.findIndex((m) => m.id === PARAMS.get('jeu'))))
  const [partie, setPartie] = useState(null) // { joueurs, numero, minijeu }

  const lancer = (liste) => setPartie({
    numero: (partie?.numero ?? 0) + 1,
    minijeu: MINIJEUX[choix],
    joueurs: liste.map((appareil, i) => ({ appareil, avatar: AVATARS[i], couleur: COULEURS_JOUEURS[i] })),
  })

  if (partie) {
    const { Composant } = partie.minijeu
    return (
      <Composant
        key={partie.numero}
        joueurs={partie.joueurs}
        onTermine={(classement, choix) => {
          console.info('Classement', classement)
          if (choix === 'rejouer') setPartie({ ...partie, numero: partie.numero + 1 })
          else setPartie(null)
        }}
      />
    )
  }
  return <Salon inscrits={inscrits} setInscrits={setInscrits} choix={choix} setChoix={setChoix} onLancer={lancer} />
}
