/* DreSo Budgettool — service worker: maakt de app installeerbaar en offline bruikbaar.
   Werkt volledig los van de projectgegevens: die staan in localStorage, niet hier. */

const CACHE_NAME = "dreso-budgettool-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/i18n.js",
  "./assets/js/data.js",
  "./assets/js/store.js",
  "./assets/js/charts.js",
  "./assets/js/views.js",
  "./assets/js/app.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // navigaties (het openen van de pagina zelf): probeer netwerk eerst zodat je bij
  // een online update meteen de nieuwste versie krijgt, val anders terug op cache.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // overige app-bestanden: cache-first, op de achtergrond verversen wanneer online.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
