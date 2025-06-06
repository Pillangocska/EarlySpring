// public/service-worker.js

const CACHE_NAME = 'earlyspring-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/sounds/baby_waltz.mp3',
  '/sounds/birds.mp3',
  '/sounds/digital.mp3',
  '/sounds/gentle_chime.mp3',
  '/sounds/rising_bell.mp3',
  '/icons/alarm-icon.png',
  '/icons/alarm-badge.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

// Fetch event - serve from cache if available, but don't intercept API calls
self.addEventListener('fetch', (event) => {
    // Skip API requests
    if (event.request.url.includes('/api/')) {
      return;
    }

    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  });

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body || 'Time to wake up!',
    icon: '/icons/alarm-icon.png',
    badge: '/icons/alarm-badge.png',
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    actions: [
      { action: 'snooze', title: 'Snooze' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: true,
    data: {
      alarmId: data.alarmId,
      userId: data.userId,
      timestamp: new Date().getTime()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Alarm', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const alarmData = event.notification.data;

  if (event.action === 'snooze') {
    // Snooze the alarm
    event.waitUntil(
      fetch('/api/alarms/snooze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alarmId: alarmData.alarmId,
          userId: alarmData.userId
        })
      })
    );
  } else if (event.action === 'dismiss' || !event.action) {
    // Dismiss the alarm or default action (clicking notification)
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // If a window client already exists, focus it
          for (const client of clientList) {
            if ('focus' in client) {
              return client.focus();
            }
          }

          // Otherwise, open a new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});
