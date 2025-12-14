import React from "react";
import { cn } from "@/lib/utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { ChevronDown, User } from "lucide-react";

interface ModernSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  avatar?: string;
}

interface ModernSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: ModernSelectOption[];
  className?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export function ModernSelect({
  value,
  onValueChange,
  placeholder = "Select an option",
  options,
  className,
  disabled = false,
  error,
  label
}: ModernSelectProps) {
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger 
          className={cn(
            "h-12 rounded-lg border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-800 px-4",
            "focus:ring-0 focus:ring-offset-0 focus:border-slate-300 dark:focus:border-slate-600",
            "text-slate-900 dark:text-white shadow-sm",
            "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
            error && "border-red-300 focus:border-red-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            {selectedOption?.avatar && (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                <img src={selectedOption.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {selectedOption?.icon && !selectedOption?.avatar && (
              <div className="w-5 h-5 flex items-center justify-center text-slate-500">
                {selectedOption.icon}
              </div>
            )}
            <SelectValue placeholder={
              <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
            } />
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 ml-2" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-0 shadow-lg bg-white dark:bg-slate-800 min-w-[var(--radix-select-trigger-width)]">
          <div className="p-1">
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="h-11 rounded-lg px-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:bg-slate-50 dark:focus:bg-slate-700/50 data-[highlighted]:bg-slate-50 data-[highlighted]:text-slate-900 dark:data-[highlighted]:bg-slate-700/50 dark:data-[highlighted]:text-white"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {option.avatar && (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                      <img src={option.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {option.icon && !option.avatar && (
                    <div className="w-5 h-5 flex items-center justify-center text-slate-500 flex-shrink-0">
                      {option.icon}
                    </div>
                  )}
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {option.label}
                  </span>
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}