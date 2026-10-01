// Sound effects (made with the Web Audio API — no audio files), vibration,
// and confetti. Everything is optional and fails silently.
import { getPrefs } from './prefs.js';

let ctx = null;
function audio() {
  if (!getPrefs().sound) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, { at = 0, dur = 0.12, type = 'sine', vol = 0.18, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ at = 0, dur = 0.06, vol = 0.12, freq = 1800 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = a.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
}

export const sfx = {
  tap: () => tone(660, { dur: 0.05, vol: 0.08, type: 'triangle' }),
  shake: () => {
    for (let i = 0; i < 7; i++) noise({ at: i * 0.055, dur: 0.05, vol: 0.14, freq: 900 + Math.random() * 1400 });
  },
  pop: () => tone(520, { dur: 0.14, type: 'triangle', slide: 380, vol: 0.16 }),
  hop: () => tone(300, { dur: 0.1, type: 'sine', slide: 260, vol: 0.12 }),
  land: () => noise({ dur: 0.05, vol: 0.1, freq: 400 }),
  coin: () => {
    tone(1318, { dur: 0.08, type: 'square', vol: 0.06 });
    tone(1760, { at: 0.07, dur: 0.16, type: 'square', vol: 0.06 });
  },
  cheer: () => [523, 659, 784].forEach((f, i) => tone(f, { at: i * 0.07, dur: 0.14, type: 'triangle', vol: 0.12 })),
  boo: () => tone(220, { dur: 0.35, type: 'sawtooth', slide: -90, vol: 0.07 }),
  card: () => noise({ dur: 0.08, vol: 0.1, freq: 3000 }),
  ticket: () => {
    noise({ dur: 0.06, vol: 0.08, freq: 2500 });
    tone(880, { at: 0.04, dur: 0.1, type: 'triangle', vol: 0.08 });
  },
  turn: () => {
    tone(784, { dur: 0.12, type: 'sine', vol: 0.14 });
    tone(1175, { at: 0.12, dur: 0.22, type: 'sine', vol: 0.14 });
  },
  fanfare: () =>
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      tone(f, { at: i * 0.11, dur: i === 5 ? 0.5 : 0.13, type: 'triangle', vol: 0.13 })
    ),
  error: () => tone(180, { dur: 0.18, type: 'square', vol: 0.06 }),
};

export function buzz(pattern = 30) {
  try {
    // browsers only allow vibrating after you've tapped the page at least once
    const tapped = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
    if (getPrefs().sound && tapped) navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

const CONFETTI_COLORS = ['#1a9fd6', '#f5cf2f', '#2a9a45', '#e0344f', '#6a45a8', '#f2b84b'];

export function confetti(count = 90) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('i');
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = 2.2 + Math.random() * 2.2 + 's';
    piece.style.animationDelay = Math.random() * 0.8 + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 5600);
}
