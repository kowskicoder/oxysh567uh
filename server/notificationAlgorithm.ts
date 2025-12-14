import { db } from './db';
import { users, notifications, challenges, eventParticipants, events, transactions, dailyLogins } from '../shared/schema';
import { eq, desc, sql, and, or, gte, lte, isNull } from 'drizzle-orm';
import { IStorage } from './storage';
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: "1553294",
  key: "decd2cca5e39cf0cbcd4",
  secret: "1dd966e56c465ea285d9",
  cluster: "mt1",
  useTLS: true,
});

interface UserStats {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  points: number;
  coins: number;
  level: number;
  xp: number;
  streak: number;
  rank: number;
  totalWins: number;
  totalBets: number;
  winStreak: number;
  recentEarnings: number;
  lastActivityDate: Date;
  profileImageUrl?: string;
}

interface NotificationTrigger {
  userId: string;
  type: 'leaderboard_leader' | 'winner_challenge' | 'loser_encourage' | 'event_joiner' | 'streak_performer' | 'daily_login_reminder';
  targetUserId?: string;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class NotificationAlgorithmService {
  private storage: IStorage;
  
  constructor(storage: IStorage) {
    this.storage = storage;
  }

  // Main algorithm entry point - should be called periodically
  async executeNotificationAlgorithm(): Promise<void> {
    try {
      console.log('🔔 Starting notification algorithm execution...');
      
      // Get current leaderboard and user stats
      const leaderboardUsers = await this.getLeaderboardData();
      const userStats = await this.getUsersStatistics(leaderboardUsers);
      
      // Generate notification triggers based on different scenarios
      const triggers = await this.generateNotificationTriggers(userStats);
      
      // Process and send notifications
      await this.processNotificationTriggers(triggers);
      
      console.log(`✅ Notification algorithm completed. Processed ${triggers.length} triggers.`);
    } catch (error) {
      console.error('❌ Notification algorithm error:', error);
    }
  }

  // Get current leaderboard data
  private async getLeaderboardData(): Promise<UserStats[]> {
    const leaderboard = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        points: users.points,
        balance: users.balance,
        level: users.level,
        xp: users.xp,
        streak: users.streak,
        profileImageUrl: users.profileImageUrl,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(desc(users.points), desc(users.level), desc(users.xp))
      .limit(50);

    return leaderboard.map((user, index) => ({
      ...user,
      username: user.username || 'User',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      rank: index + 1,
      totalWins: 0,
      totalBets: 0,
      winStreak: 0,
      recentEarnings: Math.floor(Math.random() * 5000) + 1000, // Simulated earnings for now
      lastActivityDate: user.lastLogin || new Date(),
      coins: Math.floor(Math.random() * 1000) + 100, // Simulated coins for now
    }));
  }

  // Get detailed user statistics
  private async getUsersStatistics(users: UserStats[]): Promise<UserStats[]> {
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        // Get user's betting statistics
        const bettingStats = await this.getUserBettingStats(user.id);
        
        // Get recent challenge activity
        const challengeStats = await this.getUserChallengeStats(user.id);
        
        // Get recent earnings
        const recentEarnings = await this.getRecentEarnings(user.id);
        
        return {
          ...user,
          totalWins: bettingStats.wins + challengeStats.wins,
          totalBets: bettingStats.totalBets + challengeStats.totalChallenges,
          winStreak: Math.max(bettingStats.winStreak, challengeStats.winStreak),
          recentEarnings,
        };
      })
    );

    return enhancedUsers;
  }

  // Get user betting statistics
  private async getUserBettingStats(userId: string): Promise<{
    wins: number;
    totalBets: number;
    winStreak: number;
  }> {
    const participations = await db
      .select({
        prediction: eventParticipants.prediction,
        eventResult: events.result,
        status: eventParticipants.status,
        joinedAt: eventParticipants.joinedAt,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(eq(eventParticipants.userId, userId))
      .orderBy(desc(eventParticipants.joinedAt));

    const wins = participations.filter(p => 
      p.eventResult !== null && p.prediction === p.eventResult
    ).length;

    // Calculate win streak
    let winStreak = 0;
    for (const participation of participations) {
      if (participation.eventResult !== null) {
        if (participation.prediction === participation.eventResult) {
          winStreak++;
        } else {
          break;
        }
      }
    }

    return {
      wins,
      totalBets: participations.length,
      winStreak,
    };
  }

  // Get user challenge statistics
  private async getUserChallengeStats(userId: string): Promise<{
    wins: number;
    totalChallenges: number;
    winStreak: number;
  }> {
    const userChallenges = await db
      .select({
        challenger: challenges.challenger,
        challenged: challenges.challenged,
        result: challenges.result,
        completedAt: challenges.completedAt,
      })
      .from(challenges)
      .where(
        and(
          or(eq(challenges.challenger, userId), eq(challenges.challenged, userId)),
          eq(challenges.status, 'completed')
        )
      )
      .orderBy(desc(challenges.completedAt));

    const wins = userChallenges.filter(c => {
      if (c.result === 'challenger_won' && c.challenger === userId) return true;
      if (c.result === 'challenged_won' && c.challenged === userId) return true;
      return false;
    }).length;

    // Calculate challenge win streak
    let winStreak = 0;
    for (const challenge of userChallenges) {
      const userWon = (challenge.result === 'challenger_won' && challenge.challenger === userId) ||
                      (challenge.result === 'challenged_won' && challenge.challenged === userId);
      
      if (userWon) {
        winStreak++;
      } else {
        break;
      }
    }

    return {
      wins,
      totalChallenges: userChallenges.length,
      winStreak,
    };
  }

  // Get recent earnings (last 7 days)
  private async getRecentEarnings(userId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const earnings = await db
      .select({
        amount: transactions.amount,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.status, 'completed'),
          or(
            eq(transactions.type, 'event_win'),
            eq(transactions.type, 'challenge_win'),
            eq(transactions.type, 'referral_bonus')
          ),
          gte(transactions.createdAt, sevenDaysAgo)
        )
      );

    return earnings.reduce((total, earning) => total + parseFloat(earning.amount), 0);
  }

  // Generate notification triggers based on user stats
  private async generateNotificationTriggers(userStats: UserStats[]): Promise<NotificationTrigger[]> {
    const triggers: NotificationTrigger[] = [];

    // 1. Leaderboard leader notifications (top 5 users)
    const topPerformers = userStats.slice(0, 5);
    for (const performer of topPerformers) {
      if (performer.winStreak >= 3 || performer.recentEarnings >= 1000) {
        triggers.push(...await this.generateLeaderboardChallengeNotifications(performer, userStats));
      }
    }

    // 2. Winner encouragement notifications
    const winners = userStats.filter(u => u.totalWins >= 5 && u.winStreak >= 2);
    for (const winner of winners) {
      triggers.push(...await this.generateWinnerChallengeNotifications(winner));
    }

    // 3. Loser encouragement notifications
    const strugglingUsers = userStats.filter(u => 
      u.totalBets >= 3 && (u.totalWins / u.totalBets) < 0.3
    );
    for (const user of strugglingUsers) {
      triggers.push(...await this.generateLoserEncouragementNotifications(user, userStats));
    }

    // 4. Event participation notifications
    triggers.push(...await this.generateEventParticipationNotifications(userStats));

    // 5. Streak performer notifications
    const streakPerformers = userStats.filter(u => u.streak >= 7);
    for (const performer of streakPerformers) {
      triggers.push(...await this.generateStreakPerformerNotifications(performer, userStats));
    }

    // 6. Daily login streak reminder notifications
    triggers.push(...await this.generateDailyLoginReminderNotifications());

    return triggers;
  }

  // Generate leaderboard challenge notifications
  private async generateLeaderboardChallengeNotifications(
    leader: UserStats,
    allUsers: UserStats[]
  ): Promise<NotificationTrigger[]> {
    const triggers: NotificationTrigger[] = [];
    
    // Get users ranked 6-20 to notify about challenging the leader
    const challengers = allUsers.slice(5, 20);
    
    // Randomly select 3-5 users to notify
    const selectedChallengers = this.getRandomUsers(challengers, Math.floor(Math.random() * 3) + 3);
    
    for (const challenger of selectedChallengers) {
      triggers.push({
        userId: challenger.id,
        type: 'leaderboard_leader',
        targetUserId: leader.id,
        data: {
          leaderName: leader.firstName || leader.username,
          leaderUsername: leader.username,
          leaderRank: leader.rank,
          leaderEarnings: leader.recentEarnings,
          leaderCoins: leader.coins,
          challengerRank: challenger.rank,
        },
        priority: 'medium',
      });
    }

    return triggers;
  }

  // Generate winner challenge notifications
  private async generateWinnerChallengeNotifications(winner: UserStats): Promise<NotificationTrigger[]> {
    const triggers: NotificationTrigger[] = [];
    
    // Encourage winners to challenge 5 more users
    triggers.push({
      userId: winner.id,
      type: 'winner_challenge',
      data: {
        winStreak: winner.winStreak,
        totalWins: winner.totalWins,
        recentEarnings: winner.recentEarnings,
        bonusCoins: 500,
        bonusNaira: 5000,
        challengesNeeded: 5,
      },
      priority: 'high',
    });

    return triggers;
  }

  // Generate loser encouragement notifications
  private async generateLoserEncouragementNotifications(
    user: UserStats,
    allUsers: UserStats[]
  ): Promise<NotificationTrigger[]> {
    const triggers: NotificationTrigger[] = [];
    
    // Find users with similar or slightly lower rank to encourage challenges
    const similarRankedUsers = allUsers.filter(u => 
      u.rank > user.rank && u.rank <= user.rank + 10 && u.id !== user.id
    );
    
    if (similarRankedUsers.length > 0) {
      const targetUser = similarRankedUsers[Math.floor(Math.random() * similarRankedUsers.length)];
      
      triggers.push({
        userId: user.id,
        type: 'loser_encourage',
        targetUserId: targetUser.id,
        data: {
          targetName: targetUser.firstName || targetUser.username,
          targetUsername: targetUser.username,
          targetRank: targetUser.rank,
          userRank: user.rank,
          encouragementBonus: 200,
        },
        priority: 'medium',
      });
    }

    return triggers;
  }

  // Generate event participation notifications
  private async generateEventParticipationNotifications(userStats: UserStats[]): Promise<NotificationTrigger[]> {
    const triggers: NotificationTrigger[] = [];
    
    // Get active events with recent participants
    const activeEvents = await db
      .select({
        id: events.id,
        title: events.title,
        category: events.category,
        entryFee: events.entryFee,
        endDate: events.endDate,
      })
      .from(events)
      .where(eq(events.status, 'active'))
      .limit(5);

    // Get recent event joiners
    const recentJoiners = await db
      .select({
        userId: eventParticipants.userId,
        eventId: eventParticipants.eventId,
        joinedAt: eventParticipants.joinedAt,
      })
      .from(eventParticipants)
      .where(gte(eventParticipants.joinedAt, new Date(Date.now() - 30 * 60 * 1000))) // Last 30 minutes
      .orderBy(desc(eventParticipants.joinedAt))
      .limit(10);

    // Notify random users about recent event activity
    if (recentJoiners.length > 0 && activeEvents.length > 0) {
      const randomUsers = this.getRandomUsers(userStats, Math.floor(Math.random() * 5) + 3);
      
      for (const user of randomUsers) {
        const recentJoiner = recentJoiners[Math.floor(Math.random() * recentJoiners.length)];
        const joinerInfo = userStats.find(u => u.id === recentJoiner.userId);
        const eventInfo = activeEvents.find(e => e.id === recentJoiner.eventId);
        
        if (joinerInfo && eventInfo && joinerInfo.id !== user.id) {
          triggers.push({
            userId: user.id,
            type: 'event_joiner',
            data: {
              joinerName: joinerInfo.firstName || joinerInfo.username,
              joinerUsername: joinerInfo.username,
              eventTitle: eventInfo.title,
              eventCategory: eventInfo.category,
              eventId: eventInfo.id,
              entryFee: eventInfo.entryFee,
            },
            priority: 'low',
          });
        }
      }
    }

    return triggers;
  }

  // Generate streak performer notifications
  private async generateStreakPerformerNotifications(
    performer: UserStats,
    allUsers: UserStats[]
  ): Promise<NotificationTrigger[]> {
    const triggers: NotificationTrigger[] = [];
    
    // Notify random users about streak performers
    const randomUsers = this.getRandomUsers(
      allUsers.filter(u => u.id !== performer.id),
      Math.floor(Math.random() * 4) + 2
    );
    
    for (const user of randomUsers) {
      triggers.push({
        userId: user.id,
        type: 'streak_performer',
        targetUserId: performer.id,
        data: {
          performerName: performer.firstName || performer.username,
          performerUsername: performer.username,
          streak: performer.streak,
          performerRank: performer.rank,
          performerEarnings: performer.recentEarnings,
        },
        priority: 'medium',
      });
    }

    return triggers;
  }

  // Generate daily login reminder notifications for users with unclaimed bonuses
  private async generateDailyLoginReminderNotifications(): Promise<NotificationTrigger[]> {
    const triggers: NotificationTrigger[] = [];

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find users who have signed in today but haven't claimed their bonus
      const unclaimedLoginUsers = await db
        .select({
          userId: dailyLogins.userId,
          streak: dailyLogins.streak,
          pointsEarned: dailyLogins.pointsEarned,
          claimed: dailyLogins.claimed,
          username: users.username,
          firstName: users.firstName,
        })
        .from(dailyLogins)
        .innerJoin(users, eq(dailyLogins.userId, users.id))
        .where(
          and(
            sql`DATE(${dailyLogins.date}) = ${today.toISOString().split('T')[0]}`,
            eq(dailyLogins.claimed, false),
            eq(users.status, 'active')
          )
        );

      // Check if these users already have recent daily login reminder notifications
      for (const user of unclaimedLoginUsers) {
        // Check if user already has an unclaimed daily login notification from today
        const existingNotification = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, user.userId),
              eq(notifications.type, 'daily_login_reminder'),
              eq(notifications.read, false),
              sql`DATE(${notifications.createdAt}) = ${today.toISOString().split('T')[0]}`
            )
          )
          .limit(1);

        // Only create notification if one doesn't exist for today
        if (existingNotification.length === 0) {
          triggers.push({
            userId: user.userId,
            type: 'daily_login_reminder',
            data: {
              streak: user.streak || 1,
              pointsEarned: user.pointsEarned,
              username: user.username || user.firstName,
              streakBonus: Math.min((user.streak || 1) * 10, 200),
              basePoints: 50,
            },
            priority: 'high',
          });
        }
      }

      console.log(`Generated ${triggers.length} daily login reminder notifications`);
    } catch (error) {
      console.error('Error generating daily login reminder notifications:', error);
    }

    return triggers;
  }

  // Process and send notifications
  private async processNotificationTriggers(triggers: NotificationTrigger[]): Promise<void> {
    for (const trigger of triggers) {
      try {
        await this.sendNotificationFromTrigger(trigger);
        // Add small delay to prevent spam
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error processing notification trigger:', error);
      }
    }
  }

  // Send notification based on trigger
  private async sendNotificationFromTrigger(trigger: NotificationTrigger): Promise<void> {
    const notificationData = this.generateNotificationContent(trigger);
    
    await this.storage.createNotification({
      userId: trigger.userId,
      type: trigger.type,
      title: notificationData.title,
      message: notificationData.message,
      data: {
        ...trigger.data,
        targetUserId: trigger.targetUserId,
        action: notificationData.action,
      },
    });

    // Send real-time notification via Pusher
    await pusher.trigger(`user-${trigger.userId}`, 'notification', {
      title: notificationData.title,
      message: notificationData.message,
      type: trigger.type,
      data: trigger.data,
    });
  }

  // Generate notification content based on trigger type
  private generateNotificationContent(trigger: NotificationTrigger): {
    title: string;
    message: string;
    action: string;
  } {
    switch (trigger.type) {
      case 'leaderboard_leader':
        return {
          title: '🏆 Challenge the Leader!',
          message: `@${trigger.data.leaderUsername} is on a winning streak with ₦${trigger.data.leaderEarnings.toLocaleString()} + ${trigger.data.leaderCoins} Coins. Challenge them to take the #${trigger.data.leaderRank} spot!`,
          action: 'challenge_user',
        };

      case 'winner_challenge':
        return {
          title: '🔥 You\'re on Fire!',
          message: `Amazing ${trigger.data.winStreak}-win streak! Challenge 5 more users and win ${trigger.data.bonusCoins} free coins + ₦${trigger.data.bonusNaira.toLocaleString()}!`,
          action: 'create_challenges',
        };

      case 'loser_encourage':
        return {
          title: '💪 Bounce Back Strong!',
          message: `Ready for redemption? @${trigger.data.targetUsername} is ranked #${trigger.data.targetRank}. Challenge them and earn ${trigger.data.encouragementBonus} bonus coins!`,
          action: 'challenge_user',
        };

      case 'event_joiner':
        return {
          title: '🎯 Hot Event Activity!',
          message: `@${trigger.data.joinerUsername} just joined "${trigger.data.eventTitle}" in ${trigger.data.eventCategory}! Don't miss out on the action!`,
          action: 'join_event',
        };

      case 'streak_performer':
        return {
          title: '🔥 Streak Master Alert!',
          message: `@${trigger.data.performerUsername} has a ${trigger.data.streak}-day streak and earned ₦${trigger.data.performerEarnings.toLocaleString()}! Think you can beat them?`,
          action: 'challenge_user',
        };

      case 'daily_login_reminder':
        return {
          title: '🎯 Don\'t Miss Your Daily Bonus!',
          message: `You have an unclaimed ${trigger.data.pointsEarned} points bonus waiting! Day ${trigger.data.streak} streak bonus ready to claim!`,
          action: 'claim_daily_bonus',
        };

      default:
        return {
          title: '🔔 New Notification',
          message: 'You have a new notification!',
          action: 'view',
        };
    }
  }

  // Helper function to get random users
  private getRandomUsers(users: UserStats[], count: number): UserStats[] {
    const shuffled = users.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Schedule periodic execution
  public startNotificationScheduler(): void {
    // Run every 15 minutes
    setInterval(() => {
      this.executeNotificationAlgorithm();
    }, 15 * 60 * 1000);

    // Run immediately on startup
    setTimeout(() => {
      this.executeNotificationAlgorithm();
    }, 30000); // 30 seconds after startup
  }
}