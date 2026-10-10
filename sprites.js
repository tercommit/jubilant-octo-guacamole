// Pixel art original, dessiné caractère par caractère. Domaine public (CC0).
// Chaque lettre correspond à une couleur de PALETTE, "." = transparent.

const PALETTE = {
  K: '#222034', // contour
  W: '#ffffff',
  Y: '#fbf236', // pièce
  y: '#df7126',
  w: '#fffbe0',
  E: '#99e550', // slime
  e: '#4b9b2f',
  T: '#cbdbfc', // piques
  t: '#847e87',
  V: '#9b5fc0', // slime corrompu (gouttes, Roi des slimes)
  v: '#5a2f7a',
  R: '#d95763', // slime à piques
  r: '#ac3232',
  S: '#8a8fa8', // gardien de pierre
  s: '#5b6078',
};

// Le personnage vient d'une planche d'images (player.png) : 10 images d'attente
// puis 24 images de marche, chacune de PLAYER_FRAME_W × PLAYER_FRAME_H px, pieds en bas.
// Elle est dessinée à demi-taille, donc à la résolution réelle de l'écran (voir PIXEL_SCALE).
const PLAYER_FRAME_W = 58;
const PLAYER_FRAME_H = 60;
const PLAYER_ANIMS = { idle: [0, 10], walk: [10, 24], jump: [12, 1] }; // [première image, nombre]
const playerSheet = new Image();
playerSheet.src = 'player.png?v=8';

const SLIME_1 = [
  '................', '................', '................', '................',
  '................', '................', '................',
  '......KKKK......',
  '....KKEEEEKK....',
  '...KEEEEEEEEK...',
  '..KEEWKEEWKEEK..',
  '..KEEWKEEWKEEK..',
  '.KEEEEEEEEEEEEK.',
  '.KeEEEEEEEEEEeK.',
  '.KeeeeeeeeeeeeK.',
  '..KKKKKKKKKKKK..',
];

const SLIME_2 = [
  '................', '................', '................', '................',
  '................', '................', '................', '................',
  '.....KKKKKK.....',
  '...KKEEEEEEKK...',
  '..KEEEEEEEEEEK..',
  '.KEEEWKEEWKEEEK.',
  '.KEEEWKEEWKEEEK.',
  'KEEEEEEEEEEEEEEK',
  'KeeeeeeeeeeeeeeK',
  '.KKKKKKKKKKKKKK.',
];

const SLIME_FLAT = [
  '................', '................', '................', '................',
  '................', '................', '................', '................',
  '................', '................', '................', '................',
  '..KKKKKKKKKKKK..',
  '.KEEWKEEEEWKEEK.',
  'KeeeeeeeeeeeeeeK',
  '.KKKKKKKKKKKKKK.',
];

const COIN = [
  '................',
  '................',
  '.....KKKKKK.....',
  '....KYYYYYYK....',
  '...KYwYYYYyyK...',
  '...KYwYyyYYyK...',
  '...KYYYyYYYyK...',
  '...KYYYyYYYyK...',
  '...KYYYyYYYyK...',
  '...KYYYyYYYyK...',
  '...KYYYYYYYyK...',
  '....KyYYYYyK....',
  '.....KKKKKK.....',
];

const SPIKES = [
  '................', '................', '................', '................',
  '................', '................', '................',
  '...K.......K....',
  '..KTK.....KTK...',
  '..KTK.....KTK...',
  '.KTtTK...KTtTK..',
  '.KTtTK...KTtTK..',
  'KTTttTK.KTTttTK.',
  'KTTttTK.KTTttTK.',
  'KKKKKKKKKKKKKKKK',
  '................',
];

// Le gardien : un gros slime de pierre qui bouche les tunnels (dessiné à taille ×2).
const GUARD = [
  '.....KKKKKK.....',
  '...KKSSSSSSKK...',
  '..KSSSSSSSSSSK..',
  '.KSSsSSSSSSsSSK.',
  '.KSSSSSSSSSSSSK.',
  'KSSKKSSSSSSKKSSK',
  'KSSWWKSSSSKWWSSK',
  'KSSWKKSSSSKKWSSK',
  'KSSSSSSSSSSSSSSK',
  'KSSSSKKKKKKSSSSK',
  'KSSSSSSSSSSSSSSK',
  'KSsSSSSSSSSSSsSK',
  'KSSSSSSSSSSSSSSK',
  'KsSSSSSSSSSSSSsK',
  'KssssssssssssssK',
  '.KKKKKKKKKKKKKK.',
];

// Change les couleurs d'un dessin : { E: 'R', e: 'r' } remplace le vert du slime par du rouge.
function recolor(rows, map) {
  return rows.map(row => row.replace(/./g, c => map[c] || c));
}

// Ajoute trois piques au-dessus d'un slime (dont le haut est à la ligne « top »).
function withSpikes(rows, top) {
  const out = rows.slice();
  const put = (y, x, c) => { out[y] = out[y].slice(0, x) + c + out[y].slice(x + 1); };
  for (const x of [5, 8, 11]) {
    put(top - 3, x, 'K');
    put(top - 2, x - 1, 'K'); put(top - 2, x, 'T'); put(top - 2, x + 1, 'K');
    put(top - 1, x - 1, 'K'); put(top - 1, x, 'T'); put(top - 1, x + 1, 'K');
  }
  return out;
}

