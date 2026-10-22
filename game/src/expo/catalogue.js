// Catalogue de l'expo : les modèles et textures réellement utilisés par le jeu, rangés par pack.
// `jeux` : où l'asset apparaît (identifiants de JEUX) ; `texture` : texture de remplacement appliquée en jeu.
import { AVATARS, AVATARS_KAYKIT } from '../commun/avatars.js'

export const JEUX = {
  plateau: 'Plateau',
  'foret-des-hauts': 'Sentier de Mafate',
  'ti-diagonale': 'La Ti Diagonale',
  lagon: 'Le trésor de La Buse',
  volcan: 'Fuis la coulée',
  galets: 'Les galets traîtres',
  portes: 'Les portes des cases',
  bascules: 'Les bascules',
  cerceaux: 'Les cerceaux du lagon',
  margouillat: 'La queue du margouillat',
}
const PARTOUT = Object.keys(JEUX)

const TEX_KENNEY = 'kenney-hex/Textures/colormap-tropique.png'
const TEX_KAYKIT = 'kaykit/hexagons_medieval-tropique.png'

export const PACKS = [
  {
    id: 'quaternius', nom: 'Ultimate Animated Character Pack', auteur: 'Quaternius',
    lien: 'https://quaternius.com/packs/ultimatedanimatedcharacter.html', licence: 'CC0',
    note: 'Kit de personnages « Quaternius » : chaque matériau est recoloré en jeu (voir avatars-reunion.pdf).',
    avatars: AVATARS.map((a) => ({ ...a, kit: 'quaternius', jeux: PARTOUT })),
  },
  {
    id: 'kaykit-adventurers', nom: 'KayKit Adventurers', auteur: 'Kay Lousberg',
    lien: 'https://kaylousberg.itch.io/kaykit-adventurers', licence: 'CC0',
    note: 'Kit de personnages « KayKit » : textures péi repeintes (voir avatars-reunion2.pdf), animations du squelette Rig_Medium.',
    avatars: AVATARS_KAYKIT.map((a, i) => ({ ...a, jeux: i < 4 ? PARTOUT : [] })),
  },
  {
    id: 'kaykit', nom: 'KayKit Medieval Hexagon Pack', auteur: 'Kay Lousberg',
    lien: 'https://kaylousberg.itch.io/kaykit-medieval-hexagon', licence: 'CC0',
    note: 'Montagnes et collines de la forêt des Hauts, avec la texture recolorée en vert tropical.',
    modeles: [
      { fichier: 'kaykit/mountain_A_grass_trees.gltf', nom: 'Montagne boisée A', texture: TEX_KAYKIT, jeux: ['foret-des-hauts'] },
      { fichier: 'kaykit/mountain_B_grass_trees.gltf', nom: 'Montagne boisée B', texture: TEX_KAYKIT, jeux: ['foret-des-hauts'] },
      { fichier: 'kaykit/hills_A_trees.gltf', nom: 'Collines boisées', texture: TEX_KAYKIT, jeux: ['foret-des-hauts'] },
      { fichier: 'kaykit/trees_B_medium.gltf', nom: 'Bosquet', texture: TEX_KAYKIT, jeux: ['foret-des-hauts'] },
    ],
  },
  {
    id: 'kenney-hex', nom: 'Hexagon Kit', auteur: 'Kenney',
    lien: 'https://kenney.nl/assets/hexagon-kit', licence: 'CC0',
    note: 'Tuiles hexagonales des arènes. Celles de la forêt prennent la texture « tropique ».',
    modeles: [
      { fichier: 'kenney-hex/grass.glb', nom: 'Herbe', texture: TEX_KENNEY, jeux: ['foret-des-hauts'] },
      { fichier: 'kenney-hex/grass-forest.glb', nom: 'Forêt', texture: TEX_KENNEY, jeux: ['foret-des-hauts'] },
      { fichier: 'kenney-hex/river-straight.glb', nom: 'Ravine', texture: TEX_KENNEY, jeux: ['foret-des-hauts'] },
      { fichier: 'kenney-hex/bridge.glb', nom: 'Passerelle', texture: TEX_KENNEY, jeux: ['foret-des-hauts'] },
      { fichier: 'kenney-hex/sand.glb', nom: 'Sable', jeux: ['lagon'] },
      { fichier: 'kenney-hex/water.glb', nom: 'Eau', jeux: ['lagon'] },
      { fichier: 'kenney-hex/sand-rocks.glb', nom: 'Rochers', jeux: ['lagon'] },
      { fichier: 'kenney-hex/unit-ship.glb', nom: 'Bateau', jeux: ['lagon'] },
      { fichier: 'kenney-hex/building-dock.glb', nom: 'Ponton', jeux: ['lagon'] },
      { fichier: 'kenney-hex/stone.glb', nom: 'Pierre', jeux: ['volcan'] },
      { fichier: 'kenney-hex/stone-hill.glb', nom: 'Rocher', jeux: ['volcan'] },
      { fichier: 'kenney-hex/stone-mountain.glb', nom: 'Cratère', jeux: ['volcan'] },
    ],
  },
  {
    id: 'kenney-platformer', nom: 'Platformer Kit', auteur: 'Kenney',
    lien: 'https://kenney.nl/assets/platformer-kit', licence: 'CC0',
    note: 'Objets et décor : pièces, coffre, bombes, drapeaux, arbres.',
    modeles: [
      { fichier: 'kenney-platformer/coin-gold.glb', nom: 'Pièce (zarlor)', jeux: ['lagon', 'volcan'] },
      { fichier: 'kenney-platformer/chest.glb', nom: 'Coffre de La Buse', jeux: ['lagon'] },
      { fichier: 'kenney-platformer/bomb.glb', nom: 'Bombe volcanique', jeux: ['volcan'] },
      { fichier: 'kenney-platformer/flag.glb', nom: 'Balise', jeux: ['foret-des-hauts', 'ti-diagonale', 'galets', 'portes', 'bascules'] },
      { fichier: 'kenney-platformer/trap-spikes-large.glb', nom: 'Piège à pics', jeux: ['ti-diagonale'] },
      { fichier: 'kenney-platformer/tree.glb', nom: 'Arbre', jeux: ['plateau', 'ti-diagonale', 'portes', 'cerceaux', 'margouillat'] },
      { fichier: 'kenney-platformer/tree-pine.glb', nom: 'Filao', jeux: ['plateau', 'ti-diagonale', 'cerceaux', 'margouillat'] },
      { fichier: 'kenney-platformer/rocks.glb', nom: 'Cailloux', jeux: ['plateau', 'ti-diagonale'] },
      { fichier: 'kenney-platformer/grass.glb', nom: 'Touffe d’herbe', jeux: ['ti-diagonale'] },
      { fichier: 'kenney-platformer/flowers.glb', nom: 'Fleurs', jeux: ['ti-diagonale'] },
    ],
  },
]

// Textures retouchées pour le jeu, à côté de leur version d'origine quand elle existe
export const TEXTURES = [
  { nom: 'Hexagon Kit — vert tropical', avant: 'kenney-hex/Textures/colormap.png', apres: TEX_KENNEY },
  { nom: 'Medieval Hexagon — vert tropical', avant: 'kaykit/hexagons_medieval.png', apres: TEX_KAYKIT },
  ...AVATARS_KAYKIT.map((a) => ({ nom: `${a.nom} — version péi`, apres: a.texture })),
]
