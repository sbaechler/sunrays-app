/**
 * Minimaler App-Shell-Service-Worker (PWA):
 * - Navigationen: network-first, Fallback auf gecachte Shell (offline).
 * - Gehashte Build-Assets (/assets/): cache-first (immutable Dateinamen).
 * - Alles andere (Tiles, APIs, Cesium-Streams): unangetastet — Karten-Daten
 *   zu cachen würde die Quotas der freien Dienste verzerren.
 */
const CACHE = 'sunrays-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', event => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then(cache => cache.addAll(SHELL))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin) return;

	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.then(response => {
					const copy = response.clone();
					caches.open(CACHE).then(cache => cache.put('/', copy));
					return response;
				})
				.catch(() => caches.match('/')),
		);
		return;
	}

	if (url.pathname.startsWith('/assets/')) {
		event.respondWith(
			caches.match(event.request).then(
				cached =>
					cached ??
					fetch(event.request).then(response => {
						const copy = response.clone();
						caches.open(CACHE).then(cache => cache.put(event.request, copy));
						return response;
					}),
			),
		);
	}
});
