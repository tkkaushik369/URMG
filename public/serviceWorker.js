const staticDevPwa = "dev-pw-site-v0.0";
const assets = [
    "/",
    "/index.html",
    "/styles/style.css",
    "/scripts/client.js",
    "/scripts/userData.js",
    "/images/favicon-16x16.png.png",
    "/images/logo_24x24.png",
    "/images/favicon-32x32.png",
    "/images/apple-touch-icon.png",
    "/images/android-chrome-192x192.png",
    "/images/logo_240x240.png",
    "/images/android-chrome-512x512.png",
    "/images/Screenshot1.png",
    "/images/Screenshot2.png"
];

self.addEventListener("install", instalEvent => {
    instalEvent.waitUntil(
        caches.open(staticDevPwa).then(cache => {
            cache.addAll(assets);
        })
    );
    console.log("Service Worker Installed.");
});

self.addEventListener("activate", event => {
    console.log("Service Worker Activated.");
});

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request);
        })
    );
});