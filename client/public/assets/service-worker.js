// Service Worker for Push Notifications

// Cache name for offline support
const CACHE_NAME = 'bantahchatbet-cache-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');

  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        // Add other static assets here
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');

  // Claim clients to ensure the service worker controls all clients
  event.waitUntil(self.clients.claim());

  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip Privy API requests to avoid CSP issues
  if (event.request.url.includes('privy.io') ||
      event.request.url.includes('walletconnect') ||
      event.request.url.includes('auth.privy') ||
      event.request.url.includes('api.privy') ||
      event.request.url.includes('embedded-wallet.privy')) {
    // Do not intercept these requests at all
    console.log('Skipping service worker interception for Privy request:', event.request.url);
    return;
  }

  // For all other requests, try to serve from cache first
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (e) {
    console.error('Error parsing push notification data:', e);
    // If the data isn't JSON, use a default
    notificationData = {
      title: 'New Notification',
      body: 'You have a new notification',
      icon: '/assets/bantahlogo.png',
      badge: '/assets/notification.svg',
      data: {
        url: '/notifications'
      }
    };
  }

  // Log the notification data for debugging
  console.log('Notification data:', notificationData);

  const title = notificationData.title || 'New Notification';
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/assets/bantahlogo.png',
    badge: notificationData.badge || '/assets/notification.svg',
    data: notificationData.data || {},
    // Vibration pattern
    vibrate: [100, 50, 100],
    // Show notification even if app is in foreground
    requireInteraction: true,
    // Add action buttons for interactive notifications
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/assets/icons/view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/close.png'
      }
    ],
    // Add silent notification option
    silent: false,
    // Add tag to group similar notifications
    tag: notificationData.type || 'general'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user interaction with the notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Get the notification data
  const notificationData = event.notification.data;

  // Open the relevant page when the user clicks the notification
  if (notificationData && notificationData.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === notificationData.url && 'focus' in client) {
            return client.focus();
          }
        }

        // If no window/tab is open with the URL, open a new one
        if (clients.openWindow) {
          return clients.openWindow(notificationData.url);
        }
      })
    );
  }
});
