// Le Roi des slimes (fin du volcan), le combat final et les deux fins de l'histoire.
//
// Déroulement du combat, en boucle :
//   hop    : trois bonds vers Lyra (il blesse au contact, on peut rebondir sur sa tête)
//   charge : il brille en violet, pour prévenir de l'attaque suivante
//   rain   : une pluie de slime sur toute l'arène, qu'on ne traverse qu'avec le bouclier
//   tired  : essoufflé, il ouvre sa carapace : c'est le seul moment où la ravageuse le touche

const BOSS_W = 40;
const BOSS_H = 26;
const BOSS_PHASES = { hop: 40, charge: 60, rain: 70, tired: 200 }; // durées en images

let boss = null, arena = null;

function makeBoss(x, y) {
  return {
    x: x - 12, y: y + TILE - BOSS_H, w: BOSS_W, h: BOSS_H, vx: 0, vy: 0, onGround: false,
    active: false, phase: 'wait', timer: 0, hops: 0, shownTired: false,
  };
}

function setBossPhase(phase) {
  boss.phase = phase;
  boss.timer = BOSS_PHASES[phase];
  if (phase === 'hop') boss.hops = 0;
}

function startBossFight() {
  boss.active = true;
  setBossPhase('hop');
  updateCamera(true); // la caméra se cale tout de suite sur l'arène, pour voir le Roi parler
  showMessages([
    'Le Roi des slimes : « La magie de Brumelune est à moi ! Retourne dans ta brume, petite magicienne ! »',
    'Une épaisse carapace de slime le protège. Survis à ses attaques jusqu\'à ce qu\'il s\'essouffle…',
  ]);
}

function updateBoss() {
  const b = boss;
  if (!b || b.phase === 'dead') return;
  if (!b.active) {
    if (player.x > arena.x + 24) startBossFight();
    return;
  }
  // Une fois le combat lancé, on ne peut plus quitter l'arène.
  if (player.x < arena.x) { player.x = arena.x; player.vx = 0; }

  b.timer--;
  if (b.phase === 'hop') {
    if (b.onGround) {
      b.vx = 0;
      if (b.timer <= 0) {
        if (b.hops >= 3) setBossPhase('charge');
        else {
          b.vy = -6.5;
          b.vx = Math.sign(player.x + player.w / 2 - (b.x + b.w / 2)) * 1.8 || 1.8;
          b.hops++;
          b.timer = BOSS_PHASES.hop;
          sfx('jump');
        }
      }
    }
  } else if (b.phase === 'charge') {
    if (b.timer <= 0) setBossPhase('rain');
  } else if (b.phase === 'rain') {
    if (game.frame % 3 === 0) {
      drops.push({ x: camX + Math.random() * (VIEW_W - 4), y: camY - 6, w: 4, h: 6, vy: 1.5 });
    }
    if (b.timer <= 0) {
      setBossPhase('tired');
      sfx('stomp');
      if (!b.shownTired) {
        b.shownTired = true;
        showBanner('Sa carapace s\'ouvre ! C ou R : ravageuse');
      }
    }
  } else if (b.phase === 'tired') {
    if (b.timer <= 0) setBossPhase('hop');
  }

  b.vy = Math.min(b.vy + GRAVITY, MAX_FALL);
  moveAndCollide(b);
  if (b.x < arena.x) { b.x = arena.x; b.vx = 0; }

  if (overlaps(player, b)) {
    if (player.vy > 0 && player.y + player.h - b.y < 10) {
      player.vy = -6; // on rebondit sur sa tête, mais ça ne le blesse pas
      sfx('stomp');
    } else if (!player.shield) {
      hurt();
    }
  }
}

// Appelée quand la ravageuse est lancée. Renvoie true si elle a vaincu le Roi.
function ravageBoss() {
  if (!boss.active || boss.phase === 'dead') return false;
  if (boss.phase !== 'tired') {
    showBanner('La carapace absorbe la magie !');
    return false;
  }
  defeatBoss();
  return true;
}

