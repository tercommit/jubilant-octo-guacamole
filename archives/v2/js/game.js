// La Gardienne : on lance une boule de feu, puis on courbe sa trajectoire en penchant le téléphone.
'use strict';

const VIEW_W = 480, VIEW_H = 270, GROUND = 240;
const HAND = { x: 68, y: GROUND - 30 };          // d'où part la boule de feu
const LAUNCH = { vx: 95, vy: -15 };              // vitesse de départ (px/s)
const TILT_ACCEL = 170;                          // accélération à inclinaison maximale (px/s²)
const MAX_SPEED = 160;
const RAGE = 45;                                 // tremblement de la boule : la rage n'est pas maîtrisée
const BALL_LIFE = 10;                            // secondes avant que la boule s'éteigne
const CLEAR_DELAY = 1.6;                         // pause sur « Zone purifiée » avant la suite
const HOLD_MS = 1000;                            // appui long : recalibrer
const SAVE_KEY = 'gardienne-zone';

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
  state: 'title', // title | text | calib | aim | flight | cleared | over
  zone: 0,
  shots: 0,
  targets: [],
  ball: null,
  sparks: [],
  effects: [],     // explosions animées
  texts: [],       // pages à lire : { text, stag?, then? }
  time: 0,
  flash: 0,
  shake: 0,
};

function loadZone(i) {
  const z = ZONES[i];
  game.zone = i;
  game.shots = z.shots;
  game.targets = z.targets.map(t => ({ ...t, bx: t.x, by: t.y, phase: Math.random() * 7, dead: 0 }));
  game.ball = null;
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
  if (game.shots <= 0 || game.ball) return;
  game.shots--;
  game.ball = { x: HAND.x, y: HAND.y, vx: LAUNCH.vx, vy: LAUNCH.vy, life: BALL_LIFE, trail: [], seed: Math.random() * 100 };
  game.state = 'flight';
  game.flash = 0.25;
  sfx.launch();
}

function endBall(x, y) {
  burst(x, y, '#df7126', 16, 70);
  explode(x, y, 'puff');
  game.ball = null;
  if (game.shots <= 0) {
    showTexts(['Ta rage ne suffit pas encore. Respire… et recommence.'], () => startZone(game.zone));
  } else {
    game.state = 'aim';
  }
}

// Explosion animée (sprite) : 'explosion' sur une cible, 'puff' quand la boule s'éteint.
function explode(x, y, kind) {
  game.effects.push({ x, y, kind, t: 0 });
}

function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random());
    game.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.5, color });
  }
}

/* ---------- Entrées : toucher n'importe où, appui long, clavier ---------- */

const keys = { left: false, right: false, up: false, down: false };
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
const touch = { down: false, x0: 0, y0: 0, x: 0, y: 0, t0: 0, moved: false, hold: 0 };

function steering() {
  if (Tilt.state.mode === 'gyro') return Tilt.read();
  // Sans gyroscope : flèches, ou glisser le doigt (joystick invisible).
  if (touch.down && touch.moved) {
    const r = 50;
    return { x: Math.max(-1, Math.min(1, (touch.x - touch.x0) / r)), y: Math.max(-1, Math.min(1, (touch.y - touch.y0) / r)) };
  }
  return { x: (keys.right ? 1 : 0) - (keys.left ? 1 : 0), y: (keys.down ? 1 : 0) - (keys.up ? 1 : 0) };
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
  touch.hold = Tilt.state.mode === 'gyro' && (game.state === 'aim' || game.state === 'flight') ? performance.now() : 0;
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
  if (e.code === 'KeyC' && Tilt.state.mode === 'gyro' && (game.state === 'aim')) runCalibration(() => { game.state = 'aim'; });
  if (e.code === 'KeyM') syncMusicButton(Sound.toggleMusic());
});
addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
addEventListener('gesturestart', e => e.preventDefault());
addEventListener('touchmove', e => e.preventDefault(), { passive: false });

/* ---------- Mise à jour ---------- */

const hitsRect = (x, y, r, o) => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h;

