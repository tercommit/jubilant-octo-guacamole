// Menu Start au doigt (logique partagée menu.js + affichage MenuPause.jsx).
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MenuPause from './MenuPause.jsx'
import { majPause, OPTIONS_MINIJEU, OPTIONS_PLATEAU } from './menu.js'
import { lireEntrees, majTactile, relacherTactile } from './entrees.js'
import { JOUEUR_TACTILE, reinitialiser } from '../test/outils.jsx'

const partie = () => ({ joueurs: JOUEUR_TACTILE, pause: false, menu: null })
const pas = (p, options = OPTIONS_MINIJEU) => { const evts = []; majPause(p, lireEntrees(), evts, options); return evts }
const appui = (p, champs, options) => { majTactile(champs); const e = pas(p, options); relacherTactile(); pas(p, options); return e }

beforeEach(reinitialiser)

describe('menu Start', () => {
  it('Start ouvre et referme le menu', () => {
    const p = partie()
    expect(appui(p, { start: true })).toEqual([{ type: 'pause', pause: true }])
    expect(p.menu.selection).toBe(0)
    appui(p, { start: true })
    expect(p.pause).toBe(false)
  })

  it('le stick avance d’un cran par poussée et boucle', () => {
    const p = partie()
    appui(p, { start: true })
    majTactile({ y: 1 }); pas(p); pas(p); pas(p)
    expect(p.menu.selection).toBe(1)
    relacherTactile(); pas(p)
    appui(p, { y: 1 })
    appui(p, { y: 1 })
    expect(p.menu.selection).toBe(0)
    appui(p, { y: -1 })
    expect(p.menu.selection).toBe(OPTIONS_MINIJEU.length - 1)
  })

  it('A valide l’option choisie', () => {
    const p = partie()
    appui(p, { start: true })
    appui(p, { y: 1 })
    expect(appui(p, { a: true })).toContainEqual({ type: 'passer' })
    const q = partie()
    appui(q, { start: true }, OPTIONS_PLATEAU)
    appui(q, { y: 1 }, OPTIONS_PLATEAU)
    expect(appui(q, { a: true }, OPTIONS_PLATEAU)).toContainEqual({ type: 'kit' })
    appui(q, { y: 1 }, OPTIONS_PLATEAU)
    appui(q, { a: true }, OPTIONS_PLATEAU)
    expect(q.pause).toBe(false)
  })

  it('affiche les options et met en avant la sélection', () => {
    render(<MenuPause menu={{ options: OPTIONS_MINIJEU, selection: 1 }} />)
    expect(screen.getByText('Pause')).toBeTruthy()
    expect(document.querySelector('li.actif').textContent).toContain('Passer le mini-jeu')
    expect(screen.queryByText(/déconnectée/)).toBeNull()
  })

  it('signale une manette déconnectée', () => {
    render(<MenuPause menu={{ options: OPTIONS_PLATEAU, selection: 0, deconnecte: true }} />)
    expect(screen.getByText(/manette est déconnectée/)).toBeTruthy()
  })
})
