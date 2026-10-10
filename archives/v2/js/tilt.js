// Lecture de l'inclinaison du téléphone, avec calibration (même méthode que test-gyro/).
// On calcule la direction « vers le haut » vue depuis l'écran plutôt que d'utiliser les angles
// bruts : pas de saut quand le téléphone est presque vertical, et la rotation de l'écran est gérée.
'use strict';

const Tilt = (() => {
  const DEAD_ZONE = 0.03;  // ≈ 2° : en dessous, on considère le téléphone immobile
  const FULL_TILT = 0.45;  // ≈ 27° : inclinaison maximale prise en compte (plus doux)
  const SMOOTHING = 0.2;
  const CALIB_MS = 1000;

  const state = {
    mode: 'none', // gyro | fallback
    grav: null,
    neutral: null,
    calibrating: null,
    received: false,
    prefs: { invertX: false, invertY: false },
  };
  try { Object.assign(state.prefs, JSON.parse(localStorage.getItem('gardienne-axes')) || {}); } catch (_) { /* rien */ }

  function screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    return typeof window.orientation === 'number' ? window.orientation : 0;
  }

  function upOnScreen(beta, gamma) {
    const b = beta * Math.PI / 180, g = gamma * Math.PI / 180;
    const ux = -Math.sin(g) * Math.cos(b), uy = Math.sin(b);
    const a = screenAngle() * Math.PI / 180;
    return { x: ux * Math.cos(a) - uy * Math.sin(a), y: ux * Math.sin(a) + uy * Math.cos(a) };
  }

  function onOrientation(e) {
    if (e.beta === null || e.gamma === null) return;
    state.received = true;
    const up = upOnScreen(e.beta, e.gamma);
    if (!state.grav) state.grav = up;
    else {
      state.grav.x += (up.x - state.grav.x) * SMOOTHING;
      state.grav.y += (up.y - state.grav.y) * SMOOTHING;
    }
    if (state.calibrating) state.calibrating.samples.push(up);
  }

  // Demande l'accès au capteur (à appeler juste après un toucher, pour l'iPhone).
  // Renvoie 'ok', 'refusé' ou 'absent'.
  async function start() {
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) { state.mode = 'fallback'; return 'absent'; }
    if (typeof DOE.requestPermission === 'function') {
      try {
        if (await DOE.requestPermission() !== 'granted') { state.mode = 'fallback'; return 'refusé'; }
      } catch (_) {
        state.mode = 'fallback';
        return 'refusé';
      }
    }
    window.addEventListener('deviceorientation', onOrientation);
    const t0 = performance.now();
    while (performance.now() - t0 < 1500) {
      if (state.received) { state.mode = 'gyro'; return 'ok'; }
      await new Promise(r => setTimeout(r, 50));
    }
    window.removeEventListener('deviceorientation', onOrientation);
    state.mode = 'fallback';
    return 'absent';
  }

  function calibrate() {
    if (state.mode !== 'gyro') return Promise.resolve(false);
    state.calibrating = { samples: [] };
    return new Promise(resolve => setTimeout(() => {
      const s = state.calibrating.samples;
      state.calibrating = null;
      if (s.length) {
        state.neutral = {
          x: s.reduce((t, v) => t + v.x, 0) / s.length,
          y: s.reduce((t, v) => t + v.y, 0) / s.length,
        };
      }
      resolve(s.length > 0);
    }, CALIB_MS));
  }

  // Inclinaison par rapport à la position neutre, de -1 à 1 sur chaque axe.
  // x > 0 : le côté droit de l'écran penche vers le bas. y > 0 : le haut de l'écran se rapproche.
  function read() {
    if (state.mode !== 'gyro' || !state.grav || !state.neutral || state.calibrating) return { x: 0, y: 0 };
    const shape = v => {
      const m = Math.abs(v);
      return m < DEAD_ZONE ? 0 : Math.sign(v) * Math.min(1, (m - DEAD_ZONE) / (FULL_TILT - DEAD_ZONE));
    };
    return {
      x: shape(-(state.grav.x - state.neutral.x)) * (state.prefs.invertX ? -1 : 1),
      y: shape(state.grav.y - state.neutral.y) * (state.prefs.invertY ? -1 : 1),
    };
  }

  function toggleAxis(axis) {
    const key = axis === 'x' ? 'invertX' : 'invertY';
    state.prefs[key] = !state.prefs[key];
    try { localStorage.setItem('gardienne-axes', JSON.stringify(state.prefs)); } catch (_) { /* rien */ }
    return state.prefs[key];
  }

  return { state, start, calibrate, read, toggleAxis, upOnScreen };
})();
