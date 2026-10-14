// Démo V4 : le gameplay de la V3, sans histoire ni décor.
// On lance une boule, on la guide à gauche ou à droite, on traverse les cibles et on évite les troncs.
'use strict';

// Unités : 1 = la moitié de la largeur du chemin. x : gauche/droite, z : distance depuis le départ.
const VIEW_H = 270;                    // hauteur virtuelle ; la largeur suit celle de l'écran
const HORIZON = 104;
const FOCAL = 320;
const CAM_BACK = 1.6;
const CAM_H = 0.8;
const CAM_FOLLOW = 0.5;
const BALL_H = 0.35;
const BALL_R = 0.15;
const PATH_W = 1.35;
const LIMIT = 1.1;
const FAR = 42;
const SPEED = 8;
const SIDE_SPEED = 1.9;
const SIDE_GRIP = 9;
const END_T = 0.7;                     // pause quand la boule s'éteint
const CLEAR_T = 1.6;                   // pause quand toutes les cibles sont brûlées

const COLORS = {
  sky: ['#1d1a2b', '#3b3550'],
  grass: [44, 40, 62],
  path: [74, 66, 96],
  fog: [59, 53, 80],
  ball: '#ff8a2a',
  target: '#fbf236',
  mover: '#5ee0ff',
  trunk: '#0e0c15',
  text: '#f2eee6',
};

// Le niveau : cibles fixes au début, troncs ensuite, cibles mobiles à la fin.
const LEVEL = {
  shots: 6,
  length: 64,
  obstacles: [
    { x: 0, z: 18, w: 0.5 },
    { x: -0.7, z: 28, w: 0.6 },
    { x: 0.7, z: 36, w: 0.6 },
    { x: 0, z: 48, w: 0.5 },
  ],
  targets: [
    { x: -0.6, z: 10 },
    { x: 0.6, z: 14 },
    { x: -0.8, z: 22 },
    { x: 0.3, z: 32 },
    { x: 0, z: 42, ax: 0.7, speed: 1.3 },
    { x: 0, z: 56, ax: 0.8, speed: 1.0 },
  ],
};
const HIT_R = 0.22;

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

/* ---------- Sons générés ---------- */

let audio = null;
function tone(type, from, to, dur, vol) {
  if (!audio) return;
  const t = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur);
}
const sfx = {
  launch: () => tone('sawtooth', 180, 60, 0.3, 0.05),
  hit: () => { tone('square', 300, 900, 0.12, 0.04); tone('triangle', 120, 40, 0.3, 0.07); },
  fizzle: () => tone('triangle', 400, 80, 0.3, 0.05),
  clear: () => [392, 523, 659].forEach((f, i) => setTimeout(() => tone('sine', f, f, 0.5, 0.05), i * 130)),
};

/* ---------- État ---------- */

const game = {
  state: 'aim', // aim | flight | ending | cleared
  shots: 0,
  targets: [],
  run: null,    // { z, x, vx }
  timer: 0,
  time: 0,
  sparks: [],
  shake: 0,
  message: '',
};

function reset() {
  game.shots = LEVEL.shots;
  game.targets = LEVEL.targets.map((t, k) => ({ ...t, bx: t.x, phase: k * 1.7, dead: 0 }));
  game.run = null;
  game.state = 'aim';
  game.message = '';
}

function launch() {
  if (!audio) {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { /* sans son */ }
  }
  game.shots--;
  game.run = { z: 0, x: 0, vx: 0 };
  game.state = 'flight';
  game.message = '';
  sfx.launch();
}

function endRun(wood) {
  sfx.fizzle();
  const p = ballOnScreen();
  burst(p.x, p.y, COLORS.ball, 18, 90);
  if (wood) game.shake = 0.2;
  game.state = 'ending';
  game.timer = END_T;
}

function afterRun() {
  game.run = null;
  if (game.shots <= 0) {
    reset();
    game.message = 'Plus de boules : on recommence';
  } else game.state = 'aim';
}

function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random());
    game.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, color });
  }
}

/* ---------- Entrées : doigt et clavier ---------- */

const keys = { left: false, right: false };
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', KeyA: 'left', KeyQ: 'left', KeyD: 'right' };
const touch = { down: false, x: 0 };

