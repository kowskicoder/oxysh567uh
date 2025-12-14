
import React from 'react';

interface CompactReactionBadgeProps {
  emoji: string;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const CompactReactionBadge: React.FC<CompactReactionBadgeProps> = ({
  emoji,
  count,
  isActive = false,
  onClick,
  size = 'sm'
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1'
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center space-x-1 rounded-full border transition-all duration-200 ease-in-out
        hover:scale-110 active:scale-95 transform
        ${sizeClasses[size]}
        ${isActive 
          ? 'bg-primary/20 border-primary text-primary shadow-md' 
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} leading-none`}>{emoji}</span>
      {count > 0 && (
        <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'} leading-none`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};
