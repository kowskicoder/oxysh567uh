
import { useLocation } from "wouter";
import { useCallback } from "react";

export function useAppNavigation() {
  const [location, navigate] = useLocation();

  const navigateWithTransition = useCallback((path: string, options?: { replace?: boolean }) => {
    // Add a small delay for smoother transitions
    const element = document.querySelector('.page-content');
    
    if (element) {
      element.classList.add('page-exit');
      
      setTimeout(() => {
        navigate(path, options);
        element.classList.remove('page-exit');
        element.classList.add('page-enter');
        
        setTimeout(() => {
          element.classList.remove('page-enter');
        }, 300);
      }, 200);
    } else {
      navigate(path, options);
    }
  }, [navigate]);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const canGoBack = useCallback(() => {
    return window.history.length > 1;
  }, []);

  return {
    location,
    navigate: navigateWithTransition,
    goBack,
    canGoBack,
    currentPath: location
  };
}
