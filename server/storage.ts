import {
  users,
  events,
  challenges,
  notifications,
  transactions,
  friends,
  achievements,
  userAchievements,
  eventParticipants,
  eventMessages,
  challengeMessages,
  dailyLogins,
  referrals,
  referralRewards,
  userPreferences,
  userInteractions,
  eventJoinRequests,
  eventPools,
  messageReactions,
  eventTyping,
  eventActivity,
  escrow,
  platformSettings,
  pushSubscriptions,
  userRecommendationProfiles,
  eventRecommendations,
  userEventInteractions,
  stories,
  storyViews,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type Challenge,
  type InsertChallenge,
  type Notification,
  type InsertNotification,
  type Transaction,
  type InsertTransaction,
  type Achievement,
  type Friend,
  type EventParticipant,
  type EventMessage,
  type ChallengeMessage,
  type EventJoinRequest,
  type InsertEventJoinRequest,
  type MessageReaction,
  type InsertMessageReaction,
  type PlatformSettings,
  type InsertPlatformSettings,
  type UserPreferences,
  type InsertUserPreferences,
  type UserRecommendationProfile,
  type EventRecommendation,
  type UserEventInteraction,
  type InsertUserRecommendationProfile,
  type InsertEventRecommendation,
  type InsertUserEventInteraction,
  groups,
  groupMembers,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, or, sql, count, sum, inArray, asc, isNull } from "drizzle-orm";
