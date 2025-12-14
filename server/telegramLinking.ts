
import { storage } from './storage';
import crypto from 'crypto';

interface TelegramLinkToken {
  token: string;
  telegramChatId: number;
  telegramUsername?: string;
  telegramFirstName: string;
  expiresAt: Date;
  used: boolean;
}

// In-memory store for link tokens (in production, use Redis or database)
const linkTokens = new Map<string, TelegramLinkToken>();

export class TelegramLinkingService {
  
  // Generate a secure link token
  static generateLinkToken(
    chatId: number, 
    username: string | undefined, 
    firstName: string
  ): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    linkTokens.set(token, {
      token,
      telegramChatId: chatId,
      telegramUsername: username,
      telegramFirstName: firstName,
      expiresAt,
      used: false,
    });

    console.log(`🔑 Generated link token for Telegram user ${chatId} (expires in 15 min)`);
    return token;
  }

  // Verify and consume a link token
  static async verifyLinkToken(token: string): Promise<TelegramLinkToken | null> {
    const linkData = linkTokens.get(token);

    if (!linkData) {
      console.log(`❌ Invalid link token: ${token}`);
      return null;
    }

    if (linkData.used) {
      console.log(`❌ Link token already used: ${token}`);
      return null;
    }

    if (new Date() > linkData.expiresAt) {
      console.log(`❌ Link token expired: ${token}`);
      linkTokens.delete(token);
      return null;
    }

    return linkData;
  }

  // Link Telegram account to user
  static async linkTelegramAccount(
    userId: string,
    telegramChatId: number,
    telegramUsername?: string
  ): Promise<boolean> {
    try {
      // Check if this Telegram account is already linked
      const existingUser = await storage.getUserByTelegramId(telegramChatId.toString());
      
      if (existingUser && existingUser.id !== userId) {
        console.log(`❌ Telegram account ${telegramChatId} already linked to another user`);
        return false;
      }

      // Update user with Telegram info (store chat ID for sending messages)
      await storage.updateUserTelegramInfo(userId, {
        telegramId: telegramChatId.toString(), // This is the chat ID for sending messages
        telegramUsername: telegramUsername || null,
        isTelegramUser: true,
      });

      console.log(`✅ Linked Telegram account ${telegramChatId} to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error linking Telegram account:`, error);
      return false;
    }
  }

  // Mark token as used
  static markTokenAsUsed(token: string): void {
    const linkData = linkTokens.get(token);
    if (linkData) {
      linkData.used = true;
      linkTokens.set(token, linkData);
      
      // Clean up after 1 hour
      setTimeout(() => {
        linkTokens.delete(token);
      }, 60 * 60 * 1000);
    }
  }

  // Get user by Telegram chat ID
  static async getUserByTelegramId(chatId: number): Promise<any | null> {
    try {
      return await storage.getUserByTelegramId(chatId.toString());
    } catch (error) {
      console.error('Error getting user by Telegram ID:', error);
      return null;
    }
  }

  // Get Telegram chat ID by user ID (for sending notifications)
  static async getTelegramChatIdByUserId(userId: string): Promise<number | null> {
    try {
      const user = await storage.getUser(userId);
      if (user && user.telegramId) {
        return parseInt(user.telegramId);
      }
      return null;
    } catch (error) {
      console.error('Error getting Telegram chat ID:', error);
      return null;
    }
  }

  // Clean up expired tokens (call periodically)
  static cleanupExpiredTokens(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [token, data] of linkTokens.entries()) {
      if (now > data.expiresAt) {
        linkTokens.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired link tokens`);
    }
  }
}

// Clean up expired tokens every 5 minutes
setInterval(() => {
  TelegramLinkingService.cleanupExpiredTokens();
}, 5 * 60 * 1000);
