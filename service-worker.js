const CACHE_NAME = "institutional-wallet-cache-v1";

const STATIC_ASSETS = [
  "/USDT/",
  "/USDT/index.html",
  "/USDT/app.js",
  "/USDT/manifest.json",
  "/USDT/icon-192.png",
  "/USDT/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (
    event.request.url.includes("alchemy") ||
    event.request.url.includes("infura") ||
    event.request.url.includes("rpc") ||
    event.request.url.includes("etherscan")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
