// Mini-jeu « Les dalles de la Fournaise » (à la Hex-A-Gone). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  Camera: cameraArene({ rayon: 8, suivreY: true }),
  ciel: '#3a2a2e',
  sol: '#5a2a1a',
  texte: {
    titre: 'Les dalles de la Fournaise',
    regle: 'Chaque dalle touchée se fissure puis tombe. Saute, change d’étage… le dernier debout au-dessus de la lave gagne !',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'le dernier debout gagne',
    unite: ['étage', 'étages'],
    chargement: 'Chargement des dalles…',
  },
}

export default function Dalles(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
