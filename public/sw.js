// Makes the duck installable and lets it open offline (it falls back to its pre-written lines).
// Bump VERSION when the precached files change so phones pick up the new ones.
const VERSION = 'duck-v1';
const SHELL = ['/', '/manifest.webmanifest', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png',
  '/vendor/gsap.min.js', '/vendor/MotionPathPlugin.min.js', '/vendor/Physics2DPlugin.min.js', '/vendor/CustomEase.min.js', '/vendor/CustomWiggle.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return; // AI replies and stats always go to the network
  // pages: newest from the network, the saved copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res.ok && url.pathname === '/') { const copy = res.clone(); caches.open(VERSION).then(c => c.put('/', copy)); }
      return res;
    }).catch(() => caches.match(url.pathname === '/' ? '/' : req).then(r => r || caches.match('/'))));
    return;
  }
  // memes, scripts, icons and Google Fonts: saved copy first, fetched and saved the first time
  const own = url.origin === location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!own && !fonts) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
