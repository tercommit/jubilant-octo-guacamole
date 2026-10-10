// L'île de Brumelune, vue de dessus : on s'y déplace case par case et on entre dans les missions.
// Légende de la carte :
//   ~ mer          , sable        . herbe        ; herbes hautes   : chemin
//   T arbre        r rocher       v herbe du marais                w eau du marais
//   M roche du volcan             l lave         m cendres
//   S source de soin (redonne toutes les vies)   P départ
//   1 2 3 entrées des missions
//   a brume levée après la mission 1      b brume levée après la mission 2

const WORLD = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~,,,,,,,~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~,,,,MMMMMMM,,,,~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~,,,MMMMMlllllMMMMM,,,~~~~~~~~~~~~",
  "~~~~~~~~~~~~~,,TTMMMMlllllllllMMMMT,,~~~~~~~~~~~",
  "~~~~~~~~~~~,,TTTMMMMMllll3llllMMMMTT,,~~~~~~~~~~",
  "~~~~~~~~~~,,TTTTMMMMMMMMm:mMMMMMMMTTT,,~~~~~~~~~",
  "~~~~~~~~~,,TTTTTTTMMMMMMm:mMMMMMMTTTTT,~~~~~~~~~",
  "~~~~~~~~,,TTTTTTTTTTTTMMm:mMMTTTTTTTTT,,~~~~~~~~",
  "~~~~~~~,,TTTTTTTTTTTTTTTbbbTTTTTTTTTTTT,~~~~~~~~",
  "~~~~~~,,TTTTTTTTTTTTTT;;.:.;TTTTTTTTTTTT,~~~~~~~",
  "~~~~~,,TTTTTTTTTTTTT;....:...;;TTTTTTTTT,,~~~~~~",
  "~~~~~,TTTTTTTTTTTTT;....:::....TTTTTTTTTT,~~~~~~",
  "~~~~,,TTT;;;TTTTTT.....::S::....TTTTTTTTT,~~~~~~",
  "~~~~,TTT;1;;.TTT;;.....:::...;...TTTTTTTT,,~~~~~",
  "~~~~,TTT;::::::::::::::::P:....rr..TTTTTTT,~~~~~",
  "~~~~,TTT;;;;..TTTT;....:....;..r...TTTTTTT,~~~~~",
  "~~~~,,TTTTTTTTTTTTTT;..:......;..TTTTTTTTT,~~~~~",
  "~~~~~,TTTTTTTTTTTTTTTTTaaaTTTTTTTTTTTTTTTT,~~~~~",
  "~~~~~,,TTTTTTTTTTTTTvvv:vvvvwwwvvTTTTTTT,,~~~~~~",
  "~~~~~~,,TTTTTTTTvvvwwv::::vvwwwwvvvTTTTT,~~~~~~~",
  "~~~~~~~,,TTTTTvvvwwwwvvwv:vvvvwwvvvvvTT,,~~~~~~~",
  "~~~~~~~~,,TTTvvwwwwvvvwwv::::::::2vvvTT,~~~~~~~~",
  "~~~~~~~~~,,TTTvvwwvvvwwwwvvwwwwvvvvwTT,,~~~~~~~~",
  "~~~~~~~~~~,,,TTTTvvvvwwvvvvTTTTvvTTT,,~~~~~~~~~~",
  "~~~~~~~~~~~~,,,,TTTTTTTTTTTTT,,TTT,,,~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~,,,,,,,,,,,,,,,,,,~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
];

// Une mission par entrée (1, 2, 3) : le niveau de LEVELS qu'elle lance.
// « unlock » s'affiche la première fois qu'on la termine.
const MISSIONS = [
  { name: 'Forêt brumeuse', level: 0, color: '#6abe30', theme: 'forest',
    unlock: 'La brume se dissipe au sud : le chemin du marais empoisonné est ouvert.' },
  { name: 'Marais empoisonné', level: 1, color: '#9b5fc0',
    unlock: 'La brume se dissipe au nord : le volcan du Roi des slimes vous attend.' },
  { name: 'Volcan', level: 2, color: '#df7126' },
];

const INTRO = [
  'Brumelune, une île perdue dans la brume. Autrefois, humains et slimes y protégeaient ensemble la magie.',
  'Mais le Roi des slimes a changé. Il a volé toute la magie de l\'île, et depuis, la brume ne cesse de s\'épaissir.',
  'Lyra, magicienne privée de ses pouvoirs, part reprendre la magie. Tout commence dans la forêt brumeuse, à l\'ouest.',
  'La source de soin, au centre de l\'île, redonne toutes les vies. C\'est le seul endroit où se soigner.',
];

