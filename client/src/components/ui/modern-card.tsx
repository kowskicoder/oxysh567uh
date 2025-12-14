import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function ModernCard({
  children,
  className,
  hover = false,
  gradient = false,
  header,
  icon,
  title,
  subtitle,
  action,
  ...props
}: ModernCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
        "shadow-sm transition-all duration-300",
        hover && "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        gradient && "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900",
        className
      )}
      {...props}
    >
      {(header || title || icon) && (
        <CardHeader className="pb-4">
          {header || (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    {icon}
                  </div>
                )}
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {action && action}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={header || title || icon ? "" : "pt-6"}>
        {children}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  className
}: StatCardProps) {
  const changeColors = {
    positive: "text-green-600 dark:text-green-400",
    negative: "text-red-600 dark:text-red-400",
    neutral: "text-slate-600 dark:text-slate-400"
  };

  return (
    <ModernCard className={cn("p-6", className)} gradient>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p className={cn("text-sm font-medium", changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </ModernCard>
  );
}