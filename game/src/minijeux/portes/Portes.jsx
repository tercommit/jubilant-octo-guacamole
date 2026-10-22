// Mini-jeu « Les portes des cases » (à la Door Dash). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
    titre: 'Les portes des cases',
    regle: 'Fonce dans les portes des cases créoles : les vraies s’ouvrent, les fausses te renvoient en arrière ! Les premiers arrivés gagnent.',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'les premiers arrivés gagnent',
    unite: ['%', '%'],
    chargement: 'On ferme les portes…',
  },
}

export default function Portes(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
