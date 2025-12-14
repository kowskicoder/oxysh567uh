import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CharacterProps {
  className?: string;
  animate?: boolean;
}

export function BettingDiceCharacter({ className, animate = true }: CharacterProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? {
        rotate: [0, 10, -10, 0],
        scale: [1, 1.05, 1]
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80" className="text-primary">
        <defs>
          <linearGradient id="diceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
          </linearGradient>
        </defs>
        
        {/* Dice body */}
        <rect x="15" y="15" width="50" height="50" rx="8" fill="url(#diceGradient)" />
        
        {/* Dice dots */}
        <circle cx="30" cy="30" r="3" fill="white" />
        <circle cx="50" cy="30" r="3" fill="white" />
        <circle cx="40" cy="40" r="3" fill="white" />
        <circle cx="30" cy="50" r="3" fill="white" />
        <circle cx="50" cy="50" r="3" fill="white" />
        
        {/* Character face */}
        <circle cx="40" cy="25" r="8" fill="hsl(var(--primary))" />
        <circle cx="37" cy="23" r="1.5" fill="white" />
        <circle cx="43" cy="23" r="1.5" fill="white" />
        <path d="M 36 27 Q 40 29 44 27" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

export function TrophyCharacter({ className, animate = true }: CharacterProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? {
        y: [0, -8, 0],
        rotate: [0, 5, -5, 0]
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        
        {/* Trophy base */}
        <rect x="30" y="55" width="20" height="8" rx="2" fill="url(#trophyGradient)" />
        <rect x="25" y="50" width="30" height="5" rx="2" fill="url(#trophyGradient)" />
        
        {/* Trophy cup */}
        <path d="M 25 50 L 25 35 Q 25 30 30 30 L 50 30 Q 55 30 55 35 L 55 50 Z" fill="url(#trophyGradient)" />
        
        {/* Trophy handles */}
        <path d="M 20 40 Q 15 40 15 35 Q 15 30 20 30" stroke="url(#trophyGradient)" strokeWidth="3" fill="none" />
        <path d="M 60 40 Q 65 40 65 35 Q 65 30 60 30" stroke="url(#trophyGradient)" strokeWidth="3" fill="none" />
        
        {/* Character face */}
        <circle cx="40" cy="20" r="8" fill="#FFD700" />
        <circle cx="37" cy="18" r="1.5" fill="white" />
        <circle cx="43" cy="18" r="1.5" fill="white" />
        <path d="M 36 22 Q 40 24 44 22" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}



export function RocketCharacter({ className, animate = true }: CharacterProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? {
        y: [0, -10, 0],
        rotate: [0, 3, -3, 0]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
          </linearGradient>
        </defs>
        
        {/* Rocket body */}
        <ellipse cx="40" cy="40" rx="12" ry="25" fill="url(#rocketGradient)" />
        
        {/* Rocket nose */}
        <path d="M 40 15 L 32 25 L 48 25 Z" fill="url(#rocketGradient)" />
        
        {/* Rocket fins */}
        <path d="M 28 50 L 32 60 L 32 50 Z" fill="url(#rocketGradient)" />
        <path d="M 52 50 L 48 60 L 48 50 Z" fill="url(#rocketGradient)" />
        
        {/* Rocket window */}
        <circle cx="40" cy="35" r="6" fill="lightblue" stroke="white" strokeWidth="2" />
        
        {/* Character face in window */}
        <circle cx="38" cy="33" r="1" fill="black" />
        <circle cx="42" cy="33" r="1" fill="black" />
        <path d="M 37 37 Q 40 38 43 37" stroke="black" strokeWidth="1" fill="none" strokeLinecap="round" />
        
        {/* Rocket flame */}
        <motion.path
          d="M 35 60 Q 40 70 45 60 Q 42 65 40 60 Q 38 65 35 60"
          fill="#FF6B35"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
    </motion.div>
  );
}

export function WalletCharacter({ className, animate = true }: CharacterProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? {
        y: [0, -5, 0],
        rotate: [0, 2, -2, 0]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.8)" />
          </linearGradient>
        </defs>
        
        {/* Wallet body */}
        <rect x="15" y="25" width="50" height="35" rx="5" fill="url(#walletGradient)" />
        <rect x="15" y="35" width="50" height="3" fill="hsl(var(--primary) / 0.6)" />
        
        {/* Money symbol */}
        <text x="40" y="48" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">₦</text>
        
        {/* Character face */}
        <circle cx="40" cy="20" r="8" fill="hsl(var(--primary))" />
        <circle cx="37" cy="18" r="1.5" fill="white" />
        <circle cx="43" cy="18" r="1.5" fill="white" />
        <path d="M 36 22 Q 40 24 44 22" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}



export function ChatBubbleCharacter({ className, animate = true }: CharacterProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      animate={animate ? {
        x: [0, 2, -2, 0],
        y: [0, -2, 0]
      } : {}}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.8)" />
          </linearGradient>
        </defs>
        
        {/* Chat bubble */}
        <path d="M 20 30 Q 20 25 25 25 L 55 25 Q 60 25 60 30 L 60 45 Q 60 50 55 50 L 35 50 L 25 55 L 30 50 L 25 50 Q 20 50 20 45 Z" 
              fill="url(#chatGradient)" />
        
        {/* Chat dots */}
        <circle cx="35" cy="37.5" r="2" fill="white" />
        <circle cx="40" cy="37.5" r="2" fill="white" />
        <circle cx="45" cy="37.5" r="2" fill="white" />
        
        {/* Character face */}
        <circle cx="40" cy="15" r="8" fill="hsl(var(--primary))" />
        <circle cx="37" cy="13" r="1.5" fill="white" />
        <circle cx="43" cy="13" r="1.5" fill="white" />
        <path d="M 36 17 Q 40 19 44 17" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

