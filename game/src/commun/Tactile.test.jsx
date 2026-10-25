import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Tactile from './Tactile.jsx'
import { ID_TACTILE, lireEntrees } from './entrees.js'
import { lacherStick, pousserStick, reinitialiser } from '../test/outils.jsx'

const tactile = () => lireEntrees().etats.get(ID_TACTILE)

beforeEach(reinitialiser)

describe('commandes tactiles à l’écran', () => {
  it('affiche le stick et les boutons A, B et Start', () => {
    render(<Tactile />)
    expect(screen.getByTestId('tactile-stick')).toBeTruthy()
    for (const b of ['A', 'B', 'Start']) expect(screen.getByRole('button', { name: `Bouton ${b}` })).toBeTruthy()
  })

  it('chaque bouton reste enfoncé tant que le doigt est posé', () => {
    render(<Tactile />)
    for (const [libelle, nom] of [['A', 'a'], ['B', 'b'], ['Start', 'start']]) {
      const bouton = screen.getByRole('button', { name: `Bouton ${libelle}` })
      fireEvent.pointerDown(bouton, { pointerId: 1 })
      expect(tactile()[nom]).toBe(true)
      expect(bouton.className).toContain('presse')
      fireEvent.pointerUp(bouton, { pointerId: 1 })
      expect(tactile()[nom]).toBe(false)
    }
  })

  it('le stick suit le doigt et revient au centre quand on le lâche', () => {
    render(<Tactile />)
    pousserStick(1, 0)
    expect(tactile().x).toBeCloseTo(1)
    expect(tactile().y).toBeCloseTo(0)
    fireEvent.pointerMove(screen.getByTestId('tactile-stick'), { pointerId: 2, clientX: 64, clientY: 64 - 200 })
    expect(tactile().x).toBeCloseTo(0)
    expect(tactile().y).toBeCloseTo(-1)
    lacherStick()
    expect(tactile()).toMatchObject({ x: 0, y: 0 })
  })

  it('un second doigt ne vole pas le stick', () => {
    render(<Tactile />)
    pousserStick(1, 0)
    const stick = screen.getByTestId('tactile-stick')
    fireEvent.pointerDown(stick, { pointerId: 9, clientX: 0, clientY: 64 })
    fireEvent.pointerMove(stick, { pointerId: 9, clientX: 0, clientY: 64 })
    expect(tactile().x).toBeCloseTo(1)
    fireEvent.pointerUp(stick, { pointerId: 9 })
    expect(tactile().x).toBeCloseTo(1)
  })

  it('tout est relâché quand la page perd le focus', () => {
    render(<Tactile />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Bouton A' }), { pointerId: 1 })
    pousserStick(0, 1)
    fireEvent.blur(window)
    expect(tactile()).toMatchObject({ x: 0, y: 0, a: false })
  })
})
