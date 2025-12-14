import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import ProfileCard from "@/components/ProfileCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getLevelIcon, getLevelName } from "@/utils/levelSystem";

export default function Leaderboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: leaderboard = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/leaderboard"],
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle errors with useEffect to prevent infinite re-renders
  useEffect(() => {
    if (error) {
      console.error("Leaderboard error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error loading leaderboard",
          description: "Unable to load leaderboard data. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [error, toast]);

  // Debug logging
  console.log("Leaderboard data:", leaderboard);
  console.log("Is array:", Array.isArray(leaderboard));
  console.log(
    "Length:",
    Array.isArray(leaderboard) ? leaderboard.length : "Not array",
  );

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-amber-600 dark:text-amber-400";
      case 2:
        return "text-slate-600 dark:text-slate-400";
      case 3:
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-slate-700 dark:text-slate-300";
    }
  };

  const currentUserRank = Array.isArray(leaderboard)
    ? leaderboard.findIndex((player: any) => player.id === user?.id) + 1
    : 0;

  if (!user) return null;

  // Apply search filter
  const filteredUsers = Array.isArray(leaderboard)
    ? leaderboard.filter((user: any) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const firstName = (user.firstName || "").toLowerCase();
        const lastName = (user.lastName || "").toLowerCase();
        const username = (user.username || "").toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();

        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          username.includes(searchLower) ||
          fullName.includes(searchLower)
        );
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Your Rank Card */}
        {currentUserRank > 0 && (
          <Card className="mb-4 bg-gradient-to-br from-[#7440ff] via-[#7440ff] to-[#7440ff] text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl shadow-md border ${
                      currentUserRank === 1
                        ? "bg-white text-yellow-700 border-yellow-300"
                        : currentUserRank === 2
                          ? "bg-white text-slate-600 border-slate-300"
                          : currentUserRank === 3
                            ? "bg-white text-orange-600 border-orange-300"
                            : "bg-primary-700 text-white border-primary-800"
                    }`}
                    style={{
                      textShadow:
                        currentUserRank <= 3
                          ? "0 1px 4px rgba(0,0,0,0.18)"
                          : undefined,
                    }}
                  >
                    {getRankIcon(currentUserRank)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Your Rank</h3>
                    <p className="text-primary-100">
                      {user.points} points • Level {user.level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">#{currentUserRank}</p>
                  <p className="text-primary-100 text-sm">
                    of {Array.isArray(leaderboard) ? leaderboard.length : 0}{" "}
                    players
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">
                  Loading leaderboard...
                </p>
              </div>
            ) : !Array.isArray(leaderboard) || leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-trophy text-4xl text-slate-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No rankings yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Start playing to appear on the leaderboard!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((player: any, index: number) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 md:p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    onClick={() => setSelectedProfileUserId(player.id)}
                  >
                    <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {index + 1}
                        </span>
                      </div>

                      <div className="relative flex-shrink-0">
                        <UserAvatar
                          userId={player.id}
                          username={player.username}
                          size={28}
                          className="h-7 w-7"
                        />
                        {index === 0 && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">⭐</span>
                          </div>
                        )}
                        {index === 1 && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">⭐</span>
                          </div>
                        )}
                        {index === 2 && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">⭐</span>
                          </div>
                        )}
                        {/* Level Badge */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-800">
                          <img
                            src={getLevelIcon(player.level || 1)}
                            alt={`${getLevelName(player.level || 1)} Level ${player.level || 1} badge`}
                            className="w-3 h-3"
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                            {player.username}
                          </span>

                          {/* Win Badges - moved under username */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">
                              <span className="text-xs">🏆</span>
                              <span className="font-medium">
                                {player.eventsWon || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                              <span className="text-xs">⚔️</span>
                              <span className="font-medium">
                                {player.challengesWon || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
                          {player.points}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          points
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-sm md:text-base text-amber-600 dark:text-amber-400">
                          {player.coins?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          coins
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />

      {/* Profile Card Modal */}
      {selectedProfileUserId && (
        <ProfileCard
          userId={selectedProfileUserId}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}
    </div>
  );
}
