/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'aethermail-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests (let them fail naturally)
  if (url.pathname.startsWith('/api/')) return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // For navigation requests, use network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL).then((response) => {
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // For static assets, use cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
        });
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-emails') {
    event.waitUntil(syncEmails());
  }
});

async function syncEmails(): Promise<void> {
  // Get queued actions from IndexedDB
  // Process each action
  // This would be implemented with actual IndexedDB logic
  console.log('[SW] Syncing emails in background');
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  event.waitUntil(
    self.registration.showNotification(data.title || 'AetherMail', {
      body: data.body || 'You have a new email',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'default',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const url = event.notification.data || '/';

      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

export {};