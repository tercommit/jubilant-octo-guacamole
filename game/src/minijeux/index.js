// Mini-jeux disponibles, pour le salon et pour le tirage au sort du plateau.
import ForetDesHauts from './foret-des-hauts/ForetDesHauts.jsx'
import TiDiagonale from './ti-diagonale/TiDiagonale.jsx'
import Lagon from './lagon/Lagon.jsx'
import Volcan from './volcan/Volcan.jsx'
// À la Fall Guys
import Dalles from './dalles/Dalles.jsx'
import Fruits from './fruits/Fruits.jsx'
import Canne from './canne/Canne.jsx'
import Houle from './houle/Houle.jsx'
import Moulin from './moulin/Moulin.jsx'
import Galets from './galets/Galets.jsx'
import Portes from './portes/Portes.jsx'
import Bascules from './bascules/Bascules.jsx'
import Cerceaux from './cerceaux/Cerceaux.jsx'
import Margouillat from './margouillat/Margouillat.jsx'

export const MINIJEUX = [
  { id: 'foret-des-hauts', nom: 'Sentier de Mafate', Composant: ForetDesHauts },
  { id: 'ti-diagonale', nom: 'La Ti Diagonale', Composant: TiDiagonale },
  { id: 'lagon', nom: 'Le trésor de La Buse', Composant: Lagon },
  { id: 'volcan', nom: 'Fuis la coulée', Composant: Volcan },
  { id: 'dalles', nom: 'Les dalles de la Fournaise', Composant: Dalles },
  { id: 'fruits', nom: 'Fruits péi', Composant: Fruits },
  { id: 'canne', nom: 'Saute la canne', Composant: Canne },
  { id: 'houle', nom: 'Les vagues de Boucan', Composant: Houle },
  { id: 'moulin', nom: 'Le moulin à cannes', Composant: Moulin },
  { id: 'galets', nom: 'Les galets traîtres', Composant: Galets },
  { id: 'portes', nom: 'Les portes des cases', Composant: Portes },
  { id: 'bascules', nom: 'Les bascules', Composant: Bascules },
  { id: 'cerceaux', nom: 'Les cerceaux du lagon', Composant: Cerceaux },
  { id: 'margouillat', nom: 'La queue du margouillat', Composant: Margouillat },
]
