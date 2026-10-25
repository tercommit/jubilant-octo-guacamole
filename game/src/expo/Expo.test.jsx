import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Expo from './Expo.jsx'
import { JEUX } from './catalogue.js'

describe('expo des assets', () => {
  it('montre une vignette par modèle', () => {
    render(<Expo />)
    expect(screen.getByText('Expo des assets')).toBeTruthy()
    expect(screen.getAllByTestId('vue-3d').length).toBeGreaterThan(10)
  })

  it('les filtres par jeu répondent au doigt', () => {
    render(<Expo />)
    const tout = screen.getAllByTestId('vue-3d').length
    const [, nom] = Object.entries(JEUX)[0]
    fireEvent.click(screen.getByRole('button', { name: nom }))
    expect(screen.getByRole('button', { name: nom }).className).toBe('actif')
    expect(screen.getAllByTestId('vue-3d').length).toBeLessThan(tout)
    expect(screen.queryByText('Textures retouchées')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tout' }))
    expect(screen.getAllByTestId('vue-3d').length).toBe(tout)
  })

  it('on fait tourner une vignette en la glissant au doigt', () => {
    render(<Expo />)
    const vue = screen.getAllByTestId('vue-3d')[0]
    vue.setPointerCapture = () => {}
    expect(() => {
      fireEvent.pointerDown(vue, { pointerId: 1, clientX: 10 })
      fireEvent.pointerMove(vue, { pointerId: 1, clientX: 60 })
      fireEvent.pointerUp(vue, { pointerId: 1 })
    }).not.toThrow()
  })
})
