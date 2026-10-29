const CACHE_NAME = 'storycast-v3.4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through network requests so live AI API calls aren't blocked by cache
  event.respondWith(fetch(event.request));
});
