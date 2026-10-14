// La Gardienne (V3) : la gardienne lance une boule de feu, puis la caméra plonge derrière la boule
// et on la suit dans la forêt. On la guide seulement à gauche ou à droite, en penchant le téléphone.
'use strict';

const VIEW_W = 480, VIEW_H = 270;
const GROUND = 240;                    // vue de côté : hauteur du sol
const HAND = { x: 68, y: GROUND - 30 }; // vue de côté : d'où part la boule de feu

// Vue de poursuite (fausse 3D). Unités : 1 = la moitié de la largeur du chemin.
const HORIZON = 104;                   // hauteur de l'horizon à l'écran
const FOCAL = 320;                     // taille à l'écran d'un objet de 1 unité placé à 1 unité de la caméra
const CAM_BACK = 1.6;                  // la caméra suit la boule à cette distance
const CAM_H = 0.8;                     // hauteur de la caméra
const CAM_FOLLOW = 0.5;                // la caméra suit la boule à moitié sur les côtés
const BALL_H = 0.35;                   // hauteur de vol de la boule
const BALL_R = 0.15;
const PATH_W = 1.35;                   // demi-largeur du chemin dessiné
const LIMIT = 1.1;                     // la boule ne sort pas du chemin
const FAR = 42;                        // distance d'affichage
const SPEED = 8;                       // vitesse d'avance (unités/s)
const SIDE_SPEED = 1.9;                // vitesse sur les côtés à inclinaison maximale
const SIDE_GRIP = 9;                   // réactivité du virage : presque immédiat, juste adouci

const THROW_T = 0.75;                  // durée du lancer vu de côté, plongée de la caméra comprise
const DIVE_AT = 0.35;                  // moment où la caméra plonge vers la boule
const END_T = 0.8;                     // pause quand la boule s'éteint, avant de revenir à la gardienne
const CLEAR_DELAY = 1.6;
const HOLD_MS = 1000;                  // appui long : recalibrer
const SAVE_KEY = 'gardienne3-zone';

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start');

/* ---------- Sons (Web Audio) ---------- */

let audio = null;
function tone(type, from, to, dur, vol = 0.08) {
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
// Les vrais sons (assets/audio) ; si l'un d'eux n'est pas prêt, un son généré le remplace.
const HIT_SOUNDS = { totem: 'hit-crystal', trap: 'hit-trap', bat: 'hit-bat', beast: 'hit-beast' };
const sfx = {
  launch: () => Sound.play('launch', 0.6) || tone('sawtooth', 180, 60, 0.35, 0.06),
  hit: type => Sound.play(HIT_SOUNDS[type] || 'hit-crystal', 0.8) || (tone('square', 300, 900, 0.15, 0.05), tone('triangle', 120, 40, 0.4, 0.08)),
  fizzle: wood => Sound.play(wood ? 'fizzle-wood' : 'fizzle', 0.7) || tone('triangle', 400, 80, 0.3, 0.05),
  clear: () => Sound.play('clear', 0.8) || [392, 523, 659].forEach((f, i) => setTimeout(() => tone('sine', f, f, 0.6, 0.06), i * 140)),
};

/* ---------- État ---------- */

const game = {
  state: 'title', // title | text | calib | aim | throw | flight | ending | cleared | over
  view: 'side',   // side : la gardienne vue de côté ; chase : derrière la boule de feu
  zone: 0,
  shots: 0,
  targets: [],
  run: null,      // la boule pendant sa course : { z, x, vx }
  throwT: 0,
  endT: 0,
  sparks: [],
  effects: [],    // explosions animées, en coordonnées de l'écran
  texts: [],
  time: 0,
  flash: 0,
  shake: 0,
  veil: null,     // voile coloré qui s'efface : { color, a }
};

function loadZone(i) {
  const z = ZONES[i];
  game.zone = i;
  game.shots = z.shots;
  game.targets = z.targets.map((t, k) => ({ ...t, bx: t.x, phase: k * 1.7, dead: 0 }));
  game.run = null;
  game.view = 'side';
  try { localStorage.setItem(SAVE_KEY, String(i)); } catch (_) { /* rien */ }
}

function showTexts(pages, then) {
  game.texts = pages.map(p => (typeof p === 'string' ? { text: p } : p));
  game.afterTexts = then;
  game.state = 'text';
}

function nextText() {
  game.texts.shift();
  if (!game.texts.length) {
    const then = game.afterTexts;
    game.afterTexts = null;
    then();
  }
}

function startZone(i) {
  loadZone(i);
  const z = ZONES[i];
  const goal = `Objectif : brûler les ${z.targets.length} cibles avec ${z.shots} boules de feu.`;
  showTexts([{ text: z.intro, title: z.name, goal }], () => { game.state = 'aim'; });
}

async function runCalibration(then) {
  game.state = 'calib';
  await Tilt.calibrate();
  then();
}

function launch() {
  if (game.shots <= 0) return;
  game.shots--;
  game.state = 'throw';
  game.view = 'side';
  game.throwT = 0;
  game.flash = 0.25;
  sfx.launch();
}

// La caméra a fini de plonger : on suit la boule dans le couloir.
function startFlight() {
  game.run = { z: 0, x: 0, vx: 0 };
  game.state = 'flight';
  game.view = 'chase';
  game.sparks = [];
  game.veil = { color: '251,214,140', a: 1 };
}

// La boule s'éteint (tronc ou bout du chemin) : courte pause, puis retour à la gardienne.
function endRun(wood) {
  const p = ballOnScreen();
  sfx.fizzle(wood);
  burst(p.x, p.y, '#df7126', 18, 90);
  explode(p.x, p.y, 'puff', 60);
  if (wood) game.shake = 0.2;
  game.state = 'ending';
  game.endT = 0;
}

function afterRun() {
  game.run = null;
  if (game.shots <= 0) {
    showTexts(['Ta rage ne suffit pas encore. Respire… et recommence.'], () => startZone(game.zone));
  } else {
    game.state = 'aim';
    game.view = 'side';
    game.veil = { color: '12,10,20', a: 1 };
  }
}

function explode(x, y, kind, size) {
  game.effects.push({ x, y, kind, size, t: 0 });
}

function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random());
    game.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.5, color });
  }
}

