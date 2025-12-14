import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SocialMediaShare } from "@/components/SocialMediaShare";
import { MessageCircle, Check, X, Eye, Trophy, Share2 } from "lucide-react";
import { CompactShareButton } from '@/components/ShareButton';
import { shareChallenge } from '@/utils/sharing';
import { createAvatar } from '@dicebear/core';
import { personas } from '@dicebear/collection';
import { UserAvatar } from "@/components/UserAvatar";

interface ChallengeCardProps {
  challenge: {
    id: number;
    challenger: string;
    challenged: string;
    title: string;
    description?: string;
    category: string;
    amount: string;
    status: string;
    dueDate?: string;
    createdAt: string;
    challengerUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
    challengedUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
  onChatClick?: (challenge: any) => void;
}

export function ChallengeCard({ challenge, onChatClick }: ChallengeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Generate avatar URL for a user
  const generateAvatarUrl = (userId: string, name: string) => {
    const avatar = createAvatar(personas, {
      seed: userId || name,
      size: 40,
      backgroundColor: ['b6e3f4', 'c6f6d5', 'fed7e2', 'feebc8', 'e9d5ff', 'fbd38d'],
      backgroundType: ['gradientLinear', 'solid'],
    });
    return avatar.toDataUri();
  };

  // Generate sharing data for the challenge
  const challengeShareData = shareChallenge(
    challenge.id.toString(), 
    challenge.title, 
    challenge.amount
  );

  const acceptChallengeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/challenges/${challenge.id}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Accepted",
        description: "You have successfully accepted the challenge!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineChallengeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/challenges/${challenge.id}`, {
        status: 'cancelled'
      });
    },
    onSuccess: () => {
      toast({
        title: "Challenge Declined",
        description: "You have declined the challenge.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Pending</Badge>;
      case 'active':
        return <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">Active</Badge>;
      case 'completed':
        return <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Completed</Badge>;
      case 'disputed':
        return <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">Disputed</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Display challenger vs challenged format for all challenges
  const challengerName = challenge.challengerUser?.firstName || challenge.challengerUser?.username || 'Unknown User';
  const challengedName = challenge.challengedUser?.firstName || challenge.challengedUser?.username || 'Unknown User';
  const displayName = `${challengerName} vs ${challengedName}`;

  // For avatar, show the other user (opponent) if current user is involved, otherwise show challenger
  const otherUser = user?.id === challenge.challenger 
    ? challenge.challengedUser 
    : user?.id === challenge.challenged 
    ? challenge.challengerUser 
    : challenge.challengerUser;
  const timeAgo = formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true });

  // Helper function to get status text for the card
  const getStatusText = () => {
    switch (challenge.status) {
      case 'pending':
        return 'Waiting for your response';
      case 'active':
        return 'Challenge in progress';
      case 'completed':
        return 'Challenge concluded';
      case 'disputed':
        return 'Challenge disputed';
      case 'cancelled':
        return 'Challenge cancelled';
      default:
        return challenge.status;
    }
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-600 theme-transition">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* User avatars side by side */}
            <div className="flex items-center -space-x-2">
              <Avatar className="w-7 h-7 md:w-8 md:h-8 border-2 border-white dark:border-slate-800 z-10">
                <AvatarImage 
                  src={challenge.challengerUser?.profileImageUrl || generateAvatarUrl(challenge.challengerUser?.id || challenge.challenger, challengerName)} 
                  alt={challengerName} 
                />
                <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                  {challengerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Avatar className="w-7 h-7 md:w-8 md:h-8 border-2 border-white dark:border-slate-800">
                <AvatarImage 
                  src={challenge.challengedUser?.profileImageUrl || generateAvatarUrl(challenge.challengedUser?.id || challenge.challenged, challengedName)} 
                  alt={challengedName} 
                />
                <AvatarFallback className="text-xs font-medium bg-green-100 text-green-700">
                  {challengedName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100 truncate">{displayName}</h4>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">{challenge.title}</p>
            </div>
          </div>
          {getStatusBadge(challenge.status)}
        </div>

        {challenge.description && (
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-2 md:mb-3 line-clamp-2">{challenge.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-4">
            <span className="text-xs md:text-sm font-semibold text-emerald-600">
              Stake: ₦{parseFloat(challenge.amount).toLocaleString()}
            </span>
            <div className="flex items-center space-x-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
              <span className="capitalize">
                {challenge.category}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {timeAgo}
              </span>
            </div>
          </div>

          <div className="flex space-x-1">
            {challenge.status === 'pending' && user?.id === challenge.challenged && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700 h-6 px-2 text-xs"
                  onClick={() => acceptChallengeMutation.mutate()}
                  disabled={acceptChallengeMutation.isPending}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => declineChallengeMutation.mutate()}
                  disabled={declineChallengeMutation.isPending}
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </Button>
              </>
            )}
            {challenge.status === 'pending' && user?.id === challenge.challenger && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => declineChallengeMutation.mutate()}
                disabled={declineChallengeMutation.isPending}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            )}
            {(challenge.status === 'active' || challenge.status === 'pending') && onChatClick && (
              <Button 
                size="sm" 
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 h-6 px-2 text-xs"
                onClick={() => onChatClick(challenge)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat
              </Button>
            )}
            {challenge.status === 'active' && !onChatClick && (
              <Button size="sm" className="bg-primary text-white hover:bg-primary/90 h-6 px-2 text-xs">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
            {challenge.status === 'completed' && (
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                Results
              </Button>
            )}

            {/* Challenge Share Button - Available for all challenge statuses */}
            <CompactShareButton 
              shareData={challengeShareData.shareData}
              className="text-primary hover:text-primary/80 h-6 w-6"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}