// Mini-jeu « Fruits péi » (à la Perfect Match). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  ciel: '#bfe8f2',
  sol: '#2e6a7a',
  texte: {
    titre: 'Fruits péi',
    regle: 'Mémorise les fruits sur les dalles. Quand un fruit est annoncé, cours sur une de ses dalles : toutes les autres tombent dans le lagon !',
    commandes: [['Stick', 'se déplacer'], ['A', 'sauter'], ['B', 'pousser · attraper · lancer']],
    resume: '6 manches, de plus en plus rapides',
    unite: ['manche', 'manches'],
    chargement: 'Cueillette des fruits…',
  },
}

export default function Fruits(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
