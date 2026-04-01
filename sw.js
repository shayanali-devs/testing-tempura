// ============================================================
//  TEMPURA POTATO — sw.js v4.0
//  Service Worker: Offline cache, PWA support
// ============================================================

const CACHE  = 'tp-v4';
const ASSETS = [
  '/', '/index.html', '/checkout.html', '/tracking.html',
  '/rider.html', '/admin.html', '/rebranding.html',
  '/style.css', '/main.js', '/manifest.json',
];

// INSTALL — pre-cache all static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(err => console.warn('Cache install:', err)))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// FETCH — network first, fallback to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Skip Back4App and CDN requests (always need fresh data)
  const url = e.request.url;
  if (url.includes('parseapi.back4app.com') ||
      url.includes('googleapis.com') ||
      url.includes('unpkg.com') ||
      url.includes('imgbb.com') ||
      url.includes('fonts.googleapis.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.destination === 'document') return caches.match('/index.html');
        })
      )
  );
});

// PUSH NOTIFICATIONS
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Tempura Potato 🥔', {
      body:  data.body  || 'You have a new notification',
      icon:  data.icon  || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag:   'tp-notif',
      data:  data.url   || '/',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || '/'));
});
