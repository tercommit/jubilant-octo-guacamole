// Les zones de la forêt. Chaque zone est un couloir que la boule de feu parcourt tout droit.
// x : position de gauche à droite (-1 = bord gauche du chemin, 1 = bord droit). z : distance depuis la gardienne.
// Cibles : trap (piège du chasseur, au sol), totem (cristal corrompu), bat (chauve-souris, vole de gauche à droite),
// beast (bête d'ombre, court au sol). Les cibles mobiles oscillent autour de x : amplitude ax, vitesse speed.
// Obstacles : trunk (tronc, largeur w) et log (tronc couché en travers du chemin, largeur w) éteignent la boule.
// backdrop : le fond illustré (voir js/assets.js) ; 'crepuscule' est dessiné par le jeu (js/game.js).
'use strict';

const ZONES = [
  {
    name: 'I. La lisière',
    intro: 'Les traces du chasseur souillent encore la lisière. Lance la boule de feu, puis penche le téléphone à gauche ou à droite pour la guider.',
    outro: 'La lisière est purifiée. Sa piste s\'enfonce sous les arbres.',
    shots: 5,
    length: 48,
    backdrop: 'crepuscule',
    theme: {
      sky: ['#56688a', '#d6ae8c'], ground: '#3e5236', path: '#6e5b45', fog: '#a69a96',
      trunk: '#3a2f2c', leaves: ['#3b5446', '#4a6552'], shade: 'rgba(20,20,30,0)',
    },
    obstacles: [],
    targets: [
      { type: 'totem', x: -0.6, z: 10 },
      { type: 'trap', x: 0.6, z: 16 },
      { type: 'totem', x: 0, z: 22 },
      { type: 'totem', x: -0.8, z: 30 },
      { type: 'trap', x: 0.8, z: 34 },
      { type: 'totem', x: 0.3, z: 42 },
    ],
  },
  {
    name: 'II. Le sous-bois',
    intro: 'Il s\'est enfoncé sous les arbres. Les troncs éteignent les flammes : passe à côté.',
    outro: 'Une plume noire, une odeur de cendre… il n\'est plus très loin.',
    shots: 5,
    length: 56,
    backdrop: 'sousBois',
    theme: {
      sky: ['#1c2330', '#4a5a4a'], ground: '#1f2b22', path: '#3a3a2c', fog: '#2b3a34',
      trunk: '#2c241f', leaves: ['#1e2f28', '#294036'], shade: 'rgba(10,16,14,0.1)',
    },
    obstacles: [
      { type: 'trunk', x: 0, z: 12, w: 0.5 },
      { type: 'trunk', x: -0.6, z: 22, w: 0.6 },
      { type: 'log', x: 0.75, z: 27, w: 0.9 },
      { type: 'trunk', x: 0.6, z: 34, w: 0.6 },
      { type: 'trunk', x: 0, z: 44, w: 0.5 },
    ],
    targets: [
      { type: 'totem', x: -0.7, z: 14 },
      { type: 'trap', x: 0.7, z: 18 },
      { type: 'totem', x: -0.9, z: 29 },
      { type: 'totem', x: 0.2, z: 38 },
      { type: 'totem', x: 0.85, z: 50 },
      { type: 'trap', x: -0.5, z: 52 },
    ],
  },
  {
    name: 'III. La forêt profonde',
    intro: 'Chauves-souris et bêtes d\'ombre rôdent entre les arbres. Elles bougent : anticipe leur trajectoire.',
    outro: 'La forêt s\'assombrit encore. Au cœur des bois, quelque chose de sombre t\'attend… (suite à venir : le cœur corrompu, puis le chasseur)',
    shots: 6,
    length: 64,
    backdrop: 'foretProfonde',
    theme: {
      sky: ['#120f1c', '#3a2440'], ground: '#17142a', path: '#2c2438', fog: '#251c33',
      trunk: '#221a24', leaves: ['#1c1838', '#262048'], shade: 'rgba(12,8,24,0.1)',
    },
    obstacles: [
      { type: 'trunk', x: -0.75, z: 18, w: 0.6 },
      { type: 'trunk', x: 0.75, z: 18, w: 0.6 },
      { type: 'trunk', x: 0, z: 42, w: 0.5 },
      { type: 'log', x: -0.7, z: 55, w: 0.8 },
    ],
    targets: [
      { type: 'bat', x: 0, z: 12, ax: 0.7, speed: 1.2 },
      { type: 'bat', x: 0.4, z: 26, ax: 0.5, speed: 1.6 },
      { type: 'beast', x: 0, z: 34, ax: 0.9, speed: 0.8 },
      { type: 'bat', x: -0.6, z: 46, ax: 0.3, speed: 2 },
      { type: 'bat', x: 0.6, z: 50, ax: 0.3, speed: 2 },
      { type: 'beast', x: 0, z: 60, ax: 0.8, speed: 1.1 },
    ],
  },
];

const STORY = [
  { text: 'Elle est la gardienne de la forêt. Depuis des années, son familier, un cerf blanc, veille à ses côtés. Une part de sa magie vit en lui.', stag: 'standing' },
  { text: 'Aucun humain mal intentionné ne franchit la lisière : la forêt les égare. Mais un chasseur est entré, protégé par une amulette maudite.' },
  { text: 'Il a tué le cerf blanc.', stag: 'lying' },
  { text: 'Elle n\'est pas triste. Elle est enragée. Ses boules de feu brûlent plus fort que jamais, et elle les suit des yeux jusqu\'au bout du chemin.' },
  { text: 'Touche l\'écran pour lancer. Penche le téléphone à gauche ou à droite pour guider le feu.' },
];
