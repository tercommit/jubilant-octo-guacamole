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
const SHIELD_FRAMES = 120; // 2 s d'invincibilité
const SHIELD_COOLDOWN = 240; // puis 4 s de recharge
const RAVAGE_COOLDOWN = 60; // évite de lancer deux ravageuses d'un coup par erreur

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Le canvas a deux fois plus de pixels que la vue : le décor est agrandi ×2,
// et le personnage, plus détaillé, profite de la pleine résolution.
const PIXEL_SCALE = 2;
ctx.setTransform(PIXEL_SCALE, 0, 0, PIXEL_SCALE, 0, 0);
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
    if (!data) return null;
    // Ancienne sauvegarde ({ level, coins }) : les niveaux passés deviennent des missions terminées.
    if (data.done === undefined && data.level > 0) {
      const done = Math.min(data.level, MISSIONS.length - 1);
      return { done, coins: data.coins || 0, powers: { shield: done >= 1, ravage: done >= 2 } };
    }
    if (data.done >= 0 && data.done < MISSIONS.length) return data;
  } catch (_) { /* stockage indisponible ou données invalides */ }
  return null;
}

function writeSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      done: game.done,
      lives: game.lives,
      coins: game.view === 'level' ? game.coinsAtLevelStart : game.coins,
      powers: game.powers,
      x: world.x,
      y: world.y,
    }));
  } catch (_) { /* navigation privée, stockage plein… on continue sans sauvegarde */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* rien à faire */ }
}

/* ---------- Entrées clavier et tactiles ---------- */

const input = {
  left: false, right: false, up: false, down: false,
  jump: false, jumpPressed: false, power: false, powerPressed: false, ravage: false, ravagePressed: false,
};
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', Space: 'jump',
  KeyX: 'power', KeyC: 'ravage',
};
// Haut et bas ne servent que sur la carte de l'île (en mission, haut fait sauter).
const VERTICAL_KEYS = { ArrowUp: 'up', KeyW: 'up', KeyZ: 'up', ArrowDown: 'down', KeyS: 'down' };

function press(action, down) {
  if (action === 'jump' && down && !input.jump) input.jumpPressed = true;
  if (action === 'power' && down && !input.power) input.powerPressed = true;
  if (action === 'ravage' && down && !input.ravage) input.ravagePressed = true;
  input[action] = down;
}

addEventListener('keydown', e => {
  const action = KEYS[e.code];
  if (action) { e.preventDefault(); press(action, true); }
  if (VERTICAL_KEYS[e.code]) { e.preventDefault(); press(VERTICAL_KEYS[e.code], true); }
  if (e.code === 'Space' || e.code === 'Enter') onConfirm();
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyN' && !overlay.hidden && game.state !== 'pause') { clearSave(); startGame(); }
});
addEventListener('keyup', e => {
  const action = KEYS[e.code];
  if (action) press(action, false);
  if (VERTICAL_KEYS[e.code]) press(VERTICAL_KEYS[e.code], false);
});

