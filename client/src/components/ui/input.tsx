import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Light mode styling
          "border-[hsl(220,9%,88%)] bg-[hsl(220,14%,96%)] text-slate-600 focus-visible:border-[hsl(220,9%,82%)] focus-visible:ring-2 focus-visible:ring-[hsl(220,14%,90%)] focus-visible:ring-offset-0",
          // Dark mode styling
          "dark:border-border dark:bg-input dark:text-slate-200 dark:focus-visible:border-primary dark:focus-visible:ring-ring dark:focus-visible:ring-offset-2 dark:ring-offset-background",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
