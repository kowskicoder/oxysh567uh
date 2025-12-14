import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import { db } from './db';
import * as schema from '../shared/schema';
import { eq, or, desc } from 'drizzle-orm';
import { storage } from './storage';
import { TelegramLinkingService } from './telegramLinking';


interface TelegramBotConfig {
  token: string;
  channelId: string;
}

interface EventBroadcast {
  id: string | number;
  title: string;
  description?: string;
  creator: {
    name: string;
    username?: string;
  };
  pool?: {
    total_amount?: number;
    entry_amount?: number;
  };
  eventPool?: string;
  yesPool?: string;
  noPool?: string;
  entryFee?: string;
  end_time?: string;
  endDate?: string;
  is_private?: boolean;
  max_participants?: number;
  category?: string;
}

interface ChallengeBroadcast {
  id: string | number;
  title: string;
  description?: string;
  creator: {
    name: string;
    username?: string;
  };
  challenged?: {
    name: string;
    username?: string;
  };
  stake_amount: number;
  status: string;
  end_time?: string;
  category?: string;
}

interface ChallengeResultBroadcast {
  id: string | number;
  title: string;
  winner: {
    name: string;
    username?: string;
  };
  loser: {
    name: string;
    username?: string;
  };
  stake_amount: number;
  category?: string;
  result_type: 'challenger_wins' | 'challenged_wins' | 'draw';
}

interface MatchmakingBroadcast {
  challengeId: string | number;
  challenger: {
    name: string;
    username?: string;
  };
  challenged: {
    name: string;
    username?: string;
  };
  stake_amount: number;
  category?: string;
}

interface LeaderboardBroadcast {
  user: {
    name: string;
    username?: string;
  };
  new_rank: number;
  old_rank?: number;
  total_wins: number;
  total_earnings: number;
  achievement?: string;
}

export class TelegramBotService {
  private token: string;
  private channelId: string;
  private baseUrl: string;
  private webhookUrl: string | null = null;
  private bot: TelegramBot; // Add TelegramBot instance

  constructor(config: TelegramBotConfig) {
    this.token = config.token;
    this.channelId = config.channelId;
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
    this.bot = new TelegramBot(config.token, { polling: false }); // Initialize bot instance, polling disabled as we handle it manually
  }

  // Test bot connection
  async testConnection(): Promise<{ connected: boolean; error?: string; botInfo?: any; channelInfo?: any }> {
    try {
      // Test bot token
      const botInfo = await axios.get(
        `https://api.telegram.org/bot${this.token}/getMe`
      );

      if (!botInfo.data.ok) {
        return {
          connected: false,
          error: `Bot token invalid: ${botInfo.data.description}`
        };
      }

      console.log(`✅ Bot token valid: @${botInfo.data.result.username}`);

      // Test channel access - handle common issues
      try {
        const channelInfo = await axios.get(
          `https://api.telegram.org/bot${this.token}/getChat`,
          {
            params: { chat_id: this.channelId }
          }
        );

        if (!channelInfo.data.ok) {
          return {
            connected: false,
            error: `Channel access failed: ${channelInfo.data.description}`,
            botInfo: botInfo.data.result
          };
        }

        console.log(`✅ Channel access confirmed: ${channelInfo.data.result.title || channelInfo.data.result.first_name}`);

        return {
          connected: true,
          botInfo: botInfo.data.result,
          channelInfo: channelInfo.data.result
        };
      } catch (channelError: any) {
        const errorMsg = channelError.response?.data?.description || channelError.message;

        // Provide specific guidance based on error
        let guidance = '';
        if (errorMsg.includes('chat not found')) {
          guidance = '\n\n📝 How to get the correct channel ID:\n' +
                    '   1. Add @myBantahbot to your channel as admin\n' +
                    '   2. Forward any message from the channel to @userinfobot\n' +
                    '   3. Copy the "Forwarded from chat" ID (should start with -100)\n' +
                    '   4. Update TELEGRAM_CHANNEL_ID in Secrets\n' +
                    '\n   Alternatively, use @mychannelname format (e.g., @mybantahchannel)';
        } else if (errorMsg.includes('bot is not a member')) {
          guidance = '\n\n📝 Bot needs to be added:\n' +
                    '   1. Go to your Telegram channel\n' +
                    '   2. Add @myBantahbot as an administrator\n' +
                    '   3. Grant "Post Messages" permission';
        }

        return {
          connected: false,
          error: errorMsg + guidance,
          botInfo: botInfo.data.result
        };
      }
    } catch (error: any) {
      console.error('❌ Telegram bot test connection error:', error);
      return {
        connected: false,
        error: error.response?.data?.description || error.message
      };
    }
  }

  // Format event message for Telegram
  private formatEventMessage(event: EventBroadcast): string {
    const webAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
    const eventUrl = `https://${webAppUrl}/events/${event.id}/chat`;

    // Calculate pool total
    const eventPoolValue = parseFloat(event.eventPool || '0');
    const yesPoolValue = parseFloat(event.yesPool || '0');
    const noPoolValue = parseFloat(event.noPool || '0');
    const poolTotal = event.pool?.total_amount ||
      (eventPoolValue > 0 ? eventPoolValue : yesPoolValue + noPoolValue) || 0;

    // Format entry fee
    const entryFee = event.pool?.entry_amount || parseFloat(event.entryFee || '0');

    // Format time
    const endTime = event.end_time || event.endDate;
    let timeInfo = '';
    if (endTime) {
      try {
        const endDate = new Date(endTime);
        if (!isNaN(endDate.getTime())) {
          const now = new Date();
          const diffMs = endDate.getTime() - now.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);

          if (diffDays > 0) {
            timeInfo = `⏰ *${diffDays}d ${diffHours % 24}h remaining*`;
          } else if (diffHours > 0) {
            timeInfo = `⏰ *${diffHours}h remaining*`;
          } else {
            timeInfo = `⏰ *Ending soon!*`;
          }
        }
      } catch (error) {
        console.warn('Invalid date in event:', endTime);
      }
    }

