// Mini-jeu « Le trésor de La Buse » (Lagon). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
import MinijeuArene from '../../commun/arene/MinijeuArene.jsx'
import { creerPartie, majPartie } from './logique.js'
import { CONFIG } from './config.js'
import { HAUT_SOL } from './carte.js'
import Arene from './Arene.jsx'

const JEU = {
  config: CONFIG,
  creerPartie,
  majPartie,
  Decor: Arene,
  hauteurEffets: HAUT_SOL,
  ciel: '#8fd3f0',
  sol: '#e9d7a5',
  texte: {
    titre: 'Le trésor de La Buse',
    regle: "Ramasse les pièces d'or avant que la marée ne recouvre l'îlot ! Dans l'eau, on avance moins vite.",
    commandes: [['Stick', 'se déplacer'], ['A', 'sprint'], ['B', 'pousser · attraper · lancer']],
    resume: `1 pièce = 1 point · le coffre vaut ${CONFIG.coffre.valeur}`,
    unite: ['pièce', 'pièces'],
    chargement: 'Chargement du lagon…',
  },
}

export default function Lagon(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
