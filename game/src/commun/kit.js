// Kit d'avatars choisi (Quaternius ou KayKit) : partagé par tout le jeu et mémorisé par le navigateur.
// Le changement s'applique tout de suite, même en pleine partie.
import { useSyncExternalStore } from 'react'
import { KITS } from './avatars.js'

const CLE = 'plateau-reunion.kit'
const DEMANDE = new URLSearchParams(window.location.search).get('kit')

function lire() {
  if (KITS[DEMANDE]) return DEMANDE
  try {
    const k = localStorage.getItem(CLE)
    return KITS[k] ? k : 'quaternius'
  } catch {
    return 'quaternius'
  }
}

let kit = lire()
const abonnes = new Set()

export const kitActuel = () => kit
export const nomKit = (k = kit) => KITS[k].nom

/** Passe à l'autre kit (ou à `k`). */
export function changerKit(k = kit === 'quaternius' ? 'kaykit' : 'quaternius') {
  kit = k
  try { localStorage.setItem(CLE, k) } catch { /* navigation privée : le choix ne sera pas mémorisé */ }
  abonnes.forEach((f) => f())
}

export function useKit() {
  return useSyncExternalStore((f) => { abonnes.add(f); return () => abonnes.delete(f) }, kitActuel)
}

/** Avatar du joueur n°i dans le kit choisi. */
export const avatarJoueur = (i, k = kit) => KITS[k].avatars[i]
export const useAvatar = (i) => avatarJoueur(i, useKit())