function update(dt) {
  game.time += dt;
  game.flash = Math.max(0, game.flash - dt);
  game.shake = Math.max(0, game.shake - dt);

  for (const t of game.targets) {
    if (t.type === 'bat') {
      const px = t.x;
      t.x = t.bx + Math.sin(game.time * t.speed + t.phase) * (t.ax || 0);
      t.y = t.by + Math.cos(game.time * t.speed * 1.3 + t.phase) * (t.ay || 0);
      if (Math.abs(t.x - px) > 0.01) t.dir = Math.sign(t.x - px);
    } else if (t.type === 'beast') {
      // La bête d'ombre court au sol, d'un bout à l'autre de son territoire.
      const px = t.x;
      t.x = t.bx + Math.sin(game.time * t.speed + t.phase) * t.ax;
      if (Math.abs(t.x - px) > 0.01) t.dir = Math.sign(t.x - px);
    }
    if (t.dead) t.dead += dt;
  }

  const b = game.ball;
  if (b && game.state === 'flight') {
    const s = steering();
    // L'inclinaison accélère la boule au lieu de la placer : il faut doser.
    b.vx += s.x * TILT_ACCEL * dt;
    b.vy += s.y * TILT_ACCEL * dt;
    b.vx += Math.sin(game.time * 11 + b.seed) * RAGE * dt;
    b.vy += Math.cos(game.time * 13 + b.seed * 2) * RAGE * dt;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > MAX_SPEED) { b.vx *= MAX_SPEED / sp; b.vy *= MAX_SPEED / sp; }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 14) b.trail.shift();
    if (Math.random() < 0.6) game.sparks.push({ x: b.x, y: b.y, vx: -b.vx * 0.1 + (Math.random() - 0.5) * 20, vy: -b.vy * 0.1 - 10, life: 0.4, color: Math.random() < 0.5 ? '#fbf236' : '#df7126' });

    // La boule est si puissante qu'elle traverse les cibles : une bonne courbe en brûle plusieurs.
    for (const t of game.targets) {
      if (!t.dead && Math.hypot(b.x - t.x, b.y - t.y) < (t.type === 'beast' ? 16 : 13)) {
        t.dead = 0.001;
        game.shake = 0.2;
        sfx.hit(t.type);
        explode(t.x, t.y, 'explosion');
        burst(t.x, t.y, t.type === 'bat' || t.type === 'beast' ? '#76428a' : '#9b5fc0', 22, 90);
        burst(t.x, t.y, '#fbf236', 10, 60);
      }
    }
    // Dernière cible brûlée : la boule explose tout de suite et la zone est purifiée.
    if (!game.targets.some(t => !t.dead)) {
      burst(b.x, b.y, '#fbf236', 40, 120);
      explode(b.x, b.y, 'explosion');
      game.ball = null;
      game.state = 'cleared';
      game.clearTimer = CLEAR_DELAY;
      sfx.clear();
      return;
    }
    const blocked = game.zoneObstacles().some(o => hitsRect(b.x, b.y, 4, o));
    const out = b.x < -30 || b.x > VIEW_W + 30 || b.y < -60 || b.y > GROUND - 3;
    if (blocked || out || b.life <= 0) {
      if (blocked || b.y > GROUND - 3) sfx.fizzle(blocked);
      endBall(Math.max(0, Math.min(VIEW_W, b.x)), Math.min(GROUND - 3, b.y));
    }
  }

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
    const resume = game.state;
    runCalibration(() => { game.state = resume === 'flight' && game.ball ? 'flight' : 'aim'; });
  }
}
game.zoneObstacles = () => ZONES[game.zone].obstacles;

/* ---------- Affichage ---------- */

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

// Silhouettes d'arbres, toujours les mêmes pour une zone donnée.
function treeLine(seed, base, height, color, parallax) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  ctx.fillStyle = color;
  for (let x = -20; x < VIEW_W + 20; x += 14 + rnd() * 22) {
    const h = height * (0.6 + rnd() * 0.6), w = 10 + rnd() * 16, sway = Math.sin(game.time * 0.4 + x) * parallax;
    ctx.beginPath();
    ctx.moveTo(x - w + sway, base);
    ctx.lineTo(x + sway, base - h);
    ctx.lineTo(x + w + sway, base);
    ctx.fill();
    ctx.fillRect(x - 2, base - 4, 4, 8);
  }
}