    // Get category emoji
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿',
        'sports': '⚽',
        'gaming': '🎮',
        'music': '🎵',
        'politics': '🏛️',
        'entertainment': '🎬',
        'tech': '💻',
        'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '🎯';
    };

    const categoryEmoji = getCategoryEmoji(event.category || '');
    const privacyEmoji = event.is_private ? '🔒' : '🌍';
    const creatorDisplay = event.creator.username ? `@${event.creator.username}` : event.creator.name;

    const message = `🔥 *NEW PREDICTION EVENT*

━━━━━━━━━━━━━━━━━━━━━
${categoryEmoji} *${event.title}*
━━━━━━━━━━━━━━━━━━━━━

${event.description ? `💭 _${event.description}_\n` : ''}
👤 *Creator:* ${creatorDisplay}
💰 *Current Pool:* ₦${poolTotal.toLocaleString()}
🎫 *Entry Fee:* ₦${entryFee.toLocaleString()}
👥 *Max Players:* ${event.max_participants || 'Unlimited'}
${privacyEmoji} *${event.is_private ? 'Private' : 'Public'}* • ${categoryEmoji} *${(event.category || 'General').charAt(0).toUpperCase() + (event.category || 'General').slice(1)}*

${timeInfo}

━━━━━━━━━━━━━━━━━━━━━
🚀 [*JOIN EVENT NOW*](${eventUrl})
━━━━━━━━━━━━━━━━━━━━━

#BetChat #Prediction #${event.category || 'Event'}`;

    return message;
  }

  // Format challenge message for Telegram
  private formatChallengeMessage(challenge: ChallengeBroadcast): string {
    const webAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
    const challengeUrl = `https://${webAppUrl}/challenges/${challenge.id}`;

    // Format time
    const endTime = challenge.end_time;
    let timeInfo = '';
    if (endTime) {
      try {
        const endDate = new Date(endTime);
        if (!isNaN(endDate.getTime())) {
          const now = new Date();
          const diffMs = endDate.getTime() - now.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);

          if (diffDays > 0) {
            timeInfo = `⏰ *${diffDays}d ${diffHours % 24}h to accept*`;
          } else if (diffHours > 0) {
            timeInfo = `⏰ *${diffHours}h to accept*`;
          } else {
            timeInfo = `⏰ *Accept soon!*`;
          }
        }
      } catch (error) {
        console.warn('Invalid date in challenge:', endTime);
      }
    }

    // Get category emoji
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿',
        'sports': '⚽',
        'gaming': '🎮',
        'music': '🎵',
        'politics': '🏛️',
        'entertainment': '🎬',
        'tech': '💻',
        'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '⚔️';
    };

    const categoryEmoji = getCategoryEmoji(challenge.category || '');
    const challengerDisplay = challenge.creator.username ? `@${challenge.creator.username}` : challenge.creator.name;
    const challengedDisplay = challenge.challenged
      ? (challenge.challenged.username ? `@${challenge.challenged.username}` : challenge.challenged.name)
      : null;

    const statusEmoji = challenge.status === 'pending' ? '⏳' :
                       challenge.status === 'active' ? '🔥' :
                       challenge.status === 'completed' ? '✅' : '📋';

    const message = `⚔️ *NEW P2P CHALLENGE*

━━━━━━━━━━━━━━━━━━━━━
${categoryEmoji} *${challenge.title}*
━━━━━━━━━━━━━━━━━━━━━

${challenge.description ? `💭 _${challenge.description}_\n` : ''}
🚀 *Challenger:* ${challengerDisplay}
${challengedDisplay ? `🎯 *Challenged:* ${challengedDisplay}` : '🌍 *Open Challenge - Anyone can accept!*'}
💰 *Stake Amount:* ₦${challenge.stake_amount.toLocaleString()}
${statusEmoji} *Status:* ${challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
${challenge.category ? `${categoryEmoji} *Category:* ${challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}` : ''}

${timeInfo}

━━━━━━━━━━━━━━━━━━━━━
🎯 [*VIEW CHALLENGE*](${challengeUrl})
━━━━━━━━━━━━━━━━━━━━━

#BetChat #Challenge #P2P #${challenge.category || 'Battle'}`;

    return message;
  }

  // Format challenge result message for Telegram
  private formatChallengeResultMessage(result: ChallengeResultBroadcast): string {
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿', 'sports': '⚽', 'gaming': '🎮', 'music': '🎵',
        'politics': '🏛️', 'entertainment': '🎬', 'tech': '💻', 'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '⚔️';
    };

    const categoryEmoji = getCategoryEmoji(result.category || '');
    const winnerDisplay = result.winner.username ? `@${result.winner.username}` : result.winner.name;
    const loserDisplay = result.loser.username ? `@${result.loser.username}` : result.loser.name;

    const resultEmoji = result.result_type === 'draw' ? '🤝' : '🏆';
    const resultText = result.result_type === 'draw' ? 'DRAW' : 'VICTORY';

    const message = `${resultEmoji} *CHALLENGE ${resultText}*

━━━━━━━━━━━━━━━━━━━━━
${categoryEmoji} *${result.title}*
━━━━━━━━━━━━━━━━━━━━━

${result.result_type === 'draw' ?
  `🤝 *Both players fought well!*
💰 *Stakes returned:* ₦${result.stake_amount.toLocaleString()} each
👥 *${winnerDisplay}* vs *${loserDisplay}*` :
  `🏆 *Winner:* ${winnerDisplay}
