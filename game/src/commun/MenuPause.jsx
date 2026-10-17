// Affichage du menu Start (voir menu.js).
import { useKit, nomKit } from './kit.js'

export default function MenuPause({ menu }) {
  const kit = useKit()
  const autre = kit === 'quaternius' ? 'kaykit' : 'quaternius'
  const LIBELLES = {
    reprendre: ['Reprendre', null],
    passer: ['Passer le mini-jeu', 'Personne ne gagne de zarlor'],
    kit: [`Personnages : ${nomKit(kit)}`, `Passer au kit ${nomKit(autre)}`],
  }
  return (
    <div className="panneau menu-pause">
      <h1>Pause</h1>
      <ul className="menu">
        {menu.options.map((o, i) => (
          <li key={o} className={i === menu.selection ? 'actif' : ''}>
            <span>{LIBELLES[o][0]}</span>
            {LIBELLES[o][1] && <small>{LIBELLES[o][1]}</small>}
          </li>
        ))}
      </ul>
      <p className="petit">
        <b>Stick</b> haut / bas · <b>A</b> valider · <b>Start</b> reprendre
      </p>
      {menu.deconnecte && <p className="alerte">Une manette est déconnectée : rallume-la pour reprendre.</p>}
    </div>
  )
}
