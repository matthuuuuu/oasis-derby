// Service worker: lets the game load offline (pass & play works with no
// internet) and makes it installable. "Network first": when online you always
// get the newest version you deployed; the cache is only a fallback.
const CACHE = 'oasis-derby-v4';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/main.js',
  'js/ui/app.js',
  'js/ui/home.js',
  'js/ui/setup.js',
  'js/ui/game.js',
  'js/ui/board.js',
  'js/ui/stacking.js',
  'js/ui/panels.js',
  'js/ui/modals.js',
  'js/ui/howto.js',
  'js/ui/common.js',
  'js/ui/prefs.js',
  'js/ui/fx.js',
  'js/engine/game.js',
  'js/engine/constants.js',
  'js/engine/rng.js',
  'js/ai/bot.js',
  'js/net/session.js',
  'js/net/online.js',
  'js/art/camels.js',
  'js/art/characters.js',
  'js/art/scenery.js',
  'js/art/tokens.js',
  'vendor/preact-htm.js',
  'vendor/qrcode.mjs',
  'vendor/peerjs.min.js',
  'fonts/lilita-one-latin.woff2',
  'fonts/nunito-latin.woff2',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/cursors/glove.png',
  'assets/cursors/glove@2x.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined))
      )
  );
});
