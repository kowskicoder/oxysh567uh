import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { type ButtonProps } from "@/components/ui/button";

interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  hoverScale?: boolean;
  children: React.ReactNode;
}

export function AnimatedButton({
  isLoading = false,
  loadingText = "Loading...",
  icon,
  hoverScale = true,
  children,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const MotionButton = motion(Button);

  return (
    <MotionButton
      className={cn(className)}
      disabled={disabled || isLoading}
      whileHover={hoverScale ? { scale: 1.02 } : undefined}
      whileTap={hoverScale ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      <motion.div
        className="flex items-center space-x-2"
        initial={false}
        animate={isLoading ? { opacity: 0.7 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {icon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
            <span>{children}</span>
          </>
        )}
      </motion.div>
    </MotionButton>
  );
}