const WORLD_WALKABLE = '.;:,mvP123';
const WORLD_STEP_FRAMES = 10; // durée d'un pas d'une case à l'autre
const WORLD_PLAYER_SCALE = 1 / 3;
const TOUCH_SCREEN = matchMedia('(pointer: coarse)').matches;
// Sol dessiné sous les éléments posés sur la carte.
const WORLD_GROUND = { T: '.', r: '.', S: ':', P: ':', 1: ';', 2: 'v', 3: 'm', a: ':', b: ':' };

const world = {
  rows: WORLD.map(r => r.split('')),
  w: WORLD[0].length,
  h: WORLD.length,
  x: 0, y: 0, fromX: 0, fromY: 0, // case actuelle et case de départ du pas en cours
  move: 0, // images restantes avant la fin du pas
  facing: 1,
  walk: 0,
};
world.rows.forEach((row, y) => row.forEach((t, x) => {
  if (t === 'P') world.start = { x, y };
  if (t === 'S') world.spring = { x, y };
}));

function worldTile(x, y) {
  return x < 0 || y < 0 || x >= world.w || y >= world.h ? '~' : world.rows[y][x];
}

function worldCanWalk(x, y) {
  const t = worldTile(x, y);
  if (t === 'a') return game.done >= 1;
  if (t === 'b') return game.done >= 2;
  return WORLD_WALKABLE.includes(t);
}

function placeOnWorld(x, y) {
  world.x = world.fromX = x;
  world.y = world.fromY = y;
  world.move = 0;
}

// Revient sur l'île. Sans position, on reste là où l'on était (par exemple sur l'entrée de la mission).
function enterWorld(pos) {
  if (pos) placeOnWorld(pos.x, pos.y);
  game.state = 'world';
  game.view = 'world';
  overlay.hidden = true;
  particles = [];
  updateHud();
  writeSave();
}

function startMission(i) {
  game.mission = i;
  game.levelIndex = MISSIONS[i].level;
  game.view = 'level';
  input.jumpPressed = false;
  loadLevel(game.levelIndex);
  game.state = 'play';
}

// Appelée quand on touche le drapeau d'une mission.
function finishMission() {
  const i = game.mission;
  const firstTime = game.done <= i;
  game.done = Math.max(game.done, i + 1);
  if (i === MISSIONS.length - 1) {
    game.state = 'win';
    clearSave();
    showOverlay('Bravo !', `Le volcan est franchi. Le combat contre le Roi des slimes arrive bientôt…<br>Pièces : ${game.coins}<br>Espace ou toucher pour rejouer`);
    return;
  }
  enterWorld();
  if (firstTime && MISSIONS[i].unlock) game.messages.push(MISSIONS[i].unlock);
}

function showMessages(pages) {
  game.messages.push(...pages);
}

function nextToSpring() {
  return Math.abs(world.x - world.spring.x) + Math.abs(world.y - world.spring.y) === 1;
}

// Ce que fait le bouton d'action (Espace / A) à l'endroit où l'on se trouve.
function worldAction() {
  if (game.messages.length || world.move) return null;
  const t = worldTile(world.x, world.y);
  if ('123'.includes(t)) {
    const i = Number(t) - 1;
    return { text: `${MISSIONS[i].name}${i < game.done ? ' ★' : ''} · Espace/A : entrer`, run: () => startMission(i) };
  }
  if (nextToSpring()) return { text: 'Source de soin · Espace/A : boire', run: drinkSpring };
  return null;
}

function drinkSpring() {
  if (game.lives >= START_LIVES) {
    showMessages(['L\'eau de la source scintille. Lyra est déjà en pleine forme.']);
    return;
  }
  game.lives = START_LIVES;
  sfx('coin');
  burst(world.spring.x * TILE + 8, world.spring.y * TILE + 6, '#5fcde4', 12);
  updateHud();
  writeSave();
  showMessages(['L\'eau de la source redonne à Lyra toutes ses vies.']);
}

function worldConfirm() {
  if (game.messages.length) { game.messages.shift(); return; }
  const action = worldAction();
  if (action) action.run();
}

function updateWorld() {
  if (game.messages.length) return;
  if (world.move > 0) {
    world.walk += 0.4;
    if (--world.move === 0) {
      world.fromX = world.x;
      world.fromY = world.y;
      writeSave();
    }
    if (world.move) return;
  }
  const dir = input.left ? [-1, 0] : input.right ? [1, 0] : input.up ? [0, -1] : input.down ? [0, 1] : null;
  if (!dir) return;
  if (dir[0]) world.facing = dir[0];
  const nx = world.x + dir[0], ny = world.y + dir[1];
  if (!worldCanWalk(nx, ny)) return;
  world.x = nx;
  world.y = ny;
  world.move = WORLD_STEP_FRAMES;
}

