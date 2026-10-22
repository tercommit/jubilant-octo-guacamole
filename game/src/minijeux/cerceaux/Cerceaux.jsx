// Mini-jeu « Les cerceaux du lagon » (à la Hoopsie Daisy). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  ciel: '#aee0f0',
  sol: '#2e6a7a',
  texte: {
    titre: 'Les cerceaux du lagon',
    regle: 'Passe à travers les cerceaux : 1 point le rose, 3 points le doré perché au-dessus d’une plateforme. Saute pour les attraper !',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'le plus de points gagne',
    unite: ['point', 'points'],
    chargement: 'On accroche les cerceaux…',
  },
}

export default function Cerceaux(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
