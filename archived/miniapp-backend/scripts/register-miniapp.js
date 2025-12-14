import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || '').replace(/\/$/, '');
// Optional separate mini-app origin (recommended for isolated Telegram auth)
const MINIAPP_URL = (process.env.MINIAPP_URL || '').replace(/\/$/, '');

function usage() {
  console.log('Usage: node scripts/register-miniapp.js [--dry-run] [--chat-id <chatId>]');
  process.exit(1);
}

const args = process.argv.slice(2);
let dryRun = false;
let chatId = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run') dryRun = true;
  else if (a === '--chat-id') {
    chatId = args[i + 1];
    i++;
  } else {
    usage();
  }
}

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in environment (.env.local)');
  process.exit(1);
}

if (!FRONTEND_URL) {
  console.warn('FRONTEND_URL not set. The menu will be configured but null URL may be invalid.');
}

const apiBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function setChatMenuButton(url) {
  const endpoint = `${apiBase}/setChatMenuButton`;
  const body = {
    menu_button: {
      type: 'web_app',
      text: 'Open Bantah Mini-App',
      web_app: { url },
    },
  };

  if (dryRun) {
    console.log('[dry-run] Would POST', endpoint);
    console.log('[dry-run] Body:', JSON.stringify(body, null, 2));
    return { ok: true, dryRun: true };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json();
}

async function sendTestMessage(chatId, url) {
  const endpoint = `${apiBase}/sendMessage`;
  const replyMarkup = {
    inline_keyboard: [
      [{ text: 'Open Mini-App', web_app: { url } }]
    ]
  };

  if (dryRun) {
    console.log('[dry-run] Would POST', endpoint);
    console.log('[dry-run] Body:', JSON.stringify({ chat_id: chatId, text: 'Test Mini-App', reply_markup: replyMarkup }, null, 2));
    return { ok: true, dryRun: true };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: 'Open Bantah Mini-App (test)', reply_markup: replyMarkup }),
  });

  return res.json();
}

(async function main() {
  try {
    // Prefer a dedicated MINIAPP_URL if provided (serves from its own origin).
    const url = MINIAPP_URL || (FRONTEND_URL ? `${FRONTEND_URL}/telegram-mini-app` : 'https://example.com/telegram-mini-app');

    console.log('Config:');
    console.log('  TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'present' : 'missing');
    console.log('  FRONTEND_URL:', FRONTEND_URL || '(not set)');
    console.log('  dryRun:', dryRun);
    console.log('  chatId:', chatId || '(none)');

    const menuResp = await setChatMenuButton(url);
    console.log('setChatMenuButton response:', menuResp);

    if (chatId) {
      const testResp = await sendTestMessage(chatId, url);
      console.log('sendMessage response:', testResp);
    }

    console.log('Done. If responses show ok=true, the bot was updated successfully.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
