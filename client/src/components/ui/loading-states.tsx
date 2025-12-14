import { motion } from "framer-motion";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingStateProps {
  message?: string;
  icon?: string;
  className?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  icon = "⚡",
  className = ""
}: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <motion.div
        className="text-4xl mb-4"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {icon}
      </motion.div>

      <LoadingSpinner className="mb-4" />

      <motion.p
        className="text-lg font-medium text-center"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

export function FullScreenLoading({
  message = "Loading...",
  icon = "⚡"
}: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card p-8 rounded-lg shadow-lg border text-center max-w-sm"
      >
        <LoadingState message={message} icon={icon} />
      </motion.div>
    </motion.div>
  );
}