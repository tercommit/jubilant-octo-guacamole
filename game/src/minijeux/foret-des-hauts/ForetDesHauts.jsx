// Mini-jeu « Sentier de Mafate » (Forêt des Hauts). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
import MinijeuArene from '../../commun/arene/MinijeuArene.jsx'
import { creerPartie, majPartie } from './logique.js'
import { CONFIG } from './config.js'
import { HAUT_SOL } from './carte.js'
import Arene from './Arene.jsx'
import { Balise } from './Scene.jsx'

function Decor({ partieRef }) {
  return (
    <>
      <Arene />
      <Balise partieRef={partieRef} />
    </>
  )
}

const JEU = {
  config: CONFIG,
  creerPartie,
  majPartie,
  Decor,
  hauteurEffets: HAUT_SOL,
  texte: {
    titre: 'Sentier de Mafate',
    regle: "Cours jusqu'à la balise avant les autres ! La forêt te ralentit, la ravine ne se traverse que par les ponts.",
    commandes: [['Stick', 'se déplacer'], ['A', 'sprint'], ['B', 'pousser · attraper · lancer']],
    resume: '1 balise = 1 point',
    unite: ['balise', 'balises'],
    chargement: 'Chargement du cirque…',
  },
}

export default function ForetDesHauts(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