document.querySelectorAll('[data-action]').forEach(btn => {
  const action = btn.dataset.action;
  const set = down => e => {
    e.preventDefault();
    press(action, down);
    // Seul le bouton A agit (entrer, boire, lire), sauf sur les écrans de menu où tout bouton convient.
    if (down && (action === 'jump' || !overlay.hidden)) onConfirm();
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
      shield: ['sine', 300, 900, 0.3],
      pickup: ['square', 440, 1760, 0.5],
      drop: ['triangle', 900, 300, 0.08],
      ravage: ['sawtooth', 1200, 40, 0.8],
      lantern: ['sine', 600, 1200, 0.25],
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
  state: 'title', // title | world | play | pause | dying | clear | over | win
  view: 'world', // ce qui est affiché : l'île (world) ou une mission (level)
  paused: null, // état à retrouver en sortant de la pause
  done: 0, // nombre de missions terminées
  powers: { shield: false, ravage: false },
  checkpoint: null, // lanterne atteinte dans la mission en cours
  banner: null, // court message en haut de l'écran, sans mettre le jeu en pause
  flash: 0, // éclair blanc de la ravageuse
  ending: null, // 'normal' ou 'sacrifice'
  messages: [], // textes à lire (Espace / A pour passer au suivant)
  mission: 0,
  levelIndex: 0,
  lives: START_LIVES,
  coins: 0,
  coinsAtLevelStart: 0,
  timer: 0,
  frame: 0,
};

let map, player, enemies, coins, flag, particles = [], camX = 0, camY = 0;
let pickups = [], rainClouds = [], drops = [], lanterns = [];

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
  pickups = [];
  rainClouds = [];
  drops = [];
  lanterns = [];
  flag = null;
  boss = null;
  arena = null;
  rows.forEach((row, ty) => row.forEach((t, tx) => {
    const x = tx * TILE, y = ty * TILE;
    if (t === 'P') { player = makePlayer(x + 3, y + 2); row[tx] = '.'; }
    if (t === 'e' || t === 's') {
      enemies.push({ type: t === 's' ? 'spiky' : 'slime', x: x + 2, y: y + 7, w: 12, h: 9, vx: -0.5, vy: 0, dead: 0 });
      row[tx] = '.';
    }
    if (t === 'G') { enemies.push({ type: 'guard', x: x - 6, y: y + 16 - 30, w: 28, h: 30, vx: 0, vy: 0, dead: 0 }); row[tx] = '.'; }
    if (t === 'k') { lanterns.push({ x: x + 4, y: y - 8, w: 8, h: 24, lit: false }); row[tx] = '.'; }
    if (t === 'A') { arena = { x }; row[tx] = '.'; }
    if (t === 'K') { boss = makeBoss(x, y); row[tx] = '.'; }
    if (t === 'o') { coins.push({ x: x + 3, y: y + 2, w: 10, h: 11, taken: false }); row[tx] = '.'; }
    if (t === 'F') { flag = { x: x + 7, y: y - 4 * TILE, w: 4, h: 5 * TILE }; row[tx] = '.'; }
    if (t === 'B') {
      if (!game.powers.shield) pickups.push({ x: x + 2, y: y + 2, w: 12, h: 12, power: 'shield' });
      row[tx] = '.';
    }
    if (t === 'R') {
      if (!game.powers.ravage) pickups.push({ x: x + 2, y: y + 2, w: 12, h: 12, power: 'ravage' });
      row[tx] = '.';
    }
    if (t === 'c') { rainClouds.push({ x, y, timer: Math.random() * 60 }); row[tx] = '.'; }
  }));
  // Reprise à la dernière lanterne : ce qui est derrière elle a déjà été franchi.
  const cp = game.checkpoint;
  if (cp) {
    player.x = cp.x;
    player.y = cp.y;
    lanterns.forEach(l => { if (l.x <= cp.x) l.lit = true; });
    enemies = enemies.filter(en => en.x > cp.x + 24);
  }
  game.coinsAtLevelStart = game.coins;
  if (save) writeSave();
  updateCamera(true);
  updateHud();
}

function makePlayer(x, y) {
  return {
    x, y, w: 10, h: 14, vx: 0, vy: 0, onGround: false, coyote: 0, buffer: 0, facing: 1, anim: 0,
    shield: 0, // images de bouclier restantes
    shieldCooldown: 0,
    ravageCooldown: 0,
  };
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
    // Bord bas exact (et pas « - 1 ») : sinon une chute de moins d'un pixel ne touche pas
    // le sol, et onGround alterne vrai/faux une image sur deux quand on marche.
    const edge = e.vy > 0 ? e.y + e.h - 0.001 : e.y;
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

// Seule une partie de la tuile est dangereuse : le bas pour les piques, sous la surface pour le liquide.
const HAZARD_BOXES = { '^': { x: 1, y: 8, w: 14, h: 6 }, L: { x: 0, y: 6, w: 16, h: 10 } };

function touchesTile(e, tile) {
  const box = HAZARD_BOXES[tile];
  const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 1) / TILE);
  const y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 1) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (tileAt(tx, ty) === tile && overlaps(e, { x: tx * TILE + box.x, y: ty * TILE + box.y, w: box.w, h: box.h })) return true;
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

  updateShield(p);
  updateRavage(p);
  if (game.state !== 'play') return;

  for (const pk of pickups) {
    if (pk.taken || !overlaps(p, pk)) continue;
    pk.taken = true;
    game.powers[pk.power] = true;
    sfx('pickup');
    burst(pk.x + 6, pk.y + 6, pk.power === 'ravage' ? '#df7126' : '#5fcde4', 14);
    writeSave();
    updateHud();
    showMessages(POWER_TEXTS[pk.power]);
  }

  for (const en of enemies) {
    if (en.dead || !overlaps(p, en)) continue;
    if (en.type === 'guard') {
      // Le gardien bouche le tunnel : même protégée, Lyra ne peut pas passer.
      p.x = p.x + p.w / 2 < en.x + en.w / 2 ? en.x - p.w : en.x + en.w;
      p.vx = 0;
      if (!p.shield) return hurt();
    } else if (en.type === 'slime' && p.vy > 0 && p.y + p.h - en.y < 8) {
      en.dead = 1;
      p.vy = input.jump ? JUMP_SPEED : -5;
      sfx('stomp');
      burst(en.x + 6, en.y + 4, '#99e550');
    } else if (!p.shield) {
      return hurt();
    }
  }

  // Le bouclier protège de tout, sauf des chutes dans le vide, du poison et de la lave.
  if ((touchesTile(p, '^') && !p.shield) || touchesTile(p, 'L') || p.y > map.h * TILE + 32) return hurt();

  for (const l of lanterns) {
    if (l.lit || !overlaps(p, l)) continue;
    l.lit = true;
    game.checkpoint = { x: l.x - 1, y: p.y };
    sfx('lantern');
    burst(l.x + 4, l.y + 4, '#fbf236', 10);
    showBanner('Lanterne allumée : point de reprise');
  }

  if (flag && overlaps(p, flag)) {
    game.state = 'clear';
    game.timer = 90;
    sfx('win');
  }
}