/* ---------- Entrées : toucher, appui long, clavier ---------- */

const keys = { left: false, right: false };
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', KeyA: 'left', KeyD: 'right', KeyQ: 'left' };
const touch = { down: false, x0: 0, y0: 0, x: 0, y: 0, t0: 0, moved: false, hold: 0 };

// Direction voulue, de -1 (gauche) à 1 (droite).
function steering() {
  // Doigt posé pendant la course : moitié gauche ou droite de l'écran (marche aussi avec le gyroscope).
  if (touch.down && game.state === 'flight') return touch.x < W / 2 ? -1 : 1;
  const k = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (k) return k;
  return Tilt.state.mode === 'gyro' ? Tilt.read().x : 0;
}

function onTap() {
  if (game.state === 'text') nextText();
  else if (game.state === 'aim') launch();
  else if (game.state === 'over') {
    try { localStorage.removeItem(SAVE_KEY); } catch (_) { /* rien */ }
    location.reload();
  }
}

canvas.addEventListener('pointerdown', e => {
  Object.assign(touch, { down: true, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: false });
  touch.hold = Tilt.state.mode === 'gyro' && game.state === 'aim' ? performance.now() : 0;
});
canvas.addEventListener('pointermove', e => {
  if (!touch.down) return;
  touch.x = e.clientX;
  touch.y = e.clientY;
  if (Math.hypot(touch.x - touch.x0, touch.y - touch.y0) > 18) { touch.moved = true; touch.hold = 0; }
});
canvas.addEventListener('pointerup', () => {
  if (!touch.down) return;
  const short = performance.now() - touch.t0 < 450;
  touch.down = false;
  touch.hold = 0;
  if (short && !touch.moved) onTap();
});
['pointercancel', 'pointerleave'].forEach(ev => canvas.addEventListener(ev, () => { touch.down = false; touch.hold = 0; }));
addEventListener('keydown', e => {
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat && game.state !== 'title') { e.preventDefault(); onTap(); }
  if (e.code === 'KeyC' && Tilt.state.mode === 'gyro' && game.state === 'aim') runCalibration(() => { game.state = 'aim'; });
  if (e.code === 'KeyM') syncMusicButton(Sound.toggleMusic());
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
addEventListener('gesturestart', e => e.preventDefault());
addEventListener('touchmove', e => e.preventDefault(), { passive: false });

/* ---------- Mise à jour ---------- */

const HIT_R = { totem: 0.22, trap: 0.25, bat: 0.22, beast: 0.3 };

function update(dt) {
  game.time += dt;
  game.flash = Math.max(0, game.flash - dt);
  game.shake = Math.max(0, game.shake - dt);
  if (game.veil && (game.veil.a -= dt * 2.5) <= 0) game.veil = null;

  for (const t of game.targets) {
    if (t.ax) {
      const px = t.x;
      t.x = t.bx + Math.sin(game.time * t.speed + t.phase) * t.ax;
      if (Math.abs(t.x - px) > 0.0001) t.dir = Math.sign(t.x - px);
    }
    if (t.dead) t.dead += dt;
  }

  if (game.state === 'throw' && (game.throwT += dt) >= THROW_T) startFlight();

  const r = game.run;
  if (r && (game.state === 'flight' || game.state === 'cleared')) {
    const pz = r.z;
    const speed = game.state === 'cleared' ? SPEED * 0.4 : SPEED;
    r.z += speed * dt;
    if (game.state === 'flight') {
      // L'inclinaison donne directement la vitesse sur le côté, à peine adoucie.
      r.vx += (steering() * SIDE_SPEED - r.vx) * Math.min(1, dt * SIDE_GRIP);
    } else r.vx *= 0.9;
    r.x = Math.max(-LIMIT, Math.min(LIMIT, r.x + r.vx * dt));
    if (Math.random() < 0.8) {
      const p = ballOnScreen();
      game.sparks.push({ x: p.x + (Math.random() - 0.5) * 14, y: p.y + 6, vx: (Math.random() - 0.5) * 60, vy: 30 + Math.random() * 60, life: 0.35, color: Math.random() < 0.5 ? '#fbf236' : '#df7126' });
    }
    if (game.state === 'flight') checkHits(pz, r);
  }

  if (game.state === 'ending' && (game.endT += dt) >= END_T) afterRun();

  if (game.state === 'cleared' && (game.clearTimer -= dt) <= 0) {
    const last = game.zone === ZONES.length - 1;
    showTexts([{ title: 'Zone purifiée', text: ZONES[game.zone].outro }], () => {
      if (last) { game.state = 'over'; return; }
      startZone(game.zone + 1);
    });
  }

  game.effects.forEach(e => { e.t += dt; });
  game.effects = game.effects.filter(e => e.t < 0.45);

  game.sparks.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt; });
  game.sparks = game.sparks.filter(p => p.life > 0);

  if (touch.hold && performance.now() - touch.hold > HOLD_MS) {
    touch.hold = 0;
    touch.down = false;
    runCalibration(() => { game.state = 'aim'; });
  }
}

