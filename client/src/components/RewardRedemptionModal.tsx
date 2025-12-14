import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Gift, Coins, Trophy, Crown, Zap } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ConfettiExplosion from 'react-confetti-explosion';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  coinsCost?: number;
  type: 'coins' | 'badge' | 'boost' | 'premium';
  icon: any;
  color: string;
  gradient: string;
  available: boolean;
}

const rewards: Reward[] = [
  {
    id: 'coins_1000',
    name: '1,000 Coins',
    description: 'Convert your points to coins for betting',
    pointsCost: 500,
    type: 'coins',
    icon: Coins,
    color: 'text-yellow-600',
    gradient: 'from-yellow-100 to-amber-200',
    available: true
  },
  {
    id: 'coins_5000',
    name: '5,000 Coins',
    description: 'Big coin boost for major bets',
    pointsCost: 2000,
    type: 'coins',
    icon: Coins,
    color: 'text-yellow-600',
    gradient: 'from-yellow-100 to-amber-200',
    available: true
  },
  {
    id: 'premium_badge',
    name: 'Premium Badge',
    description: 'Show off your status with a premium badge',
    pointsCost: 1500,
    type: 'badge',
    icon: Crown,
    color: 'text-purple-600',
    gradient: 'from-purple-100 to-violet-200',
    available: true
  },
  {
    id: 'double_xp_boost',
    name: 'Double XP Boost',
    description: '24-hour double XP from all activities',
    pointsCost: 1000,
    type: 'boost',
    icon: Zap,
    color: 'text-blue-600',
    gradient: 'from-blue-100 to-indigo-200',
    available: true
  },
  {
    id: 'streak_saver',
    name: 'Streak Saver',
    description: 'Protect your daily login streak once',
    pointsCost: 800,
    type: 'boost',
    icon: Trophy,
    color: 'text-green-600',
    gradient: 'from-green-100 to-emerald-200',
    available: true
  },
  {
    id: 'exclusive_avatar',
    name: 'Exclusive Avatar',
    description: 'Unlock rare avatar customizations',
    pointsCost: 2500,
    type: 'premium',
    icon: Gift,
    color: 'text-pink-600',
    gradient: 'from-pink-100 to-rose-200',
    available: true
  }
];

interface RewardRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
  userCoins: number;
}

export function RewardRedemptionModal({ isOpen, onClose, userPoints, userCoins }: RewardRedemptionModalProps) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const redeemReward = useMutation({
    mutationFn: async (rewardData: { rewardId: string }) => {
      return apiRequest('POST', `/api/rewards/redeem`, rewardData);
    },
    onSuccess: (data) => {
      setShowConfetti(true);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      
      toast({
        title: "Reward Redeemed! 🎉",
        description: `You've successfully redeemed ${selectedReward?.name}!`,
      });

      // Hide confetti and close modal after celebration
      setTimeout(() => {
        setShowConfetti(false);
        setIsRedeeming(false);
        setSelectedReward(null);
        onClose();
      }, 3000);
    },
    onError: (error: any) => {
      setIsRedeeming(false);
      toast({
        title: "Redemption Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleRedeem = async (reward: Reward) => {
    if (userPoints < reward.pointsCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointsCost - userPoints} more points to redeem this reward.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedReward(reward);
    setIsRedeeming(true);
    redeemReward.mutate({ rewardId: reward.id });
  };

  const canAfford = (reward: Reward) => userPoints >= reward.pointsCost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Gift className="w-6 h-6 text-purple-600" />
            <span>Reward Store</span>
          </DialogTitle>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-blue-500" />
              <span>{userPoints.toLocaleString()} points</span>
            </div>
            <div className="flex items-center space-x-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span>{userCoins.toLocaleString()} coins</span>
            </div>
          </div>
        </DialogHeader>

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[99999]">
            <ConfettiExplosion
              force={0.8}
              duration={3000}
              particleCount={150}
              width={window.innerWidth}
              height={window.innerHeight}
              colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {isRedeeming && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Redeeming {selectedReward?.name}...</p>
              <p className="text-sm text-gray-500 mt-2">Preparing your celebration! 🎉</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {rewards.map((reward) => {
            const affordable = canAfford(reward);
            
            return (
              <Card 
                key={reward.id}
                className={`relative transition-all duration-300 hover:shadow-lg ${
                  affordable 
                    ? 'hover:scale-105 cursor-pointer border-2 border-transparent hover:border-blue-300' 
                    : 'opacity-50 cursor-not-allowed'
                } bg-gradient-to-br ${reward.gradient} dark:from-gray-800 dark:to-gray-700`}
                onClick={() => affordable && !isRedeeming && handleRedeem(reward)}
              >
                <CardContent className="p-6 text-center">
                  {!affordable && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        Need {reward.pointsCost - userPoints} pts
                      </Badge>
                    </div>
                  )}

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg bg-gradient-to-br bg-white dark:bg-gray-600`}>
                    <reward.icon className={`w-8 h-8 ${reward.color} dark:text-gray-300`} />
                  </div>

                  <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                    {reward.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {reward.description}
                  </p>

                  <div className="space-y-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-semibold ${
                        affordable 
                          ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-800 dark:text-blue-200' 
                          : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {reward.pointsCost.toLocaleString()} points
                    </Badge>

                    {affordable && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold"
                          disabled={isRedeeming}
                        >
                          {isRedeeming && selectedReward?.id === reward.id ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              <span>Redeeming...</span>
                            </div>
                          ) : (
                            'Redeem Now'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How to Earn More Points:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Win challenges and events</li>
            <li>• Daily login streaks</li>
            <li>• Complete achievements</li>
            <li>• Refer friends to BetChat</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}