const DROP = [
  '.KK.',
  '.KV.',
  'KVVK',
  'KVvK',
  'KvvK',
  '.KK.',
];

// Transforme une grille de caractères en petit canvas.
function makeSprite(rows) {
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = PALETTE[row[x]];
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
  });
  return c;
}

// Générateur pseudo-aléatoire déterministe, pour que les tuiles soient identiques à chaque partie.
function rng(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function makeTile(draw, seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  draw(c.getContext('2d'), rng(seed));
  return c;
}

function drawDirt(g, r) {
  g.fillStyle = '#8f563b';
  g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 10; i++) {
    g.fillStyle = r() < 0.6 ? '#663931' : '#a8714f';
    g.fillRect((r() * 15) | 0, (r() * 15) | 0, 2, 1);
  }
  g.fillStyle = '#9badb7';
  g.fillRect((r() * 13) | 0, 6 + ((r() * 8) | 0), 2, 2);
}

function drawRockTile(g, r) {
  g.fillStyle = '#3d2a2c';
  g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 10; i++) {
    g.fillStyle = r() < 0.6 ? '#2a1c1e' : '#5a3a36';
    g.fillRect((r() * 15) | 0, (r() * 15) | 0, 2, 1);
  }
  if (r() < 0.5) {
    g.fillStyle = '#b3401b';
    g.fillRect((r() * 14) | 0, 4 + ((r() * 10) | 0), 1, 1);
  }
}

const SPRITES = {
  slime: [makeSprite(SLIME_1), makeSprite(SLIME_2)],
  slimeFlat: makeSprite(SLIME_FLAT),
  coin: makeSprite(COIN),
  drop: makeSprite(DROP),
  spiky: [
    makeSprite(withSpikes(recolor(SLIME_1, { E: 'R', e: 'r' }), 7)),
    makeSprite(withSpikes(recolor(SLIME_2, { E: 'R', e: 'r' }), 8)),
  ],
  guard: [makeSprite(GUARD), makeSprite(GUARD)],
  king: [makeSprite(recolor(SLIME_1, { E: 'V', e: 'v' })), makeSprite(recolor(SLIME_2, { E: 'V', e: 'v' }))],
  kingPure: [makeSprite(SLIME_1), makeSprite(SLIME_2)],
  // Sols du marais (mousse) et du volcan (roche).
  moss: makeTile((g, r) => {
    drawDirt(g, r);
    g.fillStyle = '#2f4a2a';
    g.fillRect(0, 0, 16, 5);
    for (let x = 0; x < 16; x++) if (r() < 0.6) g.fillRect(x, 5, 1, 1 + ((r() * 3) | 0));
    g.fillStyle = '#4f6b2f';
    g.fillRect(0, 0, 16, 4);
    g.fillStyle = '#7a8f45';
    g.fillRect(0, 0, 16, 1);
  }, 5),
  rock: makeTile(drawRockTile, 9),
  rockTop: makeTile((g, r) => {
    drawRockTile(g, r);
    g.fillStyle = '#5a3a36';
    g.fillRect(0, 0, 16, 3);
    g.fillStyle = '#df7126';
    for (let x = 0; x < 16; x += 5) g.fillRect(x + ((r() * 3) | 0), 0, 2, 1);
  }, 13),
  spikes: makeSprite(SPIKES),
  dirt: makeTile(drawDirt, 7),
  grass: makeTile((g, r) => {
    drawDirt(g, r);
    g.fillStyle = '#37946e';
    g.fillRect(0, 0, 16, 5);
    for (let x = 0; x < 16; x++) if (r() < 0.5) g.fillRect(x, 5, 1, 1 + ((r() * 2) | 0));
    g.fillStyle = '#6abe30';
    g.fillRect(0, 0, 16, 4);
    g.fillStyle = '#99e550';
    g.fillRect(0, 0, 16, 1);
    for (let x = 1; x < 16; x += 3) g.fillRect(x, 1, 1, 1);
  }, 3),
  brick: makeTile(g => {
    g.fillStyle = '#5a2e1e';
    g.fillRect(0, 0, 16, 16);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 4 : 0;
      for (let x = -8 + off; x < 16; x += 8) {
        g.fillStyle = '#c0603a';
        g.fillRect(x + 1, row * 4 + 1, 7, 3);
        g.fillStyle = '#e08a5b';
        g.fillRect(x + 1, row * 4 + 1, 7, 1);
      }
    }
  }, 1),
  bush: makeTile(g => {
    const blobs = [[4, 11, 4], [9, 9, 5], [13, 12, 3]];
    g.fillStyle = '#222034';
    blobs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r + 1, 0, 7); g.fill(); });
    g.fillStyle = '#4b9b2f';
    blobs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.fillStyle = '#6abe30';
    blobs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x - 1, y - 1, r - 2, 0, 7); g.fill(); });
    g.clearRect(0, 15, 16, 1);
  }, 1),
};
