// Push notification service for instant notifications
export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.permission = Notification.permission;
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    this.permission = await Notification.requestPermission();
    return this.permission;
  }

  async showNotification(title: string, options: NotificationOptions & { 
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  } = {}): Promise<void> {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'betchat-notification',
      renotify: true,
      requireInteraction: true,
      ...options
    };

    try {
      if (this.registration) {
        await this.registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async showChallengeNotification(challengeData: {
    challengerName: string;
    challengeTitle: string;
    amount: number;
    challengeId: number;
  }): Promise<void> {
    const title = `🎯 Challenge Received!`;
    const body = `${challengeData.challengerName} challenged you to "${challengeData.challengeTitle}" for ₦${challengeData.amount.toLocaleString()}`;
    
    await this.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `challenge-${challengeData.challengeId}`,
      data: {
        type: 'challenge',
        challengeId: challengeData.challengeId,
        url: '/challenges'
      },
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'view', title: 'View' },
        { action: 'decline', title: 'Decline' }
      ]
    });
  }

  async showEventNotification(eventData: {
    title: string;
    message: string;
    eventId: number;
    type: 'event_starting' | 'event_ending' | 'event_result';
  }): Promise<void> {
    const title = eventData.title;
    const body = eventData.message;
    
    await this.showNotification(title, {
      body,
      tag: `event-${eventData.eventId}`,
      data: {
        type: eventData.type,
        eventId: eventData.eventId,
        url: `/events/${eventData.eventId}`
      }
    });
  }

  async showFriendNotification(friendData: {
    friendName: string;
    type: 'friend_request' | 'friend_accepted';
    friendId: string;
  }): Promise<void> {
    const title = friendData.type === 'friend_request' 
      ? `👋 Friend Request` 
      : `✅ Friend Request Accepted`;
    
    const body = friendData.type === 'friend_request'
      ? `${friendData.friendName} sent you a friend request`
      : `${friendData.friendName} accepted your friend request`;
    
    await this.showNotification(title, {
      body,
      tag: `friend-${friendData.friendId}`,
      data: {
        type: friendData.type,
        friendId: friendData.friendId,
        url: '/friends'
      }
    });
  }

  async showMessageNotification(messageData: {
    senderName: string;
    message: string;
    chatType: 'event' | 'challenge';
    chatId: number;
  }): Promise<void> {
    const title = `💬 New Message`;
    const body = `${messageData.senderName}: ${messageData.message}`;
    
    await this.showNotification(title, {
      body,
      tag: `message-${messageData.chatType}-${messageData.chatId}`,
      data: {
        type: 'message',
        chatType: messageData.chatType,
        chatId: messageData.chatId,
        url: messageData.chatType === 'event' ? `/events/${messageData.chatId}` : `/challenges`
      }
    });
  }

  // Initialize service worker for background notifications
  async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Handle notification clicks
  handleNotificationClick(notification: Notification): void {
    notification.close();
    
    if (notification.data?.url) {
      window.open(notification.data.url, '_blank');
    }
  }

  // Handle notification actions
  handleNotificationAction(action: string, notification: Notification): void {
    switch (action) {
      case 'accept':
        if (notification.data?.type === 'challenge') {
          // Handle challenge acceptance
          window.postMessage({
            type: 'ACCEPT_CHALLENGE',
            challengeId: notification.data.challengeId
          }, '*');
        }
        break;
      case 'decline':
        if (notification.data?.type === 'challenge') {
          // Handle challenge decline
          window.postMessage({
            type: 'DECLINE_CHALLENGE',
            challengeId: notification.data.challengeId
          }, '*');
        }
        break;
      case 'view':
        if (notification.data?.url) {
          window.open(notification.data.url, '_blank');
        }
        break;
    }
    
    notification.close();
  }
}

export const notificationService = NotificationService.getInstance();