import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

export type LoadingType = "betting" | "wallet" | "trophy" | "chat" | "rocket" | "general";

interface PlayfulLoadingProps {
  type?: LoadingType;
  title?: string;
  description?: string;
  className?: string;
}

const loadingConfigs = {
  betting: {
    defaultTitle: "Placing Your Bet",
    defaultDescription: "Processing your bet...",
  },
  wallet: {
    defaultTitle: "Processing Payment",
    defaultDescription: "Updating your balance...",
  },
  trophy: {
    defaultTitle: "Calculating Results",
    defaultDescription: "Processing results...",
  },
  chat: {
    defaultTitle: "Loading Messages",
    defaultDescription: "Loading conversations...",
  },
  rocket: {
    defaultTitle: "Launching",
    defaultDescription: "Preparing system...",
  },
  general: {
    defaultTitle: "Loading",
    defaultDescription: "Getting things ready...",
  }
};

export function PlayfulLoading({
  type = "general",
  title,
  description,
  className
}: PlayfulLoadingProps) {
  const config = loadingConfigs[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("flex flex-col items-center justify-center p-8", className)}
    >
      <LoadingSpinner className="mb-4" />

      <h3 className="text-lg font-semibold mb-2">
        {title || config.defaultTitle}
      </h3>

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {description || config.defaultDescription}
      </p>
    </motion.div>
  );
}

export function PlayfulLoadingOverlay({
  type = "general",
  title,
  description
}: PlayfulLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <Card className="p-8 max-w-sm">
        <PlayfulLoading
          type={type}
          title={title}
          description={description}
        />
      </Card>
    </motion.div>
  );
}