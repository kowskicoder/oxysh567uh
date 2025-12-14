import { apiRequest } from './queryClient';

const VAPID_PUBLIC_KEY = 'BKZ0LNy05CTv807lF4dSwM3wB7nxrBHXDP5AYPvbCCPZYWrK08rTYFQO6BmKrW3f0xmIe5wUxtLN67XOSQ7W--o';

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/assets/service-worker.js');
      console.log('Service Worker registered successfully');

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Request notification permission
      await this.requestNotificationPermission();

      // Subscribe to push notifications
      await this.subscribeToNotifications();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
    }
  }

  private async subscribeToNotifications(): Promise<void> {
    try {
      if (!this.registration) {
        console.error('Service Worker not registered');
        return;
      }

      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        return;
      }

      // Subscribe to push notifications
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('Push subscription successful:', subscription);

      // Send subscription to server
      await apiRequest('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      console.log('Push subscription saved to server');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendTestNotification(): Promise<void> {
    try {
      await apiRequest('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'current-user', // This should be replaced with actual user ID
          title: 'Test Notification',
          body: 'This is a test push notification from BetChat!',
          data: {
            type: 'test',
            url: '/',
          },
        }),
      });
      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      if (!this.registration) {
        console.error('Service Worker not registered');
        return;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push subscription cancelled');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }
}

// Initialize push notifications when the module is loaded
export const pushNotificationService = PushNotificationService.getInstance();