function defeatBoss() {
  boss.phase = 'dead';
  boss.vx = 0;
  // Ravageuse lancée avec la dernière vie : le Roi est libéré, mais Lyra se sacrifie.
  game.ending = game.lives <= 0 ? 'sacrifice' : 'normal';
  game.state = 'ending';
  game.timer = 180;
  drops = [];
  enemies.forEach(en => { en.dead = en.dead || 1; });
  burst(boss.x + boss.w / 2, boss.y + boss.h / 2, '#99e550', 30);
  sfx('win');
}

const ENDINGS = {
  normal: {
    title: 'Le gardien retrouvé',
    text: 'La ravageuse brise la corruption. Le Roi des slimes redevient le gardien de Brumelune et rend la magie à l\'île. La brume se lève enfin.',
  },
  sacrifice: {
    title: 'Le sacrifice',
    text: 'Le Roi est libéré et la magie revient, mais Lyra y a laissé ses dernières forces. Sous un ciel enfin dégagé, villageois et slimes se rassemblent pour dire adieu à la magicienne qui s\'est sacrifiée pour l\'île.',
  },
};

function updateEnding() {
  if (game.ending === 'sacrifice' && game.frame % 6 === 0) {
    particles.push({ x: player.x + Math.random() * player.w, y: player.y + player.h, vx: 0, vy: -1.2, life: 60, color: '#cbf1f5' });
  }
  if (--game.timer > 0) return;
  const end = ENDINGS[game.ending];
  game.view = 'ending';
  game.state = 'win';
  particles = [];
  clearSave();
  showOverlay(end.title, `${end.text}<br>Pièces : ${game.coins} · Espace ou toucher pour rejouer`, false, true);
}

/* ---------- Affichage ---------- */

function drawCrown(x, y) {
  ctx.fillStyle = '#222034';
  ctx.fillRect(x - 1, y - 1, 16, 9);
  ctx.fillStyle = '#fbf236';
  ctx.fillRect(x, y + 3, 14, 4);
  ctx.fillRect(x, y, 2, 3);
  ctx.fillRect(x + 6, y, 2, 3);
  ctx.fillRect(x + 12, y, 2, 3);
  ctx.fillStyle = '#d95763';
  ctx.fillRect(x + 6, y + 4, 2, 2);
}

