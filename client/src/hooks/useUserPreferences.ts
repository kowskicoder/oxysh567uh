import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    challenge: boolean;
    event: boolean;
    friend: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    compactView: boolean;
    language: string;
  };
  performance: {
    autoRefresh: boolean;
    soundEffects: boolean;
    dataUsage: 'low' | 'medium' | 'high';
  };
  regional: {
    currency: string;
    timezone: string;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    activityVisibility: 'public' | 'friends' | 'private';
  };
}

export function useUserPreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery<UserPreferences>({
    queryKey: ['/api/user/preferences'],
    queryFn: () => apiRequest('GET', '/api/user/preferences'),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: Partial<UserPreferences>) =>
      apiRequest('PATCH', '/api/user/preferences', newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    },
  });

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    return updatePreferencesMutation.mutateAsync(newPreferences);
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    isUpdating: updatePreferencesMutation.isPending,
  };
}