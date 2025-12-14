const DEFAULT_BASE = 'https://betchatapp.geminigroq.repl.co';

async function getBase() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(['bantah_base'], (res) => {
        resolve(res.bantah_base || DEFAULT_BASE);
      });
    } catch (e) {
      resolve(DEFAULT_BASE);
    }
  });
}

async function saveBase(url) {
  try {
    chrome.storage.sync.set({ bantah_base: url });
  } catch (e) {}
}

function openUrl(path = '/') {
  getBase().then((base) => {
    const url = new URL(path, base as string).toString();
    chrome.tabs.create({ url });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const baseInput = document.getElementById('baseUrl');
  const saveBtn = document.getElementById('save-url');
  const openRoot = document.getElementById('open-root');
  const openEvents = document.getElementById('open-events');
  const openCreate = document.getElementById('open-create');
  const openChats = document.getElementById('open-chats');
  const openTab = document.getElementById('open-tab');

  const base = await getBase();
  if (baseInput) (baseInput as HTMLInputElement).value = base as string;

  saveBtn?.addEventListener('click', () => {
    const v = (baseInput as HTMLInputElement).value || DEFAULT_BASE;
    saveBase(v);
    window.close();
  });

  openRoot?.addEventListener('click', () => openUrl('/'));
  openEvents?.addEventListener('click', () => openUrl('/events'));
  openCreate?.addEventListener('click', () => openUrl('/events/create'));
  openChats?.addEventListener('click', () => openUrl('/events'));
  openTab?.addEventListener('click', () => getBase().then((b) => chrome.tabs.create({ url: b as string })));
});
// Bantah Chrome Extension - Popup Script
class BantahExtension {
    constructor() {
        this.baseUrl = 'https://0346a8ac-73d3-49de-a366-7a5643581671-00-48nx3a4w1adm.worf.replit.dev';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuthStatus();
        this.loadUserData();
        this.setupPeriodicUpdates();
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.openBantah();
        });

        // Quick actions
        document.getElementById('createEventBtn')?.addEventListener('click', () => {
            this.openBantah('/events/create');
        });

        document.getElementById('viewEventsBtn')?.addEventListener('click', () => {
            this.openBantah('/events');
        });

        document.getElementById('challengeBtn')?.addEventListener('click', () => {
            this.openBantah('/challenges');
        });

        // Page actions
        document.getElementById('createEventFromPageBtn')?.addEventListener('click', () => {
            this.createEventFromCurrentPage();
        });

        document.getElementById('sharePageBtn')?.addEventListener('click', () => {
            this.sharePageToTelegram();
        });

        // Footer actions
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openBantah('/settings');
        });

        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.openBetChat('/help');
        });

        document.getElementById('openWebBtn')?.addEventListener('click', () => {
            this.openBetChat();
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshData();
        });
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
                this.showMainContent(user);
            } else {
                this.showAuthSection();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthSection();
        }
    }

    async loadUserData() {
        try {
            const [balance, notifications] = await Promise.all([
                this.fetchBalance(),
                this.fetchNotifications()
            ]);
            
            this.updateBalance(balance);
            this.updateNotifications(notifications);
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    async fetchBalance() {
        try {
            const response = await fetch(`${this.baseUrl}/api/wallet/balance`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
        return { balance: 0, coins: 0 };
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

    showAuthSection() {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    }

    showMainContent(user) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // Show page actions for supported sites
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            if (this.isSupported(currentTab.url)) {
                document.getElementById('pageActions').style.display = 'block';
            }
        });
    }

    updateBalance(balance) {
        document.getElementById('balanceAmount').textContent = `₦${balance.balance || 0}`;
        document.getElementById('coinsAmount').textContent = `${balance.coins || 0}`;
    }

    updateNotifications(notifications) {
        const notificationsList = document.getElementById('notificationsList');
        const badge = document.getElementById('notificationBadge');
        
        // Update badge
        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.add('new-notifications');
        } else {
            badge.style.display = 'none';
        }

        // Update notifications list
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<div class="no-notifications"><p>No new notifications</p></div>';
            return;
        }

        const notificationsHtml = notifications.slice(0, 10).map(notification => {
            const timeAgo = this.formatTimeAgo(new Date(notification.createdAt));
            return `
                <div class="notification-item" data-id="${notification.id}">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            `;
        }).join('');

        notificationsList.innerHTML = notificationsHtml;

        // Add click handlers for notifications
        notificationsList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.dataset.id;
                this.handleNotificationClick(notificationId);
            });
        });
    }

    async handleNotificationClick(notificationId) {
        try {
            // Mark notification as read
            await fetch(`${this.baseUrl}/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });

            // Refresh notifications
            this.refreshData();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async createEventFromCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const title = tab.title;
            const url = tab.url;
            
            // Open Bantah event creation with pre-filled data
            const eventUrl = `${this.baseUrl}/events/create?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
            chrome.tabs.create({url: eventUrl});
        } catch (error) {
            console.error('Failed to create event from page:', error);
        }
    }

    async sharePageToTelegram() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const title = tab.title;
            const url = tab.url;
            
            const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Check out this page: ${title}\n\nShared via Bantah Extension`)}`;
            chrome.tabs.create({url: telegramUrl});
        } catch (error) {
            console.error('Failed to share to Telegram:', error);
        }
    }

    openBantah(path = '') {
        const url = `${this.baseUrl}${path}`;
        chrome.tabs.create({url: url});
    }

    isSupported(url) {
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
        
        return supportedSites.some(site => url.includes(site));
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    setupPeriodicUpdates() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    async refreshData() {
        await this.loadUserData();
    }
}

// Initialize the extension when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BetChatExtension();
});