/* ---------- Graphismes de l'île ---------- */

function speckle(g, r, base, colors, n) {
  g.fillStyle = base;
  g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(r() * colors.length) | 0];
    g.fillRect((r() * 15) | 0, (r() * 15) | 0, 1 + ((r() * 2) | 0), 1);
  }
}

// Plusieurs variantes par sol, pour éviter l'effet de quadrillage.
function tileVariants(draw, seed) {
  return [0, 1, 2].map(i => makeTile(draw, seed + i * 101));
}

const WORLD_TILES = {
  '.': tileVariants((g, r) => speckle(g, r, '#3e6b3d', ['#4b7d45', '#335a34', '#557f4a'], 14), 11),
  ';': tileVariants((g, r) => {
    speckle(g, r, '#3e6b3d', ['#4b7d45', '#335a34'], 8);
    for (let i = 0; i < 6; i++) {
      const x = 1 + ((r() * 13) | 0), y = 5 + ((r() * 9) | 0);
      g.fillStyle = '#2b4a2c';
      g.fillRect(x, y, 1, 3);
      g.fillStyle = '#6a9a55';
      g.fillRect(x + 1, y - 1, 1, 3);
    }
  }, 21),
  ':': tileVariants((g, r) => speckle(g, r, '#8a7556', ['#9c8865', '#76634a', '#a39577'], 12), 31),
  ',': tileVariants((g, r) => speckle(g, r, '#c2b07f', ['#d4c393', '#a8976a'], 12), 41),
  'm': tileVariants((g, r) => speckle(g, r, '#4f4245', ['#5f5053', '#3d3235', '#7a4a3a'], 14), 51),
  'v': tileVariants((g, r) => speckle(g, r, '#45533a', ['#556544', '#384530', '#5f5a3a'], 14), 61),
  'M': tileVariants((g, r) => {
    speckle(g, r, '#4a3436', ['#3a2729', '#5b4143'], 10);
    g.fillStyle = '#2e1f22';
    for (let i = 0; i < 3; i++) g.fillRect((r() * 12) | 0, (r() * 12) | 0, 1 + ((r() * 4) | 0), 1);
  }, 71),
};

const TREE_SPRITES = [0, 1].map(v => {
  const c = document.createElement('canvas');
  c.width = 20;
  c.height = 28;
  const g = c.getContext('2d');
  g.fillStyle = '#222034';
  g.fillRect(7, 17, 6, 11);
  g.fillStyle = '#5a3a2a';
  g.fillRect(8, 17, 4, 10);
  const blobs = v ? [[10, 9, 8], [5, 14, 5], [15, 14, 5]] : [[10, 8, 7], [6, 13, 6], [14, 13, 6], [10, 15, 5]];
  const layers = [['#222034', 1], ['#24402a', 0], ['#2f5a33', -1.5], ['#467a42', -3.5]];
  layers.forEach(([color, grow], i) => {
    g.fillStyle = color;
    blobs.forEach(([x, y, rad]) => {
      const off = i >= 2 ? -1 : 0;
      g.beginPath();
      g.arc(x + off, y + off, Math.max(1, rad + grow), 0, 7);
      g.fill();
    });
  });
  return c;
});

function drawWorldGround(tx, ty, x, y) {
  let t = worldTile(tx, ty);
  if (t === '~' || t === 'w' || t === 'l') return drawLiquid(t, tx, ty, x, y);
  t = WORLD_GROUND[t] || t;
  const tiles = WORLD_TILES[t] || WORLD_TILES['.'];
  ctx.drawImage(tiles[(tx * 7 + ty * 13) % tiles.length], x, y);
  // Petite falaise sous la roche du volcan, pour donner du relief.
  if (t === 'M' && worldTile(tx, ty + 1) !== 'M') {
    ctx.fillStyle = '#2e1f22';
    ctx.fillRect(x, y + 11, 16, 5);
    ctx.fillStyle = '#222034';
    ctx.fillRect(x, y + 15, 16, 1);
  }
}

