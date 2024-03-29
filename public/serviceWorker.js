const staticDevPwa = "dev-pw-site-v1.5.0";
const assets = [
    // Web
    "/",
    "/index.html",
    "/styles/style.css",
    "/scripts/client.js",
    "/scripts/userData.js",

    // Images
    "/images/favicon-16x16.png.png",
    "/images/logo_24x24.png",
    "/images/favicon-32x32.png",
    "/images/apple-touch-icon.png",
    "/images/android-chrome-192x192.png",
    "/images/logo_240x240.png",
    "/images/android-chrome-512x512.png",
    "/images/Screenshot1.png",
    "/images/Screenshot2.png",

    // Models - Female - 2
    "/models/Female/Sci Fi Character.glb",
    "/models/Female/Sci Fi Character.json",
    "/models/Female/Sci Fi Character.webp",
    
    // Models - Male - 1
    "/models/Male/Astronaut.glb",
    "/models/Male/Astronaut.json",
    "/models/Male/Astronaut.webp",
    
    // Models - Weapon - 2
    "/models/Weapon/Scifi Pistol.glb",
    "/models/Weapon/Scifi Pistol.json",
    "/models/Weapon/Scifi Pistol.webp",

    // Models - Map
    "/models/Map/collision-world.glb",
    "/models/Map/collision-world.json",

    "/models/Map/scene.glb",
    "/models/Map/scene.json",
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