// Direction voulue : -1 (gauche), 0, 1 (droite).
function steering() {
  if (touch.down) return touch.x < innerWidth / 2 ? -1 : 1;
  return (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
}

function onPress() {
  if (game.state === 'aim') launch();
}

canvas.addEventListener('pointerdown', e => {
  touch.down = true;
  touch.x = e.clientX;
  // Le même appui lance la boule puis la guide s'il reste posé.
  onPress();
});
canvas.addEventListener('pointermove', e => { if (touch.down) touch.x = e.clientX; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => canvas.addEventListener(ev, () => { touch.down = false; }));
addEventListener('keydown', e => {
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); onPress(); }
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
addEventListener('touchmove', e => e.preventDefault(), { passive: false });

/* ---------- Mise à jour ---------- */

function update(dt) {
  game.time += dt;
  game.shake = Math.max(0, game.shake - dt);

  for (const t of game.targets) {
    if (t.ax) t.x = t.bx + Math.sin(game.time * t.speed + t.phase) * t.ax;
    if (t.dead) t.dead += dt;
  }

  const r = game.run;
  if (r && (game.state === 'flight' || game.state === 'cleared')) {
    const pz = r.z;
    r.z += (game.state === 'cleared' ? SPEED * 0.4 : SPEED) * dt;
    if (game.state === 'flight') r.vx += (steering() * SIDE_SPEED - r.vx) * Math.min(1, dt * SIDE_GRIP);
    else r.vx *= 0.9;
    r.x = Math.max(-LIMIT, Math.min(LIMIT, r.x + r.vx * dt));
    if (Math.random() < 0.7) {
      const p = ballOnScreen();
      game.sparks.push({ x: p.x + (Math.random() - 0.5) * 12, y: p.y + 6, vx: (Math.random() - 0.5) * 50, vy: 30 + Math.random() * 50, life: 0.3, color: Math.random() < 0.5 ? COLORS.target : COLORS.ball });
    }
    if (game.state === 'flight') checkHits(pz, r);
  }

  if ((game.state === 'ending' || game.state === 'cleared') && (game.timer -= dt) <= 0) {
    if (game.state === 'cleared') { reset(); game.message = 'Bravo ! Encore une fois ?'; }
    else afterRun();
  }

  game.sparks.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt; });
  game.sparks = game.sparks.filter(p => p.life > 0);
}

// Ce que la boule croise entre deux images : les cibles brûlent, les troncs l'éteignent.
function checkHits(pz, r) {
  for (const t of game.targets) {
    if (t.dead || t.z <= pz || t.z > r.z) continue;
    if (Math.abs(t.x - r.x) < BALL_R + HIT_R) {
      t.dead = 0.001;
      game.shake = 0.12;
      sfx.hit();
      const p = ballOnScreen();
      burst(p.x, p.y - 10, t.ax ? COLORS.mover : COLORS.target, 24, 140);
    }
  }
  if (!game.targets.some(t => !t.dead)) {
    const p = ballOnScreen();
    burst(p.x, p.y, COLORS.target, 40, 160);
    sfx.clear();
    game.state = 'cleared';
    game.timer = CLEAR_T;
    return;
  }
  for (const o of LEVEL.obstacles) {
    if (o.z <= pz || o.z > r.z) continue;
    if (Math.abs(o.x - r.x) < BALL_R + o.w / 2) { endRun(true); return; }
  }
  if (r.z >= LEVEL.length) endRun(false);
}

/* ---------- Affichage ---------- */

let W = 0, H = 0, VIEW_W = 480, scale = 1, dpr = 1, padY = 0;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  W = innerWidth;
  H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  // La hauteur est fixe ; la largeur s'adapte à l'écran (jamais plus étroite que 300).
  scale = Math.min(H / VIEW_H, W / 300);
  VIEW_W = W / scale;
  // Écran plus haut que la vue (portrait) : on prolonge le ciel en haut et le sol en bas.
  padY = Math.max(0, (H / scale - VIEW_H) / 2);
}
addEventListener('resize', resize);
resize();

const clamp01 = v => Math.max(0, Math.min(1, v));
const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;

function camX() { return game.run ? game.run.x * CAM_FOLLOW : 0; }
function camZ() { return (game.run ? game.run.z : 0) - CAM_BACK; }

function project(x, y, z) {
  const dz = z - camZ(), s = FOCAL / dz;
  return { x: VIEW_W / 2 + (x - camX()) * s, y: HORIZON + (CAM_H - y) * s, s, dz };
}

function ballOnScreen() {
  const r = game.run || { x: 0, z: 0 };
  return project(r.x, BALL_H, r.z);
}

