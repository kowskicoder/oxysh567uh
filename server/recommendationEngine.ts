import { storage } from './storage';
import { Event, User, EventParticipant } from '../shared/schema';

export interface RecommendationScore {
  eventId: number;
  score: number;
  reasons: string[];
  category: string;
  title: string;
}

export interface UserPreferences {
  favoriteCategories: string[];
  participationHistory: string[];
  winRate: number;
  averageBetAmount: number;
  preferredRiskLevel: 'low' | 'medium' | 'high';
}

class SocialEventRecommendationEngine {
  
  // Calculate user preferences based on historical data
  async calculateUserPreferences(userId: string): Promise<UserPreferences> {
    const userParticipations = await storage.getUserEventParticipations(userId);
    const userStats = await storage.getUserStats(userId);
    
    // Analyze category preferences from participated events
    const categoryCount: { [key: string]: number } = {};
    let totalBetAmount = 0;
    let totalParticipations = 0;
    
    for (const participation of userParticipations) {
      const event = await storage.getEventById(participation.eventId);
      if (event) {
        const category = event.category || 'general';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        totalBetAmount += parseFloat(participation.amount);
        totalParticipations++;
      }
    }
    
    const favoriteCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    const averageBetAmount = totalParticipations > 0 ? totalBetAmount / totalParticipations : 0;
    const winRate = userStats?.wins ? userStats.wins / Math.max(1, userStats.wins + 1) : 0;
    
    // Determine risk level based on average bet amount
    let preferredRiskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (averageBetAmount < 100) preferredRiskLevel = 'low';
    else if (averageBetAmount > 500) preferredRiskLevel = 'high';
    
    return {
      favoriteCategories,
      participationHistory: favoriteCategories,
      winRate,
      averageBetAmount,
      preferredRiskLevel
    };
  }
  
  // Get social signals for recommendations
  async getSocialSignals(userId: string, eventId: number): Promise<number> {
    const friends = await storage.getFriends(userId);
    const eventParticipants = await storage.getEventParticipants(eventId);
    
    let socialScore = 0;
    
    // Check if friends are participating
    const friendsParticipating = eventParticipants.filter(p => 
      friends.some(f => f.friendId === p.userId || f.userId === p.userId)
    );
    
    socialScore += friendsParticipating.length * 10; // 10 points per friend
    
    // Check popular events (high participation)
    if (eventParticipants.length > 20) socialScore += 15;
    else if (eventParticipants.length > 10) socialScore += 10;
    else if (eventParticipants.length > 5) socialScore += 5;
    
    return Math.min(socialScore, 50); // Cap at 50 points
  }
  
  // Calculate event attractiveness score
  calculateEventScore(event: Event, userPreferences: UserPreferences): number {
    let score = 0;
    const reasons: string[] = [];
    
    // Category preference scoring (0-30 points)
    const categoryIndex = userPreferences.favoriteCategories.indexOf(event.category || 'general');
    if (categoryIndex === 0) {
      score += 30;
      reasons.push(`Your favorite category: ${event.category}`);
    } else if (categoryIndex === 1) {
      score += 20;
      reasons.push(`One of your preferred categories: ${event.category}`);
    } else if (categoryIndex === 2) {
      score += 10;
      reasons.push(`Category you've participated in before: ${event.category}`);
    }
    
    // Entry fee alignment with user's average (0-20 points)
    const entryFee = parseFloat(event.entryFee || '0');
    const avgBet = userPreferences.averageBetAmount;
    
    if (userPreferences.preferredRiskLevel === 'low' && entryFee <= avgBet * 0.8) {
      score += 20;
      reasons.push('Conservative bet amount that fits your style');
    } else if (userPreferences.preferredRiskLevel === 'high' && entryFee >= avgBet * 1.2) {
      score += 20;
      reasons.push('High-stakes event matching your risk appetite');
    } else if (Math.abs(entryFee - avgBet) <= avgBet * 0.2) {
      score += 15;
      reasons.push('Entry fee similar to your usual bets');
    }
    
    // Event freshness (0-15 points)
    const eventAge = Date.now() - new Date(event.createdAt || Date.now()).getTime();
    const hoursOld = eventAge / (1000 * 60 * 60);
    
    if (hoursOld < 2) {
      score += 15;
      reasons.push('Brand new event');
    } else if (hoursOld < 24) {
      score += 10;
      reasons.push('Recent event');
    } else if (hoursOld < 168) { // 1 week
      score += 5;
    }
    
    // Pool size attractiveness (0-15 points)
    const totalPool = parseFloat(event.eventPool?.toString() || '0');
    if (totalPool > 10000) {
      score += 15;
      reasons.push('Large prize pool');
    } else if (totalPool > 5000) {
      score += 10;
      reasons.push('Good prize pool');
    } else if (totalPool > 1000) {
      score += 5;
      reasons.push('Decent prize pool');
    }
    
    return score;
  }
  
