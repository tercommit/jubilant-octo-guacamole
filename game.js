'use strict';

const TILE = 16;
const VIEW_W = 320;
const VIEW_H = 180;
const STEP = 1 / 60;

// Réglages de la physique (en pixels par image).
const ACCEL = 0.35;
const MAX_SPEED = 2.4;
const GRAVITY = 0.42;
const JUMP_SPEED = -7.6;
const MAX_FALL = 7;
const COYOTE_FRAMES = 6;
const JUMP_BUFFER_FRAMES = 6;
const START_LIVES = 3;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const hud = {
  lives: document.getElementById('lives'),
  coins: document.getElementById('coins'),
  level: document.getElementById('level'),
};
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const newGameBtn = document.getElementById('new-game');

/* ---------- Sauvegarde dans le navigateur (localStorage) ---------- */

const SAVE_KEY = 'petit-saut-sauvegarde';

function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data && data.level > 0 && data.level < LEVELS.length) return data;
  } catch (_) { /* stockage indisponible ou données invalides */ }
  return null;
}

function writeSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ level: game.levelIndex, coins: game.coinsAtLevelStart }));
  } catch (_) { /* navigation privée, stockage plein… on continue sans sauvegarde */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* rien à faire */ }
}

/* ---------- Entrées clavier et tactiles ---------- */

const input = { left: false, right: false, jump: false, jumpPressed: false };
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', Space: 'jump',
};

function press(action, down) {
  if (action === 'jump' && down && !input.jump) input.jumpPressed = true;
  input[action] = down;
}

addEventListener('keydown', e => {
  const action = KEYS[e.code];
  if (action) { e.preventDefault(); press(action, true); }
  if (e.code === 'Space' || e.code === 'Enter') onConfirm();
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyN' && !overlay.hidden && game.state !== 'pause') { clearSave(); startGame(); }
});
addEventListener('keyup', e => {
  const action = KEYS[e.code];
  if (action) press(action, false);
});

document.querySelectorAll('[data-action]').forEach(btn => {
  const action = btn.dataset.action;
  const set = down => e => {
    e.preventDefault();
    press(action, down);
    if (down) onConfirm();
  };
  btn.addEventListener('pointerdown', set(true));
  btn.addEventListener('pointerup', set(false));
  btn.addEventListener('pointercancel', set(false));
  btn.addEventListener('pointerleave', set(false));
});
overlay.addEventListener('pointerdown', () => onConfirm());
// Safari iOS ignore user-scalable=no : on bloque nous-mêmes le zoom à deux doigts.
addEventListener('gesturestart', e => e.preventDefault());
addEventListener('touchmove', e => e.preventDefault(), { passive: false });
newGameBtn && newGameBtn.addEventListener('pointerdown', e => {
  e.stopPropagation();
  clearSave();
  startGame();
});

/* ---------- Sons générés (Web Audio) ---------- */

let audio = null;

