const CACHE_VERSION = "flashtype-shell-v1";
const CORE_ASSETS = [
	"/",
	"/index.html",
	"/manifest.webmanifest",
	"/icons/flashtype/flashtype-favicon.svg",
	"/icons/flashtype/flashtype-icon-maskable.svg",
	"/icons/flashtype/flashtype-icon-circle.svg",
	"/icons/flashtype/flashtype-favicon-rounded.svg",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_VERSION)
			.then((cache) => cache.addAll(CORE_ASSETS))
			.catch(() => undefined)
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_VERSION)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
		return;
	}

	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;

			return fetch(request)
				.then((response) => {
					if (
						!response ||
						response.status !== 200 ||
						response.type !== "basic"
					) {
						return response;
					}

					const cloned = response.clone();
					caches
						.open(CACHE_VERSION)
						.then((cache) => cache.put(request, cloned))
						.catch(() => undefined);

					return response;
				})
				.catch(() => caches.match("/index.html"));
		}),
	);
});

self.addEventListener("message", (event) => {
	if (event.data === "SKIP_WAITING") {
		self.skipWaiting();
	}
});
