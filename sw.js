// Offline support: app shell cached on install; same-origin files and CDN libraries
// served from cache and refreshed in the background. API calls and Supabase always go to the network.
const VERSION = "a1-v4";
const SHELL = ["/", "/index.html", "/styles.css", "/app.js", "/live.js", "/config.js", "/manifest.webmanifest",
  "/days/index.json", "/days/day01.json", "/days/austria.json", "/days/mock-a.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const cdn = /cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if ((sameOrigin && url.pathname.startsWith("/api/")) || (!sameOrigin && !cdn)) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const cached = await cache.match(req, { ignoreSearch: sameOrigin && url.pathname === "/" });
    const fresh = fetch(req).then((res) => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; }).catch(() => cached);
    return cached || fresh;
  }));
});
