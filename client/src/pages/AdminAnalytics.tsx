
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Trophy,
  Target,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalChallenges: number;
  totalRevenue: number;
  dailyStats: Array<{
    date: string;
    users: number;
    events: number;
    challenges: number;
    revenue: number;
  }>;
  topUsers: Array<{
    id: string;
    username: string;
    points: number;
    eventsParticipated: number;
    challengesWon: number;
  }>;
}

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState("7d");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", { range: dateRange }],
    retry: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["/api/admin/challenges"],
    retry: false,
  });

  // Calculate basic metrics from available data
  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.status === 'Online').length;
  const totalEvents = events.length;
  const totalChallenges = challenges.length;
  const totalEventPool = events.reduce((sum: number, e: any) => sum + parseFloat(e.eventPool || '0'), 0);
  const totalChallengeStaked = challenges.reduce((sum: number, c: any) => sum + (parseFloat(c.amount) * 2), 0);

  const recentSignups = users.filter((u: any) => {
    const createdAt = new Date(u.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdAt > weekAgo;
  }).length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-slate-400">Platform performance and user insights</p>
          </div>
          <div className="flex gap-2">
            {["7d", "30d", "90d"].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range)}
                className={dateRange === range ? "bg-blue-600" : "border-slate-600"}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{totalUsers}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-xs text-green-400">+{recentSignups} this week</span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">{activeUsers}</p>
                  <div className="flex items-center mt-1">
                    <Activity className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-xs text-slate-400">Currently online</span>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Pool Value</p>
                  <p className="text-2xl font-bold text-white">₦{(totalEventPool + totalChallengeStaked).toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-blue-400 mr-1" />
                    <span className="text-xs text-blue-400">Events + Challenges</span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Activities</p>
                  <p className="text-2xl font-bold text-white">{totalEvents + totalChallenges}</p>
                  <div className="flex items-center mt-1">
                    <BarChart3 className="w-4 h-4 text-purple-400 mr-1" />
                    <span className="text-xs text-purple-400">{totalEvents} events, {totalChallenges} challenges</span>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Events */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.slice(0, 5).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{event.title}</p>
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-400">₦{parseFloat(event.eventPool).toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Challenges */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-400" />
                Recent Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {challenges.slice(0, 5).map((challenge: any) => (
                  <div key={challenge.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{challenge.title}</p>
                      <p className="text-xs text-slate-400">
                        {challenge.challengerUser?.username} vs {challenge.challengedUser?.username}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-400">₦{parseFloat(challenge.amount).toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {challenge.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Growth */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">User Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">New Users (7d)</p>
                    <p className="text-xl font-bold text-white">{recentSignups}</p>
                  </div>
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Retention Rate</p>
                    <p className="text-xl font-bold text-white">73%</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Avg. Session</p>
                    <p className="text-xl font-bold text-white">12m</p>
                  </div>
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
