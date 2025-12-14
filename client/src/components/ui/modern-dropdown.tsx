import React from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, MoreHorizontal } from "lucide-react";

interface ModernDropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  variant?: "default" | "destructive";
  separator?: boolean;
}

interface ModernDropdownProps {
  trigger?: React.ReactNode;
  items: ModernDropdownItem[];
  title?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function ModernDropdown({
  trigger,
  items,
  title,
  triggerClassName,
  contentClassName
}: ModernDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("p-2 h-8 w-8 rounded-lg", triggerClassName)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className={cn(
          "w-48 rounded-xl border border-slate-200 dark:border-slate-700",
          "bg-white dark:bg-slate-800 shadow-lg p-1",
          contentClassName
        )}
        align="end"
      >
        {title && (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {title}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
          </>
        )}
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <DropdownMenuItem
              onClick={item.action}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mx-0.5",
                "hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-50 dark:focus:bg-slate-700",
                item.variant === "destructive" && 
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20"
              )}
            >
              {item.icon && (
                <div className={cn(
                  "w-4 h-4 flex items-center justify-center",
                  item.variant === "destructive" ? "text-red-500" : "text-slate-500 dark:text-slate-400"
                )}>
                  {item.icon}
                </div>
              )}
              <span className="font-medium text-sm">{item.label}</span>
            </DropdownMenuItem>
            {item.separator && index < items.length - 1 && (
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700 my-1" />
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserProfileDropdownProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onProfile: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onSignOut: () => void;
}

export function UserProfileDropdown({
  user,
  onProfile,
  onSettings,
  onHelp,
  onSignOut
}: UserProfileDropdownProps) {
  return (
    <ModernDropdown
      trigger={
        <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Button>
      }
      items={[
        {
          id: "profile",
          label: "Profile",
          icon: <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-600" />,
          action: onProfile
        },
        {
          id: "community",
          label: "Community",
          icon: <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900" />,
          action: () => {}
        },
        {
          id: "subscription",
          label: "Subscription",
          icon: <div className="w-4 h-4 rounded-lg bg-purple-100 dark:bg-purple-900" />,
          action: () => {},
          separator: true
        },
        {
          id: "settings",
          label: "Settings",
          icon: <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-600" />,
          action: onSettings
        },
        {
          id: "help",
          label: "Help center",
          icon: <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-600" />,
          action: onHelp,
          separator: true
        },
        {
          id: "signout",
          label: "Sign out",
          icon: <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-600" />,
          action: onSignOut,
          variant: "destructive" as const
        }
      ]}
      triggerClassName="rounded-2xl p-2 shadow-sm"
      contentClassName="w-56 rounded-2xl shadow-xl"
    />
  );
}