import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { apiRequest } from '@/lib/queryClient';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  challengeNotifications: boolean;
  eventNotifications: boolean;
  friendNotifications: boolean;
}

export function useNotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    challengeNotifications: true,
    eventNotifications: true,
    friendNotifications: true,
  });

  // Load settings from user preferences
  useEffect(() => {
    if (user?.notificationPreferences) {
      try {
        const prefs = JSON.parse(user.notificationPreferences);
        setSettings(prev => ({ ...prev, ...prefs }));
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
      }
    }
  }, [user]);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await apiRequest('PATCH', '/api/user/notifications', newSettings);
      toast({
        title: 'Setting Updated',
        description: 'Your notification preference has been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error) {
      // Revert on error
      setSettings(settings);
      toast({
        title: 'Error',
        description: 'Failed to update notification setting.',
        variant: 'destructive',
      });
    }
  };

  return {
    settings,
    updateSetting,
    isUpdating: false,
  };
}