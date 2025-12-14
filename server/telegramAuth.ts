
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";

// This script helps you get the session string for the first time
async function authenticateTelegram() {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId || !apiHash) {
    console.log("❌ Please set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables");
    process.exit(1);
  }

  console.log("🔐 Starting Telegram authentication...");
  console.log("📱 This will help you get the session string for your Telegram account");

  const stringSession = new StringSession("");
  const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => await input.text("📞 Enter your phone number (with country code): "),
      password: async () => await input.text("🔑 Enter your 2FA password: "),
      phoneCode: async () => await input.text("📨 Enter the verification code from Telegram: "),
      onError: (err) => console.log("❌ Error:", err),
    });

    console.log("✅ Authentication successful!");
    console.log("💾 Your session string (save this to TELEGRAM_SESSION_STRING):");
    console.log("=" .repeat(80));
    console.log(client.session.save());
    console.log("=" .repeat(80));
    
    // List available groups
    console.log("\n📋 Available groups and channels:");
    const dialogs = await client.getDialogs({});
    
    for (const dialog of dialogs) {
      if (dialog.isGroup || dialog.isChannel) {
        console.log(`  - ${dialog.title} (ID: ${dialog.id})`);
      }
    }
    
    console.log("\n🎯 Copy the ID of your target group and set it as TELEGRAM_GROUP_ID");
    
    await client.disconnect();
  } catch (error) {
    console.error("❌ Authentication failed:", error);
  }
}

// Export the function for use in the authentication script
export { authenticateTelegram };
