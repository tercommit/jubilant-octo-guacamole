// Mini-jeux disponibles, pour le salon et pour le tirage au sort du plateau.
import ForetDesHauts from './foret-des-hauts/ForetDesHauts.jsx'
import TiDiagonale from './ti-diagonale/TiDiagonale.jsx'

export const MINIJEUX = [
  { id: 'foret-des-hauts', nom: 'Sentier de Mafate', Composant: ForetDesHauts },
  { id: 'ti-diagonale', nom: 'La Ti Diagonale', Composant: TiDiagonale },
]
