import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatBalance } from "../utils/currencyUtils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop";

interface Creator {
  id: string;
  name: string;
  avatar_url: string;
  avatar?: string;
  username?: string;
  stats: any;
}

interface Event {
  id: string;
  title: string;
  imageUrl?: string;
  bannerUrl?: string;  // Alternative field name
  image_url?: string;  // Legacy field name
  status?: string;
  start_time: string;
  end_time: string;
  is_private?: boolean;
  creator: Creator;
  pool?: {
    total_amount?: number;
    entry_amount?: number;
  };
  participants?: Array<{ avatar?: string }>;
  current_participants?: number;
  display_participant_boost?: number;
  max_participants: number;
  category: string;
}

interface EventCardProps {
  event: Event;
  onChatClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onChatClick }) => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Track user interactions for recommendation learning
  const trackInteractionMutation = useMutation({
    mutationFn: async (interactionData: {
      eventId: number;
      interactionType: string;
      timeSpent?: number;
      deviceType?: string;
      referralSource?: string;
    }) => {
      await apiRequest("POST", "/api/recommendations/track", interactionData);
    },
    onError: (error: Error) => {
      console.error("Failed to track interaction:", error);
    },
  });

  const trackInteraction = (
    interactionType: "view" | "like" | "share" | "join" | "skip",
    timeSpent?: number,
  ) => {
    if (user) {
      trackInteractionMutation.mutate({
        eventId: parseInt(event.id),
        interactionType,
        timeSpent,
        deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
        referralSource: "event_card",
      });
    }
  };

  // Track view when event card is displayed
  useEffect(() => {
    if (user && event.id) {
      const timer = setTimeout(() => {
        trackInteraction("view", 2);
      }, 2000); // Track after 2 seconds of viewing

      return () => clearTimeout(timer);
    }
  }, [user, event.id]);

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (event.status === "CANCELLED") {
      return {
        label: "",
        bg: "bg-red-500",
        dot: "bg-red",
        text: "text-white",
        animate: false,
      };
    }

    if (now < startTime) {
      return {
        label: "",
        bg: "bg-[#CCFF00]",
        dot: "bg-[#CCFF00]",
        text: "text-white",
        animate: true,
      };
    }

    if (now >= startTime && now <= endTime) {
      return {
        label: "",
        bg: "bg-[#CCFF00]",
        dot: "bg-red-500",
        text: "text-black",
        animate: true,
      };
    }

    return {
      label: "ENDED",
      bg: "bg-gray-500",
      dot: "bg-red-500",
      text: "text-white",
      animate: false,
    };
  };

  const handleJoinClick = () => {
    if (!user) {
      setLocation("/signin");
      return;
    }

    if (event.is_private) {
      setShowJoinModal(true);
    } else {
      handleChatClick();
    }
  };

  const handleChatClick = () => {
    if (user) {
      setLocation(`/events/${event.id}/chat`);
    } else {
      setLocation("/signin");
    }
  };

  const formatCurrency = (
    amount: number,
    symbol: string = "₦",
    compact: boolean = false,
  ) => {
    return formatBalance(amount);
  };

  return (
    <>
      <div className="bg-black rounded-3xl overflow-hidden relative">
        <div className="relative w-full aspect-video">
          <img
            src={event.imageUrl || event.bannerUrl || event.image_url || DEFAULT_BANNER}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_BANNER;
            }}
          />

          {/* Single header row with creator info, title, and status */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-2 pb-1.5">
            <div className="px-3 grid grid-cols-[auto_1fr_auto] items-center w-full gap-2">
              {/* Creator info - Left side */}
              <div className="flex items-center flex-shrink-0">
                <div className="overflow-hidden rounded-full h-5 w-5 flex-shrink-0">
                  <img
                    src={
                      event.creator.avatar_url ||
                      event.creator.avatar ||
                      `https://api.dicebear.com/7.x/notionists/svg?seed=${event.creator.username || event.creator.id || "user"}`
                    }
                    alt={event.creator.username || event.creator.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white/90 text-xs ml-1.5">
                  {event.creator.username || event.creator.name}
                </span>
              </div>

              {/* Centered title */}
              <h2 className="text-white text-lg font-bold leading-tight text-center mx-auto truncate px-2">
                {event.title}
              </h2>

              {/* Status icon - Right side */}
              <div className="flex-shrink-0">
                {event.status !== "HIDDEN" && (
                  <div
                    className={`${getEventStatus().bg} w-2.5 h-2.5 rounded-full shadow-sm relative`}
                  >
                    {getEventStatus().animate && (
                      <div
                        className={`absolute inset-0 ${getEventStatus().dot} rounded-full animate-ping opacity-75`}
                      />
                    )}
                    <div
                      className={`absolute inset-0 ${getEventStatus().dot} rounded-full`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with adjusted padding and alignment */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          {/* Event Pool section */}
          <div className="flex flex-col justify-end">
            <span className="text-white text-sm font-bold">Event Pool</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-white rounded-2xl px-2 py-1">
                <span className="text-black font-bold text-sm">
                  {formatCurrency(event.pool?.total_amount || 0, "₦", true)}
                </span>
              </div>
              {/* Participation Avatar + Count */}
              <div className="flex items-center ml-[1rem]">
                <div className="relative">
                  <div className="overflow-hidden rounded-full h-5 w-5 flex items-center justify-center">
                    <img
                      src={
                        event.participants?.[0]?.avatar ||
                        `https://api.dicebear.com/7.x/notionists/svg?seed=participant-${event.id}`
                      }
                      alt="Participant"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="bg-white rounded-full min-w-[1.5rem] h-5 flex items-center justify-center text-black font-bold text-xs ml-[-0.2rem] pl-1 pr-1">
                  {(event.participants?.length ||
                    event.current_participants ||
                    0) + (event.display_participant_boost || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Share and Join Buttons */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button
              type="button"
              onClick={() => {
                const shareUrl = `${window.location.origin}/events/${event.id}`;
                if (navigator.share) {
                  navigator.share({
                    title: event.title,
                    text: `Check out this event: ${event.title}`,
                    url: shareUrl,
                  });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  // You might want to show a toast notification here
                }
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm h-10 w-10 flex items-center justify-center rounded-full transition-colors"
            >
              <Share2 className="h-4 w-4 text-white" />
            </button>

            {/* Join Button */}
            <button
              type="button"
              onClick={handleJoinClick}
              disabled={["CANCELLED", "ENDED"].includes(
                event.status || getEventStatus().label,
              )}
              className={`${
                ["CANCELLED", "ENDED"].includes(
                  event.status || getEventStatus().label,
                )
                  ? "bg-gray-500 cursor-not-allowed text-white"
                  : requestSent
                    ? "bg-[#CCFF00] text-black hover:bg-[#CCFF00]"
                    : "btn-primary bg-[#ccff00] text-black hover:bg-[#ccff00]"
              } h-10 flex items-center justify-center gap-1 px-4 rounded-2xl`}
            >
              {event.is_private && !requestSent && <Lock className="h-4 w-4" />}
              {["CANCELLED", "ENDED"].includes(
                event.status || getEventStatus().label,
              )
                ? "Closed"
                : requestSent
                  ? "Request Sent"
                  : event.is_private
                    ? "Request"
                    : "Join"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export { EventCard };