// Ce que la boule croise entre deux images : les cibles brûlent (elle les traverse), les troncs l'éteignent.
function checkHits(pz, r) {
  for (const t of game.targets) {
    if (t.dead || t.z <= pz || t.z > r.z) continue;
    if (Math.abs(t.x - r.x) < BALL_R + HIT_R[t.type]) {
      t.dead = 0.001;
      game.shake = 0.15;
      sfx.hit(t.type);
      const p = ballOnScreen();
      explode(p.x + (t.x - r.x) * p.s, p.y - 10, 'explosion', 90);
      burst(p.x, p.y - 10, t.type === 'bat' || t.type === 'beast' ? '#76428a' : '#9b5fc0', 24, 140);
      burst(p.x, p.y - 10, '#fbf236', 12, 100);
    }
  }
  // Dernière cible brûlée : la zone est purifiée tout de suite.
  if (!game.targets.some(t => !t.dead)) {
    const p = ballOnScreen();
    burst(p.x, p.y, '#fbf236', 40, 160);
    explode(p.x, p.y, 'explosion', 110);
    game.state = 'cleared';
    game.clearTimer = CLEAR_DELAY;
    sfx.clear();
    return;
  }
  for (const o of ZONES[game.zone].obstacles) {
    if (o.z <= pz || o.z > r.z) continue;
    if (Math.abs(o.x - r.x) < BALL_R + o.w / 2) { endRun(true); return; }
  }
  if (r.z >= ZONES[game.zone].length) endRun(false);
}

/* ---------- Affichage : outils ---------- */

let W = 0, H = 0, dpr = 1, scale = 1, offX = 0, offY = 0;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  W = innerWidth;
  H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  scale = Math.min(W / VIEW_W, H / VIEW_H);
  offX = (W - VIEW_W * scale) / 2;
  offY = (H - VIEW_H * scale) / 2;
}

const sheet = new Image();
sheet.src = 'player.png';
const FRAME_W = 58, FRAME_H = 60, IDLE = [0, 10];

const clamp01 = v => Math.max(0, Math.min(1, v));
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
// Petit hasard toujours identique pour un même nombre : la forêt est la même à chaque passage.
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function camX() { return game.run ? game.run.x * CAM_FOLLOW : 0; }
function camZ() { return game.run ? game.run.z - CAM_BACK : -CAM_BACK; }

// Position à l'écran d'un point de la forêt ; s = taille à l'écran d'une unité à cette distance.
function project(x, y, z) {
  const dz = z - camZ(), s = FOCAL / dz;
  return { x: VIEW_W / 2 + (x - camX()) * s, y: HORIZON + (CAM_H - y) * s, s, dz };
}

function ballOnScreen() {
  const r = game.run || { x: 0, z: 0 };
  const p = project(r.x, BALL_H, r.z);
  return { x: p.x + Math.sin(game.time * 13) * 1.5, y: p.y + Math.cos(game.time * 11) * 1.5, s: p.s };
}

/* ---------- Le fond ---------- */

// Fond de la lisière : une fin de journée calme et immobile, dessinée une seule fois.
// Même format que les fonds peints (1251 × 480, sol à 330) pour être placé de la même façon.
const BACK_W = 1251, BACK_H = 480, BACK_GROUND = 330;
let crepuscule = null;
function paintCrepuscule(th) {
  const c = document.createElement('canvas');
  c.width = BACK_W;
  c.height = BACK_H;
  const g = c.getContext('2d');
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sky = g.createLinearGradient(0, 0, 0, BACK_GROUND);
  sky.addColorStop(0, th.sky[0]);
  sky.addColorStop(1, th.sky[1]);
  g.fillStyle = sky;
  g.fillRect(0, 0, BACK_W, BACK_H);
  // Soleil bas et voilé
  const sun = g.createRadialGradient(BACK_W / 2, 270, 10, BACK_W / 2, 270, 220);
  sun.addColorStop(0, 'rgba(255,226,180,0.55)');
  sun.addColorStop(1, 'rgba(255,226,180,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, BACK_W, BACK_H);
  g.fillStyle = 'rgba(255,236,205,0.85)';
  g.beginPath(); g.arc(BACK_W / 2, 270, 30, 0, 7); g.fill();
  // Quelques nuages étirés
  g.fillStyle = 'rgba(255,235,220,0.13)';
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.ellipse(rnd() * BACK_W, 50 + rnd() * 150, 90 + rnd() * 120, 8 + rnd() * 8, 0, 0, 7);
    g.fill();
  }
  // Collines lointaines dans la brume
  g.fillStyle = '#8f8a98';
  g.beginPath();
  g.moveTo(0, BACK_GROUND);
  for (let x = 0; x <= BACK_W; x += 10) g.lineTo(x, 262 + Math.sin(x / 140) * 14 + Math.sin(x / 53) * 5);
  g.lineTo(BACK_W, BACK_GROUND);
  g.fill();
  // Deux rangées d'arbres aux cimes arrondies, de plus en plus proches
  const row = (color, base, hMin, hMax, rMin, rMax, step) => {
    g.fillStyle = color;
    for (let x = -30; x < BACK_W + 30; x += step * (0.6 + rnd() * 0.8)) {
      const h = hMin + rnd() * (hMax - hMin), r = rMin + rnd() * (rMax - rMin);
      g.fillRect(x - r * 0.12, base - h, r * 0.24, h);
      g.beginPath();
      g.arc(x, base - h, r, 0, 7);
      g.arc(x - r * 0.6, base - h + r * 0.5, r * 0.75, 0, 7);
      g.arc(x + r * 0.6, base - h + r * 0.5, r * 0.75, 0, 7);
      g.fill();
    }
  };
  row('#6f7a80', BACK_GROUND, 40, 80, 20, 32, 34);
  row('#536660', BACK_GROUND + 4, 60, 120, 28, 44, 52);
  g.fillStyle = th.ground;
  g.fillRect(0, BACK_GROUND, BACK_W, BACK_H - BACK_GROUND);
  return c;
}

