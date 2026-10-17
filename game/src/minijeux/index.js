// Mini-jeux disponibles, pour le salon et pour le tirage au sort du plateau.
import ForetDesHauts from './foret-des-hauts/ForetDesHauts.jsx'
import TiDiagonale from './ti-diagonale/TiDiagonale.jsx'
import Lagon from './lagon/Lagon.jsx'
import Volcan from './volcan/Volcan.jsx'

export const MINIJEUX = [
  { id: 'foret-des-hauts', nom: 'Sentier de Mafate', Composant: ForetDesHauts },
  { id: 'ti-diagonale', nom: 'La Ti Diagonale', Composant: TiDiagonale },
  { id: 'lagon', nom: 'Le trésor de La Buse', Composant: Lagon },
  { id: 'volcan', nom: 'Fuis la coulée', Composant: Volcan },
]
