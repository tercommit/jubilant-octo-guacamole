// Le plateau se joue au doigt : réglages, ordre de jeu, dé, embranchements, vanille, menu, bilan et fin.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Plateau from './Plateau.jsx'
import Tactile from '../commun/Tactile.jsx'
import { creerPlateau, finMinijeu } from './logique.js'
import { MINIJEUX } from '../minijeux/index.js'
import { JOUEUR_TACTILE, attendre, images, lacherStick, pousserStick, reinitialiser, toucher } from '../test/outils.jsx'

function ouvrir(p = creerPlateau(JOUEUR_TACTILE, MINIJEUX.map((m) => m.id))) {
  const plateauRef = { current: p }
  const onMinijeu = vi.fn()
  const onQuitter = vi.fn()
  render(<><Plateau plateauRef={plateauRef} onMinijeu={onMinijeu} onQuitter={onQuitter} /><Tactile /></>)
  images(10)
  return { p, onMinijeu, onQuitter }
}

const toursActif = () => document.querySelector('.choix-tours .actif').textContent

/** Réglages → ordre → premier tour */
function commencer() {
  toucher('A') // 10 tours
  attendre(0.5)
  toucher('A') // dé d'ordre
  expect(screen.getByText(/Ordre de jeu/)).toBeTruthy()
  attendre(1.1)
  toucher('A')
  attendre(0.5)
}

beforeEach(reinitialiser)

describe('plateau', () => {
  it('J1 choisit le nombre de tours au stick et valide avec A', () => {
    const { p } = ouvrir()
    expect(screen.getByText('Nouvelle partie')).toBeTruthy()
    expect(toursActif()).toBe('10')
    pousserStick(1, 0); images(1); lacherStick(); images(8)
    expect(toursActif()).toBe('15')
    pousserStick(-1, 0); images(1); lacherStick(); images(8)
    expect(toursActif()).toBe('10')
    toucher('A')
    expect(p.tours).toBe(10)
    images(8)
    expect(screen.getByText('Qui commence ?')).toBeTruthy()
  })

  it('A lance le dé, le pion avance jusqu’au mini-jeu', () => {
    const { p, onMinijeu } = ouvrir()
    commencer()
    expect(screen.getByText(/pour lancer le dé/)).toBeTruthy()
    const depart = p.joueurs[0].case
    toucher('A')
    expect(p.de).toBeGreaterThan(0)
    // on avance : A aux embranchements, B pour refuser la vanille
    for (let i = 0; i < 2000 && p.phase === 'tour'; i++) {
      if (p.etape === 'choix') { pousserStick(1, 0); images(1); lacherStick(); toucher('A') }
      else if (p.etape === 'achat') toucher('B')
      else images(1)
    }
    expect(p.joueurs[0].case).not.toBe(depart)
    expect(p.phase).toBe('annonceMinijeu')
    images(8)
    expect(screen.getByText('Mini-jeu !')).toBeTruthy()
    attendre(1.1)
    toucher('A')
    expect(onMinijeu).toHaveBeenCalledWith(p.minijeu)
  })

  it('A achète la vanille quand on a assez de zarlor', () => {
    const p = creerPlateau(JOUEUR_TACTILE, ['lagon'])
    ouvrir(p)
    commencer()
    p.joueurs[0].zarlor = 50
    p.etape = 'achat'
    images(8)
    expect(screen.getByText('La vanille !')).toBeTruthy()
    toucher('A')
    expect(p.joueurs[0]).toMatchObject({ vanilles: 1, zarlor: 30 })
  })

  it('Start ouvre le menu du plateau ; on y change de kit et on reprend', () => {
    const { p } = ouvrir()
    commencer()
    toucher('Start')
    images(8)
    expect(screen.getByText('Pause')).toBeTruthy()
    pousserStick(0, 1); images(1); lacherStick(); images(8)
    expect(document.querySelector('.menu-pause li.actif').textContent).toContain('Personnages')
    toucher('A')
    pousserStick(0, -1); images(1); lacherStick()
    toucher('A')
    images(8)
    expect(p.pause).toBe(false)
    expect(screen.queryByText('Pause')).toBeNull()
  })

  it('à l’annonce du mini-jeu, le menu permet de le passer', () => {
    const p = creerPlateau(JOUEUR_TACTILE, ['lagon'])
    ouvrir(p)
    commencer()
    Object.assign(p, { phase: 'annonceMinijeu', minijeu: 'lagon', etape: null })
    toucher('Start')
    pousserStick(0, 1); images(1); lacherStick()
    toucher('A')
    expect(p.phase).toBe('bilan')
    images(8)
    expect(screen.getByText(/Mini-jeu passé/)).toBeTruthy()
  })

  it('bilan du dernier tour, résultat, puis retour au salon', () => {
    const p = creerPlateau(JOUEUR_TACTILE, ['lagon'])
    const { onQuitter } = ouvrir(p)
    commencer()
    p.tour = p.tours
    finMinijeu(p, [{ joueur: 0, place: 1, zarlor: 10 }])
    images(8)
    expect(screen.getByText(`Fin du tour ${p.tours}`)).toBeTruthy()
    attendre(1.1)
    toucher('A')
    images(8)
    expect(screen.getByText('Partie terminée !')).toBeTruthy()
    attendre(1.6)
    toucher('A')
    expect(onQuitter).toHaveBeenCalled()
  })
})
