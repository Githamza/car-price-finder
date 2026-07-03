const CACHE_NAME = "covoiturage-map-v1";

// Liste des fichiers à mettre en cache pour le fonctionnement hors ligne
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/404.html",
  "/manifest.json",
  "/src/app/main.js",
  "/src/app/styles.css",
  "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap",
  "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

// Installation du service worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installation");

  // Mettre en cache les fichiers essentiels
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Mise en cache des ressources");
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activation du service worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activation");

  // Supprimer les anciennes caches
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log(
                "[Service Worker] Suppression de l'ancienne cache",
                key
              );
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Interception des requêtes fetch
self.addEventListener("fetch", (event) => {
  console.log("[Service Worker] Requête fetch", event.request.url);

  // Stratégie de cache : Cache-First avec fallback sur le réseau
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Retourner la ressource en cache si disponible
        if (response) {
          console.log("[Service Worker] Utilisation de la ressource en cache");
          return response;
        }

        // Sinon, faire la requête au réseau
        console.log(
          "[Service Worker] Récupération de la ressource depuis le réseau"
        );
        return fetch(event.request).then((networkResponse) => {
          // Mettre en cache la nouvelle ressource pour les futures requêtes
          // Ne mettre en cache que les ressources d'origine (même domaine) ou les CDN spécifiés
          const url = event.request.url;
          if (
            url.startsWith(self.location.origin) ||
            url.includes("fonts.googleapis.com") ||
            url.includes("cdn.jsdelivr.net") ||
            url.includes("unpkg.com")
          ) {
            let responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        });
      })
      .catch((error) => {
        console.log("[Service Worker] Erreur de fetch:", error);

        // En cas d'erreur de connexion, retourner la page 404 pour les requêtes de navigation
        if (event.request.mode === "navigate") {
          return caches.match("/404.html");
        }

        // Sinon retourner une erreur
        return new Response("Contenu non disponible hors ligne.", {
          status: 503,
          statusText: "Service indisponible",
        });
      })
  );
});
