import React from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  showPadding?: boolean;
  noCard?: boolean;
}

export default function MobileLayout({ children, className, showPadding = true, noCard = false }: MobileLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-slate-50 dark:bg-slate-900",
      "md:bg-slate-100 md:dark:bg-slate-800", // Different background for desktop
      className
    )}>
      {/* Mobile-first container */}
      <div className={cn(
        "mx-auto max-w-md md:max-w-none",
        "md:px-8 md:py-6", // Add horizontal padding on desktop for content area
        showPadding && "px-3 pt-2 md:px-6"
      )}>
        <div className={cn(
          // Mobile: Full screen app-like
          !noCard && "md:bg-white md:dark:bg-slate-900 md:rounded-xl md:shadow-lg md:border md:border-slate-200 md:dark:border-slate-800",
          !noCard && "md:min-h-[calc(100vh-3rem)]" // Desktop: Card-like with margins
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized card component
export function MobileCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800",
        "rounded-3xl md:rounded-lg", // Even more rounded on mobile for app-like feel
        "shadow-sm border border-slate-200 dark:border-slate-700",
        "p-3 md:p-6", // More compact padding on mobile
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Mobile-optimized button
export function MobileButton({ 
  children, 
  className, 
  size = "default",
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "default" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 px-3 text-sm rounded-xl",
    default: "h-11 px-4 rounded-2xl md:rounded-lg", // More rounded on mobile
    lg: "h-12 px-6 text-lg rounded-2xl md:rounded-lg"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "bg-blue-600 hover:bg-blue-700 text-white",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Mobile-optimized section header (no title on mobile for app-like feel)
export function MobileSectionHeader({ 
  title, 
  subtitle, 
  action,
  className 
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between",
      "mb-2 md:mb-6", // Even less margin on mobile for compactness
      className
    )}>
      <div className="hidden md:block"> {/* Hide title completely on mobile for app-like feel */}
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className={cn(
          "w-full md:w-auto", // Full width on mobile for action buttons
          action ? "block" : "hidden md:block"
        )}>
          {action}
        </div>
      )}
    </div>
  );
}