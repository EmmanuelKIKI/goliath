// service-worker.js
// Je me limite ici à mettre en cache l'app shell (statique) pour permettre
// un chargement hors connexion. Toute la logique de données hors ligne
// (lecture/écriture, file de synchronisation) est gérée par l'application
// elle-même via IndexedDB (src/services/indexedDb.js et syncQueue.js), pas
// par ce service worker — je n'intercepte jamais les appels Supabase ici.

const CACHE_NAME = "goliath-shell-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Je ne mets jamais en cache les appels vers Supabase (API, Auth,
  // Storage, Edge Functions) : ces requêtes doivent toujours atteindre le
  // réseau ou échouer explicitement, jamais renvoyer une réponse figée.
  if (request.url.includes("supabase.co")) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});
