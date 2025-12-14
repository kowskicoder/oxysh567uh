import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, Gift, Users, Trophy, Coins } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BetChat Events!',
    content: 'Create prediction events and earn rewards while building your community.',
    target: 'events-header',
    icon: <Gift className="w-5 h-5" />,
    position: 'bottom'
  },
  {
    id: 'create-event',
    title: 'Create Events & Earn Points',
    content: 'Get 1000 points instantly when you create your first event. Plus earn 3% of all entry fees!',
    target: 'create-event-btn',
    icon: <Coins className="w-5 h-5" />,
    position: 'bottom'
  },
  {
    id: 'community',
    title: 'Build Your Community',
    content: 'Your events attract participants who engage in real-time chat and predictions.',
    target: 'events-grid',
    icon: <Users className="w-5 h-5" />,
    position: 'top'
  },
  {
    id: 'rewards',
    title: 'Multiple Reward Streams',
    content: 'Earn from creator fees, achievement unlocks, and referral bonuses. The more you create, the more you earn!',
    target: 'events-header',
    icon: <Trophy className="w-5 h-5" />,
    position: 'bottom'
  }
];

export function OnboardingTooltip({ isOpen, onClose, onComplete }: OnboardingTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && currentStep < onboardingSteps.length) {
      const targetId = onboardingSteps[currentStep].target;
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const step = onboardingSteps[currentStep];
        
        let newPosition = { top: 0, left: 0 };
        
        switch (step.position) {
          case 'bottom':
            newPosition = {
              top: rect.bottom + window.scrollY + 10,
              left: rect.left + window.scrollX + (rect.width / 2) - 150
            };
            break;
          case 'top':
            newPosition = {
              top: rect.top + window.scrollY - 10,
              left: rect.left + window.scrollX + (rect.width / 2) - 150
            };
            break;
          case 'left':
            newPosition = {
              top: rect.top + window.scrollY + (rect.height / 2) - 75,
              left: rect.left + window.scrollX - 310
            };
            break;
          case 'right':
            newPosition = {
              top: rect.top + window.scrollY + (rect.height / 2) - 75,
              left: rect.right + window.scrollX + 10
            };
            break;
        }
        
        setPosition(newPosition);
      }
    }
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen || currentStep >= onboardingSteps.length) return null;

  const step = onboardingSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-50 w-80 bg-white dark:bg-slate-800 border-2 border-primary/20 shadow-2xl"
        style={{
          top: position.top,
          left: Math.max(10, Math.min(position.left, window.innerWidth - 330))
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {step.icon}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {step.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {step.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-primary' 
                      : index < currentStep 
                        ? 'bg-primary/50' 
                        : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
              >
                Skip
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}