// iOS/Safari n'autorise le son qu'après un geste de l'utilisateur :
// on crée et on « déverrouille » le contexte audio au premier toucher ou à la première touche.
function unlockAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch (_) { /* pas de son disponible */ }
}
['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, unlockAudio, { capture: true }));

function sfx(type) {
  if (!audio) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const tones = {
      jump: ['square', 300, 600, 0.12],
      coin: ['square', 880, 1320, 0.1],
      stomp: ['triangle', 400, 80, 0.15],
      hurt: ['sawtooth', 300, 60, 0.4],
      win: ['square', 520, 1040, 0.5],
    };
    const [wave, from, to, dur] = tones[type];
    osc.type = wave;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch (_) { /* pas de son disponible */ }
}

/* ---------- État du jeu ---------- */

const game = {
  state: 'title', // title | play | pause | dying | clear | over | win
  levelIndex: 0,
  lives: START_LIVES,
  coins: 0,
  coinsAtLevelStart: 0,
  timer: 0,
  frame: 0,
};

let map, player, enemies, coins, flag, particles, camX, camY;

function tileAt(tx, ty) {
  if (tx < 0 || tx >= map.w) return '#';
  if (ty < 0 || ty >= map.h) return '.';
  return map.rows[ty][tx];
}
const isSolid = (tx, ty) => { const t = tileAt(tx, ty); return t === '#' || t === '='; };

function loadLevel(i, save = true) {
  const rows = LEVELS[i].map(r => r.split(''));
  map = { rows, w: rows[0].length, h: rows.length };
  enemies = [];
  coins = [];
  particles = [];
  rows.forEach((row, ty) => row.forEach((t, tx) => {
    const x = tx * TILE, y = ty * TILE;
    if (t === 'P') { player = makePlayer(x + 3, y + 2); row[tx] = '.'; }
    if (t === 'e') { enemies.push({ x: x + 2, y: y + 7, w: 12, h: 9, vx: -0.5, vy: 0, dead: 0 }); row[tx] = '.'; }
    if (t === 'o') { coins.push({ x: x + 3, y: y + 2, w: 10, h: 11, taken: false }); row[tx] = '.'; }
    if (t === 'F') { flag = { x: x + 7, y: y - 4 * TILE, w: 4, h: 5 * TILE }; row[tx] = '.'; }
  }));
  game.coinsAtLevelStart = game.coins;
  if (save) writeSave();
  updateCamera(true);
  updateHud();
}

function makePlayer(x, y) {
  return { x, y, w: 10, h: 14, vx: 0, vy: 0, onGround: false, coyote: 0, buffer: 0, facing: 1, anim: 0 };
}

/* ---------- Déplacements et collisions ---------- */

// Déplace une entité puis la recale contre les tuiles solides. Renvoie {hitX, hitY}.
function moveAndCollide(e) {
  const hit = { x: false, y: false };

  e.x += e.vx;
  const top = Math.floor(e.y / TILE), bottom = Math.floor((e.y + e.h - 1) / TILE);
  if (e.vx !== 0) {
    const edge = e.vx > 0 ? e.x + e.w - 1 : e.x;
    const tx = Math.floor(edge / TILE);
    for (let ty = top; ty <= bottom; ty++) {
      if (isSolid(tx, ty)) {
        e.x = e.vx > 0 ? tx * TILE - e.w : (tx + 1) * TILE;
        e.vx = 0;
        hit.x = true;
        break;
      }
    }
  }

  e.y += e.vy;
  e.onGround = false;
  const left = Math.floor(e.x / TILE), right = Math.floor((e.x + e.w - 1) / TILE);
  if (e.vy !== 0) {
    const edge = e.vy > 0 ? e.y + e.h - 1 : e.y;
    const ty = Math.floor(edge / TILE);
    for (let tx = left; tx <= right; tx++) {
      if (isSolid(tx, ty)) {
        if (e.vy > 0) { e.y = ty * TILE - e.h; e.onGround = true; }
        else e.y = (ty + 1) * TILE;
        e.vy = 0;
        hit.y = true;
        break;
      }
    }
  }
  return hit;
}

const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function touchesSpikes(e) {
  const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
  const y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 1) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      // Seule la partie basse de la tuile (les pointes) est dangereuse.
      if (tileAt(tx, ty) === '^' && overlaps(e, { x: tx * TILE + 1, y: ty * TILE + 8, w: 14, h: 6 })) return true;
    }
  }
  return false;
}

function burst(x, y, color, n = 6) {
  for (let i = 0; i < n; i++) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, life: 30, color });
  }
}

/* ---------- Mise à jour ---------- */

function updatePlayer() {
  const p = player;
  if (input.left) { p.vx -= ACCEL; p.facing = -1; }
  if (input.right) { p.vx += ACCEL; p.facing = 1; }
  if (!input.left && !input.right) p.vx *= p.onGround ? 0.75 : 0.92;
  p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx));
  if (Math.abs(p.vx) < 0.05) p.vx = 0;

  // Petite marge de tolérance : on peut sauter juste après avoir quitté un bord,
  // ou appuyer un peu avant d'atterrir.
  p.coyote = p.onGround ? COYOTE_FRAMES : p.coyote - 1;
  p.buffer = input.jumpPressed ? JUMP_BUFFER_FRAMES : p.buffer - 1;
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = JUMP_SPEED;
    p.buffer = p.coyote = 0;
    sfx('jump');
    burst(p.x + p.w / 2, p.y + p.h, '#ffffff', 3);
  }

  // Relâcher le saut plus tôt donne un saut plus court.
  p.vy += !input.jump && p.vy < 0 ? GRAVITY * 2.5 : GRAVITY;
  p.vy = Math.min(p.vy, MAX_FALL);
  moveAndCollide(p);
  p.anim += Math.abs(p.vx) * 0.12;

  coins.forEach(c => {
    if (!c.taken && overlaps(p, c)) {
      c.taken = true;
      game.coins++;
      sfx('coin');
      burst(c.x + 5, c.y + 5, '#fbf236');
      updateHud();
    }
  });

  for (const en of enemies) {
    if (en.dead || !overlaps(p, en)) continue;
    if (p.vy > 0 && p.y + p.h - en.y < 8) {
      en.dead = 1;
      p.vy = input.jump ? JUMP_SPEED : -5;
      sfx('stomp');
      burst(en.x + 6, en.y + 4, '#99e550');
    } else {
      return hurt();
    }
  }

  if (touchesSpikes(p) || p.y > map.h * TILE + 32) return hurt();

  if (overlaps(p, flag)) {
    game.state = 'clear';
    game.timer = 90;
    sfx('win');
  }
}

