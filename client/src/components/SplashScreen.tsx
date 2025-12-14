import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 animate-fade-out">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/assets/bantahlogo.png" 
            alt="BetChat" 
            className="w-20 h-20 mx-auto mb-4 animate-pulse"
          />
          <h1 className="text-primary text-2xl font-bold mb-2">Bantah</h1>
          <p className="text-slate-600 text-sm">Predict • Chat • Win</p>
        </div>

        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
}