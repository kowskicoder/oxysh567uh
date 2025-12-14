
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import Pusher from "pusher";
import { storage } from "./storage";

interface TelegramConfig {
  apiId: number;
  apiHash: string;
  stringSession: string;
  groupId?: string;
  botMode?: boolean;
}

export class TelegramSyncService {
  private client: TelegramClient;
  private pusher: Pusher;
  private groupId: string | null = null;
  private isConnected = false;

  constructor(config: TelegramConfig, pusher: Pusher) {
    this.pusher = pusher;
    
    const stringSession = new StringSession(config.stringSession);
    this.client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
      connectionRetries: 5,
    });

    if (config.groupId) {
      this.groupId = config.groupId;
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing Telegram client...");
      
      await this.client.start({
        phoneNumber: async () => {
          throw new Error("Phone number should be pre-authenticated via session string");
        },
        password: async () => {
          throw new Error("Password should be pre-authenticated via session string");
        },
        phoneCode: async () => {
          throw new Error("Phone code should be pre-authenticated via session string");
        },
        onError: (err) => console.error("Telegram auth error:", err),
      });

      console.log("✅ Telegram client connected successfully");
      console.log("📱 Session string:", this.client.session.save());
      
      this.isConnected = true;
      
      // Find the target group if groupId not set
      if (!this.groupId) {
        await this.findTargetGroup();
      }

      // Set up message listeners
      this.setupMessageListeners();
      
    } catch (error) {
      console.error("❌ Failed to initialize Telegram client:", error);
      
      // Handle specific errors gracefully
      if (error.message && error.message.includes('AUTH_KEY_DUPLICATED')) {
        console.log("⚠️ Telegram session is being used by another instance. Telegram sync disabled.");
        console.log("💡 To fix this, generate a new session string or stop other instances using the same session.");
      } else if (error.message && error.message.includes('AUTH_KEY_INVALID')) {
        console.log("⚠️ Telegram session is invalid. Please re-authenticate.");
        console.log("💡 Generate a new session string using the authentication script.");
      }
      
      // Don't throw the error - let the service continue without Telegram sync
      this.isConnected = false;
    }
  }

  private async findTargetGroup(): Promise<void> {
    try {
      const dialogs = await this.client.getDialogs({});
      
      console.log("📋 Available chats:");
      for (const dialog of dialogs) {
        if (dialog.isGroup || dialog.isChannel) {
          console.log(`  - ${dialog.title} (ID: ${dialog.id})`);
        }
      }
      
      // You can set a specific group name to auto-find
      const targetGroupName = process.env.TELEGRAM_GROUP_NAME || "Bantah";
      const targetGroup = dialogs.find(d => 
        (d.isGroup || d.isChannel) && 
        d.title?.toLowerCase().includes(targetGroupName.toLowerCase())
      );
      
      if (targetGroup) {
        this.groupId = targetGroup.id.toString();
        console.log(`🎯 Found target group: ${targetGroup.title} (${this.groupId})`);
      } else {
        console.log("⚠️ Target group not found. Please set TELEGRAM_GROUP_ID manually.");
      }
    } catch (error) {
      console.error("Error finding target group:", error);
    }
  }

  private setupMessageListeners(): void {
    if (!this.groupId) {
      console.log("⚠️ No group ID set, skipping message listeners");
      return;
    }

    console.log(`👂 Setting up message listeners for group: ${this.groupId}`);
    
    // Listen for new messages in the target group
    this.client.addEventHandler(async (update) => {
      try {
        await this.handleTelegramMessage(update);
      } catch (error) {
        console.error("Error handling Telegram message:", error);
      }
    }, new NewMessage({ chats: [parseInt(this.groupId)] }));

    console.log("✅ Telegram message listeners active");
  }

  private async handleTelegramMessage(update: any): Promise<void> {
    const message = update.message;
    if (!message || !message.message) return;

    const senderId = message.senderId?.toString();
    const senderName = await this.getSenderName(message);
    const messageText = message.message;
    const timestamp = new Date(message.date * 1000).toISOString();

    console.log(`📨 Telegram → BetChat: ${senderName}: ${messageText}`);

    // Check if message is for a specific event (hashtag format: #event123)
    const eventMatch = messageText.match(/#event(\d+)/);
    
    if (eventMatch) {
      // Route to specific event chat
      const eventId = parseInt(eventMatch[1]);
      
      try {
        // Create or find telegram user in database
        const telegramUser = await this.getOrCreateTelegramUser(senderId, senderName);
        
        // Create message in event chat
        const newMessage = await storage.createEventMessage(eventId, telegramUser.id, messageText, null, []);

        // Get message with user info for real-time broadcast
        const messageWithUser = {
          ...newMessage,
          user: telegramUser,
          source: 'telegram'
        };

        // Broadcast to event participants via Pusher
        await this.pusher.trigger(`event-${eventId}`, 'new-message', {
          message: messageWithUser,
          eventId: eventId,
          userId: telegramUser.id,
          source: 'telegram'
        });

        console.log(`✅ Telegram message synced to Event ${eventId}`);
        
      } catch (error) {
        console.error(`❌ Failed to sync message to event ${eventId}:`, error);
      }
      
    } else {
      // Check if message contains event title for smart routing
      const eventId = await this.findEventByTitle(messageText);
      if (eventId) {
        try {
          const telegramUser = await this.getOrCreateTelegramUser(senderId, senderName);
          const newMessage = await storage.createEventMessage(eventId, telegramUser.id, messageText, null, []);
          
          const messageWithUser = {
            ...newMessage,
            user: telegramUser,
            source: 'telegram'
          };

          await this.pusher.trigger(`event-${eventId}`, 'new-message', {
            message: messageWithUser,
            eventId: eventId,
            userId: telegramUser.id,
            source: 'telegram'
          });

          console.log(`✅ Telegram message auto-routed to Event ${eventId} based on title`);
        } catch (error) {
          console.error(`❌ Failed to auto-route message to event ${eventId}:`, error);
        }
      }
    }
  }

  private async getOrCreateTelegramUser(telegramId: string, senderName: string): Promise<any> {
    const telegramUserId = `telegram_${telegramId}`;
    
    try {
      // Check if user already exists
      let user = await storage.getUser(telegramUserId);
      
      if (!user) {
        // Create new telegram user
        user = await storage.createUser({
          id: telegramUserId,
          firstName: senderName,
          username: senderName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          email: `${telegramUserId}@telegram.betchat.local`,
          profileImageUrl: null,
          isTelegramUser: true,
          telegramId: telegramId,
          coins: 0,
          points: 0,
          level: 1,
          xp: 0
        });
        
        console.log(`✅ Created new Telegram user: ${senderName} (${telegramUserId})`);
      }
      
      return user;
    } catch (error) {
      console.error(`❌ Error getting/creating Telegram user:`, error);
      throw error;
    }
  }

  private async findEventByTitle(messageText: string): Promise<number | null> {
    try {
      // Extract potential event titles from message
      const words = messageText.split(' ').filter(word => word.length > 3);
      
      for (const word of words) {
        const events = await storage.searchEventsByTitle(word);
        if (events.length > 0) {
          // Return the most recent active event
          const activeEvent = events.find(e => e.status === 'active');
          if (activeEvent) {
            return activeEvent.id;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding event by title:', error);
      return null;
    }
  }

  private async getSenderName(message: any): Promise<string> {
    try {
      if (message.fromId) {
        const user = await this.client.getEntity(message.fromId);
        if (user.firstName) {
          return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
        }
        if (user.username) {
          return `@${user.username}`;
        }
      }
      return "Telegram User";
    } catch (error) {
      console.error("Error getting sender name:", error);
      return "Telegram User";
    }
  }

  async sendMessageToTelegram(message: string, senderName: string, eventInfo?: { id: number; title: string }): Promise<boolean> {
    if (!this.isConnected || !this.groupId) {
      console.log("⚠️ Cannot send to Telegram: not connected or no group ID");
      return false;
    }

    try {
      let formattedMessage: string;
      
      if (eventInfo) {
        // Format with event context and hashtag for routing back
        const timestamp = new Date().toLocaleTimeString();
        formattedMessage = `🎯 [${eventInfo.title}]\n👤 ${senderName}: ${message}\n⏰ ${timestamp}\n\n#event${eventInfo.id}`;
      } else {
        // Default global chat format
        formattedMessage = `🌐 [BetChat Global] ${senderName}: ${message}`;
      }
      
      await this.client.sendMessage(parseInt(this.groupId), {
        message: formattedMessage,
      });

      console.log(`📤 BetChat → Telegram: ${senderName}: ${message}${eventInfo ? ` [Event: ${eventInfo.title}]` : ''}`);
      return true;
    } catch (error) {
      console.error("Error sending message to Telegram:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log("🔌 Telegram client disconnected");
    }
  }

  // Utility methods
  async getGroupInfo(): Promise<any> {
    if (!this.groupId) return null;
    
    try {
      const entity = await this.client.getEntity(parseInt(this.groupId));
      return {
        id: entity.id,
        title: entity.title,
        participantsCount: entity.participantsCount,
        username: entity.username,
      };
    } catch (error) {
      console.error("Error getting group info:", error);
      return null;
    }
  }

  isReady(): boolean {
    return this.isConnected && !!this.groupId;
  }
}

// Singleton instance
let telegramSync: TelegramSyncService | null = null;

export function createTelegramSync(pusher: Pusher): TelegramSyncService | null {
  // Check if Telegram sync is explicitly disabled
  if (process.env.TELEGRAM_DISABLED === 'true') {
    console.log("📱 Telegram sync explicitly disabled via TELEGRAM_DISABLED environment variable");
    return null;
  }

  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const stringSession = process.env.TELEGRAM_SESSION_STRING;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!apiId || !apiHash) {
    console.log("⚠️ Telegram API credentials not found. Telegram sync disabled.");
    console.log("💡 To enable Telegram sync, set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables");
    console.log("📖 See TELEGRAM_SETUP_GUIDE.md for detailed setup instructions");
    return null;
  }

  if (!stringSession || stringSession.trim() === '' || stringSession === 'your_session_string_here') {
    console.log("⚠️ Telegram session string not found or empty. Please authenticate first.");
    console.log("💡 Generate a session string using the script in TELEGRAM_SETUP_GUIDE.md");
    console.log("🔧 Or set TELEGRAM_DISABLED=true to disable Telegram sync");
    return null;
  }

  // Validate session string format (basic check)
  if (stringSession.length < 50) {
    console.log("⚠️ Telegram session string appears to be invalid (too short). Please re-authenticate.");
    console.log("📖 See TELEGRAM_SETUP_GUIDE.md for session string generation instructions");
    return null;
  }

  if (telegramSync) {
    return telegramSync;
  }

  try {
    telegramSync = new TelegramSyncService({
      apiId: parseInt(apiId),
      apiHash,
      stringSession,
      groupId,
    }, pusher);

    return telegramSync;
  } catch (error) {
    console.error("❌ Failed to create Telegram sync service:", error);
    console.log("⚠️ Telegram sync disabled due to configuration error. Please check your session string.");
    console.log("📖 See TELEGRAM_SETUP_GUIDE.md for troubleshooting steps");
    console.log("🔧 Or set TELEGRAM_DISABLED=true to disable Telegram sync");
    return null;
  }
}

export function getTelegramSync(): TelegramSyncService | null {
  return telegramSync;
}
