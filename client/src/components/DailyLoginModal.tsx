import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Star, Calendar, Gift, Trophy, Crown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ConfettiExplosion from 'react-confetti-explosion';

interface DailyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  hasClaimedToday: boolean;
  canClaim: boolean;
  onClaimSuccess?: () => void;
}

export function DailyLoginModal({ isOpen, onClose, currentStreak, hasClaimedToday, canClaim, onClaimSuccess }: DailyLoginModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate rewards based on streak
  const getStreakReward = (streak: number) => {
    const baseReward = 50;
    const streakBonus = Math.min(streak * 10, 200); // Max bonus of 200
    const weeklyBonus = Math.floor(streak / 7) * 100; // 100 bonus every 7 days
    return baseReward + streakBonus + weeklyBonus;
  };

  const todaysReward = getStreakReward(currentStreak + 1);
  const tomorrowsReward = getStreakReward(currentStreak + 2);

  // Get week progress (0-6 for each day of the week)
  const getWeekProgress = () => {
    const weekDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const progress = [];
    
    for (let i = 0; i < 7; i++) {
      const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][i];
      const isToday = i === weekDay;
      const isPast = i < weekDay;
      const isFuture = i > weekDay;
      
      progress.push({
        day: dayName,
        isToday,
        isPast,
        isFuture,
        isCompleted: isPast || (isToday && hasClaimedToday)
      });
    }
    
    return progress;
  };

  const weekProgress = getWeekProgress();

  const claimDailyLogin = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/daily-signin/claim', {});
    },
    onSuccess: (data) => {
      setShowConfetti(true);
      queryClient.invalidateQueries({ queryKey: ['/api/daily-signin/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Call the success callback to mark notifications as read
      onClaimSuccess?.();
      
      toast({
        title: "Daily Bonus Claimed! 🎉",
        description: `You earned ${todaysReward} points! Current streak: ${currentStreak + 1} days`,
      });

      // Hide confetti and close modal after celebration
      setTimeout(() => {
        setShowConfetti(false);
        setIsClaiming(false);
        onClose();
      }, 4000);
    },
    onError: (error: any) => {
      setIsClaiming(false);
      toast({
        title: "Claim Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleClaim = () => {
    if (!canClaim || hasClaimedToday) return;
    
    setIsClaiming(true);
    claimDailyLogin.mutate();
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return { icon: Crown, color: 'text-purple-500', bg: 'bg-purple-100' };
    if (streak >= 14) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    if (streak >= 7) return { icon: Star, color: 'text-blue-500', bg: 'bg-blue-100' };
    return { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-100' };
  };

  const streakData = getStreakIcon(currentStreak);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white overflow-hidden p-3 md:p-6 md:max-w-sm">
        <DialogTitle className="sr-only">Daily Login Bonus</DialogTitle>
        
        {/* Confetti Animation - Better mobile positioning */}
        {showConfetti && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[99999]">
            <ConfettiExplosion
              force={0.8}
              duration={4000}
              particleCount={150}
              width={window.innerWidth}
              height={window.innerHeight}
              colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#7440ff', '#96CEB4', '#FFEAA7', '#FFA502', '#FF7675', '#32CD32', '#FF1493']}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {isClaiming && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-600">
              <div className="animate-spin w-6 h-6 border-4 border-[#7440ff] border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Claiming Bonus...</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Preparing your celebration! 🎉</p>
            </div>
          </div>
        )}

        <div className="relative p-2 md:p-3 text-center">
          {/* Decorative Stars - Smaller on mobile */}
          <div className="absolute top-1 right-2 md:top-2 md:right-4">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#7440ff] rotate-45 transform"></div>
          </div>
          <div className="absolute top-3 left-2 md:top-6 md:left-3">
            <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-[#7440ff]/70 rotate-45 transform"></div>
          </div>
          <div className="absolute bottom-8 right-1 md:bottom-12 md:right-2">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#7440ff] rotate-45 transform"></div>
          </div>

          {/* Main Bantah Icon - Smaller on mobile */}
          <div className="relative mb-2 md:mb-3">
            <div className="w-10 h-10 md:w-14 md:h-14 mx-auto flex items-center justify-center">
              <img 
                src="/assets/bantahblue.svg" 
                alt="Bantah Logo" 
                className="w-8 h-8 md:w-12 md:h-12 drop-shadow-sm"
              />
            </div>
          </div>

          {/* Streak Count - Smaller on mobile */}
          <div className="mb-2 md:mb-3">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#7440ff] via-[#8b5cf6] to-[#7440ff] bg-clip-text text-transparent mb-1">
              {hasClaimedToday ? currentStreak : currentStreak + 1}
            </div>
            <div className="text-[#7440ff] dark:text-[#8b5cf6] text-xs md:text-sm font-semibold">
              day streak
            </div>
          </div>

          {/* Week Progress - More compact on mobile */}
          <div className="mb-3 md:mb-4">
            <div className="flex justify-center items-center space-x-1 md:space-x-1.5 mb-1.5 md:mb-2">
              {weekProgress.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 md:mb-1">{day.day}</div>
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center ${
                    day.isCompleted 
                      ? 'bg-gradient-to-br from-[#7440ff] to-[#8b5cf6] text-white' 
                      : day.isToday && !hasClaimedToday
                        ? 'bg-[#7440ff]/20 border-2 border-[#7440ff]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {day.isCompleted && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>}
                    {day.isToday && !hasClaimedToday && <Flame className="w-2 h-2 md:w-2.5 md:h-2.5 text-[#7440ff]" />}
                    {day.isFuture && <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-slate-400 rounded-full opacity-50"></div>}
                  </div>
                </div>
              ))}
            </div>
            
            {currentStreak >= 7 && (
              <div className="text-center">
                <Badge className="bg-[#7440ff]/10 text-[#7440ff] dark:text-[#8b5cf6] border-[#7440ff]/20 text-xs py-0.5 px-2">
                  Perfect Streak! Keep it up!
                </Badge>
              </div>
            )}
          </div>

          {/* Reward Information - More compact on mobile */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 mb-2 md:mb-3">
            <CardContent className="p-2 md:p-2.5">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-slate-600 dark:text-slate-300 text-xs">Today's Reward</div>
                  <div className="text-[#7440ff] dark:text-[#8b5cf6] font-bold text-sm md:text-base">+{todaysReward} points</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-600 dark:text-slate-300 text-xs">Tomorrow</div>
                  <div className="text-slate-500 dark:text-slate-400 font-semibold text-xs md:text-sm">+{tomorrowsReward} points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning about missing days - More compact on mobile */}
          {!hasClaimedToday && (
            <div className="mb-2 md:mb-3 text-center">
              <p className="text-slate-600 dark:text-slate-300 text-xs mb-0.5">
                Skipping a day resets your
              </p>
              <p className="text-[#7440ff] dark:text-[#8b5cf6] font-semibold text-xs md:text-sm">
                Perfect Streak. Don't miss out!
              </p>
            </div>
          )}

          {/* Action Button - Smaller on mobile */}
          <Button
            onClick={hasClaimedToday ? onClose : handleClaim}
            disabled={!canClaim || isClaiming}
            className={`w-full py-2 md:py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              hasClaimedToday
                ? 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300'
                : canClaim
                  ? 'bg-gradient-to-r from-[#7440ff] to-[#8b5cf6] hover:from-[#6b2feb] hover:to-[#7c3aed] text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            {hasClaimedToday ? 'CONTINUE' : isClaiming ? 'CLAIMING...' : 'CLAIM'}
          </Button>

          {/* Streak Milestone Info - Smaller on mobile */}
          {currentStreak > 0 && (
            <div className="mt-1.5 md:mt-2 flex items-center justify-center space-x-1.5 md:space-x-2">
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${streakData.bg} flex items-center justify-center`}>
                <streakData.icon className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 ${streakData.color}`} />
              </div>
              <span className="text-slate-600 dark:text-slate-300 text-xs">
                {currentStreak >= 30 ? 'Legendary Streak!' :
                 currentStreak >= 14 ? 'Amazing Streak!' :
                 currentStreak >= 7 ? 'Great Streak!' : 'Keep it up!'}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}