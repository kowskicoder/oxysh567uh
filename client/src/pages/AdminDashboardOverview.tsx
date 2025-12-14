import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Users, 
  DollarSign, 
  Trophy, 
  Target, 
  Activity,
  AlertCircle,
  ArrowRight,
  Search,
  TrendingUp,
  MessageSquare,
  Zap,
  Star
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalChallenges: number;
  totalRevenue: number;
  dailyActiveUsers: number;
  pendingPayouts: number;
  totalNotifications: number;
}

interface Event {
  id: number;
  title: string;
  status: string;
  eventPool: string;
  yesPool: string;
  noPool: string;
  creatorFee: string;
  endDate: string;
  adminResult: boolean | null;
  result: boolean | null;
  createdAt: string;
  completedAt?: string;
}

interface Challenge {
  id: number;
  title: string;
  status: string;
  amount: string;
  result: string | null;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  challengerUser: { username: string };
  challengedUser: { username: string };
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  level: number;
  points: number;
  balance: string;
  createdAt: string;
  status?: string;
  isAdmin?: boolean;
}

interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminDashboardOverview() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["/api/admin/challenges"],
    retry: false,
  });

  const { data: adminStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: recentUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users", { limit: 10 }],
    retry: false,
  });

  const { data: allUsers = [], isLoading: allUsersLoading } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: platformActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/activity", { limit: 10 }],
    retry: false,
  });

  const needsEventAction = (event: Event) => {
    const endDate = new Date(event.endDate);
    const now = new Date();
    return endDate <= now && event.status === 'active' && event.adminResult === null;
  };

  const needsChallengeAction = (challenge: Challenge) => {
    return challenge.status === 'active' && challenge.dueDate && 
           new Date(challenge.dueDate) <= new Date() && !challenge.result;
  };

  // Filter users based on search
  const filteredUsers = allUsers.filter((user: User) =>
    searchQuery === "" || 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const eventsNeedingAction = events.filter((e: Event) => needsEventAction(e));
  const challengesNeedingAction = challenges.filter((c: Challenge) => needsChallengeAction(c));
  const activeEvents = events.filter((e: Event) => e.status === 'active');
  const completedEvents = events.filter((e: Event) => e.status === 'completed');
  const activeChallenges = challenges.filter((c: Challenge) => c.status === 'active');
  const completedChallenges = challenges.filter((c: Challenge) => c.status === 'completed');

  const totalEventPool = events.reduce((sum: number, e: Event) => sum + parseFloat(e.eventPool || '0'), 0);
  const totalChallengeStaked = challenges.reduce((sum: number, c: Challenge) => sum + (parseFloat(c.amount) * 2), 0);
  const totalCreatorFees = events.reduce((sum: number, e: Event) => sum + parseFloat(e.creatorFee || '0'), 0);
  const totalPlatformFees = completedChallenges.reduce((sum: number, c: Challenge) => sum + (parseFloat(c.amount) * 2 * 0.05), 0);

  const isLoading = eventsLoading || challengesLoading || statsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
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
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Overview of platform activity and management</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Activity className="w-4 h-4 mr-1" />
              Live Monitoring
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{adminStats.totalUsers || allUsers.length}</p>
                  <p className="text-xs text-green-400">+{recentUsers.length} this week</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Volume</p>
                  <p className="text-2xl font-bold text-white">₦{(totalEventPool + totalChallengeStaked).toLocaleString()}</p>
                  <p className="text-xs text-blue-400">All-time trading</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Platform Revenue</p>
                  <p className="text-2xl font-bold text-white">₦{(totalCreatorFees + totalPlatformFees).toLocaleString()}</p>
                  <p className="text-xs text-purple-400">Creator + Platform fees</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Events</p>
                  <p className="text-2xl font-bold text-white">{events.filter((e: Event) => e.status === 'active').length}</p>
                  <p className="text-xs text-blue-400">Currently running</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending Actions</p>
                  <p className="text-2xl font-bold text-white">{eventsNeedingAction.length + challengesNeedingAction.length}</p>
                  <p className="text-xs text-red-400">Need admin intervention</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Required Section */}
        {(eventsNeedingAction.length > 0 || challengesNeedingAction.length > 0) && (
          <Card className="bg-red-900/20 border-red-800">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Urgent Actions Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsNeedingAction.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">Events Needing Resolution</h4>
                      <Badge variant="destructive">{eventsNeedingAction.length}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Events that have ended and need admin result setting
                    </p>
                    <Link href="/admin/events">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Resolve Events <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}

                {challengesNeedingAction.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">Challenges Needing Resolution</h4>
                      <Badge variant="destructive">{challengesNeedingAction.length}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Challenges that are overdue and need admin intervention
                    </p>
                    <Link href="/admin/challenges">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Resolve Challenges <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events Section */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-blue-400" />
                  Event Management
                </div>
                <Link href="/admin/events">
                  <Button size="sm" variant="outline" className="border-slate-600">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Active</p>
                    <p className="text-lg font-bold text-blue-400">{activeEvents.length}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Completed</p>
                    <p className="text-lg font-bold text-green-400">{completedEvents.length}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Pool Value</p>
                    <p className="text-lg font-bold text-white">₦{totalEventPool.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenges Section */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-400" />
                  Challenge Management
                </div>
                <Link href="/admin/challenges">
                  <Button size="sm" variant="outline" className="border-slate-600">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Active</p>
                    <p className="text-lg font-bold text-purple-400">{activeChallenges.length}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Completed</p>
                    <p className="text-lg font-bold text-green-400">{completedChallenges.length}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Staked</p>
                    <p className="text-lg font-bold text-white">₦{totalChallengeStaked.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management and Search */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Search & Management */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-400" />
                  User Management
                </div>
                <Link href="/admin/users">
                  <Button size="sm" variant="outline" className="border-slate-600">
                    Manage Users <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-slate-400 text-sm">Online Users</p>
                    <p className="text-xl font-bold text-green-400">{allUsers.filter((u: any) => u.status === 'Online').length}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-slate-400 text-sm">New This Week</p>
                    <p className="text-xl font-bold text-blue-400">{recentUsers.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Activity */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {platformActivity.length > 0 ? (
                  platformActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                      <div>
                        <p className="text-white text-sm">{activity.description}</p>
                        <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}