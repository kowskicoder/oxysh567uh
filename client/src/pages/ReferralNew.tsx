import { useState } from "react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Copy,
  Share2,
  Gift,
  Users,
  Star,
  ChevronRight,
  Check
} from "lucide-react";
import { useLocation } from "wouter";

export default function ReferralNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  // Get actual referral data from BetChat
  const referralCode = user?.referralCode || user?.username || `user_${user?.id?.slice(-8) || 'temp'}`;
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;

  const { data: referrals = [] } = useQuery({
    queryKey: ["/api/referrals"],
    retry: false,
  });

  const { data: userBalance = { balance: 0, coins: 0 } } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
  });

  // Calculate actual referral stats
  const referralArray = Array.isArray(referrals) ? referrals : [];
  const totalReferrals = referralArray.length;
  const totalEarned = totalReferrals * 500; // 500 points per referral based on code
  const nextMilestone = Math.ceil((totalReferrals + 1) / 5) * 5; // Every 5 referrals milestone
  const progressToNext = totalReferrals % 5;
  const progress = (progressToNext / 5) * 100;

  // BetChat actual rewards based on referral system
  const rewards = [
    {
      id: 1,
      title: "500 Bonus Points",
      subtitle: `${totalReferrals} friends joined`,
      icon: "🎯",
      color: "bg-purple-100 dark:bg-purple-900",
      textColor: "text-purple-600 dark:text-purple-400",
      progress: 100,
      canRedeem: false,
      description: "Earn 500 points for each friend who joins"
    },
    {
      id: 2,
      title: "Bonus Coins Reward",
      subtitle: `Next milestone: ${5 - (totalReferrals % 5)} more friends`, 
      icon: "🪙",
      color: "bg-amber-100 dark:bg-amber-900",
      textColor: "text-amber-600 dark:text-amber-400",
      progress: progress,
      canRedeem: totalReferrals >= 5 && (totalReferrals % 5) === 0,
      description: "Get bonus coins every 5 successful referrals"
    },
    {
      id: 3,
      title: "VIP Member Status",
      subtitle: `${Math.max(0, 20 - totalReferrals)} referrals to unlock`, 
      icon: "👑",
      color: "bg-pink-100 dark:bg-pink-900",
      textColor: "text-pink-600 dark:text-pink-400",
      progress: Math.min((totalReferrals / 20) * 100, 100),
      canRedeem: totalReferrals >= 20,
      description: "Unlock VIP features with 20+ referrals"
    }
  ];

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy referral link",
        variant: "destructive",
      });
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join BetChat - Social Betting Platform',
          text: `Join me on BetChat! Use my referral link to get bonus points when you sign up. Let's bet on events and challenge each other!`,
          url: referralUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 sm:px-6 sm:py-8 rounded-b-3xl max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="hidden md:block"></div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Friends</div>
                  <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {totalReferrals}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Earned</div>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {totalEarned.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Reward Card */}
        <Card className="bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 border-0 shadow-sm mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-3xl bg-lime-500 flex items-center justify-center">
                <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                  500 Points Per Friend
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Earn rewards when friends join using your link
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <div className="mb-6">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Your Referral Link</div>
          <Card className="bg-slate-50 dark:bg-slate-700/50 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate">
                  {referralUrl}
                </div>
                <Button
                  onClick={copyReferralLink}
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-xl"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Button */}
        <Button
          onClick={shareReferralLink}
          className="w-full h-14 bg-[#7440ff] hover:bg-[#7440ff]/90 text-white rounded-2xl font-medium"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Referral Link
        </Button>
      </div>

      {/* How It Works */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-4xl mx-auto">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
          How It Works
        </h3>
        <div className="space-y-3 sm:space-y-4">
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white mb-1">
                    Share Your Link
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Send your referral link to friends
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white mb-1">
                    Friend Joins
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    They sign up using your link
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white mb-1">
                    Both Get Rewards
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    You get 500 points, they get welcome bonus
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            Milestone Rewards
          </h3>
          <Button variant="ghost" size="sm" className="text-slate-500 text-sm">
            See All
          </Button>
        </div>

        <div className="space-y-3 mb-6">
          {rewards.map((reward) => (
            <Card key={reward.id} className="bg-white dark:bg-slate-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${
                    reward.textColor.includes('purple') 
                      ? 'bg-purple-50 dark:bg-purple-900/20' 
                      : reward.textColor.includes('amber')
                      ? 'bg-yellow-50 dark:bg-yellow-900/20'
                      : 'bg-pink-50 dark:bg-pink-900/20'
                  } flex items-center justify-center text-2xl`}>
                    {reward.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {reward.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      {reward.subtitle}
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          reward.textColor.includes('purple') 
                            ? 'bg-purple-500' 
                            : reward.textColor.includes('amber')
                            ? 'bg-yellow-500'
                            : 'bg-pink-500'
                        }`}
                        style={{ width: `${reward.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reward.canRedeem 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {reward.canRedeem ? 'Unlocked' : 'Locked'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Referrals */}
        {referralArray.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Referrals
              </h3>
              <Button variant="ghost" size="sm" className="text-slate-500">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {referralArray.slice(0, 3).map((referral: any) => (
                <Card key={referral.id} className="bg-white dark:bg-slate-800 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                        {(referral.referredUser?.firstName?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {referral.referredUser?.firstName || 'New User'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Joined {new Date(referral.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600 mb-1">
                          +500 pts
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          referral.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {referral.status}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}