// FuerzaVerificada - Safe Network-First Service Worker (PWA)
const CACHE_NAME = "fuerzaverificada-pwa-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = req.url || "";

  // Network-Only for all non-GET requests, Supabase API/Realtime/Auth, Next data, and dynamic routes
  if (
    req.method !== "GET" ||
    url.includes("supabase") ||
    url.includes("/auth") ||
    url.includes("/api") ||
    url.includes("_next/data") ||
    url.includes("chrome-extension")
  ) {
    event.respondWith(fetch(req));
    return;
  }

  // Network-First for static assets and pages
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          (url.includes("/_next/static/") ||
            url.includes("/images/") ||
            url.endsWith("/icon-192") ||
            url.endsWith("/icon-512"))
        ) {
          const cloned = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(req, cloned))
            .catch(() => {});
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(req).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          throw new Error("Network error and no cache available");
        })
      )
  );
});
