
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  showBackButton?: boolean;
}

export function MobileHeader({ 
  title, 
  onBack, 
  rightContent, 
  showBackButton = true 
}: MobileHeaderProps) {
  const [location, navigate] = useLocation();
  
  // Don't show header for home/events pages as they have their own logo header
  const isHomePage = location === "/" || location === "/events" || location === "/home";
  
  if (isHomePage) {
    return null;
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/events");
    }
  };

  const getPageTitle = () => {
    if (title) return title;
    
    // Auto-generate title based on route
    if (location.startsWith("/events/create")) return "Create Event";
    if (location.startsWith("/events/")) return "Event Chat";
    if (location.startsWith("/challenges")) return "Challenges";
    if (location.startsWith("/wallet")) return "Wallet";
    if (location.startsWith("/profile")) return "Profile";
    if (location.startsWith("/friends")) return "Friends";
    if (location.startsWith("/leaderboard")) return "Leaderboard";
    if (location.startsWith("/notifications")) return "Notifications";
    if (location.startsWith("/settings")) return "Settings";
    if (location.startsWith("/shop")) return "Coin Shop";
    if (location.startsWith("/history")) return "History";
    if (location.startsWith("/admin")) return "Admin";
    
    return "Bantah Alpha";
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 md:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Back Button or Logo */}
        {showBackButton ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
        ) : (
          <div className="flex items-center">
            <img 
              src="/assets/bantahblue.svg" 
              alt="Bantah" 
              className="w-6 h-6 mr-2"
            />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Bantah
              <sup className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">Alpha</sup>
            </span>
          </div>
        )}

        {/* Page Title */}
        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate px-4 flex-1 text-center">
          {getPageTitle()}
        </h1>

        {/* Right Content or Spacer */}
        {rightContent || (
          <div className="w-9 h-9"> {/* Spacer to center title */}
          </div>
        )}
      </div>
    </div>
  );
}
