
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { Swords, Clock } from "lucide-react";

interface ChallengePreviewCardProps {
  challenger: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
  challenged: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
  title: string;
  description?: string;
  category: string;
  amount: string;
  dueDate?: string;
}

export function ChallengePreviewCard({
  challenger,
  challenged,
  title,
  description,
  category,
  amount,
  dueDate
}: ChallengePreviewCardProps) {
  const challengerName = challenger.firstName || challenger.username || 'You';
  const challengedName = challenged.firstName || challenged.username || 'Opponent';

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'gaming': return '🎮';
      case 'sports': return '⚽';
      case 'trading': return '📈';
      case 'fitness': return '🏃';
      case 'skill': return '🧠';
      default: return '⭐';
    }
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-600 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center -space-x-2">
              <UserAvatar
                userId={challenger.id}
                username={challenger.username || challenger.firstName || 'C'}
                size={32}
                className="w-8 h-8 border-2 border-white dark:border-slate-800 z-10"
              />
              <UserAvatar
                userId={challenged.id}
                username={challenged.username || challenged.firstName || 'O'}
                size={32}
                className="w-8 h-8 border-2 border-white dark:border-slate-800"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {challengerName} vs {challengedName}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{title}</p>
            </div>
          </div>
          <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs">
            Preview
          </Badge>
        </div>

        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <span className="text-xs font-semibold text-emerald-600">
              Stake: ₦{parseFloat(amount || '0').toLocaleString()}
            </span>
            <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center">
                <span className="mr-1">{getCategoryIcon(category)}</span>
                {category}
              </span>
              {dueDate && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Due {new Date(dueDate).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
              <Swords className="w-3 h-3 mr-1" />
              Ready to send
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
