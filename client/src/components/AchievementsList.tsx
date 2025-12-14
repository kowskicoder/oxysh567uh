import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  pointsReward: number;
  unlockedAt: string;
}

export function AchievementsList() {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["/api/user/achievements"],
    retry: false,
  });

  const getAchievementColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'first':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
      case 'streak':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'social':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'challenge':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'event':
        return 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300';
      default:
        return 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300';
    }
  };

  const getAchievementIcon = (icon: string, category: string) => {
    if (icon) return icon;
    
    switch (category?.toLowerCase()) {
      case 'first':
        return 'fas fa-star';
      case 'streak':
        return 'fas fa-fire';
      case 'social':
        return 'fas fa-users';
      case 'challenge':
        return 'fas fa-sword';
      case 'event':
        return 'fas fa-calendar-check';
      default:
        return 'fas fa-trophy';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 theme-transition">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Recent Achievements 🏆</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading achievements...</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-trophy text-3xl text-slate-400 mb-3"></i>
            <p className="text-slate-600 dark:text-slate-400">No achievements yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">Start participating to unlock achievements!</p>
          </div>
        ) : (
          achievements.slice(0, 3).map((achievement: Achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center space-x-3 p-3 rounded-lg ${getAchievementColor(achievement.category)}`}
            >
              <div className="w-8 h-8 bg-current rounded-full flex items-center justify-center opacity-20">
                <i className={`${getAchievementIcon(achievement.icon, achievement.category)} text-current text-sm opacity-100`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{achievement.name}</h4>
                <p className="text-xs opacity-80 truncate">{achievement.description}</p>
                <p className="text-xs opacity-60">
                  {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                </p>
              </div>
              <div className="text-right">
                {achievement.xpReward > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{achievement.xpReward} XP
                  </Badge>
                )}
                {achievement.pointsReward > 0 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    +{achievement.pointsReward} pts
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
        
        {achievements.length > 3 && (
          <div className="text-center pt-2">
            <button
              onClick={() => window.location.href = '/profile'}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all achievements
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
