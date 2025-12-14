
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

// Load environment variables
require('dotenv').config();

// This script helps you get the session string for the first time
async function authenticateTelegram() {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId || !apiHash) {
    console.log("❌ Please set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables");
    console.log("💡 You can get these from https://my.telegram.org/auth");
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
      phoneNumber: async () => await input.text("📞 Enter your phone number (with country code, e.g., +1234567890): "),
      password: async () => await input.text("🔑 Enter your 2FA password (if enabled): "),
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
    try {
      const dialogs = await client.getDialogs({});
      
      for (const dialog of dialogs) {
        if (dialog.isGroup || dialog.isChannel) {
          console.log(`  - ${dialog.title} (ID: ${dialog.id})`);
        }
      }
      
      console.log("\n🎯 Copy the ID of your target group and set it as TELEGRAM_GROUP_ID");
      console.log("📝 Next steps:");
      console.log("   1. Copy the session string above");
      console.log("   2. Add it to your Replit Secrets as TELEGRAM_SESSION_STRING");
      console.log("   3. Choose a group ID and add it as TELEGRAM_GROUP_ID (optional)");
      console.log("   4. Restart your application");
      
    } catch (error) {
      console.warn("⚠️ Could not list groups/channels:", error.message);
    }
    
    await client.disconnect();
    console.log("\n✅ Authentication completed successfully!");
    
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("   1. Make sure your API credentials are correct");
    console.log("   2. Check your internet connection");
    console.log("   3. Verify your phone number format includes country code");
    process.exit(1);
  }
}

// Run the authentication
authenticateTelegram().catch(console.error);
