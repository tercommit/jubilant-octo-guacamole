import { beforeEach, describe, expect, it } from 'vitest'
import { ID_TACTILE, MODE_TACTILE, lireEntrees, majTactile, nomAppareil, relacherTactile } from './entrees.js'

beforeEach(() => { relacherTactile(); lireEntrees() })

describe('entrées tactiles', () => {
  it('l’écran tactile est un appareil connecté, comme une manette', () => {
    expect(MODE_TACTILE).toBe(true)
    const e = lireEntrees().etats.get(ID_TACTILE)
    expect(e).toMatchObject({ id: ID_TACTILE, x: 0, y: 0, a: false, b: false, start: false, connecte: true })
    expect(nomAppareil(ID_TACTILE)).toBe('Écran tactile')
  })

  it('le stick a une zone morte et ne dépasse pas 1', () => {
    majTactile({ x: 0.1, y: 0.1 })
    expect(lireEntrees().etats.get(ID_TACTILE)).toMatchObject({ x: 0, y: 0 })
    majTactile({ x: 3, y: 4 })
    const e = lireEntrees().etats.get(ID_TACTILE)
    expect(e.x).toBeCloseTo(0.6)
    expect(e.y).toBeCloseTo(0.8)
  })

  it('un appui donne un seul front, même maintenu', () => {
    majTactile({ a: true })
    expect(lireEntrees().appuis.get(ID_TACTILE).a).toBe(true)
    expect(lireEntrees().appuis.get(ID_TACTILE).a).toBe(false)
    expect(lireEntrees().etats.get(ID_TACTILE).a).toBe(true)
  })

  it('un appui très bref (entre deux images) n’est pas perdu', () => {
    majTactile({ start: true })
    majTactile({ start: false })
    const { etats, appuis } = lireEntrees()
    expect(etats.get(ID_TACTILE).start).toBe(false)
    expect(appuis.get(ID_TACTILE).start).toBe(true)
  })

  it('relâcher remet tout à zéro', () => {
    majTactile({ x: 1, b: true })
    relacherTactile()
    expect(lireEntrees().etats.get(ID_TACTILE)).toMatchObject({ x: 0, y: 0, b: false })
  })
})
