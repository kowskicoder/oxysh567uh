import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Pusher from "pusher";
import { storage } from "./storage";
import { setupAuth, isAdmin } from "./auth";
import { PrivyAuthMiddleware } from "./privyAuth";
import { db } from "./db";
import { insertEventSchema, insertChallengeSchema, insertNotificationSchema } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import {
  users,
  events,
  userAchievements,
  challenges,
  notifications,
  transactions,
  dailyLogins,
  eventParticipants,
  eventMessages,
  challengeMessages,
  messageReactions,
  friends,
  groups,
  groupMembers,
  eventJoinRequests,
  eventPools,
} from "../shared/schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { createTelegramSync, getTelegramSync } from "./telegramSync";
import { getTelegramBot } from "./telegramBot";
import webpush from "web-push";
import { setupOGImageRoutes } from "./ogImageGenerator";
import { recommendationEngine } from "./recommendationEngine";
import { 
  generateEventOGMeta, 
  generateChallengeOGMeta, 
  generateReferralOGMeta, 
  generateProfileOGMeta,
  getDefaultOGMeta,
  generateOGMetaTags 
} from "./og-meta";
import ogMetadataRouter from './routes/og-metadata';

// Import formatBalance utility for coin operations
function formatBalance(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}
import axios from "axios";
import fileUpload from "express-fileupload";
import { adminAuth } from "./adminAuth";
import { registerTelegramMiniAppRoutes } from "./telegramMiniAppApi";
import { desc, or, not, isNull, count, sum, avg } from "drizzle-orm";

// Initialize Pusher
const pusher = new Pusher({
  appId: "1553294",
  key: "decd2cca5e39cf0cbcd4",
  secret: "1dd966e56c465ea285d9",
  cluster: "mt1",
  useTLS: true,
});

// Configure Web Push
webpush.setVapidDetails(
  'mailto:support@bantah.com',
  'BKZ0LNy05CTv807lF4dSwM3wB7nxrBHXDP5AYPvbCCPZYWrK08rTYFQO6BmKrW3f0xmIe5wUxtLN67XOSQ7W--o',
  'uNkb_1Ntqe1IKeqDeAlbyOJcXTt8wrvwArWSh7GML0A'
);



// Initialize Telegram sync service
let telegramSync = createTelegramSync(pusher);
if (telegramSync) {
  console.log("🔧 Initializing Telegram sync service...");
  telegramSync.initialize().catch((error) => {
    console.error("❌ Telegram sync initialization failed:", error);
    console.log("📱 Bantah will continue without Telegram sync");
  });
}

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    isAdmin?: boolean;
    claims?: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

