/**
 * Service Worker — Ahmed Mahmoud Photography
 *
 * Strategy:
 *  - App shell (HTML/CSS/JS/icons): cache-first, versioned, precached on install.
 *  - Photography images: runtime cache, cache-first with a soft entry cap
 *    (we do NOT blindly cache every full-resolution photo).
 *  - API calls to the Apps Script backend: network-first, falling back to
 *    cache for resilience, never caching admin/auth POST requests.
 *  - Navigation requests: network-first with offline.html fallback.
 */

const VERSION = "v1.0.0";
const SHELL_CACHE = `amp-shell-${VERSION}`;
const IMAGE_CACHE = `amp-images-${VERSION}`;
const API_CACHE = `amp-api-${VERSION}`;
const IMAGE_CACHE_MAX_ENTRIES = 120;

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/css/reset.css",
  "/css/variables.css",
  "/css/typography.css",
  "/css/layout.css",
  "/css/components.css",
  "/css/gallery.css",
  "/css/animations.css",
  "/css/responsive.css",
  "/js/app.js",
  "/js/config.js",
  "/js/utils.js",
  "/js/state.js",
  "/js/api.js",
  "/js/auth.js",
  "/js/router.js",
  "/js/animations.js",
  "/js/gallery.js",
  "/js/lightbox.js",
  "/js/seo.js",
  "/js/pwa.js",
  "/components/navbar.js",
  "/components/footer.js",
  "/components/lightbox.js",
  "/components/wedding-card.js",
  "/components/loader.js",
  "/components/contact-actions.js",
  "/components/story-rail.js",
  "/components/gallery.js",
  "/assets/brand/logo.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, IMAGE_CACHE, API_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never intercept admin mutations

  const url = new URL(request.url);

  // Navigations: network-first, offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Apps Script API reads: network-first with short-lived cache fallback.
  if (url.hostname === "script.google.com") {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // Photography images (same-origin assets/images, or remote ImgBB URLs).
  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // Same-origin static shell assets: cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstShell(request));
  }
});

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname) ||
    url.hostname.includes("ibb.co") ||
    url.hostname.includes("imgbb.com")
  );
}

async function cacheFirstShell(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      await cache.put(request, res.clone());
      trimCache(cache, IMAGE_CACHE_MAX_ENTRIES);
    }
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ ok: false, error: "Offline" }), {
      headers: { "Content-Type": "application/json" },
      status: 503,
    });
  }
}

async function networkFirstNavigation(request) {
  try {
    const res = await fetch(request);
    return res;
  } catch {
    const shellCache = await caches.open(SHELL_CACHE);
    const shellMatch = await shellCache.match("/index.html");
    return shellMatch || shellCache.match("/offline.html") || Response.error();
  }
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}
