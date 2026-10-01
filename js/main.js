// Entry point: paint the desert, start the app, enable offline/install.
import { html, render } from '../vendor/preact-htm.js';
import { App } from './ui/app.js';
import { sceneSVG } from './art/scenery.js';
import { getPrefs, onPrefs } from './ui/prefs.js';

// Remember the browser's "install" offer so the banner can use it later.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPrompt = e;
});

const THEME_COLORS = { sand: '#f2b84b', sunset: '#3a1d1a', night: '#10142e' };

// The desert background is one big drawing (~1,300 shapes). Turning it into an
// image once is much lighter for phones than keeping it as live page elements.
let sceneUrl = null;
function paintScene() {
  const theme = getPrefs().theme;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.sand);
  const holder = document.getElementById('scene');
  const svg = sceneSVG(theme);
  try {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.onload = () => {
      holder.replaceChildren(img);
      if (sceneUrl) URL.revokeObjectURL(sceneUrl);
      sceneUrl = url;
    };
    img.onerror = () => (holder.innerHTML = svg);
    img.src = url;
  } catch {
    holder.innerHTML = svg;
  }
}
paintScene();
let lastTheme = getPrefs().theme;
onPrefs((p) => {
  if (p.theme !== lastTheme) {
    lastTheme = p.theme;
    paintScene();
  }
});

const root = document.getElementById('app');
root.textContent = '';
render(html`<${App} />`, root);

// Offline support + "install to home screen" (needs https or localhost).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