  // Main recommendation function
  async getRecommendedEvents(userId: string, limit: number = 10): Promise<RecommendationScore[]> {
    const userPreferences = await this.calculateUserPreferences(userId);
    const availableEvents = await storage.getEvents();
    const userParticipations = await storage.getUserEventParticipations(userId);
    const participatedEventIds = new Set(userParticipations.map(p => p.eventId));
    
    const recommendations: RecommendationScore[] = [];
    
    for (const event of availableEvents) {
      // Skip events user is already participating in
      if (participatedEventIds.has(event.id)) continue;
      
      // Skip events that are too close to ending (less than 1 hour)
      const timeToEnd = new Date(event.endDate || Date.now()).getTime() - Date.now();
      if (timeToEnd < 60 * 60 * 1000) continue;
      
      let baseScore = this.calculateEventScore(event, userPreferences);
      const socialScore = await this.getSocialSignals(userId, event.id);
      const totalScore = baseScore + socialScore;
      
      const reasons: string[] = [];
      
      // Add category reasoning
      if (userPreferences.favoriteCategories.includes(event.category || 'general')) {
        reasons.push(`Popular in ${event.category}`);
      }
      
      // Add social reasoning
      if (socialScore > 20) {
        reasons.push('Many friends participating');
      } else if (socialScore > 0) {
        reasons.push('Some social activity');
      }
      
      // Add timing reasoning
      const hoursToEnd = timeToEnd / (1000 * 60 * 60);
      if (hoursToEnd < 24) {
        reasons.push('Ending soon');
      }
      
      recommendations.push({
        eventId: event.id,
        score: totalScore,
        reasons,
        category: event.category || 'general',
        title: event.title
      });
    }
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  // Get trending events based on recent activity
  async getTrendingEvents(limit: number = 5): Promise<RecommendationScore[]> {
    const events = await storage.getEvents();
    const trending: RecommendationScore[] = [];
    
    for (const event of events) {
      const participants = await storage.getEventParticipants(event.id);
      const messages = await storage.getEventMessages(event.id);
      
      // Calculate trending score based on recent activity
      const recentParticipants = participants.filter(p => {
        const joinTime = new Date(p.joinedAt || Date.now()).getTime();
        return Date.now() - joinTime < 24 * 60 * 60 * 1000; // Last 24 hours
      });
      
      const recentMessages = messages.filter(m => {
        const msgTime = new Date(m.createdAt || Date.now()).getTime();
        return Date.now() - msgTime < 6 * 60 * 60 * 1000; // Last 6 hours
      });
      
      const trendScore = (recentParticipants.length * 5) + (recentMessages.length * 2);
      
      if (trendScore > 0) {
        trending.push({
          eventId: event.id,
          score: trendScore,
          reasons: [
            `${recentParticipants.length} recent participants`,
            `${recentMessages.length} recent messages`,
            'High activity event'
          ],
          category: event.category || 'general',
          title: event.title
        });
      }
    }
    
    return trending
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  // Get similar events based on category and characteristics
  async getSimilarEvents(eventId: number, limit: number = 5): Promise<RecommendationScore[]> {
    const baseEvent = await storage.getEventById(eventId);
    if (!baseEvent) return [];
    
    const allEvents = await storage.getEvents();
    const similar: RecommendationScore[] = [];
    
    for (const event of allEvents) {
      if (event.id === eventId) continue;
      
      let similarityScore = 0;
      const reasons: string[] = [];
      
      // Category similarity
      if (event.category === baseEvent.category) {
        similarityScore += 40;
        reasons.push(`Same category: ${event.category}`);
      }
      
      // Entry fee similarity
      const baseFee = parseFloat(baseEvent.entryFee || '0');
      const eventFee = parseFloat(event.entryFee || '0');
      const feeRatio = Math.min(baseFee, eventFee) / Math.max(baseFee, eventFee);
      
      if (feeRatio > 0.8) {
        similarityScore += 20;
        reasons.push('Similar entry fee');
      } else if (feeRatio > 0.5) {
        similarityScore += 10;
        reasons.push('Comparable entry fee');
      }
      
      // Duration similarity  
      const baseDuration = new Date(baseEvent.endDate || Date.now()).getTime() - new Date(baseEvent.createdAt || Date.now()).getTime();
      const eventDuration = new Date(event.endDate || Date.now()).getTime() - new Date(event.createdAt || Date.now()).getTime();
      const durationRatio = Math.min(baseDuration, eventDuration) / Math.max(baseDuration, eventDuration);
      
      if (durationRatio > 0.7) {
        similarityScore += 15;
        reasons.push('Similar duration');
      }
      
      if (similarityScore > 30) {
        similar.push({
          eventId: event.id,
          score: similarityScore,
          reasons,
          category: event.category || 'general',
          title: event.title
        });
      }
    }
    
    return similar
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const recommendationEngine = new SocialEventRecommendationEngine();