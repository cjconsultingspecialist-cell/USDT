{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // service-worker.js \'96 Service\uc0\u8239 Worker\u8239 base\u8239 per\u8239 Security\u8239 Wallet\u8239 Pro\
// Permette caching\uc0\u8239 base\u8239 e\u8239 installazione\u8239 PWA\u8239 offline\u8239 light\
\
const CACHE_NAME = "wallet-pro-cache-v1";\
\
// Elenco dei file da mantenere nella cache\
const ASSETS = [\
  "./",\
  "./index.html",\
  "./app.js",\
  "./usdt.json",\
  "./wallet_icon.jpg",\
  "./USDT.jpg",\
  "./manifest.json"\
];\
\
// Installazione del service worker (aggiunge file alla cache)\
self.addEventListener("install", (event) => \{\
  console.log("\uc0\u55357 \u56510 \u8239 SW\u8239 installato");\
  event.waitUntil(\
    caches.open(CACHE_NAME)\
      .then((cache) => cache.addAll(ASSETS))\
      .then(() => self.skipWaiting())\
  );\
\});\
\
// Intercetta le richieste della DApp e prova a rispondere dalla cache\
self.addEventListener("fetch", (event) => \{\
  event.respondWith(\
    caches.match(event.request).then((response) => \{\
      // Se c'\'e8 un file in cache lo restituiamo, altrimenti andiamo in rete\
      return response || fetch(event.request);\
    \})\
  );\
\});\
\
// Attivazione: rimuove vecchie versioni della cache\
self.addEventListener("activate", (event) => \{\
  console.log("\uc0\u9881 \u65039 \u8239 SW\u8239 attivato");\
  event.waitUntil(\
    caches.keys().then((keys) =>\
      Promise.all(\
        keys.filter((key) => key !== CACHE_NAME)\
            .map((key) => caches.delete(key))\
      )\
    )\
  );\
  self.clients.claim();\
\});}
