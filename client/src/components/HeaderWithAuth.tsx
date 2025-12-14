import { useEventsSearch } from "@/context/EventsSearchContext";
import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  LogOut,
  LogIn,
} from "lucide-react";
import { Link } from "wouter";

export function HeaderWithAuth() {
  const { user, isLoading, logout, isLoggingOut, login } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    enabled: !!user,
    refetchInterval: 5000,
  });

  const [, navigate] = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <nav className="bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src="/assets/bantahblue.svg"
                  alt="Bantah Logo"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  <Button
                    onClick={() => login()}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
            </div>
            <div className="animate-pulse h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </nav>
    );
        
      <>
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 theme-transition sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
                  <img
                    src="/assets/bantahblue.svg"
                    alt="Bantah Logo"
                    className="w-8 h-8"
                  />
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    Bantah
                    <sup className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">Alpha</sup>
                  </span>
                </div>
              </div>

              {/* Public Navigation Items */}
              <div className="hidden md:flex items-center space-x-8">
                <span className="text-slate-600 dark:text-slate-300">
                  Social Betting Platform
                </span>
              </div>

              {/* Sign In Button */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </nav>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Authenticated header (existing Navigation component logic)
  const { searchTerm, setSearchTerm } = useEventsSearch();
  const [location] = useLocation();

  // Only show search bar on /events route and desktop
  const showEventsSearch = location === "/events";

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 theme-transition sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/assets/bantahblue.svg"
                alt="Bantah Logo"
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-slate-900 dark:text-white">Bantah</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation("/")}
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigation("/events")}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="events"
            >
              Events
            </button>
            <button
              onClick={() => handleNavigation("/challenges")}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="challenges"
            >
              Challenges
            </button>
            <button
              onClick={() => handleNavigation("/friends")}
              className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              data-tour="friends"
            >
              Friends
            </button>

            {user?.isAdmin && (
              <button
                onClick={() => handleNavigation("/admin")}
                className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Admin
              </button>
            )}
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-4">
            {/* Events Search Bar (desktop, only on /events) */}
            {showEventsSearch && (
              <div className="hidden md:block w-64">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none border border-[hsl(220,9%,88%)] bg-[hsl(220,14%,96%)] focus:border-[hsl(220,9%,82%)] focus:ring-2 focus:ring-[hsl(220,14%,90%)] focus:ring-offset-0 dark:border-border dark:bg-input dark:focus:border-primary dark:focus:ring-ring dark:focus:ring-offset-2 dark:ring-offset-background"
                />
              </div>
            )}
            {/* Wallet Balance & Coins */}
            <button
              onClick={() => handleNavigation("/wallet")}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: "#7440ff", color: "white" }}
              data-tour="wallet"
            >
              <div className="flex items-center space-x-1">
                <i className="fas fa-wallet text-emerald-500"></i>
                <span className="text-sm font-medium">
                  {formatBalance(
                    typeof balance === "object" && balance !== null
                      ? (balance as any).balance || 0
                      : typeof balance === "number"
                      ? balance
                      : 0
                  )}
                </span>
              </div>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigation("/notifications")}
              className={"relative p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"}
              data-tour="notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <UserAvatar
                    user={user}
                    size="sm"
                    className="ring-2 ring-primary ring-offset-2"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-slate-500 dark:text-slate-400">@{user.username}</div>
                </div>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleNavigation("/wallet")}>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Wallet</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleNavigation("/shop")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Coin Shop</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="text-red-600 dark:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}