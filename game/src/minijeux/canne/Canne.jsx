// Mini-jeu « Saute la canne » (à la Jump Club). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  Camera: cameraArene({ rayon: 8 }),
  ciel: '#cfe9f5',
  sol: '#4a6a2a',
  texte: {
    titre: 'Saute la canne',
    regle: 'Les cannes du moulin tournent de plus en plus vite : saute par-dessus la canne basse, mais pas sous la canne haute ! Le dernier sur la piste gagne.',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'le dernier debout gagne',
    unite: ['point', 'points'],
    chargement: 'Le moulin démarre…',
  },
}

export default function Canne(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