function updateEnemies() {
  for (const en of enemies) {
    if (en.dead) { en.dead++; continue; }
    en.vy = Math.min(en.vy + GRAVITY, MAX_FALL);
    const dir = Math.sign(en.vx);
    const hit = moveAndCollide(en);
    // Demi-tour contre un mur, au bord du vide ou devant des piques.
    const aheadX = Math.floor((dir > 0 ? en.x + en.w + 1 : en.x - 1) / TILE);
    const footY = Math.floor((en.y + en.h - 1) / TILE);
    const noFloor = en.onGround && !isSolid(aheadX, footY + 1);
    if (hit.x || noFloor || tileAt(aheadX, footY) === '^') en.vx = -dir * 0.5;
    else en.vx = dir * 0.5;
  }
  enemies = enemies.filter(en => en.dead < 40 && en.y < map.h * TILE + 64);
}

function hurt() {
  game.state = 'dying';
  game.timer = 80;
  game.lives--;
  player.vy = -6;
  player.vx = 0;
  sfx('hurt');
  updateHud();
}

function updateCamera(snap) {
  const maxX = map.w * TILE - VIEW_W, maxY = map.h * TILE - VIEW_H;
  const tx = Math.max(0, Math.min(maxX, player.x + player.w / 2 - VIEW_W / 2 + player.facing * 24));
  const ty = Math.max(0, Math.min(maxY, player.y - VIEW_H / 2 + 20));
  camX = snap ? tx : camX + (tx - camX) * 0.12;
  camY = snap ? ty : camY + (ty - camY) * 0.12;
}

function update() {
  game.frame++;
  particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life--; });
  particles = particles.filter(pt => pt.life > 0);

  if (game.state === 'play') {
    updatePlayer();
    updateEnemies();
    updateCamera(false);
  } else if (game.state === 'dying') {
    player.vy += GRAVITY * 0.6;
    player.y += player.vy;
    if (--game.timer <= 0) {
      if (game.lives <= 0) {
        game.state = 'over';
        showMenu('Partie terminée');
      } else {
        game.coins = game.coinsAtLevelStart;
        loadLevel(game.levelIndex);
        game.state = 'play';
      }
    }
  } else if (game.state === 'clear') {
    updateEnemies();
    if (--game.timer <= 0) {
      if (game.levelIndex + 1 < LEVELS.length) {
        game.levelIndex++;
        loadLevel(game.levelIndex);
        game.state = 'play';
      } else {
        game.state = 'win';
        clearSave();
        showOverlay('Bravo !', `Tous les niveaux sont terminés.<br>Pièces : ${game.coins}<br>Espace ou toucher pour rejouer`);
      }
    }
  }
  input.jumpPressed = false;
}

/* ---------- Affichage ---------- */

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#5fcde4');
  sky.addColorStop(1, '#cbf1f5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Nuages
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 137 - camX * 0.1) % (VIEW_W + 80) + VIEW_W + 80) % (VIEW_W + 80) - 40;
    const y = 18 + (i * 53) % 50;
    ctx.fillRect(x, y, 28, 6);
    ctx.fillRect(x + 6, y - 4, 14, 4);
  }

  // Collines en deux couches, pour l'effet de profondeur
  const hills = [[0.2, 110, '#a2d89b', 0.03, 18], [0.45, 130, '#6abe30', 0.05, 14]];
  for (const [speed, base, color, freq, amp] of hills) {
    ctx.fillStyle = color;
    for (let x = 0; x < VIEW_W; x += 2) {
      const wx = x + camX * speed;
      const h = base - camY * speed + Math.sin(wx * freq) * amp + Math.sin(wx * freq * 2.3) * amp * 0.4;
      ctx.fillRect(x, Math.round(h), 2, VIEW_H);
    }
  }
}

function drawTiles() {
  const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + VIEW_W) / TILE);
  const y0 = Math.floor(camY / TILE), y1 = Math.ceil((camY + VIEW_H) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(tx, ty);
      const x = Math.round(tx * TILE - camX), y = Math.round(ty * TILE - camY);
      if (t === '#') ctx.drawImage(isSolid(tx, ty - 1) ? SPRITES.dirt : SPRITES.grass, x, y);
      else if (t === '=') ctx.drawImage(SPRITES.brick, x, y);
      else if (t === '^') ctx.drawImage(SPRITES.spikes, x, y);
      else if (t === 'b') ctx.drawImage(SPRITES.bush, x, y);
    }
  }
}

