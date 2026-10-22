// Mini-jeu « Les vagues de Boucan » (à la Block Party). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  ciel: '#aee0f0',
  sol: '#2e6a7a',
  texte: {
    titre: 'Les vagues de Boucan',
    regle: 'Des murs d’eau déferlent sur la plage : glisse-toi dans les trous, saute les vagues basses… sinon tu finis dans le lagon !',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: 'le dernier sur la plage gagne',
    unite: ['point', 'points'],
    chargement: 'La houle se lève…',
  },
}

export default function Houle(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
