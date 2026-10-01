// Things this device remembers (name, character, theme, sound...).
// Stored in localStorage; every read/write is guarded because private
// browsing modes can block storage.

const KEY = 'oasis-derby:prefs';

const defaults = {
  name: '',
  character: 'merchant',
  theme: 'sand',
  sound: true,
  odds: false,
  fast: false,
  mode: 'crazier',
  clientId: '',
};

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...defaults };
  }
}

let prefs = load();
if (!prefs.clientId) {
  prefs.clientId = 'c' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  save();
}
const listeners = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export function getPrefs() {
  return prefs;
}

export function setPrefs(patch) {
  prefs = { ...prefs, ...patch };
  save();
  if ('theme' in patch) document.documentElement.dataset.theme = prefs.theme;
  for (const fn of listeners) fn(prefs);
}

export function onPrefs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Small generic helpers for other saved things (resumable games).
export function saveJSON(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}
