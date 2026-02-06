self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("lst-v1").then((cache) =>
      cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./script.js",
        "./assets/icons/manifest.json",
        "./assets/icons/icon-192.png",
        "./assets/icons/icon-512.png"
      ])
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
