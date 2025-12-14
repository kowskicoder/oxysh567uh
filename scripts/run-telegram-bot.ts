#!/usr/bin/env tsx
import 'dotenv/config';
import { createTelegramBot } from '../server/telegramBot';

async function main() {
  const bot = createTelegramBot();
  if (!bot) {
    console.error('Telegram bot not configured (missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID)');
    process.exit(1);
  }

  try {
    console.log('Starting Telegram bot polling...');
    await bot.startPolling();
    console.log('Telegram bot polling started.');
  } catch (err) {
    console.error('Failed to start Telegram bot polling:', err);
    process.exit(1);
  }
}

main();
