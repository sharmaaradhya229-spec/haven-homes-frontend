const CACHE_NAME = "havenhomes-v5";

// ✅ Use RELATIVE paths (not starting with /)
const STATIC_FILES = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./emi-calculator.html",
  "./home_loan_offers.html",
  "./interior_budget.html",
  "./rates_trends.html",
  "./investment_hotspot.html",
  "./house_details.html",
  "./reset.html",

  "./styles.css",
  "./script.js",
  "./login.js",
  "./reset.js",
  "./manifest.json",

  "./icon-192.png",
  "./icon-512.png",
  "./Logo.png",

  "./background.jpg",
  "./brand1.jpeg",
  "./brand2.jpeg",
  "./brand3.png",
  "./brand4.png",
  "./your-livingroom-image.jpeg"
];

// ---------- INSTALL ----------
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// ---------- ACTIVATE ----------
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// ---------- FETCH ----------
self.addEventListener("fetch", event => {
  const req = event.request;

  // ❌ Never cache API
  if (req.url.includes("/api/")) {
    return event.respondWith(fetch(req));
  }

  // ❌ Never cache query URLs
  if (req.url.includes("?")) {
    return event.respondWith(fetch(req));
  }

  // ✅ Cache first strategy
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return cacheRes || fetch(req);
    })
  );
});
