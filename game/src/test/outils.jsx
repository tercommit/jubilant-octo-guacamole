// Outils des tests d'écran : appuyer sur les commandes tactiles et faire avancer le jeu image par image.
import { act, fireEvent, screen } from '@testing-library/react'
import { lireEntrees, relacherTactile } from '../commun/entrees.js'

let horloge = 0

/** Fait tourner `n` images de `dt` secondes (boucles useFrame du <Canvas> simulé). */
export function images(n = 1, dt = 1 / 60) {
  act(() => {
    for (let i = 0; i < n; i++) {
      horloge += dt
      for (const r of globalThis.__rappelsImage) r({ clock: { elapsedTime: horloge }, camera: {} }, dt)
    }
  })
}

/** Laisse passer `s` secondes de jeu. */
export const attendre = (s) => images(Math.ceil(s * 60))

/** Appui bref sur un bouton tactile (A, B ou Start), puis une image pour que le jeu le lise. */
export function toucher(libelle) {
  const bouton = screen.getByRole('button', { name: `Bouton ${libelle}` })
  fireEvent.pointerDown(bouton, { pointerId: 1 })
  fireEvent.pointerUp(bouton, { pointerId: 1 })
  images(1)
}

/** Pousse le stick tactile de (dx, dy) (de -1 à 1) et le garde poussé. */
export function pousserStick(dx, dy) {
  const stick = screen.getByTestId('tactile-stick')
  stick.getBoundingClientRect = () => ({ left: 0, top: 0, width: 128, height: 128, right: 128, bottom: 128 })
  fireEvent.pointerDown(stick, { pointerId: 2, clientX: 64 + dx * 48, clientY: 64 + dy * 48 })
}

/** Relâche le stick tactile. */
export function lacherStick() {
  fireEvent.pointerUp(screen.getByTestId('tactile-stick'), { pointerId: 2 })
}

/** Remet à zéro les commandes tactiles et les fronts mémorisés entre deux tests. */
export function reinitialiser() {
  relacherTactile()
  lireEntrees()
}

/** Le joueur unique d'un test : l'écran tactile. */
export const JOUEUR_TACTILE = [{ appareil: 'tactile', couleur: '#e63946' }]
