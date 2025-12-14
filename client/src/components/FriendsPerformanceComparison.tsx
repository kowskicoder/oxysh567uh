import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Star, Target, Users, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function FriendsPerformanceComparison() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: performanceData, isLoading, error } = useQuery({
    queryKey: ["/api/friends/performance"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Trophy className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Error Loading Performance Data
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Could not load performance comparison data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData?.comparison) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <Users className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Friends Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Add friends to see performance comparisons and compete with them!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { userStats, friendsStats, comparison } = performanceData;

  // Prepare chart data
  const chartData = comparison.rankings.winRate.map((user: any, index: number) => ({
    name: user.name,
    winRate: user.winRate,
    isCurrentUser: user.id === userStats.id,
    rank: index + 1
  }));

  const levelData = comparison.rankings.level.map((user: any) => ({
    name: user.name,
    level: user.level,
    xp: user.xp,
    isCurrentUser: user.id === userStats.id
  }));

  const getRankingColor = (rank: number, total: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    if (rank <= total * 0.5) return "text-green-500";
    return "text-red-500";
  };

  const getRankingIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <Target className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Win Rate Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  #{comparison.winRateRank}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  out of {comparison.totalFriends + 1} people
                </div>
              </div>
              <div className={getRankingColor(comparison.winRateRank, comparison.totalFriends + 1)}>
                {getRankingIcon(comparison.winRateRank)}
              </div>
            </div>
            <Progress 
              value={((comparison.totalFriends + 1 - comparison.winRateRank) / (comparison.totalFriends + 1)) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              XP Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  #{comparison.xpRank}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  out of {comparison.totalFriends + 1} people
                </div>
              </div>
              <div className={getRankingColor(comparison.xpRank, comparison.totalFriends + 1)}>
                {getRankingIcon(comparison.xpRank)}
              </div>
            </div>
            <Progress 
              value={((comparison.totalFriends + 1 - comparison.xpRank) / (comparison.totalFriends + 1)) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5" />
              Level Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  #{comparison.levelRank}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  out of {comparison.totalFriends + 1} people
                </div>
              </div>
              <div className={getRankingColor(comparison.levelRank, comparison.totalFriends + 1)}>
                {getRankingIcon(comparison.levelRank)}
              </div>
            </div>
            <Progress 
              value={((comparison.totalFriends + 1 - comparison.levelRank) / (comparison.totalFriends + 1)) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Comparison Chart */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Win Rate Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                labelFormatter={(label) => `Player: ${label}`}
              />
              <Bar 
                dataKey="winRate" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Friends Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {comparison.rankings.winRate.map((user: any, index: number) => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  user.id === userStats.id 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRankingIcon(index + 1)}
                    <span className="font-bold text-lg">#{index + 1}</span>
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profileImageUrl} alt={user.name} />
                    <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {user.name}
                      {user.id === userStats.id && (
                        <Badge variant="outline" className="ml-2">You</Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Level {user.level} • {user.xp} XP
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {user.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {user.stats.wins}/{user.stats.totalBets} wins
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats Comparison */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">Your vs Friends Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Your Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Bets</span>
                  <span className="font-semibold">{userStats.stats.totalBets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Wins</span>
                  <span className="font-semibold text-green-600">{userStats.stats.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Win Rate</span>
                  <span className="font-semibold">
                    {userStats.stats.totalBets > 0 ? 
                      ((userStats.stats.wins / userStats.stats.totalBets) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Level</span>
                  <span className="font-semibold">{userStats.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">XP</span>
                  <span className="font-semibold">{userStats.xp}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Friends Average</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Avg Total Bets</span>
                  <span className="font-semibold">
                    {friendsStats.length > 0 ? 
                      Math.round(friendsStats.reduce((sum: number, f: any) => sum + f.stats.totalBets, 0) / friendsStats.length) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Avg Wins</span>
                  <span className="font-semibold text-green-600">
                    {friendsStats.length > 0 ? 
                      Math.round(friendsStats.reduce((sum: number, f: any) => sum + f.stats.wins, 0) / friendsStats.length) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Avg Win Rate</span>
                  <span className="font-semibold">
                    {friendsStats.length > 0 ? (
                      friendsStats.reduce((sum: number, f: any) => {
                        const rate = f.stats.totalBets > 0 ? (f.stats.wins / f.stats.totalBets) * 100 : 0;
                        return sum + rate;
                      }, 0) / friendsStats.length
                    ).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Avg Level</span>
                  <span className="font-semibold">
                    {friendsStats.length > 0 ? 
                      Math.round(friendsStats.reduce((sum: number, f: any) => sum + f.level, 0) / friendsStats.length) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Avg XP</span>
                  <span className="font-semibold">
                    {friendsStats.length > 0 ? 
                      Math.round(friendsStats.reduce((sum: number, f: any) => sum + f.xp, 0) / friendsStats.length) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}