function drawLiquid(t, tx, ty, x, y) {
  const f = game.frame;
  const [base, light] = { '~': ['#203f5e', '#3b6a8f'], w: ['#2f3d27', '#4f6a3a'], l: ['#b3401b', '#f2a33a'] }[t];
  ctx.fillStyle = base;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = light;
  const speed = t === 'l' ? 30 : 45;
  for (let i = 0; i < 2; i++) {
    const phase = Math.floor(f / speed + tx * 3 + ty * 5 + i * 7) % 16;
    ctx.fillRect(x + ((phase + i * 8) % 13), y + 4 + i * 7, t === 'l' ? 4 : 3, 1);
  }
  // Rivage : un liseré d'écume (ou de bord du marais) contre la terre.
  if (worldTile(tx, ty - 1) !== t) {
    ctx.fillStyle = t === 'l' ? '#f2a33a' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, 16, 1);
  }
}

function drawPortal(i, x, y) {
  const m = MISSIONS[i];
  const pulse = 0.5 + 0.5 * Math.sin(game.frame * 0.06 + i);
  ctx.globalAlpha = 0.25 + 0.25 * pulse;
  ctx.fillStyle = m.color;
  ctx.beginPath();
  ctx.arc(x + 8, y + 6, 10, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Arche de pierre
  ctx.fillStyle = '#222034';
  ctx.fillRect(x + 1, y - 6, 14, 20);
  ctx.fillStyle = '#847e87';
  ctx.fillRect(x + 2, y - 5, 12, 18);
  ctx.fillStyle = '#9badb7';
  ctx.fillRect(x + 2, y - 5, 12, 2);
  // Passage lumineux
  ctx.fillStyle = '#140f1f';
  ctx.fillRect(x + 5, y - 1, 6, 14);
  ctx.fillStyle = m.color;
  ctx.globalAlpha = 0.4 + 0.5 * pulse;
  ctx.fillRect(x + 6, y + 1, 4, 12);
  ctx.globalAlpha = 1;
  if (i < game.done) {
    ctx.fillStyle = '#fbf236';
    ctx.fillRect(x + 7, y - 10, 2, 2);
    ctx.fillRect(x + 6, y - 9, 4, 1);
  }
}

function drawSpring(x, y) {
  const pulse = 0.5 + 0.5 * Math.sin(game.frame * 0.05);
  ctx.globalAlpha = 0.15 + 0.2 * pulse;
  ctx.fillStyle = '#5fcde4';
  ctx.beginPath();
  ctx.arc(x + 8, y + 8, 14, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#222034';
  ctx.fillRect(x, y + 3, 16, 12);
  ctx.fillStyle = '#9badb7';
  ctx.fillRect(x + 1, y + 4, 14, 10);
  ctx.fillStyle = '#696a6a';
  ctx.fillRect(x + 1, y + 11, 14, 3);
  ctx.fillStyle = '#5fcde4';
  ctx.fillRect(x + 3, y + 5, 10, 5);
  ctx.fillStyle = '#cbf1f5';
  ctx.fillRect(x + 4 + ((game.frame >> 4) % 7), y + 6, 2, 1);
  // Jet d'eau
  ctx.fillStyle = '#cbf1f5';
  ctx.fillRect(x + 7, y - 3 + (pulse > 0.5 ? 1 : 0), 2, 7);
}

function drawRock(x, y) {
  ctx.fillStyle = '#222034';
  ctx.fillRect(x + 1, y + 5, 14, 11);
  ctx.fillStyle = '#696a6a';
  ctx.fillRect(x + 2, y + 6, 12, 9);
  ctx.fillStyle = '#9badb7';
  ctx.fillRect(x + 3, y + 6, 6, 2);
}

function drawWorldObject(t, tx, ty, x, y) {
  if (t === 'T') ctx.drawImage(TREE_SPRITES[(tx * 3 + ty) % 2], x - 2, y - 12);
  else if (t === 'r') drawRock(x, y);
  else if (t === 'S') drawSpring(x, y);
  else if ('123'.includes(t)) drawPortal(Number(t) - 1, x, y);
}

function drawFogGate(t, x, y) {
  if (t !== 'a' && t !== 'b') return;
  if ((t === 'a' && game.done >= 1) || (t === 'b' && game.done >= 2)) return;
  for (let i = 0; i < 4; i++) {
    const a = game.frame * 0.02 + i * 1.7 + x * 0.1;
    ctx.fillStyle = i % 2 ? 'rgba(190,185,215,0.55)' : 'rgba(150,140,180,0.55)';
    ctx.beginPath();
    ctx.arc(x + 8 + Math.cos(a) * 5, y + 6 + Math.sin(a * 1.3) * 4, 7, 0, 7);
    ctx.fill();
  }
}

function worldPlayerPos() {
  const k = world.move / WORLD_STEP_FRAMES; // 1 au début du pas, 0 à la fin
  return {
    x: (world.x + (world.fromX - world.x) * k) * TILE,
    y: (world.y + (world.fromY - world.y) * k) * TILE,
  };
}

function drawWorldPlayer(pos) {
  const cx = pos.x + 8, bottom = pos.y + 14;
  ctx.fillStyle = 'rgba(20,15,30,0.4)';
  ctx.fillRect(Math.round(cx - 5 - camX), Math.round(bottom - 2 - camY), 10, 3);
  let anim = 'idle', t = game.frame / 6;
  if (world.move) { anim = 'walk'; t = world.walk; }
  const [first, count] = PLAYER_ANIMS[anim];
  drawPlayer(first + (Math.floor(t) % count), cx, bottom, world.facing < 0, WORLD_PLAYER_SCALE);
}

// Découpe un texte en lignes qui tiennent dans la largeur donnée.
function wrapText(text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawTextBox(text, more) {
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  const lines = wrapText(text, VIEW_W - 32);
  const h = lines.length * 12 + 12;
  // Sur écran tactile, les boutons occupent le bas : le texte passe en haut.
  const y = TOUCH_SCREEN ? 18 : VIEW_H - h - 6;
  ctx.fillStyle = '#222034';
  ctx.fillRect(6, y, VIEW_W - 12, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, y + 1, VIEW_W - 14, 1);
  ctx.fillRect(7, y + h - 2, VIEW_W - 14, 1);
  ctx.fillRect(7, y + 1, 1, h - 2);
  ctx.fillRect(VIEW_W - 8, y + 1, 1, h - 2);
  lines.forEach((l, i) => ctx.fillText(l, 14, y + 7 + i * 12));
  if (more && (game.frame >> 5) % 2) {
    ctx.fillStyle = '#fbf236';
    ctx.beginPath();
    ctx.moveTo(VIEW_W - 20, y + h - 9);
    ctx.lineTo(VIEW_W - 12, y + h - 9);
    ctx.lineTo(VIEW_W - 16, y + h - 5);
    ctx.fill();
  }
}

function drawWorld() {
  const pos = worldPlayerPos();
  camX = Math.max(0, Math.min(world.w * TILE - VIEW_W, pos.x + 8 - VIEW_W / 2));
  camY = Math.max(0, Math.min(world.h * TILE - VIEW_H, pos.y + 8 - VIEW_H / 2));
  const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + VIEW_W) / TILE);
  const y0 = Math.floor(camY / TILE), y1 = Math.ceil((camY + VIEW_H) / TILE);
  const sx = tx => Math.round(tx * TILE - camX), sy = ty => Math.round(ty * TILE - camY);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) drawWorldGround(tx, ty, sx(tx), sy(ty));
  }

  // Éléments en relief, rangée par rangée : ce qui est plus bas sur l'écran passe devant.
  // C'est ce qui permet au personnage de passer derrière les arbres (effet 2.5D).
  let playerDrawn = false;
  const playerBottom = pos.y + TILE;
  for (let ty = y0; ty <= y1 + 1; ty++) {
    if (!playerDrawn && (ty + 1) * TILE > playerBottom) { drawWorldPlayer(pos); playerDrawn = true; }
    for (let tx = x0; tx <= x1; tx++) drawWorldObject(worldTile(tx, ty), tx, ty, sx(tx), sy(ty));
  }
  if (!playerDrawn) drawWorldPlayer(pos);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) drawFogGate(worldTile(tx, ty), sx(tx), sy(ty));
  }

  particles.forEach(pt => {
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x - camX), Math.round(pt.y - camY), 2, 2);
  });

  // Brume qui dérive sur toute l'île ; elle s'éclaircit à chaque mission terminée.
  const fog = 0.1 * (1 - game.done / (MISSIONS.length + 1));
  ctx.fillStyle = `rgba(185,180,210,${fog})`;
  for (let i = 0; i < 7; i++) {
    const fx = ((i * 97 + game.frame * 0.15 - camX * 0.5) % (VIEW_W + 120) + VIEW_W + 120) % (VIEW_W + 120) - 60;
    const fy = ((i * 61 - camY * 0.5) % (VIEW_H + 60) + VIEW_H + 60) % (VIEW_H + 60) - 30;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 60, 18, 0, 0, 7);
    ctx.fill();
  }
  const vignette = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 60, VIEW_W / 2, VIEW_H / 2, 200);
  vignette.addColorStop(0, 'rgba(15,10,25,0)');
  vignette.addColorStop(1, 'rgba(15,10,25,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (game.state !== 'world') return;
  if (game.messages.length) drawTextBox(game.messages[0], true);
  else {
    const action = worldAction();
    if (action) drawTextBox(action.text, false);
  }
}