// Helper function to safely get user ID from request
function getUserId(req: AuthenticatedRequest): string {
  // Privy stores user ID directly in user.id
  if (req.user?.id) {
    return req.user.id;
  }
  // Fallback for old auth structure
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  throw new Error("User ID not found in request");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // File upload middleware
  app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true
  }));

  // Auth middleware
  await setupAuth(app);

  // Telegram webhook for callback buttons (Phase 2)
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      console.log('📨 Telegram webhook update:', JSON.stringify(update, null, 2));

      // Handle my_chat_member updates (bot or user status changes in chats)
      if (update.my_chat_member) {
        try {
          const myChat = update.my_chat_member;
          // If bot was added to a group
          if (myChat.new_chat_member && myChat.new_chat_member.status === 'member') {
            const telegramBot = getTelegramBot();
            if (telegramBot) {
              // create a synthetic message object for group
              const fakeMessage = { chat: myChat.chat, from: update.my_chat_member.from };
              await telegramBot.handleGroupJoin(fakeMessage);
            }
          }
        } catch (err) {
          console.error('Error handling my_chat_member:', err);
        }
      }

      // Handle chat_member updates (users joining/leaving)
      if (update.chat_member) {
        try {
          const chatMember = update.chat_member;
          const chat = chatMember.chat;
          const newStatus = chatMember.new_chat_member?.status;
          const user = chatMember.from || chatMember.new_chat_member?.user;
          if (chat && user) {
            const telegramBot = getTelegramBot();
            // Find group record
            const groupRecord = await storage.getGroupByTelegramId(String(chat.id)).catch(() => null);
            if (groupRecord) {
              if (newStatus === 'member') {
                // add member
                await storage.addGroupMember(groupRecord.id, `telegram-${user.id}`, String(user.id), user.username || undefined);
              } else if (newStatus === 'left' || newStatus === 'kicked') {
                await storage.removeGroupMember(groupRecord.id, String(user.id));
              }
            }
          }
        } catch (err) {
          console.error('Error handling chat_member:', err);
        }
      }
      // Handle callback queries (inline button clicks)
      if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        const telegramUserId = callbackQuery.from.id;

        console.log(`🔘 Callback button clicked: ${data} by user ${telegramUserId}`);

        // Get user by Telegram ID
        const user = await storage.getUserByTelegramId(telegramUserId.toString());

        if (!user) {
          // User not linked yet
          const telegramBot = getTelegramBot();
          if (telegramBot) {
            await telegramBot.sendErrorMessage(chatId, 'general');
          }
          return res.json({ ok: true });
        }

        // Handle inline 'challenge user' action: challenge_user_<telegramId>
        if (data && data.startsWith && data.startsWith('challenge_user_')) {
          const targetTgId = data.replace('challenge_user_', '');
          try {
            const callerTelegramId = callbackQuery.from.id.toString();
            const callerUser = await storage.getUserByTelegramId(callerTelegramId);
            if (!callerUser) {
              await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQuery.id,
                text: 'Please link your Telegram account to Bantah first. Open the mini-app via the bot to link.',
                show_alert: true,
              });
              return res.json({ ok: true });
            }

            const targetUser = await storage.getUserByTelegramId(targetTgId);
            if (!targetUser) {
              await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQuery.id,
                text: 'That user has not linked Bantah. Ask them to open the mini-app to accept challenges.',
                show_alert: true,
              });
              return res.json({ ok: true });
            }

            const defaultAmount = parseFloat(process.env.DEFAULT_INLINE_CHALLENGE_AMOUNT || '1000');
            const bal = await storage.getUserBalance(callerUser.id);
            if (bal.balance < defaultAmount) {
              await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQuery.id,
                text: `Insufficient balance to create a ₦${defaultAmount} challenge.`,
                show_alert: true,
              });
              return res.json({ ok: true });
            }

            const challengeData = {
              challenger: callerUser.id,
              challenged: targetUser.id,
              title: `Inline challenge: ${callerUser.username || callerUser.firstName || 'Player'}`,
              description: `Challenge created from Telegram chat by @${callerUser.username || callerUser.id}`,
              category: 'inline',
              amount: defaultAmount.toString(),
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            };

            const challenge = await storage.createChallenge(challengeData as any);

            // Post confirmation message with accept/decline buttons
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              chat_id: chatId,
              text: `⚔️ *Challenge Created*\n*${challenge.title}*\nWager: ₦${defaultAmount}\nChallenger: @${callerUser.username || callerUser.id}\nChallenged: @${targetUser.username || targetUser.id}`,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✅ Accept', callback_data: `accept_challenge_${challenge.id}` },
                    { text: '❌ Decline', callback_data: `decline_challenge_${challenge.id}` },
                    { text: '🔍 Open', web_app: { url: `${(process.env.FRONTEND_URL||'http://localhost:5173')}/telegram-mini-app?action=view_challenge&challengeId=${challenge.id}` } }
                  ]
                ]
              }
            });

            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              callback_query_id: callbackQuery.id,
              text: '✅ Challenge created and posted to chat',
            });

            return res.json({ ok: true });
          } catch (err: any) {
            console.error('Error handling challenge_user callback:', err);
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              callback_query_id: callbackQuery.id,
              text: '❌ Failed to create challenge',
              show_alert: true,
            });
            return res.json({ ok: true });
          }
        }

        // Handle accept challenge
        if (data.startsWith('accept_challenge_')) {
          const challengeId = parseInt(data.replace('accept_challenge_', ''));

          try {
            // Check user balance
            const balance = await storage.getUserBalance(user.id);
            const challenge = await storage.getChallengeById(challengeId);

            if (!challenge) {
              throw new Error('Challenge not found');
            }

            const requiredAmount = parseFloat(challenge.amount);

            if (balance.balance < requiredAmount) {
              // Insufficient funds
              const telegramBot = getTelegramBot();
              if (telegramBot) {
                await telegramBot.sendInsufficientFundsNotification(
                  chatId,
                  requiredAmount,
                  balance.balance
                );
              }
                
              // Get full challenge details
              const fullChallenge = await storage.getChallengeById(challengeId);
              const challenger = await storage.getUser(fullChallenge!.challenger);
              const challenged = await storage.getUser(fullChallenge!.challenged);

              // Send confirmation to both users
              if (telegramBot && challenger && challenged) {
                // Notify challenged user (current user)
                await telegramBot.sendChallengeAcceptedConfirmation(chatId, {
                  id: challengeId,
                  title: fullChallenge!.title,
                  challenger: { name: challenger.firstName || challenger.username || 'Challenger' },
                  challenged: { name: challenged.firstName || challenged.username || 'You' },
                  amount: requiredAmount
                });

                // Notify challenger if they have Telegram linked
                if (challenger.telegramId) {
                  await telegramBot.sendChallengeAcceptedConfirmation(
                    parseInt(challenger.telegramId),
                    {
                      id: challengeId,
                      title: fullChallenge!.title,
                      challenger: { name: 'You' },
                      challenged: { name: challenged.firstName || challenged.username || 'Opponent' },
                      amount: requiredAmount
                    }
                  );
                }
              }
            }

            // Answer callback query to remove loading state
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              callback_query_id: callbackQuery.id,
              text: '✅ Processing...'
            });

          } catch (error: any) {
            console.error('Error accepting challenge:', error);
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              callback_query_id: callbackQuery.id,
              text: `❌ Error: ${error.message}`,
              show_alert: true
            });
          }
        }

        // Handle decline challenge
        if (data.startsWith('decline_challenge_')) {
          const challengeId = parseInt(data.replace('decline_challenge_', ''));

          try {
            await storage.updateChallenge(challengeId, { status: 'cancelled' });

            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              callback_query_id: callbackQuery.id,
              text: '❌ Challenge declined'
            });

            // Send declined message
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              chat_id: chatId,
              text: '❌ *Challenge Declined*\n\nYou have declined this challenge.',
              parse_mode: 'Markdown'
            });

          } catch (error: any) {
            console.error('Error declining challenge:', error);
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              callback_query_id: callbackQuery.id,
              text: `❌ Error: ${error.message}`,
              show_alert: true
            });
          }
        }
      }

      // Handle inline queries (group challenges)
      if (update.inline_query) {
        const inlineQuery = update.inline_query;
        const telegramBot = getTelegramBot();
        
        if (telegramBot) {
          await telegramBot.handleInlineQuery(inlineQuery, apiClient);
        }
      }

      // Handle message events (group joins, leave notifications)
      if (update.message) {
        const message = update.message;
        const telegramBot = getTelegramBot();

        // Handle group_chat_created or my_chat_member for group join
        if (message.group_chat_created || message.supergroup_chat_created || (update.my_chat_member && update.my_chat_member.new_chat_member?.status === 'member')) {
          if (telegramBot) {
            await telegramBot.handleGroupJoin(message);
          }
        }
      }

      // Handle chosen inline result (when user selects a challenge)
      if (update.chosen_inline_result) {
        const chosenResult = update.chosen_inline_result;
        const telegramBot = getTelegramBot();

        if (telegramBot) {
          await telegramBot.handleChosenInlineResult(chosenResult, apiClient);
        }
      }

      res.json({ ok: true });
    } catch (error) {
      console.error('❌ Telegram webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);

      // Check and create daily login record
      await storage.checkDailyLogin(userId);

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/profile', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);

      // Ensure user has a referral code
      if (!user.referralCode) {
        const referralCode = user.username || `user_${userId.slice(-8)}`;
        await db
          .update(users)
          .set({ 
            referralCode: referralCode,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        user.referralCode = referralCode;
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        console.error("User ID not found in request:", req.user);
        return res.status(401).json({ message: "User ID not found" });
      }

      const { firstName, username, bio, avatarUrl } = req.body;

      // Update user profile
      await storage.updateUserProfile(userId, {
        firstName,
        username,
        bio,
        avatarUrl
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Referral routes
  app.get('/api/referrals', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const referrals = await storage.getReferrals(userId);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getEvents(20);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Groups listing
  app.get('/api/groups', async (_req, res) => {
    try {
      const groupsList = await db.select().from(groups).orderBy(desc(groups.addedAt));
      res.json(groupsList);
    } catch (err) {
      console.error('Error fetching groups:', err);
      res.status(500).json({ message: 'Failed to fetch groups' });
    }
  });

  // Get members for a group
  app.get('/api/groups/:id/members', async (req, res) => {
    try {
      const groupId = parseInt(req.params.id, 10);
      if (isNaN(groupId)) return res.status(400).json({ message: 'Invalid group id' });
      const members = await storage.getGroupMembers(groupId);
      res.json(members || []);
    } catch (err) {
      console.error('Error fetching group members:', err);
      res.status(500).json({ message: 'Failed to fetch group members' });
    }
  });

  // Admin: sync group members when bot is admin (pull group admins and add them)
  app.post('/api/admin/groups/:telegramId/sync', adminAuth, async (req, res) => {
    try {
      const telegramId = req.params.telegramId;
      if (!telegramId) return res.status(400).json({ message: 'Missing telegramId' });

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) return res.status(500).json({ message: 'Telegram bot token not configured' });

      const base = `https://api.telegram.org/bot${botToken}`;

      // Ensure our group record exists
      let group = await storage.getGroupByTelegramId(String(telegramId));
      if (!group) {
        group = await storage.addGroup(String(telegramId), undefined, undefined, req.user?.id || 'system');
      }

      // Fetch chat administrators (requires bot to be admin in the chat)
      const adminsResp = await axios.get(`${base}/getChatAdministrators`, { params: { chat_id: telegramId } });
      if (!adminsResp.data || !adminsResp.data.ok) {
        return res.status(500).json({ message: 'Failed to fetch chat administrators', detail: adminsResp.data });
      }

      const added: any[] = [];
      for (const admin of adminsResp.data.result || []) {
        try {
          const user = admin.user;
          if (!user) continue;
          const telegramUserId = String(user.id);
          await storage.addGroupMember(group.id, `telegram-${telegramUserId}`, telegramUserId, user.username || undefined);
          added.push({ id: telegramUserId, username: user.username });
        } catch (err) {
          console.warn('Failed adding admin member', err);
        }
      }

      return res.json({ ok: true, added });
    } catch (err) {
      console.error('Error syncing group members:', err);
      res.status(500).json({ message: 'Failed to sync group members' });
    }
  });

  // Test endpoints to simulate Telegram updates for QA
  app.post('/api/test/telegram/inline_query', adminAuth, async (req, res) => {
    try {
      const inlineQuery = req.body.inline_query;
      if (!inlineQuery) return res.status(400).json({ message: 'Missing inline_query in body' });
      const telegramBot = getTelegramBot();
      if (!telegramBot) return res.status(500).json({ message: 'Telegram bot not initialized' });
      // Pass axios as apiClient
      await telegramBot.handleInlineQuery(inlineQuery, axios);
      res.json({ ok: true });
    } catch (err) {
      console.error('Error in test inline_query:', err);
      res.status(500).json({ message: 'Failed to simulate inline_query' });
    }
  });

  app.post('/api/test/telegram/callback', adminAuth, async (req, res) => {
    try {
      const callbackQuery = req.body.callback_query;
      if (!callbackQuery) return res.status(400).json({ message: 'Missing callback_query in body' });

      // Reuse the same logic as webhook for callback_query handling
      const chatId = callbackQuery.message?.chat?.id;
      const data = callbackQuery.data;
      const telegramUserId = callbackQuery.from?.id;

      const user = await storage.getUserByTelegramId(String(telegramUserId));
      if (!user) return res.status(400).json({ message: 'Telegram user not linked to a Bantah user' });

      // Basic challenge_user_ flow for QA
      if (data && data.startsWith && data.startsWith('challenge_user_')) {
        const targetTgId = data.replace('challenge_user_', '');
        const callerUser = user;
        const targetUser = await storage.getUserByTelegramId(targetTgId);
        if (!targetUser) return res.status(400).json({ message: 'Target user not linked' });

        const defaultAmount = parseFloat(process.env.DEFAULT_INLINE_CHALLENGE_AMOUNT || '1000');
        const challengeData = {
          challenger: callerUser.id,
          challenged: targetUser.id,
          title: `Inline challenge: ${callerUser.username || callerUser.firstName || 'Player'}`,
          description: `Challenge created from Telegram chat by @${callerUser.username || callerUser.id}`,
          category: 'inline',
          amount: defaultAmount.toString(),
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        const challenge = await storage.createChallenge(challengeData as any);

        // For QA, return the challenge object instead of calling Telegram
        return res.json({ ok: true, challenge });
      }

      res.json({ ok: true, note: 'callback processed (no action taken)' });
    } catch (err) {
      console.error('Error in test callback:', err);
      res.status(500).json({ message: 'Failed to simulate callback_query' });
    }
  });

  // Admin: set webhook and allowed_updates for Bot (deploy webhook)
  app.post('/api/admin/telegram/set-webhook', adminAuth, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: 'Missing url in body' });
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) return res.status(500).json({ message: 'Telegram bot token not configured' });
      const base = `https://api.telegram.org/bot${botToken}`;

      const allowed_updates = [
        'message',
        'inline_query',
        'chosen_inline_result',
        'callback_query',
        'my_chat_member',
        'chat_member'
      ];

      const resp = await axios.post(`${base}/setWebhook`, { url, allowed_updates });
      if (!resp.data || !resp.data.ok) {
        return res.status(500).json({ message: 'Failed to set webhook', detail: resp.data });
      }

      return res.json({ ok: true, result: resp.data.result });
    } catch (err) {
      console.error('Error setting webhook:', err);
      res.status(500).json({ message: 'Failed to set webhook' });
    }
  });

  // Social Event Recommendation Engine Endpoints
  app.get('/api/recommendations/events', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await recommendationEngine.getRecommendedEvents(userId, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting event recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  app.get('/api/recommendations/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const trending = await recommendationEngine.getTrendingEvents(limit);
      res.json(trending);
    } catch (error) {
      console.error("Error getting trending events:", error);
      res.status(500).json({ message: "Failed to get trending events" });
    }
  });

  app.get('/api/recommendations/similar/:eventId', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const limit = parseInt(req.query.limit as string) || 5;
      const similar = await recommendationEngine.getSimilarEvents(eventId, limit);
      res.json(similar);
    } catch (error) {
      console.error("Error getting similar events:", error);
      res.status(500).json({ message: "Failed to get similar events" });
    }
  });

  app.get('/api/recommendations/preferences', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.id;
      const preferences = await recommendationEngine.calculateUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error getting user preferences:", error);
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEventById(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      console.log("Creating event with data:", req.body);
      console.log("User ID:", userId);

      // Validate required fields
      if (!req.body.title || !req.body.category || !req.body.entryFee || !req.body.endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Convert entryFee to proper integer format (coins)
      const entryFee = parseInt(req.body.entryFee);
      if (isNaN(entryFee) || entryFee <= 0) {
        return res.status(400).json({ message: "Invalid entry fee" });
      }

      // Validate end date
      const endDate = new Date(req.body.endDate);
      if (endDate <= new Date()) {
        return res.status(400).json({ message: "End date must be in the future" });
      }

      const eventData = {
        title: req.body.title,
        description: req.body.description || null,
        category: req.body.category,
        entryFee: entryFee,
        endDate: endDate,
        creatorId: userId,
        status: 'active',
        isPrivate: req.body.isPrivate || false,
        maxParticipants: req.body.maxParticipants || 100,
        imageUrl: req.body.bannerUrl || null,
      };

      console.log("Parsed event data:", eventData);

      const event = await storage.createEvent(eventData);
      console.log("Created event:", event);

      // Get creator info for Telegram broadcast
      const creator = await storage.getUser(userId);

      // Broadcast to Telegram channel
      const telegramBot = getTelegramBot();
      if (telegramBot && creator) {
        try {
          await telegramBot.broadcastEvent({
            id: event.id,
            title: event.title,
            description: event.description || undefined,
            creator: {
              name: creator.firstName || creator.username || 'Unknown',
              username: creator.username || undefined,
            },
            entryFee: event.entryFee,
            endDate: event.endDate,
            is_private: event.isPrivate,
            max_participants: event.maxParticipants,
            category: event.category,
          });
          console.log("📤 Event broadcasted to Telegram successfully");
        } catch (error) {
          console.error("❌ Failed to broadcast event to Telegram:", error);
        }
      }

      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  });

  // Edit event endpoint
  app.put('/api/events/:id', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user?.id || req.user?.claims?.sub;

      // Check if event exists and user is the creator
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.creatorId !== userId) {
        return res.status(403).json({ message: "Only the event creator can edit this event" });
      }

      // Check if event can still be edited (hasn't started yet)
      const now = new Date();
      const endDate = new Date(event.endDate);
      if (now >= endDate) {
        return res.status(400).json({ message: "Cannot edit event that has already ended" });
      }

      // Validate required fields
      if (!req.body.title || !req.body.category || !req.body.entryFee || !req.body.endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Convert entryFee to proper integer format
      const entryFee = parseInt(req.body.entryFee);
      if (isNaN(entryFee) || entryFee <= 0) {
        return res.status(400).json({ message: "Invalid entry fee" });
      }

      // Validate end date
      const newEndDate = new Date(req.body.endDate);
      if (newEndDate <= new Date()) {
        return res.status(400).json({ message: "End date must be in the future" });
      }

      const updates = {
        title: req.body.title,
        description: req.body.description || null,
        category: req.body.category,
        entryFee: entryFee,
        endDate: newEndDate,
      };

      const updatedEvent = await storage.updateEvent(eventId, updates);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.post('/api/events/:id/leave', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Check if user has joined the event
      const participant = await db
        .select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId)
        ))
        .limit(1);

      if (participant.length === 0) {
        return res.status(400).json({ message: "You haven't joined this event" });
      }

      // Check if user has bet (prevent leaving if they have bet)
      if (participant[0].prediction !== null) {
        return res.status(400).json({ message: "Cannot leave event after placing a bet" });
      }

      // Remove participant
      await db
        .delete(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId)
        ));

      res.json({ message: "Successfully left the event" });
    } catch (error) {
      console.error("Error leaving event:", error);
      res.status(500).json({ message: "Failed to leave event" });
    }
  });

  app.post('/api/events/:id/join', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const eventId = parseInt(req.params.id);
      const { prediction } = req.body;

      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Always use the event's entry fee (fixed model) - now in coins
      const amount = parseInt(event.entryFee.toString());

      // Check user coin balance
      const balance = await storage.getUserBalance(userId);
      const userCoins = balance.coins || 0;
      if (userCoins < amount) {
        return res.status(400).json({ message: "Insufficient coins" });
      }

      // Check if event is private
      if (event.isPrivate) {
        // Create join request for private events
        const joinRequest = await storage.requestEventJoin(eventId, userId, prediction, amount);

        // Create notification for event creator
        await storage.createNotification({
          userId: event.creatorId,
          type: 'event_join_request',
          title: 'New Event Join Request',
          message: `${req.user.claims.first_name || 'Someone'} wants to join your private event: ${event.title}`,
          data: { eventId: eventId, requestId: joinRequest.id },
        });

        // Create notification for user about pending request
        await storage.createNotification({
          userId,
          type: 'event_join_pending',
          title: '⏳ Join Request Submitted',
          message: `Your request to join "${event.title}" is pending approval. Funds will be locked once approved.`,
          data: { 
            eventId: eventId, 
            amount: amount,
            prediction: prediction ? 'YES' : 'NO',
            eventTitle: event.title
          },
        });

        return res.json({ message: "Join request sent to event creator", request: joinRequest });
      }

      const participant = await storage.joinEvent(eventId, userId, prediction, amount);

      // Create transaction record for coin escrow
      await storage.createTransaction({
        userId,
        type: 'event_escrow',
        amount: `-${amount}`,
        description: `${amount.toLocaleString()} coins locked in escrow for event: ${event.title}`,
        relatedId: eventId,
        status: 'completed',
      });

      // Deduct coins from user
      await db
        .update(users)
        .set({ 
          coins: sql`${users.coins} - ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Create comprehensive notifications
      await storage.createNotification({
        userId,
        type: 'coins_locked',
        title: '🔒 Coins Locked in Escrow',
        message: `${amount.toLocaleString()} coins locked for your ${prediction ? 'YES' : 'NO'} prediction on "${event.title}". Coins will be released when the event ends.`,
        data: { 
          eventId: eventId,
          amount: amount,
          prediction: prediction ? 'YES' : 'NO',
          eventTitle: event.title,
          eventEndDate: event.endDate,
          type: 'escrow_lock'
        },
      });

      // Notify event creator about new participant
      await storage.createNotification({
        userId: event.creatorId,
        type: 'event_participant_joined',
        title: '🎯 New Event Participant',
        message: `${req.user.claims.first_name || 'Someone'} joined your event "${event.title}" with a ${prediction ? 'YES' : 'NO'} prediction (${amount.toLocaleString()} coins)!`,
        data: { 
          eventId: eventId,
          participantId: userId,
          amount: amount,
          prediction: prediction ? 'YES' : 'NO',
          eventTitle: event.title
        },
      });

      // Send real-time notifications via Pusher
      await pusher.trigger(`user-${userId}`, 'coins-locked', {
        title: '🔒 Coins Locked in Escrow',
        message: `${amount.toLocaleString()} coins locked for your ${prediction ? 'YES' : 'NO'} prediction on "${event.title}"`,
        eventId: eventId,
        type: 'coins_locked',
      });

      await pusher.trigger(`user-${event.creatorId}`, 'participant-joined', {
        title: '🎯 New Event Participant',
        message: `${req.user.claims.first_name || 'Someone'} joined your event "${event.title}"`,
        eventId: eventId,
        type: 'participant_joined',
      });

      res.json(participant);
    } catch (error) {
      console.error("Error joining event:", error);
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.get('/api/events/:id/messages', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Check if event exists and get event details
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // If event is private, check access permissions
      if (event.isPrivate) {
        // Allow access if user is the creator
        if (event.creatorId !== userId) {
          // Check if user is a participant (approved to join)
          const participants = await storage.getEventParticipantsWithUsers(eventId);
          const userParticipant = participants.find((p: any) => p.userId === userId);

          if (!userParticipant) {
            return res.status(403).json({ message: "Access denied. This is a private event and you haven't been approved to join." });
          }
        }
      }

      const messages = await storage.getEventMessages(eventId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching event messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/events/:id/messages', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const { message, replyToId, mentions } = req.body;

      // Check if event exists and get event details
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // If event is private, check access permissions
      if (event.isPrivate) {
        // Allow access if user is the creator
        if (event.creatorId !== userId) {
          // Check if user is a participant (approved to join)
          const participants = await storage.getEventParticipantsWithUsers(eventId);
          const userParticipant = participants.find((p: any) => p.userId === userId);

          if (!userParticipant) {
            return res.status(403).json({ message: "Access denied. You cannot post messages in this private event." });
          }
        }
      }

      const newMessage = await storage.createEventMessage(eventId, userId, message, replyToId, mentions);

      // Broadcast new message via Pusher
      await pusher.trigger(`event-${eventId}`, 'new-message', {
        message: newMessage,
        eventId: eventId,
        userId: userId,
      });

      // Forward to Telegram if sync is available
      const telegramSync = getTelegramSync();
      if (telegramSync && telegramSync.isReady()) {
        try {
          const user = await storage.getUser(userId);
          const event = await storage.getEventById(eventId);
          const senderName = user?.firstName || user?.username || 'BetChat User';

          await telegramSync.sendMessageToTelegram(
            message, 
            senderName, 
            { id: eventId, title: event?.title || `Event ${eventId}` }
          );
        } catch (telegramError) {
          console.error('Error forwarding message to Telegram:', telegramError);
        }
      } else {
        // Fallback to Telegram bot if sync is not available
        const telegramBot = getTelegramBot();
        if (telegramBot) {
          try {
            const user = await storage.getUser(userId);
            const event = await storage.getEventById(eventId);
            const senderName = user?.firstName || user?.username || 'BetChat User';

            const formattedMessage = `🎯 ${event?.title || 'Event Chat'}\n👤 ${senderName}: ${message}`;

            await telegramBot.sendCustomMessage(formattedMessage);
            console.log(`📤 BetChat → Telegram Bot: ${senderName}: ${message} [Event: ${event?.title || 'Event Chat'}]`);
          } catch (telegramError) {
            console.error('Error sending message via Telegram bot:', telegramError);
          }
        }
      }

      // Create notifications for mentioned users
      if (mentions && mentions.length > 0) {
        for (const mentionedUsername of mentions) {
          const mentionedUser = await storage.getUserByUsername(mentionedUsername);
          if (mentionedUser && mentionedUser.id !== userId) {
            const notification = await storage.createNotification({
              userId: mentionedUser.id,
              type: 'mention',
              title: 'You were mentioned',
              message: `${req.user.claims.first_name || 'Someone'} mentioned you in an event chat`,
              data: { 
                eventId: eventId, 
                messageId: newMessage.id,
                mentionedBy: userId,
                eventTitle: 'Event Chat'
              },
            });

            // Send notification via Pusher
            await pusher.trigger(`user-${mentionedUser.id}`, 'event-notification', {
              title: 'You were mentioned',
              message: `${req.user.claims.first_name || 'Someone'} mentioned you in an event chat`,
              eventId: eventId,
              type: 'mention',
            });
          }
        }
      }

      // Create notification for replied user
      if (replyToId) {
        const repliedMessage = await storage.getEventMessageById(replyToId);
        if (repliedMessage && repliedMessage.userId !== userId) {
          const notification = await storage.createNotification({
            userId: repliedMessage.userId,
            type: 'reply',
            title: 'Someone replied to your message',
            message: `${req.user.claims.first_name || 'Someone'} replied to your message`,
            data: { 
              eventId: eventId, 
              messageId: newMessage.id,
              repliedBy: userId,
              originalMessageId: replyToId
            },
          });

          // Send notification via Pusher
          await pusher.trigger(`user-${repliedMessage.userId}`, 'event-notification', {
            title: 'Someone replied to your message',
            message: `${req.user.claims.first_name || 'Someone'} replied to your message`,
            eventId: eventId,
            type: 'reply',
          });
        }
      }

      res.json(newMessage);
    } catch (error) {
      console.error("Error creating event message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.post('/api/events/:id/messages/:messageId/react', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const messageId = req.params.messageId;
      const { emoji } = req.body;

      const reaction = await storage.toggleMessageReaction(messageId, userId, emoji);

      // Get updated reaction summary for the message
      const message = await storage.getEventMessageById(messageId);
      const updatedReactions = await storage.getMessageReactions(messageId);

      // Broadcast reaction update via Pusher with complete reaction data
      await pusher.trigger(`event-${eventId}`, 'reaction-update', {
        messageId: messageId,
        reactions: updatedReactions,
        userId: userId,
        action: reaction.action,
        emoji: emoji,
        timestamp: new Date().toISOString(),
      });

      res.json({ 
        ...reaction, 
        messageId: messageId,
        reactions: updatedReactions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error reacting to message:", error);
      res.status(500).json({ message: "Failed to react to message" });
    }
  });

  app.get('/api/events/:id/participants', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const participants = await storage.getEventParticipantsWithUsers(eventId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching event participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Event Pool Management Routes
  app.get('/api/events/:id/stats', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const stats = await storage.getEventPoolStats(eventId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching event stats:", error);
      res.status(500).json({ message: "Failed to fetch event stats" });
    }
  });

  // Admin login endpoint (no auth required)
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      // Check if user is admin
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'Admin access denied' });
      }

      // Verify password
      const { comparePasswords } = await import('./auth');
      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      // Generate admin token
      const adminToken = `admin_${user.id}_${Date.now()}`;

      res.json({
        token: adminToken,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin routes with authentication
  app.use('/api/admin', adminAuth);

  app.get('/api/admin/stats', async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Admin Route: Set event result and trigger payout
  app.post('/api/admin/events/:id/result', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const { result } = req.body; // true for YES, false for NO

      // Log admin action for audit trail
      console.log(`Admin ${userId} setting result for event ${eventId}: ${result ? 'YES' : 'NO'}`);

      // Validate event exists and is ready for payout
      const existingEvent = await storage.getEventById(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (existingEvent.adminResult !== null) {
        return res.status(400).json({ message: "Event result already set" });
      }

      const event = await storage.adminSetEventResult(eventId, result);
      const payoutResult = await storage.processEventPayout(eventId);

      // Log payout for audit trail```text
  console.log(`Event ${eventId} payout processed:`, {
        winnersCount: payoutResult.winnersCount,
        totalPayout: payoutResult.totalPayout,
        creatorFee: payoutResult.creatorFee,
        processedBy: userId,
        timestamp: new Date().toISOString()
      });

      // Send real-time notification to participants
      await pusher.trigger(`event-${eventId}`, 'event-resolved', {
        eventId,
        result: result ? 'YES' : 'NO',
        winnersCount: payoutResult.winnersCount,
        totalPayout: payoutResult.totalPayout,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        event, 
        payout: payoutResult,
        message: `Event result set to ${result ? 'YES' : 'NO'}. Payout processed: ${payoutResult.winnersCount} winners received ₦${payoutResult.totalPayout.toLocaleString()} total, ₦${payoutResult.creatorFee.toLocaleString()} creator fee.`
      });
    } catch (error) {
      console.error("Error setting event result:", error);
      res.status(500).json({ message: error.message || "Failed to set event result" });
    }
  });

  // Private Event Management Routes
  app.get('/api/events/:id/join-requests', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);

      // Check if user is the event creator
      const event = await storage.getEventById(eventId);
      if (!event || event.creatorId !== userId) {
        return res.status(403).json({ message: "Only event creator can view join requests" });
      }

      const requests = await storage.getEventJoinRequests(eventId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      res.status(500).json({ message: "Failed to fetch join requests" });
    }
  });

  app.post('/api/events/join-requests/:id/approve', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);

      // TODO: Add validation that user is the event creator

      const participant = await storage.approveEventJoinRequest(requestId);

      // Create notification for requester
      await storage.createNotification({
        userId: participant.userId,
        type: 'event_join_approved',
        title: 'Event Join Request Approved',
        message: `Your request to join the event has been approved!`,
        data: { eventId: participant.eventId },
      });

      res.json(participant);
    } catch (error) {
      console.error("Error approving join request:", error);
      res.status(500).json({ message: "Failed to approve join request" });
    }
  });

  app.post('/api/events/join-requests/:id/reject', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);

      // TODO: Add validation that user is the event creator

      const rejectedRequest = await storage.rejectEventJoinRequest(requestId);

      // Create notification for requester
      await storage.createNotification({
        userId: rejectedRequest.userId,
        type: 'event_join_rejected',
        title: 'Event Join Request Rejected',
        message: `Your request to join the event has been rejected.`,
        data: { eventId: rejectedRequest.eventId },
      });

      res.json(rejectedRequest);
    } catch (error) {
      console.error("Error rejecting join request:", error);
      res.status(500).json({ message: "Failed to reject join request" });
    }
  });

  // Challenge routes
  app.get('/api/challenges', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.get('/api/challenges/:id', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const challenge = await storage.getChallengeById(challengeId);

      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      res.json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });

  app.post('/api/challenges', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;

      // Prepare data for validation
      const dataToValidate = {
        ...req.body,
        challenger: userId,
        amount: parseInt(req.body.amount), // Ensure it's an integer for coins
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined // Convert string to Date
      };

      console.log('Challenge data to validate:', dataToValidate);

      const challengeData = insertChallengeSchema.parse(dataToValidate);
      const challenge = await storage.createChallenge(challengeData);

      // Get challenger and challenged user info
      const challenger = await storage.getUser(userId);
      const challenged = await storage.getUser(challenge.challenged);

      // Create notification for challenged user
      const challengedNotification = await storage.createNotification({
        userId: challenge.challenged,
        type: 'challenge',
        title: '🎯 New Challenge Request',
        message: `${challenger?.firstName || challenger?.username || 'Someone'} challenged you to "${challenge.title}"`,
        data: { 
          challengeId: challenge.id,
          challengerName: challenger?.firstName || challenger?.username,
          challengeTitle: challenge.title,
          amount: challenge.amount,
          type: challenge.type
        },
      });

      // Create notification for challenger (confirmation)
      const challengerNotification = await storage.createNotification({
        userId: userId,
        type: 'challenge_sent',
        title: '🚀 Challenge Sent',
        message: `Your challenge "${challenge.title}" was sent to ${challenged?.firstName || challenged?.username}`,
        data: { 
          challengeId: challenge.id,
          challengedName: challenged?.firstName || challenged?.username,
          challengeTitle: challenge.title,
          amount: challenge.amount,
          type: challenge.type
        },
      });

      // Send instant real-time notifications via Pusher
      try {
        await pusher.trigger(`user-${challenge.challenged}`, 'challenge-received', {
          id: challengedNotification.id,
          type: 'challenge_received',
          title: '🎯 Challenge Received!',
          message: `${challenger?.firstName || challenger?.username || 'Someone'} challenged you to "${challenge.title}"`,
          challengerName: challenger?.firstName || challenger?.username || 'Someone',
          challengeTitle: challenge.title,
          amount: parseFloat(challenge.amount),
          challengeId: challenge.id,
          data: challengedNotification.data,
          timestamp: new Date().toISOString(),
        });

        await pusher.trigger(`user-${userId}`, 'challenge-sent', {
          id: challengerNotification.id,
          type: 'challenge_sent',
          title: '🚀 Challenge Sent',
          message: `Your challenge "${challenge.title}" was sent to ${challenged?.firstName || challenged?.username}`,
          data: challengerNotification.data,
          timestamp: new Date().toISOString(),
        });
      } catch (pusherError) {
        console.error("Error sending Pusher notifications:", pusherError);
      }

      // Broadcast to Telegram channel
      const telegramBot = getTelegramBot();
      if (telegramBot && challenger && challenged) {
        try {
          await telegramBot.broadcastChallenge({
            id: challenge.id,
            title: challenge.title,
            description: challenge.description || undefined,
            creator: {
              name: challenger.firstName || challenger.username || 'Unknown',
              username: challenger.username || undefined,
            },
            challenged: {
              name: challenged.firstName || challenged.username || 'Unknown',
              username: challenged.username || undefined,
            },
            stake_amount: parseFloat(challenge.amount),
            status: challenge.status,
            end_time: challenge.dueDate,
            category: challenge.type,
          });
          console.log("📤 Challenge broadcasted to Telegram successfully");

          // Phase 2: Send accept card to challenged user if they have Telegram linked
          if (challenged.telegramId) {
            console.log(`📤 Sending challenge accept card to Telegram user ${challenged.telegramId}`);
            await telegramBot.sendChallengeAcceptCard(
              parseInt(challenged.telegramId),
              {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description || undefined,
                challenger: {
                  name: challenger.firstName || challenger.username || 'Unknown',
                  username: challenger.username || undefined,
                },
                challenged: {
                  name: challenged.firstName || challenged.username || 'You',
                  username: challenged.username || undefined,
                },
                amount: parseFloat(challenge.amount),
                category: challenge.type,
              }
            );
            console.log("📤 Challenge accept card sent to Telegram user");
          }
        } catch (error) {
          console.error("❌ Failed to broadcast challenge to Telegram:", error);
        }
      }

      res.json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  // Edit challenge endpoint
  app.put('/api/challenges/:id', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user?.id || req.user?.claims?.sub;

      // Check if challenge exists and user is the challenger
      const challenge = await storage.getChallengeById(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      if (challenge.challenger !== userId) {
        return res.status(403).json({ message: "Only the challenger can edit this challenge" });
      }

      // Check if challenge can still be edited (not yet accepted or started)
      if (challenge.status !== 'pending') {
        return res.status(400).json({ message: "Cannot edit challenge that has been accepted or completed" });
      }

      // Validate required fields
      if (!req.body.title || !req.body.amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Convert amount to proper integer format
      const amount = parseInt(req.body.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const updates = {
        title: req.body.title,
        description: req.body.description || null,
        amount: amount,
      };

      const updatedChallenge = await storage.updateChallenge(challengeId, updates);
      res.json(updatedChallenge);
    } catch (error) {
      console.error("Error updating challenge:", error);
      res.status(500).json({ message: "Failed to update challenge" });
    }
  });

  app.post('/api/challenges/:id/accept', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Check user has enough coins before accepting
      const balance = await storage.getUserBalance(userId);
      const challengeData = await storage.getChallengeById(challengeId);
      const requiredCoins = parseInt(challengeData.amount.toString());

      if ((balance.coins || 0) < requiredCoins) {
        return res.status(400).json({ message: "Insufficient coins to accept this challenge" });
      }

      const challenge = await storage.acceptChallenge(challengeId, userId);

      // Get user info for notifications
      const challenger = await storage.getUser(challenge.challenger);
      const challenged = await storage.getUser(challenge.challenged);

      // Create notifications for both users
      await storage.createNotification({
        userId: challenge.challenger,
        type: 'challenge_accepted',
        title: '🎯 Challenge Accepted!',
        message: `${challenged?.firstName || challenged?.username} accepted your challenge "${challenge.title}"! The challenge is now active.`,
        data: { 
          challengeId: challengeId,
          challengeTitle: challenge.title,
          amount: parseFloat(challenge.amount),
          acceptedBy: challenged?.firstName || challenged?.username
        },
      });

      await storage.createNotification({
        userId: challenge.challenged,
        type: 'challenge_active',
        title: '🔒 Challenge Active',
        message: `Your stake of ₦${parseFloat(challenge.amount).toLocaleString()} has been escrowed for challenge "${challenge.title}". Good luck!`,
        data: { 
          challengeId: challengeId,
          challengeTitle: challenge.title,
          amount: parseFloat(challenge.amount)
        },
      });

      // Send real-time notifications via Pusher
      try {
        await pusher.trigger(`user-${challenge.challenger}`, 'challenge-accepted', {
          id: Date.now(),
          type: 'challenge_accepted',
          title: '🎯 Challenge Accepted!',
          message: `${challenged?.firstName || challenged?.username} accepted your challenge "${challenge.title}"!`,
          data: { challengeId: challengeId },
          timestamp: new Date().toISOString(),
        });

        await pusher.trigger(`user-${challenge.challenged}`, 'challenge-active', {
          id: Date.now(),
          type: 'challenge_active',
          title: '🔒 Challenge Active',
          message: `Challenge "${challenge.title}" is now active! Your funds are secured in escrow.`,
          data: { challengeId: challengeId },
          timestamp: new Date().toISOString(),
        });
      } catch (pusherError) {
        console.error("Error sending Pusher notifications:", pusherError);
      }

      // Broadcast matchmaking (challenge accepted) to Telegram
      try {
        const telegramBot = getTelegramBot();
        if (telegramBot) {
          await telegramBot.broadcastMatchmaking({
            challengeId: challenge.id,
            challenger: {
              name: challenger?.firstName || challenger?.username || 'Unknown',
              username: challenger?.username || undefined,
            },
            challenged: {
              name: challenged?.firstName || challenged?.username || 'Unknown',
              username: challenged?.username || undefined,
            },
            stake_amount: parseFloat(challenge.amount),
            category: challenge.type,
          });
          console.log('📤 Challenge acceptance (matchmaking) broadcasted to Telegram successfully');
        }
      } catch (telegramError) {
        console.error('❌ Error broadcasting matchmaking to Telegram:', telegramError);
      }

      res.json(challenge);
    } catch (error) {
      console.error("Error accepting challenge:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to accept challenge" });
    }
  });

  app.get('/api/challenges/:id/messages', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Verify user is part of the challenge
      const challenge = await storage.getChallengeById(challengeId);
      if (!challenge || (challenge.challenger !== userId && challenge.challenged !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getChallengeMessages(challengeId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching challenge messages:", error);
      res.status(500).json({ message: "Failed to fetch challenge messages" });
    }
  });

  app.post('/api/challenges/:id/messages', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { message, type = 'text', evidence } = req.body;

      // Verify user is part of the challenge
      const challenge = await storage.getChallengeById(challengeId);
      if (!challenge || (challenge.challenger !== userId && challenge.challenged !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const newMessage = await storage.createChallengeMessage(challengeId, userId, message);

      // Get user info for real-time message
      const user = await storage.getUser(userId);
      const messageWithUser = {
        ...newMessage,
        user: {
          id: user?.id,
          username: user?.username,
          firstName: user?.firstName,
          profileImageUrl: user?.profileImageUrl
        }
      };

      // Send real-time message to both participants
      const otherUserId = challenge.challenger === userId ? challenge.challenged : challenge.challenger;

      try {
        await pusher.trigger(`challenge-${challengeId}`, 'new-message', {
          message: messageWithUser,
          timestamp: new Date().toISOString(),
        });

        // Send notification to other participant
        await storage.createNotification({
          userId: otherUserId,
          type: 'challenge_message',
          title: '💬 New Challenge Message',
          message: `${user?.firstName || user?.username} sent a message in challenge "${challenge.title}"`,
          data: { 
            challengeId: challengeId,
            challengeTitle: challenge.title,
            messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
          },
        });
      } catch (pusherError) {
        console.error("Error sending real-time message:", pusherError);
      }

      res.json(messageWithUser);
    } catch (error) {
      console.error("Error creating challenge message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Friend routes
  app.get('/api/friends', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.post('/api/friends/request', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const { addresseeId } = req.body;

      const friendRequest = await storage.sendFriendRequest(requesterId, addresseeId);

      // Get requester info
      const requester = await storage.getUser(requesterId);

      // Create notification
      await storage.createNotification({
        userId: addresseeId,
        type: 'friend_request',
        title: '👋 Friend Request',
        message: `${requester?.firstName || requester?.username || 'Someone'} sent you a friend request!`,
        data: { 
          friendRequestId: friendRequest.id,
          requesterId: requesterId,
          requesterName: requester?.firstName || requester?.username
        },
      });

      // Send real-time notification via Pusher
      await pusher.trigger(`user-${addresseeId}`, 'friend-request', {
        title: '👋 Friend Request',
        message: `${requester?.firstName || requester?.username || 'Someone'} sent you a friend request!`,
        friendRequestId: friendRequest.id,
        requesterId: requesterId,
        requesterName: requester?.firstName || requester?.username,
        timestamp: new Date().toISOString(),
      });

      res.json(friendRequest);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.patch('/api/friends/:id/accept', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const friendRequestId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const friend = await storage.acceptFriendRequest(friendRequestId);

      // Get user info
      const user = await storage.getUser(userId);
      const requester = await storage.getUser(friend.requesterId);

      // Create notification for requester
      await storage.createNotification({
        userId: friend.requesterId,
        type: 'friend_accepted',
        title: '✅ Friend Request Accepted',
        message: `${user?.firstName || user?.username || 'Someone'} accepted your friend request!`,
        data: { 
          friendId: userId,
          friendName: user?.firstName || user?.username
        },
      });

      // Send real-time notification via Pusher
      await pusher.trigger(`user-${friend.requesterId}`, 'friend-accepted', {
        title: '✅ Friend Request Accepted',
        message: `${user?.firstName || user?.username || 'Someone'} accepted your friend request!`,
        friendId: userId,
        friendName: user?.firstName || user?.username,
        timestamp: new Date().toISOString(),
      });

      res.json(friend);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  // Notification routes
  app.get('/api/notifications', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // User preferences routes
  app.get('/api/user/preferences', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const preferences = await storage.getUserPreferences(userId);

      // Return default preferences if none exist
      if (!preferences) {
        const defaultPreferences = {
          notifications: {
            email: true,
            push: true,
            challenge: true,
            event: true,
            friend: true
          },
          appearance: {
            theme: 'system',
            compactView: false,
            language: 'en'
          },
          performance: {
            autoRefresh: true,
            soundEffects: true,
            dataUsage: 'medium'
          },
          regional: {
            currency: 'NGN',
            timezone: 'Africa/Lagos'
          },
          privacy: {
            profileVisibility: 'public',
            activityVisibility: 'friends'
          }
        };
        return res.json(defaultPreferences);
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.patch('/api/user/preferences', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const { notifications, appearance, performance, regional, privacy } = req.body;

      const preferences = await storage.updateUserPreferences(userId, {
        notifications,
        appearance,
        performance,
        regional,
        privacy
      });

      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/wallet/balance', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      console.log(`Fetching balance for user: ${userId}`);

      const balance = await storage.getUserBalance(userId);
      console.log(`Balance result for user ${userId}:`, balance);

      res.json(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Wallet deposit route
  app.post('/api/wallet/deposit', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("PAYSTACK_SECRET_KEY environment variable not set");
        return res.status(500).json({ message: "Payment service not configured" });
      }

      console.log("Initializing Paystack transaction for user:", userId, "amount:", amount);

      // Generate unique reference with random component to prevent duplicates
      // Sanitize userId by removing colons which Paystack doesn't allow
      const sanitizedUserId = userId.replace(/:/g, '-');
      const uniqueRef = `dep_${sanitizedUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Initialize Paystack transaction
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "dummy@betchat.com", // Dummy email for Paystack, not user email
          amount: amount * 100, // Paystack expects amount in kobo
          currency: 'NGN',
          reference: uniqueRef,
          metadata: {
            userId,
            type: 'deposit'
          }
        })
      });

      const paystackData = await paystackResponse.json();
      console.log("Paystack response:", paystackData);

      if (!paystackData.status) {
        console.error("Paystack error:", paystackData);
        return res.status(400).json({ message: paystackData.message || "Failed to initialize payment" });
      }

      console.log("Sending authorization URL:", paystackData.data.authorization_url);
      res.json({ 
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_' // You'll need to set this in secrets
      });
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });

  // Wallet swap route (Money ↔ Coins)
  app.post('/api/wallet/swap', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const { amount, fromCurrency } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!fromCurrency || !['money', 'coins'].includes(fromCurrency)) {
        return res.status(400).json({ message: "Invalid currency type" });
      }

      console.log(`Processing swap for user ${userId}: ${amount} ${fromCurrency}`);

      // Get current balance
      const balance = await storage.getUserBalance(userId);

      if (fromCurrency === 'money') {
        // Money to Coins (1:10 ratio)
        if (balance.balance < amount) {
          return res.status(400).json({ message: "Insufficient money balance" });
        }

        const coinsToAdd = amount * 10;

        // Create debit transaction for money
        await storage.createTransaction({
          userId,
          type: 'currency_swap',
          amount: (-amount).toString(),
          description: `Swapped ${formatBalance(amount)} to ${coinsToAdd.toLocaleString()} coins`,
          status: 'completed'
        });

        // Update user coins
        await db
          .update(users)
          .set({ 
            coins: sql`${users.coins} + ${coinsToAdd}`,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // Create notification
        await storage.createNotification({
          userId,
          type: 'currency_swap',
          title: '🔄 Currency Swap Complete',
          message: `Successfully swapped ${formatBalance(amount)} for ${coinsToAdd.toLocaleString()} coins!`,
          data: { 
            fromAmount: amount,
            toAmount: coinsToAdd,
            fromCurrency: 'money',
            toCurrency: 'coins'
          },
        });

        console.log(`✅ Swapped ${formatBalance(amount)} to ${coinsToAdd} coins for user ${userId}`);
        res.json({ 
          message: "Swap completed successfully",
          fromAmount: amount,
          toAmount: coinsToAdd,
          fromCurrency: 'money',
          toCurrency: 'coins'
        });

      } else {
        // Coins to Money (10:1 ratio)
        if (balance.coins < amount) {
          return res.status(400).json({ message: "Insufficient coins balance" });
        }

        const moneyToAdd = amount * 0.1;

        // Update user coins (deduct)
        await db
          .update(users)
          .set({ 
            coins: sql`${users.coins} - ${amount}`,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // Create credit transaction for money
        await storage.createTransaction({
          userId,
          type: 'currency_swap',
          amount: moneyToAdd.toString(),
          description: `Swapped ${amount.toLocaleString()} coins to ${formatBalance(moneyToAdd)}`,
          status: 'completed'
        });

        // Create notification
        await storage.createNotification({
          userId,
          type: 'currency_swap',
          title: '🔄 Currency Swap Complete',
          message: `Successfully swapped ${amount.toLocaleString()} coins for ${formatBalance(moneyToAdd)}!`,
          data: { 
            fromAmount: amount,
            toAmount: moneyToAdd,
            fromCurrency: 'coins',
            toCurrency: 'money'
          },
        });

        console.log(`✅ Swapped ${amount} coins to ${formatBalance(moneyToAdd)} for user ${userId}`);
        res.json({ 
          message: "Swap completed successfully",
          fromAmount: amount,
          toAmount: moneyToAdd,
          fromCurrency: 'coins',
          toCurrency: 'money'
        });
      }

      // Send real-time notification via Pusher
      try {
        await pusher.trigger(`user-${userId}`, 'currency-swap', {
          id: Date.now(),
          type: 'currency_swap',
          title: '🔄 Currency Swap Complete',
          message: fromCurrency === 'money' 
            ? `Swapped ${formatBalance(amount)} for ${(amount * 10).toLocaleString()} coins!`
            : `Swapped ${amount.toLocaleString()} coins for ${formatBalance(amount * 0.1)}!`,
          timestamp: new Date().toISOString(),
        });
      } catch (pusherError) {
        console.error("Error sending Pusher notification:", pusherError);
      }

    } catch (error) {
      console.error("Error processing swap:", error);
      res.status(500).json({ message: "Failed to process swap" });
    }
  });

  // Wallet withdraw route
  app.post('/api/wallet/withdraw', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      console.log(`Processing withdrawal for user ${userId}: ${formatBalance(amount)}`);

      // Get current balance
      const balance = await storage.getUserBalance(userId);

      if (balance.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create debit transaction for withdrawal
      await storage.createTransaction({
        userId,
        type: 'withdrawal',
        amount: (-amount).toString(),
        description: `Withdrawal of ${formatBalance(amount)}`,
        status: 'completed'
      });

      // Create notification
      await storage.createNotification({
        userId,
        type: 'withdrawal',
        title: '💸 Withdrawal Complete',
        message: `Successfully withdrew ${formatBalance(amount)} from your account!`,
        data: { 
          amount: amount,
          type: 'withdrawal'
        },
      });

      // Send real-time notification via Pusher
      try {
        await pusher.trigger(`user-${userId}`, 'withdrawal', {
          id: Date.now(),
          type: 'withdrawal',
          title: '💸 Withdrawal Complete',
          message: `Withdrew ${formatBalance(amount)} from your account!`,
          timestamp: new Date().toISOString(),
        });
      } catch (pusherError) {
        console.error("Error sending Pusher notification:", pusherError);
      }

      console.log(`✅ Withdrawal of ${formatBalance(amount)} completed for user ${userId}`);
      res.json({ 
        message: "Withdrawal completed successfully",
        amount: amount
      });

    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Paystack webhook for payment verification
  app.post('/api/webhook/paystack', async (req, res) => {
    try {
      const hash = req.headers['x-paystack-signature'];
      let event = req.body;

      console.log('Webhook received:', {
        headers: req.headers,
        bodyType: typeof event,
        hasBody: !!event
      });

      // If body is already parsed as object, use it directly
      if (typeof event === 'object' && event !== null) {
        console.log('Using pre-parsed webhook body');
      } else {
        // Handle string bodies
        const bodyString = typeof event === 'string' ? event : JSON.stringify(event);

        // Verify signature if secret key is available
        if (process.env.PAYSTACK_SECRET_KEY) {
          const expectedHash = require('crypto')
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(bodyString)
            .digest('hex');

          console.log('Signature verification:', {
            receivedHash: hash,
            expectedHash,
            match: hash === expectedHash
          });

          if (hash !== expectedHash) {
            console.log('Invalid webhook signature');
            return res.status(400).json({ message: "Invalid signature" });
          }
        }

        // Parse the event if it's a string
        try {
          event = JSON.parse(bodyString);
        } catch (parseError) {
          console.error('Failed to parse webhook body:', parseError);
          return res.status(400).json({ message: "Invalid JSON" });
        }
      }

      console.log('Webhook event:', event);

      if (event.event === 'charge.success') {
        const { reference, amount, metadata, status } = event.data;

        console.log('Processing charge.success:', {
          reference,
          amount,
          metadata,
          status
        });

        if (status === 'success' && metadata && metadata.userId) {
          const userId = metadata.userId;
          const depositAmount = amount / 100; // Convert from kobo to naira

          console.log(`Processing successful deposit for user ${userId}: ₦${depositAmount}`);

          try {
            // Create transaction record
            await storage.createTransaction({
              userId,
              type: 'deposit',
              amount: depositAmount.toString(),
              description: `Deposit via Paystack - ${reference}`,
              status: 'completed',
            });

            // Create notification for successful deposit
            await storage.createNotification({
              userId,
              type: 'deposit',
              title: '💰 Deposit Successful',
              message: `Your deposit of ₦${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been credited to your account!`,
              data: { 
                amount: depositAmount,
                reference: reference,
                type: 'deposit',
                timestamp: new Date().toISOString()
              },
            });

            console.log(`✅ Deposit completed for user ${userId}: ₦${depositAmount}`);
          } catch (dbError) {
            console.error('Database error while creating transaction:', dbError);
            return res.status(500).json({ message: "Database error" });
          }
        } else {
          console.log('⚠️ Charge success but invalid status or missing metadata:', {
            status,
            hasMetadata: !!metadata,
            userId: metadata?.userId
          });
        }
      } else {
        console.log('Webhook event not charge.success:', event.event);
      }

      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("❌ Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Manual payment verification (for testing)
  app.post('/api/wallet/verify-payment', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { reference } = req.body;
      const userId = getUserId(req);

      if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
      }

      console.log(`Manual verification requested for reference: ${reference} by user: ${userId}`);

      if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error("PAYSTACK_SECRET_KEY not set");
        return res.status(500).json({ message: "Payment service not configured" });
      }

      // Verify payment with Paystack
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        }
      });

      const verifyData = await verifyResponse.json();
      console.log('Paystack verification response:', {
        status: verifyData.status,
        data: verifyData.data ? {
          status: verifyData.data.status,
          amount: verifyData.data.amount,
          reference: verifyData.data.reference,
          metadata: verifyData.data.metadata
        } : null
      });

      if (verifyData.status && verifyData.data && verifyData.data.status === 'success') {
        const { amount, metadata, reference: txRef } = verifyData.data;
        const depositAmount = amount / 100; // Convert from kobo to naira

        console.log(`Processing payment verification:`, {
          amount: depositAmount,
          metadata,
          reference: txRef,
          requestedBy: userId
        });

        // Validate the user matches
        if (metadata && metadata.userId === userId) {
          // Check if transaction already exists by reference
          const existingTransactions = await storage.getTransactions(userId);
          const exists = existingTransactions.some((t: any) => 
            t.reference === reference || 
            t.description?.includes(reference) ||
            t.reference === txRef
          );

          if (!exists) {
            console.log(`Creating new deposit transaction for user ${userId}: ₦${depositAmount}`);

            const newTransaction = await storage.createTransaction({
              userId,
              type: 'deposit',
              amount: depositAmount.toString(),
              description: `Deposit via Paystack - ${reference}`,
              reference: reference,
              status: 'completed',
            });

            console.log(`Transaction created:`, newTransaction);

            // Verify the transaction was created
            const verifyTransactions = await storage.getTransactions(userId);
            console.log(`All transactions after creation:`, verifyTransactions.map(t => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              status: t.status,
              reference: t.reference
            })));

            // Get updated balance
            const updatedBalance = await storage.getUserBalance(userId);
            console.log(`Updated balance for user ${userId}:`, updatedBalance);

            // Create notification for successful deposit
            await storage.createNotification({
              userId,
              type: 'deposit',
              title: '💰 Deposit Successful',
              message: `Your deposit of ₦${depositAmount.toLocaleString()} has been credited to your account!`,
              data: { 
                amount: depositAmount,
                reference: reference,
                type: 'deposit',
                timestamp: new Date().toISOString()
              },
            });

            console.log(`✅ Manual verification completed for user ${userId}: ₦${depositAmount}`);
            res.json({ 
              message: "Payment verified successfully", 
              amount: depositAmount,
              newBalance: updatedBalance 
            });
          } else {
            console.log(`Transaction with reference ${reference} already exists for user ${userId}`);
            const currentBalance = await storage.getUserBalance(userId);
            res.json({ 
              message: "Payment already processed", 
              amount: depositAmount,
              currentBalance: currentBalance 
            });
          }
        } else {
          console.log('Metadata validation failed:', {
            metadataUserId: metadata?.userId,
            requestUserId: userId,
            hasMetadata: !!metadata
          });
          res.status(400).json({ message: "Payment verification failed - user mismatch" });
        }
      } else {
        console.log('Payment verification failed:', {
          paystackStatus: verifyData.status,
          dataStatus: verifyData.data?.status,
          message: verifyData.message
        });
        res.status(400).json({ message: verifyData.message || "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Wallet withdrawal route
  app.post('/api/wallet/withdraw', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, method } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const balance = await storage.getUserBalance(userId);
      if (balance.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create withdrawal transaction
      await storage.createTransaction({
        userId,
        type: 'withdrawal',
        amount: `-${amount}`,
        description: `Withdrawal via ${method}`,
        status: 'pending',
      });

      // Create notification
      await storage.createNotification({
        userId,
        type: 'withdrawal',
        title: '📤 Withdrawal Requested',
        message: `Your withdrawal of ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is being processed.`,
        data: { amount, method },
      });

      res.json({ message: "Withdrawal request submitted successfully" });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Global chat routes
  app.get('/api/chat/messages', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const messages = await storage.getGlobalChatMessages(50);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching global chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/messages', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Get user info
      const user = await storage.getUser(userId);

      // Create message in BetChat
      const newMessage = await storage.createGlobalChatMessage({
        userId,
        user: {
          id: user?.id,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
          profileImageUrl: user?.profileImageUrl,
        },
        message: message.trim(),
        source: 'betchat'
      });

      // Broadcast to BetChat users via Pusher
      await pusher.trigger('global-chat', 'new-message', {
        type: 'chat_message',
        message: newMessage,
        source: 'betchat'
      });

      // Forward to Telegram if sync is available
      const telegramSync = getTelegramSync();
      if (telegramSync && telegramSync.isReady()) {
        const senderName = user?.firstName || user?.username || 'BetChat User';
        await telegramSync.sendMessageToTelegram(message.trim(), senderName);
      }

      res.json(newMessage);
    } catch (error) {
      console.error("Error creating global chat message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Telegram sync status route
  app.get('/api/telegram/status', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const telegramSync = getTelegramSync();
      const telegramBot = getTelegramBot();

      let syncStatus = { 
        enabled: false, 
        connected: false, 
        message: "Telegram sync not configured" 
      };

      let botStatus = { 
        enabled: false, 
        connected: false, 
        message: "Telegram bot not configured" 
      };

      if (telegramSync) {
        const isReady = telegramSync.isReady();
        const groupInfo = isReady ? await telegramSync.getGroupInfo() : null;
        syncStatus = {
          enabled: true,
          connected: isReady,
          groupInfo,
          message: isReady ? "Connected and syncing" : "Connecting..."
        };
      }

      if (telegramBot) {
        const connection = await telegramBot.testConnection();
        const channelInfo = connection ? await telegramBot.getChannelInfo() : null;
        botStatus = {
          enabled: true,
          connected: connection,
          channelInfo,
          message: connection ? "Bot connected and ready for broadcasting" : "Bot connection failed"
        };
      }

      res.json({
        sync: syncStatus,
        bot: botStatus
      });
    } catch (error) {
      console.error("Error getting Telegram status:", error);
      res.status(500).json({ message: "Failed to get Telegram status" });
    }
  });

  // Phase 1: Telegram bot webhook for /start command
  app.post('/api/telegram/bot-webhook', async (req, res) => {
    try {
      const update = req.body;

      // Handle /start command - Always show mini-app button
      if (update.message && update.message.text && update.message.text.startsWith('/start')) {
        const chatId = update.message.chat.id;
        const firstName = update.message.from.first_name || 'User';

        console.log(`📱 Received /start from Telegram user ${chatId}`);

        const telegramBot = getTelegramBot();
        if (telegramBot) {
          await telegramBot.sendStartMessage(chatId, firstName);
        }
        return res.json({ ok: true });
      }

      // Handle /balance command
      if (update.message && update.message.text && update.message.text.startsWith('/balance')) {
        const chatId = update.message.chat.id;
        const telegramId = update.message.from.id.toString();

        const telegramBot = getTelegramBot();
        if (telegramBot) {
          const { TelegramLinkingService } = await import('./telegramLinking');
          const user = await TelegramLinkingService.getUserByTelegramId(telegramId);

          if (!user) {
            await telegramBot.sendMessage(chatId, '💰 *Your Wallet*\n\nNo account linked yet. Open the mini-app to get started!');
          } else {
            const balance = await storage.getUserBalance(user.id);
            await telegramBot.sendBalanceNotification(chatId, parseInt(balance.balance || '0'), balance.coins || 0);
          }
        }
        return res.json({ ok: true });
      }

      // Handle /mychallenges command
      if (update.message && update.message.text && update.message.text.startsWith('/mychallenges')) {
        const chatId = update.message.chat.id;
        const telegramId = update.message.from.id.toString();

        const telegramBot = getTelegramBot();
        if (telegramBot) {
          const { TelegramLinkingService } = await import('./telegramLinking');
          const user = await TelegramLinkingService.getUserByTelegramId(telegramId);

          if (!user) {
            await telegramBot.sendMessage(chatId, '⚔️ *Your Challenges*\n\nNo account linked yet. Open the mini-app to get started!');
          } else {
            const challenges = await storage.getChallenges(user.id, 10);
            const activeChallenges = challenges.filter((c: any) => c.status === 'active' || c.status === 'pending');
            await telegramBot.sendChallengesNotification(chatId, activeChallenges.length);
          }
        }
        return res.json({ ok: true });
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.json({ ok: true });
    }
  });

  // Phase 1: Telegram auth verification endpoint
  app.get('/api/telegram/verify-link', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { token } = req.query;
      const userId = getUserId(req);

      console.log(`🔍 Telegram link verification request - Token: ${token}, User: ${userId}`);

      if (!token || typeof token !== 'string') {
        console.log('❌ Invalid token format');
        return res.status(400).json({ success: false, message: 'Invalid token' });
      }

      const { TelegramLinkingService } = await import('./telegramLinking');

      // Verify token
      const linkData = await TelegramLinkingService.verifyLinkToken(token);

      if (!linkData) {
        console.log(`❌ Token verification failed: ${token}`);
        return res.json({ 
          success: false, 
          error: 'invalid_token',
          message: 'Link expired or invalid. Please use /start in Telegram to get a new link.' 
        });
      }

      console.log(`✅ Token verified for Telegram user ${linkData.telegramChatId}`);

      // Link account
      const linked = await TelegramLinkingService.linkTelegramAccount(
        userId,
        linkData.telegramChatId,
        linkData.telegramUsername
      );

      if (!linked) {
        console.log(`❌ Account linking failed - already linked`);
        return res.json({ 
          success: false,
          error: 'already_linked',
          message: 'This Telegram account is already linked to another user.' 
        });
      }

      // Mark token as used
      TelegramLinkingService.markTokenAsUsed(token);

      // Get user info for confirmation
      const user = await storage.getUser(userId);

      // Send confirmation to Telegram
      const telegramBot = getTelegramBot();
      if (telegramBot && user) {
        await telegramBot.sendAccountLinkedConfirmation(
          linkData.telegramChatId,
          user.username || user.firstName || 'User',
          user.coins || 0
        );
      }

      console.log(`✅ Successfully linked Telegram account ${linkData.telegramChatId} to user ${userId}`);

      res.json({ 
        success: true,
        message: 'Account linked successfully!',
        user: {
          telegramId: linkData.telegramChatId,
          telegramUsername: linkData.telegramUsername,
        }
      });
    } catch (error) {
      console.error('❌ Error verifying Telegram link:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Telegram Mini-App: Link account endpoint
  // This endpoint is called from the Telegram mini-app after the user is authenticated with Privy
  app.post('/api/telegram/mini-app/link', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const { telegramId, telegramUsername, telegramFirstName, initData } = req.body;

      if (!telegramId || !initData || !initData.hash) {
        return res.status(400).json({ success: false, message: 'Missing Telegram data' });
      }

      console.log(`🔍 Mini-app link request - User: ${userId}, Telegram ID: ${telegramId}`);

      // Verify the Telegram initData signature
      // The initData is a URL-encoded string with format: user=%7B...%7D&auth_date=...&hash=...
      const { TelegramLinkingService } = await import('./telegramLinking');
      
      // Validate the Telegram signature
      try {
        const isValid = validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
        if (!isValid) {
          console.log('❌ Invalid Telegram signature');
          return res.json({
            success: false,
            message: 'Invalid Telegram signature. Please use the official mini-app link.'
          });
        }
      } catch (signError) {
        console.error('Error validating Telegram signature:', signError);
        return res.json({
          success: false,
          message: 'Failed to validate Telegram data'
        });
      }

      // Link the Telegram account
      const linked = await TelegramLinkingService.linkTelegramAccount(
        userId,
        telegramId.toString(),
        telegramUsername || `user_${telegramId}`
      );

      if (!linked) {
        console.log(`❌ Account linking failed - already linked`);
        return res.json({
          success: false,
          message: 'This Telegram account is already linked to another user.'
        });
      }

      // Send confirmation to Telegram
      const telegramBot = getTelegramBot();
      const user = await storage.getUser(userId);
      if (telegramBot && user) {
        await telegramBot.sendAccountLinkedConfirmation(
          telegramId,
          user.username || user.firstName || 'User',
          user.coins || 0
        );
      }

      console.log(`✅ Successfully linked Telegram account ${telegramId} to user ${userId}`);

      res.json({
        success: true,
        message: 'Account linked successfully!'
      });
    } catch (error) {
      console.error('❌ Error linking mini-app account:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Telegram Mini-App: Auth endpoint (Telegram-only login)
  // Verify initData, create or get user, then create a server session via req.login
  app.post('/api/telegram/mini-app/auth', async (req, res) => {
    try {
      const { initData } = req.body;
      if (!initData || !initData.hash) {
        return res.status(400).json({ success: false, message: 'Missing initData' });
      }

      const isValid = validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid Telegram signature' });
      }

      const telegramUser = initData.user;
      if (!telegramUser || !telegramUser.id) {
        return res.status(400).json({ success: false, message: 'Invalid Telegram user data' });
      }

      // Create or find user in DB
      const telegramId = telegramUser.id.toString();
      const telegramUserId = `telegram_${telegramId}`;
      let user = await storage.getUser(telegramUserId);
      if (!user) {
        const username = telegramUser.username || `tg_${telegramId}`;
        user = await storage.createUser({
          id: telegramUserId,
          firstName: telegramUser.first_name || username,
          username: username,
          email: `${telegramUserId}@telegram.betchat.local`,
          profileImageUrl: telegramUser.photo_url || null,
          isTelegramUser: true,
          telegramId: telegramId,
          coins: 0,
          points: 0,
          level: 1,
          xp: 0,
        });
      }

      // Login the user (passport session)
      req.login(user, (err: any) => {
        if (err) {
          console.error('Error logging in Telegram user:', err);
          return res.status(500).json({ success: false, message: 'Failed to create session' });
        }
        console.log(`✅ Telegram session created for ${user.id}`);
        return res.json({ success: true, user: { id: user.id, username: user.username, firstName: user.firstName } });
      });
    } catch (error) {
      console.error('❌ Telegram mini-app auth error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Telegram Bot API: Get user data for bot
  // Called by the independent Telegram bot service
  // No authentication required - bot only needs telegramId which is public
  app.get('/api/telegram/user/:telegramId', async (req, res) => {
    try {
      const { telegramId } = req.params;

      console.log(`📱 Bot API request for Telegram user ${telegramId}`);

      // Find user by telegram ID
      const { TelegramLinkingService } = await import('./telegramLinking');
      const user = await TelegramLinkingService.getUserByTelegramId(telegramId);

      if (!user) {
        return res.json({
          user: null,
          message: 'User not found'
        });
      }

      // Get user balance
      const balance = await storage.getUserBalance(user.id);

      // Get active challenges count
      const allChallenges = await storage.getChallenges(user.id, 100);
      const activeChallenges = allChallenges.filter((c: any) => 
        c.status === 'active' || c.status === 'pending'
      ).length;

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          balance: balance.balance || '0',
          coins: balance.coins || 0,
          activeChallenges,
          telegramId
        }
      });
    } catch (error) {
      console.error('❌ Bot API error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  });

  // Helper function to validate Telegram WebApp initData
  function validateTelegramWebAppData(
    initData: any,
    botToken: string
  ): boolean {
    try {
      // Extract hash from initData
      const hash = initData.hash;
      if (!hash) return false;

      // Create data check string (all params except hash, sorted by key)
      const dataCheckString = Object.entries(initData)
        .filter(([key]) => key !== 'hash')
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `${key}=${JSON.stringify(value)}`;
          }
          return `${key}=${value}`;
        })
        .join('\n');

      // Create HMAC-SHA256
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return computedHash === hash;
    } catch (error) {
      console.error('Error validating Telegram data:', error);
      return false;
    }
  }

  // Test Telegram broadcast endpoint
  app.post('/api/telegram/test-broadcast', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const telegramBot = getTelegramBot();

      if (!telegramBot) {
        return res.status(400).json({ message: "Telegram bot not configured" });
      }

      const message = req.body.message || "🧪 Test message from BetChat";
      const success = await telegramBot.sendCustomMessage(message);

      res.json({ 
        success, 
        message: success ? "Message sent successfully" : "Failed to send message - Make sure bot is added to your channel as admin" 
      });
    } catch (error) {
      console.error("Error testing Telegram broadcast:", error);
      res.status(500).json({ message: "Failed to test Telegram broadcast" });
    }
  });

  // Broadcast existing events to Telegram channel
  app.post('/api/telegram/broadcast-existing', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const telegramBot = getTelegramBot();

      if (!telegramBot) {
        return res.status(400).json({ message: "Telegram bot not configured" });
      }

      // Get all existing events
      const existingEvents = await storage.getEvents();
      let successCount = 0;
      let totalCount = existingEvents.length;

      for (const event of existingEvents) {
        try {
          // Get creator info
          const creator = await storage.getUser(event.creatorId);

          const success = await telegramBot.broadcastEvent({
            id: event.id,
            title: event.title,
            description: event.description || undefined,
            creator: {
              name: creator?.firstName || creator?.username || 'Unknown',
              username: creator?.username || undefined,
            },
            entryFee: event.entryFee.toString(),
            endDate: event.endDate.toISOString(),
            is_private: event.isPrivate,
            max_participants: event.maxParticipants,
            category: event.category,
          });

          if (success) {
            successCount++;
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to broadcast event ${event.id}:`, error);
        }
      }

      res.json({ 
        success: successCount > 0, 
        message: `Broadcasted ${successCount} out of ${totalCount} existing events`,
        details: { successCount, totalCount }
      });
    } catch (error) {
      console.error("Error broadcasting existing events:", error);
      res.status(500).json({ message: "Failed to broadcast existing events" });
    }
  });

  // Follow/Unfollow user route
  app.post('/api/users/:userId/follow', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;

      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const result = await storage.toggleFollow(followerId, followingId);

      if (result.action === 'followed') {
        // Get follower info
        const follower = await storage.getUser(followerId);

        // Create notification for followed user
        await storage.createNotification({
          userId: followingId,
          type: 'new_follower',
          title: '👤 New Follower',
          message: `@${follower?.firstName || follower?.username || 'Someone'} is now following you!`,
          data: { 
            followerId: followerId,
            followerName: follower?.firstName || follower?.username
          },
        });

        // Send real-time notification via Pusher
        await pusher.trigger(`user-${followingId}`, 'new-follower', {
          title: '👤 New Follower',
          message: `@${follower?.firstName || follower?.username || 'Someone'} is now following you!`,
          followerId: followerId,
          followerName: follower?.firstName || follower?.username,
          timestamp: new Date().toISOString(),
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  // Track sharing and send notification
  app.post('/api/track-share', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform, contentType, contentId, url } = req.body;

      // Get user info
      const user = await storage.getUser(userId);

      // Create notification for successful share
      let notificationTitle = '🔗 Content Shared!';
      let notificationMessage = '';

      if (contentType === 'event') {
        const event = await storage.getEventById(parseInt(contentId));
        notificationMessage = `You shared "${event?.title}" on ${platform}! Keep spreading the word to earn rewards.`;
      } else if (contentType === 'challenge') {
        const challenge = await storage.getChallengeById(parseInt(contentId));
        notificationMessage = `You shared your challenge "${challenge?.title}" on ${platform}! More shares = more participants.`;
      } else if (contentType === 'profile') {
        notificationMessage = `You shared your profile on ${platform}! Great way to grow your network.`;
      } else {
        notificationMessage = `You shared content on ${platform}! Keep engaging to boost your reach.`;
      }

      await storage.createNotification({
        userId,
        type: 'content_shared',
        title: notificationTitle,
        message: notificationMessage,
        data: { 
          platform,
          contentType,
          contentId,
          url,
          sharedAt: new Date().toISOString()
        },
      });

      // Send real-time notification via Pusher
      await pusher.trigger(`user-${userId}`, 'content-shared', {
        title: notificationTitle,
        message: notificationMessage,
        platform,
        contentType,
        timestamp: new Date().toISOString(),
      });

      res.json({ success: true, message: 'Share tracked successfully' });
    } catch (error) {
      console.error('Error tracking share:', error);
      res.status(500).json({ message: 'Failed to track share' });
    }
  });

  // Get navigation badge counts route
  app.get('/api/navigation/badges', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get profile-related notification count (unread profile-specific notifications)
      const profileNotifications = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          sql`type IN ('new_follower', 'achievement_unlocked', 'daily_signin_reminder', 'winner_challenge', 'loser_encourage')`
        ));

      // Get new events count (events posted in last 24 hours)
      const newEvents = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(events)
        .where(sql`created_at >= NOW() - INTERVAL '24 hours'`);

      // Get new challenges count (challenges posted in last 24 hours)
      const newChallenges = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(challenges)
        .where(sql`created_at >= NOW() - INTERVAL '24 hours'`);

      res.json({
        profile: Number(profileNotifications[0]?.count || 0),
        events: Number(newEvents[0]?.count || 0),
        challenges: Number(newChallenges[0]?.count || 0)
      });
    } catch (error) {
      console.error("Error fetching navigation badges:", error);
      res.status(500).json({ message: "Failed to fetch navigation badges" });
    }
  });

  // Get user profile route
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Tip user route
  app.post('/api/users/:userId/tip', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const senderId = req.user.claims.sub;
      const receiverId = req.params.userId;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (senderId === receiverId) {
        return res.status(400).json({ message: "Cannot tip yourself" });
      }

      const balanceResult = await storage.getUserBalance(senderId);
      if (balanceResult.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Get sender and receiver info
      const sender = await storage.getUser(senderId);
      const receiver = await storage.getUser(receiverId);

      // Create transactions
      await storage.createTransaction({
        userId: senderId,
        type: 'tip_sent',
        amount: `-${amount}`,
        description: `Tip sent to @${receiver?.firstName || receiver?.username || 'user'}`,
        relatedId: receiverId,
      });

      await storage.createTransaction({
        userId: receiverId,
        type: 'tip_received',
        amount: amount.toString(),
        description: `Tip received from @${sender?.firstName || sender?.username || 'user'}`,
        relatedId: senderId,
      });

      // Create notification for receiver
      await storage.createNotification({
        userId: receiverId,
        type: 'tip_received',
        title: '💰 Tip Received',
        message: `You received a tip of ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from @${sender?.firstName || sender?.username || 'Someone'}!`,
        data: { 
          amount: amount,
          senderId: senderId,
          senderName: sender?.firstName || sender?.username
        },
      });

      // Create notification for sender (confirmation)
      await storage.createNotification({
        userId: senderId,
        type: 'tip_sent',
        title: '💸 Tip Sent',
        message: `You tipped @${receiver?.firstName || receiver?.username || 'User'} ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`,
        data: { 
          amount: amount,
          receiverId: receiverId,
          receiverName: receiver?.firstName || receiver?.username
        },
      });

      // Send real-time notifications via Pusher
      await pusher.trigger(`user-${receiverId}`, 'tip-received', {
        title: '💰 Tip Received',
        message: `You received a tip of ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from @${sender?.firstName || sender?.username || 'Someone'}!`,
        amount: amount,
        senderId: senderId,
        senderName: sender?.firstName || sender?.username,
        timestamp: new Date().toISOString(),
      });

      await pusher.trigger(`user-${senderId}`, 'tip-sent', {
        title: '💸 Tip Sent',
        message: `You tipped @${receiver?.firstName || receiver?.username || 'User'} ₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`,
        amount: amount,
        receiverId: receiverId,
        receiverName: receiver?.firstName || receiver?.username,
        timestamp: new Date().toISOString(),
      });

      res.json({ message: "Tip sent successfully" });
    } catch (error) {
      console.error("Error sending tip:", error);
      res.status(500).json({ message: "Failed to send tip" });
    }
  });

  // Open Graph metadata endpoint
  app.get('/api/og-metadata', async (req, res) => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }

      // Simple OG metadata extraction
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Bantah-Bot/1.0',
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        return res.status(400).json({ error: 'Failed to fetch URL' });
      }

      const html = await response.text();
      const ogData: Record<string, string> = {};

      // Extract basic OG tags
      const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*?)["']/i);
      if (titleMatch) ogData.title = titleMatch[1];

      const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*?)["']/i);
      if (descMatch) ogData.description = descMatch[1];

      const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*?)["']/i);
      if (imageMatch) ogData.image = imageMatch[1];

      res.json(ogData);
    } catch (error) {
      console.error('Error fetching OG metadata:', error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  // Daily Sign-In Routes
  app.get('/api/daily-signin/status', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);

      // First, check and create daily login record if needed
      await storage.checkDailyLogin(userId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user has already signed in today
      const todayLogin = await db
        .select()
        .from(dailyLogins)
        .where(and(
          eq(dailyLogins.userId, userId),
          sql`DATE(${dailyLogins.date}) = ${today.toISOString().split('T')[0]}`
        ))
        .limit(1);

      const hasSignedInToday = todayLogin.length > 0;
      const hasClaimed = hasSignedInToday ? todayLogin[0].claimed : false;

      // Get current streak
      const latestLogin = await db
        .select()
        .from(dailyLogins)
        .where(eq(dailyLogins.userId, userId))
        .orderBy(sql`${dailyLogins.date} DESC`)
        .limit(1);

      let currentStreak = 1;
      if (latestLogin.length > 0) {
        currentStreak = latestLogin[0].streak;

        // If they haven't signed in today, reset streak if yesterday wasn't their last login
        if (!hasSignedInToday) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          const lastLoginDate = new Date(latestLogin[0].date);
          lastLoginDate.setHours(0, 0, 0, 0);

          if (lastLoginDate.getTime() !== yesterday.getTime()) {
            currentStreak = 1; // Reset streak
          } else {
            currentStreak = latestLogin[0].streak + 1; // Continue streak
          }
        }
      }

      // Calculate points to award (base 50 + streak bonus)
      const basePoints = 50;
      const streakBonus = Math.min(currentStreak * 10, 200); // Max 200 bonus
      const pointsToAward = basePoints + streakBonus;

      res.json({
        hasSignedInToday,
        hasClaimed,
        hasClaimedToday: hasClaimed,
        canClaim: hasSignedInToday && !hasClaimed,
        streak: currentStreak,
        currentStreak,
        pointsToAward,
        showModal: hasSignedInToday && !hasClaimed
      });
    } catch (error) {
      console.error("Error checking daily sign-in status:", error);
      res.status(500).json({ message: "Failed to check daily sign-in status" });
    }
  });

  app.post('/api/daily-signin/claim', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already claimed today
      const todayLogin = await db
        .select()
        .from(dailyLogins)
        .where(and(
          eq(dailyLogins.userId, userId),
          sql`DATE(${dailyLogins.date}) = ${today.toISOString().split('T')[0]}`
        ))
        .limit(1);

      if (todayLogin.length === 0) {
        return res.status(400).json({ message: "No sign-in record found for today" });
      }

      if (todayLogin[0].claimed) {
        return res.status(400).json({ message: "Daily bonus already claimed" });
      }

      const pointsEarned = todayLogin[0].pointsEarned;

      // Mark as claimed and award points
      await db
        .update(dailyLogins)
        .set({ claimed: true })
        .where(eq(dailyLogins.id, todayLogin[0].id));

      // Add points to user balance
      await db
        .update(users)
        .set({ 
          points: sql`${users.points} + ${pointsEarned}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: 'daily_signin',
        amount: pointsEarned.toString(),
        description: `Daily sign-in bonus - Day ${todayLogin[0].streak}`,
        status: 'completed'
      });

      res.json({ 
        message: "Daily bonus claimed successfully",
        pointsEarned,
        streak: todayLogin[0].streak
      });
    } catch (error) {
      console.error("Error claiming daily sign-in:", error);
      res.status(500).json({ message: "Failed to claim daily sign-in bonus" });
    }
  });

  // Get daily login history for user
  app.get('/api/daily-signin/history', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const history = await db
        .select()
        .from(dailyLogins)
        .where(eq(dailyLogins.userId, userId))
        .orderBy(sql`${dailyLogins.date} DESC`)
        .limit(30); // Last 30 days

      res.json(history);
    } catch (error) {
      console.error("Error fetching daily login history:", error);
      res.status(500).json({ message: "Failed to fetch daily login history" });
    }
  });

  // Get all users route (for user search and listing)
  app.get('/api/users', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User stats and history routes
  app.get('/api/user/stats', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/user/created-events', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserCreatedEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user created events:", error);
      res.status(500).json({ message: "Failed to fetch user created events" });
    }
  });

  app.get('/api/user/joined-events', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserJoinedEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user joined events:", error);
      res.status(500).json({ message: "Failed to fetch user joined events" });
    }
  });



  app.get('/api/user/achievements', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.get('/api/users/:userId/profile', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId, currentUserId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Event lifecycle management routes
  app.post('/api/admin/events/:id/notify-starting', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.notifyEventStarting(eventId);
      res.json({ message: "Event starting notifications sent" });
    } catch (error) {
      console.error("Error sending event starting notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  app.post('/api/admin/events/:id/notify-ending', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.notifyEventEnding(eventId);
      res.json({ message: "Event ending notifications sent" });
    } catch (error) {
      console.error("Error sending event ending notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // Admin event management routes
  app.delete('/api/admin/events/:id', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  app.patch('/api/admin/events/:id/chat', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { enabled } = req.body;
      await storage.toggleEventChat(eventId, enabled);
      res.json({ message: `Event chat ${enabled ? 'enabled' : 'disabled'}`, enabled });
    } catch (error) {
      console.error("Error toggling event chat:", error);
      res.status(500).json({ message: "Failed to toggle event chat" });
    }
  });

  // Admin challenge management routes
  app.delete('/api/admin/challenges/:id', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      await storage.deleteChallenge(challengeId);
      res.json({ message: "Challenge deleted successfully" });
    } catch (error) {
      console.error("Error deleting challenge:", error);
      res.status(500).json({ message: "Failed to delete challenge" });
    }
  });

  // Admin statistics routes

  // Get current admin users
  app.get('/api/admin/list', isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const admins = await storage.getAdminUsers();
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  // Smart Search API
  app.get('/api/search', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length < 3) {
        return res.json([]);
      }

      const userId = getUserId(req);
      const search = `%${searchTerm.toLowerCase()}%`;

      // Search events
      const eventResults = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          imageUrl: events.image_url,
          createdAt: events.createdAt,
          status: events.status,
        })
        .from(events)
        .where(
          sql`LOWER(${events.title}) LIKE ${search} OR LOWER(${events.description}) LIKE ${search}`
        )
        .limit(5);

      // Search challenges  
      const challengeResults = await db
        .select({
          id: challenges.id,
          title: challenges.title,
          description: challenges.description,
          amount: challenges.amount,
          createdAt: challenges.createdAt,
          status: challenges.status,
        })
        .from(challenges)
        .where(
          sql`LOWER(${challenges.title}) LIKE ${search} OR LOWER(${challenges.description}) LIKE ${search}`
        )
        .limit(5);

      // Search users
      const userResults = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          sql`LOWER(${users.username}) LIKE ${search} OR LOWER(${users.firstName}) LIKE ${search}`
        )
        .limit(5);

      // Format results
      const results = [
        ...eventResults.map(event => ({
          id: event.id.toString(),
          type: 'event' as const,
          title: event.title,
          description: event.description,
          imageUrl: event.imageUrl,
          createdAt: event.createdAt,
          status: event.status,
          participantCount: 0, // TODO: Add participant count query
        })),
        ...challengeResults.map(challenge => ({
          id: challenge.id.toString(),
          type: 'challenge' as const,
          title: challenge.title,
          description: challenge.description,
          amount: Number(challenge.amount),
          createdAt: challenge.createdAt,
          status: challenge.status,
        })),
        ...userResults.map(user => ({
          id: user.id,
          type: 'user' as const,
          title: user.firstName || user.username || 'Unknown User',
          username: user.username,
          createdAt: user.createdAt,
        })),
      ];

      // Sort by relevance and creation date
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(results.slice(0, 10));
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Public profile routes (no authentication required)
  app.get('/api/public/profile/:username', async (req, res) => {
    try {
      const { username } = req.params;

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user stats
      const stats = await storage.getUserStats(user.id);

      // Return public profile data (excluding sensitive information)
      const publicProfile = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        profileImageUrl: user.profileImageUrl,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        createdAt: user.createdAt,
        stats: {
          wins: stats.wins || 0,
          activeChallenges: stats.activeChallenges || 0,
          totalEarnings: stats.totalEarnings || 0,
        }
      };

      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching public profile:", error);
      res.status(500).json({ message: "Failed to fetch public profile" });
    }
  });

  app.get('/api/public/achievements/:username', async (req, res) => {
    try {
      const { username } = req.params;

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user achievements
      const achievements = await storage.getUserAchievements(user.id);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching public achievements:", error);
      res.status(500).json({ message: "Failed to fetch public achievements" });
    }
  });

  app.get('/api/public/events/:username', async (req, res) => {
    try {
      const { username } = req.params;

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's public events (recent 10)
      const events = await storage.getUserCreatedEvents(user.id);

      // Filter out private events and return only public data
      const publicEvents = events
        .filter((event: any) => !event.isPrivate)
        .slice(0, 10)
        .map((event: any) => ({
          id: event.id,
          title: event.title,
          category: event.category,
          status: event.status,
          createdAt: event.createdAt,
          endDate: event.endDate,
        }));

      res.json(publicEvents);
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ message: "Failed to fetch public events" });
    }
  });

  // Redirect old /u/:username format to new /@username format
  app.get('/u/:username', async (req, res) => {
    const { username } = req.params;
    res.redirect(301, `/@${username}`);
  });

  // Server-side route for events/:id with OG metadata for social sharing
  app.get('/events/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Check if this is likely a social media crawler
      const userAgent = req.get('User-Agent') || '';
      console.log(`[EVENTS ROUTE] Event ${id}, User-Agent: ${userAgent}`);

      const isCrawler = userAgent.includes('facebookexternalhit') || 
                       userAgent.includes('Twitterbot') || 
                       userAgent.includes('LinkedInBot') ||
                       userAgent.includes('WhatsApp') ||
                       userAgent.includes('TelegramBot') ||
                       userAgent.includes('SkypeUriPreview');

      console.log(`[EVENTS ROUTE] isCrawler: ${isCrawler}`);

      if (isCrawler) {
        console.log(`[EVENTS ROUTE] Generating OG meta for event ${id}`);
        const ogMeta = await generateEventOGMeta(id, baseUrl);
        console.log(`[EVENTS ROUTE] Generated OG meta:`, ogMeta.title);

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ogMeta.title}</title>
    ${generateOGMetaTags(ogMeta)}
</head>
<body>
    <h1>${ogMeta.title}</h1>
    <p>${ogMeta.description}</p>
    <p><a href="${baseUrl}/events/${id}">View Event on Bantah</a></p>
</body>
</html>`;

        res.set('Content-Type', 'text/html');
        res.send(html);
        return;
      }

      // For regular browsers, serve the React app (will be handled by client-side routing)
      res.redirect(`/#/events/${id}`);
    } catch (error) {
      console.error('Error generating event page:', error);
      res.redirect('/#/events');
    }
  });

  app.get('/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const ogMeta = await generateProfileOGMeta(userId, baseUrl);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${generateOGMetaTags(ogMeta)}
    <script>
      // Redirect to main app
      window.location.href = '/#/profile/${userId}';
    </script>
</head>
<body>
    <p>Redirecting to Bantah...</p>
    <a href="/#/profile/${userId}">Click here if you're not redirected automatically</a>
</body>
</html>`;

      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating profile page:', error);
      res.redirect('/#/profile');
    }
  });

  // Stories API endpoints
  app.get('/api/stories', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const stories = await storage.getActiveStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post('/api/stories', isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const storyData = req.body;
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.patch('/api/stories/:id', isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const storyId = parseInt(req.params.id);
      const updates = req.body;
      const story = await storage.updateStory(storyId, updates);
      res.json(story);
    } catch (error) {
      console.error("Error updating story:", error);
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  app.delete('/api/stories/:id', isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const storyId = parseInt(req.params.id);
      await storage.deleteStory(storyId);
      res.json({ message: "Story deleted successfully" });
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  app.post('/api/stories/:id/view', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const storyId = parseInt(req.params.id);
      await storage.markStoryAsViewed(storyId, userId);
      res.json({ message: "Story marked as viewed" });
    } catch (error) {
      console.error("Error marking story as viewed:", error);
      res.status(500).json({ message: "Failed to mark story as viewed" });
    }
  });

  // Image upload route for event banners
  app.post('/api/upload/image', PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!req.files || !req.files.image) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(imageFile.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      }

      // Generate unique filename
      const fileExtension = imageFile.name.split('.').pop();
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const uploadPath = `./attached_assets/${uniqueFilename}`;

      // Move file to upload directory
      await imageFile.mv(uploadPath);

      // Return the image URL
      const imageUrl = `/attached_assets/${uniqueFilename}`;

      console.log(`Image uploaded successfully: ${imageUrl} by user ${userId}`);

      res.json({ 
        success: true, 
        imageUrl: imageUrl,
        filename: uniqueFilename
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Serve uploaded images
  app.use('/attached_assets', (await import('express')).static('./attached_assets'));

  // Setup OG image generation routes
  setupOGImageRoutes(app, storage);

  // Add leaderboard endpoint
  app.get("/api/leaderboard", PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      console.log(`Leaderboard query returned ${leaderboard.length} users`);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get user stats for performance comparison
  app.get("/api/performance-stats", PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Bant Map - Get all users with their category preferences for map visualization
  app.get("/api/bant-map", PrivyAuthMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);

      // Get all active users with basic info
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          level: users.level,
          xp: users.xp,
          coins: users.coins,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .where(eq(users.status, 'active'))
        .orderBy(desc(users.level), desc(users.xp));

      // Get current user's friends
      const userFriends = await db
        .select({
          requesterId: friends.requesterId,
          addresseeId: friends.addresseeId,
        })
        .from(friends)
        .where(
          and(
            or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)),
            eq(friends.status, "accepted")
          )
        );

      const friendIds = new Set(
        userFriends.map(f => f.requesterId === userId ? f.addresseeId : f.requesterId)
      );

      // Get category preferences for each user based on their event participation
      const usersWithCategories = await Promise.all(
        allUsers.map(async (user) => {
          // Get user's most participated category
          const categoryStats = await db
            .select({
              category: events.category,
              count: sql<number>`count(*)`,
            })
            .from(eventParticipants)
            .innerJoin(events, eq(eventParticipants.eventId, events.id))
            .where(eq(eventParticipants.userId, user.id))
            .groupBy(events.category)
            .orderBy(desc(sql`count(*)`))
            .limit(1);

          const primaryCategory = categoryStats.length > 0 ? categoryStats[0].category : 'newcomer';
          const isFriend = friendIds.has(user.id);
          const isCurrentUser = user.id === userId;

          return {
            ...user,
            primaryCategory,
            isFriend,
            isCurrentUser,
          };
        })
      );

      res.json(usersWithCategories);
    } catch (error) {
      console.error("Error fetching bant map data:", error);
      res.status(500).json({ error: "Failed to fetch bant map data" });
    }
  });

  // Register all other routes
  app.use('/api', ogMetadataRouter);

  // Register Telegram Mini-App API routes
  registerTelegramMiniAppRoutes(app);

  return httpServer;
}