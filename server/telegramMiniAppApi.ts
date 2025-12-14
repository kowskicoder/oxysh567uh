/**
 * Telegram Mini-App API Routes
 * 
 * This module provides all backend APIs for the Telegram mini-app
 * Handles authentication, user data, wallet, challenges, and events
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import { users, challenges, events, eventParticipants, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";

// Types for Telegram Mini-App
export interface TelegramInitData {
  user: TelegramUser;
  authDate: number;
  queryId?: string;
  hash: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface AuthenticatedTelegramRequest extends Request {
  telegramUser?: TelegramUser;
  telegramId?: string;
}

/**
 * Verify Telegram Mini-App Init Data
 * This is critical for secure authentication
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string
): TelegramInitData | null {
  try {
    // Parse the init data
    const data = Object.fromEntries(
      new URLSearchParams(initData).entries()
    );

    const hash = data.hash;
    if (!hash) return null;

    // Remove hash from data
    delete data.hash;

    // Create the check string
    const checkString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("\n");

    // Calculate expected hash
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    // Verify hash
    if (expectedHash !== hash) return null;

    // Check if data is not older than 24 hours
    const authDate = parseInt(data.auth_date);
    if (Date.now() / 1000 - authDate > 86400) return null;

    // Parse user data
    const user = JSON.parse(data.user || "{}");

    return {
      user,
      authDate,
      queryId: data.query_id,
      hash,
    };
  } catch (error) {
    console.error("Error verifying Telegram init data:", error);
    return null;
  }
}

/**
 * Telegram Mini-App Auth Middleware
 */
export const TelegramMiniAppAuthMiddleware = (
  req: AuthenticatedTelegramRequest,
  res: Response,
  next: () => void
) => {
  const initData = req.headers["x-telegram-init-data"] as string;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!initData || !botToken) {
    return res.status(401).json({
      ok: false,
      error: "Missing authentication data",
    });
  }

  const verified = verifyTelegramInitData(initData, botToken);
  if (!verified) {
    return res.status(401).json({
      ok: false,
      error: "Invalid authentication signature",
    });
  }

  req.telegramUser = verified.user;
  req.telegramId = verified.user.id.toString();
  next();
};

/**
 * Register Telegram Mini-App Routes
 */