// Version rougie et assombrie du cerf, pour la page « Il a tué le cerf blanc ».
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
  // Le cerf blanc : debout et vivant, ou rougi et qui s'efface.
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
  // Sa magie s'échappe en petites lueurs qui montent.
  for (let i = 0; i < 6; i++) {
    const k = (game.time * 0.4 + i / 6) % 1;
    ctx.fillStyle = `rgba(255,220,220,${0.6 * (1 - k)})`;
    ctx.fillRect(x + 20 + i * 14, y + 60 - k * 70, 2, 2);
  }
}

function drawTarget(t) {
  const fade = t.dead ? Math.max(0, 1 - t.dead * 3) : 1;
  if (fade <= 0) return;
  ctx.globalAlpha = fade;
  const pulse = 0.5 + 0.5 * Math.sin(game.time * 3 + t.phase);
  if (t.type === 'totem' && ready(ART.crystal)) {
    ctx.fillStyle = `rgba(155,95,192,${0.25 + 0.2 * pulse})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, 15, 0, 7); ctx.fill();
    drawFrame(ART.crystal, Math.floor(game.time * 6 + t.phase), 32, 32, t.x - 14, t.y - 16 + Math.sin(game.time * 2 + t.phase) * 1.5, 28, 28);
  } else if (t.type === 'totem') {
    ctx.fillStyle = `rgba(155,95,192,${0.25 + 0.2 * pulse})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#222034';
    ctx.beginPath(); ctx.moveTo(t.x, t.y - 11); ctx.lineTo(t.x + 7, t.y); ctx.lineTo(t.x, t.y + 11); ctx.lineTo(t.x - 7, t.y); ctx.fill();
    ctx.fillStyle = '#9b5fc0';
    ctx.beginPath(); ctx.moveTo(t.x, t.y - 9); ctx.lineTo(t.x + 5, t.y); ctx.lineTo(t.x, t.y + 9); ctx.lineTo(t.x - 5, t.y); ctx.fill();
    ctx.fillStyle = '#d77bba';
    ctx.fillRect(t.x - 2, t.y - 5, 2, 4);
  } else if (t.type === 'trap') {
    ctx.fillStyle = `rgba(217,87,99,${0.15 + 0.15 * pulse})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#222034';
    ctx.fillRect(t.x - 11, t.y - 2, 22, 6);
    ctx.fillStyle = '#9badb7';
    ctx.fillRect(t.x - 10, t.y - 1, 20, 3);
    for (let i = -9; i <= 7; i += 4) { ctx.fillRect(t.x + i, t.y - 5, 2, 4); }
  } else if (t.type === 'bat' && ready(ART.bat)) {
    ctx.fillStyle = 'rgba(118,66,138,0.25)';
    ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, 7); ctx.fill();
    ctx.save();
    ctx.translate(t.x, t.y);
    if ((t.dir || 1) < 0) ctx.scale(-1, 1);
    drawFrame(ART.bat, Math.floor(game.time * 12 + t.phase), 32, 32, -17, -17, 34, 34);
    ctx.restore();
  } else if (t.type === 'beast' && ready(ART.beast)) {
    // Halo violet qui pulse : la bête est noire, il faut la voir sur le fond sombre.
    const glow = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, 34);
    glow.addColorStop(0, `rgba(190,110,230,${0.45 + 0.2 * pulse})`);
    glow.addColorStop(1, 'rgba(190,110,230,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(t.x - 34, t.y - 34, 68, 68);
    ctx.save();
    ctx.translate(t.x, t.y);
    if ((t.dir || 1) < 0) ctx.scale(-1, 1);
    drawFrame(ART.beast, Math.floor(game.time * 14 + t.phase), 100, 56, -30, -20, 60, 34);
    ctx.restore();
  } else if (t.type === 'bat' || t.type === 'beast') {
    const flap = Math.sin(game.time * 12 + t.phase) > 0 ? -4 : 2;
    ctx.fillStyle = 'rgba(118,66,138,0.25)';
    ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#140f1a';
    ctx.beginPath(); ctx.ellipse(t.x, t.y, 8, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(t.x - 3, t.y); ctx.lineTo(t.x - 12, t.y + flap); ctx.lineTo(t.x + 1, t.y - 1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(t.x + 3, t.y); ctx.lineTo(t.x + 12, t.y + flap); ctx.lineTo(t.x - 1, t.y - 1); ctx.fill();
    ctx.fillStyle = '#df3e23';
    ctx.fillRect(t.x - 5, t.y - 2, 2, 2);
  }
  ctx.globalAlpha = 1;
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
  let y = page.stag ? 120 : 80;
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

  const z = ZONES[game.zone], th = z.theme;
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, th.sky[0]);
  sky.addColorStop(1, th.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const painted = drawBackdrop(z);
  if (!painted) treeLine(7 + game.zone, GROUND - 10, 110, th.far, 0.6);
  ctx.fillStyle = th.fog;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(((i * 160 + game.time * 6) % (VIEW_W + 200)) - 100, GROUND - 30 - i * 12, 120, 14, 0, 0, 7);
    ctx.fill();
  }
  if (!painted) treeLine(19 + game.zone, GROUND, 70, th.near, 1);
  ctx.fillStyle = th.ground;
  ctx.fillRect(0, GROUND, VIEW_W, VIEW_H - GROUND);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, GROUND, VIEW_W, 1);

  // Obstacles : troncs et branches
  for (const o of z.obstacles) {
    ctx.fillStyle = '#140f12';
    ctx.fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
    ctx.fillStyle = '#3d2a24';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#4e362c';
    for (let y = o.y + 4; y < o.y + o.h - 2; y += 9) ctx.fillRect(o.x + 2 + (y % 3), y, Math.max(2, o.w - 6), 1);
  }

  game.targets.forEach(drawTarget);

  // La gardienne
  if (sheet.complete && sheet.naturalWidth) {
    const frame = IDLE[0] + (Math.floor(game.time * 8) % IDLE[1]);
    const s = 0.75, w = FRAME_W * s, h = FRAME_H * s;
    ctx.drawImage(sheet, frame * FRAME_W, 0, FRAME_W, FRAME_H, 50 - w / 2 + 3, GROUND - h + 1, w, h);
  }
  // Main qui rougeoie, plus fort au moment du lancer
  const glow = 0.3 + game.flash * 2 + (game.state === 'aim' ? 0.15 * Math.sin(game.time * 4) : 0);
  const hg = ctx.createRadialGradient(HAND.x, HAND.y, 0, HAND.x, HAND.y, 14);
  hg.addColorStop(0, `rgba(251,180,60,${Math.min(1, glow)})`);
  hg.addColorStop(1, 'rgba(251,180,60,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(HAND.x - 14, HAND.y - 14, 28, 28);

  // Boule de feu et sa traînée
  const b = game.ball;
  if (b) {
    b.trail.forEach((p, i) => {
      const k = i / b.trail.length;
      ctx.fillStyle = `rgba(223,113,38,${k * 0.5})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1 + k * 3, 0, 7); ctx.fill();
    });
    const r = 5 + Math.sin(game.time * 30) * 0.8;
    const fg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 3);
    fg.addColorStop(0, 'rgba(255,240,180,1)');
    fg.addColorStop(0.3, 'rgba(251,160,50,0.9)');
    fg.addColorStop(1, 'rgba(217,60,30,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(b.x, b.y, r * 3, 0, 7); ctx.fill();
    if (ready(ART.fireball)) {
      // La flamme animée, tournée dans le sens de la course, la tête sur la boule.
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.imageSmoothingEnabled = true;
      drawFrame(ART.fireball, Math.floor(game.time * 30), 94, 54, -32, -12, 42, 24);
      ctx.imageSmoothingEnabled = false;
      ctx.restore();
    }
  }
  drawEffects();

  game.sparks.forEach(p => {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 1.5, 1.5);
  });
  ctx.globalAlpha = 1;

  drawHud();
  if (game.state === 'text' && game.texts.length) drawTextPage(game.texts[0]);
  if (game.state === 'calib') drawCenter('Calibration…', 'Tiens le téléphone comme tu es bien installé, sans bouger');
  if (game.state === 'cleared') {
    ctx.textAlign = 'center';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = '#fbf236';
    ctx.fillText('Zone purifiée !', VIEW_W / 2, 110);
    ctx.textAlign = 'left';
  }
  if (game.state === 'over') drawCenter('À suivre…', 'Touche pour recommencer l\'histoire');
  drawHold();
  ctx.restore();
}

