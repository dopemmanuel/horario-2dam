// Service worker: la app funciona sin conexión.
// Estrategia: red primero (para recibir actualizaciones) y caché como respaldo.
const V = "dam-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        const copy = res.clone();
        caches.open(V).then(c => c.put(r, copy));
        return res;
      })
      .catch(() => caches.match(r).then(m => m || caches.match("index.html")))
  );
});

// Al tocar un aviso se abre (o se enfoca) la app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(l => (l.length ? l[0].focus() : clients.openWindow("./")))
  );
});
