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
    regle: "Ramasse les pièces pendant que la lave sort du cratère ! Marcher dans la lave fait perdre une pièce, et gare aux bombes volcaniques.",
    commandes: [['Stick', 'se déplacer'], ['A', 'sprint'], ['B', 'pousser · attraper · lancer']],
    resume: '1 pièce = 1 point · la lave en fait perdre 1',
    unite: ['pièce', 'pièces'],
    chargement: 'Chargement du volcan…',
  },
}

export default function Volcan(props) {
  return <MinijeuArene jeu={JEU} {...props} />
}
