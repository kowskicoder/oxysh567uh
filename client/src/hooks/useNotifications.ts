import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useEffect } from 'react';
import { pusher } from '@/lib/pusher';
import { useToast } from './use-toast';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: () => apiRequest('GET', '/api/notifications'),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const handleNotificationActionMutation = useMutation({
    mutationFn: ({ notificationId, action, targetUserId, eventId }: {
      notificationId: number;
      action: string;
      targetUserId?: string;
      eventId?: number;
    }) => apiRequest('POST', '/api/notifications/handle-action', {
      notificationId,
      action,
      targetUserId,
      eventId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Set up real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('Pusher notifications initialized for user:', user.id);

    const channel = pusher.subscribe(`user-${user.id}`);

    // Listen for various notification types
    const notificationEvents = [
      'challenge-received',
      'challenge-sent',
      'challenge-accepted',
      'challenge-active',
      'friend-request',
      'friend-accepted',
      'new-follower',
      'tip-received',
      'tip-sent',
      'event-notification',
      'funds-locked',
      'participant-joined',
      'notification', // Generic notification from algorithm
      'leaderboard_leader',
      'winner_challenge',
      'loser_encourage',
      'event_joiner',
      'streak_performer'
    ];

    notificationEvents.forEach(eventName => {
      channel.bind(eventName, (data: any) => {
        console.log(`Received ${eventName}:`, data);
        
        // Show instant toast notification for receiving events (not sent events)
        if (eventName === 'tip-received' || eventName === 'new-follower' || eventName === 'challenge-received' || 
            eventName === 'friend-request' || eventName === 'notification' || eventName === 'leaderboard_leader' ||
            eventName === 'winner_challenge' || eventName === 'loser_encourage' || eventName === 'event_joiner' ||
            eventName === 'streak_performer') {
          // Play notification sound
          try {
            const audio = new Audio('/assets/message-notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(console.error);
          } catch (e) {
            console.error('Failed to play notification sound:', e);
          }

          toast({
            title: data.title || '🔔 New Notification',
            description: data.message || 'You have a new notification',
            duration: 5000,
          });
        }
        
        // Refresh notifications list immediately
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.refetchQueries({ queryKey: ['/api/notifications'] });
      });
    });

    return () => {
      notificationEvents.forEach(eventName => {
        channel.unbind(eventName);
      });
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user?.id, queryClient, toast]);

  return {
    notifications: notifications || [],
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    handleNotificationAction: handleNotificationActionMutation.mutate,
    unreadCount: Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0,
  };
}