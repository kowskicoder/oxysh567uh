import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { 
  Trophy, 
  Clock, 
  Users, 
  Target, 
  Zap,
  Star,
  Crown
} from "lucide-react";

interface ChallengeIntentCardProps {
  challenge: {
    id: number;
    title: string;
    description?: string;
    category: string;
    amount: string;
    status: string;
    dueDate?: string;
    createdAt: string;
    challengerUser: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
    challengedUser: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
  variant?: 'default' | 'social' | 'compact';
  showActions?: boolean;
}

export function ChallengeIntentCard({ 
  challenge, 
  variant = 'default',
  showActions = true 
}: ChallengeIntentCardProps) {
  const getChallengerName = () => {
    return challenge.challengerUser.username || challenge.challengerUser.firstName || 'User';
  };

  const getChallengedName = () => {
    return challenge.challengedUser.username || challenge.challengedUser.firstName || 'User';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <Trophy className="w-4 h-4 text-blue-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'gaming':
        return '🎮';
      case 'sports':
        return '⚽';
      case 'trivia':
        return '🧠';
      case 'skill':
        return '🎯';
      case 'prediction':
        return '🔮';
      default:
        return '⚡';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true });

  if (variant === 'compact') {
    return (
      <Card className="w-full max-w-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(challenge.status)}
              <Badge className={getStatusColor(challenge.status)}>
                {challenge.status.toUpperCase()}
              </Badge>
            </div>
            <span className="text-2xl">{getCategoryIcon(challenge.category)}</span>
          </div>

          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white truncate">
            {challenge.title}
          </h3>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {getChallengerName()}
              </span>
              <span className="text-xs text-gray-500">vs</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {getChallengedName()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                ₦{parseInt(challenge.amount).toLocaleString()}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {challenge.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'social') {
    return (
      <Card className="w-full max-w-md bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-blue-200 dark:border-blue-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                CHALLENGE ALERT
              </span>
            </div>
            <Badge className={getStatusColor(challenge.status)}>
              {challenge.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              "{challenge.title}"
            </h2>
            {challenge.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {challenge.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex flex-col items-center">
              <UserAvatar 
                seed={getChallengerName()}
                className="w-12 h-12 mb-2"
                src={challenge.challengerUser.profileImageUrl || undefined}
                alt={getChallengerName()}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getChallengerName()}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2">
                <span className="text-white font-bold text-lg">VS</span>
              </div>
              <span className="text-xs text-gray-500">Battle</span>
            </div>

            <div className="flex flex-col items-center">
              <UserAvatar 
                seed={getChallengedName()}
                className="w-12 h-12 mb-2"
                src={challenge.challengedUser.profileImageUrl || undefined}
                alt={getChallengedName()}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getChallengedName()}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Stake:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₦{parseInt(challenge.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(challenge.category)}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {challenge.category}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Who do you think will win? 🏆
            </p>
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500">
                Join BetChat for live updates
              </span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="w-full border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Challenge Details
            </h3>
          </div>
          <Badge className={getStatusColor(challenge.status)}>
            {challenge.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {challenge.title}
            </h4>
            {challenge.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {challenge.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserAvatar 
                  seed={getChallengerName()}
                  className="w-8 h-8"
                  src={challenge.challengerUser.profileImageUrl || undefined}
                  alt={getChallengerName()}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getChallengerName()}
                </span>
              </div>

              <span className="text-sm text-gray-500">vs</span>

              <div className="flex items-center gap-2">
                <UserAvatar 
                  seed={getChallengedName()}
                  className="w-8 h-8"
                  src={challenge.challengedUser.profileImageUrl || undefined}
                  alt={getChallengedName()}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getChallengedName()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₦{parseInt(challenge.amount).toLocaleString()}
                </span>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <span>{getCategoryIcon(challenge.category)}</span>
                {challenge.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{timeAgo}</span>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                View Challenge
              </Button>
              <Button variant="outline" className="flex-1">
                <Users className="w-4 h-4 mr-2" />
                Join Discussion
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}