function backdropImage(z) {
  if (z.backdrop === 'crepuscule') return crepuscule || (crepuscule = paintCrepuscule(z.theme));
  const img = ART[z.backdrop];
  return img && ready(img) ? img : null;
}

// Dessine le fond à l'échelle k, sa ligne de sol sur groundY, décalé de shiftX (léger effet de profondeur).
function drawBackdrop(z, groundY, k, shiftX) {
  const img = backdropImage(z), th = z.theme;
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, th.sky[0]);
  sky.addColorStop(1, th.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(-60, -60, VIEW_W + 120, groundY + 60);
  if (!img) return;
  const w = BACK_W * k, h = BACK_H * k;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, (VIEW_W - w) / 2 + shiftX, groundY - BACK_GROUND * k, w, h);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = th.shade;
  ctx.fillRect(-60, -60, VIEW_W + 120, groundY + 60);
}

/* ---------- Vue de côté : la gardienne ---------- */

function drawSide() {
  const z = ZONES[game.zone], th = z.theme;
  // Pendant le lancer, la caméra plonge vers la boule.
  const b = sideBall();
  const dive = game.state === 'throw' ? clamp01((game.throwT - DIVE_AT) / (THROW_T - DIVE_AT)) : 0;
  const zoom = 1 + dive * dive * 4;
  ctx.save();
  if (zoom > 1) {
    ctx.translate(b.x, b.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-b.x, -b.y);
  }
  drawBackdrop(z, GROUND, GROUND / BACK_GROUND, 0);
  ctx.fillStyle = th.ground;
  ctx.fillRect(-60, GROUND, VIEW_W + 120, VIEW_H - GROUND + 60);
  ctx.fillStyle = th.path;
  ctx.fillRect(-60, GROUND + 4, VIEW_W + 120, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(-60, GROUND, VIEW_W + 120, 1);

  if (sheet.complete && sheet.naturalWidth) {
    const frame = IDLE[0] + (Math.floor(game.time * 8) % IDLE[1]);
    const s = 0.75, w = FRAME_W * s, h = FRAME_H * s;
    ctx.drawImage(sheet, frame * FRAME_W, 0, FRAME_W, FRAME_H, 50 - w / 2 + 3, GROUND - h + 1, w, h);
  }
  const glow = 0.3 + game.flash * 2 + (game.state === 'aim' ? 0.15 * Math.sin(game.time * 4) : 0);
  const hg = ctx.createRadialGradient(HAND.x, HAND.y, 0, HAND.x, HAND.y, 14);
  hg.addColorStop(0, `rgba(251,180,60,${Math.min(1, glow)})`);
  hg.addColorStop(1, 'rgba(251,180,60,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(HAND.x - 14, HAND.y - 14, 28, 28);

  if (game.state === 'throw') {
    const fg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 15);
    fg.addColorStop(0, 'rgba(255,240,180,1)');
    fg.addColorStop(0.3, 'rgba(251,160,50,0.9)');
    fg.addColorStop(1, 'rgba(217,60,30,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, 7); ctx.fill();
    if (ready(ART.fireball)) {
      ctx.imageSmoothingEnabled = true;
      drawFrame(ART.fireball, Math.floor(game.time * 30), 94, 54, b.x - 32, b.y - 12, 42, 24);
      ctx.imageSmoothingEnabled = false;
    }
  }
  ctx.restore();
  if (dive > 0) {
    ctx.fillStyle = `rgba(251,214,140,${dive})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function sideBall() {
  const t = Math.min(game.throwT, DIVE_AT + 0.2);
  return { x: HAND.x + t * 260, y: HAND.y - t * 40 };
}

/* ---------- Vue de poursuite : derrière la boule ---------- */

let groundColors = null;
function zoneColors(z) {
  if (!groundColors || groundColors.zone !== z) {
    const th = z.theme;
    groundColors = { zone: z, grass: hexRgb(th.ground), path: hexRgb(th.path), fog: hexRgb(th.fog), trunk: hexRgb(th.trunk), leaves: th.leaves.map(hexRgb) };
  }
  return groundColors;
}

function drawChase() {
  const z = ZONES[game.zone], col = zoneColors(z), r = game.run || { x: 0, z: 0, vx: 0 };
  ctx.save();
  // La caméra s'incline un peu dans les virages.
  ctx.translate(VIEW_W / 2, VIEW_H);
  ctx.rotate(-r.vx * 0.02);
  ctx.translate(-VIEW_W / 2, -VIEW_H);

  drawBackdrop(z, HORIZON, 0.45, -camX() * 30);

  // Le sol, ligne par ligne : bandes qui défilent pour sentir la vitesse, brume au loin.
  const cz = camZ(), cx = camX();
  for (let y = HORIZON; y < VIEW_H + 20; y += 2) {
    const dz = CAM_H * FOCAL / (y + 1 - HORIZON), wz = cz + dz;
    const fog = Math.pow(clamp01(dz / FAR), 0.6);
    // Les bandes s'effacent au loin, là où elles deviendraient trop fines (scintillement).
    const stripe = Math.floor(wz / 2) % 2 ? 0.07 * clamp01((12 - dz) / 5) : 0;
    ctx.fillStyle = mix(col.grass.map(v => v * (1 + stripe)), col.fog, fog);
    ctx.fillRect(-60, y, VIEW_W + 120, 2);
    const s = FOCAL / dz, left = VIEW_W / 2 + (-PATH_W - cx) * s, right = VIEW_W / 2 + (PATH_W - cx) * s;
    ctx.fillStyle = mix(col.path.map(v => v * (1 + stripe)), col.fog, fog);
    ctx.fillRect(left, y, right - left, 2);
  }

  // Tout ce qui se dresse dans la forêt, du plus loin au plus proche.
  const items = [];
  const STEP = 2.5;
  for (let k = Math.floor(cz / STEP); k <= Math.floor((cz + FAR) / STEP); k++) {
    for (const side of [-1, 1]) {
      for (const lane of [0, 1]) {
        const n = k * 4 + (side > 0 ? 2 : 0) + lane;
        items.push({ kind: 'tree', x: side * (1.9 + lane * 1.4 + hash(n) * 1.1), z: k * STEP + hash(n + 0.5) * STEP, w: 0.3 + hash(n + 0.3) * 0.15, n });
      }
    }
  }
  z.obstacles.forEach(o => items.push({ kind: o.type, ...o }));
  game.targets.forEach(t => { if (!t.dead || t.dead < 0.3) items.push({ kind: 'target', t, x: t.x, z: t.z }); });
  items.sort((a, b) => b.z - a.z);

  for (const it of items) {
    const p = project(it.x, 0, it.z);
    if (p.dz < 0.35 || p.dz > FAR) continue;
    // Apparition dans la brume au loin, et effacement juste avant de frôler la caméra.
    ctx.globalAlpha = clamp01((FAR - p.dz) / 8) * clamp01((p.dz - 0.45) / 0.7);
    const fog = Math.pow(clamp01(p.dz / FAR), 0.6) * 0.8;
    if (it.kind === 'tree') drawTree(p, it.w, 2.6 + hash(it.n + 0.7), 1 + hash(it.n + 0.9) * 0.5, col, fog, it.n);
    else if (it.kind === 'trunk') drawTree(p, it.w, 3.4, Math.max(1, it.w * 1.8), col, fog, it.z * 7, true);
    else if (it.kind === 'log') drawLog(p, it.w, col, fog);
    else drawTarget(it.t, p);
  }
  ctx.globalAlpha = 1;

  if (game.run && game.state !== 'ending') drawChaseBall();
  drawEffects();
  drawSparks();
  ctx.restore();
}

function drawTree(p, w, h, crown, col, fog, n, danger) {
  const s = p.s, tw = w * s, th = h * s;
  ctx.fillStyle = mix(col.trunk, col.fog, fog);
  ctx.fillRect(p.x - tw / 2, p.y - th, tw, th);
  if (danger) {
    // Les troncs dans le chemin : écorce bien visible et lueur rouge au pied, pour les repérer de loin.
    ctx.fillStyle = mix(col.trunk.map(v => v * 1.3 + 8), col.fog, fog);
    for (let i = 1; i < 6; i++) ctx.fillRect(p.x - tw / 2 + tw * (0.15 + 0.4 * (i % 2)), p.y - th * i / 6, tw * 0.08, th / 10);
    ctx.fillStyle = 'rgba(217,87,99,0.35)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, tw * 0.9, tw * 0.22, 0, 0, 7); ctx.fill();
  }
  const cy = p.y - th, r = crown * s;
  ctx.fillStyle = mix(col.leaves[0], col.fog, fog);
  ctx.beginPath();
  ctx.arc(p.x - r * 0.5, cy + r * 0.2, r * 0.8, 0, 7);
  ctx.arc(p.x + r * 0.5, cy + r * 0.2, r * 0.8, 0, 7);
  ctx.fill();
  ctx.fillStyle = mix(col.leaves[1], col.fog, fog);
  ctx.beginPath();
  ctx.arc(p.x + (hash(n) - 0.5) * r * 0.3, cy - r * 0.3, r * 0.75, 0, 7);
  ctx.fill();
}

function drawLog(p, w, col, fog) {
  const s = p.s, lw = w * s, lh = 0.55 * s;
  ctx.fillStyle = 'rgba(217,87,99,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y, lw * 0.6, lh * 0.3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = mix(col.trunk, col.fog, fog);
  ctx.fillRect(p.x - lw / 2, p.y - lh, lw, lh);
  ctx.fillStyle = mix(col.trunk.map(v => v * 1.5 + 12), col.fog, fog);
  ctx.fillRect(p.x - lw / 2, p.y - lh, lw, lh * 0.18);
  ctx.beginPath(); ctx.ellipse(p.x + lw / 2, p.y - lh / 2, lh * 0.25, lh / 2, 0, 0, 7); ctx.fill();
}

function drawTarget(t, p) {
  const fade = t.dead ? Math.max(0, 1 - t.dead * 3) : 1;
  ctx.globalAlpha *= fade;
  const s = p.s, pulse = 0.5 + 0.5 * Math.sin(game.time * 3 + t.phase);
  // Ombre au sol : elle montre où est la cible sur la largeur du chemin.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y, 0.25 * s, 0.07 * s, 0, 0, 7); ctx.fill();
  if (t.type === 'totem') {
    const y = p.y - (0.45 + Math.sin(game.time * 2 + t.phase) * 0.04) * s, size = 0.55 * s;
    ctx.fillStyle = `rgba(155,95,192,${0.3 + 0.2 * pulse})`;
    ctx.beginPath(); ctx.arc(p.x, y, size * 0.6, 0, 7); ctx.fill();
    if (ready(ART.crystal)) drawFrame(ART.crystal, Math.floor(game.time * 6 + t.phase), 32, 32, p.x - size / 2, y - size / 2, size, size);
  } else if (t.type === 'trap') {
    const w = 0.6 * s, y = p.y - 0.06 * s;
    ctx.fillStyle = `rgba(217,87,99,${0.25 + 0.2 * pulse})`;
    ctx.beginPath(); ctx.ellipse(p.x, y, w * 0.7, w * 0.25, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#222034';
    ctx.fillRect(p.x - w / 2, y - w * 0.05, w, w * 0.15);
    ctx.fillStyle = '#9badb7';
    ctx.fillRect(p.x - w * 0.45, y - w * 0.02, w * 0.9, w * 0.07);
    for (let i = 0; i < 5; i++) ctx.fillRect(p.x - w * 0.42 + i * w * 0.2, y - w * 0.2, w * 0.06, w * 0.18);
  } else if (t.type === 'bat') {
    const y = p.y - 0.6 * s, size = 0.6 * s;
    ctx.fillStyle = 'rgba(190,110,230,0.3)';
    ctx.beginPath(); ctx.arc(p.x, y, size * 0.55, 0, 7); ctx.fill();
    if (ready(ART.bat)) drawFrame(ART.bat, Math.floor(game.time * 12 + t.phase), 32, 32, p.x - size / 2, y - size / 2, size, size);
  } else if (t.type === 'beast') {
    const w = 1.0 * s, h = w * 0.56;
    const glow = ctx.createRadialGradient(p.x, p.y - h / 2, 2, p.x, p.y - h / 2, w * 0.7);
    glow.addColorStop(0, `rgba(190,110,230,${0.45 + 0.2 * pulse})`);
    glow.addColorStop(1, 'rgba(190,110,230,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - w, p.y - h - w * 0.4, w * 2, h + w * 0.8);
    if (ready(ART.beast)) {
      ctx.save();
      ctx.translate(p.x, p.y - h);
      if ((t.dir || 1) < 0) ctx.scale(-1, 1);
      drawFrame(ART.beast, Math.floor(game.time * 14 + t.phase), 100, 56, -w / 2, 0, w, h);
      ctx.restore();
    }
  }
}

function drawChaseBall() {
  const r = game.run, b = ballOnScreen(), s = b.s;
  // Ombre de la boule sur le sol
  const g = project(r.x, 0, r.z);
  ctx.fillStyle = 'rgba(255,170,60,0.18)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y, 0.14 * s, 0.04 * s, 0, 0, 7); ctx.fill();
  const rad = 0.1 * s;
  const fg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad * 2.2);
  fg.addColorStop(0, 'rgba(255,245,200,1)');
  fg.addColorStop(0.3, 'rgba(251,160,50,0.95)');
  fg.addColorStop(1, 'rgba(217,60,30,0)');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.arc(b.x, b.y, rad * 2.2, 0, 7); ctx.fill();
  if (ready(ART.fireball)) {
    // La flamme vue de dos : la tête vers l'horizon, la traînée vers nous.
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(-Math.PI / 2 + r.vx * 0.25);
    ctx.imageSmoothingEnabled = true;
    drawFrame(ART.fireball, Math.floor(game.time * 30), 94, 54, -rad * 3.6, -rad * 1.2, rad * 4.4, rad * 2.4);
    ctx.imageSmoothingEnabled = false;
    ctx.restore();
  }
}

function drawEffects() {
  for (const e of game.effects) {
    const big = e.kind === 'explosion', img = big ? ART.explosion : ART.puff;
    if (!ready(img)) continue;
    const fs = big ? 64 : 32, frame = Math.min(7, Math.floor(e.t / 0.055));
    drawFrame(img, frame, fs, fs, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
  }
}

function drawSparks() {
  game.sparks.forEach(p => {
    ctx.globalAlpha = clamp01(p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 2, 2);
  });
  ctx.globalAlpha = 1;
}

/* ---------- Textes, histoire, interface ---------- */

let deadDeer = null;
function deadDeerFrame() {
  if (deadDeer || !ready(ART.deerIdle)) return deadDeer;
  deadDeer = document.createElement('canvas');
  deadDeer.width = 72;
  deadDeer.height = 52;
  const g = deadDeer.getContext('2d');
  g.drawImage(ART.deerIdle, 0, 0, 72, 52, 0, 0, 72, 52);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(120,20,30,0.55)';
  g.fillRect(0, 0, 72, 52);
  return deadDeer;
}

function drawStag(x, y, lying) {
  const g = ctx.createRadialGradient(x + 54, y + 40, 4, x + 54, y + 40, 70);
  g.addColorStop(0, lying ? 'rgba(217,87,99,0.35)' : 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 20, y - 30, 150, 140);
  if (!ready(ART.deerIdle)) return;
  if (!lying) {
    drawFrame(ART.deerIdle, Math.floor(game.time * 7), 72, 52, x, y, 108, 78);
    return;
  }
  const img = deadDeerFrame();
  ctx.globalAlpha = 0.45 + 0.2 * Math.sin(game.time * 1.5);
  if (img) ctx.drawImage(img, x, y + 6, 108, 78);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++) {
    const k = (game.time * 0.4 + i / 6) % 1;
    ctx.fillStyle = `rgba(255,220,220,${0.6 * (1 - k)})`;
    ctx.fillRect(x + 20 + i * 14, y + 60 - k * 70, 2, 2);
  }
}

function wrap(text, maxW) {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawTextPage(page) {
  ctx.fillStyle = 'rgba(12,10,20,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (page.stag) drawStag(VIEW_W / 2 - 27, 34, page.stag === 'lying');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const y = page.stag ? 120 : 80;
  if (page.title) {
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#df7126';
    ctx.fillText(page.title, VIEW_W / 2, y - 30);
  }
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';
  const lines = wrap(page.text, VIEW_W - 80);
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, y + i * 16));
  if (page.goal) {
    ctx.fillStyle = '#fbf236';
    wrap(page.goal, VIEW_W - 80).forEach((l, i) => ctx.fillText(l, VIEW_W / 2, y + (lines.length + 1 + i) * 16));
  }
  if (Math.floor(game.time * 2) % 2) {
    ctx.fillStyle = '#fbf236';
    ctx.fillText('touche pour continuer', VIEW_W / 2, VIEW_H - 30);
  }
  ctx.textAlign = 'left';
}

function drawCenter(title, sub) {
  ctx.fillStyle = 'rgba(12,10,20,0.75)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillStyle = '#fbf236';
  ctx.fillText(title, VIEW_W / 2, 100);
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';
  wrap(sub, VIEW_W - 80).forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 130 + i * 16));
  ctx.textAlign = 'left';
}

function shadowText(text, x, y, color) {
  ctx.fillStyle = 'rgba(12,10,20,0.7)';
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawHud() {
  if (game.state === 'title') return;
  const z = ZONES[game.zone];
  for (let i = 0; i < z.shots; i++) {
    const on = i < game.shots;
    ctx.fillStyle = on ? '#df7126' : 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(14 + i * 13, 14, 4, 0, 7); ctx.fill();
    if (on) { ctx.fillStyle = '#fbf236'; ctx.fillRect(13 + i * 13, 12, 2, 2); }
  }
  const alive = game.targets.filter(t => !t.dead).length, total = game.targets.length;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  shadowText(`Brûlées ${total - alive}/${total}`, VIEW_W - 10, 10, '#ffffff');
  ctx.textAlign = 'center';
  shadowText(z.name, VIEW_W / 2, 10, 'rgba(255,255,255,0.75)');

  // Le chemin en miniature : où sont les cibles restantes (à gauche, au milieu, à droite) et où en est la boule.
  const bx = VIEW_W / 2 - 70, by = 24, bw = 140, bh = 14;
  ctx.fillStyle = 'rgba(12,10,20,0.45)';
  ctx.fillRect(bx, by, bw, bh);
  const laneY = x => by + bh / 2 + x * (bh / 2 - 2);
  for (const t of game.targets) {
    if (t.dead) continue;
    ctx.fillStyle = t.type === 'bat' || t.type === 'beast' ? '#be6ee6' : '#d77bba';
    ctx.fillRect(bx + (t.z / z.length) * bw - 1, laneY(t.bx) - 1, 3, 3);
  }
  ctx.fillStyle = 'rgba(160,110,90,0.9)';
  for (const o of z.obstacles) ctx.fillRect(bx + (o.z / z.length) * bw - 1, laneY(o.x) - o.w * 3, 2, Math.max(2, o.w * 6));
  if (game.run) {
    ctx.fillStyle = '#fbf236';
    ctx.fillRect(bx + clamp01(game.run.z / z.length) * bw - 1, laneY(game.run.x) - 1, 3, 3);
  }

  if (game.state === 'aim' && Math.floor(game.time * 1.5) % 2) {
    ctx.fillStyle = '#fbf236';
    ctx.fillText('touche pour lancer', VIEW_W / 2, GROUND + 14);
  }
  // Flèches gauche / droite qui s'allument selon l'inclinaison
  if (game.state === 'flight') {
    const s = steering(), y = VIEW_H - 22;
    [[-1, VIEW_W / 2 - 60], [1, VIEW_W / 2 + 60]].forEach(([dir, x]) => {
      const on = clamp01(s * dir);
      ctx.fillStyle = `rgba(251,${Math.round(242 - on * 130)},${Math.round(54 - on * 20)},${0.25 + on * 0.75})`;
      ctx.beginPath();
      ctx.moveTo(x + dir * 10, y);
      ctx.lineTo(x - dir * 6, y - 9);
      ctx.lineTo(x - dir * 6, y + 9);
      ctx.fill();
    });
  }
  ctx.textAlign = 'left';
}

function drawHold() {
  if (!touch.hold) return;
  const p = (performance.now() - touch.hold) / HOLD_MS;
  if (p < 0.2) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.strokeStyle = '#fbf236';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(touch.x, touch.y, 30, -Math.PI / 2, -Math.PI / 2 + Math.min(1, p) * Math.PI * 2);
  ctx.stroke();
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0c0a14';
  ctx.fillRect(0, 0, W, H);
  const shake = game.shake ? (Math.random() - 0.5) * 4 : 0;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offX + shake * scale), dpr * offY);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, VIEW_W, VIEW_H);
  ctx.clip();

  if (game.view === 'chase') drawChase();
  else { drawSide(); drawSparks(); }

  if (game.state === 'ending') {
    ctx.fillStyle = `rgba(12,10,20,${clamp01((game.endT - END_T + 0.3) / 0.3)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (game.veil) {
    ctx.fillStyle = `rgba(${game.veil.color},${clamp01(game.veil.a)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawHud();
  if (game.state === 'text' && game.texts.length) drawTextPage(game.texts[0]);
  if (game.state === 'calib') drawCenter('Calibration…', 'Tiens le téléphone comme tu es bien installé, sans bouger');
  if (game.state === 'cleared') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '16px "Press Start 2P", monospace';
    shadowText('Zone purifiée !', VIEW_W / 2, 70, '#fbf236');
    ctx.textAlign = 'left';
  }
  if (game.state === 'over') drawCenter('À suivre…', 'Touche pour recommencer l\'histoire');
  drawHold();
  ctx.restore();
}

/* ---------- Démarrage ---------- */

function savedZone() {
  try {
    const z = parseInt(localStorage.getItem(SAVE_KEY), 10);
    return z >= 0 && z < ZONES.length ? z : null;
  } catch (_) { return null; }
}

async function begin(fromZone) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    Sound.init(audio);
  } catch (_) { /* pas de son */ }
  startScreen.hidden = true;
  game.state = 'calib';
  const result = await Tilt.start();
  const afterCalib = () => {
    if (fromZone === null) {
      loadZone(0);
      showTexts(STORY, () => startZone(0));
    } else startZone(fromZone);
  };
  if (result === 'ok') runCalibration(afterCalib);
  else {
    loadZone(0);
    showTexts([result === 'refusé'
      ? 'Accès au gyroscope refusé. Pendant la course, garde le doigt sur la moitié gauche ou droite de l\'écran pour guider la boule. (Pour réessayer : Réglages › Safari › Avancé › Données des sites web, supprimer celles du site.)'
      : 'Pas de gyroscope ici. Pendant la course, garde le doigt à gauche ou à droite de l\'écran (ou utilise les flèches) pour guider la boule.'], afterCalib);
  }
}

const saved = savedZone();
const continueBtn = document.getElementById('continue');
const newBtn = document.getElementById('new');
if (saved !== null && saved > 0) {
  continueBtn.hidden = false;
  continueBtn.textContent = `Continuer : ${ZONES[saved].name}`;
  continueBtn.addEventListener('click', () => begin(saved));
}
newBtn.addEventListener('click', () => begin(null));
const musicBtn = document.getElementById('music');
function syncMusicButton(on) {
  musicBtn.textContent = on ? 'Musique : oui' : 'Musique : non';
  musicBtn.classList.toggle('off', !on);
}
musicBtn.addEventListener('click', () => syncMusicButton(Sound.toggleMusic()));
syncMusicButton(Sound.isMusicOn());
const invertBtn = document.getElementById('invert');
invertBtn.classList.toggle('off', !Tilt.state.prefs.invertX);
invertBtn.addEventListener('click', () => invertBtn.classList.toggle('off', !Tilt.toggleAxis('x')));

addEventListener('resize', resize);
const onRotate = () => { resize(); if (Tilt.state.mode === 'gyro' && game.state === 'aim') runCalibration(() => { game.state = 'aim'; }); };
if (screen.orientation) screen.orientation.addEventListener('change', onRotate);
else addEventListener('orientationchange', onRotate);
resize();
loadZone(saved || 0);

let last = performance.now();
function loop(now) {
  update(Math.min(0.05, (now - last) / 1000));
  last = now;
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
