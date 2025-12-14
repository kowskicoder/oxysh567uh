import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  containerClassName?: string;
}

export function ModernInput({
  label,
  error,
  icon,
  suffix,
  className,
  containerClassName,
  ...props
}: ModernInputProps) {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <Input
          className={cn(
            "h-12 rounded-xl border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200",
            "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
            "text-slate-900 dark:text-white placeholder:text-slate-400",
            icon && "pl-10",
            suffix && "pr-10",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}