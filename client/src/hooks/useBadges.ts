import { useQuery } from "@tanstack/react-query";

interface BadgeCounts {
  profile: number;
  events: number;
  challenges: number;
}

export function useBadges() {
  const { data: badges = { profile: 0, events: 0, challenges: 0 } } = useQuery<BadgeCounts>({
    queryKey: ["/api/navigation/badges"],
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    retry: 1,
  });

  return {
    profileBadgeCount: badges.profile,
    eventsBadgeCount: badges.events,
    challengesBadgeCount: badges.challenges,
    hasProfileBadge: badges.profile > 0,
    hasEventsBadge: badges.events > 0,
    hasChallengesBadge: badges.challenges > 0,
  };
}