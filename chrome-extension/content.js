// Bantah Chrome Extension - Content Script
class BetChatContent {
    constructor() {
        this.baseUrl = 'https://0346a8ac-73d3-49de-a366-7a5643581671-00-48nx3a4w1adm.worf.replit.dev';
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.setupPageAnalysis();
        this.setupOverlaySystem();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });
    }

    setupPageAnalysis() {
        // Analyze page for betting opportunities
        if (this.isNewsPage()) {
            this.addBetChatOverlay();
        }
    }

    setupOverlaySystem() {
        // Create floating action button for quick access
        this.createFloatingButton();
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'getPageData':
                sendResponse({
                    title: document.title,
                    url: window.location.href,
                    content: this.extractPageContent(),
                    metadata: this.extractMetadata()
                });
                break;
                
            case 'createEventFromPage':
                this.showEventCreationDialog();
                sendResponse({success: true});
                break;
                
            case 'showOverlay':
                this.showBetChatOverlay();
                sendResponse({success: true});
                break;
                
            default:
                sendResponse({success: false, error: 'Unknown action'});
        }
    }

    isNewsPage() {
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
        
        return supportedSites.some(site => window.location.href.includes(site));
    }

    extractPageContent() {
        // Extract meaningful content from the page
        const content = {};
        
        // Try to get main content
        const mainContent = document.querySelector('main') || 
                           document.querySelector('article') || 
                           document.querySelector('.content') ||
                           document.querySelector('#content');
        
        if (mainContent) {
            content.text = mainContent.innerText.slice(0, 500);
        }
        
        // Extract headlines
        const headlines = Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(h => h.innerText.trim())
            .filter(text => text.length > 0)
            .slice(0, 5);
        
        content.headlines = headlines;
        
        return content;
    }

    extractMetadata() {
        const metadata = {};
        
        // Extract meta tags
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(tag => {
            const property = tag.getAttribute('property') || tag.getAttribute('name');
            const content = tag.getAttribute('content');
            
            if (property && content) {
                metadata[property] = content;
            }
        });
        
        return metadata;
    }

    createFloatingButton() {
        // Only create on supported sites
        if (!this.isNewsPage()) return;
        
        const button = document.createElement('div');
        button.id = 'betchat-floating-button';
        button.innerHTML = `
            <div class="betchat-fab">
                <span class="betchat-fab-icon">🎯</span>
                <span class="betchat-fab-text">BetChat</span>
            </div>
        `;
        
        button.addEventListener('click', () => {
            this.showBetChatOverlay();
        });
        
        document.body.appendChild(button);
    }

    showBetChatOverlay() {
        // Remove existing overlay
        const existingOverlay = document.getElementById('betchat-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create new overlay
        const overlay = document.createElement('div');
        overlay.id = 'betchat-overlay';
        overlay.innerHTML = `
            <div class="betchat-overlay-content">
                <div class="betchat-overlay-header">
                    <h3>🎯 BetChat - Create Event</h3>
                    <button id="betchat-close-overlay">×</button>
                </div>
                <div class="betchat-overlay-body">
                    <div class="betchat-page-info">
                        <h4>Current Page:</h4>
                        <p class="betchat-page-title">${document.title}</p>
                        <p class="betchat-page-url">${window.location.href}</p>
                    </div>
                    <div class="betchat-event-form">
                        <h4>Create Prediction Event:</h4>
                        <input type="text" id="betchat-event-title" placeholder="Event title..." value="${document.title}">
                        <textarea id="betchat-event-description" placeholder="Event description..."></textarea>
                        <div class="betchat-event-options">
                            <label>
                                <input type="radio" name="category" value="news" checked> News
                            </label>
                            <label>
                                <input type="radio" name="category" value="sports"> Sports
                            </label>
                            <label>
                                <input type="radio" name="category" value="crypto"> Crypto
                            </label>
                            <label>
                                <input type="radio" name="category" value="tech"> Tech
                            </label>
                        </div>
                        <div class="betchat-event-actions">
                            <button id="betchat-create-event">Create Event</button>
                            <button id="betchat-share-telegram">Share to Telegram</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Setup overlay event listeners
        this.setupOverlayListeners();
    }

    setupOverlayListeners() {
        // Close overlay
        document.getElementById('betchat-close-overlay')?.addEventListener('click', () => {
            document.getElementById('betchat-overlay')?.remove();
        });
        
        // Create event
        document.getElementById('betchat-create-event')?.addEventListener('click', () => {
            this.createEventFromForm();
        });
        
        // Share to Telegram
        document.getElementById('betchat-share-telegram')?.addEventListener('click', () => {
            this.shareToTelegram();
        });
        
        // Close on background click
        document.getElementById('betchat-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'betchat-overlay') {
                document.getElementById('betchat-overlay')?.remove();
            }
        });
    }

    createEventFromForm() {
        const title = document.getElementById('betchat-event-title')?.value;
        const description = document.getElementById('betchat-event-description')?.value;
        const category = document.querySelector('input[name="category"]:checked')?.value;
        
        if (!title) {
            alert('Please enter an event title');
            return;
        }
        
        // Open BetChat with pre-filled data
        const params = new URLSearchParams({
            title: title,
            description: description || '',
            category: category || 'news',
            url: window.location.href
        });
        
        const eventUrl = `${this.baseUrl}/events/create?${params.toString()}`;
        window.open(eventUrl, '_blank');
        
        // Close overlay
        document.getElementById('betchat-overlay')?.remove();
    }

    shareToTelegram() {
        const title = document.getElementById('betchat-event-title')?.value || document.title;
        const text = `Check out this interesting topic: ${title}\n\n${window.location.href}\n\nShared via BetChat Extension`;
        
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
        window.open(telegramUrl, '_blank');
        
        // Close overlay
        document.getElementById('betchat-overlay')?.remove();
    }

    addBetChatOverlay() {
        // Add subtle indicator that BetChat is available
        const indicator = document.createElement('div');
        indicator.id = 'betchat-page-indicator';
        indicator.innerHTML = `
            <div class="betchat-indicator">
                <span>🎯</span>
                <span>BetChat available</span>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.remove();
            }, 500);
        }, 5000);
    }
}

// Initialize content script
new BetChatContent();