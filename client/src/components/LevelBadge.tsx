
import React from 'react';
import { Badge } from './ui/badge';
import { getLevelColor, getLevelIcon, getLevelName } from '@/utils/levelSystem';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showXP?: boolean;
  currentXP?: number;
  nextLevelXP?: number;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ 
  level, 
  size = 'md', 
  showXP = false, 
  currentXP, 
  nextLevelXP 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={`${getLevelColor(level)} ${sizeClasses[size]} font-semibold border-0 shadow-lg`}>
        <img 
          src={getLevelIcon(level)} 
          alt={`${getLevelName(level)} Level ${level} badge`} 
          className="w-4 h-4 mr-1" 
        />
        {getLevelName(level)} {level}
      </Badge>
      {showXP && currentXP !== undefined && nextLevelXP !== undefined && (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {currentXP}/{nextLevelXP} XP
        </div>
      )}
    </div>
  );
};