const POWER_TEXTS = {
  ravage: [
    'Lyra retrouve un autre fragment de magie : la ravageuse !',
    'C (ou bouton R) : détruit tous les ennemis à l\'écran, mais coûte une vie.',
    'Avec la dernière vie, Lyra y laisse ses dernières forces. Plus loin, un gardien bouche le tunnel : lui seul ne craint rien d\'autre.',
  ],
  shield: [
    'Lyra retrouve un fragment de sa magie : le bouclier !',
    'X (ou bouton B) : 2 secondes d\'invincibilité, puis 4 secondes de recharge.',
    'Méfie-toi des nuages de brume : leur pluie de slime est impossible à esquiver entièrement.',
  ],
};

function updateShield(p) {
  if (p.shield > 0) {
    if (--p.shield === 0) p.shieldCooldown = SHIELD_COOLDOWN;
  } else if (p.shieldCooldown > 0) {
    p.shieldCooldown--;
  } else if (input.powerPressed && game.powers.shield) {
    p.shield = SHIELD_FRAMES;
    sfx('shield');
  }
}

// La ravageuse détruit tout ce qui est à l'écran, au prix d'une vie.
function updateRavage(p) {
  if (p.ravageCooldown > 0) { p.ravageCooldown--; return; }
  if (!input.ravagePressed || !game.powers.ravage) return;
  p.ravageCooldown = RAVAGE_COOLDOWN;
  game.lives--;
  game.flash = 30;
  sfx('ravage');
  updateHud();
  const onScreen = e => e.x + e.w > camX && e.x < camX + VIEW_W;
  for (const en of enemies) {
    if (en.dead || !onScreen(en)) continue;
    en.dead = 1;
    burst(en.x + en.w / 2, en.y + en.h / 2, en.type === 'guard' ? '#9badb7' : '#df7126', en.type === 'guard' ? 20 : 8);
  }
  drops = drops.filter(d => !onScreen(d));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    particles.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, life: 25, color: '#fbf236' });
  }
  if (boss && ravageBoss()) return;
  if (game.lives <= 0) hurt(0); // dernière vie : Lyra s'effondre et la mission est perdue
  else writeSave();
}