export function registerTelegramMiniAppRoutes(app: Express) {
  /**
   * POST /api/telegram/mini-app/auth
   * Authenticate user via Telegram init data
   * Returns user profile and wallet info
   */
  app.post("/api/telegram/mini-app/auth", async (req: AuthenticatedTelegramRequest, res: Response) => {
    try {
      const initData = req.body.initData;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!initData || !botToken) {
        return res.status(400).json({
          ok: false,
          error: "Missing initData or bot token",
        });
      }

      const verified = verifyTelegramInitData(initData, botToken);
      if (!verified) {
        return res.status(401).json({
          ok: false,
          error: "Invalid authentication signature",
        });
      }

      const telegramId = verified.user.id.toString();
      const username = verified.user.username || `user_${verified.user.id}`;
      const firstName = verified.user.first_name || "User";

      // Find or create user
      let userRecord = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .then((rows) => rows[0]);

      if (!userRecord) {
        // Create new user
        await db.insert(users).values({
          telegramId,
          telegramUsername: username,
          firstName,
          username: username,
          isTelegramUser: true,
          coins: 1000, // Starting coins
          balance: 0,
          level: 1,
          xp: 0,
          points: 1000,
        });

        userRecord = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId))
          .then((rows) => rows[0]);
      }

      // Get wallet balance
      const balance = userRecord?.balance || 0;
      const coins = userRecord?.coins || 0;

      res.json({
        ok: true,
        user: {
          id: userRecord?.id,
          telegramId,
          username: userRecord?.username,
          firstName: userRecord?.firstName,
          balance: parseFloat(balance.toString()),
          coins: coins,
          level: userRecord?.level,
          xp: userRecord?.xp,
          profileImageUrl: userRecord?.profileImageUrl,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Telegram auth error:", error);
      res.status(500).json({
        ok: false,
        error: "Authentication failed",
      });
    }
  });

  /**
   * GET /api/telegram/mini-app/user
   * Get authenticated user's profile and stats
   */
  app.get(
    "/api/telegram/mini-app/user",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const telegramId = req.telegramId;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        // Get user statistics
        const participationCount = await db
          .select()
          .from(eventParticipants)
          .where(eq(eventParticipants.userId, user.id))
          .then((rows) => rows.length);

        const challengesCreated = await db
          .select()
          .from(challenges)
          .where(eq(challenges.creatorId, user.id))
          .then((rows) => rows.length);

        const challengesAccepted = await db
          .select()
          .from(challenges)
          .where(eq(challenges.acceptedUserId, user.id))
          .then((rows) => rows.length);

        res.json({
          ok: true,
          user: {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            balance: parseFloat(user.balance?.toString() || "0"),
            coins: user.coins,
            level: user.level,
            xp: user.xp,
            points: user.points,
            streak: user.streak,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
          },
          stats: {
            participationCount,
            challengesCreated,
            challengesAccepted,
            totalEvents: participationCount,
          },
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch user data",
        });
      }
    }
  );

  /**
   * GET /api/telegram/mini-app/wallet
   * Get user's wallet information
   */
  app.get(
    "/api/telegram/mini-app/wallet",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const telegramId = req.telegramId;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        // Get recent transactions
        const recentTransactions = await db
          .select()
          .from(transactions)
          .where(eq(transactions.userId, user.id))
          .orderBy((t) => ({ desc: t.createdAt }))
          .limit(10);

        const balance = parseFloat(user.balance?.toString() || "0");
        const coins = user.coins || 0;

        res.json({
          ok: true,
          wallet: {
            balance,
            coins,
            currency: "NGN",
            totalSpent: user.balance, // Could be calculated more accurately
            totalEarned: 0, // Could be calculated from transactions
            lastUpdated: Date.now(),
          },
          recentTransactions: recentTransactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: parseFloat(t.amount?.toString() || "0"),
            description: t.description,
            status: t.status,
            createdAt: t.createdAt,
          })),
        });
      } catch (error) {
        console.error("Error fetching wallet:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch wallet",
        });
      }
    }
  );

  /**
   * GET /api/telegram/mini-app/challenges
   * Get user's challenges (both created and accepted)
   */
  app.get(
    "/api/telegram/mini-app/challenges",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const telegramId = req.telegramId;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        // Get challenges created by user
        const createdChallenges = await db
          .select()
          .from(challenges)
          .where(eq(challenges.creatorId, user.id));

        // Get challenges accepted by user
        const acceptedChallenges = await db
          .select()
          .from(challenges)
          .where(eq(challenges.acceptedUserId, user.id));

        const formatChallenge = (c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          wagerAmount: parseFloat(c.wagerAmount?.toString() || "0"),
          status: c.status,
          createdAt: c.createdAt,
          deadline: c.deadline,
          winner: c.winnerId,
        });

        res.json({
          ok: true,
          created: createdChallenges.map(formatChallenge),
          accepted: acceptedChallenges.map(formatChallenge),
          stats: {
            total: createdChallenges.length + acceptedChallenges.length,
            createdCount: createdChallenges.length,
            acceptedCount: acceptedChallenges.length,
          },
        });
      } catch (error) {
        console.error("Error fetching challenges:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch challenges",
        });
      }
    }
  );

  /**
   * GET /api/telegram/mini-app/events
   * Get recent events user can participate in
   */
  app.get(
    "/api/telegram/mini-app/events",
    async (req: Request, res: Response) => {
      try {
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        const recentEvents = await db
          .select()
          .from(events)
          .orderBy((e) => ({ desc: e.createdAt }))
          .limit(limit)
          .offset(offset);

        const eventsWithStats = await Promise.all(
          recentEvents.map(async (e) => {
            const participants = await db
              .select()
              .from(eventParticipants)
              .where(eq(eventParticipants.eventId, e.id));

            const yesCount = participants.filter((p) => p.prediction === true).length;
            const noCount = participants.filter((p) => p.prediction === false).length;

            return {
              id: e.id,
              title: e.title,
              description: e.description,
              category: e.category,
              entryFee: parseFloat(e.entryFee?.toString() || "0"),
              status: e.status,
              createdAt: e.createdAt,
              deadline: e.deadline,
              participants: participants.length,
              yesVotes: yesCount,
              noVotes: noCount,
            };
          })
        );

        res.json({
          ok: true,
          events: eventsWithStats,
          pagination: {
            limit,
            offset,
            total: recentEvents.length,
          },
        });
      } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch events",
        });
      }
    }
  );

  /**
   * GET /api/telegram/mini-app/events/:eventId
   * Get detailed event information
   */
  app.get(
    "/api/telegram/mini-app/events/:eventId",
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);

        const event = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .then((rows) => rows[0]);

        if (!event) {
          return res.status(404).json({
            ok: false,
            error: "Event not found",
          });
        }

        const participants = await db
          .select()
          .from(eventParticipants)
          .where(eq(eventParticipants.eventId, eventId));

        const yesParticipants = participants.filter((p) => p.prediction === true);
        const noParticipants = participants.filter((p) => p.prediction === false);

        res.json({
          ok: true,
          event: {
            id: event.id,
            title: event.title,
            description: event.description,
            category: event.category,
            entryFee: parseFloat(event.entryFee?.toString() || "0"),
            status: event.status,
            result: event.result,
            createdAt: event.createdAt,
            deadline: event.deadline,
          },
          stats: {
            totalParticipants: participants.length,
            yesCount: yesParticipants.length,
            noCount: noParticipants.length,
            yesPercentage:
              participants.length > 0
                ? ((yesParticipants.length / participants.length) * 100).toFixed(1)
                : 0,
            noPercentage:
              participants.length > 0
                ? ((noParticipants.length / participants.length) * 100).toFixed(1)
                : 0,
          },
        });
      } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch event details",
        });
      }
    }
  );

  /**
   * POST /api/telegram/mini-app/challenges/create
   * Create a new challenge
   */
  app.post(
    "/api/telegram/mini-app/challenges/create",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const telegramId = req.telegramId;
        const { title, description, category, wagerAmount, deadline, acceptedUserId } = req.body;

        if (!title || !wagerAmount || !category) {
          return res.status(400).json({
            ok: false,
            error: "Missing required fields",
          });
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        // Check balance
        const balance = parseFloat(user.balance?.toString() || "0");
        if (balance < wagerAmount) {
          return res.status(400).json({
            ok: false,
            error: "Insufficient balance",
          });
        }

        // Create challenge
        const newChallenge = await db.insert(challenges).values({
          title,
          description,
          category,
          wagerAmount: wagerAmount.toString(),
          creatorId: user.id,
          acceptedUserId,
          status: "pending",
          deadline: deadline ? new Date(deadline) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        res.status(201).json({
          ok: true,
          challenge: {
            id: newChallenge,
            title,
            description,
            category,
            wagerAmount,
            status: "pending",
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error creating challenge:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to create challenge",
        });
      }
    }
  );

  /**
   * POST /api/telegram/mini-app/challenges/:challengeId/accept
   * Accept a challenge
   */
  app.post(
    "/api/telegram/mini-app/challenges/:challengeId/accept",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const challengeId = parseInt(req.params.challengeId);
        const telegramId = req.telegramId;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        const challenge = await db
          .select()
          .from(challenges)
          .where(eq(challenges.id, challengeId))
          .then((rows) => rows[0]);

        if (!challenge) {
          return res.status(404).json({
            ok: false,
            error: "Challenge not found",
          });
        }

        // Check balance
        const balance = parseFloat(user.balance?.toString() || "0");
        const wagerAmount = parseFloat(challenge.wagerAmount?.toString() || "0");

        if (balance < wagerAmount) {
          return res.status(400).json({
            ok: false,
            error: "Insufficient balance",
          });
        }

        // Update challenge
        await db
          .update(challenges)
          .set({
            acceptedUserId: user.id,
            status: "matched",
            updatedAt: new Date(),
          })
          .where(eq(challenges.id, challengeId));

        res.json({
          ok: true,
          message: "Challenge accepted",
          challenge: {
            id: challenge.id,
            status: "matched",
          },
        });
      } catch (error) {
        console.error("Error accepting challenge:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to accept challenge",
        });
      }
    }
  );

  /**
   * GET /api/telegram/mini-app/achievements
   * Get user's achievements and progress
   */
  app.get(
    "/api/telegram/mini-app/achievements",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const telegramId = req.telegramId;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        res.json({
          ok: true,
          profile: {
            username: user.username,
            level: user.level,
            xp: user.xp,
            points: user.points,
            streak: user.streak,
          },
          stats: {
            totalEvents: 0, // Would query from eventParticipants
            totalChallenges: 0, // Would query from challenges
            wins: 0, // Would calculate from results
          },
        });
      } catch (error) {
        console.error("Error fetching achievements:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch achievements",
        });
      }
    }
  );

  /**
   * GET /api/telegram/mini-app/leaderboard
   * Get global leaderboard
   */
  app.get(
    "/api/telegram/mini-app/leaderboard",
    async (req: Request, res: Response) => {
      try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        const topUsers = await db
          .select()
          .from(users)
          .orderBy((u) => ({ desc: u.points }))
          .limit(limit);

        res.json({
          ok: true,
          leaderboard: topUsers.map((user, index) => ({
            rank: index + 1,
            username: user.username,
            level: user.level,
            points: user.points,
            xp: user.xp,
          })),
        });
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch leaderboard",
        });
      }
    }
  );

  /**
   * POST /api/telegram/mini-app/deposit
   * Handle wallet deposit (simplified)
   */
  app.post(
    "/api/telegram/mini-app/deposit",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const { amount } = req.body;
        const telegramId = req.telegramId;

        if (!amount || amount <= 0) {
          return res.status(400).json({
            ok: false,
            error: "Invalid amount",
          });
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        res.json({
          ok: true,
          message: "Deposit initiated",
          paymentUrl: `https://pay.paystack.co/pay?amount=${amount * 100}&email=${user.username}@bantah.com`,
        });
      } catch (error) {
        console.error("Error initiating deposit:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to initiate deposit",
        });
      }
    }
  );

  /**
   * GET /api/telegram/mini-app/stats
   * Get user's overall statistics
   */
  app.get(
    "/api/telegram/mini-app/stats",
    TelegramMiniAppAuthMiddleware,
    async (req: AuthenticatedTelegramRequest, res: Response) => {
      try {
        const telegramId = req.telegramId;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId as string))
          .then((rows) => rows[0]);

        if (!user) {
          return res.status(404).json({
            ok: false,
            error: "User not found",
          });
        }

        res.json({
          ok: true,
          stats: {
            userId: user.id,
            username: user.username,
            level: user.level,
            xp: user.xp,
            points: user.points,
            balance: parseFloat(user.balance?.toString() || "0"),
            coins: user.coins,
            streak: user.streak,
            joinedAt: user.createdAt,
          },
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({
          ok: false,
          error: "Failed to fetch stats",
        });
      }
    }
  );
}
