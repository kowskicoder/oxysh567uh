import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useNotifications } from "@/hooks/useNotifications";
import { useBadges } from "@/hooks/useBadges";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBalance } from "@/utils/currencyUtils";
import { getAvatarUrl } from "@/utils/avatarUtils";
import { UserAvatar } from "@/components/UserAvatar";
import { useEventsSearch } from "../context/EventsSearchContext"; // Corrected import
import { SmartSearch } from "./SmartSearch";
import {
  Bell,
  Settings,
  Users,
  Calendar,
  Trophy,
  Wallet,
  Home,
  Menu,
  X,
  Sun,
  Moon,
  ShoppingCart,
  ArrowLeft,
  User,
  Clock,
  LogOut,
  Award,
  Search,
} from "lucide-react";
import { Link } from "wouter"; // Import Link from wouter
import { FloatingBantzzButton } from "./FloatingBantzzButton";

export function Navigation() {
  const { user } = useAuth();

  const { notifications, unreadCount } = useNotifications();
  const { hasProfileBadge } = useBadges();

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const [location, navigate] = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const [showSignIn, setShowSignIn] = useState(false);

  if (!user) {
    return (
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 theme-transition sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                onClick={() => (window.location.href = "/")}
              >
                <img
                  src="/assets/bantahblue.svg"
                  alt="BetChat Logo"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-slate-900 dark:text-white"></span>
              </button>
            </div>
            {/* Sign In Button */}
            <div>
              <button
                onClick={() => setShowSignIn(true)}
                className="bg-primary text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
        {/* Sign In Modal */}
        <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
          <DialogContent className="sm:max-w-sm rounded-3xl border-0 shadow-2xl overflow-hidden">
            <DialogHeader className="pb-2">
              <div className="flex flex-col items-center justify-center w-full">
                <img
                  src="/assets/bantahblue.svg"
                  alt="Bantah Logo"
                  className="w-16 h-16 mb-2 drop-shadow-lg"
                  style={{ objectFit: "contain" }}
                />
                <DialogTitle className="text-center text-lg font-bold text-gray-800 dark:text-gray-200">
                  Sign in to Bantah
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-2">
              <button
                onClick={() => {
                  window.location.href = "/api/login";
                }}
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition-colors"
              >
                Continue with Telegram
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By signing in, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </nav>
    );
  }

  // Check if current page should show logo (events and home pages)
  const shouldShowLogo =
    location === "/" || location === "/events" || location === "/home";

  // Get page title for non-logo pages
  const getPageTitle = () => {
    if (location.startsWith("/events/create")) return "Create Event";
    if (location.startsWith("/events/")) return "Event Chat";
    if (location.startsWith("/challenges")) return "Challenges";
    if (location.startsWith("/wallet")) return "Wallet";
    if (location.startsWith("/profile/edit")) return "Edit Profile";
    if (location.startsWith("/profile/settings")) return "Profile Settings";
    if (location.startsWith("/profile")) return "Profile";
    if (location.startsWith("/friends")) return "Friends";
    if (location.startsWith("/leaderboard")) return "Leaderboard";
    if (location.startsWith("/notifications")) return "Notifications";
    if (location.startsWith("/settings")) return "Settings";
    if (location.startsWith("/shop")) return "Coin Shop";
    if (location.startsWith("/history")) return "History";
    if (location.startsWith("/admin")) return "Admin";
    if (location.startsWith("/referrals")) return "Referrals";
    if (location.startsWith("/points")) return "Points & Badges";
    if (location.startsWith("/support-chat")) return "Support Chat";
    if (location.startsWith("/help-support")) return "Help & Support";
    if (location.startsWith("/terms-of-service")) return "Terms of Service";
    if (location.startsWith("/privacy-policy")) return "Privacy Policy";
    if (location.startsWith("/data-deletion-request")) return "Data Deletion";
    return "Bantah";
  };

  const handleBack = () => {
    // Navigate back to events page (main page for mobile)
    navigate("/events");
  };

  const { searchTerm, setSearchTerm } = useEventsSearch();

  return (
    <>
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 theme-transition sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 md:h-16">
            {/* Mobile Header Logic - Logo on Events/Home, Back Button + Title on other pages */}
            <div className="flex items-center justify-between md:hidden w-full">
              <div className="flex items-center space-x-3">
                {shouldShowLogo ? (
                  /* Events/Home page - Show logo only */
                  <button
                    onClick={() => handleNavigation("/")}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src="/assets/bantahblue.svg"
                      alt="Bantah Logo"
                      className="w-8 h-8"
                    />
                    <span className="text-2xl font-black text-slate-900 dark:text-white"></span>
                  </button>
                ) : (
                  /* Other pages - Show back button + page title */
                  <>
                    <button
                      onClick={handleBack}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {getPageTitle()}
                    </h1>
                  </>
                )}
              </div>

              {/* Mobile Right Side Icons */}
              <div className="flex items-center space-x-2">
                {/* Smart Search - Only show on Events/Home page */}
                {shouldShowLogo && (
                  <SmartSearch placeholder="Search events, challenges, users..." />
                )}

                {/* Leaderboard Icon - Always visible on mobile */}
                <button
                  onClick={() => handleNavigation("/leaderboard")}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                >
                  <img 
                    src="/assets/leaderboard_activity.png" 
                    alt="Leaderboard" 
                    className="w-5 h-5"
                  />
                </button>

                {/* Notifications - Always visible on mobile */}
                <button
                  onClick={() => handleNavigation("/notifications")}
                  className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
                  data-tour="notifications"
                >
                  <img
                    src="/assets/notify22.svg"
                    alt="Notifications"
                    className="w-6 h-6"
                  />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </button>

                {/* Wallet Coins - Mobile */}
                <button
                  onClick={() => handleNavigation("/wallet")}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs"
                  style={{ backgroundColor: "#ccff00", color: "black" }}
                  data-tour="wallet"
                >
                  <i className="fas fa-coins text-yellow-500 text-xs"></i>
                  <span className="font-medium">
                    {typeof balance === "object" && balance !== null
                      ? ((balance as any).coins || 0).toLocaleString()
                      : "0"}
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop Logo */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => handleNavigation("/")}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <img
                  src="/assets/bantahblue.svg"
                  alt="Bantah Logo"
                  className="w-8 h-8"
                />
                <span className="text-2xl font-black text-slate-900 dark:text-white"></span>
              </button>
            </div>
            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Primary Navigation Group */}
              <div className="flex items-center bg-gray-50 dark:bg-slate-700/50 rounded-xl p-1 border border-gray-200 dark:border-slate-600">
                <button
                  onClick={() => handleNavigation("/events")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    location === "/events" || location.startsWith("/events")
                      ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                  data-tour="events"
                >
                  <Calendar className="w-4 h-4" />
                  Events
                </button>
                <button
                  onClick={() => handleNavigation("/challenges")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    location === "/challenges" ||
                    location.startsWith("/challenges")
                      ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                  data-tour="challenges"
                >
                  <Trophy className="w-4 h-4" />
                  Challenges
                </button>
                <button
                  onClick={() => handleNavigation("/friends")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    location === "/friends" || location.startsWith("/friends")
                      ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                  data-tour="friends"
                >
                  <Users className="w-4 h-4" />
                  Friends
                </button>
                <button
                  onClick={() => handleNavigation("/leaderboard")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    location === "/leaderboard" ||
                    location.startsWith("/leaderboard")
                      ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                  data-tour="leaderboard"
                >
                  <Award className="w-4 h-4" />
                  Leaderboard
                </button>
              </div>

              {/* Secondary Navigation Group */}
              <div className="flex items-center bg-gray-50 dark:bg-slate-700/50 rounded-xl p-1 border border-gray-200 dark:border-slate-600"></div>

              {/* Search Bar - Show on all pages */}
              <div className="ml-2">
                <Input
                  placeholder="Search events.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 w-3/4 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0 focus:border-slate-400 focus-visible:ring-slate-400 placeholder:text-slate-400 placeholder:text-sm"
                />
              </div>
            </div>

            {/* Right Side Items - Desktop Only */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Notifications - Desktop Only */}
              <button
                onClick={() => handleNavigation("/notifications")}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
                data-tour="notifications"
              >
                <img
                  src="/assets/notify22.svg"
                  alt="Notifications"
                  className="w-7 h-7"
                />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </button>

              {/* Profile Button - Desktop Only */}
              <button
                onClick={() => handleNavigation("/profile")}
                className="relative hidden md:flex items-center justify-center w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              >
                <UserAvatar
                  userId={user.id}
                  username={user.username || user.email}
                  size={32}
                  className="w-full h-full"
                />
                {hasProfileBadge && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                )}
              </button>

              {/* Wallet Coins */}
              <button
                onClick={() => handleNavigation("/wallet")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: "#ccff00", color: "black" }}
                data-tour="wallet"
              >
                <i className="fas fa-coins text-yellow-500"></i>
                <span className="text-sm font-medium">
                  {typeof balance === "object" && balance !== null
                    ? ((balance as any).coins || 0).toLocaleString()
                    : "0"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Bantzz AI Button */}
      <FloatingBantzzButton />
    </>
  );
}
