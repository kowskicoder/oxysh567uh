import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Play, Pause, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  route: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'none';
  delay?: number;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Bantah! 🎉',
    description: 'Let\'s take a quick tour of the social betting platform where you can predict events, challenge friends, and win rewards.',
    target: '',
    route: '/',
    position: 'center',
    action: 'none',
    delay: 0
  },
  {
    id: 'events',
    title: 'Events & Predictions',
    description: 'Browse and participate in prediction events across crypto, sports, gaming, and more.',
    target: '[data-tour="events"]',
    route: '/events',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'challenges',
    title: 'P2P Challenges',
    description: 'Challenge friends directly with custom bets.',
    target: '[data-tour="challenges"]',
    route: '/challenges',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'wallet',
    title: 'Your Wallet',
    description: 'Manage your balance, deposits, and withdrawals.',
    target: '[data-tour="wallet"]',
    route: '/wallet',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'friends',
    title: 'Friends & Social',
    description: 'Connect with friends and compare performance.',
    target: '[data-tour="friends"]',
    route: '/friends',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'Start betting, challenging friends, and earning rewards!',
    target: '',
    route: '/',
    position: 'center',
    action: 'none'
  }
];

interface WebsiteTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebsiteTour({ isOpen, onClose }: WebsiteTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [, navigate] = useLocation();

  const currentTourStep = tourSteps[currentStep];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleResize = () => setTimeout(updatePosition, 100);
      const handleScroll = () => setTimeout(updatePosition, 50);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, currentStep, isMobile]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentStep > 0) {
      localStorage.setItem('bantah-tour-step', currentStep.toString());
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleSkip(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevious(); }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        currentStep === tourSteps.length - 1 ? handleSkip() : handleNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isPlaying || !isOpen || isPaused) return;
    const timer = setTimeout(() => {
      if (currentStep < tourSteps.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
        onClose();
      }
    }, currentTourStep.delay || 4000);
    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, isOpen, isPaused, onClose]);

  useEffect(() => {
    if (isOpen && currentTourStep.route) {
      navigate(currentTourStep.route);
    }
  }, [currentStep, isOpen, navigate]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    setIsPlaying(false);
    localStorage.removeItem('bantah-tour-step');
    onClose();
  };

  const updatePosition = () => {
    const tooltipWidth = isMobile ? 240 : 260;
    const tooltipHeight = 140;
    const padding = 16;
    const offset = 16;

    if (isMobile || currentTourStep.position === 'center') {
      setTooltipPosition({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        maxWidth: isMobile ? 'calc(100vw - 32px)' : 'auto'
      });
      setHighlightStyle({});
      return;
    }

    const target = document.querySelector(currentTourStep.target);
    if (!target) {
      setTooltipPosition({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001
      });
      setHighlightStyle({});
      return;
    }

    const rect = target.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    // Set highlight around target
    setHighlightStyle({
      position: 'fixed',
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
      zIndex: 999,
      pointerEvents: 'none'
    });

    let style: React.CSSProperties = { position: 'fixed', zIndex: 1001 };
    let top = 0, left = 0, transform = '';

    switch (currentTourStep.position) {
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - tooltipWidth - offset;
        transform = 'translateY(-50%)';
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        transform = 'translateY(-50%)';
        break;
    }

    if (left < padding) { left = padding; transform = ''; }
    else if (left + tooltipWidth > viewport.width - padding) {
      left = viewport.width - tooltipWidth - padding;
      transform = '';
    }

    if (top < padding) { top = padding; if (transform.includes('translateY')) transform = ''; }
    else if (top + tooltipHeight > viewport.height - padding) {
      top = viewport.height - tooltipHeight - padding;
      if (transform.includes('translateY')) transform = '';
    }

    style.top = Math.max(padding, top);
    style.left = Math.max(padding, left);
    if (transform) style.transform = transform;

    setTooltipPosition(style);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[998]">
      {/* Overlay with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Animated highlight ring around target */}
      {currentTourStep.target && highlightStyle.top !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={highlightStyle}
          className="rounded-xl"
        >
          <div className="absolute inset-0 rounded-xl bg-white/10 ring-4 ring-[#7440ff] ring-offset-4 ring-offset-transparent animate-pulse" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7440ff]/20 to-purple-500/20" />
        </motion.div>
      )}

      {/* Compact Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={tooltipPosition}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-200 dark:bg-slate-700">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#7440ff] to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  {currentTourStep.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentTourStep.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0 ml-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-4">
              {/* Step indicators */}
              <div className="flex items-center gap-1.5">
                {tourSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{
                      scale: index === currentStep ? 1.2 : 1,
                      opacity: index === currentStep ? 1 : 0.4
                    }}
                  >
                    <Circle
                      className={`h-2 w-2 ${
                        index <= currentStep 
                          ? 'fill-[#7440ff] text-[#7440ff]' 
                          : 'fill-slate-300 text-slate-300 dark:fill-slate-600 dark:text-slate-600'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="h-8 px-3 text-slate-700 dark:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <Button
                  onClick={currentStep === tourSteps.length - 1 ? handleSkip : handleNext}
                  size="sm"
                  className="h-8 px-4 bg-[#7440ff] hover:bg-[#6538e6] text-white"
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep !== tourSteps.length - 1 && <ArrowRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Hook to manage tour state
export function useTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('bantah-tour-completed');
    setHasCompletedTour(completed === 'true');
  }, []);

  const startTour = () => setIsOpen(true);

  const closeTour = () => {
    setIsOpen(false);
    localStorage.setItem('bantah-tour-completed', 'true');
    localStorage.removeItem('bantah-tour-step');
    setHasCompletedTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem('bantah-tour-completed');
    setHasCompletedTour(false);
  };

  return { isOpen, hasCompletedTour, startTour, closeTour, resetTour };
}