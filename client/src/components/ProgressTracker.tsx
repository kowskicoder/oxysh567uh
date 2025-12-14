import React from 'react';
import { Check, Circle, Star, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  current: boolean;
  points: number;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  totalPoints: number;
  earnedPoints: number;
  onStepClick?: (stepId: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  totalPoints,
  earnedPoints,
  onStepClick
}) => {
  const progressPercentage = (earnedPoints / totalPoints) * 100;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header with points and progress */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Event Creation Progress
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete all steps to earn bonus points!
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {earnedPoints}/{totalPoints}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            Points
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="flex flex-wrap gap-2 justify-center">
        {steps.map((step) => {
          const IconComponent = step.icon;
          return (
            <div
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className={`
                relative p-2 rounded-lg border-2 transition-all duration-300 cursor-pointer group
                ${step.completed 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : step.current 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-800/50' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
                hover:scale-[1.05] transform
              `}
              title={`${step.title}: ${step.description} (+${step.points} points)`}
            >
              {step.completed && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              <div className="flex items-center space-x-1.5">
                <IconComponent 
                  className={`
                    w-4 h-4 transition-colors duration-200
                    ${step.completed 
                      ? 'text-green-600 dark:text-green-400' 
                      : step.current 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400'
                    }
                  `} 
                />

                <span className={`
                  text-xs font-medium transition-colors duration-200
                  ${step.completed 
                    ? 'text-green-700 dark:text-green-300' 
                    : step.current 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-slate-700 dark:text-slate-300'
                  }
                `}>
                  +{step.points}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion bonus */}
      {earnedPoints === totalPoints && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Perfect Event Created! 🎉
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You've earned a completion bonus of +50 XP!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressTracker;