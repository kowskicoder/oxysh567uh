
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { LevelBadge } from './LevelBadge';

interface LevelProgressProps {
  level: number;
  currentXP: number;
  totalXP: number;
  recentGains?: Array<{
    source: string;
    xp: number;
    timestamp: string;
  }>;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
  level,
  currentXP,
  totalXP,
  recentGains = []
}) => {
  const currentLevelXP = (level - 1) * 1000;
  const nextLevelXP = level * 1000;
  const progressXP = currentXP - currentLevelXP;
  const levelProgress = (progressXP / (nextLevelXP - currentLevelXP)) * 100;

  const nextMilestones = [
    { level: level + 1, xpNeeded: nextLevelXP - currentXP },
    { level: level + 5, xpNeeded: (level + 5) * 1000 - currentXP },
    { level: level + 10, xpNeeded: (level + 10) * 1000 - currentXP }
  ];

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Level Progress</span>
          <LevelBadge level={level} size="md" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progress to Level {level + 1}</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {progressXP}/{nextLevelXP - currentLevelXP} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-3" />
        </div>

        {/* XP Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{totalXP.toLocaleString()}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{progressXP}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Current Level XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{nextLevelXP - currentXP}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">XP to Next Level</p>
          </div>
        </div>

        {/* Next Milestones */}
        <div>
          <h4 className="font-medium mb-3">Next Milestones</h4>
          <div className="space-y-2">
            {nextMilestones.map((milestone) => (
              <div key={milestone.level} className="flex justify-between items-center text-sm">
                <span className="flex items-center space-x-2">
                  <LevelBadge level={milestone.level} size="sm" />
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {milestone.xpNeeded.toLocaleString()} XP needed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent XP Gains */}
        {recentGains.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Recent XP Gains</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentGains.slice(0, 5).map((gain, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{gain.source}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    +{gain.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
