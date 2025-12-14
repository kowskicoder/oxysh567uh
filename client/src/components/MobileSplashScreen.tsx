import React, { useEffect, useState } from 'react';

interface MobileSplashScreenProps {
  onComplete: () => void;
}

export default function MobileSplashScreen({ onComplete }: MobileSplashScreenProps) {
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="text-center animate-pulse">
        <div className="mb-6">
          <img 
            src="/assets/bantahblue.svg" 
            alt="BetChat Logo" 
            className="w-24 h-24 mx-auto"
          />
        </div>
        <div className="text-white text-xl font-bold mb-2">Bantah</div>
        <div className="text-blue-100 text-sm">Social Betting Platform</div>
        <div className="mt-6">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}