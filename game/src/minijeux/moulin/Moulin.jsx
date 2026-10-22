// Mini-jeu « Le moulin à cannes » (à la Roll Out). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  Camera: cameraArene({ rayon: 7.5 }),
  ciel: '#d9e8ef',
  sol: '#6b4a2e',
  texte: {
    titre: 'Le moulin à cannes',
    regle: 'Les rouleaux du moulin tournent sous tes pieds, chacun dans son sens. Évite les trous, reste en haut… et ne finis pas dans la cuve de vesou !',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'le dernier sur les rouleaux gagne',
    unite: ['point', 'points'],
    chargement: 'Le moulin se met en route…',
  },
}

export default function Moulin(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