function showBanner(text) {
  game.banner = { text, timer: 150 };
}

// Les nuages de brume lâchent des gouttes de slime quand Lyra approche.
function updateRain() {
  const px = player.x + player.w / 2;
  for (const c of rainClouds) {
    if (Math.abs(c.x + 8 - px) > VIEW_W) continue;
    if (--c.timer <= 0) {
      drops.push({ x: c.x + 2 + Math.random() * 10, y: c.y + 10, w: 4, h: 6, vy: 1 });
      c.timer = 35 + Math.random() * 40;
    }
  }
  for (const d of drops) {
    d.vy = Math.min(d.vy + 0.12, 3.5);
    d.y += d.vy;
    if (isSolid(Math.floor((d.x + 2) / TILE), Math.floor((d.y + d.h) / TILE)) || d.y > map.h * TILE) {
      d.gone = true;
      if (d.y < map.h * TILE && Math.abs(d.x - px) < VIEW_W / 2) burst(d.x + 2, d.y + d.h, '#76428a', 2);
    } else if (overlaps(player, d)) {
      d.gone = true;
      if (player.shield) {
        burst(d.x + 2, d.y + 3, '#5fcde4', 3);
        sfx('drop');
      } else {
        return hurt();
      }
    }
  }
  drops = drops.filter(d => !d.gone);
}

function updateEnemies() {
  for (const en of enemies) {
    if (en.dead) { en.dead++; continue; }
    if (en.type === 'guard') continue; // le gardien ne bouge pas
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

function hurt(cost = 1) {
  game.state = 'dying';
  game.timer = 80;
  game.lives -= cost;
  player.vy = -6;
  player.vx = 0;
  sfx('hurt');
  updateHud();
}

function updateCamera(snap) {
  const maxX = map.w * TILE - VIEW_W, maxY = map.h * TILE - VIEW_H;
  let tx = Math.max(0, Math.min(maxX, player.x + player.w / 2 - VIEW_W / 2 + player.facing * 24));
  if (boss && boss.active) tx = Math.min(maxX, arena.x); // pendant le combat, la caméra reste sur l'arène
  const ty = Math.max(0, Math.min(maxY, player.y - VIEW_H / 2 + 20));
  camX = snap ? tx : camX + (tx - camX) * 0.12;
  camY = snap ? ty : camY + (ty - camY) * 0.12;
}

function update() {
  game.frame++;
  if (game.flash > 0) game.flash--;
  if (game.banner && --game.banner.timer <= 0) game.banner = null;
  particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life--; });
  particles = particles.filter(pt => pt.life > 0);

  if (game.messages.length && (game.state === 'world' || game.state === 'play')) {
    // Le jeu attend qu'on ait lu le texte affiché.
  } else if (game.state === 'world') {
    updateWorld();
  } else if (game.state === 'play') {
    updatePlayer();
    if (game.state === 'play') updateRain();
    if (game.state === 'play') updateBoss();
    updateEnemies();
    updateCamera(false);
  } else if (game.state === 'dying') {
    player.vy += GRAVITY * 0.6;
    player.y += player.vy;
    if (--game.timer <= 0) {
      if (game.lives <= 0) {
        // Plus de vies : Lyra se réveille près de la source, soignée, sans avoir fini la mission.
        game.state = 'over';
        game.lives = START_LIVES;
        game.coins = game.coinsAtLevelStart;
        placeOnWorld(world.start.x, world.start.y);
        game.view = 'world';
        writeSave();
        showOverlay('Partie terminée', 'Lyra se réveille près de la source de soin.<br>Espace ou toucher pour continuer');
      } else {
        game.coins = game.coinsAtLevelStart;
        loadLevel(game.levelIndex);
        game.state = 'play';
      }
    }
  } else if (game.state === 'clear') {
    updateEnemies();
    if (--game.timer <= 0) finishMission();
  } else if (game.state === 'ending') {
    updateEnding();
  }
  input.jumpPressed = false;
  input.powerPressed = false;
  input.ravagePressed = false;
}

