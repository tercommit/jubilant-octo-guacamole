// Salon : on rejoint, on choisit et on lance au doigt ; les manettes restent possibles à côté.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App.jsx'
import { kitActuel, nomKit } from './commun/kit.js'
import { images, lacherStick, pousserStick, reinitialiser, toucher } from './test/outils.jsx'

const place = (n) => screen.getByText(`J${n}`).closest('.place')
const modeActif = () => document.querySelector('.choix-minijeu .actif').textContent

/** Fausse manette standard (Gamepad API) : boutons[0] = A, boutons[9] = Start. */
function brancherManette() {
  const pad = { index: 0, id: 'Manette test', connected: true, axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false })) }
  navigator.getGamepads = () => [pad]
  return {
    appuyer: async (i) => {
      pad.buttons[i].pressed = true
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      pad.buttons[i].pressed = false
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    },
  }
}

beforeEach(reinitialiser)
afterEach(() => { delete navigator.getGamepads })

describe('salon', () => {
  it('affiche les commandes tactiles et explique comment rejoindre au doigt', () => {
    render(<App />)
    expect(screen.getByTestId('tactile')).toBeTruthy()
    expect(screen.getByText(/ou de l’écran pour rejoindre/)).toBeTruthy()
    expect(screen.getByText(/Au doigt : stick à gauche/)).toBeTruthy()
  })

  it('A rejoint la partie, B rend la place', async () => {
    render(<App />)
    toucher('A')
    await waitFor(() => expect(place(1).textContent).toContain('Écran tactile'))
    expect(place(1).className).toContain('prise')
    toucher('B')
    await waitFor(() => expect(place(1).className).not.toContain('prise'))
  })

  it('J1 choisit le mode au stick (gauche / droite) et le kit (haut / bas)', async () => {
    render(<App />)
    toucher('A')
    await waitFor(() => expect(place(1).textContent).toContain('Écran tactile'))
    expect(modeActif()).toBe('Partie sur le plateau')
    pousserStick(1, 0)
    await waitFor(() => expect(modeActif()).toBe('Sentier de Mafate'))
    lacherStick()
    pousserStick(-1, 0)
    await waitFor(() => expect(modeActif()).toBe('Partie sur le plateau'))
    lacherStick()
    const avant = kitActuel()
    pousserStick(0, 1)
    await waitFor(() => expect(kitActuel()).not.toBe(avant))
    lacherStick()
    expect(screen.getByText(nomKit())).toBeTruthy()
  })

  it('les boutons du salon répondent au doigt', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Les bascules' }))
    expect(modeActif()).toBe('Les bascules')
  })

  it('Start lance la partie sur le plateau, avec les commandes tactiles', async () => {
    render(<App />)
    toucher('A')
    await waitFor(() => expect(place(1).textContent).toContain('Écran tactile'))
    toucher('Start')
    await waitFor(() => expect(document.querySelector('.salon')).toBeNull())
    images(10)
    expect(screen.getByText('Nouvelle partie')).toBeTruthy()
    expect(screen.getByTestId('tactile')).toBeTruthy()
  })

  it('Start lance le mini-jeu choisi', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Fuis la coulée' }))
    toucher('A')
    await waitFor(() => expect(place(1).textContent).toContain('Écran tactile'))
    toucher('Start')
    await waitFor(() => expect(document.querySelector('.salon')).toBeNull())
    images(10)
    expect(screen.getByText('Fuis la coulée')).toBeTruthy()
  })

  it('manette et écran tactile jouent ensemble', async () => {
    const manette = brancherManette()
    render(<App />)
    await manette.appuyer(0)
    await waitFor(() => expect(place(1).textContent).toContain('Manette test'))
    toucher('A')
    await waitFor(() => expect(place(2).textContent).toContain('Écran tactile'))
  })

  it('en partie sans le joueur tactile, les commandes tactiles disparaissent', async () => {
    const manette = brancherManette()
    render(<App />)
    await manette.appuyer(0)
    await waitFor(() => expect(place(1).textContent).toContain('Manette test'))
    await manette.appuyer(9)
    await waitFor(() => expect(document.querySelector('.salon')).toBeNull())
    expect(screen.queryByTestId('tactile')).toBeNull()
  })
})
