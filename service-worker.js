const CACHE_NAME = "institutional-wallet-cache-v1";

const STATIC_ASSETS = [
  "/USDT/",
  "/USDT/index.html",
  "/USDT/app.js",
  "/USDT/usdt.json",
  "/USDT/manifest.json",
  "/USDT/icon-192.png",
  "/USDT/icon-512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // ❌ Skip non-GET requests
  if (request.method !== "GET") return;

  // ❌ Skip blockchain & external APIs
  if (
    request.url.includes("rpc") ||
    request.url.includes("alchemy") ||
    request.url.includes("infura") ||
    request.url.includes("coingecko") ||
    request.url.includes("etherscan")
  ) {
    return;
  }

  // ✅ Cache-first only for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          return response;
        })
      );
    })
  );
});
