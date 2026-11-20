// Çevrimdışı çalışma: sayfa ağdan, yoksa önbellekten; dosyalar önbellekten.
// Site bir alt yolda yayınlanabilir (GitHub Pages: /dgs-planner/), yollar sw.js'in konumuna göre.
const CACHE = 'dgs-plan-v2';
const ROOT = new URL('./', self.location).href;
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([ROOT, ROOT + 'manifest.webmanifest'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(ROOT)) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok) caches.open(CACHE).then((c) => c.put(ROOT, r.clone()));
          return r;
        })
        .catch(() => caches.match(ROOT)),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((r) => {
          if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone()));
          return r;
        }),
    ),
  );
});
