// Mini-jeu « La queue du margouillat » (à la Tail Tag). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
import MinijeuArene from '../../commun/arene/MinijeuArene.jsx'
import { cameraArene } from '../../commun/saut/cameras.jsx'
import { creerPartie, majPartie } from './logique.js'
import { CONFIG } from './config.js'
import Decor from './Decor.jsx'

const JEU = {
  config: CONFIG,
  creerPartie,
  majPartie,
  Decor,
  Camera: cameraArene({ rayon: 9.5 }),
  ciel: '#c6e6c0',
  sol: '#3d5a2a',
  texte: {
    titre: 'La queue du margouillat',
    regle: 'Vole les queues de margouillat avec B ! Chaque seconde avec une queue rapporte un point, et en avoir une à la fin rapporte 10 points de plus.',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'voler une queue · pousser']],
    resume: 'le plus de points gagne',
    unite: ['point', 'points'],
    chargement: 'Les margouillats se cachent…',
  },
}

export default function Margouillat(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
