import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, TrendingUp, Star, Send, Zap, Swords, Bookmark, BookmarkCheck, QrCode } from 'lucide-react';
import { ProfileQRCode } from "@/components/ProfileQRCode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { formatBalance } from "@/utils/currencyUtils";
import { UserAvatar } from "@/components/UserAvatar";
import { getLevelColor, getLevelIcon, getLevelName } from "@/utils/levelSystem";

interface ProfileCardProps {
  userId: string;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  email: string;
  profileImageUrl?: string;
  points: number;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  hasActiveChallenge?: boolean;
  challengeStatus?: string | null;
  isChallengedByMe?: boolean;
  stats?: {
    wins: number;
    activeChallenges: number;
    totalEarnings: number;
  };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userId, onClose }) => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showMilestoneAnimation, setShowMilestoneAnimation] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeAmount, setChallengeAmount] = useState('');
  const [challengeType, setChallengeType] = useState('prediction');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: [`/api/users/${userId}/profile`],
    queryFn: async () => {
      try {
        if (!userId) {
          throw new Error("User ID is required");
        }
        const data = await apiRequest("GET", `/api/users/${userId}/profile`);
        if (!data) {
          throw new Error("No profile data received");
        }
        return data as UserProfile;
      } catch (err) {
        console.error("Error fetching profile:", err);
        throw err;
      }
    },
    retry: 1,
    enabled: !!userId && userId.trim() !== '',
    staleTime: 0, // Force refresh
    onError: (error: Error) => {
      console.error("Profile query error:", error);
      toast({
        title: "Profile Error",
        description: error.message || "Failed to load user profile",
        variant: "destructive",
      });
      if (isUnauthorizedError(error)) {
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      return await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      toast({
        title: "Success",
        description: profile?.isFollowing ? "User unfollowed" : "User followed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Tip mutation
  const tipMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!userId || !profile) {
        throw new Error("User information not available");
      }
      return await apiRequest("POST", `/api/users/${userId}/tip`, {
        amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      toast({
        title: "Tip Sent",
        description: `Successfully sent ${formatBalance(parseInt(tipAmount))} to ${profile?.firstName || profile?.username || 'User'}`,
      });
      setShowTipModal(false);
      setTipAmount('');
    },
    onError: (error: Error) => {
      console.error("Tip error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send tip",
        variant: "destructive",
      });
    },
  });

  // Challenge mutation
  const challengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      return await apiRequest("POST", `/api/challenges`, {
        ...challengeData,
        challenged: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Challenge Sent",
        description: `Challenge sent to ${profile?.firstName || profile?.username}`,
      });
      setShowChallengeModal(false);
      setChallengeTitle('');
      setChallengeDescription('');
      setChallengeAmount('');
      setChallengeType('prediction');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    followMutation.mutate(profile?.isFollowing ? 'unfollow' : 'follow');
  };

  const handleTip = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(tipAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    tipMutation.mutate(amount);
  };

  const handleChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(challengeAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }

    challengeMutation.mutate({
      title: challengeTitle,
      description: challengeDescription,
      amount,
      category: challengeType,
    });
  };

  // XP Milestone Animation Effect
  useEffect(() => {
    if (profile) {
      const nextLevelXP = profile.level * 1000;
      const currentLevelXP = (profile.level - 1) * 1000;
      const progressXP = profile.xp - currentLevelXP;

      // Check if user is close to next level (within 50 XP)
      if (nextLevelXP - profile.xp <= 50) {
        setShowMilestoneAnimation(true);
        setTimeout(() => setShowMilestoneAnimation(false), 3000);
      }
    }
  }, [profile]);

  const MilestoneAnimation = () => (
    <AnimatePresence>
      {showMilestoneAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-yellow-500"
          >
            <Zap className="w-8 h-8" />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="ml-3 text-yellow-700 dark:text-yellow-300 font-bold"
          >
            Almost Level {profile?.level + 1}!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardContent className="p-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-2 right-2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
              <p className="font-semibold">Failed to load user profile</p>
              <p className="text-sm text-slate-600 mt-1">
                {error.message || "Unable to fetch profile data"}
              </p>
              {!userId && (
                <p className="text-xs text-slate-500 mt-1">User ID is missing</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="flex-1"
              >
                Retry
              </Button>
              <Button onClick={onClose} className="flex-1">Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const calculateLevel = (xp: number) => Math.floor(xp / 1000) + 1;
  const currentLevel = profile?.level || 1;
  const currentXP = profile?.xp || 0;
  const currentLevelXP = (currentLevel - 1) * 1000;
  const nextLevelXP = currentLevel * 1000;
  const progressXP = currentXP - currentLevelXP;
  const levelProgress = Math.max(0, Math.min(100, (progressXP / (nextLevelXP - currentLevelXP)) * 100));

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xs md:max-w-sm"
        >
          <Card className="bg-white dark:bg-slate-900 shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-3 md:p-6 relative">
              {/* Close Button */}
              <div className="absolute top-2 md:top-3 right-2 md:right-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 border-0"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>

              {/* Profile Avatar - Smaller on mobile */}
              <div className="flex justify-center mt-3 md:mt-4 mb-3 md:mb-4">
                <div className="relative">
                  <UserAvatar
                    userId={profile.id || userId}
                    username={profile.username}
                    size={64}
                    className="w-16 h-16 md:w-20 md:h-20 border-3 md:border-4 border-white dark:border-slate-900 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <Badge className={`${getLevelColor(profile.level || 1)} text-xs font-semibold border-2 border-white dark:border-slate-900 shadow-lg p-1`}>
                      <img 
                        src={getLevelIcon(profile.level || 1)} 
                        alt={`${getLevelName(profile.level || 1)} Level ${profile.level || 1} badge`} 
                        className="w-2.5 h-2.5 md:w-3 md:h-3" 
                      />
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Profile Info - More compact on mobile */}
              <div className="text-center space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {profile?.firstName || profile?.username || 'User'}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {getLevelName(profile.level || 1)} Level {profile.level || 1}
                  </p>
                </div>

                {/* Skills/Badge Section - Smaller on mobile */}
                <div className="flex justify-center items-center space-x-1.5 md:space-x-2 mt-2 md:mt-3">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0 px-2 md:px-3 py-0.5 md:py-1 text-xs">
                    <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                    Expert
                  </Badge>
                  <span className="text-slate-400 text-xs md:text-sm">+{Math.max(0, (profile.stats?.wins || 0) - 1)}</span>
                </div>
              </div>

              {/* Stats Section - More compact on mobile */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto mb-1 md:mb-2">
                    <Star className="w-3 h-3 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-sm md:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {(profile.stats?.wins || 0) > 0 ? '4.9' : '0.0'}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">rating</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mx-auto mb-1 md:mb-2">
                    <Trophy className="w-3 h-3 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-sm md:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatBalance(profile.stats?.totalEarnings || profile.points || 0)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">earned</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-1 md:mb-2">
                    <TrendingUp className="w-3 h-3 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm md:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatBalance(profile.points * 45 || 0)}/hr
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">rate</div>
                </div>
              </div>

              {/* Action Button - Smaller on mobile */}
              {currentUser && currentUser.id !== profile.id && (
                <Button 
                  onClick={() => setShowTipModal(true)}
                  className="w-full py-2 md:py-3 rounded-xl font-semibold shadow-lg text-sm md:text-base text-black"
                  style={{ backgroundColor: "#ccff00" }}
                  size="lg"
                >
                  Get In Touch
                </Button>
              )}

              {/* Secondary Actions - More compact on mobile */}
              {currentUser && currentUser.id !== profile.id && (
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 mt-2 md:mt-3">
                  <Button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    variant="outline"
                    className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs md:text-sm py-1.5 md:py-2"
                  >
                    {followMutation.isPending ? (
                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-current"></div>
                    ) : (
                      profile.isFollowing ? 'Following' : 'Follow'
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (profile.hasActiveChallenge) {
                        window.location.href = '/challenges';
                      } else {
                        setShowChallengeModal(true);
                      }
                    }}
                    variant="outline"
                    className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs md:text-sm py-1.5 md:py-2"
                  >
                    <Swords className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Challenge
                  </Button>

                  <ProfileQRCode
                    username={profile.username}
                    fullName={profile.firstName || profile.username}
                    profileImageUrl={profile.profileImageUrl}
                    size="sm"
                    trigger={
                      <Button
                        variant="outline"
                        className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 py-1.5 md:py-2"
                      >
                        <QrCode className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    }
                  />
                </div>
              )}

              {/* For current user's own profile */}
              {currentUser && currentUser.id === profile.id && (
                <div className="mt-3">
                  <ProfileQRCode
                    username={profile.username}
                    fullName={profile.firstName || profile.username}
                    profileImageUrl={profile.profileImageUrl}
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Share Profile QR
                      </Button>
                    }
                  />
                </div>
              )}

              {/* XP Progress */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Progress to Level {(profile.level || 1) + 1}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {Math.round(levelProgress)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <MilestoneAnimation />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Challenge Modal */}
      <Dialog open={showChallengeModal} onOpenChange={setShowChallengeModal}>
        <DialogContent className="sm:max-w-sm max-w-[90vw] max-h-[80vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-center">
              Challenge {profile.firstName || profile.username}
            </DialogTitle>
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Swords className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleChallenge} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="challengeTitle" className="text-sm font-medium">Challenge Title</Label>
              <Input
                id="challengeTitle"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="Enter challenge title"
                className="h-9 text-sm rounded-xl px-3 py-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challengeDescription" className="text-sm font-medium">Description</Label>
              <Textarea
                id="challengeDescription"
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder="Describe the challenge..."
                className="rounded-xl px-4 py-3 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="challengeType" className="text-xs font-medium">Type</Label>
                <Select value={challengeType} onValueChange={setChallengeType}>
                  <SelectTrigger className="h-8 rounded-xl px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg">
                    <SelectItem value="prediction">Prediction</SelectItem>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="trivia">Trivia</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="challengeAmount" className="text-xs font-medium">Stake (₦)</Label>
                <Input
                  id="challengeAmount"
                  type="number"
                  value={challengeAmount}
                  onChange={(e) => setChallengeAmount(e.target.value)}
                  placeholder="500"
                  className="h-8 rounded-xl px-3 text-sm"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowChallengeModal(false)}
                className="flex-1 h-8 px-3 text-sm rounded-xl border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={challengeMutation.isPending || !challengeTitle || !challengeAmount}
                className="flex-1 h-8 px-3 text-sm rounded-xl shadow-lg"
                style={{ backgroundColor: "#ccff00", color: "black" }}
              >
                {challengeMutation.isPending ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Swords className="w-3 h-3 mr-1" />
                    Send Challenge
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-center">
              Send Tip to {profile.firstName || profile.username}
            </DialogTitle>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleTip} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tipAmount" className="text-sm font-medium">Amount</Label>
              <Input
                id="tipAmount"
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="Enter amount"
                className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-lg"
                min="1"
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your current balance: {formatBalance(3280)}
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowTipModal(false)}
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={tipMutation.isPending || !tipAmount}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg"
              >
                {tipMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Tip
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileCard;