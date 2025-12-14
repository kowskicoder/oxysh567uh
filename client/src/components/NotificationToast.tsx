
import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationToast() {
  const { notifications, markAsRead } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return;
    }

    const unreadNotifications = notifications.filter((n: any) => !n.read);

    unreadNotifications.forEach((notification: any) => {
      // Determine toast variant based on notification type
      let variant: "default" | "success" | "error" | "warning" | "info" = "default";
      
      switch (notification.type) {
        case 'winner_challenge':
        case 'streak_performer':
        case 'leaderboard_leader':
          variant = "success";
          break;
        case 'loser_encourage':
        case 'system':
          variant = "info";
          break;
        case 'announcement':
          variant = "warning";
          break;
        case 'maintenance':
          variant = "error";
          break;
        default:
          variant = "default";
      }

      toast({
        title: notification.title,
        description: notification.message,
        variant: variant,
        duration: 5000,
      });

      // Mark as read after showing toast
      markAsRead(notification.id);
    });
  }, [notifications, toast, markAsRead]);

  return null;
}
