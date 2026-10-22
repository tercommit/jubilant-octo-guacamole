// Mini-jeu « Les galets traîtres » (à la Tip Toe). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
import MinijeuArene from '../../commun/arene/MinijeuArene.jsx'
import { cameraCourse } from '../../commun/saut/cameras.jsx'
import { creerPartie, majPartie, PISTE } from './logique.js'
import { CONFIG } from './config.js'
import Decor from './Decor.jsx'

const JEU = {
  config: CONFIG,
  creerPartie,
  majPartie,
  Decor,
  Camera: cameraCourse(PISTE),
  brume: [40, 120],
  ciel: '#bfe3ef',
  sol: '#3d5a2a',
  texte: {
    titre: 'Les galets traîtres',
    regle: 'Traverse la ravine sur les galets… mais un seul chemin est solide : les faux galets s’enfoncent dès qu’on marche dessus !',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'les premiers arrivés gagnent',
    unite: ['%', '%'],
    chargement: 'On pose les galets…',
  },
}

export default function Galets(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
