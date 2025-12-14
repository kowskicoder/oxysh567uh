// Bantah Chrome Extension - Background Script
class BetChatBackground {
    constructor() {
        this.baseUrl = 'https://0346a8ac-73d3-49de-a366-7a5643581671-00-48nx3a4w1adm.worf.replit.dev';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPeriodicSync();
        this.setupNotificationHandler();
    }

    setupEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener(() => {
            console.log('BetChat extension installed');
            this.setInitialState();
        });

        // Handle messages from content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });

        // Handle tab updates to show page actions
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.checkPageSupport(tab);
            }
        });

        // Handle notifications from the web app
        chrome.notifications.onClicked.addListener((notificationId) => {
            this.handleNotificationClick(notificationId);
        });
    }

    async setInitialState() {
        try {
            // Set default badge
            chrome.action.setBadgeText({text: ''});
            chrome.action.setBadgeBackgroundColor({color: '#ff4757'});
            
            // Check if user is logged in
            await this.checkAuthStatus();
        } catch (error) {
            console.error('Failed to set initial state:', error);
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/user`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.startPeriodicSync();
                return user;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
        return null;
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'checkAuth':
                    const user = await this.checkAuthStatus();
                    sendResponse({success: true, user});
                    break;
                    
                case 'fetchNotifications':
                    const notifications = await this.fetchNotifications();
                    sendResponse({success: true, notifications});
                    break;
                    
                case 'createEvent':
                    await this.createEventFromData(request.data);
                    sendResponse({success: true});
                    break;
                    
                case 'shareToTelegram':
                    await this.shareToTelegram(request.data);
                    sendResponse({success: true});
                    break;
                    
                default:
                    sendResponse({success: false, error: 'Unknown action'});
            }
        } catch (error) {
            console.error('Message handling error:', error);
            sendResponse({success: false, error: error.message});
        }
    }

    async fetchNotifications() {
        try {
            const response = await fetch(`${this.baseUrl}/api/notifications`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
        return [];
    }

    async updateBadge() {
        try {
            const notifications = await this.fetchNotifications();
            const unreadCount = notifications.filter(n => !n.read).length;
            
            if (unreadCount > 0) {
                chrome.action.setBadgeText({text: unreadCount.toString()});
                chrome.action.setBadgeBackgroundColor({color: '#ff4757'});
            } else {
                chrome.action.setBadgeText({text: ''});
            }
        } catch (error) {
            console.error('Failed to update badge:', error);
        }
    }

    setupPeriodicSync() {
        // Check for new notifications every 60 seconds
        setInterval(() => {
            this.syncNotifications();
        }, 60000);
    }

    startPeriodicSync() {
        this.syncNotifications();
        this.setupPeriodicSync();
    }

    async syncNotifications() {
        try {
            const notifications = await this.fetchNotifications();
            await this.updateBadge();
            
            // Show desktop notifications for new items
            const recentNotifications = notifications.filter(n => {
                const notificationTime = new Date(n.createdAt);
                const oneMinuteAgo = new Date(Date.now() - 60000);
                return notificationTime > oneMinuteAgo && !n.read;
            });
            
            recentNotifications.forEach(notification => {
                this.showDesktopNotification(notification);
            });
            
        } catch (error) {
            console.error('Failed to sync notifications:', error);
        }
    }

    showDesktopNotification(notification) {
        chrome.notifications.create(notification.id.toString(), {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: notification.title,
            message: notification.message,
            priority: 1
        });
    }

    handleNotificationClick(notificationId) {
        // Open BetChat when notification is clicked
        chrome.tabs.create({url: `${this.baseUrl}/notifications`});
        
        // Clear the notification
        chrome.notifications.clear(notificationId);
    }

    setupNotificationHandler() {
        // Handle permission requests
        chrome.permissions.onAdded.addListener((permissions) => {
            if (permissions.permissions.includes('notifications')) {
                console.log('Notifications permission granted');
            }
        });
    }

    checkPageSupport(tab) {
        const supportedSites = [
            'news.ycombinator.com',
            'reddit.com',
            'twitter.com',
            'x.com',
            'bloomberg.com',
            'cnn.com',
            'bbc.com',
            'techcrunch.com',
            'coindesk.com',
            'espn.com'
        ];
        
        const isSupported = supportedSites.some(site => tab.url.includes(site));
        
        if (isSupported) {
            chrome.action.setBadgeText({text: '●', tabId: tab.id});
            chrome.action.setBadgeBackgroundColor({color: '#48bb78', tabId: tab.id});
        }
    }

    async createEventFromData(data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/events`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const event = await response.json();
                console.log('Event created:', event);
                return event;
            }
        } catch (error) {
            console.error('Failed to create event:', error);
            throw error;
        }
    }

    async shareToTelegram(data) {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}`;
        chrome.tabs.create({url: telegramUrl});
    }
}

// Initialize the background script
new BetChatBackground();