💸 *Loser:* ${loserDisplay}
💰 *Prize:* ₦${(result.stake_amount * 2).toLocaleString()}`}

${result.category ? `${categoryEmoji} *Category:* ${result.category.charAt(0).toUpperCase() + result.category.slice(1)}` : ''}

━━━━━━━━━━━━━━━━━━━━━

#BetChat #Challenge #${result.result_type === 'draw' ? 'Draw' : 'Victory'} #${result.category || 'Battle'}`;

    return message;
  }

  // Format matchmaking message for Telegram
  private formatMatchmakingMessage(match: MatchmakingBroadcast): string {
    const getCategoryEmoji = (category: string) => {
      const categoryMap: { [key: string]: string } = {
        'crypto': '₿', 'sports': '⚽', 'gaming': '🎮', 'music': '🎵',
        'politics': '🏛️', 'entertainment': '🎬', 'tech': '💻', 'science': '🔬'
      };
      return categoryMap[category?.toLowerCase()] || '⚔️';
    };

    const categoryEmoji = getCategoryEmoji(match.category || '');
    const challengerDisplay = match.challenger.username ? `@${match.challenger.username}` : match.challenger.name;
    const challengedDisplay = match.challenged.username ? `@${match.challenged.username}` : match.challenged.name;

    const message = `🔥 *CHALLENGE ACCEPTED*

━━━━━━━━━━━━━━━━━━━━━
⚔️ *BATTLE BEGINS*
━━━━━━━━━━━━━━━━━━━━━

🚀 *Challenger:* ${challengerDisplay}
🎯 *Accepted by:* ${challengedDisplay}
💰 *Stakes:* ₦${match.stake_amount.toLocaleString()} each
${match.category ? `${categoryEmoji} *Category:* ${match.category.charAt(0).toUpperCase() + match.category.slice(1)}` : ''}

🍿 *The battle is ON! May the best player win!*

━━━━━━━━━━━━━━━━━━━━━

#BetChat #MatchMade #Battle #${match.category || 'Challenge'}`;

    return message;
  }

  // Format leaderboard update message for Telegram
  private formatLeaderboardMessage(update: LeaderboardBroadcast): string {
    const userDisplay = update.user.username ? `@${update.user.username}` : update.user.name;

    const rankEmoji = update.new_rank <= 3 ?
      (update.new_rank === 1 ? '🥇' : update.new_rank === 2 ? '🥈' : '🥉') : '🏅';

    const changeEmoji = update.old_rank ?
      (update.new_rank < update.old_rank ? '📈' : update.new_rank > update.old_rank ? '📉' : '➡️') : '⭐';

    const changeText = update.old_rank ?
      (update.new_rank < update.old_rank ?
        `climbed from #${update.old_rank} to #${update.new_rank}` :
        update.new_rank > update.old_rank ?
        `dropped from #${update.old_rank} to #${update.new_rank}` :
        `maintained #${update.new_rank}`) :
      `entered the leaderboard at #${update.new_rank}`;

    const message = `${rankEmoji} *LEADERBOARD UPDATE*

━━━━━━━━━━━━━━━━━━━━━
${changeEmoji} *RANK CHANGE*
━━━━━━━━━━━━━━━━━━━━━

👤 *Player:* ${userDisplay}
${rankEmoji} *New Rank:* #${update.new_rank}
${changeEmoji} *${userDisplay}* ${changeText}

📊 *Stats:*
🏆 *Total Wins:* ${update.total_wins}
💰 *Total Earnings:* ₦${update.total_earnings.toLocaleString()}
${update.achievement ? `🎯 *Achievement:* ${update.achievement}` : ''}

━━━━━━━━━━━━━━━━━━━━━
🏆 *Climb the ranks and dominate!*
━━━━━━━━━━━━━━━━━━━━━

#BetChat #Leaderboard #Ranking #Champion`;

    return message;
  }

  // Send message to Telegram channel
  private async sendToChannel(message: string): Promise<boolean> {
    try {
      console.log(`🔍 Attempting to send message to channel: ${this.channelId}`);

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.channelId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      });

      if (response.data.ok) {
        console.log('📤 Message sent to Telegram channel successfully');
        return true;
      } else {
        console.error('❌ Failed to send to Telegram:');
        console.error('Channel ID:', this.channelId);
        console.error('Error:', response.data);

        if (response.data.error_code === 400 && response.data.description?.includes('chat not found')) {
          console.error('🚨 TELEGRAM SETUP ISSUE:');
          console.error('   1. Check if TELEGRAM_CHANNEL_ID is correct');
          console.error('   2. Ensure bot is added to the channel as admin');
          console.error('   3. Channel ID should start with -100 for channels or @ for usernames');
        }

        return false;
      }
    } catch (error) {
      console.error('❌ Error sending to Telegram channel:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      return false;
    }
  }

  // Broadcast new event
  async broadcastEvent(event: EventBroadcast): Promise<boolean> {
    try {
      const message = this.formatEventMessage(event);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting event:', error);
      return false;
    }
  }

  // Broadcast new challenge
  async broadcastChallenge(challenge: ChallengeBroadcast): Promise<boolean> {
    try {
      const message = this.formatChallengeMessage(challenge);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting challenge:', error);
      return false;
    }
  }

  // Send custom message to channel
  async sendCustomMessage(message: string): Promise<boolean> {
    try {
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error sending custom message:', error);
      return false;
    }
  }

  // Broadcast challenge result (win/loss)
  async broadcastChallengeResult(result: ChallengeResultBroadcast): Promise<boolean> {
    try {
      const message = this.formatChallengeResultMessage(result);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting challenge result:', error);
      return false;
    }
  }

  // Broadcast matchmaking (challenge accepted)
  async broadcastMatchmaking(match: MatchmakingBroadcast): Promise<boolean> {
    try {
      const message = this.formatMatchmakingMessage(match);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting matchmaking:', error);
      return false;
    }
  }

  // Broadcast leaderboard update
  async broadcastLeaderboardUpdate(update: LeaderboardBroadcast): Promise<boolean> {
    try {
      const message = this.formatLeaderboardMessage(update);
      return await this.sendToChannel(message);
    } catch (error) {
      console.error('❌ Error broadcasting leaderboard update:', error);
      return false;
    }
  }

  // Get channel info
  async getChannelInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/getChat`, {
        params: { chat_id: this.channelId }
      });

      if (response.data.ok) {
        return response.data.result;
      } else {
        console.error('❌ Failed to get channel info:', response.data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting channel info:', error);
      return null;
    }
  }

  // Phase 1: Account Linking - Set up webhook
  async setupWebhook(webhookUrl: string): Promise<boolean> {
    try {
      this.webhookUrl = webhookUrl;
      const response = await axios.post(`${this.baseUrl}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'inline_query', 'chosen_inline_result'],
      });

      if (response.data.ok) {
        console.log('✅ Telegram webhook set up successfully');
        console.log(`📡 Webhook URL: ${webhookUrl}`);
        return true;
      } else {
        console.error('❌ Failed to set webhook:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting up webhook:', error);
      return false;
    }
  }

  // Simplified /start message - just open mini-app
  async sendStartMessage(chatId: number, firstName: string): Promise<boolean> {
    try {
      const miniAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
      const miniAppFullUrl = `https://${miniAppUrl}/telegram-mini-app`;

      const message = `👋 *Welcome to Bantah, ${firstName}!*

━━━━━━━━━━━━━━━━━━━━━

🚀 Open the app below to:
✅ Create & accept challenges
✅ Manage your wallet
✅ Track your stats
✅ Get instant updates`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎯 Open Bantah',
                web_app: { url: miniAppFullUrl }
              }
            ]
          ]
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending start message:', error);
      return false;
    }
  }


  // Phase 1: Send /start response with login link (via mini-app)
  async sendLoginLink(chatId: number, firstName: string, linkToken: string): Promise<boolean> {
    try {
      const miniAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
      const miniAppFullUrl = `https://${miniAppUrl}/telegram-mini-app`;

      const message = `👋 *Welcome to Bantah, ${firstName}!*

🔗 *Link Your Account*

To start using Bantah through Telegram, you need to link your Telegram account to your Bantah account.

Click the button below to securely link your account. You'll be able to:

✅ Create challenges from Telegram
✅ Accept challenges with one tap
✅ Get instant notifications
✅ View your balance and stats

🔒 *Secure & Private* - Your data is protected

#Bantah #GetStarted`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔗 Link My Account',
                web_app: {
                  url: miniAppFullUrl
                }
              }
            ]
          ]
        }
      });

      if (response.data.ok) {
        console.log(`✅ Mini-app link sent to Telegram user ${chatId}`);
        return true;
      } else {
        console.error('❌ Failed to send mini-app link:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending mini-app link:', error);
      return false;
    }
  }

  // Phase 1: Send account linked confirmation
  async sendAccountLinkedConfirmation(chatId: number, username: string, balance: number): Promise<boolean> {
    try {
      const message = `✅ *Account Linked Successfully!*

━━━━━━━━━━━━━━━━━━━━━
🎉 *Welcome to Bantah, @${username}!*
━━━━━━━━━━━━━━━━━━━━━

Your Telegram account is now linked to your Bantah account.

💰 *Current Balance:* ₦${balance.toLocaleString()}

🎯 *What's Next?*
• Create challenges using /challenge
• Check your balance with /balance
• View active challenges with /mychallenges
• Get help anytime with /help

━━━━━━━━━━━━━━━━━━━━━
🔥 *You're all set! Let's start betting!*
━━━━━━━━━━━━━━━━━━━━━

#Bantah #Linked #Ready`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Return to Bot',
                url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME || ''}`
              },
              {
                text: 'Open Web Profile',
                url: `${process.env.FRONTEND_URL || ''}/profile`
              }
            ]
          ]
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending confirmation:', error);
      return false;
    }
  }

  // Phase 2: Send challenge with inline accept buttons
  async sendChallengeAcceptCard(
    chatId: number,
    challenge: {
      id: number;
      title: string;
      description?: string;
      challenger: { name: string; username?: string };
      challenged: { name: string; username?: string };
      amount: number;
      category?: string;
    }
  ): Promise<boolean> {
    try {
      const webAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
      const challengeUrl = `https://${webAppUrl}/challenges/${challenge.id}`;

      const categoryEmoji = this.getCategoryEmoji(challenge.category || '');

      const message = `⚔️ *CHALLENGE RECEIVED*

━━━━━━━━━━━━━━━━━━━━━
${categoryEmoji} *${challenge.title}*
━━━━━━━━━━━━━━━━━━━━━

${challenge.description ? `💭 _${challenge.description}_\n` : ''}
🚀 *Challenger:* ${challenge.challenger.username ? `@${challenge.challenger.username}` : challenge.challenger.name}
🎯 *You've been challenged!*
💰 *Stake Amount:* ₦${challenge.amount.toLocaleString()}
${challenge.category ? `${categoryEmoji} *Category:* ${challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}` : ''}

⏰ *Quick Actions Below* ⬇️

━━━━━━━━━━━━━━━━━━━━━

#Bantah #Challenge #YourMove`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Accept Challenge',
                callback_data: `accept_${challenge.id}`
              }
            ],
            [
              {
                text: '💰 Deposit & Accept',
                url: `${challengeUrl}?action=deposit_accept`
              }
            ],
            [
              {
                text: '❌ Decline',
                callback_data: `decline_challenge_${challenge.id}`
              },
              {
                text: '👀 View Details',
                url: challengeUrl
              }
            ]
          ]
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending challenge accept card:', error);
      return false;
    }
  }

  // Phase 2: Send challenge accepted confirmation
  async sendChallengeAcceptedConfirmation(
    chatId: number,
    challenge: {
      id: number;
      title: string;
      challenger: { name: string };
      challenged: { name: string };
      amount: number;
    }
  ): Promise<boolean> {
    try {
      const message = `🎯 *CHALLENGE ACCEPTED!*

━━━━━━━━━━━━━━━━━━━━━
⚔️ *${challenge.title}*
━━━━━━━━━━━━━━━━━━━━━

🔥 *The battle is ON!*

🚀 *${challenge.challenger.name}*
     vs
🎯 *${challenge.challenged.name}*

💰 *Stakes:* ₦${challenge.amount.toLocaleString()} each
🔒 *Funds are now in escrow*

🍿 *May the best player win!*

━━━━━━━━━━━━━━━━━━━━━

#Bantah #MatchMade #LetsGo`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending acceptance confirmation:', error);
      return false;
    }
  }

  // Phase 2: Send insufficient funds notification
  async sendInsufficientFundsNotification(
    chatId: number,
    requiredAmount: number,
    currentBalance: number
  ): Promise<boolean> {
    try {
      const webAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
      const walletUrl = `https://${webAppUrl}/wallet`;

      const shortfall = requiredAmount - currentBalance;

      const message = `⚠️ *Insufficient Funds*

━━━━━━━━━━━━━━━━━━━━━
💰 *Current Balance:* ₦${currentBalance.toLocaleString()}
📊 *Required:* ₦${requiredAmount.toLocaleString()}
❌ *Shortfall:* ₦${shortfall.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━

Please deposit funds to accept this challenge.

💡 *Tip:* Use the "Deposit & Accept" button to fund your wallet and accept in one step!`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💰 Add Funds',
                url: walletUrl
              }
            ]
          ]
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending insufficient funds notification:', error);
      return false;
    }
  }

  // Helper: Get category emoji
  private getCategoryEmoji(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'crypto': '₿',
      'sports': '⚽',
      'gaming': '🎮',
      'music': '🎵',
      'politics': '🏛️',
      'entertainment': '🎬',
      'tech': '💻',
      'science': '🔬',
      'trading': '📈',
      'fitness': '🏃',
      'skill': '🧠'
    };
    return categoryMap[category?.toLowerCase()] || '⚔️';
  }

  // Phase 1: Send error message
  async sendErrorMessage(chatId: number, errorType: 'link_expired' | 'already_linked' | 'general'): Promise<boolean> {
    try {
      let message = '';

      switch (errorType) {
        case 'link_expired':
          message = `⚠️ *Link Expired*

Your login link has expired for security reasons.

Please use /start to get a new link.`;
          break;
        case 'already_linked':
          message = `✅ *Already Linked*

Your Telegram account is already linked to a Bantah account.

Use /help to see available commands.`;
          break;
        default:
          message = `❌ *Error Occurred*

Something went wrong. Please try again or contact support.

Use /start to try linking again.`;
      }

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending error message:', error);
      return false;
    }
  }

  // Phase 2: Send quick-access menu with mini-app buttons
  async sendQuickAccessMenu(chatId: number, username: string): Promise<boolean> {
    try {
      const miniAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
      const baseUrl = `https://${miniAppUrl}/telegram-mini-app`;

      const message = `👋 *Welcome to Bantah, @${username}!*

━━━━━━━━━━━━━━━━━━━━━

🔥 *Quick Access*

Use the buttons below to jump straight into your favorite features:`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💰 Wallet',
                web_app: { url: `${baseUrl}?tab=wallet` }
              },
              {
                text: '👤 Profile',
                web_app: { url: `${baseUrl}?tab=profile` }
              }
            ],
            [
              {
                text: '⚔️ Challenges',
                web_app: { url: `${baseUrl}?tab=challenges` }
              },
              {
                text: '🎯 Create New',
                url: `${baseUrl}?action=create`
              }
            ]
          ]
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending quick access menu:', error);
      return false;
    }
  }

  // Send balance notification with wallet button
  async sendBalanceNotification(chatId: number, balance: number, coins: number): Promise<boolean> {
    try {
      const miniAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
      const walletUrl = `https://${miniAppUrl}/telegram-mini-app?tab=wallet`;

      const message = `💰 *Your Wallet*

━━━━━━━━━━━━━━━━━━━━━
💵 Balance: ₦${balance.toLocaleString()}
🪙 Coins: ${coins}
━━━━━━━━━━━━━━━━━━━━━`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💳 Add Funds',
                web_app: { url: walletUrl }
              }
            ]
          ]
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending balance notification:', error);
      return false;
    }
  }

  // Send challenges list with quick view button
  async sendChallengesNotification(chatId: number, challengeCount: number): Promise<boolean> {
    try {
      const miniAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');
      const challengesUrl = `https://${miniAppUrl}/telegram-mini-app?tab=challenges`;

      const message = `⚔️ *Your Challenges*

━━━━━━━━━━━━━━━━━━━━━
🔥 Active Challenges: ${challengeCount}
━━━━━━━━━━━━━━━━━━━━━

Tap below to view and manage your challenges!`;

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '👀 View All',
                web_app: { url: challengesUrl }
              },
              {
                text: '➕ Create New',
                callback_data: 'create_challenge'
              }
            ]
          ]
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('❌ Error sending challenges notification:', error);
      return false;
    }
  }

  // Polling for updates (alternative to webhooks)
  private pollingActive: boolean = false;
  private lastUpdateId: number = 0;
  private isRunning: boolean = false; // Added to track polling state

  async startPolling(): Promise<void> {
    if (this.pollingActive) {
      console.log('⚠️ Polling already active');
      return;
    }

    // Delete any existing webhook first
    try {
      await axios.post(`${this.baseUrl}/deleteWebhook`);
      console.log('🗑️ Deleted existing webhook for polling mode');
    } catch (error) {
      console.log('⚠️ Could not delete webhook:', error);
    }

    // Set up bot command menu
    await this.bot.setMyCommands([
      { command: 'start', description: 'Link your Telegram account to Bantah' },
      { command: 'help', description: 'Show available commands and usage' },
      { command: 'balance', description: 'Check your wallet balance' },
      { command: 'mychallenges', description: 'View your active challenges' },
      { command: 'challenge', description: 'Create a new challenge' },
      { command: 'leaderboard', description: 'View the global leaderboard' },
      { command: 'friends', description: 'Manage your friends list' },
      { command: 'wallet', description: 'Access your wallet' }
    ]);
    console.log('✅ Bot command menu configured');

    console.log('🔄 Starting Telegram bot polling...');
    
    // Set up message handlers before starting polling
    this.bot.on('message', async (msg) => {
      console.log('🎯 Message received:', msg.text, 'from', msg.from?.id);
      const update = { message: msg };
      await this.processUpdate(update);
    });

    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    this.bot.startPolling();
    this.isRunning = true;
    console.log('✅ Telegram bot polling started with message handlers');
  }

  private async pollLoop(): Promise<void> {
    while (this.pollingActive) {
      try {
        const response = await axios.get(`${this.baseUrl}/getUpdates`, {
          params: {
            offset: this.lastUpdateId + 1,
            timeout: 30,
            allowed_updates: ['message', 'callback_query']
          },
          timeout: 35000
        });

        if (response.data.ok && response.data.result.length > 0) {
          for (const update of response.data.result) {
            this.lastUpdateId = update.update_id;
            await this.processUpdate(update);
          }
        }
      } catch (error: any) {
        if (error.code !== 'ECONNABORTED') {
          console.error('❌ Polling error:', error.message);
        }
        // Wait before retrying on error
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async processUpdate(update: any): Promise<void> {
    try {
      const message = update.message;
      if (message?.text) {
        const chatId = message.chat.id;
        const text = message.text;
        const firstName = message.from?.first_name || 'User';
        const telegramId = message.from?.id.toString();

        console.log(`📨 Processing message: "${text}" from user ${telegramId}`);

        // Handle /start command - Always open mini-app
        if (text.startsWith('/start')) {
          console.log(`📱 Received /start from Telegram user ${chatId}`);
          await this.sendStartMessage(chatId, firstName);
          return;
        }

        // Handle /help command
        else if (text.startsWith('/help')) {
          await this.sendHelpMessage(chatId);
        }

        // Handle /balance command
        else if (text.startsWith('/balance')) {
          console.log(`📊 Received /balance from Telegram user ${telegramId}`);
          await this.handleBalanceCommand(chatId, telegramId!);
        }

        // Handle /mychallenges command
        else if (text.startsWith('/mychallenges')) {
          console.log(`⚔️ Received /mychallenges from Telegram user ${telegramId}`);
          await this.handleMyChallengesCommand(chatId, telegramId!);
        }

        // Handle /challenge command
        else if (text.startsWith('/challenge')) {
          await this.handleChallengeCommand(chatId, text, telegramId!);
        }
      }

      // Handle callback queries (inline button clicks)
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error('❌ Error processing update:', error);
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const telegramId = callbackQuery.from.id.toString();

    try {
      const [action, challengeId] = data.split('_');

      if (action === 'accept' || action === 'decline') {
        const user = await storage.getUserByTelegramId(telegramId);
        if (!user) {
          await this.bot.answerCallbackQuery(callbackQuery.id, {
            text: '❌ Account not linked',
            show_alert: true,
          });
          return;
        }

        const [challenge] = await db
          .select()
          .from(schema.challenges)
          .where(eq(schema.challenges.id, challengeId))
          .limit(1);

        if (!challenge || challenge.status !== 'pending') {
          await this.bot.answerCallbackQuery(callbackQuery.id, {
            text: '❌ Challenge no longer available',
            show_alert: true,
          });
          return;
        }

        if (action === 'accept') {
          await db
            .update(schema.challenges)
            .set({ status: 'active' })
            .where(eq(schema.challenges.id, challengeId));

          await this.bot.editMessageText(
            '✅ Challenge accepted! Good luck!',
            {
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
            }
          );

          // Notify creator
          const creatorChatId = await TelegramLinkingService.getTelegramChatIdByUserId(challenge.creatorId);
          if (creatorChatId) {
            await this.bot.sendMessage(
              creatorChatId,
              `✅ @${user.username} accepted your challenge!`
            );
          }
        } else {
          await db
            .update(schema.challenges)
            .set({ status: 'declined' })
            .where(eq(schema.challenges.id, challengeId));

          await this.bot.editMessageText(
            '❌ Challenge declined',
            {
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
            }
          );

          // Notify creator
          const creatorChatId = await TelegramLinkingService.getTelegramChatIdByUserId(challenge.creatorId);
          if (creatorChatId) {
            await this.bot.sendMessage(
              creatorChatId,
              `❌ @${user.username} declined your challenge`
            );
          }
        }

        await this.bot.answerCallbackQuery(callbackQuery.id);
      }
    } catch (error) {
      console.error('Error handling callback query:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ An error occurred',
        show_alert: true,
      });
    }
  }

  stopPolling(): void {
    this.pollingActive = false;
    console.log('🛑 Telegram bot polling stopped');
  }

  // Phase 3: Bot Commands

  private async sendHelpMessage(chatId: number): Promise<void> {
    const message = `🎮 *Bantah Bot Commands*

━━━━━━━━━━━━━━━━━━━━━

📋 *Available Commands:*

/start - Link your Telegram account
/help - Show this help message
/balance - Check your wallet balance
/mychallenges - View your active challenges
/challenge - Create a new challenge

━━━━━━━━━━━━━━━━━━━━━

💡 *How to create a challenge:*
\`/challenge @username 1000 Who wins the game?\`

Format: /challenge @opponent amount title

━━━━━━━━━━━━━━━━━━━━━

🔗 Need more? Visit the web app for full features!`;

    await this.sendMessage(chatId, message);
  }

  private async sendNotLinkedMessage(chatId: number): Promise<void> {
    const message = `⚠️ *Account Not Linked*

You need to link your Telegram account to use this command.

Type /start to link your account first!`;

    await this.sendMessage(chatId, message);
  }

  private async handleBalanceCommand(chatId: number, telegramId: string): Promise<void> {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        const message = `💰 *Your Wallet*

No account linked yet. Open the mini-app to get started!`;
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return;
      }

      const balance = await storage.getUserBalance(user.id);
      await this.sendBalanceNotification(chatId, parseInt(balance.balance || '0'), balance.coins || 0);
    } catch (error) {
      console.error('Error getting balance:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch balance. Try again in the mini-app.');
    }
  }

  private async handleMyChallengesCommand(chatId: number, telegramId: string): Promise<void> {
    try {
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        const message = `⚔️ *Your Challenges*

No account linked yet. Open the mini-app to get started!`;
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return;
      }

      const challenges = await storage.getChallenges(user.id, 10);
      const activeChallenges = challenges.filter((c: any) => c.status === 'active' || c.status === 'pending');
      
      await this.sendChallengesNotification(chatId, activeChallenges.length);
    } catch (error) {
      console.error('Error getting challenges:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch challenges. Try again in the mini-app.');
    }
  }

  private async handleChallengeCommand(chatId: number, text: string, telegramId: string): Promise<void> {
    // Parse: /challenge @username amount title
    const parts = text.split(' ');
    if (parts.length < 4) {
      const message = `❌ *Invalid Format*

Use: \`/challenge @username amount title\`

Example:
\`/challenge @john 1000 Who wins the match?\``;
      await this.sendMessage(chatId, message);
      return;
    }

    const opponentUsername = parts[1].replace('@', '');
    const amount = parseInt(parts[2]);
    const title = parts.slice(3).join(' ');

    if (isNaN(amount) || amount <= 0) {
      await this.sendMessage(chatId, '❌ Invalid amount. Please enter a valid number.');
      return;
    }

    // Check balance
    const creator = await storage.getUserByTelegramId(telegramId);
    if (!creator) {
      await this.sendMessage(chatId, '❌ Your account is not linked. Use /start to link your account.');
      return;
    }

    const [wallet] = await db
      .select()
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, creator.id))
      .limit(1);

    if (!wallet || wallet.balance < amount) {
      await this.sendMessage(chatId, `❌ Insufficient balance. You have ₦${wallet?.balance?.toLocaleString() || 0}`);
      return;
    }

    // Find opponent
    const opponent = await storage.getUserByUsername(opponentUsername);
    if (!opponent) {
      await this.sendMessage(chatId, `❌ User @${opponentUsername} not found.`);
      return;
    }

    if (opponent.id === creator.id) {
      await this.sendMessage(chatId, `❌ You can't challenge yourself!`);
      return;
    }

    // Create challenge
    const challenge = await storage.createChallenge({
      title,
      description: `Challenge created via Telegram by @${creator.username}`,
      creatorId: creator.id,
      challengedId: opponent.id,
      stakeAmount: amount,
      status: 'pending',
      category: 'general'
    });

    const successMessage = `✅ *Challenge Created!*

━━━━━━━━━━━━━━━━━━━━━
🎯 *${title}*
━━━━━━━━━━━━━━━━━━━━━

👤 Challenger: @${creator.username || creator.firstName}
🎮 Opponent: @${opponentUsername}
💰 Stake: ₦${amount.toLocaleString()}

📱 @${opponentUsername} will be notified to accept!`;

    await this.sendMessage(chatId, successMessage);

    // Notify opponent if they have Telegram linked (Phase 4)
    await this.notifyNewChallenge(opponent.id, creator, challenge, amount, title);
  }

  // Phase 4: Real-time Notifications

  async notifyNewChallenge(opponentId: string, challenger: any, challenge: any, amount: number, title: string): Promise<void> {
    const { TelegramLinkingService } = await import('./telegramLinking');
    const opponentChatId = await TelegramLinkingService.getTelegramChatIdByUserId(opponentId);

    if (!opponentChatId) return;

    const webAppUrl = (process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://betchat.replit.app').replace('https://', '');

    const message = `🎯 *New Challenge!*

━━━━━━━━━━━━━━━━━━━━━
📢 *${title}*
━━━━━━━━━━━━━━━━━━━━━

👤 *@${challenger.username || challenger.firstName}* challenges you!
💰 Stake: ₦${amount.toLocaleString()}

Ready to accept?`;

    try {
      await this.bot.sendMessage(opponentChatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Accept', callback_data: `accept_${challenge.id}` },
              { text: '❌ Decline', callback_data: `decline_${challenge.id}` }
            ],
            [
              { text: '👀 View Details', url: `https://${webAppUrl}/challenges/${challenge.id}` }
            ]
          ]
        }
      });
      console.log(`📨 Challenge notification sent to user ${opponentId}`);
    } catch (error) {
      console.error('Error sending challenge notification:', error);
    }
  }

  async notifyChallengeAccepted(challengerId: string, opponent: any, challenge: any): Promise<void> {
    const { TelegramLinkingService } = await import('./telegramLinking');
    const challengerChatId = await TelegramLinkingService.getTelegramChatIdByUserId(challengerId);

    if (!challengerChatId) return;

    const message = `✅ *Challenge Accepted!*

━━━━━━━━━━━━━━━━━━━━━
🎯 *${challenge.title}*
━━━━━━━━━━━━━━━━━━━━━

🎮 *@${opponent.username || opponent.firstName}* accepted your challenge!
💰 Stake: ₦${challenge.stakeAmount?.toLocaleString()}
🏆 Total Pool: ₦${(challenge.stakeAmount * 2).toLocaleString()}

Game on! 🔥`;

    await this.sendMessage(challengerChatId, message);
  }

  async notifyChallengeResult(userId: string, challenge: any, isWinner: boolean, payout: number): Promise<void> {
    const { TelegramLinkingService } = await import('./telegramLinking');
    const chatId = await TelegramLinkingService.getTelegramChatIdByUserId(userId);

    if (!chatId) return;

    const message = isWinner
      ? `🏆 *You Won!*

━━━━━━━━━━━━━━━━━━━━━
🎯 *${challenge.title}*
━━━━━━━━━━━━━━━━━━━━━

🎉 Congratulations!
💰 Winnings: ₦${payout.toLocaleString()}

Keep the winning streak going! 🔥`
      : `😔 *Challenge Lost*

━━━━━━━━━━━━━━━━━━━━━
🎯 *${challenge.title}*
━━━━━━━━━━━━━━━━━━━━━

Better luck next time!
💡 Create a new challenge to win it back!`;

    await this.sendMessage(chatId, message);
  }

  async notifyPaymentReceived(userId: string, amount: number, newBalance: number): Promise<void> {
    const { TelegramLinkingService } = await import('./telegramLinking');
    const chatId = await TelegramLinkingService.getTelegramChatIdByUserId(userId);

    if (!chatId) return;

    const message = `💰 *Payment Received!*

━━━━━━━━━━━━━━━━━━━━━

✅ ₦${amount.toLocaleString()} added to your wallet!
💵 New Balance: ₦${newBalance.toLocaleString()}

Ready to place some bets? 🎯`;

    await this.sendMessage(chatId, message);
  }

  private async sendMessage(chatId: number, text: string): Promise<boolean> {
    try {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Handle inline queries for group challenges
  async handleInlineQuery(inlineQuery: any, apiClient: any): Promise<boolean> {
    try {
      const { id: inlineQueryId, query, from } = inlineQuery;
      const userId = from.id;

      // Get or create user for inline query
      let user = await db.query.users.findFirst({
        where: eq(schema.users.telegramId, userId.toString()),
      });

      if (!user) {
        // Create user from inline query context
        user = await db.insert(schema.users).values({
          telegramId: userId.toString(),
          username: from.username || `user_${userId}`,
          firstName: from.first_name || 'User',
          lastName: from.last_name || '',
          profileImageUrl: '',
        }).returning();
        user = user[0];
      }

      // Search for users based on query
      const searchQuery = query.trim().toLowerCase();
      let results: any[] = [];

      if (searchQuery.length >= 2) {
        // Search users by username or name
        results = await db.query.users.findMany({
          where: or(
            ...(searchQuery ? [
              or(
                ...[
                  { username: { like: `%${searchQuery}%` } },
                  { firstName: { like: `%${searchQuery}%` } },
                  { lastName: { like: `%${searchQuery}%` } },
                ].filter(Boolean)
              ),
            ] : [])
          ),
          limit: 10,
        });

        // Exclude current user
        results = results.filter((u) => u.id !== user.id);
      } else {
        // Return top players if no query
        results = await db.query.users.findMany({
          orderBy: desc(schema.users.points),
          limit: 5,
          where: eq(schema.users.id, user.id ? -1 : user.id), // Exclude self
        });
      }

      // Format results as inline query results for group challenge templates
      const formattedResults = results.slice(0, 10).map((u, idx) => ({
        type: 'article',
        id: `challenge_${u.id}_${Date.now()}`,
        title: `Challenge ${u.firstName}`,
        description: `@${u.username} • Level ${u.level || 1} • ${u.points || 0} pts`,
        input_message_content: {
          message_text: `🥊 *${u.firstName} has been challenged!*\n\nYou were challenged by @${user.username}\n\nWill you accept? Use the mini-app to respond.`,
          parse_mode: 'Markdown',
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⚔️ Accept Challenge',
                web_app: {
                  url: `${(process.env.FRONTEND_URL || 'https://betchat.replit.app').replace('https://', 'https://')}/telegram-mini-app?action=accept_challenge&challenger=${user.id}&challengedUser=${u.id}`,
                },
              },
            ],
          ],
        },
      }));

      // Send results to Telegram
      const response = await axios.post(`${this.baseUrl}/answerInlineQuery`, {
        inline_query_id: inlineQueryId,
        results: formattedResults.length > 0 ? formattedResults : [
          {
            type: 'article',
            id: 'no_results',
            title: 'No users found',
            description: 'Try searching with 2+ characters',
            input_message_content: {
              message_text: `No users found matching "${query}"`,
              parse_mode: 'Markdown',
            },
          },
        ],
        cache_time: 0, // No cache for real-time results
      });

      if (!response.data.ok) {
        console.error('❌ Failed to answer inline query:', response.data);
        return false;
      }

      console.log(`✅ Answered inline query: "${query}" with ${formattedResults.length} results`);
      return true;
    } catch (error) {
      console.error('❌ Error handling inline query:', error);
      return false;
    }
  }

  // Track when bot is added to a group
  async handleGroupJoin(message: any): Promise<boolean> {
    try {
      const { chat, from } = message;

      // Only track groups and supergroups
      if (chat.type !== 'group' && chat.type !== 'supergroup') {
        return false;
      }

      // Store group info in database (extended user data or new groups table)
      const groupInfo = {
        groupId: chat.id.toString(),
        groupTitle: chat.title,
        groupType: chat.type,
        addedBy: from?.id.toString(),
        addedAt: new Date(),
      };

      console.log(`✅ Bot added to group: ${chat.title} (ID: ${chat.id})`);

      // Store group info in database for member discovery
      try {
        // addGroup returns existing or created group
        const created = await storage.addGroup(chat.id.toString(), chat.title, chat.type, from?.id?.toString());
        // Add the user who added the bot as a member if present
        if (from && created && created.id) {
          await storage.addGroupMember(created.id, `telegram-${from.id}`, from.id.toString(), from.username || undefined);
        }
      } catch (err) {
        console.error('Error storing group info:', err);
      }

      // Send welcome message to group
      await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chat.id,
        text: `👋 *Welcome to Bantah!*\n\nI'm here to help you challenge your friends!\n\n🥊 Use me inline to search and challenge users:\n\`@${(await this.getBotUsername())}\` \`username\`\n\nExample: \`@BantahBot football\`\n\n🚀 Open the mini-app to manage challenges and track your stats.`,
        parse_mode: 'Markdown',
      });

      return true;
    } catch (error) {
      console.error('❌ Error handling group join:', error);
      return false;
    }
  }

  // Get bot username
  private async getBotUsername(): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return response.data.result?.username || 'BantahBot';
    } catch {
      return 'BantahBot';
    }
  }

  // Handle chosen inline result (when user selects an inline result)
  async handleChosenInlineResult(result: any, apiClient: any): Promise<boolean> {
    try {
      const { from, inline_query_id, result_id } = result;

      console.log(`✅ Inline result selected: ${result_id} by user ${from.id}`);

      // Optionally track this for analytics
      // This is where we could log user interaction data

      return true;
    } catch (error) {
      console.error('❌ Error handling chosen inline result:', error);
      return false;
    }
  }
}

// Singleton instance
let telegramBot: TelegramBotService | null = null;

export function createTelegramBot(): TelegramBotService | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    console.log('⚠️ Telegram bot credentials not found. Broadcasting disabled.');
    console.log('💡 Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID to enable broadcasting');
    return null;
  }

  if (telegramBot) {
    return telegramBot;
  }

  try {
    telegramBot = new TelegramBotService({ token, channelId });
    console.log('🤖 Telegram bot service initialized');
    return telegramBot;
  } catch (error) {
    console.error('❌ Failed to create Telegram bot service:', error);
    return null;
  }
}

export function getTelegramBot(): TelegramBotService | null {
  return telegramBot;
}