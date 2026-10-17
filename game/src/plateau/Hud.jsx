// Interface du plateau (DOM par-dessus le canvas).
import { CONFIG } from './config.js'
import { MINIJEUX } from '../minijeux/index.js'

const COINS = ['coin-hg', 'coin-hd', 'coin-bg', 'coin-bd']
const PLACES = ['1er', '2e', '3e', '4e']

const nomMinijeu = (id) => MINIJEUX.find((m) => m.id === id)?.nom ?? id

function Fiche({ j, actif }) {
  return (
    <>
      <span className="pastille" />
      <span className="nom">{j.nom}</span>
      <span className="compteurs">
        <span className="vanilles" title="Gousses de vanille">{j.vanilles} <i>vanille{j.vanilles > 1 ? 's' : ''}</i></span>
        <span className="zarlor" title="Zarlor">{j.zarlor} <i>zarlor</i></span>
      </span>
      {actif && <span className="joue">joue</span>}
    </>
  )
}

export default function Hud({ etat }) {
  if (!etat) return <div className="hud"><div className="chargement">Chargement de l'île…</div></div>
  const { phase, etape, pause, tour, tours, choixTours, de, pas, message, minijeu, ordre, classement, actif, joueurs } = etat
  const ja = actif !== null ? joueurs[actif] : null

  return (
    <div className="hud plateau">
      {phase !== 'reglages' && phase !== 'ordre' && phase !== 'annonceOrdre' && (
        <div className="chrono tour">Tour {tour}/{tours}</div>
      )}

      {phase !== 'reglages' && joueurs.map((j, i) => (
        <div key={i} className={`score fiche ${COINS[i]} ${actif === i ? 'actif' : ''}`} style={{ '--c': j.couleur }}>
          <Fiche j={j} actif={actif === i} />
        </div>
      ))}

      {phase === 'reglages' && (
        <div className="panneau">
          <h1>Nouvelle partie</h1>
          <p className="regle">Combien de tours&nbsp;?</p>
          <div className="choix-tours">
            {CONFIG.tours.map((t, i) => <span key={t} className={i === choixTours ? 'actif' : ''}>{t}</span>)}
          </div>
          <p className="duree">10 tours ≈ 25 minutes · chacun commence avec {CONFIG.zarlorDepart} zarlor</p>
          <p className="suite"><b>←&nbsp;→</b> choisir · <b>A</b> valider (J1)</p>
        </div>
      )}

      {(phase === 'ordre' || phase === 'annonceOrdre') && (
        <div className="panneau">
          <h1>Qui commence&nbsp;?</h1>
          <p className="regle">Chacun lance le dé&nbsp;: le plus haut joue en premier.</p>
          <div className="prets">
            {joueurs.map((j, i) => (
              <span key={i} className={`pret ${j.deOrdre ? 'ok' : ''}`} style={{ '--c': j.couleur }}>
                {j.nom} {j.deOrdre ? `: ${j.deOrdre}` : '— appuie sur A'}
              </span>
            ))}
          </div>
          {phase === 'annonceOrdre' && (
            <>
              <p className="regle">Ordre de jeu&nbsp;: {ordre.map((i) => joueurs[i].nom).join(', ')}</p>
              <p className="suite"><b>A</b> commencer</p>
            </>
          )}
        </div>
      )}

      {phase === 'tour' && ja && (
        <>
          {etape === 'lancer' && (
            <div className="bandeau" style={{ '--c': ja.couleur }}>
              <span className="de roule">{1 + Math.floor(Math.random() * CONFIG.de)}</span>
              <span><b>{ja.nom}</b>, appuie sur <b className="touche">A</b> pour lancer le dé</span>
            </div>
          )}
          {etape === 'de' && <div className="decompte de-resultat" key="de">{de}</div>}
          {(etape === 'pas' || etape === 'choix' || etape === 'achat') && <div className="pas-restants" style={{ '--c': ja.couleur }}>{pas}</div>}
          {etape === 'choix' && (
            <div className="bandeau" style={{ '--c': ja.couleur }}>
              <span>Embranchement&nbsp;! <b>Stick</b> choisir la route · <b className="touche">A</b> valider</span>
            </div>
          )}
          {etape === 'achat' && (
            <div className="panneau">
              <h1>La vanille&nbsp;!</h1>
              <p className="regle">{ja.nom}, acheter une gousse de vanille pour <b>{CONFIG.prixVanille} zarlor</b>&nbsp;?</p>
              <p className="suite"><b>A</b> acheter · <b>B</b> refuser</p>
            </div>
          )}
        </>
      )}

      {message && <div className="message">{message}</div>}

      {phase === 'annonceMinijeu' && (
        <div className="panneau">
          <h1>Mini-jeu&nbsp;!</h1>
          <p className="regle">{nomMinijeu(minijeu)}</p>
          <p className="suite"><b>A</b> c'est parti</p>
        </div>
      )}

      {phase === 'bilan' && (
        <div className="panneau">
          <h1>Fin du tour {tour}</h1>
          <ol className="classement">
            {joueurs.map((j, i) => (
              <li key={i} style={{ '--c': j.couleur }}>
                <span className="rang">J{i + 1}</span>
                <span className="nom">{j.nom}</span>
                <span className="pts">{j.vanilles} vanille{j.vanilles > 1 ? 's' : ''} · {j.zarlor} zarlor</span>
                <span className="zarlor">+{j.gain}</span>
              </li>
            ))}
          </ol>
          <p className="suite"><b>A</b> {tour >= tours ? 'voir le résultat' : 'tour suivant'}</p>
        </div>
      )}

      {phase === 'fin' && classement && (
        <div className="panneau">
          <h1>{joueurs.length === 1 ? 'Partie terminée !' : `${joueurs[classement[0].joueur].nom} gagne !`}</h1>
          <ol className="classement">
            {classement.map((c) => (
              <li key={c.joueur} style={{ '--c': joueurs[c.joueur].couleur }}>
                <span className="rang">{PLACES[c.place - 1]}</span>
                <span className="nom">{joueurs[c.joueur].nom}</span>
                <span className="pts">{c.zarlor} zarlor</span>
                <span className="zarlor">{c.vanilles} vanille{c.vanilles > 1 ? 's' : ''}</span>
              </li>
            ))}
          </ol>
          <p className="suite"><b>A</b> retour au salon</p>
        </div>
      )}

      {pause && (
        <div className="panneau">
          <h1>Pause</h1>
          <p>Appuie sur <b>Start</b> pour reprendre.</p>
          <p className="petit">Si une manette s'est déconnectée, rallume-la puis appuie sur Start.</p>
        </div>
      )}
    </div>
  )
}
