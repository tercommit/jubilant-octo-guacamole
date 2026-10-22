// Interface commune des mini-jeux à points (DOM par-dessus le canvas).
// `texte` : { titre, regle, commandes: [[touche, action]], resume, unite: [singulier, pluriel], chargement }
// Le jeu peut aussi écrire p.annonce (bandeau sous le chrono), j.affiche (score affiché à la place des points)
// et, dans le classement, detail (ligne de l'écran de fin à la place des points).
import MenuPause from '../MenuPause.jsx'

const COINS = ['coin-hg', 'coin-hd', 'coin-bg', 'coin-bd']
const PLACES = ['1er', '2e', '3e', '4e']

export default function HudPoints({ etat, texte, enPartie }) {
  if (!etat) return <div className="hud"><div className="chargement">{texte.chargement}</div></div>
  const { phase, menu, temps, duree, decompte, joueurs, classement, finPrete, annonce } = etat
  const unite = (n) => texte.unite[n > 1 ? 1 : 0]

  return (
    <div className="hud">
      {phase !== 'regles' && (
        <div className={`chrono ${temps <= 10 && phase === 'jeu' ? 'urgent' : ''}`}>{Math.ceil(temps)}</div>
      )}
      {phase === 'jeu' && annonce && <div className="annonce">{annonce}</div>}

      {joueurs.map((j, i) => (
        <div key={i} className={`score ${COINS[i]}`} style={{ '--c': j.couleur }}>
          <span className="pastille" />
          <span className="nom">{j.nom}</span>
          <span className="points">{j.affiche ?? (j.elimine ? '✗' : j.points)}</span>
        </div>
      ))}

      {phase === 'regles' && !menu && (
        <div className="panneau">
          <h1>{texte.titre}</h1>
          <p className="regle">{texte.regle}</p>
          <div className="commandes">
            {texte.commandes.map(([touche, action]) => <span key={touche}><b>{touche}</b> {action}</span>)}
            <span><b>Start</b> menu</span>
          </div>
          <p className="duree">{duree} secondes · {texte.resume}</p>
          <div className="prets">
            {joueurs.map((j, i) => (
              <span key={i} className={`pret ${j.pret ? 'ok' : ''}`} style={{ '--c': j.couleur }}>
                {j.nom} {j.pret ? '✓ prêt' : '— appuie sur A'}
              </span>
            ))}
          </div>
        </div>
      )}

      {phase === 'decompte' && !menu && <div className="decompte" key={Math.ceil(decompte)}>{Math.ceil(decompte)}</div>}
      {phase === 'jeu' && duree - temps < 0.8 && <div className="decompte partez">Partez&nbsp;!</div>}

      {menu && <MenuPause menu={menu} />}

      {phase === 'fin' && classement && (
        <div className="panneau">
          <h1>{temps > 0 ? 'Terminé\u00a0!' : 'Temps écoulé\u00a0!'}</h1>
          <ol className="classement">
            {classement.map((c) => (
              <li key={c.joueur} style={{ '--c': joueurs[c.joueur].couleur }}>
                <span className="rang">{PLACES[c.place - 1]}</span>
                <span className="nom">{joueurs[c.joueur].nom}</span>
                <span className="pts">{c.detail ?? <>{c.points} {unite(c.points)}{c.elimine && ' · éliminé'}</>}</span>
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

/** Instantané de l'état pour le HUD (appelé ~10 fois par seconde). */
export function etatHud(p, config, nomJoueur) {
  return {
    phase: p.phase, menu: p.menu && { ...p.menu }, temps: p.temps, duree: config.duree, decompte: p.decompte, annonce: p.annonce,
    classement: p.classement, finPrete: (p.finDepuis ?? 0) > 1.5,
    joueurs: p.joueurs.map((j) => ({
      points: j.points, pret: j.pret, couleur: j.couleur, nom: nomJoueur(j.index), elimine: j.elimine != null, affiche: j.affiche,
    })),
  }
}
