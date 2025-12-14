import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { BantMap as BantMapComponent } from "@/components/BantMap";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLevelIcon, getLevelName } from "@/utils/levelSystem";
import { Link } from "wouter";
import { 
  MapPin, 
  Users, 
  Search, 
  Star, 
  TrendingUp,
  Gamepad2,
  Music,
  Building2,
  Bitcoin,
  Trophy,
  Sparkles,
  UserPlus,
  X
} from "lucide-react";

interface MapUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  level: number | null;
  xp: number | null;
  coins: number | null;
  lastLogin: string | null;
  primaryCategory: string;
  isFriend: boolean;
  isCurrentUser: boolean;
}

const ZONES = [
  {
    id: "crypto",
    name: "Crypto Oga Territory",
    subNames: ["E-Money Lane", "Sabi Crypto Corner"],
    icon: Bitcoin,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/50",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "sports",
    name: "Baller Arena",
    subNames: ["Jollof League", "Super Eagles Side"],
    icon: Trophy,
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/50",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600 dark:text-green-400",
  },
  {
    id: "gaming",
    name: "No Carry Last Arena",
    subNames: ["Level Up District"],
    icon: Gamepad2,
    color: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-500/50",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "music",
    name: "Afrobeats Arena",
    subNames: [],
    icon: Music,
    color: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-500/50",
    bgColor: "bg-pink-500/10",
    textColor: "text-pink-600 dark:text-pink-400",
  },
  {
    id: "politics",
    name: "Aso Rock Side",
    subNames: ["Naija Politics Plaza"],
    icon: Building2,
    color: "from-blue-500/20 to-indigo-500/20",
    borderColor: "border-blue-500/50",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "newcomer",
    name: "JJC Corner",
    subNames: ["Johnny Just Come"],
    icon: Sparkles,
    color: "from-slate-500/20 to-gray-500/20",
    borderColor: "border-slate-500/50",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-600 dark:text-slate-400",
  },
];

function UserCard({ user, onClose }: { user: MapUser; onClose: () => void }) {
  const zone = ZONES.find(z => z.id === user.primaryCategory) || ZONES[5];
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="sr-only">User Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <UserAvatar 
              userId={user.id} 
              username={user.username || undefined} 
              size={80} 
              className={`ring-4 ${zone.borderColor} ring-offset-2`}
            />
            {user.isFriend && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                <Users className="w-3 h-3 text-white" />
              </div>
            )}
            {user.isCurrentUser && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                <Star className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {user.firstName} {user.lastName}
            </h3>
            {user.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={zone.bgColor}>
              <zone.icon className={`w-3 h-3 mr-1 ${zone.textColor}`} />
              <span className={zone.textColor}>{zone.name}</span>
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full text-center">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-lg font-bold">{user.level || 1}</p>
              <p className="text-xs text-muted-foreground">Level</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-lg font-bold">{(user.xp || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-lg font-bold">{(user.coins || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <Link href={`/@${user.username || user.id}`} className="flex-1">
              <Button variant="default" className="w-full" data-testid="button-view-profile">
                View Profile
              </Button>
            </Link>
            {!user.isCurrentUser && !user.isFriend && (
              <Button variant="outline" size="icon" data-testid="button-add-friend">
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ZoneSection({ 
  zone, 
  users, 
  onUserClick 
}: { 
  zone: typeof ZONES[0]; 
  users: MapUser[]; 
  onUserClick: (user: MapUser) => void;
}) {
  const displayUsers = users.slice(0, 20);
  const remainingCount = users.length - 20;
  
  return (
    <div 
      className={`relative rounded-2xl border-2 ${zone.borderColor} bg-gradient-to-br ${zone.color} p-4 transition-all hover:scale-[1.02]`}
      data-testid={`zone-${zone.id}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${zone.bgColor}`}>
          <zone.icon className={`w-5 h-5 ${zone.textColor}`} />
        </div>
        <div>
          <h3 className={`font-bold ${zone.textColor}`}>{zone.name}</h3>
          {zone.subNames.length > 0 && (
            <p className="text-xs text-muted-foreground">{zone.subNames.join(" • ")}</p>
          )}
        </div>
        <Badge variant="secondary" className="ml-auto">
          {users.length} users
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {displayUsers.map((user, index) => (
          <button
            key={user.id}
            onClick={() => onUserClick(user)}
            className={`relative group transition-transform hover:scale-110 hover:z-10 ${
              user.isCurrentUser ? 'ring-2 ring-primary ring-offset-1 rounded-full' : ''
            } ${user.isFriend ? 'ring-2 ring-green-500 ring-offset-1 rounded-full' : ''}`}
            style={{ 
              marginLeft: index > 0 ? '-4px' : '0',
              zIndex: displayUsers.length - index 
            }}
            data-testid={`avatar-user-${user.id}`}
          >
            <UserAvatar 
              userId={user.id} 
              username={user.username || undefined} 
              size={32 + Math.min((user.level || 1) * 2, 16)} 
              className="border-2 border-background shadow-sm"
            />
            {(user.level || 1) >= 5 && (
              <div className="absolute -top-1 -right-1 text-xs">
                {getLevelIcon(user.level || 1)}
              </div>
            )}
          </button>
        ))}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BantMap() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "friends">("all");

  const { data: mapUsers = [], isLoading } = useQuery<MapUser[]>({
    queryKey: ["/api/bant-map"],
    refetchInterval: 30000,
  });

  const filteredUsers = useMemo(() => {
    let filtered = mapUsers;
    
    if (filter === "friends") {
      filtered = filtered.filter(u => u.isFriend || u.isCurrentUser);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.username?.toLowerCase().includes(term) ||
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [mapUsers, filter, searchTerm]);

  const usersByZone = useMemo(() => {
    const grouped: Record<string, MapUser[]> = {};
    ZONES.forEach(zone => {
      grouped[zone.id] = filteredUsers.filter(u => u.primaryCategory === zone.id);
    });
    return grouped;
  }, [filteredUsers]);

  const stats = useMemo(() => ({
    total: mapUsers.length,
    friends: mapUsers.filter(u => u.isFriend).length,
    online: mapUsers.filter(u => {
      if (!u.lastLogin) return false;
      const lastLogin = new Date(u.lastLogin);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastLogin > fiveMinutesAgo;
    }).length,
  }), [mapUsers]);

  if (!user) return null;

  return (
    <>
      {/* Desktop view only */}
      <div className="hidden md:block min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Bant Map</h1>
                <p className="text-xs text-muted-foreground">Explore Bantah community</p>
              </div>
            </div>
            
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "friends")}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3" data-testid="tab-all">
                    All ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="friends" className="text-xs px-3" data-testid="tab-friends">
                    Friends ({stats.friends})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {stats.online} online
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {ZONES.map(zone => (
                <ZoneSection
                  key={zone.id}
                  zone={zone}
                  users={usersByZone[zone.id] || []}
                  onUserClick={setSelectedUser}
                />
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <UserCard user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </div>
      
      {/* Mobile: Full screen map - edge to edge, no header */}
      <div className="md:hidden fixed inset-0 z-50">
        <BantMapComponent onChallengeUser={(user) => setSelectedUser(user as any)} />
      </div>
    </>
  );
}