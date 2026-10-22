// Mini-jeu « Les bascules » (à la See Saw). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  ciel: '#cfe9f5',
  sol: '#3d5a2a',
  texte: {
    titre: 'Les bascules',
    regle: 'Traverse l’étang de Saint-Paul sur les bascules : elles penchent sous ton poids… et sous celui des autres ! Les premiers arrivés gagnent.',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'les premiers arrivés gagnent',
    unite: ['%', '%'],
    chargement: 'On installe les bascules…',
  },
}

export default function Bascules(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
