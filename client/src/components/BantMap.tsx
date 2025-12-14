
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Trophy, 
  Zap, 
  Users, 
  Target,
  X,
  Search,
  ChevronUp,
  Shuffle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MAP_BACKGROUNDS = [
  "/map/MAP 1.svg",
  "/map/Scaled 9.svg",
  "/map/Scaled 11.svg"
];

interface MapUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  wins?: number;
  level?: number;
  activeChallenges?: number;
  isOnline?: boolean;
  lastActivity?: string;
  heatLevel?: number;
  primaryCategory?: string;
}

interface BantMapProps {
  onChallengeUser?: (user: MapUser) => void;
  embedded?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  crypto: "#F59E0B",
  sports: "#10B981",
  gaming: "#8B5CF6",
  music: "#EC4899",
  politics: "#3B82F6",
  newcomer: "#64748B"
};

export function BantMap({ onChallengeUser, embedded = false }: BantMapProps) {
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapFilter, setMapFilter] = useState<'all' | 'active'>('all');
  const [currentMapIndex, setCurrentMapIndex] = useState(() => 
    Math.floor(Math.random() * MAP_BACKGROUNDS.length)
  );
  const [isMapTransitioning, setIsMapTransitioning] = useState(false);

  const { data: users = [], isLoading } = useQuery<MapUser[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: challenges = [] } = useQuery<any[]>({
    queryKey: ["/api/challenges"],
    retry: false,
  });

  const getUserHeatLevel = (userId: number): number => {
    const userChallenges = challenges.filter(
      (c: any) => c.challengerId === userId || c.challengedId === userId
    );
    const activeChallenges = userChallenges.filter((c: any) => c.status === 'active').length;
    const recentChallenges = userChallenges.filter((c: any) => {
      const createdAt = new Date(c.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    return Math.min(activeChallenges * 2 + recentChallenges, 10);
  };

  const enrichedUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      heatLevel: getUserHeatLevel(user.id),
      activeChallenges: challenges.filter(
        (c: any) => (c.challengerId === user.id || c.challengedId === user.id) && c.status === 'active'
      ).length,
    }));
  }, [users, challenges]);

  const filteredUsers = useMemo(() => {
    let filtered = enrichedUsers;
    
    if (mapFilter === 'active') filtered = filtered.filter(u => u.activeChallenges > 0);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.username?.toLowerCase().includes(term) ||
        u.firstName?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [enrichedUsers, mapFilter, searchTerm]);

  // Natural scatter positions - spread users across the entire map naturally
  const getUserPosition = useMemo(() => {
    const positions = new Map<number, { x: number; y: number }>();
    
    // Use seeded random for consistent positions per user
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    
    filteredUsers.forEach((user, index) => {
      const seed1 = user.id * 12345;
      const seed2 = user.id * 67890;
      
      // Spread across 10-90% of the map area
      const x = 10 + seededRandom(seed1) * 80;
      const y = 10 + seededRandom(seed2) * 75;
      
      positions.set(user.id, { x, y });
    });
    
    return positions;
  }, [filteredUsers]);

  // Auto-rotate maps every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMapTransitioning(true);
      setTimeout(() => {
        setCurrentMapIndex((prev) => (prev + 1) % MAP_BACKGROUNDS.length);
        setIsMapTransitioning(false);
      }, 400);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleMapShuffle = () => {
    setIsMapTransitioning(true);
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * MAP_BACKGROUNDS.length);
      } while (newIndex === currentMapIndex && MAP_BACKGROUNDS.length > 1);
      setCurrentMapIndex(newIndex);
      setIsMapTransitioning(false);
    }, 400);
  };

  const containerHeight = embedded ? "h-[500px] md:h-[600px] rounded-2xl" : "h-full";

  if (isLoading) {
    return (
      <div className={`relative w-full ${containerHeight} flex items-center justify-center bg-slate-100 dark:bg-slate-900`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full ${containerHeight} overflow-hidden bg-slate-100 dark:bg-slate-900`}>
      {/* SVG Map Background */}
      <motion.img 
        key={currentMapIndex}
        src={MAP_BACKGROUNDS[currentMapIndex]} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: isMapTransitioning ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* User Markers - Natural scatter like Snapchat */}
      <AnimatePresence mode="popLayout">
        {filteredUsers.map((user) => {
          const pos = getUserPosition.get(user.id);
          if (!pos) return null;
          
          const isSelected = selectedUser?.id === user.id;
          const categoryColor = CATEGORY_COLORS[user.primaryCategory || 'newcomer'] || CATEGORY_COLORS.newcomer;
          const avatarSize = 36 + Math.min((user.level || 1) * 2, 12);
          
          return (
            <motion.div
              key={user.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: isSelected ? 1.2 : 1,
                opacity: 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute cursor-pointer"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 100 : 10
              }}
              onClick={() => setSelectedUser(user)}
            >
              {/* Avatar with colored ring */}
              <div 
                className="relative rounded-full shadow-lg"
                style={{
                  padding: '3px',
                  background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`
                }}
              >
                <div className="rounded-full bg-white dark:bg-slate-800 p-[2px]">
                  <UserAvatar
                    userId={String(user.id)}
                    username={user.username}
                    size={avatarSize}
                    className="rounded-full"
                  />
                </div>
                
                {/* Online pulse */}
                {user.isOnline && (
                  <motion.div 
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                {/* Active challenges indicator */}
                {(user.activeChallenges || 0) > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-md px-1">
                    {user.activeChallenges}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Search Bar - Top */}
      <div className="absolute top-4 left-4 right-4">
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="pl-9 h-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-0 shadow-lg rounded-full"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { setSearchOpen(false); setSearchTerm(""); }}
                className="h-10 w-10 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2"
            >
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSearchOpen(true)}
                className="h-10 w-10 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg"
              >
                <Search className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter & Controls - Top Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleMapShuffle}
          className="h-10 w-10 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg"
        >
          <motion.div animate={isMapTransitioning ? { rotate: 360 } : {}}>
            <Shuffle className="w-4 h-4" />
          </motion.div>
        </Button>
        <Button
          size="icon"
          variant={mapFilter === 'active' ? 'default' : 'ghost'}
          onClick={() => setMapFilter(prev => prev === 'all' ? 'active' : 'all')}
          className={`h-10 w-10 rounded-full backdrop-blur-md shadow-lg ${
            mapFilter === 'active' 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-white/95 dark:bg-slate-800/95'
          }`}
        >
          <Zap className="w-4 h-4" />
        </Button>
      </div>

      {/* User count pill - Bottom Left with safe area for mobile nav */}
      <div className="absolute bottom-24 left-4 md:bottom-4">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {filteredUsers.length}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {filteredUsers.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No users found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        </div>
      )}

      {/* Bottom Sheet - User Profile */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setSelectedUser(null);
              }}
              className="fixed bottom-0 left-0 right-0 z-50 touch-none"
            >
              <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-w-lg mx-auto">
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>
                
                <div className="px-5 pb-8 pt-1">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div 
                      className="rounded-full p-[3px] shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedUser.primaryCategory || 'newcomer']}, ${CATEGORY_COLORS[selectedUser.primaryCategory || 'newcomer']}aa)`
                      }}
                    >
                      <UserAvatar
                        userId={String(selectedUser.id)}
                        username={selectedUser.username}
                        size={64}
                        className="rounded-full border-3 border-white dark:border-slate-800"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                        {selectedUser.firstName || selectedUser.username}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        @{selectedUser.username}
                      </p>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedUser(null)}
                      className="rounded-full h-9 w-9"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedUser.wins || 0}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Wins</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <Zap className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedUser.activeChallenges || 0}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Challenge Button */}
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg"
                    onClick={() => onChallengeUser?.(selectedUser)}
                  >
                    <Target className="w-5 h-5 mr-2" />
                    Challenge
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