// Dessine le Roi (sprite de slime agrandi ×3), posé sur (cx, bottom) à l'écran.
function drawKing(cx, bottom, pure, phase) {
  const step = (game.frame >> 4) & 1;
  const img = (pure ? SPRITES.kingPure : SPRITES.king)[step];
  const x = Math.round(cx - 24), y = Math.round(bottom - 48);
  if (phase === 'charge') {
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(game.frame * 0.4);
    ctx.fillStyle = '#9b5fc0';
    ctx.beginPath();
    ctx.arc(cx, bottom - 14, 34, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(img, x, y, 48, 48);
  drawCrown(x + 17, y + 13 + step * 3);
  if (phase === 'tired') {
    // Étoiles qui tournent : il est étourdi, sa carapace est ouverte.
    for (let i = 0; i < 3; i++) {
      const a = game.frame * 0.08 + i * 2.1;
      ctx.fillStyle = '#fbf236';
      ctx.fillRect(Math.round(cx + Math.cos(a) * 18), Math.round(y + 10 + Math.sin(a) * 4), 2, 2);
    }
  } else if (!pure) {
    // La carapace : une bulle sombre et brillante autour de lui.
    ctx.fillStyle = 'rgba(60,30,90,0.4)';
    ctx.strokeStyle = 'rgba(203,219,252,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, bottom - 15, 27, 20, 0, Math.PI, 0);
    ctx.lineTo(cx + 27, bottom);
    ctx.lineTo(cx - 27, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(Math.round(cx - 16), Math.round(bottom - 30), 6, 2);
  }
}

function drawBoss() {
  if (!boss) return;
  const b = boss;
  drawKing(b.x + b.w / 2 - camX, b.y + b.h - camY, b.phase === 'dead', b.phase);
}

function drawVillager(x, y, shirt, hair, bob) {
  y -= bob;
  ctx.fillStyle = '#222034';
  ctx.fillRect(x - 1, y - 1, 10, 18);
  ctx.fillStyle = '#eec39a'; // visage
  ctx.fillRect(x + 1, y + 1, 6, 6);
  ctx.fillStyle = hair;
  ctx.fillRect(x, y, 8, 3);
  ctx.fillStyle = shirt;
  ctx.fillRect(x, y + 7, 8, 7);
  ctx.fillStyle = '#45283c';
  ctx.fillRect(x + 1, y + 14, 2, 2);
  ctx.fillRect(x + 5, y + 14, 2, 2);
}

function drawTomb(x, ground) {
  ctx.fillStyle = '#222034';
  ctx.fillRect(x - 1, ground - 27, 20, 27);
  ctx.fillStyle = '#9badb7';
  ctx.fillRect(x, ground - 26, 18, 26);
  ctx.fillStyle = '#cbdbfc';
  ctx.fillRect(x, ground - 26, 18, 2);
  ctx.fillStyle = '#696a6a';
  ctx.fillRect(x + 8, ground - 22, 2, 10); // croix gravée
  ctx.fillRect(x + 5, ground - 19, 8, 2);
  // Fleurs
  [[-6, '#d95763'], [-2, '#fbf236'], [20, '#d77bba'], [24, '#5fcde4']].forEach(([dx, c]) => {
    ctx.fillStyle = '#37946e';
    ctx.fillRect(x + dx + 1, ground - 4, 1, 4);
    ctx.fillStyle = c;
    ctx.fillRect(x + dx, ground - 6, 3, 3);
  });
}

// La dernière scène : l'île sous un ciel dégagé, avec les villageois et les slimes.
function drawEndingScene() {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#5fcde4');
  sky.addColorStop(1, '#fde7a8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fbf236';
  ctx.beginPath();
  ctx.arc(286, 108, 12, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#3b6a8f';
  ctx.fillRect(0, 120, VIEW_W, 20);
  ctx.fillStyle = '#6abe30';
  for (let x = 0; x < VIEW_W; x += 2) ctx.fillRect(x, Math.round(124 + Math.sin(x * 0.03) * 6), 2, 40);
  const ground = 160;
  for (let x = 0; x < VIEW_W; x += TILE) {
    ctx.drawImage(SPRITES.grass, x, ground);
    ctx.drawImage(SPRITES.dirt, x, ground + TILE);
  }

  const sad = game.ending === 'sacrifice';
  // Les villageois sautillent de joie… ou restent immobiles, la tête baissée.
  const bob = i => (sad ? 0 : Math.max(0, Math.round(Math.sin(game.frame * 0.15 + i) * 3)));
  const villagers = [[52, '#5b6ee1', '#663931'], [74, '#d95763', '#222034'], [98, '#37946e', '#df7126'], [196, '#76428a', '#fbf236']];
  villagers.forEach(([x, shirt, hair], i) => drawVillager(x, ground - 16, shirt, hair, bob(i)));

  if (sad) drawTomb(150, ground);
  else {
    const [first, count] = PLAYER_ANIMS.idle;
    camX = camY = 0;
    drawPlayer(first + (Math.floor(game.frame / 6) % count), 158, ground, false);
  }

  [[126, 0], [214, 1], [236, 0]].forEach(([x, i]) => ctx.drawImage(SPRITES.slime[((game.frame >> 4) + i) & 1], x, ground - 16 - bob(i + 4)));
  drawKing(276, ground, true, 'dead');
}
