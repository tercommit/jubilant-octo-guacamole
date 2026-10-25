// Préparation des tests (Vitest + jsdom) :
// - commandes tactiles forcées (?tactile), comme sur un téléphone ;
// - la toile 3D est simulée : <Canvas> ne rend que les boucles de jeu (composants « Boucle »),
//   et useFrame enregistre leurs rappels, que les tests déclenchent avec images() (voir outils.jsx).
import { useEffect, useRef } from 'react'
import { Children, isValidElement } from 'react'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

window.history.replaceState(null, '', '/?tactile')

vi.mock('@react-three/fiber', () => {
  const rappels = new Set()
  globalThis.__rappelsImage = rappels
  const boucles = (enfants) => Children.toArray(enfants).flatMap((e) => {
    if (!isValidElement(e)) return []
    if (typeof e.type === 'function' && e.type.name === 'Boucle') return [e]
    return typeof e.type === 'function' ? [] : boucles(e.props.children)
  })
  return {
    Canvas: ({ children }) => <>{boucles(children)}</>,
    useFrame(fn) {
      const ref = useRef(fn)
      ref.current = fn
      useEffect(() => {
        const r = (...args) => ref.current(...args)
        rappels.add(r)
        return () => rappels.delete(r)
      }, [])
    },
    useThree: () => ({}),
  }
})

vi.mock('@react-three/drei', () => ({
  View: Object.assign(({ children, ...props }) => <div data-testid="vue-3d" {...props} />, { Port: () => null }),
  MapControls: () => null,
  PerspectiveCamera: () => null,
  Clone: () => null,
  useGLTF: Object.assign(() => ({}), { preload: () => {} }),
  useTexture: () => ({}),
  useAnimations: () => ({}),
}))

afterEach(() => cleanup())
