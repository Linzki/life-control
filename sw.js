// © 2026 TinyRoom Studio. Alle Rechte vorbehalten.
// Netz zuerst (für Updates), ohne Netz aus dem Speicher.
const CACHE = "meinweg-alles-26";
const FILES = ["./", "index.html", "alltag.js", "manifest.webmanifest",
  "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("meinweg-alles-") && k !== CACHE)
      .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  event.respondWith(fetch(request, { cache: "no-cache" }).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(c => c.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request, { ignoreSearch: true })));
});
// Tippen auf die Erinnerung öffnet die App mit der Kauffrage.
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const id = String(event.notification.data?.id || "");
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const open = list.find(client => client.url.startsWith(self.registration.scope));
    if (!open) return self.clients.openWindow("./#frage=" + encodeURIComponent(id));
    open.postMessage({ ask: id });
    return open.focus();
  }));
});
