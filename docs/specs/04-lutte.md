# 04 — Lutte entre joueurs : pousser, porter, jeter

> Statut : brouillon v0.1 · 17/10/2026 · Dans les 4 mini-jeux · Code : `game/src/commun/lutte.js`

## Le principe

Tout se fait avec **B**, en joueur contre joueur, dans la direction où l'on regarde :

1. **Pousser** : B donne une petite ruée vers l'avant. Le premier joueur touché est repoussé et **étourdi 1 s**.
2. **Attraper** : B devant un joueur étourdi (à moins de 1,6 u) le soulève au-dessus de la tête.
   Le porteur avance à **70 %** de sa vitesse.
3. **Jeter** : B en portant lance le joueur en cloche, environ 5 u devant soi. Il retombe étourdi.

Pour **se libérer**, le joueur porté martèle **A** : chaque appui retire 0,35 s aux 2,5 s de portée.
Le porteur lâche aussi sa prise s'il est sonné (bombe, obstacle), s'il tombe ou s'il franchit l'arrivée.

## Garde-fous

- Une poussée a 0,9 s de recharge ; après un lâcher, on attend 1 s avant de repousser.
- Juste après avoir été poussé (0,3 s), lâché (1 s) ou jeté (1,4 s), un joueur ne peut être ni poussé ni attrapé :
  pas d'enchaînement sans fin sur la même victime.
- Cette protection ne vaut **que contre les autres joueurs** : jeté dans la lave, la ravine ou l'eau, on y tombe.

## Dans chaque mini-jeu

| Mini-jeu | Ce que ça change |
|---|---|
| Sentier de Mafate | Bousculer celui qui va prendre la balise, le porter loin d'elle. |
| La Ti Diagonale | Pousser ou jeter les autres dans la ravine, les ralentir avant un obstacle. |
| Le trésor de La Buse | Jeter un rival dans l'eau (où il nage lentement), l'écarter du coffre. |
| Fuis la coulée | Jeter un rival dans la lave : il est éliminé. |

Un joueur porté ou en vol ne ramasse rien et n'est touché ni par la lave ni par les bombes : c'est à l'atterrissage
que ça compte.

## Animations

| Action | Quaternius | KayKit (pack gratuit) |
|---|---|---|
| Pousser | Punch | Throw |
| Porter (en courant / à l'arrêt) | Run_Carry / Walk_Carry | Running_A / Idle_B |
| Être porté ou en vol | Jump | Jump_Idle |

Le pack KayKit gratuit n'a pas d'animation « porter » : à remplacer quand on aura mieux (pack payant ou Blender).

## Paramètres (`LUTTE` dans `game/src/commun/lutte.js`)

| Paramètre | Valeur |
|---|---|
| Ruée | 0,18 s à 9 u/s, recharge 0,9 s |
| Choc | force 6, étourdi 1 s |
| Portée pour attraper | 1,6 u |
| Porter | 2,5 s max, −0,35 s par appui sur A, vitesse ×0,7 |
| Jet | 5 u, 0,6 s, 1,6 u de haut, étourdi 0,7 s |
