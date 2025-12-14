import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Trophy, 
  Coins, 
  Calendar,
  Target,
  Award,
  Gift,
  Crown,
  Flame,
  Clock,
  CheckCircle,
  Users,
  Gamepad2,
  TrendingUp,
  Zap,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RewardRedemptionModal } from '@/components/RewardRedemptionModal';
import { getLevelIcon, getLevelName } from '@/utils/levelSystem';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  status: string;
  createdAt: string;
}

interface DailyLogin {
  id: string;
  streak: number;
  pointsEarned: number;
  claimed: boolean;
  createdAt: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  progress: number;
  maxProgress: number;
  completed: boolean;
  pointsReward: number;
}

interface User {
  id: string;
  points: number;
  coins: number;
  streak: number;
  [key: string]: any;
}

interface UserStats {
  wins: number;
  friendsCount: number;
  eventWins: number;
  challengesCreated: number;
  [key: string]: any;
}

export default function PointsAndBadges() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Fetch user data and stats
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    retry: false,
    enabled: !!user,
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ["/api/user/achievements"],
    retry: false,
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
    enabled: !!user,
  });

  const { data: dailyLogins = [] } = useQuery<DailyLogin[]>({
    queryKey: ["/api/daily-signin/history"],
    retry: false,
    enabled: !!user,
  });

  // Calculate achievement progress from real data
  const getAchievements = (): Achievement[] => {
    if (!userStats) return [];

    return [
      {
        id: 'first_challenge',
        name: 'First Win',
        description: 'Win your first challenge',
        icon: Trophy,
        progress: userStats.wins || 0,
        maxProgress: 1,
        completed: (userStats.wins || 0) >= 1,
        pointsReward: 100
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Login 7 days in a row',
        icon: Flame,
        progress: user?.streak || 0,
        maxProgress: 7,
        completed: (user?.streak || 0) >= 7,
        pointsReward: 250
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Make 10 friends',
        icon: Users,
        progress: userStats.friendsCount || 0,
        maxProgress: 10,
        completed: (userStats.friendsCount || 0) >= 10,
        pointsReward: 500
      },
      {
        id: 'big_better',
        name: 'Big Better',
        description: 'Win 5 events',
        icon: Star,
        progress: userStats.eventWins || 0,
        maxProgress: 5,
        completed: (userStats.eventWins || 0) >= 5,
        pointsReward: 300
      },
      {
        id: 'coin_collector',
        name: 'Coin Collector',
        description: 'Earn 10,000 coins',
        icon: Coins,
        progress: user?.coins || 0,
        maxProgress: 10000,
        completed: (user?.coins || 0) >= 10000,
        pointsReward: 400
      },
      {
        id: 'challenger',
        name: 'Challenger',
        description: 'Create 20 challenges',
        icon: Target,
        progress: userStats.challengesCreated || 0,
        maxProgress: 20,
        completed: (userStats.challengesCreated || 0) >= 20,
        pointsReward: 350
      }
    ];
  };

  const achievements = getAchievements();
  const transactionsArray = Array.isArray(transactions) ? transactions : [];
  const totalPoints = user?.points || 0;
  const totalCoins = user?.coins || 0;
  const currentStreak = user?.streak || 0;

  // Calculate level progress
  const level = Math.floor(totalPoints / 1000) + 1;
  const currentLevelPoints = totalPoints % 1000;
  const progressPercent = (currentLevelPoints / 1000) * 100;
  const pointsToNext = 1000 - currentLevelPoints;

  // Calculate achievements
  const completedAchievements = achievements.filter(a => a.completed).length;
  const totalAchievements = achievements.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3">
      <div className="w-full max-w-4xl mx-auto space-y-4">

        {/* Compact Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Level</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your progress and achievements</p>
          </div>
          <Button
            onClick={() => setShowRewardModal(true)}
            size="sm"
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            data-testid="button-redeem-rewards"
          >
            <Gift className="w-4 h-4 mr-1" />
            Redeem
          </Button>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-xs opacity-90 mb-1">POINTS</div>
                <div className="text-lg font-bold">{totalPoints.toLocaleString()}</div>
                <div className="text-xs opacity-80">Level {level}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-xs opacity-90 mb-1">PROGRESS</div>
                <div className="text-lg font-bold">{Math.round(progressPercent)}%</div>
                <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-white h-1.5 rounded-full" 
                    style={{width: `${progressPercent}%`}}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-xs opacity-90 mb-1">BADGES</div>
                <div className="text-lg font-bold">{completedAchievements}/{totalAchievements}</div>
                <div className="text-xs opacity-80">Unlocked</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-xs opacity-90 mb-1">STREAK</div>
                <div className="text-lg font-bold">{currentStreak}</div>
                <div className="text-xs opacity-80">days</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compact Tab Navigation */}
        <div className="flex bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-1 border border-indigo-100 dark:border-gray-600">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 rounded-md text-sm h-8 transition-all ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105' 
                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50'
            }`}
            data-testid="button-tab-overview"
          >
            Overview
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('badges')}
            className={`flex-1 rounded-md text-sm h-8 transition-all ${
              activeTab === 'badges' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105' 
                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50'
            }`}
            data-testid="button-tab-badges"
          >
            Badges
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('activity')}
            className={`flex-1 rounded-md text-sm h-8 transition-all ${
              activeTab === 'activity' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105' 
                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50'
            }`}
            data-testid="button-tab-activity"
          >
            Activity
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Recent Activity */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                  <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {transactionsArray.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                          {transaction.type === 'challenge_win' && <Trophy className="w-3 h-3 text-yellow-500" />}
                          {transaction.type === 'event_win' && <Star className="w-3 h-3 text-purple-500" />}
                          {transaction.type === 'daily_signin' && <Calendar className="w-3 h-3 text-green-500" />}
                          {!['challenge_win', 'event_win', 'daily_signin'].includes(transaction.type) && <Coins className="w-3 h-3 text-blue-500" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        +{transaction.amount}
                      </div>
                    </div>
                  ))}
                  {transactionsArray.length === 0 && (
                    <div className="text-center py-6">
                      <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                  <Award className="w-4 h-4 mr-2 text-green-500" />
                  Progress Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Challenges Won</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {transactionsArray.filter(t => t.type === 'challenge_win').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Events Won</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {transactionsArray.filter(t => t.type === 'event_win').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Daily Logins</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {dailyLogins.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Total Coins</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {totalCoins.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-4">
            {/* Level Badge */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                  <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                  Current Level Badge
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={getLevelIcon(level)} 
                      alt={`${getLevelName(level)} badge`} 
                      className="w-12 h-12" 
                    />
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{getLevelName(level)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Level {level}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {pointsToNext} points to next level
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{totalPoints.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Progress */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                  <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                  Achievement Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          achievement.completed ? 'bg-purple-100 dark:bg-purple-900/50' : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          <achievement.icon className={`w-4 h-4 ${
                            achievement.completed ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{achievement.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {achievement.progress}/{achievement.maxProgress}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        +{achievement.pointsReward}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {transactionsArray.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                        {transaction.type === 'challenge_win' && <Trophy className="w-3 h-3 text-yellow-500" />}
                        {transaction.type === 'event_win' && <Star className="w-3 h-3 text-purple-500" />}
                        {transaction.type === 'daily_signin' && <Calendar className="w-3 h-3 text-green-500" />}
                        {!['challenge_win', 'event_win', 'daily_signin'].includes(transaction.type) && <Coins className="w-3 h-3 text-blue-500" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status}
                      </Badge>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        +{transaction.amount}
                      </div>
                    </div>
                  </div>
                ))}
                {transactionsArray.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reward Modal */}
        {showRewardModal && (
          <RewardRedemptionModal 
            isOpen={showRewardModal} 
            onClose={() => setShowRewardModal(false)}
            userPoints={totalPoints}
            userCoins={totalCoins}
          />
        )}
      </div>
    </div>
  );
}