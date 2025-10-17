const CACHE_NAME = 'wholeness-v1';
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install: cache core assets
self.addEventListener('install', event =>
{
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate: cleanup old caches
self.addEventListener('activate', event =>
{
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k =>
            {
                if (k !== CACHE_NAME) return caches.delete(k);
            }))
        ).then(() => self.clients.claim())
    );
});

// Fetch: respond with cache first, then network fallback
self.addEventListener('fetch', event =>
{
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse =>
        {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(networkResponse =>
            {
                // Optionally cache new requests for same-origin assets
                if (event.request.url.startsWith(self.location.origin))
                {
                    caches.open(CACHE_NAME).then(cache =>
                    {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() =>
            {
                // Fallback: return index.html for navigation requests (SPA)
                if (event.request.mode === 'navigate')
                {
                    return caches.match('./index.html');
                }
            });
        })
    );
});