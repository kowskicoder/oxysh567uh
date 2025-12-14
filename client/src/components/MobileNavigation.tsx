import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useBadges } from "@/hooks/useBadges";
import { useQuery } from "@tanstack/react-query";
import { formatBalance } from "@/utils/currencyUtils";
import { UserAvatar } from "@/components/UserAvatar";
import { ShoppingCart } from "lucide-react";

interface MobileNavigationProps {
  onCreateClick?: () => void;
}

export function MobileNavigation({
  onCreateClick,
}: MobileNavigationProps = {}) {
  const { user } = useAuth();
  const { navigate: navigateTo } = useAppNavigation();
  const { unreadCount } = useNotifications();
  const { hasProfileBadge, eventsBadgeCount, challengesBadgeCount } =
    useBadges();

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    enabled: !!user,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute instead of constant polling
  });

  const [location, navigate] = useLocation();

  // UserAvatar component will handle the avatar generation consistently

  const navItems = [
    {
      path: "/events",
      iconPath: "/assets/eventssvg.svg",
      label: "Events",
      isActive: location.startsWith("/events") || location === "/",
      tourId: "events",
    },
    {
      path: "/challenges",
      iconPath: "/assets/versus.svg",
      label: "Challenges",
      isActive: location.startsWith("/challenges"),
      tourId: "challenges",
    },
    {
      path: "create",
      iconPath: "/assets/create.png",
      label: "Create",
      isActive: false,
      tourId: "create",
      isCreateButton: true,
    },
    {
      path: "/history",
      iconPath: "/assets/listsvg.svg",
      label: "History",
      isActive: location.startsWith("/history"),
      tourId: "history",
    },
    {
      path: "/profile",
      iconPath: "/assets/user.svg",
      label: "Profile",
      isActive: location === "/profile",
      tourId: "profile",
      isProfileIcon: true,
    },
  ];

  const handleNavigation = (path: string, item?: any) => {
    // Handle create button specially
    if (item?.isCreateButton) {
      // If we're on the events page and have a create handler, use it
      if (location === "/events" && onCreateClick) {
        onCreateClick();
      } else {
        // Navigate to events page and trigger create dialog
        navigate("/events");
        // Trigger create event immediately for the Events page to handle
        setTimeout(() => {
          const createEvent = new CustomEvent("open-create-dialog");
          window.dispatchEvent(createEvent);
        }, 100);
      }
      return;
    }

    // Redirect home to events on mobile
    if (path === "/" || path === "/events") {
      navigate("/events");
    } else {
      navigate(path);
    }
  };

  return (
    <>
      {/* Mobile Wallet Display */}

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 md:hidden z-50 shadow-lg">
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path, item)}
              className={cn(
                "relative flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-200 ease-in-out min-w-[50px]",
                "hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95",
                item.isActive
                  ? "text-primary bg-primary/10 scale-105"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300",
              )}
              data-tour={item.tourId}
            >
              <div className="relative">
                {item.isProfileIcon && user ? (
                  <div
                    className={cn(
                      "w-5 h-5 mb-1 transition-transform duration-200 rounded-full overflow-hidden",
                      item.isActive && "scale-110",
                      item.isActive
                        ? "opacity-100 ring-2 ring-primary"
                        : "opacity-70",
                    )}
                  >
                    <UserAvatar
                      userId={user.id}
                      username={user.username || user.email}
                      size={20}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <img
                    src={item.iconPath}
                    alt={item.label}
                    className={cn(
                      "w-5 h-5 mb-1 transition-transform duration-200",
                      item.isActive && "scale-110",
                      item.isActive ? "opacity-100" : "opacity-70",
                    )}
                  />
                )}

                {/* Badge Logic */}
                {item.path === "/events" && eventsBadgeCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center p-0 bg-red-500 text-white text-[8px]">
                    {eventsBadgeCount > 9 ? "9+" : eventsBadgeCount}
                  </Badge>
                )}
                {item.path === "/challenges" && challengesBadgeCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center p-0 bg-red-500 text-white text-[8px]">
                    {challengesBadgeCount > 9 ? "9+" : challengesBadgeCount}
                  </Badge>
                )}
                {item.isProfileIcon && hasProfileBadge && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border border-white dark:border-slate-800"></div>
                )}
              </div>

              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200 leading-none",
                  item.isActive && "font-semibold",
                )}
              >
                {item.label}
              </span>
              {item.isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}