// Avatars par défaut (voir avatars-reunion.pdf) et couleurs des joueurs.

export const COULEURS_JOUEURS = ['#E2453C', '#3C7DE2', '#F2C230', '#3CB95A']
export const NOMS_COULEURS = ['Rouge', 'Bleu', 'Jaune', 'Vert']

export const AVATARS = [
  {
    id: 'yab', nom: 'Ti Paul', fichier: 'avatars/Cowboy_Male.gltf',
    couleurs: { Skin: '#EBC6A4', HatBrown: '#C9A25A', HatLightBrown: '#E3C77E', Jacket: '#5B7FA6', Top: '#F1EDE2',
      Scarf: '#B23A3A', Pants: '#5C4A3A', Hair: '#6B4A2E' },
  },
  {
    id: 'chinois', nom: 'Mei-Ling', fichier: 'avatars/Kimono_Female.gltf',
    couleurs: { Skin: '#E6BE96', Clothes: '#B8262B', Band: '#E2B23C', Hair: '#1C1714' },
  },
  {
    id: 'kaf', nom: 'Firmin', fichier: 'avatars/Casual2_Male.gltf',
    couleurs: { Skin: '#6E4530', Shirt: '#E4B43A', Pants: '#2F4F3A', Belt: '#4A2E1C', Hair: '#1A1310' },
  },
  {
    id: 'malbar', nom: 'Priya', fichier: 'avatars/Casual_Female.gltf',
    couleurs: { Skin: '#8C5A3C', Shirt: '#E08A1E', Pants: '#5B2A6E', Belt: '#C79A2E', Hair: '#16110E' },
  },
]

export const url = (chemin) => `${import.meta.env.BASE_URL}assets/${chemin}`
