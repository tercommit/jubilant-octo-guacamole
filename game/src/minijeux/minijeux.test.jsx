// Chaque mini-jeu se joue entièrement au doigt : rejoindre, mettre en pause, passer, finir, rejouer.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MINIJEUX } from './index.js'
import Tactile from '../commun/Tactile.jsx'
import { lireEntrees, majTactile, relacherTactile } from '../commun/entrees.js'
import { JOUEUR_TACTILE, attendre, images, lacherStick, pousserStick, reinitialiser, toucher } from '../test/outils.jsx'

// Logique pure de chaque mini-jeu (mêmes identifiants que MINIJEUX)
const LOGIQUES = import.meta.glob('./*/logique.js', { eager: true })
const logique = (id) => LOGIQUES[`./${id}/logique.js`]

function jouer(Composant, props = {}) {
  const onTermine = vi.fn()
  render(<><Composant joueurs={JOUEUR_TACTILE} onTermine={onTermine} {...props} /><Tactile /></>)
  images(10) // le HUD se rafraîchit toutes les 0,1 s
  return onTermine
}

/** Règles → A (prêt) → compte à rebours → jeu */
function demarrer() {
  expect(screen.getByText(/appuie sur A/)).toBeTruthy()
  toucher('A')
  // seul joueur prêt : le compte à rebours part aussitôt
  expect(document.querySelector('.decompte').textContent).toBe('3')
  attendre(3.2)
  expect(screen.getByText(/Partez/)).toBeTruthy()
}

/** Générateur pseudo-aléatoire reproductible */
const graine = (s = 1) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646

beforeEach(reinitialiser)

describe.each(MINIJEUX)('$nom ($id)', ({ id, nom, Composant }) => {
  it('affiche les règles et démarre quand le joueur tactile appuie sur A', () => {
    jouer(Composant)
    expect(screen.getAllByText(nom).length).toBeGreaterThan(0)
    demarrer()
  })

  it('Start ouvre le menu, le stick le parcourt, A reprend la partie', () => {
    jouer(Composant)
    demarrer()
    toucher('Start')
    expect(screen.getByText('Pause')).toBeTruthy()
    const actif = () => document.querySelector('.menu-pause li.actif').textContent
    expect(actif()).toContain('Reprendre')
    pousserStick(0, 1); images(1); lacherStick(); images(8)
    expect(actif()).toContain('Passer le mini-jeu')
    pousserStick(0, -1); images(1); lacherStick(); images(8)
    expect(actif()).toContain('Reprendre')
    toucher('A')
    images(8)
    expect(screen.queryByText('Pause')).toBeNull()
  })

  it('le menu permet de passer le mini-jeu', () => {
    const onTermine = jouer(Composant)
    toucher('Start')
    pousserStick(0, 1); images(1); lacherStick(); images(8)
    toucher('A')
    expect(onTermine).toHaveBeenCalledWith([expect.objectContaining({ passe: true, zarlor: 0 })], 'passer')
  })

  it('va jusqu’à l’écran de fin, puis A pour rejouer', () => {
    const onTermine = jouer(Composant)
    demarrer()
    images(2400, 0.05) // 120 s : plus long que tous les mini-jeux
    expect(document.querySelector('.classement')).toBeTruthy()
    expect(screen.getByText(/rejouer/)).toBeTruthy()
    toucher('A')
    expect(onTermine).toHaveBeenCalledWith(expect.any(Array), 'rejouer')
    expect(onTermine.mock.calls[0][0][0]).toMatchObject({ joueur: 0, place: 1 })
  })

  it('B à l’écran de fin ramène au salon', () => {
    const onTermine = jouer(Composant)
    demarrer()
    images(2400, 0.05)
    toucher('B')
    expect(onTermine).toHaveBeenCalledWith(expect.any(Array), 'menu')
  })

  it('lancé depuis le plateau, l’écran de fin propose le retour au plateau', () => {
    jouer(Composant, { enPartie: true })
    demarrer()
    images(2400, 0.05)
    expect(screen.getByText(/retour au plateau/)).toBeTruthy()
  })

  it('le stick tactile déplace le joueur', () => {
    const { creerPartie, majPartie } = logique(id)
    const parties = [creerPartie(JOUEUR_TACTILE, graine()), creerPartie(JOUEUR_TACTILE, graine())]
    const pas = (p) => majPartie(p, 1 / 60, lireEntrees())
    for (const p of parties) {
      majTactile({ a: true }); pas(p); relacherTactile()
      for (let i = 0; i < 4 * 60 && p.phase !== 'jeu'; i++) pas(p)
      expect(p.phase).toBe('jeu')
    }
    // même partie, avec et sans stick : seul le stick fait la différence
    const [avec, sans] = parties
    for (let i = 0; i < 30; i++) {
      majTactile({ x: 0.7, y: -0.7 }); pas(avec)
      relacherTactile(); pas(sans)
    }
    const [a, b] = [avec.joueurs[0], sans.joueurs[0]]
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(0.2)
  })
})
