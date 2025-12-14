# Telegram Chat Integration Setup Guide

## Overview
This guide explains how to set up Telegram integration for BetChat, allowing real-time synchronization between event chat rooms and a single Telegram group.

## Current Challenge
The system currently fails because the Telegram session string is not properly configured. The error indicates that the session string is either missing, empty, or invalid.

## Setup Steps

### 1. Get Telegram API Credentials

1. Go to https://my.telegram.org/auth
2. Log in with your phone number
3. Go to "API Development Tools"
4. Create a new application:
   - App title: "BetChat"
   - Short name: "betchat"
   - Platform: "Web"
   - Description: "BetChat social betting platform"
5. Note down your `api_id` and `api_hash`

### 2. Generate Session String

You need to generate a session string for your Telegram account. Here's how:

```javascript
// Run this script in a Node.js environment
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = YOUR_API_ID; // Replace with your API ID
const apiHash = "YOUR_API_HASH"; // Replace with your API hash

const stringSession = new StringSession("");

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () => await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  console.log("Session string:", client.session.save());
  await client.sendMessage("me", { message: "BetChat session created!" });
})();
```

### 3. Set Environment Variables

Add these to your environment:

```bash
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_session_string
TELEGRAM_GROUP_ID=your_group_chat_id (optional)
```

### 4. Find Your Group ID

If you don't know your group ID, the system will automatically list available chats when it starts. Look for your group in the logs.

## Multi-Event Chat Room Solution

Since you have multiple event chat rooms but only one Telegram group, here's how we differentiate them:

### 1. Message Formatting
Each message from BetChat to Telegram includes:
- Event identifier (title/ID)
- User information
- Message content
- Timestamp

Example format:
```
🎯 [Event: FIFA World Cup] 
👤 @username: "I think Brazil will win!"
⏰ 2:30 PM
```

### 2. Message Filtering
Messages from Telegram back to BetChat can be filtered by:
- Hashtags: `#event123` 
- Keywords: Event names mentioned
- User mentions: `@event_fifa`

### 3. Smart Routing
The system automatically routes messages based on:
- Active event contexts
- User participation in events
- Message content analysis

## Current Implementation Features

### ✅ What Works
- Real-time message synchronization
- User identification and mapping
- Automatic group discovery
- Error handling and reconnection

### ❌ What Needs Setup
- Valid Telegram session string
- Proper environment variables
- Target group configuration

## Troubleshooting

### Error: "Not a valid string"
**Solution:** Your session string is empty or invalid. Generate a new one following Step 2.

### Error: "Telegram sync disabled"
**Solution:** Check that all environment variables are set correctly.

### Error: "Failed to connect"
**Solution:** 
1. Verify your API credentials
2. Check your internet connection
3. Ensure the session string is not expired

## Quick Fix for Current Issue

To immediately fix the current error, you can either:

1. **Option A: Provide Valid Credentials**
   - Set up proper Telegram API credentials
   - Generate a valid session string
   - Configure environment variables

2. **Option B: Disable Telegram Sync**
   - Set `TELEGRAM_DISABLED=true` in environment
   - The system will continue working without Telegram integration

## Multi-Room Strategy

For handling multiple event rooms in one Telegram group:

```javascript
// Message format example
const formatMessage = (eventId, eventTitle, username, message) => {
  return `🎯 [${eventTitle}]\n👤 ${username}: ${message}\n⏰ ${new Date().toLocaleTimeString()}`;
};

// Route messages back to specific events
const routeIncomingMessage = (telegramMessage) => {
  const eventMatch = telegramMessage.match(/🎯 \[(.*?)\]/);
  if (eventMatch) {
    const eventTitle = eventMatch[1];
    // Route to specific event chat room
  }
};
```

This approach allows one Telegram group to handle multiple event chat rooms while maintaining clear separation and context.