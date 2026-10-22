// Petite île ronde à plateformes, pour les mini-jeux « à la Fall Guys » où l'on marque des points.
// Les plateformes se montent d'un saut ; tomber à l'eau fait réapparaître au centre, sans élimination.
import { MARCHE } from './physique.js'

export const ILE = {
  rayon: 9,
  // { x, z, r (rayon), h (hauteur du dessus) }
  plateformes: [
    { x: 0, z: 0, r: 2, h: 1 },
    { x: -5.2, z: -3, r: 1.4, h: 0.9 },
    { x: 5.2, z: -3, r: 1.4, h: 0.9 },
    { x: 0, z: 5.6, r: 1.4, h: 0.9 },
  ],
}

const plateformeEn = (x, z, marge = 0) => ILE.plateformes.find((pl) => Math.hypot(x - pl.x, z - pl.z) <= pl.r + marge)

/** Monde de l'île pour commun/saut/physique.js. `config` : celle du mini-jeu ; `aleatoire` pour les réapparitions. */
export function mondeIle(config) {
  return {
    config,
    support(x, z, y) {
      const pl = plateformeEn(x, z)
      if (pl && pl.h <= y + MARCHE) return { y: pl.h }
      return Math.hypot(x, z) <= ILE.rayon && y > -0.6 ? { y: 0 } : null
    },
    // le flanc des plateformes fait mur : on les monte en sautant
    bloque(x, z, y) {
      const pl = plateformeEn(x, z, config.rayonJoueur * 0.8)
      return !!pl && pl.h > y + MARCHE
    },
    tombe(j) {
      const a = (j.index / 4) * Math.PI * 2 + 0.6
      Object.assign(j, { x: Math.sin(a) * 3.4, z: Math.cos(a) * 3.4, y: 2, vy: 0, kx: 0, kz: 0, sol: false, surface: null, etourdi: 0, invincible: 1.2 })
    },
  }
}
