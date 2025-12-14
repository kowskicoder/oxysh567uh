
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { ShareButton } from "@/components/ShareButton";
import { shareReferral } from "@/utils/sharing";
import { 
  Users, 
  Gift, 
  Trophy,
  Copy,
  Share,
  UserPlus,
  CheckCircle,
  Link as LinkIcon,
  Target,
  Award,
  Star
} from "lucide-react";

export default function ReferralPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["/api/referrals"],
    retry: false,
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
      }
    },
  });

  const referralCode = user?.referralCode || user?.username || `user_${user?.id?.slice(-8) || 'temp'}`;
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;

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
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Generate sharing data using the utility function
  const referralShareData = shareReferral(referralCode, user?.firstName || user?.username);

  if (!user) return null;

  const referralArray = Array.isArray(referrals) ? referrals : [];
  const totalReferrals = referralArray.length;
  const activeReferrals = referralArray.filter((r: any) => r.status === 'active').length;
  const totalRewards = totalReferrals * 500; // 500 points per referral

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - spacing reduced after removing intro text */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div className="hidden md:block"></div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-3xl p-4 border border-cyan-100 dark:border-cyan-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-2xl bg-cyan-200 dark:bg-cyan-700 flex items-center justify-center">
                <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
              </div>
              <div className="w-5 h-5 rounded-full bg-cyan-200 dark:bg-cyan-700 flex items-center justify-center">
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">{totalReferrals}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">REFERRALS</p>
              <div className="text-xl font-bold text-cyan-900 dark:text-cyan-100">{totalReferrals}</div>
              <div className="text-xs text-cyan-600 dark:text-cyan-400">Total</div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl p-4 border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-2xl bg-emerald-200 dark:bg-emerald-700 flex items-center justify-center">
                <Gift className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-700 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">₦</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">REWARDS</p>
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{totalRewards}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">Points</div>
            </div>
          </div>

          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-3xl p-4 border border-violet-100 dark:border-violet-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-2xl bg-violet-200 dark:bg-violet-700 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-violet-700 dark:text-violet-300" />
              </div>
              <div className="w-5 h-5 rounded-full bg-violet-200 dark:bg-violet-700 flex items-center justify-center">
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300">{10 - (totalReferrals % 10)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">NEXT BONUS</p>
              <div className="text-xl font-bold text-violet-900 dark:text-violet-100">{10 - (totalReferrals % 10)}</div>
              <div className="text-xs text-violet-600 dark:text-violet-400">More needed</div>
            </div>
          </div>
        </div>

        {/* Share Link Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Share className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Share Your Link</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Earn 500 points for each successful referral</p>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Input
              value={referralUrl}
              readOnly
              className="flex-1 text-sm border-0 bg-slate-50 dark:bg-slate-700 rounded-2xl"
              data-testid="input-referral-url"
            />
            <Button
              onClick={copyReferralLink}
              size="sm"
              variant="outline"
              className="px-3 border-0 bg-slate-50 dark:bg-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600"
              data-testid="button-copy-referral"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex justify-center">
            <ShareButton 
              shareData={referralShareData.shareData}
              size="sm"
              variant="default"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-2xl px-6"
            />
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30">
              <div className="w-10 h-10 bg-blue-200 dark:bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Share className="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-center">1. Share Link</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
                Share your unique referral link with friends
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-800/30">
              <div className="w-10 h-10 bg-green-200 dark:bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-5 h-5 text-green-700 dark:text-green-300" />
              </div>
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 text-center">2. Friend Joins</h4>
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                Your friend signs up using your link
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30">
              <div className="w-10 h-10 bg-purple-200 dark:bg-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Gift className="w-5 h-5 text-purple-700 dark:text-purple-300" />
              </div>
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 text-center">3. Earn Rewards</h4>
              <p className="text-sm text-purple-600 dark:text-purple-400 text-center">
                Both you and your friend get bonus points
              </p>
            </div>
          </div>
        </div>

        {/* Referral List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Your Referrals ({totalReferrals})</h3>
          </div>
          
          {isLoading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading referrals...</p>
            </div>
          ) : referralArray.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                No referrals yet
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Start sharing your referral link to earn rewards
              </p>
              <Button
                onClick={copyReferralLink}
                size="sm"
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl"
                data-testid="button-share-link"
              >
                <Share className="w-4 h-4 mr-1" />
                Share Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {referralArray.map((referral: any) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl"
                  data-testid={`referral-${referral.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage 
                        src={referral.referredUser?.profileImageUrl || undefined} 
                        alt={referral.referredUser?.firstName || 'User'} 
                      />
                      <AvatarFallback className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {(referral.referredUser?.firstName?.[0] || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {referral.referredUser?.firstName || 'Anonymous User'}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge
                      variant="secondary"
                      className={`text-xs rounded-full ${
                        referral.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : referral.status === 'completed'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {referral.status}
                    </Badge>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      +500
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
