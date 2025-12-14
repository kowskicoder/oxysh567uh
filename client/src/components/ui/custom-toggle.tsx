import { cn } from "@/lib/utils"

interface CustomToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function CustomToggle({ checked, onCheckedChange, disabled = false, className }: CustomToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        checked
          ? "border-gray-200 dark:border-gray-700"
          : "bg-gray-200 border-gray-200 dark:bg-gray-700 dark:border-gray-700",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={checked ? { backgroundColor: '#7440ff' } : undefined}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-7" : "translate-x-1",
          "mt-0.5"
        )}
      >
        {/* Checkmark icon when checked */}
        {checked && (
          <svg
            className="h-3 w-3 absolute top-1 left-1"
            fill="#7440ff"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
    </button>
  )
}