// Fond illustré de la zone ; renvoie false s'il n'est pas encore chargé.
function drawBackdrop(z) {
  if (z.backdrop === 'lisiere' && ready(ART.lisiere)) {
    // Travelling animé à travers la forêt au crépuscule (64 images en boucle).
    const f = Math.floor(game.time / 0.17) % 64;
    ctx.drawImage(ART.lisiere, (f % 8) * 256, Math.floor(f / 8) * 128, 256, 128, 0, 0, VIEW_W, GROUND);
  } else if (z.backdrop && ART[z.backdrop] && ready(ART[z.backdrop])) {
    // Forêt peinte, qui dérive très lentement.
    const img = ART[z.backdrop], w = img.naturalWidth * GROUND / img.naturalHeight;
    const x = -(w - VIEW_W) / 2 + Math.sin(game.time * 0.05) * (w - VIEW_W) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, x, 0, w, GROUND);
    ctx.imageSmoothingEnabled = false;
  } else return false;
  ctx.fillStyle = z.theme.shade || 'rgba(12,10,20,0.25)';
  ctx.fillRect(0, 0, VIEW_W, GROUND);
  return true;
}

function drawEffects() {
  for (const e of game.effects) {
    const big = e.kind === 'explosion', img = big ? ART.explosion : ART.puff;
    if (!ready(img)) continue;
    const fs = big ? 64 : 32, size = big ? 44 : 22, frame = Math.min(7, Math.floor(e.t / 0.055));
    drawFrame(img, frame, fs, fs, e.x - size / 2, e.y - size / 2, size, size);
  }
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

function drawHud() {
  if (game.state === 'title') return;
  // Boules de feu restantes
  for (let i = 0; i < ZONES[game.zone].shots; i++) {
    const on = i < game.shots;
    ctx.fillStyle = on ? '#df7126' : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(14 + i * 13, 14, 4, 0, 7); ctx.fill();
    if (on) { ctx.fillStyle = '#fbf236'; ctx.fillRect(13 + i * 13, 12, 2, 2); }
  }
  const alive = game.targets.filter(t => !t.dead).length;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  const total = game.targets.length;
  ctx.fillText(`Brûlées ${total - alive}/${total}`, VIEW_W - 10, 10);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(ZONES[game.zone].name, VIEW_W / 2, 10);
  if (game.state === 'aim' && Math.floor(game.time * 1.5) % 2) {
    ctx.fillStyle = '#fbf236';
    ctx.fillText('touche pour lancer', VIEW_W / 2, GROUND + 12);
  }
  ctx.textAlign = 'left';

  // Petit niveau à bulle : l'inclinaison actuelle
  if (game.state === 'aim' || game.state === 'flight') {
    const s = steering(), cx = VIEW_W - 22, cy = GROUND + 15, r = 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    ctx.fillStyle = s.x || s.y ? '#df7126' : 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(cx + s.x * r, cy + s.y * r, 3, 0, 7); ctx.fill();
  }
}

// Anneau autour du doigt pendant l'appui long de recalibrage (en coordonnées de l'écran).
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
      ? 'Accès au gyroscope refusé. Tu peux jouer en glissant le doigt pour courber la boule. (Pour réessayer : Réglages › Safari › Avancé › Données des sites web, supprimer celles du site.)'
      : 'Pas de gyroscope ici. Glisse le doigt (ou utilise les flèches) pour courber la boule.'], afterCalib);
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
document.querySelectorAll('[data-axis]').forEach(btn => {
  const axis = btn.dataset.axis, key = axis === 'x' ? 'invertX' : 'invertY';
  btn.classList.toggle('off', !Tilt.state.prefs[key]);
  btn.addEventListener('click', () => btn.classList.toggle('off', !Tilt.toggleAxis(axis)));
});

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
