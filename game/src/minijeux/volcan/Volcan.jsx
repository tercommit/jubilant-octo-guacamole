// Mini-jeu « Fuis la coulée » (Volcan). Voir commun/arene/MinijeuArene.jsx pour l'entrée et la sortie.
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
  ciel: '#c9a99a',
  sol: '#4a2a1a',
  texte: {
    titre: 'Fuis la coulée',
    regle: "La lave sort du cratère : si tu la touches, tu es éliminé ! Ramasse les pièces et gare aux bombes volcaniques.",
    commandes: [['Stick', 'se déplacer'], ['A', 'sprint'], ['B', 'pousser · attraper · lancer']],
    resume: 'les survivants sont classés aux pièces',
    unite: ['pièce', 'pièces'],
    chargement: 'Chargement du volcan…',
  },
}

export default function Volcan(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