/* ---------- Affichage ---------- */

// Couleurs du décor de fond, selon la mission.
const THEMES = {
  default: { sky: ['#5fcde4', '#cbf1f5'], clouds: '#ffffff', hills: ['#a2d89b', '#6abe30'] },
  forest: { sky: ['#1b2633', '#5b7470'], clouds: 'rgba(200,210,220,0.18)', hills: ['#2f4a3c', '#22382b'], fog: 0.16 },
  swamp: {
    sky: ['#1d2420', '#55603f'], clouds: 'rgba(170,200,140,0.15)', hills: ['#34422c', '#26331f'],
    fog: 0.14, fogColor: '170,200,150', ground: 'moss', liquid: ['#3d2450', '#9b5fc0'],
  },
  volcano: {
    sky: ['#170c12', '#6b2a1e'], clouds: 'rgba(255,140,80,0.12)', hills: ['#3b2226', '#2a171a'],
    fog: 0.08, fogColor: '255,130,70', ground: 'rock', liquid: ['#b3401b', '#f2a33a'],
  },
};

function levelTheme() {
  return THEMES[MISSIONS[game.mission].theme] || THEMES.default;
}

function drawBackground() {
  const theme = levelTheme();
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Nuages
  ctx.fillStyle = theme.clouds;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 137 - camX * 0.1) % (VIEW_W + 80) + VIEW_W + 80) % (VIEW_W + 80) - 40;
    const y = 18 + (i * 53) % 50;
    ctx.fillRect(x, y, 28, 6);
    ctx.fillRect(x + 6, y - 4, 14, 4);
  }

  // Collines en deux couches, pour l'effet de profondeur
  const hills = [[0.2, 110, theme.hills[0], 0.03, 18], [0.45, 130, theme.hills[1], 0.05, 14]];
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
  const theme = levelTheme();
  const top = { moss: SPRITES.moss, rock: SPRITES.rockTop }[theme.ground] || SPRITES.grass;
  const under = theme.ground === 'rock' ? SPRITES.rock : SPRITES.dirt;
  const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + VIEW_W) / TILE);
  const y0 = Math.floor(camY / TILE), y1 = Math.ceil((camY + VIEW_H) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(tx, ty);
      const x = Math.round(tx * TILE - camX), y = Math.round(ty * TILE - camY);
      if (t === '#') ctx.drawImage(isSolid(tx, ty - 1) ? under : top, x, y);
      else if (t === 'L') drawLiquidTile(tx, ty, x, y, theme.liquid || ['#3d2450', '#9b5fc0']);
      else if (t === '=') ctx.drawImage(SPRITES.brick, x, y);
      else if (t === '^') ctx.drawImage(SPRITES.spikes, x, y);
      else if (t === 'b') ctx.drawImage(SPRITES.bush, x, y);
    }
  }
}