function drawSprite(img, x, y, flip) {
  x = Math.round(x - camX);
  y = Math.round(y - camY);
  if (!flip) return ctx.drawImage(img, x, y);
  ctx.save();
  ctx.translate(x + img.width, y);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function drawFlag() {
  const x = Math.round(flag.x - camX), y = Math.round(flag.y - camY);
  ctx.fillStyle = '#222034';
  ctx.fillRect(x, y, 3, flag.h);
  ctx.fillStyle = '#cbdbfc';
  ctx.fillRect(x + 1, y, 1, flag.h);
  ctx.fillStyle = '#fbf236';
  ctx.fillRect(x - 1, y - 3, 5, 4);
  const wave = Math.sin(game.frame * 0.15) * 2;
  ctx.fillStyle = '#d95763';
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 2);
  ctx.lineTo(x + 20, y + 8 + wave);
  ctx.lineTo(x + 3, y + 14);
  ctx.fill();
}

function draw() {
  drawBackground();
  drawTiles();
  drawFlag();

  coins.forEach((c, i) => {
    if (c.taken) return;
    // Rotation simulée en écrasant la pièce horizontalement.
    const s = Math.abs(Math.cos(game.frame * 0.06 + i * 0.5));
    const img = SPRITES.coin;
    const w = Math.max(2, Math.round(img.width * s));
    ctx.drawImage(img, Math.round(c.x - 3 - camX + (img.width - w) / 2), Math.round(c.y - 2 - camY), w, img.height);
  });

  enemies.forEach(en => {
    const img = en.dead ? SPRITES.slimeFlat : SPRITES.slime[(game.frame >> 4) & 1];
    if (en.dead && en.dead > 25 && en.dead % 4 < 2) return;
    drawSprite(img, en.x - 2, en.y - 7, en.vx > 0);
  });

  if (game.state !== 'title') {
    const p = player;
    let frame = 'idle';
    if (game.state === 'dying' || !p.onGround) frame = 'jump';
    else if (Math.abs(p.vx) > 0.3) frame = Math.floor(p.anim) % 2 ? 'run1' : 'run2';
    drawSprite(SPRITES.player[frame], p.x - 3, p.y - 2, p.facing < 0);
  }

  particles.forEach(pt => {
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x - camX), Math.round(pt.y - camY), 2, 2);
  });
}

/* ---------- Interface ---------- */

function updateHud() {
  hud.lives.textContent = '♥'.repeat(Math.max(0, game.lives));
  hud.coins.textContent = game.coins;
  hud.level.textContent = `${game.levelIndex + 1}/${LEVELS.length}`;
}

function showOverlay(title, text, canRestart = false) {
  overlayTitle.textContent = title;
  overlayText.innerHTML = text;
  if (newGameBtn) newGameBtn.hidden = !canRestart;
  overlay.hidden = false;
}

// Écran d'accueil ou de fin de partie : propose de reprendre au niveau sauvegardé.
function showMenu(title) {
  const save = loadSave();
  if (save) {
    showOverlay(title, `Espace ou toucher pour continuer au niveau ${save.level + 1}`, true);
  } else {
    showOverlay(title, `Espace ou toucher pour jouer`);
  }
}

function startGame() {
  const save = loadSave();
  game.levelIndex = save ? save.level : 0;
  game.lives = START_LIVES;
  game.coins = save ? save.coins : 0;
  loadLevel(game.levelIndex);
  game.state = 'play';
  overlay.hidden = true;
}

function onConfirm() {
  if (game.state === 'title' || game.state === 'over' || game.state === 'win') startGame();
  else if (game.state === 'pause') togglePause();
}

function togglePause() {
  if (game.state === 'play') {
    game.state = 'pause';
    showOverlay('Pause', 'P ou Échap pour reprendre');
  } else if (game.state === 'pause') {
    game.state = 'play';
    overlay.hidden = true;
  }
}

/* ---------- Boucle principale à pas fixe ---------- */

let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    if (game.state !== 'pause') update();
    acc -= STEP;
  }
  draw();
  requestAnimationFrame(loop);
}

// Le niveau sauvegardé (ou le niveau 1) sert de décor derrière l'écran d'accueil,
// pour que le numéro affiché corresponde à celui où l'on reprend.
const initialSave = loadSave();
if (initialSave) {
  game.levelIndex = initialSave.level;
  game.coins = initialSave.coins;
}
loadLevel(game.levelIndex, false);
showMenu('Petit Saut');
requestAnimationFrame(loop);
