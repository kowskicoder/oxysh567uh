import React, { useState } from "react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDailyLoginPopup } from "@/hooks/useDailyLoginPopup";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyLoginModal } from "@/components/DailyLoginModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDailyLoginModal, setShowDailyLoginModal] = useState(false);
  const { dailyLoginStatus } = useDailyLoginPopup();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  // Handle errors in useEffect
  React.useEffect(() => {
    if (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        console.error("Error fetching notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        });
      }
    }
  }, [error, toast]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
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
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTestNotificationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/test/notification", {
        type: "achievement",
        title: "🎉 Test Achievement",
        message: "You successfully created a test notification!"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "Test notification created!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'fas fa-trophy';
      case 'challenge':
      case 'challenge_received':
      case 'challenge_sent':
      case 'challenge_accepted':
      case 'challenge_active':
        return 'fas fa-swords';
      case 'event':
      case 'event_starting':
      case 'event_ending':
      case 'funds_locked':
      case 'participant_joined':
        return 'fas fa-calendar';
      case 'match':
        return 'fas fa-dice';
      case 'friend':
      case 'friend_request':
      case 'friend_accepted':
        return 'fas fa-user-friends';
      case 'new_follower':
        return 'fas fa-user-plus';
      case 'tip_received':
      case 'tip_sent':
        return 'fas fa-coins';
      case 'deposit':
        return 'fas fa-credit-card';
      case 'withdrawal':
        return 'fas fa-money-bill-wave';
      case 'daily_login_reminder':
        return 'fas fa-calendar-check';
      case 'content_shared':
        return 'fas fa-share-alt';
      default:
        return 'fas fa-bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900';
      case 'challenge':
      case 'challenge_received':
      case 'challenge_sent':
      case 'challenge_accepted':
      case 'challenge_active':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
      case 'event':
      case 'event_starting':
      case 'event_ending':
      case 'funds_locked':
      case 'participant_joined':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900';
      case 'match':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900';
      case 'friend':
      case 'friend_request':
      case 'friend_accepted':
        return 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900';
      case 'new_follower':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900';
      case 'tip_received':
      case 'tip_sent':
      case 'deposit':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
      case 'withdrawal':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900';
      case 'daily_login_reminder':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
      case 'content_shared':
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';
    }
  };

  const unreadNotifications = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read) : [];
  const readNotifications = Array.isArray(notifications) ? notifications.filter((n: any) => n.read) : [];

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">


      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Notifications Tabs - More compact on mobile */}
        <Tabs defaultValue="all" className="space-y-3 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
            <TabsTrigger value="all" className="flex items-center space-x-1 text-xs sm:text-sm">
              <i className="fas fa-bell"></i>
              <span className="hidden sm:inline">All</span>
              <span>({Array.isArray(notifications) ? notifications.length : 0})</span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center space-x-1 text-xs sm:text-sm">
              <i className="fas fa-envelope-open-text"></i>
              <span className="hidden sm:inline">Unread</span>
              <span>({unreadNotifications.length})</span>
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center space-x-1 text-xs sm:text-sm">
              <i className="fas fa-check"></i>
              <span className="hidden sm:inline">Read</span>
              <span>({readNotifications.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2 sm:space-y-4">
            {isLoading ? (
              <div className="text-center py-6 sm:py-12">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading notifications...</p>
              </div>
            ) : !Array.isArray(notifications) || notifications.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
                <CardContent className="text-center py-6 sm:py-12">
                  <i className="fas fa-bell-slash text-2xl sm:text-4xl text-slate-400 mb-2 sm:mb-4"></i>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2">
                    No notifications yet
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    We'll notify you when something interesting happens!
                  </p>
                </CardContent>
              </Card>
            ) : (
              (Array.isArray(notifications) ? notifications : []).map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl ${
                    !notification.read ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-xs sm:text-sm`}></i>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 sm:mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
                            {!notification.read && (
                              <>
                                <Badge className="bg-primary text-white text-xs">New</Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  disabled={markAsReadMutation.isPending}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                >
                                  <i className="fas fa-check text-xs"></i>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action buttons based on notification type */}
                        {(notification.type === 'challenge' || notification.type === 'challenge_received' || notification.type === 'challenge_sent' || notification.type === 'challenge_accepted' || notification.type === 'challenge_active') && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                                window.location.href = '/challenges';
                              }}
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View Challenges
                            </Button>
                            {notification.type === 'challenge_received' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (!notification.read) {
                                    handleMarkAsRead(notification.id);
                                  }
                                  window.location.href = '/challenges';
                                }}
                              >
                                <i className="fas fa-swords mr-1"></i>
                                Respond
                              </Button>
                            )}
                          </div>
                        )}

                        {(notification.type === 'friend' || notification.type === 'friend_request' || notification.type === 'friend_accepted') && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                                window.location.href = '/friends';
                              }}
                            >
                              <i className="fas fa-users mr-1"></i>
                              View Friends
                            </Button>
                          </div>
                        )}

                        {notification.type === 'new_follower' && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-purple-600 text-white hover:bg-purple-700"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                                // Redirect to the follower's public profile
                                const followerName = notification.data?.followerName;
                                if (followerName) {
                                  window.location.href = `/@${followerName}`;
                                } else {
                                  // Fallback: try to get username from followerId
                                  const followerId = notification.data?.followerId;
                                  if (followerId) {
                                    // For now, redirect to friends page as we'd need to fetch username
                                    window.location.href = '/friends';
                                  } else {
                                    // Last resort fallback
                                    window.location.href = '/friends';
                                  }
                                }
                              }}
                            >
                              <i className="fas fa-user mr-1"></i>
                              View Profile
                            </Button>
                          </div>
                        )}

                        {(notification.type === 'tip_received' || notification.type === 'tip_sent' || notification.type === 'deposit' || notification.type === 'withdrawal') && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                                window.location.href = '/wallet';
                              }}
                            >
                              <i className="fas fa-wallet mr-1"></i>
                              View Wallet
                            </Button>
                          </div>
                        )}

                        {(notification.type === 'event' || notification.type === 'event_starting' || notification.type === 'event_ending' || notification.type === 'funds_locked' || notification.type === 'participant_joined') && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                                window.location.href = '/events';
                              }}
                            >
                              <i className="fas fa-calendar mr-1"></i>
                              View Events
                            </Button>
                          </div>
                        )}

                        {notification.type === 'daily_login_reminder' && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-yellow-600 text-white hover:bg-yellow-700"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                                setShowDailyLoginModal(true);
                              }}
                            >
                              <i className="fas fa-gift mr-1"></i>
                              Claim Bonus
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-check-circle text-4xl text-emerald-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    All caught up!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    You have no unread notifications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ring-2 ring-primary/20"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Badge className="bg-primary text-white">New</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <i className="fas fa-check text-xs"></i>
                            </Button>
                          </div>
                        </div>

                        {/* Action buttons based on notification type */}
                        {notification.type === 'challenge' && notification.data?.challengeId && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => window.location.href = '/challenges'}
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View Challenge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                // Mark as read and navigate to challenges
                                handleMarkAsRead(notification.id);
                                window.location.href = '/challenges';
                              }}
                            >
                              <i className="fas fa-swords mr-1"></i>
                              Respond
                            </Button>
                          </div>
                        )}

                        {notification.type === 'friend' && notification.data?.friendRequestId && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
                              onClick={() => window.location.href = '/friends'}
                            >
                              View Request
                            </Button>
                          </div>
                        )}

                        {notification.type === 'event' && notification.data?.eventId && (
                          <div className="mt-3 flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => window.location.href = '/events'}
                            >
                              View Event
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            {readNotifications.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-history text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No read notifications
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Notifications you've read will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              readNotifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-75"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Footer Navigation */}
      <MobileNavigation />

      {/* Daily Login Modal */}
      <DailyLoginModal 
        isOpen={showDailyLoginModal}
        onClose={() => setShowDailyLoginModal(false)}
        currentStreak={dailyLoginStatus?.streak || 0}
        hasClaimedToday={false}
        canClaim={dailyLoginStatus?.canClaim || false}
        onClaimSuccess={() => {
          // Mark all daily login reminder notifications as read
          const dailyLoginNotifications = notifications.filter(n => n.type === 'daily_login_reminder' && !n.read);
          dailyLoginNotifications.forEach(notification => {
            handleMarkAsRead(notification.id);
          });
          // Invalidate notifications to refresh the list
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        }}
      />
    </div>
  );
}