function drawLiquidTile(tx, ty, x, y, [base, light]) {
  const surface = tileAt(tx, ty - 1) === 'L' ? 0 : 6;
  ctx.fillStyle = base;
  ctx.fillRect(x, y + surface, 16, 16 - surface);
  ctx.fillStyle = light;
  if (surface) ctx.fillRect(x, y + surface, 16, 1);
  const phase = Math.floor(game.frame / 20 + tx * 5 + ty * 3) % 12;
  ctx.fillRect(x + phase, y + surface + 4, 3, 1);
  if ((game.frame + tx * 13) % 90 < 12) ctx.fillRect(x + (tx * 7) % 12 + 2, y + surface - 2 + ((game.frame + tx * 13) % 90 >> 2), 2, 2);
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

// Dessine une image de la planche du joueur, centrée sur (cx) et posée sur (bottom).
function drawPlayer(index, cx, bottom, flip, scale = 0.5) {
  if (!playerSheet.complete || !playerSheet.naturalWidth) return;
  const w = PLAYER_FRAME_W * scale, h = PLAYER_FRAME_H * scale;
  const x = Math.round(cx - camX - w / 2), y = Math.round(bottom - camY - h);
  ctx.save();
  if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); } else ctx.translate(x, y);
  ctx.drawImage(playerSheet, index * PLAYER_FRAME_W, 0, PLAYER_FRAME_W, PLAYER_FRAME_H, 0, 0, w, h);
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
  if (game.view === 'world') return drawWorld();
  if (game.view === 'ending') return drawEndingScene();
  drawBackground();
  drawTiles();
  if (flag) drawFlag();
  lanterns.forEach(drawLantern);

  coins.forEach((c, i) => {
    if (c.taken) return;
    // Rotation simulée en écrasant la pièce horizontalement.
    const s = Math.abs(Math.cos(game.frame * 0.06 + i * 0.5));
    const img = SPRITES.coin;
    const w = Math.max(2, Math.round(img.width * s));
    ctx.drawImage(img, Math.round(c.x - 3 - camX + (img.width - w) / 2), Math.round(c.y - 2 - camY), w, img.height);
  });

  enemies.forEach(en => {
    if (en.dead && en.dead > 25 && en.dead % 4 < 2) return;
    const step = (game.frame >> 4) & 1;
    if (en.type === 'guard') {
      if (en.dead) return;
      const x = Math.round(en.x - 2 - camX), y = Math.round(en.y + en.h - 32 - camY);
      return ctx.drawImage(SPRITES.guard[step], x, y, 32, 32);
    }
    const sprites = en.type === 'spiky' ? SPRITES.spiky : SPRITES.slime;
    const img = en.dead ? SPRITES.slimeFlat : sprites[step];
    drawSprite(img, en.x - 2, en.y - 7, en.vx > 0);
  });

  drawBoss();

  pickups.forEach(drawPickup);

  {
    const p = player;
    let anim = 'idle', t = game.frame / 6;
    if (game.state === 'dying' || !p.onGround) anim = 'jump';
    else if (Math.abs(p.vx) > 0.3) { anim = 'walk'; t = p.anim * 1.2; }
    const [first, count] = PLAYER_ANIMS[anim];
    drawPlayer(first + (Math.floor(t) % count), p.x + p.w / 2, p.y + p.h, p.facing < 0);
    drawShieldBubble(p);
  }

  drops.forEach(d => drawSprite(SPRITES.drop, d.x, d.y));
  rainClouds.forEach(drawRainCloud);

  particles.forEach(pt => {
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x - camX), Math.round(pt.y - camY), 2, 2);
  });

  const fog = levelTheme().fog;
  if (fog) {
    // Bancs de brume au premier plan, qui défilent plus vite que le décor.
    ctx.fillStyle = `rgba(${levelTheme().fogColor || '190,200,210'},${fog})`;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 151 - camX * 1.2 + game.frame * 0.2) % (VIEW_W + 160) + VIEW_W + 160) % (VIEW_W + 160) - 80;
      ctx.beginPath();
      ctx.ellipse(x, 140 + (i * 37) % 40 - camY, 70, 10, 0, 0, 7);
      ctx.fill();
    }
  }

  if (game.flash) {
    ctx.fillStyle = `rgba(255,251,224,${game.flash / 30})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  drawShieldGauge();
  drawRavageGauge();
  if (game.banner) drawBanner(game.banner.text);
  if (game.messages.length) drawTextBox(game.messages[0], true);
}

function drawLantern(l) {
  const x = Math.round(l.x - camX), y = Math.round(l.y - camY);
  ctx.fillStyle = '#222034';
  ctx.fillRect(x + 3, y + 8, 2, 16);
  ctx.fillRect(x, y, 8, 9);
  ctx.fillStyle = l.lit ? '#fbf236' : '#45283c';
  ctx.fillRect(x + 1, y + 1, 6, 7);
  if (l.lit) {
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(game.frame * 0.1);
    ctx.fillStyle = '#fbf236';
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, 12, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#df7126';
    ctx.fillRect(x + 3, y + 3, 2, 3);
  }
}

function drawBanner(text) {
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  const w = Math.min(VIEW_W - 16, ctx.measureText(text).width + 16);
  const x = Math.round((VIEW_W - w) / 2), y = 40;
  ctx.fillStyle = 'rgba(34,32,52,0.85)';
  ctx.fillRect(x, y, w, 18);
  ctx.fillStyle = '#fbf236';
  ctx.fillText(text, x + 8, y + 5, w - 16);
}

// Icône de la ravageuse : une petite étoile d'éclat.
function drawRavageIcon(x, y, color = '#df7126') {
  ctx.fillStyle = '#222034';
  ctx.fillRect(x + 3, y - 1, 4, 12);
  ctx.fillRect(x - 1, y + 3, 12, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x + 4, y, 2, 10);
  ctx.fillRect(x, y + 4, 10, 2);
  ctx.fillRect(x + 2, y + 2, 6, 6);
  ctx.fillStyle = '#fbf236';
  ctx.fillRect(x + 4, y + 4, 2, 2);
}

function drawRavageGauge() {
  if (!game.powers.ravage || game.view !== 'level') return;
  const x = 8, y = game.powers.shield ? 38 : 22;
  // Rouge clignotant quand il ne reste qu'une vie : la lancer serait un sacrifice.
  const danger = game.lives <= 1 && (game.frame >> 4) % 2;
  drawRavageIcon(x, y, player.ravageCooldown ? '#847e87' : danger ? '#d95763' : '#df7126');
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#d95763';
  ctx.fillText('-1♥', x + 14, y + 2);
}

function drawPickup(pk) {
  if (pk.taken) return;
  const bob = Math.round(Math.sin(game.frame * 0.08) * 2);
  const x = Math.round(pk.x + 6 - camX), y = Math.round(pk.y + 6 - camY) + bob;
  ctx.globalAlpha = 0.3 + 0.2 * Math.sin(game.frame * 0.1);
  ctx.fillStyle = pk.power === 'ravage' ? '#df7126' : '#5fcde4';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (pk.power === 'ravage') drawRavageIcon(x - 5, y - 5);
  else drawShieldIcon(x - 4, y - 5);
}

// Petit écusson de 9 × 10 px.
function drawShieldIcon(x, y, color = '#5fcde4') {
  ctx.fillStyle = '#222034';
  ctx.fillRect(x - 1, y - 1, 11, 9);
  ctx.fillRect(x, y + 8, 9, 2);
  ctx.fillRect(x + 2, y + 10, 5, 1);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 9, 8);
  ctx.fillRect(x + 1, y + 8, 7, 1);
  ctx.fillRect(x + 3, y + 9, 3, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 1, y + 1, 2, 4);
}

function drawShieldBubble(p) {
  if (!p.shield) return;
  // Clignote pendant la dernière demi-seconde pour prévenir que le bouclier va disparaître.
  if (p.shield < 30 && (p.shield >> 2) % 2) return;
  const x = Math.round(p.x + p.w / 2 - camX), y = Math.round(p.y + p.h / 2 - 2 - camY);
  ctx.fillStyle = 'rgba(95,205,228,0.2)';
  ctx.strokeStyle = 'rgba(203,241,245,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, 7);
  ctx.fill();
  ctx.stroke();
}

function drawShieldGauge() {
  if (!game.powers.shield || game.view !== 'level') return;
  const p = player, x = 8, y = 22;
  const ready = !p.shield && !p.shieldCooldown;
  drawShieldIcon(x, y, ready || p.shield ? '#5fcde4' : '#847e87');
  const ratio = p.shield ? p.shield / SHIELD_FRAMES : 1 - p.shieldCooldown / SHIELD_COOLDOWN;
  ctx.fillStyle = '#222034';
  ctx.fillRect(x + 12, y + 3, 26, 5);
  ctx.fillStyle = p.shield ? '#cbf1f5' : ready ? '#5fcde4' : '#847e87';
  ctx.fillRect(x + 13, y + 4, Math.round(24 * ratio), 3);
}

function drawRainCloud(c, i) {
  const x = Math.round(c.x - camX), y = Math.round(c.y - camY + Math.sin(game.frame * 0.03 + i) * 1.5);
  if (x < -32 || x > VIEW_W + 16) return;
  ctx.fillStyle = '#2a2238';
  ctx.beginPath();
  ctx.arc(x + 4, y + 8, 7, 0, 7);
  ctx.arc(x + 12, y + 6, 8, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#4a3d5e';
  ctx.beginPath();
  ctx.arc(x + 4, y + 6, 5, 0, 7);
  ctx.arc(x + 12, y + 4, 6, 0, 7);
  ctx.fill();
}

/* ---------- Interface ---------- */

function updateHud() {
  hud.lives.textContent = '♥'.repeat(Math.max(0, game.lives));
  hud.coins.textContent = game.coins;
  document.body.classList.toggle('on-world', game.view === 'world');
  document.body.classList.toggle('can-shield', game.view === 'level' && game.powers.shield);
  document.body.classList.toggle('can-ravage', game.view === 'level' && game.powers.ravage);
  hud.level.textContent = game.view === 'world' ? 'Brumelune' : MISSIONS[game.mission].name;
}

function showOverlay(title, text, canRestart = false, scene = false) {
  overlay.classList.toggle('scene', scene); // fin du jeu : on laisse voir la scène derrière le texte
  document.body.classList.toggle('in-ending', scene);
  overlayTitle.textContent = title;
  overlayText.innerHTML = text;
  if (newGameBtn) newGameBtn.hidden = !canRestart;
  overlay.hidden = false;
}

// Écran d'accueil : propose de reprendre la partie sauvegardée.
function showMenu(title) {
  const save = loadSave();
  if (save) {
    const count = save.done > 1 ? `${save.done} missions terminées` : `${save.done} mission terminée`;
    showOverlay(title, `Espace ou toucher pour continuer (${count})`, true);
  } else {
    showOverlay(title, `Espace ou toucher pour jouer`);
  }
}

function startGame() {
  const save = loadSave();
  game.done = save ? save.done : 0;
  game.lives = save && save.lives > 0 ? save.lives : START_LIVES;
  game.coins = save ? save.coins : 0;
  // Les pouvoirs des missions déjà terminées sont acquis, même si la sauvegarde ne les mentionne pas.
  const saved = (save && save.powers) || {};
  game.powers = { shield: !!saved.shield || game.done >= 1, ravage: !!saved.ravage || game.done >= 2 };
  game.messages = [];
  const pos = save && worldCanWalk(save.x, save.y) ? save : world.start;
  enterWorld(pos);
  if (!save) showMessages(INTRO);
}

function onConfirm() {
  if (game.state === 'title' || game.state === 'win') startGame();
  else if (game.state === 'over') enterWorld();
  else if (game.state === 'pause') togglePause();
  else if (game.state === 'world') worldConfirm();
  else if (game.state === 'play' && game.messages.length) {
    game.messages.shift();
    input.jumpPressed = false; // la touche qui ferme le texte ne fait pas sauter
  }
}

function togglePause() {
  if (game.state === 'play' || game.state === 'world') {
    game.paused = game.state;
    game.state = 'pause';
    showOverlay('Pause', 'P ou Échap pour reprendre');
  } else if (game.state === 'pause') {
    game.state = game.paused;
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

// L'île, à l'endroit sauvegardé, sert de décor derrière l'écran d'accueil.
const initialSave = loadSave();
if (initialSave) {
  game.done = initialSave.done;
  if (initialSave.lives > 0) game.lives = initialSave.lives;
}
const initialPos = initialSave && worldCanWalk(initialSave.x, initialSave.y) ? initialSave : world.start;
placeOnWorld(initialPos.x, initialPos.y);
updateHud();
showMenu('Petit Saut');
requestAnimationFrame(loop);
