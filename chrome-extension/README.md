# Bantah Companion — Chrome Extension

This is a minimal Chrome extension scaffold that provides quick access to the Bantah web app from the browser toolbar.

Installation (developer mode)

1. Build your frontend (if serving from a dev server, note the URL).
2. Open `chrome://extensions` in Chrome.
3. Enable Developer Mode.
4. Click "Load unpacked" and select the `chrome-extension` folder in this repo.

Usage

- The popup has quick actions (Open Bantah, Events, Create Event).
- Configure the site `Site URL` if you host the frontend on a custom domain or a local dev server.

Notes

- This scaffold opens the web app in new tabs instead of embedding it (iframes may be blocked by site headers).
- To ship a production extension, add icons (16/48/128) and review the `manifest.json` host permissions.
# BetChat Chrome Extension

A Chrome extension that provides quick access to BetChat's social betting platform with real-time notifications, event creation from web pages, and Telegram integration.

## Features

### 🎯 Core Features
- **Quick Access**: Popup interface with balance, notifications, and quick actions
- **Real-time Notifications**: Browser notifications for new activities 
- **Event Creation**: Create prediction events from any webpage
- **Telegram Integration**: Share content to Telegram groups
- **Page Detection**: Automatically detect betting-relevant pages

### 🌐 Supported Websites
- News sites (CNN, BBC, Bloomberg, TechCrunch)
- Social platforms (Reddit, Twitter/X, Hacker News)
- Crypto news (CoinDesk)
- Sports (ESPN)

## Installation

### For Development
1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder

### For Production
1. Package the extension: `zip -r betchat-extension.zip chrome-extension/`
2. Upload to Chrome Web Store

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── content.js             # Content script for web pages
├── content.css            # Content script styling
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Usage

### Popup Interface
- Click the extension icon to open the popup
- View balance, coins, and recent notifications
- Quick actions for creating events and viewing challenges
- Access settings and main BetChat app

### Page Actions
- On supported sites, the extension shows a floating action button
- Click to create events from current page content
- Share interesting content to Telegram groups
- Auto-detection of betting-relevant content

### Notifications
- Real-time browser notifications for new activities
- Notification badge shows unread count
- Click notifications to open relevant BetChat pages

## Configuration

### Base URL
The extension connects to the BetChat app at:
```
https://0346a8ac-73d3-49de-a366-7a5643581671-00-48nx3a4w1adm.worf.replit.dev
```

### Permissions
- `activeTab`: Access current tab information
- `notifications`: Show desktop notifications
- `storage`: Store user preferences
- `background`: Background sync and notifications
- `tabs`: Open new tabs and manage navigation

## Development

### Testing
1. Load the extension in Chrome
2. Navigate to a supported website
3. Test the floating action button and overlay
4. Check popup functionality
5. Verify notifications work

### Debugging
- Use Chrome DevTools for popup and content scripts
- Check background script logs in `chrome://extensions/`
- Monitor network requests to BetChat API

## API Integration

### Authentication
- Uses session-based authentication with BetChat
- Redirects to login page if not authenticated

### Endpoints Used
- `GET /api/auth/user` - Check authentication status
- `GET /api/wallet/balance` - Get user balance
- `GET /api/notifications` - Fetch notifications
- `POST /api/events` - Create new events
- `PATCH /api/notifications/:id/read` - Mark notifications as read

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium browsers with Manifest V3 support

## Security

- Uses HTTPS only for API communication
- Respects CORS policies
- Minimal permissions requested
- Content Security Policy compliant

## Troubleshooting

### Common Issues
1. **Extension not loading**: Check Chrome version and enable Developer mode
2. **API errors**: Verify BetChat server is running and accessible
3. **Notifications not working**: Check browser notification permissions
4. **Content script not working**: Verify the website is in supported sites list

### Error Messages
- "Unauthorized": User needs to log in to BetChat
- "Network error": Check internet connection and server status
- "Permission denied": Grant required browser permissions

## Future Enhancements

### Planned Features
- Offline mode with local storage
- More supported websites
- Advanced notification filtering
- Dark mode support
- Multi-language support
- Analytics dashboard

### Integration Ideas
- WhatsApp sharing
- Discord integration
- Mobile companion app
- Desktop notifications
- Keyboard shortcuts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This Chrome extension is part of the BetChat platform and follows the same license terms.