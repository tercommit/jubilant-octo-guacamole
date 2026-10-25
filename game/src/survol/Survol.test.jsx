import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Survol from './Survol.jsx'

describe('survol du plateau', () => {
  it('explique les gestes au doigt et à la souris', () => {
    render(<Survol />)
    expect(screen.getByText('Survol du plateau')).toBeTruthy()
    expect(screen.getByText(/Un doigt : se déplacer/)).toBeTruthy()
    expect(screen.getByText(/Glisser : se déplacer/)).toBeTruthy()
    expect(screen.getByRole('link', { name: '← Jeu' }).getAttribute('href')).toBe('./')
  })

  it('le bouton « Tour auto » s’active et se coupe au doigt', () => {
    render(<Survol />)
    const bouton = screen.getByRole('button', { name: 'Tour auto' })
    expect(bouton.className).toBe('actif')
    fireEvent.click(bouton)
    expect(bouton.className).toBe('')
    fireEvent.click(bouton)
    expect(bouton.className).toBe('actif')
  })
})
