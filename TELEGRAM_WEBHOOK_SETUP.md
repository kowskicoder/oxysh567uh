# Telegram Webhook Setup Guide

This guide explains how to set up the Telegram webhook for bidirectional message synchronization between Telegram groups and BetChat event chats.

## Overview

The Telegram webhook enables:
- Messages from Telegram groups to sync to BetChat event chats
- Automatic user creation for Telegram users
- Real-time message broadcasting via Pusher
- Event-specific message targeting using hashtags

## Implementation Status

✅ **Completed Features:**
- Webhook endpoint at `/api/telegram/webhook`
- Automatic Telegram user creation
- Message parsing and event targeting
- Real-time message broadcasting
- Database schema with Telegram user fields

## Setup Instructions

### 1. Database Schema
The following fields have been added to the users table:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_telegram_user boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;
```

### 2. Webhook Configuration
Set up the webhook URL with your Telegram bot:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://0346a8ac-73d3-49de-a366-7a5643581671-00-48nx3a4w1adm.worf.replit.dev/api/telegram/webhook",
    "allowed_updates": ["message"]
  }'
```

### 3. Environment Variables (Optional)
For additional security, set:
```bash
export TELEGRAM_WEBHOOK_TOKEN="your_secure_token_here"
```

Then use the webhook with token verification:
```
https://your-domain.com/api/telegram/webhook?token=your_secure_token_here
```

## Usage

### Message Format
To sync messages to specific events, use hashtag format:
```
#event123 This message will appear in Event 123 chat
```

### Example Messages
- `#event9 Great prediction! I think YES will win` → Syncs to Event 9
- `Regular message without hashtag` → Ignored (no sync)
- `Multiple events: #event1 #event2 text` → Syncs to Event 1 only

## API Endpoint Details

### POST /api/telegram/webhook

**Request Body:**
```json
{
  "message": {
    "message_id": 1,
    "from": {
      "id": 987654321,
      "username": "testuser",
      "first_name": "Test User"
    },
    "chat": {
      "id": -1001234567890,
      "title": "BetChat Group"
    },
    "text": "This is a test message for #event9"
  }
}
```

**Response:**
```json
{
  "ok": true
}
```

## Message Flow

1. **Telegram → Webhook:** User sends message in Telegram group
2. **Parsing:** Extract event ID from hashtag (#event123)
3. **User Creation:** Create/retrieve Telegram user in database
4. **Message Storage:** Store message in event_messages table
5. **Broadcasting:** Send real-time update via Pusher
6. **Frontend:** Message appears in BetChat event chat

## Testing

### Manual Testing
Use the provided test script:
```bash
node test-telegram-webhook.js
```

### Test Scenarios
- ✅ Valid message for existing event
- ✅ Message without event hashtag (ignored)
- ✅ Message for non-existent event (creates event entry)

## Security Considerations

### Authentication
- Optional webhook token verification
- HTTPS-only endpoint
- Request validation

### Rate Limiting
Consider implementing rate limiting for production:
```javascript
const rateLimit = require('express-rate-limit');
const webhookLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10 // limit each IP to 10 requests per windowMs
});
app.use('/api/telegram/webhook', webhookLimiter);
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages:**
   - Verify webhook URL is set correctly
   - Check HTTPS certificate is valid
   - Ensure server is accessible from internet

2. **Messages not appearing in chat:**
   - Verify event ID exists in database
   - Check Pusher configuration
   - Ensure event participants are subscribed

3. **User creation failing:**
   - Check database permissions
   - Verify schema is up to date
   - Check for duplicate ID conflicts

### Debug Logs
Enable debug logging:
```javascript
console.log(`📨 Telegram Bot → BetChat: ${username}: ${messageText}`);
```

## Production Deployment

### Webhook Security
1. Use HTTPS with valid SSL certificate
2. Implement webhook token verification
3. Add rate limiting
4. Monitor webhook health

### Monitoring
- Track webhook response times
- Monitor message sync success rates
- Alert on webhook failures

## Future Enhancements

### Planned Features
- Support for multiple event hashtags per message
- Message threading and replies
- Rich media support (images, videos)
- User authentication via Telegram Login
- Admin commands for group management

### Integration Ideas
- Telegram mini-app for BetChat
- Inline keyboard interactions
- Telegram payment integration
- Bot commands for quick actions

## API Reference

### Webhook Payload Structure
```typescript
interface TelegramWebhookPayload {
  update_id: number;
  message: {
    message_id: number;
    from: {
      id: number;
      username?: string;
      first_name: string;
    };
    chat: {
      id: number;
      title?: string;
      type: string;
    };
    date: number;
    text: string;
  };
}
```

### Database Schema
```sql
-- Users table with Telegram fields
CREATE TABLE users (
  id varchar PRIMARY KEY,
  email varchar NOT NULL,
  username varchar,
  first_name varchar,
  is_telegram_user boolean DEFAULT false,
  telegram_id varchar,
  telegram_username varchar,
  coins integer DEFAULT 0,
  -- ... other fields
);

-- Event messages table
CREATE TABLE event_messages (
  id serial PRIMARY KEY,
  event_id integer,
  user_id varchar,
  message text,
  created_at timestamp DEFAULT NOW(),
  -- ... other fields
);
```