import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useDailyLoginPopup() {
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

  // Fetch daily login status
  const { data: dailyLoginStatus, refetch: refetchDailyLogin } = useQuery({
    queryKey: ["/api/daily-signin/status"],
    retry: false,
    enabled: !!user,
    refetchInterval: 60000, // Check every minute
  });

  useEffect(() => {
    if (!user || !dailyLoginStatus || hasCheckedToday) return;

    // Get today's date key for localStorage
    const today = new Date().toDateString();
    const storageKey = `dailyLoginChecked_${today}_${user.id}`;
    
    // Check if we've already shown popup today for this user
    const alreadyCheckedToday = localStorage.getItem(storageKey);
    
    // Show popup if user has signed in today but hasn't claimed their bonus yet
    if (!alreadyCheckedToday && dailyLoginStatus?.canClaim && dailyLoginStatus?.hasSignedInToday) {
      // Show popup after a short delay to ensure UI is ready
      setTimeout(() => {
        setShowPopup(true);
        localStorage.setItem(storageKey, 'true');
        setHasCheckedToday(true);
      }, 1500);
    } else {
      setHasCheckedToday(true);
    }
  }, [user, dailyLoginStatus, hasCheckedToday]);

  const closePopup = () => {
    setShowPopup(false);
    refetchDailyLogin();
  };

  return {
    showDailyLoginPopup: showPopup,
    closeDailyLoginPopup: closePopup,
    dailyLoginStatus: dailyLoginStatus || { 
      canClaim: false, 
      hasSignedInToday: false, 
      streak: 0,
      pointsEarned: 0 
    }
  };
}