function drawWorld() {
  const r = game.run || { vx: 0 };
  ctx.save();
  ctx.translate(VIEW_W / 2, VIEW_H);
  ctx.rotate(-r.vx * 0.02);
  ctx.translate(-VIEW_W / 2, -VIEW_H);

  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, COLORS.sky[0]);
  sky.addColorStop(1, COLORS.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(-60, -60 - padY, VIEW_W + 120, HORIZON + 60 + padY);

  // Sol ligne par ligne, avec des bandes qui défilent pour sentir la vitesse.
  const cz = camZ(), cx = camX();
  for (let y = HORIZON; y < VIEW_H + padY + 20; y += 2) {
    const dz = CAM_H * FOCAL / (y + 1 - HORIZON), wz = cz + dz;
    const fog = Math.pow(clamp01(dz / FAR), 0.6);
    const stripe = Math.floor(wz / 2) % 2 ? 0.12 * clamp01((12 - dz) / 5) : 0;
    ctx.fillStyle = mix(COLORS.grass.map(v => v * (1 + stripe)), COLORS.fog, fog);
    ctx.fillRect(-60, y, VIEW_W + 120, 2);
    const s = FOCAL / dz, left = VIEW_W / 2 + (-PATH_W - cx) * s, right = VIEW_W / 2 + (PATH_W - cx) * s;
    ctx.fillStyle = mix(COLORS.path.map(v => v * (1 + stripe)), COLORS.fog, fog);
    ctx.fillRect(left, y, right - left, 2);
  }

  // Troncs et cibles, du plus loin au plus proche.
  const items = [];
  LEVEL.obstacles.forEach(o => items.push({ kind: 'trunk', ...o }));
  game.targets.forEach(t => { if (!t.dead || t.dead < 0.25) items.push({ kind: 'target', t, x: t.x, z: t.z }); });
  items.sort((a, b) => b.z - a.z);

  for (const it of items) {
    const p = project(it.x, 0, it.z);
    if (p.dz < 0.35 || p.dz > FAR) continue;
    ctx.globalAlpha = clamp01((FAR - p.dz) / 8) * clamp01((p.dz - 0.45) / 0.7);
    if (it.kind === 'trunk') {
      const w = it.w * p.s, h = 3.4 * p.s;
      ctx.fillStyle = COLORS.trunk;
      ctx.fillRect(p.x - w / 2, p.y - h, w, h);
    } else {
      const t = it.t, k = t.dead ? 1 + t.dead * 6 : 1, size = 0.32 * p.s * k;
      const bob = Math.sin(game.time * 3 + t.phase) * 0.04 * p.s;
      ctx.globalAlpha *= t.dead ? clamp01(1 - t.dead * 4) : 1;
      ctx.fillStyle = t.ax ? COLORS.mover : COLORS.target;
      ctx.fillRect(p.x - size / 2, p.y - 0.3 * p.s - size / 2 + bob, size, size);
    }
  }
  ctx.globalAlpha = 1;

  // La boule, prête au départ ou en course.
  if (game.state !== 'ending') {
    const p = ballOnScreen(), rad = BALL_R * p.s;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 3);
    glow.addColorStop(0, 'rgba(255,200,120,0.7)');
    glow.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(p.x, p.y, rad * 3, 0, 7); ctx.fill();
    ctx.fillStyle = COLORS.ball;
    ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe2a8';
    ctx.beginPath(); ctx.arc(p.x - rad * 0.3, p.y - rad * 0.3, rad * 0.4, 0, 7); ctx.fill();
  }

  for (const s of game.sparks) {
    ctx.globalAlpha = clamp01(s.life * 2.5);
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHud() {
  ctx.font = '10px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  // Boules restantes
  for (let i = 0; i < LEVEL.shots; i++) {
    ctx.fillStyle = i < game.shots ? COLORS.ball : 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(14 + i * 13, 14, 4.5, 0, 7); ctx.fill();
  }
  // Cibles restantes
  const left = game.targets.filter(t => !t.dead).length;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Cibles ${LEVEL.targets.length - left} / ${LEVEL.targets.length}`, VIEW_W - 10, 9);

  ctx.textAlign = 'center';
  if (game.state === 'aim') {
    if (game.message) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = COLORS.target;
      ctx.fillText(game.message, VIEW_W / 2, 32);
      ctx.fillStyle = COLORS.text;
    }
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(game.time * 4);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Toucher pour lancer', VIEW_W / 2, 52);
    ctx.globalAlpha = 0.6;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText('puis garder le doigt à gauche ou à droite (ou flèches)', VIEW_W / 2, 69);
    ctx.globalAlpha = 1;
  }
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COLORS.sky[0];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const k = scale * dpr;
  const sh = game.shake > 0 ? (Math.random() - 0.5) * 6 * game.shake / 0.2 : 0;
  // Le monde est centré verticalement, l'affichage reste collé en haut de l'écran.
  ctx.setTransform(k, 0, 0, k, sh * k, padY * k);
  drawWorld();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  drawHud();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
