
import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Trophy, Users, TrendingUp, Star, ExternalLink } from 'lucide-react';
import MobileLayout, { MobileCard } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { LevelBadge } from "@/components/LevelBadge";
import { formatBalance } from "@/utils/currencyUtils";
import { getAvatarUrl } from "@/utils/avatarUtils";

export default function PublicProfile() {
  const { username } = useParams();
  const [, navigate] = useLocation();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/public/profile", username],
    queryFn: () => apiRequest('GET', `/api/public/profile/${username}`),
    enabled: !!username,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/public/achievements", username],
    queryFn: () => apiRequest('GET', `/api/public/achievements/${username}`),
    enabled: !!username,
  });

  const { data: recentEvents = [] } = useQuery({
    queryKey: ["/api/public/events", username],
    queryFn: () => apiRequest('GET', `/api/public/events/${username}`),
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8">
          <PlayfulLoading type="general" title="Loading Profile" />
        </div>
      </MobileLayout>
    );
  }

  if (error || !profile) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Profile Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The profile @{username} doesn't exist or is not public.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  // Calculate level progress
  const currentLevelXP = (profile.level - 1) * 1000;
  const nextLevelXP = profile.level * 1000;
  const progressXP = profile.xp - currentLevelXP;
  const levelProgress = (progressXP / (nextLevelXP - currentLevelXP)) * 100;

  const getAchievementColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'first':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
      case 'streak':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'social':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'challenge':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'event':
        return 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300';
      default:
        return 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300';
    }
  };

  const getAchievementIcon = (icon: string, category: string) => {
    if (icon) return icon;

    switch (category?.toLowerCase()) {
      case 'first':
        return 'fas fa-star';
      case 'streak':
        return 'fas fa-fire';
      case 'social':
        return 'fas fa-users';
      case 'challenge':
        return 'fas fa-sword';
      case 'event':
        return 'fas fa-calendar-check';
      default:
        return 'fas fa-trophy';
    }
  };

  return (
    <MobileLayout>

      {/* Public Profile Header */}
      <MobileCard className="mb-3 md:hidden">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-16 h-16">
            <AvatarImage 
              src={getAvatarUrl(profile.id, profile.profileImageUrl, profile.firstName || profile.username)} 
              alt={profile.firstName || profile.username || 'User'} 
            />
            <AvatarFallback className="text-lg">
              {(profile.firstName?.[0] || profile.username?.[0] || 'U').toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {profile.firstName || profile.username}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">@{profile.username}</p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-primary font-semibold">Level {profile.level}</span>
              <span className="text-xs text-emerald-600 font-semibold">{profile.stats?.wins || 0} wins</span>
            </div>
          </div>

          <Button 
            onClick={() => window.open(`https://betchat.com/@${profile.username}`, '_blank')}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Share
          </Button>
        </div>

        {/* Compact Level Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Level {profile.level}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {profile.xp} / {nextLevelXP} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-1.5" />
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">{profile.stats?.wins || 0}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{profile.streak}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-600">{achievements.length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Badges</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">{recentEvents.length}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Events</p>
          </div>
        </div>
      </MobileCard>

      {/* Desktop Public Profile Header */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-32 h-32">
                <AvatarImage 
                  src={getAvatarUrl(profile.id, profile.profileImageUrl, profile.firstName || profile.username)} 
                  alt={profile.firstName || profile.username || 'User'} 
                />
                <AvatarFallback className="text-2xl">
                  {(profile.firstName?.[0] || profile.username?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {profile.firstName || profile.username}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      @{profile.username}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <Button 
                    onClick={() => window.open(`https://betchat.com/@${profile.username}`, '_blank')}
                    variant="outline"
                    className="mt-4 md:mt-0"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                </div>

                {/* Level Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Level {profile.level}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {profile.xp} / {nextLevelXP} XP
                    </span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{profile.stats?.wins || 0}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{profile.streak}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-600">{achievements.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Achievements</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{recentEvents.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Events Created</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Profile Tabs */}
      <Tabs defaultValue="achievements" className="space-y-3 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-8 md:h-10">
          <TabsTrigger value="achievements" className="text-xs md:text-sm">Badges</TabsTrigger>
          <TabsTrigger value="events" className="text-xs md:text-sm">Events</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs md:text-sm">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-3 md:space-y-6">
          <MobileCard>
            <div className="md:hidden mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Badges ({achievements.length})</h3>
            </div>
            <div className="hidden md:block">
              <CardHeader>
                <CardTitle>Achievements ({achievements.length})</CardTitle>
              </CardHeader>
            </div>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-trophy text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No achievements yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    This user hasn't unlocked any achievements yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg ${getAchievementColor(achievement.category)}`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-current rounded-full flex items-center justify-center opacity-20">
                          <i className={`${getAchievementIcon(achievement.icon, achievement.category)} text-current text-lg opacity-100`}></i>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <p className="text-sm opacity-80">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs opacity-60">
                          Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                        </p>
                        <div className="flex space-x-1">
                          {achievement.xpReward > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{achievement.xpReward} XP
                            </Badge>
                          )}
                          {achievement.pointsReward > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{achievement.pointsReward} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </MobileCard>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <MobileCard className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Recent Events ({recentEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-calendar text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No events created
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    This user hasn't created any public events yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <i className="fas fa-calendar text-primary text-xs"></i>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {event.title}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {event.category} • {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </MobileCard>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MobileCard className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Total Wins</span>
                    <span className="font-semibold">{profile.stats?.wins || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Active Challenges</span>
                    <span className="font-semibold">{profile.stats?.activeChallenges || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Current Streak</span>
                    <span className="font-semibold">{profile.streak} days</span>
                  </div>
                </div>
              </CardContent>
            </MobileCard>

            <MobileCard className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Current Level</span>
                    <span className="font-semibold">Level {profile.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Total XP</span>
                    <span className="font-semibold">{profile.xp} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Achievements</span>
                    <span className="font-semibold">{achievements.length}</span>
                  </div>
                </div>
              </CardContent>
            </MobileCard>

            <MobileCard className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Events Created</span>
                    <span className="font-semibold">{recentEvents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Member Since</span>
                    <span className="font-semibold">
                      {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Profile Views</span>
                    <span className="font-semibold">-</span>
                  </div>
                </div>
              </CardContent>
            </MobileCard>
          </div>
        </TabsContent>
      </Tabs>


    </MobileLayout>
  );
}
