// Images et sons du jeu (ressources libres, voir assets/CREDITS.md).
// Tout se charge en arrière-plan : tant qu'une image n'est pas prête, le jeu garde son dessin de secours.
'use strict';

const ART = (() => {
  const load = src => { const img = new Image(); img.src = src; return img; };
  return {
    lisiere: load('assets/bg/lisiere.png'),             // 64 images de 256×128, en grille 8×8
    sousBois: load('assets/bg/sous-bois.jpg'),
    foretProfonde: load('assets/bg/foret-profonde.jpg'),
    fireball: load('assets/sprites/fireball.png'),      // 28 images de 94×54, flamme tournée vers la droite
    explosion: load('assets/sprites/explosion.png'),    // 8 images de 64×64
    puff: load('assets/sprites/puff.png'),              // 8 images de 32×32
    bat: load('assets/sprites/bat.png'),                // 5 images de 32×32
    beast: load('assets/sprites/beast.png'),            // 10 images de 100×56, course vers la droite
    crystal: load('assets/sprites/crystal.png'),        // 5 images de 32×32 qui scintillent (1re rangée)
    deerIdle: load('assets/sprites/deer-idle.png'),     // 10 images de 72×52
    deerWalk: load('assets/sprites/deer-walk.png'),     // 8 images de 72×52
  };
})();

const ready = img => img.complete && img.naturalWidth > 0;

// Dessine l'image n° i d'une bande horizontale d'images de largeur fw.
function drawFrame(img, i, fw, fh, x, y, w, h) {
  ctx.drawImage(img, (i % Math.floor(img.naturalWidth / fw)) * fw, 0, fw, fh, x, y, w, h);
}

/* ---------- Sons ---------- */

const Sound = (() => {
  const NAMES = ['launch', 'hit-crystal', 'hit-trap', 'hit-bat', 'hit-beast', 'fizzle', 'fizzle-wood', 'clear'];
  const raw = {};      // fichiers téléchargés
  const buffers = {};  // sons décodés, prêts à jouer
  let ctxAudio = null;
  NAMES.forEach(n => {
    raw[n] = fetch(`assets/audio/${n}.mp3`).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
  });

  const music = new Audio('assets/audio/ambiance.mp3');
  music.loop = true;
  music.volume = 0.35;
  let musicOn = true;
  try { musicOn = localStorage.getItem('gardienne-musique') !== 'non'; } catch (_) { /* rien */ }

  // À appeler juste après un toucher (iPhone) : décode les sons et lance la musique.
  function init(audioContext) {
    ctxAudio = audioContext;
    NAMES.forEach(n => raw[n].then(data => {
      if (!data || buffers[n]) return;
      ctxAudio.decodeAudioData(data.slice(0), b => { buffers[n] = b; }, () => {});
    }));
    if (musicOn) music.play().catch(() => {});
  }

  // Joue un son ; renvoie false s'il n'est pas (encore) disponible, pour utiliser le son de secours.
  function play(name, volume = 0.7) {
    const b = buffers[name];
    if (!ctxAudio || !b) return false;
    const src = ctxAudio.createBufferSource(), gain = ctxAudio.createGain();
    src.buffer = b;
    gain.gain.value = volume;
    src.connect(gain).connect(ctxAudio.destination);
    src.start();
    return true;
  }

  function toggleMusic() {
    musicOn = !musicOn;
    try { localStorage.setItem('gardienne-musique', musicOn ? 'oui' : 'non'); } catch (_) { /* rien */ }
    if (musicOn && ctxAudio) music.play().catch(() => {});
    else music.pause();
    return musicOn;
  }

  return { init, play, toggleMusic, isMusicOn: () => musicOn };
})();
