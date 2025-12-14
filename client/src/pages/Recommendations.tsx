import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Star, 
  Users, 
  Clock, 
  Target, 
  Brain,
  Zap,
  Heart,
  Trophy,
  Sparkles,
  ArrowRight,
  Calendar,
  Coins
} from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface RecommendationScore {
  eventId: number;
  score: number;
  reasons: string[];
  category: string;
  title: string;
}

interface UserPreferences {
  favoriteCategories: string[];
  participationHistory: string[];
  winRate: number;
  averageBetAmount: number;
  preferredRiskLevel: 'low' | 'medium' | 'high';
}

interface Event {
  id: number;
  title: string;
  description: string | null;
  category: string;
  entryFee: string;
  endDate: string;
  eventPool: number | null;
  yesPool: number | null;
  noPool: number | null;
  createdAt: string;
  participantsCount?: number;
}

export default function Recommendations() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch personalized recommendations
  const { data: recommendations = [], isLoading: loadingRecommendations } = useQuery<RecommendationScore[]>({
    queryKey: ['/api/recommendations/events'],
    enabled: isAuthenticated,
  });

  // Fetch trending events
  const { data: trending = [], isLoading: loadingTrending } = useQuery<RecommendationScore[]>({
    queryKey: ['/api/recommendations/trending'],
  });

  // Fetch user preferences
  const { data: preferences, isLoading: loadingPreferences } = useQuery<UserPreferences>({
    queryKey: ['/api/recommendations/preferences'],
    enabled: isAuthenticated,
  });

  // Fetch all events for category filtering
  const { data: allEvents = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Get event details for recommendations
  const getEventDetails = (eventId: number): Event | undefined => {
    return allEvents.find(event => event.id === eventId);
  };

  // Filter recommendations by category
  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(recommendations.map(r => r.category)))];

  const handleJoinEvent = (eventId: number) => {
    setLocation(`/events/${eventId}`);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Recommendations</h1>
              <p className="text-gray-600 dark:text-gray-400">Discover events tailored just for you</p>
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          <Tabs defaultValue="for-you" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="for-you" className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>For You</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Your Insights</span>
              </TabsTrigger>
            </TabsList>

            {/* Personalized Recommendations */}
            <TabsContent value="for-you" className="space-y-6">
              {/* Category Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Categories</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="capitalize"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Events */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingRecommendations ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="space-y-4">
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  filteredRecommendations.map((recommendation) => {
                    const event = getEventDetails(recommendation.eventId);
                    if (!event) return null;

                    return (
                      <Card key={recommendation.eventId} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Badge variant="secondary" className="mb-2 capitalize">
                                {recommendation.category}
                              </Badge>
                              <h3 className="font-semibold text-lg leading-tight mb-1">{event.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Coins className="w-4 h-4" />
                                  <span>₦{parseInt(event.entryFee).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getScoreColor(recommendation.score)}`}>
                                {recommendation.score}
                              </div>
                              <div className="text-xs text-gray-500">Match Score</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <Progress value={recommendation.score} className="h-2" />
                            
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Why we recommend this:</div>
                              <div className="space-y-1">
                                {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                                  <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                    <ArrowRight className="w-3 h-3 text-purple-500" />
                                    <span>{reason}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {event.eventPool && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Prize Pool:</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  ₦{event.eventPool.toLocaleString()}
                                </span>
                              </div>
                            )}

                            <Button 
                              onClick={() => handleJoinEvent(event.id)}
                              className="w-full group-hover:bg-purple-600 transition-colors"
                            >
                              Join Event
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Trending Events */}
            <TabsContent value="trending" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span>Trending Now</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loadingTrending ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-8 w-1/2" />
                        </div>
                      ))
                    ) : (
                      trending.map((item) => {
                        const event = getEventDetails(item.eventId);
                        if (!event) return null;

                        return (
                          <div key={item.eventId} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                               onClick={() => handleJoinEvent(event.id)}>
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="capitalize">{item.category}</Badge>
                              <div className="flex items-center space-x-1 text-orange-500">
                                <Zap className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.score}</span>
                              </div>
                            </div>
                            <h4 className="font-semibold mb-2">{event.title}</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {item.reasons.map((reason, idx) => (
                                <div key={idx} className="flex items-center space-x-1">
                                  <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Insights */}
            <TabsContent value="insights" className="space-y-6">
              {loadingPreferences ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : preferences ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Favorite Categories */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-800">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                        <Heart className="w-5 h-5" />
                        <span>Favorite Categories</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {preferences.favoriteCategories.length > 0 ? (
                          preferences.favoriteCategories.map((category, idx) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="capitalize font-medium">{category}</span>
                              <Badge variant="secondary" className="text-xs">
                                #{idx + 1}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600 dark:text-gray-400">
                            Start participating in events to discover your preferences!
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Win Rate */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                        <Trophy className="w-5 h-5" />
                        <span>Success Rate</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                          {Math.round(preferences.winRate * 100)}%
                        </div>
                        <Progress value={preferences.winRate * 100} className="h-3" />
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Your prediction accuracy
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Profile */}
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900 dark:to-pink-800">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
                        <Target className="w-5 h-5" />
                        <span>Risk Profile</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-center">
                          <Badge className={getRiskLevelColor(preferences.preferredRiskLevel)}>
                            {preferences.preferredRiskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Average Bet:</span>
                            <span className="font-medium">₦{preferences.averageBetAmount.toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-xs text-center text-gray-500">
                          Based on your betting patterns
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        ) : (
          // Non-authenticated view - show trending only
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span>Trending Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trending.map((item) => {
                    const event = getEventDetails(item.eventId);
                    if (!event) return null;

                    return (
                      <div key={item.eventId} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                           onClick={() => handleJoinEvent(event.id)}>
                        <Badge variant="outline" className="capitalize mb-2">{item.category}</Badge>
                        <h4 className="font-semibold mb-2">{event.title}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          High activity event with recent participation
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Get Personalized Recommendations</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign in to discover events tailored to your interests and betting style
              </p>
              <Button onClick={() => setLocation('/auth')}>
                Sign In for Smart Recommendations
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}