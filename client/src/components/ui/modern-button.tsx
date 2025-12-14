import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export function ModernButton({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  disabled,
  ...props
}: ModernButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white",
    outline: "border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
  };

  const sizes = {
    sm: "h-9 px-3 text-sm rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-12 px-8 text-base rounded-xl"
  };

  return (
    <Button
      className={cn(
        "font-semibold transition-all duration-200 border-0",
        "focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="w-4 h-4 flex items-center justify-center">
                {icon}
              </span>
            )}
            <span>{children}</span>
            {icon && iconPosition === "right" && (
              <span className="w-4 h-4 flex items-center justify-center">
                {icon}
              </span>
            )}
          </>
        )}
      </div>
    </Button>
  );
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary";
}

export function FloatingActionButton({
  icon,
  onClick,
  className,
  variant = "primary"
}: FloatingActionButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-700"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        "focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/20",
        variants[variant],
        className
      )}
    >
      {icon}
    </button>
  );
}