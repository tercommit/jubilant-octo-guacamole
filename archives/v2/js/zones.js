// Les zones de la forêt. Coordonnées dans une scène de 480 × 270, sol à y = 240.
// Cibles : trap (piège du chasseur, au sol), totem (cristal corrompu), bat (chauve-souris corrompue, vole),
// beast (bête d'ombre, court au sol). Les cibles mobiles oscillent autour de (x, y) : amplitude ax / ay, vitesse speed.
// backdrop : le fond illustré de la zone (voir js/assets.js) ; shade : voile sombre posé dessus.
// Obstacles : rectangles (troncs, branches) qui éteignent la boule de feu.
'use strict';

const ZONES = [
  {
    name: 'I. La lisière',
    intro: 'Les traces du chasseur souillent encore la lisière. Brûle-les. Penche le téléphone pour courber la boule de feu.',
    outro: 'La lisière est purifiée. Sa piste s\'enfonce sous les arbres.',
    shots: 5,
    backdrop: 'lisiere',
    theme: { sky: ['#2b2a3f', '#b0664a'], far: '#3d3a4a', near: '#2a2a35', fog: 'rgba(240,190,150,0.08)', ground: '#1c1a26', shade: 'rgba(20,14,30,0.3)' },
    obstacles: [],
    targets: [
      { type: 'totem', x: 290, y: 140 },
      { type: 'trap', x: 360, y: 232 },
      { type: 'totem', x: 430, y: 80 },
    ],
  },
  {
    name: 'II. Le sous-bois',
    intro: 'Il s\'est enfoncé sous les arbres. Les troncs éteignent les flammes : contourne-les.',
    outro: 'Une plume noire, une odeur de cendre… il n\'est plus très loin.',
    shots: 5,
    backdrop: 'sousBois',
    theme: { sky: ['#1c2330', '#4a5a4a'], far: '#26302c', near: '#1a221e', fog: 'rgba(170,200,170,0.08)', ground: '#1a221c', shade: 'rgba(10,16,14,0.15)' },
    obstacles: [
      { x: 210, y: 100, w: 18, h: 140 },
      { x: 340, y: 0, w: 18, h: 140 },
      { x: 358, y: 100, w: 36, h: 8 },
    ],
    targets: [
      { type: 'trap', x: 285, y: 232 },
      { type: 'totem', x: 425, y: 55 },
      { type: 'totem', x: 440, y: 200 },
    ],
  },
  {
    name: 'III. La forêt profonde',
    intro: 'Chauves-souris et bête d\'ombre rôdent entre les arbres. Elles bougent : anticipe leur trajectoire.',
    outro: 'La forêt s\'assombrit encore. Au cœur des bois, quelque chose de sombre t\'attend… (suite à venir : le cœur corrompu, puis le chasseur)',
    shots: 6,
    backdrop: 'foretProfonde',
    theme: { sky: ['#120f1c', '#3a2440'], far: '#1e1626', near: '#140f1a', fog: 'rgba(200,120,160,0.07)', ground: '#141322', shade: 'rgba(12,8,24,0.15)' },
    obstacles: [
      { x: 200, y: 150, w: 18, h: 90 },
      { x: 300, y: 0, w: 16, h: 70 },
    ],
    targets: [
      { type: 'bat', x: 330, y: 110, ax: 0, ay: 50, speed: 1.1 },
      { type: 'bat', x: 420, y: 170, ax: 40, ay: 30, speed: 0.8 },
      { type: 'bat', x: 400, y: 60, ax: 50, ay: 0, speed: 1.4 },
      { type: 'beast', x: 320, y: 226, ax: 70, speed: 0.6 },
    ],
  },
];

const STORY = [
  { text: 'Elle est la gardienne de la forêt. Depuis des années, son familier, un cerf blanc, veille à ses côtés. Une part de sa magie vit en lui.', stag: 'standing' },
  { text: 'Aucun humain mal intentionné ne franchit la lisière : la forêt les égare. Mais un chasseur est entré, protégé par une amulette maudite.' },
  { text: 'Il a tué le cerf blanc.', stag: 'lying' },
  { text: 'Elle n\'est pas triste. Elle est enragée. Ses boules de feu sont plus puissantes que jamais… mais incontrôlables.' },
  { text: 'Touche l\'écran n\'importe où pour lancer. Penche le téléphone pour canaliser sa rage.' },
];
