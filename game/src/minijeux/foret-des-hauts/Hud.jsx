// Interface du mini-jeu (DOM par-dessus le canvas).
import { CONFIG } from './config.js'

const COINS = ['coin-hg', 'coin-hd', 'coin-bg', 'coin-bd']
const PLACES = ['1er', '2e', '3e', '4e']

export default function Hud({ etat, enPartie }) {
  if (!etat) return <div className="hud"><div className="chargement">Chargement du cirque…</div></div>
  const { phase, pause, temps, decompte, joueurs, classement, finPrete } = etat

  return (
    <div className="hud">
      {phase !== 'regles' && (
        <div className={`chrono ${temps <= 10 && phase === 'jeu' ? 'urgent' : ''}`}>{Math.ceil(temps)}</div>
      )}

      {joueurs.map((j, i) => (
        <div key={i} className={`score ${COINS[i]}`} style={{ '--c': j.couleur }}>
          <span className="pastille" />
          <span className="nom">{j.nom}</span>
          <span className="points">{j.points}</span>
        </div>
      ))}

      {phase === 'regles' && (
        <div className="panneau">
          <h1>Sentier de Mafate</h1>
          <p className="regle">Cours jusqu'à la balise avant les autres&nbsp;! La forêt te ralentit, la ravine ne se traverse que par les ponts.</p>
          <div className="commandes">
            <span><b>Stick</b> se déplacer</span>
            <span><b>A</b> sprint</span>
            <span><b>Start</b> pause</span>
          </div>
          <p className="duree">{CONFIG.duree} secondes · 1 balise = 1 point</p>
          <div className="prets">
            {joueurs.map((j, i) => (
              <span key={i} className={`pret ${j.pret ? 'ok' : ''}`} style={{ '--c': j.couleur }}>
                {j.nom} {j.pret ? '✓ prêt' : '— appuie sur A'}
              </span>
            ))}
          </div>
        </div>
      )}

      {phase === 'decompte' && <div className="decompte" key={Math.ceil(decompte)}>{Math.ceil(decompte)}</div>}
      {phase === 'jeu' && CONFIG.duree - temps < 0.8 && <div className="decompte partez">Partez&nbsp;!</div>}

      {pause && (
        <div className="panneau">
          <h1>Pause</h1>
          <p>Appuie sur <b>Start</b> pour reprendre.</p>
          <p className="petit">Si une manette s'est déconnectée, rallume-la puis appuie sur Start.</p>
        </div>
      )}

      {phase === 'fin' && classement && (
        <div className="panneau">
          <h1>Temps écoulé&nbsp;!</h1>
          <ol className="classement">
            {classement.map((c) => (
              <li key={c.joueur} style={{ '--c': joueurs[c.joueur].couleur }}>
                <span className="rang">{PLACES[c.place - 1]}</span>
                <span className="nom">{joueurs[c.joueur].nom}</span>
                <span className="pts">{c.points} balise{c.points > 1 ? 's' : ''}</span>
                <span className="zarlor">+{c.zarlor} zarlor</span>
              </li>
            ))}
          </ol>
          {finPrete && (enPartie
            ? <p className="suite"><b>A</b> retour au plateau</p>
            : <p className="suite"><b>A</b> rejouer · <b>B</b> changer de joueurs</p>)}
        </div>
      )}
    </div>
  )
}