import { nanoid } from 'nanoid';
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  // User operations - Updated for email/password auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | null>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: any): Promise<User>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  updateNotificationPreferences(userId: string, preferences: any): Promise<void>;
  updateUserTelegramInfo(userId: string, telegramInfo: {
    telegramId: string;
    telegramUsername: string | null;
    isTelegramUser: boolean;
  }): Promise<void>;

  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  getUserStats(userId: string): Promise<any>;
  getUserCreatedEvents(userId: string): Promise<any[]>;
  getUserJoinedEvents(userId: string): Promise<any[]>;
  getUserAchievements(userId: string): Promise<any[]>;
  getUserProfile(userId: string, currentUserId: string): Promise<any>;
  getAdminStats(): Promise<any>;
  getRecentUsers(limit: number): Promise<any[]>;
  getPlatformActivity(limit: number): Promise<any[]>;
  banUser(userId: string, reason: string): Promise<User>;
  unbanUser(userId: string, reason: string): Promise<User>;
  adjustUserBalance(userId: string, amount: number, reason: string): Promise<User>;
  setUserAdminStatus(userId: string, isAdmin: boolean, reason: string): Promise<User>;
  sendAdminMessage(userId: string, message: string, reason: string): Promise<any>;
  checkDailyLogin(userId: string): Promise<any>;

  // Event operations
  getEvents(limit?: number): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event>;
  joinEvent(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventParticipant>;
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  getEventMessages(eventId: number, limit?: number): Promise<any[]>;
  createEventMessage(eventId: number, userId: string, message: string, replyToId?: string, mentions?: string[], telegramUser?: any): Promise<EventMessage>;
  getEventMessageById(messageId: string): Promise<EventMessage | undefined>;
  toggleMessageReaction(messageId: string, userId: string, emoji: string): Promise<any>;
  getMessageReactions(messageId: string): Promise<any[]>;
  getEventParticipantsWithUsers(eventId: number): Promise<any[]>;
  searchEventsByTitle(query: string): Promise<Event[]>;

  // Event Pool operations
  adminSetEventResult(eventId: number, result: boolean): Promise<Event>;
  processEventPayout(eventId: number): Promise<{ winnersCount: number; totalPayout: number; creatorFee: number }>;
  getEventPoolStats(eventId: number): Promise<{ totalPool: number; yesPool: number; noPool: number; participantsCount: number }>;

  // Private event operations
  requestEventJoin(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventJoinRequest>;
  getEventJoinRequests(eventId: number): Promise<(EventJoinRequest & { user: User })[]>;
  approveEventJoinRequest(requestId: number): Promise<EventParticipant>;
  rejectEventJoinRequest(requestId: number): Promise<EventJoinRequest>;

  // Challenge operations
  getChallenges(userId: string, limit?: number): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]>;
  getChallengeById(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge>;
  getChallengeMessages(challengeId: number): Promise<(ChallengeMessage & { user: User })[]>;
  createChallengeMessage(challengeId: number, userId: string, message: string): Promise<ChallengeMessage>;

  // Admin challenge operations
  getAllChallenges(limit?: number): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]>;
  adminSetChallengeResult(challengeId: number, result: 'challenger_won' | 'challenged_won' | 'draw'): Promise<Challenge>;
  processChallengePayouts(challengeId: number): Promise<{ winnerPayout: number; platformFee: number; winnerId?: string }>;
  getChallengeEscrowStatus(challengeId: number): Promise<{ totalEscrow: number; status: string } | null>;

  // Friend operations
  getFriends(userId: string): Promise<(Friend & { requester: User, addressee: User })[]>;
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friend>;
  acceptFriendRequest(id: number): Promise<Friend>;
  toggleFollow(followerId: string, followingId: string): Promise<{ action: 'followed' | 'unfollowed' }>;

  // Notification operations
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification>;

  // Transaction operations
  getTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserBalance(userId: string): Promise<{ balance: number; coins: number }>;
  updateUserBalance(userId: string, amount: number): Promise<User>;

  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<(Achievement & { unlockedAt: Date })[]>;
  unlockAchievement(userId: string, achievementId: number): Promise<void>;

  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<(User & { rank: number })[]>;

  // Referral operations
  createReferral(referrerId: string, referredId: string, code: string): Promise<void>;
  getReferrals(userId: string): Promise<any[]>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;

  // User stats
  getUserStats(userId: string): Promise<{
    wins: number;
    activeChallenges: number;
    friendsOnline: number;
  }>;

  // Update user points
  updateUserPoints(userId: string, pointsAmount: number): Promise<void>;

  // Get all users
  getAllUsers(): Promise<User[]>;
  getGroupByTelegramId(telegramId: string): Promise<any | null>;

  // Group / Telegram membership tracking
  addGroup(telegramId: string, title?: string, type?: string, addedBy?: string): Promise<any>;
  addGroupMember(groupId: number, userId: string, telegramId: string, username?: string): Promise<any>;
  removeGroupMember(groupId: number, telegramId: string): Promise<void>;
  getGroupMembers(groupId: number): Promise<any[]>;

  // Stories operations
  getActiveStories(): Promise<any[]>;
  createStory(storyData: any): Promise<any>;
  updateStory(storyId: number, updates: any): Promise<any>;
  deleteStory(storyId: number): Promise<void>;
  markStoryAsViewed(storyId: number, userId: string): Promise<void>;

  // Global Chat
  createGlobalChatMessage(messageData: any): Promise<any>;
  getGlobalChatMessages(limit?: number): Promise<any[]>;

  // Admin Management Functions
  deleteEvent(eventId: number): Promise<void>;
  toggleEventChat(eventId: number, enabled: boolean): Promise<void>;
  deleteChallenge(challengeId: number): Promise<void>;

  // Admin Functions
  getAdminStats(): Promise<any>;

  // Platform Settings
  getPlatformSettings(): Promise<PlatformSettings>;
  updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings>;

  // Advanced Admin Tools
  addEventFunds(eventId: number, amount: number): Promise<void>;
  giveUserPoints(userId: string, points: number): Promise<void>;
  updateEventCapacity(eventId: number, additionalSlots: number): Promise<void>;

  // Event lifecycle notifications
  notifyEventStarting(eventId: number): Promise<void>;
  notifyEventEnding(eventId: number): Promise<void>;
  notifyFundsReleased(userId: string, eventId: number, amount: number, isWinner: boolean): Promise<void>;

  // Push Notification operations
  savePushSubscription(userId: string, subscription: any): Promise<void>;
  getPushSubscriptions(userId: string): Promise<any[]>;
  removePushSubscription(endpoint: string): Promise<void>;
  broadcastMessage(message: string, type: string): Promise<void>;

  // Missing admin functions
  getAdminNotifications(limit: number): Promise<any[]>;
  broadcastNotification(data: any): Promise<any>;
  searchUsers(query: string, limit: number): Promise<any[]>;

  // Recommendation engine operations
  getUserRecommendationProfile(userId: string): Promise<UserRecommendationProfile | undefined>;
  updateUserRecommendationProfile(userId: string, profile: Partial<InsertUserRecommendationProfile>): Promise<UserRecommendationProfile>;
  generateEventRecommendations(userId: string, limit?: number): Promise<EventRecommendation[]>;
  getPersonalizedEvents(userId: string, limit?: number): Promise<(Event & { recommendationScore: number, recommendationReason: string })[]>;
  trackUserInteraction(interaction: InsertUserEventInteraction): Promise<UserEventInteraction>;
  updateRecommendationProfile(userId: string): Promise<void>;

  // Session store for authentication
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  private db = db; // Alias db for internal use

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations - Updated for email/password auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(
      or(
        eq(users.username, usernameOrEmail),
        eq(users.email, usernameOrEmail)
      )
    );
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    return result[0] || null;
  }

  async updateUserTelegramInfo(userId: string, telegramInfo: {
    telegramId: string;
    telegramUsername: string | null;
    isTelegramUser: boolean;
  }): Promise<void> {
    await this.db
      .update(users)
      .set({
        telegramId: telegramInfo.telegramId,
        telegramUsername: telegramInfo.telegramUsername,
        isTelegramUser: telegramInfo.isTelegramUser,
      })
      .where(eq(users.id, userId));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        ...userData,
        referralCode: userData.referralCode || this.generateReferralCode(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: any): Promise<User> {
    try {
      // Use username as referral code, fallback to random if no username
      const referralCode = userData.username || this.generateReferralCode();

      const [newUser] = await this.db.insert(users).values({
        ...userData,
        referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    // Store notification preferences in user preferences table or update user record
    // For now, we'll store them as JSON in the user record or create a separate preferences system
    await this.db
      .update(users)
      .set({
        notificationPreferences: JSON.stringify(preferences),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    return preferences;
  }

  async updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    // Try to update existing preferences first
    const existingPrefs = await this.getUserPreferences(userId);

    if (existingPrefs) {
      const [updated] = await this.db
        .update(userPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new preferences if none exist
      const [created] = await this.db
        .insert(userPreferences)
        .values({
          userId,
          ...preferences,
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  // Event operations
  async getEvents(limit = 10): Promise<Event[]> {
    try {
      const eventsWithCreators = await this.db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          category: events.category,
          imageUrl: events.imageUrl,
          status: events.status,
          isPrivate: events.isPrivate,
          maxParticipants: events.maxParticipants,
          entryFee: events.entryFee,
          endDate: events.endDate,
          yesPool: events.yesPool,
          noPool: events.noPool,
          eventPool: events.eventPool,
          creatorId: events.creatorId,
          result: events.result,
          adminResult: events.adminResult,
          creatorFee: events.creatorFee,
          chatEnabled: events.chatEnabled,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          // Creator information
          creatorName: users.firstName,
          creatorUsername: users.username,
          creatorEmail: users.email,
          creatorProfileImageUrl: users.profileImageUrl,
        })
        .from(events)
        .leftJoin(users, eq(events.creatorId, users.id))
        .orderBy(desc(events.createdAt))
        .limit(limit);

      // Transform the data to include nested creator object and compatibility aliases
      return eventsWithCreators.map(event => ({
        ...event,
        // Add compatibility aliases for frontend
        bannerUrl: event.imageUrl,
        banner_url: event.imageUrl,
        is_private: event.isPrivate,
        max_participants: event.maxParticipants,
        end_time: event.endDate,
        eventType: 'prediction', // Default event type
        creator: {
          id: event.creatorId,
          name: event.creatorName,
          firstName: event.creatorName,
          username: event.creatorUsername,
          email: event.creatorEmail,
          profileImageUrl: event.creatorProfileImageUrl,
          avatar_url: event.creatorProfileImageUrl,
          avatarUrl: event.creatorProfileImageUrl,
        }
      }));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch events");
    }
  }

  async getEventById(id: number): Promise<Event | undefined> {
    try {
      const [eventData] = await this.db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          category: events.category,
          status: events.status,
          creatorId: events.creatorId,
          eventPool: events.eventPool,
          yesPool: events.yesPool,
          noPool: events.noPool,
          entryFee: events.entryFee,
          endDate: events.endDate,
          result: events.result,
          adminResult: events.adminResult,
          creatorFee: events.creatorFee,
          isPrivate: events.isPrivate,
          maxParticipants: events.maxParticipants,
          imageUrl: events.imageUrl,
          chatEnabled: events.chatEnabled,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          // Creator information
          creatorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username}, ${users.email})`.as('creator_name'),
          creatorUsername: users.username,
          creatorEmail: users.email,
          creatorProfileImageUrl: users.profileImageUrl,
        })
        .from(events)
        .leftJoin(users, eq(events.creatorId, users.id))
        .where(eq(events.id, id));

      if (!eventData) {
        return undefined;
      }

      // Transform the data to include nested creator object and compatibility aliases
      return {
        ...eventData,
        // Add compatibility aliases for frontend
        bannerUrl: eventData.imageUrl,
        banner_url: eventData.imageUrl,
        image_url: eventData.imageUrl,
        is_private: eventData.isPrivate,
        max_participants: eventData.maxParticipants,
        end_time: eventData.endDate,
        start_time: eventData.createdAt, // Using createdAt as start_time fallback
        eventType: 'prediction', // Default event type
        creator: {
          id: eventData.creatorId,
          name: eventData.creatorName,
          firstName: eventData.creatorName,
          username: eventData.creatorUsername,
          email: eventData.creatorEmail,
          profileImageUrl: eventData.creatorProfileImageUrl,
          avatar_url: eventData.creatorProfileImageUrl,
          avatarUrl: eventData.creatorProfileImageUrl,
        }
      } as any;
    } catch (error) {
      console.error("Error fetching event by ID:", error);
      return undefined;
    }
  }

  async searchEventsByTitle(query: string): Promise<Event[]> {
    return await this.db
      .select()
      .from(events)
      .where(
        or(
          sql`LOWER(${events.title}) LIKE LOWER(${'%' + query + '%'})`,
          sql`LOWER(${events.description}) LIKE LOWER(${'%' + query + '%'})`
        )
      )
      .orderBy(desc(events.createdAt))
      .limit(10);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const eventData = {
      ...event,
      eventPool: 0,
      yesPool: 0,
      noPool: 0,
      creatorFee: 0,
    };
    const [newEvent] = await this.db.insert(events).values(eventData).returning();
    return newEvent;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const [event] = await this.db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async joinEvent(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventParticipant> {
    // Get event to validate betting model and amount
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const minAmount = parseFloat(event.entryFee);

    // Validate amount based on betting model
    if (event.bettingModel === "fixed") {
      if (Math.abs(amount - minAmount) > 0.01) { // Allow for floating point precision
        throw new Error(`Fixed betting model requires exactly ₦${minAmount}`);
      }
    } else if (event.bettingModel === "custom") {
      if (amount < minAmount) {
        throw new Error(`Custom betting requires minimum ₦${minAmount}`);
      }

      // Add reasonable maximum to prevent abuse (10x the minimum)
      const maxAmount = minAmount * 10;
      if (amount > maxAmount) {
        throw new Error(`Maximum bet amount is ₦${maxAmount.toLocaleString()}`);
      }
    }

    // First, try to find an unmatched participant with opposite prediction (FCFS)
    const oppositeParticipant = await this.db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.prediction, !prediction), // Opposite prediction
          eq(eventParticipants.status, "active"), // Not yet matched
          isNull(eventParticipants.matchedWith) // No opponent assigned
        )
      )
      .orderBy(asc(eventParticipants.joinedAt)) // FCFS order
      .limit(1);

    const [participant] = await this.db
      .insert(eventParticipants)
      .values({
        eventId,
        userId,
        prediction,
        amount: amount.toString(),
      })
      .returning();

    // If opponent found, match them (FCFS matching)
    if (oppositeParticipant.length > 0) {
      const opponent = oppositeParticipant[0];

      // Update both participants to "matched" status
      await this.db
        .update(eventParticipants)
        .set({ 
          status: "matched",
          matchedWith: userId 
        })
        .where(eq(eventParticipants.id, opponent.id));

      await this.db
        .update(eventParticipants)
        .set({ 
          status: "matched",
          matchedWith: opponent.userId 
        })
        .where(eq(eventParticipants.id, participant.id));
    }

    // Update event pools (both individual and total)
    if (prediction) {
      await this.db
        .update(events)
        .set({
          yesPool: sql`${events.yesPool} + ${amount}`,
          eventPool: sql`${events.eventPool} + ${amount}`,
        })
        .where(eq(events.id, eventId));
    } else {
      await this.db
        .update(events)
        .set({
          noPool: sql`${events.noPool} + ${amount}`,
          eventPool: sql`${events.eventPool} + ${amount}`,
        })
        .where(eq(events.id, eventId));
    }

    return participant;
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    return await this.db
      .select()
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, eventId));
  }

  async getEventMessages(eventId: number, limit = 50): Promise<any[]> {
    const messages = await this.db
      .select({
        id: eventMessages.id,
        eventId: eventMessages.eventId,
        userId: eventMessages.userId,
        message: eventMessages.message,
        replyToId: eventMessages.replyToId,
        mentions: eventMessages.mentions,
        createdAt: eventMessages.createdAt,
        user: users,
      })
      .from(eventMessages)
      .innerJoin(users, eq(eventMessages.userId, users.id))
      .where(eq(eventMessages.eventId, eventId))
      .orderBy(desc(eventMessages.createdAt))
      .limit(limit);

    // Get reactions for each message
    const messageIds = messages.map(m => m.id);
    const reactions = messageIds.length > 0 ? await this.db
      .select({
        messageId: messageReactions.messageId,
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
        }
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(inArray(messageReactions.messageId, messageIds)) : [];

    // Get reply-to messages
    const replyToIds = messages.filter(m => m.replyToId).map(m => m.replyToId);
    const replyToMessages = replyToIds.length > 0 ? await this.db
      .select({
        id: eventMessages.id,
        message: eventMessages.message,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
        }
      })
      .from(eventMessages)
      .innerJoin(users, eq(eventMessages.userId, users.id))
      .where(inArray(eventMessages.id, replyToIds)) : [];

    // Combine data
    return messages.map(message => {
      const msgReactions = reactions.filter(r => r.messageId === message.id);
      const reactionSummary = msgReactions.reduce((acc: any[], reaction) => {
        const existing = acc.find(r => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user.username || reaction.user.firstName);
          if (reaction.userId === message.userId) {
            existing.userReacted = true;
          }
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user.username || reaction.user.firstName],
            userReacted: reaction.userId === message.userId,
          });
        }
        return acc;
      }, []);

      const replyTo = message.replyToId ? 
        replyToMessages.find(r => r.id === message.replyToId) : null;

      return {
        ...message,
        reactions: reactionSummary,
        replyTo,
      };
    });
  }

  async createGlobalChatMessage(messageData: any) {
    try {
      const [newMessage] = await this.db.insert(eventMessages).values({
        eventId: null, // Global chat messages don't belong to specific events
        userId: messageData.userId,
        message: messageData.message,
        replyToId: messageData.replyToId || null,
        mentions: messageData.mentions || null,
      }).returning();

      // Get user info for the message
      const user = messageData.user || await this.getUser(messageData.userId);

      return {
        ...newMessage,
        user: user || {
          id: messageData.userId,
          firstName: 'Unknown User',
          username: messageData.userId,
          profileImageUrl: null,
        }
      };
    } catch (error) {
      console.error("Error creating global chat message:", error);
      throw error;
    }
  }

  async getGlobalChatMessages(limit = 50) {
    try {
      const messagesWithUsers = await this.db
        .select({
          id: eventMessages.id,
          userId: eventMessages.userId,
          message: eventMessages.message,
          createdAt: eventMessages.createdAt,
          replyToId: eventMessages.replyToId,
          mentions: eventMessages.mentions,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(eventMessages)
        .leftJoin(users, eq(eventMessages.userId, users.id))
        .where(sql`${eventMessages.eventId} IS NULL`) // Global chat messages
        .orderBy(sql`${eventMessages.createdAt} DESC`)
        .limit(limit);

      return messagesWithUsers;
    } catch (error) {
      console.error("Error fetching global chat messages:", error);
      throw error;
    }
  }

  async createEventMessage(eventId: number, userId: string, message: string, replyToId?: string, mentions?: string[], telegramUser?: any): Promise<EventMessage> {
    const [newMessage] = await this.db
      .insert(eventMessages)
      .values({ 
        eventId, 
        userId, 
        message, 
        replyToId: replyToId ? parseInt(replyToId) : null,
        mentions: mentions || []
      })
      .returning();

    // Get user info for the response
    let user;
    if (telegramUser) {
      // Use provided Telegram user info
      user = telegramUser;
    } else {
      // Get from database for regular BetChat users
      user = await this.getUser(userId);
    }

    return {
      ...newMessage,
      user: {
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        profileImageUrl: user?.profileImageUrl,
        level: user?.level,
        isTelegramUser: telegramUser ? true : false,
      }
    };
  }

  async getEventMessageById(messageId: string): Promise<EventMessage | undefined> {
    const [message] = await this.db
      .select()
      .from(eventMessages)
      .where(eq(eventMessages.id, parseInt(messageId)));
    return message;
  }

  async toggleMessageReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    // Check if reaction already exists
    const [existingReaction] = await this.db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, parseInt(messageId)),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );

    if (existingReaction) {
      // Remove reaction
      await this.db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existingReaction.id));
      return { action: 'removed' };
    } else {
      // Add reaction
      const [newReaction] = await this.db
        .insert(messageReactions)
        .values({
          messageId: parseInt(messageId),
          userId,
          emoji,
        })
        .returning();
      return { action: 'added', reaction: newReaction };
    }
  }

  async getMessageReactions(messageId: string): Promise<any[]> {
    const reactions = await this.db
      .select({
        id: messageReactions.id,
        messageId: messageReactions.messageId,
        userId: messageReactions.userId,
        emoji: messageReactions.emoji,
        createdAt: messageReactions.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
        }
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, parseInt(messageId)));

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: any[], reaction) => {
      const existing = acc.find(r => r.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reaction.user.username || reaction.user.firstName);
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.user.username || reaction.user.firstName],
          userReacted: false, // Will be set by caller based on current user
        });
      }
      return acc;
    }, []);

    return groupedReactions;
  }

  async getEventParticipantsWithUsers(eventId: number): Promise<any[]> {
    return await this.db
      .select({
        id: eventParticipants.id,
        eventId: eventParticipants.eventId,
        userId: eventParticipants.userId,
        prediction: eventParticipants.prediction,
        amount: eventParticipants.amount,
        user: users,
      })
      .from(eventParticipants)
      .innerJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventId));
  }

  // Challenge operations
  async getChallenges(userId: string, limit = 10): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]> {
    return await this.db
      .select({
        id: challenges.id,
        challenger: challenges.challenger,
        challenged: challenges.challenged,
        title: challenges.title,
        description: challenges.description,
        category: challenges.category,
        amount: challenges.amount,
        status: challenges.status,
        evidence: challenges.evidence,
        result: challenges.result,
        dueDate: challenges.dueDate,
        createdAt: challenges.createdAt,
        completedAt: challenges.completedAt,
        challengerUser: {
          id: sql`challenger_user.id`,
          username: sql`challenger_user.username`,
          firstName: sql`challenger_user.first_name`,
          lastName: sql`challenger_user.last_name`,
          profileImageUrl: sql`challenger_user.profile_image_url`,
        },
        challengedUser: {
          id: sql`challenged_user.id`,
          username: sql`challenged_user.username`,
          firstName: sql`challenged_user.first_name`,
          lastName: sql`challenged_user.last_name`,
          profileImageUrl: sql`challenged_user.profile_image_url`,
        },
      })
      .from(challenges)
      .innerJoin(sql`users challenger_user`, eq(challenges.challenger, sql`challenger_user.id`))
      .innerJoin(sql`users challenged_user`, eq(challenges.challenged, sql`challenged_user.id`))
      .where(or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)))
      .orderBy(desc(challenges.createdAt))
      .limit(limit) as any;
  }

  async getChallengeById(id: number): Promise<Challenge | undefined> {
    const [challenge] = await this.db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    // Check challenger balance
    const balance = await this.getUserBalance(challenge.challenger);
    const challengeAmount = parseFloat(challenge.amount);

    if (balance.balance < challengeAmount) {
      throw new Error("Insufficient balance to create challenge");
    }

    // Create the challenge
    const [newChallenge] = await this.db.insert(challenges).values(challenge).returning();

    // Deduct challenger's stake and create escrow
    await this.createTransaction({
      userId: challenge.challenger,
      type: 'challenge_escrow',
      amount: `-${challengeAmount}`,
      description: `Challenge escrow: ${challenge.title}`,
      relatedId: newChallenge.id,
      status: 'completed',
    });

    // Create escrow record
    await this.db.insert(escrow).values({
      challengeId: newChallenge.id,
      amount: challengeAmount.toString(),
      status: 'holding',
    });

    return newChallenge;
  }

  async updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge> {
    const [challenge] = await this.db
      .update(challenges)
      .set(updates)
      .where(eq(challenges.id, id))
      .returning();
    return challenge;
  }

  async acceptChallenge(challengeId: number, userId: string): Promise<Challenge> {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.status !== 'pending') {
      throw new Error("Challenge cannot be accepted");
    }

    if (challenge.challenged !== userId) {
      throw new Error("You are not the challenged user");
    }

    // Check challenged user balance
    const balance = await this.getUserBalance(userId);
    const challengeAmount = parseFloat(challenge.amount);

    if (balance.balance < challengeAmount) {
      throw new Error("Insufficient balance to accept challenge");
    }

    // Deduct challenged user's stake
    await this.createTransaction({
      userId: userId,
      type: 'challenge_escrow',
      amount: `-${challengeAmount}`,
      description: `Challenge escrow: ${challenge.title}`,
      relatedId: challengeId,
      status: 'completed',
    });

    // Add to existing escrow
    await this.db.insert(escrow).values({
      challengeId: challengeId,
      amount: challengeAmount.toString(),
      status: 'holding',
    });

    // Update challenge status to active
    const [updatedChallenge] = await this.db
      .update(challenges)
      .set({ status: 'active' })
      .where(eq(challenges.id, challengeId))
      .returning();

    return updatedChallenge;
  }

  async getChallengeMessages(challengeId: number): Promise<(ChallengeMessage & { user: User })[]> {
    return await this.db
      .select({
        id: challengeMessages.id,
        challengeId: challengeMessages.challengeId,
        userId: challengeMessages.userId,
        message: challengeMessages.message,
        createdAt: challengeMessages.createdAt,
        user: users,
      })
      .from(challengeMessages)
      .innerJoin(users, eq(challengeMessages.userId, users.id))
      .where(eq(challengeMessages.challengeId, challengeId))
      .orderBy(desc(challengeMessages.createdAt));
  }

  async createChallengeMessage(challengeId: number, userId: string, message: string): Promise<ChallengeMessage> {
    const [newMessage] = await this.db
      .insert(challengeMessages)
      .values({ challengeId, userId, message })
      .returning();
    return newMessage;
  }

  // Admin challenge operations
  async getAllChallenges(limit = 50): Promise<(Challenge & { challengerUser: User, challengedUser: User })[]> {
    return await this.db
      .select({
        id: challenges.id,
        challenger: challenges.challenger,
        challenged: challenges.challenged,
        title: challenges.title,
        description: challenges.description,
        category: challenges.category,
        amount: challenges.amount,
        status: challenges.status,
        evidence: challenges.evidence,
        result: challenges.result,
        dueDate: challenges.dueDate,
        createdAt: challenges.createdAt,
        completedAt: challenges.completedAt,
        challengerUser: {
          id: sql`challenger_user.id`,
          username: sql`challenger_user.username`,
          firstName: sql`challenger_user.first_name`,
          lastName: sql`challenger_user.last_name`,
          profileImageUrl: sql`challenger_user.profile_image_url`,
        },
        challengedUser: {
          id: sql`challenged_user.id`,
          username: sql`challenged_user.username`,
          firstName: sql`challenged_user.first_name`,
          lastName: sql`challenged_user.lastname`,
          profileImageUrl: sql`challenged_user.profile_image_url`,
        },
      })
      .from(challenges)
      .innerJoin(sql`users challenger_user`, eq(challenges.challenger, sql`challenger_user.id`))
      .innerJoin(sql`users challenged_user`, eq(challenges.challenged, sql`challenged_user.id`))
      .orderBy(desc(challenges.createdAt))
      .limit(limit) as any;
  }

  async adminSetChallengeResult(challengeId: number, result: 'challenger_won' | 'challenged_won' | 'draw'): Promise<Challenge> {
    const [challenge] = await this.db
      .update(challenges)
      .set({ 
        result: result,
        status: 'completed',
        completedAt: new Date() 
      })
      .where(eq(challenges.id, challengeId))
      .returning();
    return challenge;
  }

  async processChallengePayouts(challengeId: number): Promise<{ winnerPayout: number; platformFee: number; winnerId?: string }> {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge || challenge.status !== 'completed' || !challenge.result) {
      throw new Error('Challenge not ready for payout');
    }

    const totalAmount = parseFloat(challenge.amount) * 2; // Both participants contributed
    const platformFeeRate = 0.05; // 5% platform fee
    const platformFee = totalAmount * platformFeeRate;
    const winnerPayout = totalAmount - platformFee;

    let winnerId: string | undefined;

    if (challenge.result === 'challenger_won') {
      winnerId = challenge.challenger;
    } else if (challenge.result === 'challenged_won') {
      winnerId = challenge.challenged;
    } else if (challenge.result === 'draw') {
      // In case of draw, return money to both participants
      const halfAmount = parseFloat(challenge.amount);
      await this.updateUserBalance(challenge.challenger, halfAmount);
      await this.updateUserBalance(challenge.challenged, halfAmount);

      // Create transactions for both
      await this.createTransaction({
        userId: challenge.challenger,
        type: 'challenge_draw',
        amount: halfAmount.toString(),
        description: `Draw in challenge: ${challenge.title}`,
        status: 'completed',
        reference: `challenge_${challengeId}_draw_challenger`,
      });

      await this.createTransaction({
        userId: challenge.challenged,
        type: 'challenge_draw',
        amount: halfAmount.toString(),
        description: `Draw in challenge: ${challenge.title}`,
        status: 'completed',
        reference: `challenge_${challengeId}_draw_challenged`,
      });

      // Send notifications
      await this.createNotification({
        userId: challenge.challenger,
        type: 'challenge_draw',
        title: 'Challenge Draw',
        message: `Challenge "${challenge.title}" ended in a draw. Your stake has been returned.`,
        data: { challengeId: challengeId, result: 'draw' },
      });

      await this.createNotification({
        userId: challenge.challenged,
        type: 'challenge_draw',
        title: 'Challenge Draw',
        message: `Challenge "${challenge.title}" ended in a draw. Your stake has been returned.`,
        data: { challengeId: challengeId, result: 'draw' },
      });

      return { winnerPayout: halfAmount * 2, platformFee: 0, winnerId: undefined };
    }

    if (winnerId) {
      // Update winner's balance
      await this.updateUserBalance(winnerId, winnerPayout);

      // Create transaction record
      await this.createTransaction({
        userId: winnerId,
        type: 'challenge_win',
        amount: winnerPayout.toString(),
        description: `Won challenge: ${challenge.title}`,
        status: 'completed',
        reference: `challenge_${challengeId}_win`,
      });

      // Send notifications to both participants
      const winner = await this.getUser(winnerId);
      const loser = winnerId === challenge.challenger ? challenge.challenged : challenge.challenger;

      await this.createNotification({
        userId: winnerId,
        type: 'challenge_win',
        title: 'Challenge Won!',
        message: `Congratulations! You won ₦${winnerPayout.toLocaleString()} from challenge "${challenge.title}".`,
        data: { challengeId: challengeId, result: challenge.result, winnings: winnerPayout },
      });

      await this.createNotification({
        userId: loser,
        type: 'challenge_loss',
        title: 'Challenge Result',
        message: `Challenge "${challenge.title}" has been resolved. Better luck next time!`,
        data: { challengeId: challengeId, result: challenge.result },
      });
    }

    return { winnerPayout, platformFee, winnerId };
  }

  async getChallengeEscrowStatus(challengeId: number): Promise<{ totalEscrow: number; status: string } | null> {
    const [escrowData] = await this.db
      .select({
        totalEscrow: sql<number>`COALESCE(SUM(CAST(${escrow.amount} AS DECIMAL)), 0)`,
        status: escrow.status,
      })
      .from(escrow)
      .where(eq(escrow.challengeId, challengeId))
      .groupBy(escrow.status);

    return escrowData || null;
  }

  // Friend operations
  async getFriends(userId: string): Promise<(Friend & { requester: User, addressee: User })[]> {
    return await this.db
      .select({
        id: friends.id,
        requesterId: friends.requesterId,
        addresseeId: friends.addresseeId,
        status: friends.status,
        createdAt: friends.createdAt,
        acceptedAt: friends.acceptedAt,
        requester: sql`requester`,
        addressee: sql`addressee`,
      })
      .from(friends)
      .innerJoin(sql`users requester`, eq(friends.requesterId, sql`requester.id`))
      .innerJoin(sql`users addressee`, eq(friends.addresseeId, sql`addressee.id`))
      .where(
        and(
          or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)),
          eq(friends.status, "accepted")
        )
      ) as any;
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friend> {
    const [friendRequest] = await this.db
      .insert(friends)
      .values({ requesterId, addresseeId, status: "pending" })
      .returning();
    return friendRequest;
  }

  async acceptFriendRequest(id: number): Promise<Friend> {
    const [friend] = await this.db
      .update(friends)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(friends.id, id))
      .returning();
    return friend;
  }

  async toggleFollow(followerId: string, followingId: string): Promise<{ action: 'followed' | 'unfollowed' }> {
    // Check if follow relationship exists
    const [existingFollow] = await this.db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.requesterId, followerId),
          eq(friends.addresseeId, followingId),
          eq(friends.status, 'accepted')
        )
      );

    if (existingFollow) {
      // Unfollow: Delete the relationship
      await this.db
        .delete(friends)
        .where(eq(friends.id, existingFollow.id));
      return { action: 'unfollowed' };
    } else {
      // Follow: Create new relationship (auto-accepted for follow system)
      await this.db
        .insert(friends)
        .values({
          requesterId: followerId,
          addresseeId: followingId,
          status: 'accepted',
          acceptedAt: new Date()
        });
      return { action: 'followed' };
    }
  }

  // Notification operations
  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await this.db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [notification] = await this.db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  // Transaction operations
  async getTransactions(userId: string, limit = 20): Promise<Transaction[]> {
    return await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getUserBalance(userId: string): Promise<{ balance: number; coins: number }> {
    try {
      // Get user's current coins from users table
      const user = await this.db
        .select({ coins: users.coins })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const currentCoins = user[0]?.coins || 0;

      // Calculate Naira balance from transactions
      const userTransactions = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      console.log(`All transactions for user ${userId}:`, userTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        createdAt: t.createdAt
      })));

      let balance = 0;
      const completedTransactions = userTransactions.filter(t => t.status === 'completed');

      console.log(`Completed transactions for user ${userId}:`, completedTransactions.map(t => ({
        type: t.type,
        amount: t.amount,
        parsedAmount: parseFloat(t.amount)
      })));

      for (const transaction of completedTransactions) {
        const amount = parseFloat(transaction.amount);
        if (!isNaN(amount)) {
          balance += amount;
          console.log(`Added ${amount} to balance, new total: ${balance}`);
        } else {
          console.warn(`Invalid amount in transaction ${transaction.id}: ${transaction.amount}`);
        }
      }

      console.log(`Balance calculation for user ${userId}:`, {
        totalTransactions: userTransactions.length,
        completedTransactions: userTransactions.filter(t => t.status === 'completed').length,
        calculatedBalance: balance,
        currentCoins
      });

      const result = { 
        balance: Math.max(0, balance), // Ensure balance is never negative
        coins: currentCoins 
      };

      console.log(`Returning balance result:`, result);
      return result;
    } catch (error) {
      console.error("Error getting user balance:", error);
      return { balance: 0, coins: 0 };
    }
  }

  async updateUserBalance(userId: string, amount: number): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({
        balance: sql`${users.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    console.log('Creating transaction:', {
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      reference: transaction.reference
    });

    try {
      const [newTransaction] = await this.db
        .insert(transactions)
        .values(transaction)
        .returning();

      console.log('Transaction created successfully:', newTransaction);

      return newTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await this.db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<(Achievement & { unlockedAt: Date })[]> {
    return await this.db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        category: achievements.category,
        xpReward: achievements.xpReward,
        pointsReward: achievements.pointsReward,
        requirement: achievements.requirement,
        createdAt: achievements.createdAt,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId)) as any;
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<void> {
    await this.db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .onConflictDoNothing();
  }

  // Leaderboard operations
  async getLeaderboard(limit = 50): Promise<(User & { rank: number; coins: number; eventsWon: number; challengesWon: number })[]> {
    const result = await this.db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        level: users.level,
        xp: users.xp,
        points: users.points,
        balance: users.balance,
        coins: users.coins, // Get the actual coins field
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${users.coins} DESC)`,
      })
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(desc(users.coins))
      .limit(limit);

    // For each user, calculate their wins
    const usersWithStats = await Promise.all(result.map(async (user) => {
      try {
        // Count events won
        const eventsWon = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(eventParticipants)
          .where(and(
            eq(eventParticipants.userId, user.id),
            eq(eventParticipants.status, 'won')
          ));

        // Count challenges won (where user was challenger and won, or challenged and won)
        const challengesWonAsChallenger = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(challenges)
          .where(and(
            eq(challenges.challenger, user.id),
            eq(challenges.result, 'challenger_won')
          ));

        const challengesWonAsChallenged = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(challenges)
          .where(and(
            eq(challenges.challenged, user.id),
            eq(challenges.result, 'challenged_won')
          ));

        const totalChallengesWon = (challengesWonAsChallenger[0]?.count || 0) + (challengesWonAsChallenged[0]?.count || 0);

        return {
          ...user,
          eventsWon: eventsWon[0]?.count || 0,
          challengesWon: totalChallengesWon
        };
      } catch (error) {
        console.error(`Error calculating wins for user ${user.id}:`, error);
        return {
          ...user,
          eventsWon: 0,
          challengesWon: 0
        };
      }
    }));

    return usersWithStats as any;
  }

  // Referral operations

  async getReferrals(userId: string): Promise<any[]> {
    return await this.db
      .select({
        id: referrals.id,
        referrerId: referrals.referrerId,
        referredId: referrals.referredId,
        code: referrals.code,
        status: referrals.status,
        createdAt: referrals.createdAt,
        referredUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt
        }
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.referralCode, referralCode));
    return user;
  }

  // User stats
  async getUserStats(userId: string): Promise<{
    wins: number;
    activeChallenges: number;
    friendsOnline: number;
  }> {
    // Get wins count from completed events/challenges
    const [winsResult] = await this.db
      .select({ count: count() })
      .from(challenges)
      .where(
        and(
          or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)),
          eq(challenges.status, "completed"),
          or(
            and(eq(challenges.challenger, userId), eq(challenges.result, "challenger_won")),
            and(eq(challenges.challenged, userId), eq(challenges.result, "challenged_won"))
          )
        )
      );

    // Get active challenges count
    const [activeChallengesResult] = await this.db
      .select({ count: count() })
      .from(challenges)
      .where(
        and(
          or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)),
          eq(challenges.status, "active")
        )
      );

    // Get friends count (simplified - would need online status tracking in real app)
    const [friendsResult] = await this.db
      .select({ count: count() })
      .from(friends)
      .where(
        and(
          or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)),
          eq(friends.status, "accepted")
        )
      );

    return {
      wins: winsResult?.count || 0,
      activeChallenges: activeChallengesResult?.count || 0,
      friendsOnline: Math.floor((friendsResult?.count || 0) * 0.35), // Simulate ~35% online
    };
  }

  // Event Pool operations
  async adminSetEventResult(eventId: number, result: boolean): Promise<Event> {
    const [event] = await this.db
      .update(events)
      .set({ 
        adminResult: result,
        result: result,
        status: 'completed',
        updatedAt: new Date() 
      })
      .where(eq(events.id, eventId))
      .returning();
    return event;
  }

  async processEventPayout(eventId: number): Promise<{ winnersCount: number; totalPayout: number; creatorFee: number }> {
    const event = await this.getEventById(eventId);
    if (!event || event.status !== 'completed' || event.adminResult === null) {
      throw new Error('Event not ready for payout');
    }

    const participants = await this.getEventParticipants(eventId);
    const winners = participants.filter(p => p.prediction === event.adminResult);

    const totalPool = parseFloat(event.eventPool);
    const creatorFeeAmount = totalPool * 0.03; // 3% creator fee
    const availablePayout = totalPool - creatorFeeAmount;

    if (winners.length === 0) {
      // No winners - creator gets the entire pool
      await this.updateUserBalance(event.creatorId, totalPool);
      await this.createTransaction({
        userId: event.creatorId,
        type: 'event_no_winners',
        amount: totalPool.toString(),
        description: `No winners bonus for event: ${event.title}`,
        status: 'completed',
        reference: `event_${eventId}_no_winners`,
      });

      return { winnersCount: 0, totalPayout: totalPool, creatorFee: 0 };
    }

    // Calculate individual payouts
    const totalWinnerBets = winners.reduce((sum, w) => sum + parseFloat(w.amount), 0);

    // Handle edge case where total winner bets exceed available payout (shouldn't happen but safety check)
    if (totalWinnerBets > availablePayout) {
      console.warn(`Event ${eventId}: Total winner bets (₦${totalWinnerBets}) exceed available payout (₦${availablePayout})`);
    }

    for (const winner of winners) {
      const winnerBet = parseFloat(winner.amount);
      const winnerShare = totalWinnerBets > 0 ? winnerBet / totalWinnerBets : 1 / winners.length;

      let payout;
      if (event.bettingModel === "fixed") {
        // Fixed model: equal share of the profit pool + original bet back
        const profitPool = Math.max(0, availablePayout - totalWinnerBets);
        payout = winnerBet + (profitPool / winners.length);
      } else {
        // Custom model: proportional payout
        payout = winnerBet + (Math.max(0, availablePayout - totalWinnerBets) * winnerShare);
      }

      // Ensure minimum payout is at least the original bet
      payout = Math.max(payout, winnerBet);

      // Update participant with payout info
      await this.db
        .update(eventParticipants)
        .set({ 
          status: 'won',
          payout: payout.toString(),
          payoutAt: new Date()
        })
        .where(eq(eventParticipants.id, winner.id));

      // Update user balance
      await this.updateUserBalance(winner.userId, payout);

      // Create transaction record
      await this.createTransaction({
        userId: winner.userId,
        type: 'event_win',
        amount: payout.toString(),
        description: `Won event: ${event.title}`,
        status: 'completed',
        reference: `event_${eventId}_win_${winner.id}`,
      });
    }

    // Mark losers
    const losers = participants.filter(p => p.prediction !== event.adminResult);
    for (const loser of losers) {
      await this.db
        .update(eventParticipants)
        .set({ status: 'lost' })
        .where(eq(eventParticipants.id, loser.id));
    }

    // Pay creator fee
    await this.updateUserBalance(event.creatorId, creatorFeeAmount);
    await this.createTransaction({
      userId: event.creatorId,
      type: 'creator_fee',
      amount: creatorFeeAmount.toString(),
      description: `Creator fee for event: ${event.title}`,
      status: 'completed',
      reference: `event_${eventId}_creator_fee`,
    });

    // Notify losers about funds release (they get nothing back)
    for (const loser of losers) {
      await this.notifyFundsReleased(loser.userId, eventId, 0, false);
    }

    // Notify winners about their winnings (already handled above in winner loop)
    // Update event creator fee collected
    await this.db
      .update(events)
      .set({ creatorFee: creatorFeeAmount.toString() })
      .where(eq(events.id, eventId));

    return { 
      winnersCount: winners.length, 
      totalPayout: availablePayout, 
      creatorFee: creatorFeeAmount 
    };
  }

  async getEventPoolStats(eventId: number): Promise<{ totalPool: number; yesPool: number; noPool: number; participantsCount: number }> {
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const [participantCount] = await this.db
      .select({ count: count() })
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, eventId));

    return {
      totalPool: parseFloat(event.eventPool),
      yesPool: parseFloat(event.yesPool),
      noPool: parseFloat(event.noPool),
      participantsCount: participantCount.count,
    };
  }

  // Private event operations
  async requestEventJoin(eventId: number, userId: string, prediction: boolean, amount: number): Promise<EventJoinRequest> {
    const [request] = await this.db
      .insert(eventJoinRequests)
      .values({
        eventId,
        userId,
        prediction,
        amount: amount.toString(),
      })
      .returning();
    return request;
  }

  async getEventJoinRequests(eventId: number): Promise<(EventJoinRequest & { user: User })[]> {
    return await this.db
      .select({
        id: eventJoinRequests.id,
        eventId: eventJoinRequests.eventId,
        userId: eventJoinRequests.userId,
        prediction: eventJoinRequests.prediction,
        amount: eventJoinRequests.amount,
        status: eventJoinRequests.status,
        requestedAt: eventJoinRequests.requestedAt,
        respondedAt: eventJoinRequests.respondedAt,
        user: users,
      })
      .from(eventJoinRequests)
      .innerJoin(users, eq(eventJoinRequests.userId, users.id))
      .where(eq(eventJoinRequests.eventId, eventId))
      .orderBy(desc(eventJoinRequests.requestedAt));
  }

  async approveEventJoinRequest(requestId: number): Promise<EventParticipant> {
    const [request] = await this.db
      .select()
      .from(eventJoinRequests)
      .where(eq(eventJoinRequests.id, requestId));

    if (!request) {
      throw new Error('Join request not found');
    }

    // Create participant
    const participant = await this.joinEvent(
      request.eventId,
      request.userId,
      request.prediction,
      parseFloat(request.amount)
    );

    // Update request status
    await this.db
      .update(eventJoinRequests)
      .set({ 
        status: 'approved',
        respondedAt: new Date()
      })
      .where(eq(eventJoinRequests.id, requestId));

    return participant;
  }

  async rejectEventJoinRequest(requestId: number): Promise<EventJoinRequest> {
    const [request] = await this.db
      .update(eventJoinRequests)
      .set({ 
        status: 'rejected',
        respondedAt: new Date()
      })
      .where(eq(eventJoinRequests.id, requestId))
      .returning();
    return request;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }


  // Get user profile with stats
  async getAllUsers() {
    const usersResult = await this.db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));

    return usersResult.map(user => ({
      ...user,
      status: user.lastLogin && new Date(user.lastLogin).getTime() > Date.now() - 24 * 60 * 60 * 1000 ? 'Online' : 'Offline',
    }));
  }

  // Group and member tracking
  async addGroup(telegramId: string, title?: string, type?: string, addedBy?: string): Promise<any> {
    const [g] = await this.db.insert(groups).values({
      telegramId,
      title,
      type,
      addedBy,
      addedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing().returning();

    if (g) return g;

    const [existing] = await this.db.select().from(groups).where(eq(groups.telegramId, telegramId)).limit(1);
    return existing;
  }

  async addGroupMember(groupId: number, userId: string, telegramId: string, username?: string): Promise<any> {
    // Insert or update membership
    const [member] = await this.db.insert(groupMembers).values({
      groupId,
      userId,
      telegramId,
      username,
      joinedAt: new Date(),
    }).onConflictDoUpdate({
      target: groupMembers.id,
      set: { username, leftAt: null }
    }).returning();

    return member;
  }

  async removeGroupMember(groupId: number, telegramId: string): Promise<void> {
    await this.db.update(groupMembers).set({ leftAt: new Date() }).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.telegramId, telegramId)));
  }

  async getGroupMembers(groupId: number): Promise<any[]> {
    const members = await this.db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId)).orderBy(desc(groupMembers.joinedAt));
    return members;
  }

  async getGroupByTelegramId(telegramId: string): Promise<any | null> {
    const [g] = await this.db.select().from(groups).where(eq(groups.telegramId, telegramId)).limit(1);
    return g || null;
  }

  async getUserProfile(userId: string, currentUserId: string): Promise<any> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Get user stats
    const [stats] = await this.db
      .select({
        wins: count(sql`CASE WHEN ${eventParticipants.status} = 'won' THEN 1 END`),
        activeChallenges: count(sql`CASE WHEN ${challenges.status} = 'active' THEN 1 END`),
        totalEarnings: sum(sql`CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END`),
      })
      .from(users)
      .leftJoin(eventParticipants, eq(eventParticipants.userId, users.id))
      .leftJoin(challenges, or(eq(challenges.challenger, users.id), eq(challenges.challenged, users.id)))
      .leftJoin(transactions, eq(transactions.userId, users.id))
      .where(eq(users.id, userId))
      .groupBy(users.id);

    // Check if current user is following this user
    const [followRecord] = await this.db
      .select()
      .from(friends)
      .where(and(
        eq(friends.requesterId, currentUserId),
        eq(friends.addresseeId, userId),
        eq(friends.status, 'accepted')
      ))
      .limit(1);

    // Get follower and following counts
    const [followerCount] = await this.db
      .select({ count: count() })
      .from(friends)
      .where(and(
        eq(friends.addresseeId, userId),
        eq(friends.status, 'accepted')
      ));

    const [followingCount] = await this.db
      .select({ count: count() })
      .from(friends)
      .where(and(
        eq(friends.requesterId, userId),
        eq(friends.status, 'accepted')
      ));

    // Check if there's an active challenge between users
    const [challengeRecord] = await this.db
      .select()
      .from(challenges)
      .where(and(
        or(
          and(eq(challenges.challenger, currentUserId), eq(challenges.challenged, userId)),
          and(eq(challenges.challenger, userId), eq(challenges.challenged, currentUserId))
        ),
        inArray(challenges.status, ['pending', 'active'])
      ))
      .limit(1);

    return {
      ...user,
      stats: {
        wins: stats?.wins || 0,
        activeChallenges: stats?.activeChallenges || 0,
        totalEarnings: parseFloat(stats?.totalEarnings || '0'),
      },
      isFollowing: !!followRecord,
      followerCount: followerCount?.count || 0,
      followingCount: followingCount?.count || 0,
      hasActiveChallenge: !!challengeRecord,
      challengeStatus: challengeRecord?.status || null,
      isChallengedByMe: challengeRecord?.challenger === currentUserId,
    };
  }

  // Get admin statistics
  async getAdminStats(): Promise<any> {
    const [platformStats] = await this.db
      .select({
        totalUsers: count(sql`DISTINCT ${users.id}`),
        totalEvents: count(sql`DISTINCT ${events.id}`),
        totalChallenges: count(sql`DISTINCT ${challenges.id}`),
        totalTransactions: count(sql`DISTINCT ${transactions.id}`),
        totalEventPool: sum(events.eventPool),
        totalChallengeStaked: sum(sql`${challenges.amount} * 2`),
        totalPlatformFees: sum(sql`${transactions.amount} * 0.05`),
        activeUsers: count(sql`DISTINCT CASE WHEN ${users.lastLogin} > NOW() - INTERVAL '7 days' THEN ${users.id} END`),
      })
      .from(users)
      .leftJoin(events, eq(events.creatorId, users.id))
      .leftJoin(challenges, or(eq(challenges.challenger, users.id), eq(challenges.challenged, users.id)))
      .leftJoin(transactions, eq(transactions.userId, users.id));

    return platformStats || {
      totalUsers: 0,
      totalEvents: 0,
      totalChallenges: 0,
      totalTransactions: 0,
      totalEventPool: 0,
      totalChallengeStaked: 0,
      totalPlatformFees: 0,
      activeUsers: 0,
    };
  }

  // Get recent users
  async getRecentUsers(limit: number): Promise<any[]> {
    const recentUsers = await this.db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        email: users.email,
        level: users.level,
        points: users.points,
        balance: users.balance,
        streak: users.streak,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    return recentUsers.map(user => ({
      ...user,
      status: user.lastLogin && new Date(user.lastLogin).getTime() > Date.now() - 24 * 60 * 60 * 1000 ? 'Online' : 'Offline',
    }));
  }

  // Get platform activity
  async getPlatformActivity(limit: number): Promise<any[]> {
    const recentActivity = await this.db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        userId: transactions.userId,
        createdAt: transactions.createdAt,
        userFirstName: users.firstName,
        userUsername: users.username,
      })
      .from(transactions)
      .leftJoin(users, eq(users.id, transactions.userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return recentActivity.map(activity => ({
      ...activity,
      userName: activity.userFirstName || activity.userUsername || 'Unknown',
    }));
  }

  // Ban user
  async banUser(userId: string, reason: string): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ 
        status: 'banned',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create admin log entry
    await this.db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `User banned - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Unban user
  async unbanUser(userId: string, reason: string): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ 
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create admin log entry
    await this.db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `User unbanned - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Adjust user balance
  async adjustUserBalance(userId: string, amount: number, reason: string): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ 
        balance: sql`${users.balance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create transaction record
    await this.db.insert(transactions).values({
      userId,
      type: amount > 0 ? 'admin_credit' : 'admin_debit',
      amount: Math.abs(amount).toString(),
      description: `Admin balance adjustment - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Set user admin status
  async setUserAdminStatus(userId: string, isAdmin: boolean, reason: string): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ 
        isAdmin,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Create admin log entry
    await this.db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `Admin status ${isAdmin ? 'granted' : 'revoked'} - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return updatedUser;
  }

  // Send admin message
  async sendAdminMessage(userId: string, message: string, reason: string): Promise<any> {
    // Create notification
    await this.db.insert(notifications).values({
      userId,
      type: 'admin_message',
      title: 'Message from Admin',
      message,
      createdAt: new Date()
    });

    // Create admin log entry
    await this.db.insert(transactions).values({
      userId,
      type: 'admin_action',
      amount: '0',
      description: `Admin message sent - Reason: ${reason}`,
      status: 'completed',
      createdAt: new Date()
    });

    return { success: true, message: 'Admin message sent successfully' };
  }

  async checkDailyLogin(userId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has already logged in today
    const todayLogin = await this.db
      .select()
      .from(dailyLogins)
      .where(and(
        eq(dailyLogins.userId, userId),
        sql`DATE(${dailyLogins.date}) = ${today.toISOString().split('T')[0]}`
      ))
      .limit(1);

    if (todayLogin.length > 0) {
      return todayLogin[0]; // Already logged in today
    }

    // Get last login to determine streak
    const lastLogin = await this.db
      .select()
      .from(dailyLogins)
      .where(eq(dailyLogins.userId, userId))
      .orderBy(sql`${dailyLogins.date} DESC`)
      .limit(1);

    let currentStreak = 1;
    if (lastLogin.length > 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastLoginDate = new Date(lastLogin[0].date);
      lastLoginDate.setHours(0, 0, 0, 0);

      if (lastLoginDate.getTime() === yesterday.getTime()) {
        currentStreak = lastLogin[0].streak + 1; // Continue streak
      } else {
        currentStreak = 1; // Reset streak
      }
    }

    // Calculate points (base 50 + streak bonus, max 200 bonus)
    const basePoints = 50;
    const streakBonus = Math.min(currentStreak * 10, 200);
    const pointsEarned = basePoints + streakBonus;

    // Create today's login record
    const [newLogin] = await this.db
      .insert(dailyLogins)
      .values({
        userId,
        date: today,
        streak: currentStreak,
        pointsEarned,
        claimed: false
      })
      .returning();

    // If first time user, also create welcome notification
    const userCreatedToday = await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        sql`DATE(${users.createdAt}) = ${today.toISOString().split('T')[0]}`
      ))
      .limit(1);

    if (userCreatedToday.length > 0) {
      // Create welcome notification for new users
      await this.createNotification({
        userId,
        type: 'welcome',
        title: '🎉 Welcome to BetChat!',
        message: 'You received 1000 points for joining! Start betting and challenging friends.',
        data: { points: 1000, type: 'welcome_bonus' }
      });

      // Check if user was referred
      const user = userCreatedToday[0];
      if (user.referredBy) {
        // Find referrer and create referral notification
        const referrer = await this.getUser(user.referredBy);
        if (referrer) {
          await this.createNotification({
            userId: user.referredBy,
            type: 'referral_reward',
            title: '💰 Referral Bonus!',
            message: `You earned 500 points for referring @${user.firstName || user.username || 'a new user'}!`,
            data: { 
              points: 500, 
              referredUserId: userId,
              referredUserName: user.firstName || user.username,
              type: 'referral_bonus'
            }
          });

          // Add referral points to referrer
          await this.db
            .update(users)
            .set({ 
              points: sql`${users.points} + 500`,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.referredBy));

          // Create transaction for referrer
          await this.createTransaction({
            userId: user.referredBy,
            type: 'referral_bonus',
            amount: '500',
            description: `Referral bonus for ${user.firstName || user.username || 'new user'}`,
            status: 'completed'
          });
        }
      }
    }

    return newLogin;
  }

  // Get user created events
  async getUserCreatedEvents(userId: string): Promise<any[]> {
    const createdEvents = await this.db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        eventPool: events.eventPool,
        status: events.status,
        endDate: events.endDate,
        createdAt: events.createdAt,
        participantCount: count(eventParticipants.id),
      })
      .from(events)
      .leftJoin(eventParticipants, eq(eventParticipants.eventId, events.id))
      .where(eq(events.creatorId, userId))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt));

    return createdEvents;
  }

  // Get user joined events
  async getUserJoinedEvents(userId: string): Promise<any[]> {
    const joinedEvents = await this.db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        eventPool: events.eventPool,
        status: events.status,
        endDate: events.endDate,
        createdAt: events.createdAt,
        participantAmount: eventParticipants.amount,
        participantStatus: eventParticipants.status,
        prediction: eventParticipants.prediction,
        joinedAt: eventParticipants.joinedAt,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(events.id, eventParticipants.eventId))
      .where(eq(eventParticipants.userId, userId))
      .orderBy(desc(eventParticipants.joinedAt));

    return joinedEvents;
  }

  // Admin Management Functions
  async deleteEvent(eventId: number) {
    // Delete related records first
    await this.db.delete(eventParticipants).where(eq(eventParticipants.eventId, eventId));
    await this.db.delete(eventMessages).where(eq(eventMessages.eventId, eventId));
    await this.db.delete(messageReactions).where(eq(messageReactions.messageId, sql`(SELECT id FROM event_messages WHERE event_id = ${eventId})`));

    // Delete the event
    await this.db.delete(events).where(eq(events.id, eventId));

    console.log(`Event ${eventId} deleted by admin`);
  }

  async toggleEventChat(eventId: number, enabled: boolean) {
    await this.db.update(events)
      .set({ 
        chatEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId));

    console.log(`Event ${eventId} chat ${enabled ? 'enabled' : 'disabled'} by admin`);
  }

  async deleteChallenge(challengeId: number) {
    // Delete related records first
    // await db.delete(challengeParticipants).where(eq(challengeParticipants.challengeId, challengeId)); // Assuming you have a challengeParticipants table

    // Delete the challenge
    await this.db.delete(challenges).where(eq(challenges.id, challengeId));

    console.log(`Challenge ${challengeId} deleted by admin`);
  }

  // Admin Functions
  async getAdminUsers() {
    const admins = await this.db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      email: users.email,
      level: users.level,
      points: users.points,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin,
      status: users.status
    }).from(users).where(eq(users.isAdmin, true));

    return admins;
  }



  // Platform Settings
  async getPlatformSettings(): Promise<PlatformSettings> {
    const [settings] = await this.db.select().from(platformSettings).limit(1);

    if (!settings) {
      // Create default settings if none exist
      const [defaultSettings] = await this.db.insert(platformSettings).values({}).returning();
      return defaultSettings;
    }

    return settings;
  }

  async updatePlatformSettings(settingsUpdate: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const existingSettings = await this.getPlatformSettings();

    const [updatedSettings] = await this.db
      .update(platformSettings)
      .set({
        ...settingsUpdate,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, existingSettings.id))
      .returning();

    return updatedSettings;
  }

  // Advanced Admin Tools
  async addEventFunds(eventId: number, amount: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Add funds to event pool
      await tx
        .update(events)
        .set({
          eventPool: sql`${events.eventPool} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));

      // Create transaction record
      await tx.insert(transactions).values({
        userId: 'admin',
        type: 'admin_fund',
        amount: amount.toString(),
        description: `Admin added ₦${amount} to event ${eventId}`,
        status: 'completed',
      });
    });
  }

  async giveUserPoints(userId: string, points: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Add points to user
      await tx
        .update(users)
        .set({
          points: sql`${users.points} + ${points}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Create transaction record
      await tx.insert(transactions).values({
        userId: userId,
        type: 'admin_points',
        amount: points.toString(),
        description: `Admin gave ${points} points`,
        status: 'completed',
      });
    });
  }

  async updateEventCapacity(eventId: number, additionalSlots: number): Promise<void> {
    await this.db
      .update(events)
      .set({
        maxParticipants: sql`${events.maxParticipants} + ${additionalSlots}`,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));
  }

  async broadcastMessage(message: string, type: string): Promise<void> {
    // Get all users to broadcast to
    const allUsers = await this.db.select({ id: users.id }).from(users);

    // Create notifications for all users
    const notificationData = allUsers.map(user => ({
      userId: user.id,
      type: 'broadcast' as const,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Message`,
      message: message,
      data: { broadcastType: type },
    }));

    await this.db.insert(notifications).values(notificationData);
  }

  // Event lifecycle notification methods
  async notifyEventStarting(eventId: number): Promise<void> {
    const event = await this.getEventById(eventId);
    if (!event) return;

    const participants = await this.getEventParticipants(eventId);

    for (const participant of participants) {
      await this.createNotification({
        userId: participant.userId,
        type: 'event_starting',
        title: '🏁 Event Starting Soon',
        message: `The event "${event.title}" is starting in 1 hour!`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          startTime: event.endDate
        },
      });
    }

    // Notify creator
    await this.createNotification({
      userId: event.creatorId,
      type: 'event_starting',
      title: '🏁 Your Event is Starting Soon',
      message: `Your event "${event.title}" is starting in 1 hour!`,
      data: { 
        eventId: eventId,
        eventTitle: event.title,
        startTime: event.endDate
      },
    });
  }

  async notifyEventEnding(eventId: number): Promise<void> {
    const event = await this.getEventById(eventId);
    if (!event) return;

    const participants = await this.getEventParticipants(eventId);

    for (const participant of participants) {
      await this.createNotification({
        userId: participant.userId,
        type: 'event_ending',
        title: '⏰ Event Ending Soon',
        message: `The event "${event.title}" is ending in 1 hour! Make sure your prediction is locked in.`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          endTime: event.endDate,
          prediction: participant.prediction ? 'YES' : 'NO',
          amount: parseFloat(participant.amount)
        },
      });
    }

    // Notify creator
    await this.createNotification({
      userId: event.creatorId,
      type: 'event_ending',
      title: '⏰ Your Event is Ending Soon',
      message: `Your event "${event.title}" is ending in 1 hour! Results will need to be set soon.`,
      data: { 
        eventId: eventId,
        eventTitle: event.title,
        endTime: event.endDate
      },
    });
  }

  async notifyFundsReleased(userId: string, eventId: number, amount: number, isWinner: boolean): Promise<void> {
    const event = await this.getEventById(eventId);
    if (!event) return;

    if (isWinner) {
      await this.createNotification({
        userId: userId,
        type: 'funds_released',
        title: '🎉 You Won!',
        message: `Congratulations! You won ₦${amount.toLocaleString()} from "${event.title}". Funds have been released to your wallet.`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          amount: amount,
          isWinner: true
        },
      });
    } else {
      await this.createNotification({
        userId: userId,
        type: 'funds_released',
        title: '😔 Event Results',
        message: `The event "${event.title}" has concluded. Better luck next time!`,
        data: { 
          eventId: eventId,
          eventTitle: event.title,
          amount: 0,
          isWinner: false
        },
      });
    }
  }

  // Missing admin functions
  async getAdminNotifications(limit: number): Promise<any[]> {
    return await this.db.select().from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async broadcastNotification(data: any): Promise<any> {
    // Get all users if no target specified
    const targetUsers = data.targetUserIds || 
      (await this.db.select({ id: users.id }).from(users)).map(u => u.id);

    const notificationData = targetUsers.map((userId: string) => ({
      userId: userId,
      type: data.type || 'admin_announcement',
      title: data.title,
      message: data.message,
    }));

    await this.db.insert(notifications).values(notificationData);
    return { success: true, count: notificationData.length };
  }

  async searchUsers(query: string, limit: number): Promise<any[]> {
    return await this.db.select().from(users)
      .where(sql`${users.username} ILIKE ${`%${query}%`} OR ${users.firstName} ILIKE ${`%${query}%`}`)
      .limit(limit);
  }

  // Push notification subscription methods
  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    await this.db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: subscription.userAgent || null,
    });
  }

  async getPushSubscriptions(userId: string): Promise<any[]> {
    const subscriptions = await this.db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return subscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));
  }

  async removePushSubscription(endpoint: string): Promise<void> {
    await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }



  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);

      return user;
    } catch (error) {
      console.error("Error fetching user by referral code:", error);
      throw new Error("Failed to fetch user by referral code");
    }
  }

  async updateUserCoins(userId: string, coinAmount: number): Promise<void> {
    await this.db
      .update(users)
      .set({ 
        coins: sql`COALESCE(${users.coins}, 0) + ${coinAmount}`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserPoints(userId: string, pointsAmount: number): Promise<void> {
    await this.db
      .update(users)
      .set({ 
        points: sql`COALESCE(${users.points}, 0) + ${pointsAmount}`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async createReferral(referralData: {
    referrerId: string;
    referredId: string;
    code: string;
    status: string;
  }) {
    try {
      const [result] = await this.db
        .insert(referrals)
        .values({
          referrerId: referralData.referrerId,
          referredId: referralData.referredId,
          code: referralData.code,
          status: referralData.status,
        })
        .returning();

      return result;
    } catch (error) {
      console.error("Error creating referral:", error);
      throw new Error("Failed to create referral");
    }
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      const result = await this.db
        .select()
        .from(events)
        .where(eq(events.creatorId, userId))
        .orderBy(desc(events.createdAt));

      return result;
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    try {
      const result = await this.db
        .select()
        .from(challenges)
        .where(eq(challenges.challenger, userId))
        .orderBy(desc(challenges.createdAt));

      return result;
    } catch (error) {
      console.error('Error getting user challenges:', error);
      throw error;
    }
  }

  // Personalized Event Recommendation Engine Implementation

  async getUserRecommendationProfile(userId: string): Promise<UserRecommendationProfile | undefined> {
    try {
      const [profile] = await this.db
        .select()
        .from(userRecommendationProfiles)
        .where(eq(userRecommendationProfiles.userId, userId))
        .limit(1);

      return profile;
    } catch (error) {
      console.error('Error getting user recommendation profile:', error);
      return undefined;
    }
  }

  async updateUserRecommendationProfile(userId: string, profile: Partial<InsertUserRecommendationProfile>): Promise<UserRecommendationProfile> {
    try {
      // Check if profile exists
      const existingProfile = await this.getUserRecommendationProfile(userId);

      if (existingProfile) {
        // Update existing profile
        const [updated] = await this.db
          .update(userRecommendationProfiles)
          .set({ ...profile, updatedAt: new Date() })
          .where(eq(userRecommendationProfiles.userId, userId))
          .returning();
        return updated;
      } else {
        // Create new profile
        const [created] = await this.db
          .insert(userRecommendationProfiles)
          .values({ userId, ...profile })
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error updating user recommendation profile:', error);
      throw error;
    }
  }

  async generateEventRecommendations(userId: string, limit: number = 10): Promise<EventRecommendation[]> {
    try {
      // Get user's recommendation profile
      const profile = await this.getUserRecommendationProfile(userId);

      // Get active events that user hasn't joined
      const activeEvents = await this.db
        .select()
        .from(events)
        .where(and(
          eq(events.status, 'active'),
          sql`${events.creatorId} != ${userId}`, // Not created by user
          sql`${events.id} NOT IN (
            SELECT event_id FROM event_participants WHERE user_id = ${userId}
          )` // User hasn't joined
        ))
        .orderBy(desc(events.createdAt))
        .limit(50); // Get pool of candidates

      const recommendations: InsertEventRecommendation[] = [];

      for (const event of activeEvents) {
        const score = await this.calculateRecommendationScore(userId, event, profile);
        if (score > 0) {
          recommendations.push({
            userId,
            eventId: event.id,
            recommendationScore: score.toString(),
            recommendationReason: score > 80 ? 'perfect_match' : 
                                 score > 60 ? 'good_match' : 
                                 score > 40 ? 'moderate_match' : 'trending',
            matchFactors: {
              categoryMatch: score * 0.3,
              amountMatch: score * 0.25,
              creatorHistory: score * 0.2,
              trendingScore: score * 0.15,
              timeRelevance: score * 0.1
            }
          });
        }
      }

      // Sort by score and limit results
      recommendations.sort((a, b) => parseFloat(b.recommendationScore) - parseFloat(a.recommendationScore));
      const topRecommendations = recommendations.slice(0, limit);

      // Save to database
      if (topRecommendations.length > 0) {
        // Clear old recommendations for this user
        await this.db.delete(eventRecommendations).where(eq(eventRecommendations.userId, userId));

        // Insert new recommendations
        const inserted = await this.db.insert(eventRecommendations).values(topRecommendations).returning();
        return inserted;
      }

      return [];
    } catch (error) {
      console.error('Error generating event recommendations:', error);
      throw error;
    }
  }

  async getPersonalizedEvents(userId: string, limit: number = 10): Promise<(Event & { recommendationScore: number, recommendationReason: string })[]> {
    try {
      // Generate fresh recommendations
      await this.generateEventRecommendations(userId, limit);

      // Get personalized events with scores
      const personalizedEvents = await this.db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          category: events.category,
          status: events.status,
          creatorId: events.creatorId,
          eventPool: events.eventPool,
          yesPool: events.noPool,
          entryFee: events.entryFee,
          endDate: events.endDate,
          result: events.result,
          adminResult: events.adminResult,
          creatorFee: events.creatorFee,
          isPrivate: events.isPrivate,
          maxParticipants: events.maxParticipants,
          imageUrl: events.imageUrl,
          chatEnabled: events.chatEnabled,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          recommendationScore: eventRecommendations.recommendationScore,
          recommendationReason: eventRecommendations.recommendationReason,
        })
        .from(eventRecommendations)
        .innerJoin(events, eq(events.id, eventRecommendations.eventId))
        .where(eq(eventRecommendations.userId, userId))
        .orderBy(desc(eventRecommendations.recommendationScore))
        .limit(limit);

      return personalizedEvents.map(event => ({
        ...event,
        recommendationScore: parseFloat(event.recommendationScore),
      }));
    } catch (error) {
      console.error('Error getting personalized events:', error);
      throw error;
    }
  }

  async trackUserInteraction(interaction: InsertUserEventInteraction): Promise<UserEventInteraction> {
    try {
      const [tracked] = await this.db.insert(userEventInteractions).values(interaction).returning();

      // Update user's recommendation profile based on interaction
      await this.updateRecommendationProfile(interaction.userId);

      return tracked;
    } catch (error) {
      console.error('Error tracking user interaction:', error);
      throw error;
    }
  }

  async updateRecommendationProfile(userId: string): Promise<void> {
    try {
      // Get user's participation history
      const participationHistory = await this.db
        .select({
          eventId: eventParticipants.eventId,
          prediction: eventParticipants.prediction,
          amount: eventParticipants.amount,
          status: eventParticipants.status,
          category: events.category,
          entryFee: events.entryFee,
        })
        .from(eventParticipants)
        .innerJoin(events, eq(events.id, eventParticipants.eventId))
        .where(eq(eventParticipants.userId, userId));

      // Get interaction history
      const interactions = await this.db
        .select()
        .from(userEventInteractions)
        .where(eq(userEventInteractions.userId, userId));

      // Calculate profile metrics
      const totalEvents = participationHistory.length;
      const totalWins = participationHistory.filter(p => p.status === 'won').length;
      const winRate = totalEvents > 0 ? (totalWins / totalEvents) * 100 : 0;

      // Calculate favorite categories
      const categoryCount: Record<string, number> = {};
      participationHistory.forEach(p => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      });
      const favoriteCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Calculate average bet amount
      const totalAmount = participationHistory.reduce((sum, p) => sum + parseInt(p.amount.toString()), 0);
      const averageBetAmount = totalEvents > 0 ? Math.round(totalAmount / totalEvents) : 0;

      // Calculate engagement score based on interactions
      const engagementScore = Math.min(100, interactions.length * 2 + totalEvents * 5);

      // Update profile
      await this.updateUserRecommendationProfile(userId, {
        favoriteCategories,
        averageBetAmount,
        winRate: winRate.toString(),
        totalEventsJoined: totalEvents,
        totalEventsWon: totalWins,
        engagementScore: engagementScore.toString(),
        lastActivityAt: new Date(),
        socialInteractions: interactions.filter(i => i.interactionType === 'comment').length,
      });
    } catch (error) {
      console.error('Error updating recommendation profile:', error);
      // Don't throw - this is a background update
    }
  }

  private async calculateRecommendationScore(userId: string, event: Event, profile?: UserRecommendationProfile): Promise<number> {
    let score = 0;

    // Base trending score
    const participantCount = await this.db
      .select({ count: count() })
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, event.id));

    const trendingScore = Math.min(20, participantCount[0]?.count || 0);
    score += trendingScore;

    if (!profile) return score;

    // Category matching (30 points max)
    const favoriteCategories = profile.favoriteCategories as string[] || [];
    if (favoriteCategories.includes(event.category)) {
      score += 30;
    }

    // Amount matching (25 points max)
    const userAvgAmount = profile.averageBetAmount || 0;
    const eventAmount = event.entryFee;
    const amountDiff = Math.abs(userAvgAmount - eventAmount);
    const amountScore = Math.max(0, 25 - (amountDiff / userAvgAmount) * 25);
    score += amountScore;

    // Creator history (20 points max)  
    const creatorEvents = await this.db
      .select({ count: count() })
      .from(events)
      .where(eq(events.creatorId, event.creatorId));

    const creatorScore = Math.min(20, (creatorEvents[0]?.count || 0) * 2);
    score += creatorScore;

    // Time relevance (10 points max)
    const hoursUntilEnd = (new Date(event.endDate).getTime() - Date.now()) / (1000 * 60 * 60);
    const timeScore = hoursUntilEnd > 24 ? 10 : hoursUntilEnd > 12 ? 7 : hoursUntilEnd > 2 ? 5 : 2;
    score += timeScore;

    // Engagement boost (15 points max)
    const engagementBoost = Math.min(15, (parseFloat(profile.engagementScore) || 0) * 0.15);
    score += engagementBoost;

    return Math.min(100, Math.round(score));
  }

  // Stories operations
  async getActiveStories(): Promise<any[]> {
    try {
      const results = await this.db
        .select()
        .from(stories)
        .where(eq(stories.isActive, true))
        .orderBy(desc(stories.createdAt));

      return results;
    } catch (error) {
      console.error('Error getting active stories:', error);
      throw error;
    }
  }

  async createStory(storyData: any): Promise<any> {
    try {
      const [story] = await this.db
        .insert(stories)
        .values({
          title: storyData.title,
          content: storyData.content,
          imageUrl: storyData.imageUrl,
          backgroundColor: storyData.backgroundColor || "#6366f1",
          textColor: storyData.textColor || "#ffffff",
          duration: storyData.duration || 15,
          category: storyData.category || "general",
          isActive: storyData.isActive !== false,
        })
        .returning();

      return story;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  async updateStory(storyId: number, updates: any): Promise<any> {
    try {
      const [story] = await this.db
        .update(stories)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(stories.id, storyId))
        .returning();

      return story;
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }

  async deleteStory(storyId: number): Promise<void> {
    try {
      await this.db
        .delete(stories)
        .where(eq(stories.id, storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  async markStoryAsViewed(storyId: number, userId: string): Promise<void> {
    try {
      // Check if already viewed
      const existingView = await this.db
        .select()
        .from(storyViews)
        .where(and(eq(storyViews.storyId, storyId), eq(storyViews.userId, userId)))
        .limit(1);

      if (!existingView.length) {
        // Add view record
        await this.db
          .insert(storyViews)
          .values({
            storyId,
            userId,
          });

        // Increment view count
        await this.db
          .update(stories)
          .set({
            viewCount: sql`${stories.viewCount} + 1`,
          })
          .where(eq(stories.id, storyId));
      }
    } catch (error) {
      console.error('Error marking story as viewed:', error);
      throw error;
    }
  }

  async getUserStats(userId: string) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's events and challenges
    const userEvents = await this.db
      .select()
      .from(eventParticipants)
      .where(eq(eventParticipants.userId, userId));

    const userChallenges = await this.db
      .select()
      .from(challenges)
      .where(or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)));

    const eventsWon = userEvents.filter(p => p.status === 'won').length;
    const challengesWon = userChallenges.filter(c => (c.challenger === userId && c.result === 'challenger_won') || (c.challenged === userId && c.result === 'challenged_won')).length;
    const totalEvents = userEvents.length;
    const totalChallenges = userChallenges.length;

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      points: user.points || 0,
      level: user.level || 1,
      coins: user.coins || 0,
      eventsWon,
      challengesWon,
      totalEvents,
      totalChallenges,
      winRate: totalEvents > 0 ? Math.round((eventsWon / totalEvents) * 100) : 0,
      challengeWinRate: totalChallenges > 0 ? Math.round((challengesWon / totalChallenges) * 100) : 0
    };
  }

  async getLeaderboard() {
    try {
      const leaderboard = await this.db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          level: users.level,
          points: users.points,
          coins: users.coins,
        })
        .from(users)
        .where(eq(users.status, 'active'))
        .orderBy(desc(users.points), desc(users.coins))
        .limit(100);

      return leaderboard;
    } catch (error) {
      console.error("Database error in getLeaderboard:", error);
      // Return empty array if there's a database error
      return [];
    }
  }
}

export const storage = new DatabaseStorage();