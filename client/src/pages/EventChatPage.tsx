import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import ProfileCard from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getEventChannel, getUserChannel } from "@/lib/pusher";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatBalance } from "@/utils/currencyUtils";
import { getAvatarUrl } from "@/utils/avatarUtils";
import { UserAvatar } from "@/components/UserAvatar";
import { TypingIndicator } from "@/components/TypingIndicator";
import PushNotificationTest from "@/components/PushNotificationTest";

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  userReacted: boolean;
}

interface ExtendedMessage {
  id: string;
  eventId: number;
  userId: string;
  message: string;
  createdAt: string;
  type?: 'system' | 'user';
  systemType?: 'user_join' | 'user_leave' | 'event_started' | 'event_ended';
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
    level?: number;
  };
  reactions?: MessageReaction[];
  replyTo?: {
    id: string;
    message: string;
    user: {
      firstName?: string;
      username?: string;
    };
  };
  mentions?: string[];
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function EventChatPage() {
  const params = useParams();
  const eventId = params.id ? parseInt(params.id) : null;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [isBettingDialogOpen, setIsBettingDialogOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{userId: string, name: string}[]>([]);
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [hasUserBet, setHasUserBet] = useState(false);
  const [userBetLocked, setUserBetLocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [isBannerHidden, setIsBannerHidden] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<ExtendedMessage[]>([]);

  const { data: event } = useQuery({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Safely parse end date for display (avoid Invalid Date runtime errors)
  const safeEndDate = event?.endDate ? new Date(event.endDate) : null;

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/events", eventId, "messages"],
    enabled: !!eventId,
    retry: false,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["/api/events", eventId, "participants"],
    enabled: !!eventId,
    retry: false,
  });

  const { data: telegramStatus } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: () => apiRequest('GET', '/api/telegram/status'),
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  });

  // Check if user has already bet
  useEffect(() => {
    if (participants.length > 0 && user) {
      const userParticipant = participants.find((p: any) => p.userId === user.id);
      if (userParticipant) {
        setHasUserBet(true);
        setUserBetLocked(true);
      }
    }
  }, [participants, user]);

  // Check private event access
  useEffect(() => {
    if (event && user && event.isPrivate) {
      // Check if user is the creator
      if (event.creatorId === user.id) {
        return; // Creator can always access
      }

      // Check if user is a participant (approved to join)
      const userParticipant = participants.find((p: any) => p.userId === user.id);
      if (!userParticipant) {
        // User is not approved for this private event, redirect back to event details
        toast({
          title: "Access Denied",
          description: "This is a private event. You need approval from the creator to join the chat.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = `/events/${eventId}`;
        }, 1500);
      }
    }
  }, [event, user, participants, eventId, toast]);

  // Pusher real-time messaging setup
  useEffect(() => {
    if (!eventId) return;

    const channel = getEventChannel(eventId);

    channel.bind('new-message', (data: any) => {
      refetchMessages();
    });

    channel.bind('reaction-update', (data: any) => {
      refetchMessages();
    });

    return () => {
      channel.unbind('new-message');
      channel.unbind('reaction-update');
    };
  }, [eventId, refetchMessages]);

  const { sendMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      console.log('WebSocket message received:', data);

      if (data.type === 'event_message' && data.eventId === eventId) {
        refetchMessages();
      } else if (data.type === 'user_typing' && data.eventId === eventId) {
        // Only process typing indicators from other users
        if (data.userId && data.userId !== user?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.userId !== data.userId);
            if (data.isTyping) {
              return [...filtered, { userId: data.userId, name: data.username || 'User' }];
            }
            return filtered;
          });

          // Auto-remove typing indicator after 5 seconds
          if (data.isTyping) {
            const timeoutId = setTimeout(() => {
              setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
            }, 5000);

            // Store timeout for cleanup
            return () => clearTimeout(timeoutId);
          }
        }
      } else if (data.type === 'message_reaction' && data.eventId === eventId) {
        refetchMessages();
      } else if (data.type === 'system_message' && data.eventId === eventId) {
        // Handle system messages (join/leave/event start/end)
        refetchMessages();
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; replyToId?: string; mentions?: string[] }) => {
      return await apiRequest("POST", `/api/events/${eventId}/messages`, messageData);
    },
    onSuccess: (data) => {
      setNewMessage("");
      setReplyingTo(null);

      // Immediately scroll to bottom after successful send
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);

      // Refetch messages to get the latest
      refetchMessages();

      // Send WebSocket notification
      if (sendMessage) {
        sendMessage({
          type: 'event_message',
          eventId,
          messageId: data?.id,
          userId: user?.id,
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reactToMessageMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      await apiRequest("POST", `/api/events/${eventId}/messages/${messageId}/react`, { emoji });
    },
    onMutate: async ({ messageId, emoji }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/events", eventId, "messages"] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(["/api/events", eventId, "messages"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/events", eventId, "messages"], (old: any) => {
        if (!old) return old;

        return old.map((message: any) => {
          if (message.id === messageId) {
            const reactions = message.reactions || [];
            const existingReaction = reactions.find((r: any) => r.emoji === emoji);

            if (existingReaction) {
              // Toggle existing reaction
              if (existingReaction.userReacted) {
                // Remove user's reaction
                return {
                  ...message,
                  reactions: existingReaction.count === 1 
                    ? reactions.filter((r: any) => r.emoji !== emoji)
                    : reactions.map((r: any) => r.emoji === emoji 
                        ? { ...r, count: r.count - 1, userReacted: false }
                        : r)
                };
              } else {
                // Add user's reaction
                return {
                  ...message,
                  reactions: reactions.map((r: any) => r.emoji === emoji 
                    ? { ...r, count: r.count + 1, userReacted: true }
                    : r)
                };
              }
            } else {
              // Add new reaction
              return {
                ...message,
                reactions: [...reactions, { emoji, count: 1, userReacted: true }]
              };
            }
          }
          return message;
        });
      });

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(["/api/events", eventId, "messages"], context?.previousMessages);
    },
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "messages"] });

      // Send WebSocket message for real-time updates
      sendMessage({
        type: 'message_reaction',
        eventId,
        userId: user?.id,
      });
    },
  });

  const leaveEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/events/${eventId}/leave`);
    },
    onSuccess: () => {
      toast({
        title: "Left Event",
        description: "You have successfully left this event.",
      });
      window.location.href = '/events';
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave event",
        variant: "destructive",
      });
    },
  });

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/events/${eventId}/join`, {
        prediction,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet Placed!",
        description: `You've bet ₦${parseFloat(event.entryFee).toLocaleString()} on ${prediction ? 'YES' : 'NO'}. Your funds are now locked until the event concludes.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      setIsBettingDialogOpen(false);
      setPrediction(null);
      setHasUserBet(true);
      setUserBetLocked(true);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // Scroll to bottom when component mounts and messages load
  useEffect(() => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "instant" });
      }
    }, 100);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  }, [messages]);

  // Send join notification when user enters the chat
  useEffect(() => {
    if (user && eventId && sendMessage && isConnected) {
      sendMessage({
        type: 'user_join',
        eventId,
        userId: user.id,
        username: user.firstName || user.username || 'User'
      });
    }

    // Send leave notification when user leaves
    return () => {
      if (user && eventId && sendMessage) {
        sendMessage({
          type: 'user_leave',
          eventId,
          userId: user.id,
          username: user.firstName || user.username || 'User'
        });
      }

      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, eventId, sendMessage, isConnected]);

  // Handle typing indicators
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only send typing if WebSocket is connected and user exists
    if (sendMessage && user?.id && isConnected) {
      try {
        sendMessage({
          type: 'user_typing',
          eventId,
          userId: user.id,
          username: user.firstName || user.username || 'User',
          isTyping: true,
        });

        typingTimeoutRef.current = setTimeout(() => {
          if (sendMessage && isConnected) {
            try {
              sendMessage({
                type: 'user_typing',
                eventId,
                userId: user.id,
                username: user.firstName || user.username || 'User',
                isTyping: false,
              });
            } catch (error) {
              console.error('Error sending typing stop message:', error);
            }
          }
        }, 3000);
      } catch (error) {
        console.error('Error sending typing message:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const previousValue = newMessage;
    setNewMessage(value);

    // Handle @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionQuery("");
    } else if (lastAtIndex !== -1) {
      const query = value.slice(lastAtIndex + 1);
      if (query.includes(' ')) {
        setShowMentions(false);
      } else {
        setMentionQuery(query);
        setShowMentions(true);
      }
    } else {
      setShowMentions(false);
    }

    // Only trigger typing indicator if user is actively typing (value is increasing)
    if (value.length > previousValue.length && value.trim() !== '') {
      handleTyping();
    }
  };

  const handleSendMessage = () => {
    console.log("handleSendMessage called with:", { newMessage, isPending: sendMessageMutation.isPending });
    if (!newMessage.trim()) {
      console.log("Message is empty, returning");
      return;
    }

    // Clear typing indicator when sending message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (sendMessage && user?.id && isConnected) {
      sendMessage({
        type: 'user_typing',
        eventId,
        userId: user.id,
        username: user.firstName || user.username || 'User',
        isTyping: false,
      });
    }

    // Extract mentions
    const mentions = extractMentions(newMessage);
    console.log("Sending message with mentions:", { message: newMessage, mentions });

    // Optimistically add message to UI for immediate feedback
    const tempMessage = {
      id: `temp-${Date.now()}`,
      eventId: eventId!,
      userId: user!.id,
      message: newMessage,
      createdAt: new Date().toISOString(),
      type: 'user' as const,
      user: {
        id: user!.id,
        firstName: user!.firstName,
        lastName: user!.lastName,
        username: user!.username,
        profileImageUrl: user!.profileImageUrl,
        level: user!.level,
      },
      reactions: [],
      mentions: mentions,
    };

    // Add temp message to show immediate response
    queryClient.setQueryData(["/api/events", eventId, "messages"], (old: any) => {
      if (!old) return [tempMessage];
      return [...old, tempMessage];
    });

    // Immediately scroll to bottom
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 10);

    sendMessageMutation.mutate({
      message: newMessage,
      replyToId: replyingTo?.id,
      mentions,
    });
    // Clear input and mention/reply state immediately after sending
    setNewMessage("");
    setShowMentions(false);
    setMentionQuery("");
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      setReplyingTo(null);
      setShowMentions(false);
    }
  };

  const handlePlaceBet = () => {
    if (hasUserBet || userBetLocked) {
      toast({
        title: "Already Bet",
        description: "You have already placed a bet on this event. Your funds are locked until the event concludes.",
        variant: "destructive",
      });
      return;
    }

    if (prediction !== null) {
      joinEventMutation.mutate();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    reactToMessageMutation.mutate({ messageId, emoji });
  };

  const handleReply = (message: ExtendedMessage) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleMention = (username: string) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeAt = newMessage.slice(0, lastAtIndex);
    const afterQuery = newMessage.slice(lastAtIndex + 1 + mentionQuery.length);
    setNewMessage(`${beforeAt}@${username} ${afterQuery}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = messages.filter((message: ExtendedMessage) =>
        message.message.toLowerCase().includes(query.toLowerCase()) ||
        (message.user?.firstName || "").toLowerCase().includes(query.toLowerCase()) ||
        (message.user?.username || "").toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleLeaveEvent = () => {
    if (hasUserBet) {
      toast({
        title: "Cannot Leave",
        description: "You cannot leave an event you have bet on until it concludes.",
        variant: "destructive",
      });
      return;
    }
    leaveEventMutation.mutate();
  };

  const handleReport = () => {
    toast({
      title: "Report Sent",
      description: "Thank you for your report. We will review this event.",
    });
  };

  const filteredParticipants = participants.filter((p: any) =>
    (p.user?.username || "").toLowerCase().includes(mentionQuery.toLowerCase()) ||
    (p.user?.firstName || "").toLowerCase().includes(mentionQuery.toLowerCase())
  );

  if (!eventId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Event Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The event you're looking for doesn't exist.
          </p>
          <Button onClick={() => window.location.href = '/events'}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading event...</p>
        </div>
      </div>
    );
  }

  const totalPool = parseFloat(event.yesPool) + parseFloat(event.noPool);
  const yesPercentage = totalPool > 0 ? (parseFloat(event.yesPool) / totalPool) * 100 : 50;
  const noPercentage = 100 - yesPercentage;

  const toggleBannerVisibility = () => {
    setIsBannerHidden(!isBannerHidden);
  };

  return (
    <>
      {/* Hide navigation bar on EventChatPage */}
      <style>{`
        nav { display: none !important; }
      `}</style>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:bg-slate-50 md:dark:bg-slate-900">
      {/* Header with Event Info and Back Button */}
      <div className="bg-[#7440ff] text-white sticky top-0 z-50 rounded-b-xl md:rounded-none">
        <div className="px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center space-x-2 md:space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/events'}
                  className="text-white hover:bg-white/20 p-2 rounded-full"
                >
                  <i className="fas fa-arrow-left text-sm"></i>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-users text-white text-xs md:text-sm"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">@{event.title}</h3>
                    <div className="flex items-center space-x-2 text-xs text-white/80">
                      <span>{participants.length} participants</span>
                      {/* Always show Telegram count, even if 0 or unavailable */}
                      <span>•</span>
                      <span className="flex items-center">
                        <i className="fab fa-telegram-plane mr-1"></i>
                        {(telegramStatus?.sync?.groupInfo?.participantsCount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/20">
                  <span className="sr-only">Open menu</span>
                  <i className="fas fa-ellipsis-v text-white"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border-0 rounded-2xl shadow-xl p-2">
                <DropdownMenuItem 
                  onClick={() => setShowSearch(!showSearch)}
                  className="rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <i className="fas fa-search text-blue-600 dark:text-blue-400 text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {showSearch ? 'Hide Search' : 'Search'}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={toggleBannerVisibility}
                  className="rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <i className={`fas ${isBannerHidden ? 'fa-eye' : 'fa-eye-slash'} text-green-600 dark:text-green-400 text-xs`}></i>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isBannerHidden ? 'Show Banner' : 'Hide Banner'}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleReport}
                  className="rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                      <i className="fas fa-flag text-yellow-600 dark:text-yellow-400 text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Report
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigator.share({ url: window.location.href })}
                  className="rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <i className="fas fa-share text-purple-600 dark:text-purple-400 text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Share
                    </span>
                  </div>
                </DropdownMenuItem>
                <div className="my-2 h-px bg-slate-200 dark:bg-slate-600"></div>
                <DropdownMenuItem 
                  onClick={handleLeaveEvent}
                  className="rounded-xl px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <i className="fas fa-sign-out-alt text-red-600 dark:text-red-400 text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Leave Event
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Betting Banner */}
          {!isBannerHidden && (
          <div className="bg-black/30 rounded-xl p-2 md:p-3 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-xs md:text-sm mb-1 truncate">{event.description || event.title}</h4>
                <div className="flex items-center space-x-3 md:space-x-4 text-xs">
                  <span className="flex items-center">
                    <i className="fas fa-clock mr-1"></i>
                    {safeEndDate && !isNaN(safeEndDate.getTime())
                      ? formatDistanceToNow(safeEndDate, { addSuffix: true })
                      : "Unknown"
                    }
                  </span>
                  <span>Pool ₦ {totalPool.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex space-x-1 md:space-x-2 ml-2 md:ml-3">
                {!isAuthenticated ? (
                  <div className="flex space-x-1 md:space-x-2">
                    <Button
                      size="sm"
                      className="bg-emerald-500/70 text-white px-4 py-2 rounded-full font-medium cursor-not-allowed"
                      disabled
                    >
                      YES
                      <div className="text-xs ml-1">{yesPercentage.toFixed(0)}%</div>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-500/70 text-white px-4 py-2 rounded-full font-medium cursor-not-allowed"
                      disabled
                    >
                      NO
                      <div className="text-xs ml-1">{noPercentage.toFixed(0)}%</div>
                    </Button>
                  </div>
                ) : hasUserBet || userBetLocked ? (
                  <div className="flex items-center space-x-2">
                    <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      <i className="fas fa-lock mr-1"></i>
                      Bet Locked
                    </div>
                    <div className="text-xs text-white/80">
                      Funds locked until event ends
                    </div>
                  </div>
                ) : (
                  <Dialog open={isBettingDialogOpen} onOpenChange={setIsBettingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full font-medium"
                        onClick={() => setPrediction(true)}
                      >
                        YES
                        <div className="text-xs ml-1">{yesPercentage.toFixed(0)}%</div>
                      </Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium"
                        onClick={() => setPrediction(false)}
                      >
                        NO
                        <div className="text-xs ml-1">{noPercentage.toFixed(0)}%</div>
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-800 px-2 md:px-3 py-2 md:py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              <i className="fas fa-comments text-2xl mb-2"></i>
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 md:space-y-2">
            {messages.map((message: ExtendedMessage, index: number) => {
            // ensure we have a safe user object to avoid runtime errors
            const msgUser = message.user ?? { id: message.userId, username: message.user?.username ?? 'unknown', firstName: '', level: 1 };
            // Check if this is a system message
            const isSystemMessage = message.type === 'system';

            if (isSystemMessage) {
              return (
                <div key={message.id} className="flex justify-center my-3">
                  <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-medium">
                    <i className="fas fa-info-circle mr-1"></i>
                    {message.message}
                  </div>
                </div>
              );
            }

            const showAvatar = index === messages.length - 1 || messages[index + 1]?.userId !== message.userId;
            const isCurrentUser = message.userId === user?.id;
            const isConsecutive = index < messages.length - 1 && messages[index + 1]?.userId === message.userId;

            return (
              <div key={message.id} className={`flex space-x-2 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''} ${isConsecutive ? 'mt-1' : 'mt-3'}`}>
                {!isCurrentUser && showAvatar && (
                    <div
                      className="flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all rounded-full"
                      onClick={() => msgUser.id && setSelectedProfileUserId(msgUser.id)}
                    >
                      <UserAvatar
                        userId={msgUser.id}
                        username={msgUser.username}
                        size={24}
                        className="w-6 h-6"
                      />
                    </div>
                  )}

                <div className={`flex-1 max-w-[75%] ${isCurrentUser ? 'text-right' : ''} ${!showAvatar && !isCurrentUser ? 'ml-8' : ''}`}>
                  {showAvatar && (
                    <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {msgUser.firstName || msgUser.username || 'Anonymous'}
                        </span>
                        {/* Verification badge */}
                        <div className="bg-blue-500 text-white px-1 py-0.5 rounded-full text-[8px] font-bold leading-none">
                          ✓
                        </div>
                        {/* Level badge */}
                        <img 
                          src={`/assets/${(msgUser.level || 1) >= 50 ? 'master' : (msgUser.level || 1) >= 30 ? 'expert' : (msgUser.level || 1) >= 20 ? 'advanced' : (msgUser.level || 1) >= 10 ? 'amateur' : 'Beginner'}.svg`} 
                          alt={`Level ${msgUser.level || 1}`} 
                          className="w-3 h-3" 
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className={`text-xs text-slate-500 dark:text-slate-400 mb-1 ${isCurrentUser ? 'text-right' : ''}`}>
                      <i className="fas fa-reply mr-1"></i>
                      Replying to {message.replyTo.user.firstName || message.replyTo.user.username}
                    </div>
                  )}

                  <div className="group relative">
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-full break-words relative ${
                      isCurrentUser 
                        ? 'bg-primary text-white' 
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    }`}>
                      {message.replyTo && (
                        <div className={`text-xs opacity-75 mb-1 p-2 rounded border-l-2 ${
                          isCurrentUser ? 'border-white/30 bg-white/10' : 'border-slate-300 bg-slate-50 dark:bg-slate-600'
                        }`}>
                          "{message.replyTo.message.length > 50 ? message.replyTo.message.substring(0, 50) + '...' : message.replyTo.message}"
                        </div>
                      )}
                      <p className="break-words">{message.message}</p>

                      {/* Message actions - positioned closer to bubble */}
                      <div className={`absolute top-1/2 -translate-y-1/2 ${isCurrentUser ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white dark:bg-slate-800 shadow-lg rounded-lg px-1 py-1 z-10 border`}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                              <i className="fas fa-smile text-[10px]"></i>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="flex space-x-1">
                              {COMMON_REACTIONS.map((emoji) => (
                                <Button
                                  key={emoji}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-lg hover:bg-slate-100"
                                  onClick={() => handleReaction(message.id, emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-5 w-5 p-0"
                          onClick={() => handleReply(message)}
                        >
                          <i className="fas fa-reply text-[10px]"></i>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      {message.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95 ${
                            reaction.userReacted 
                              ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                        >
                          <span className="text-xs leading-none">{reaction.emoji}</span>
                          <span className="text-xs leading-none font-semibold">{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

            {/* Typing Indicators */}
            <TypingIndicator 
              typingUsers={typingUsers.map(u => u.name)} 
              className="px-4 py-2"
            />

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-8"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(false)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 h-6 w-6"
              >
                <i className="fas fa-times text-xs"></i>
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {searchResults.slice(0, 5).map((message: ExtendedMessage) => (
                <div key={message.id} className="p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <UserAvatar
                      userId={message.user.id}
                      username={message.user.username}
                      size={16}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{message.user.firstName || message.user.username}</span>
                    <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{message.message}</p>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-2">No messages found</p>
          )}
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-slate-200 dark:bg-slate-700 px-4 py-2 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Replying to {replyingTo.user.firstName || replyingTo.user.username}
              </span>
              <p className="text-sm text-slate-800 dark:text-slate-200 truncate">
                {replyingTo.message}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
              <i className="fas fa-times text-xs"></i>
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 sticky bottom-0 rounded-t-2xl md:rounded-none mobile-nav-safe-area">
        {!isAuthenticated ? (
          /* Guest User Prompt */
          <div className="text-center py-4">
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-4 mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Join the conversation!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Sign up to participate in this event chat and place your bets
              </p>
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded-full font-medium"
              >
                Sign Up / Login
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Mentions dropdown */}
            {showMentions && filteredParticipants.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-xl shadow-lg max-h-40 overflow-y-auto z-10">
                {filteredParticipants.slice(0, 5).map((participant: any) => (
                  <div
                    key={participant.user.id}
                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center space-x-2"
                    onClick={() => handleMention(participant.user.username || participant.user.firstName)}
                  >
                    <UserAvatar
                      userId={participant.user.id}
                      username={participant.user.username}
                      size={20}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">{participant.user.firstName || participant.user.username}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10 p-2 rounded-full"
              >
                <i className="fas fa-smile text-base md:text-lg"></i>
              </Button>

              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  className="bg-slate-100 dark:bg-slate-700 border-none rounded-full pl-4 pr-4 py-2 text-sm"
                  disabled={false}
                />
                {!isConnected && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90 rounded-full p-2 active:scale-95">
                <i className="fas fa-paper-plane text-sm"></i>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Betting Dialog */}
      <Dialog open={isBettingDialogOpen} onOpenChange={setIsBettingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Prediction</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={prediction === true ? "default" : "outline"}
                  onClick={() => setPrediction(true)}
                  className={prediction === true ? "bg-emerald-600 text-white" : ""}
                >
                  YES ({yesPercentage.toFixed(1)}%)
                </Button>
                <Button
                  variant={prediction === false ? "default" : "outline"}
                  onClick={() => setPrediction(false)}
                  className={prediction === false ? "bg-red-600 text-white" : ""}
                >
                  NO ({noPercentage.toFixed(1)}%)
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Entry Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₦{parseFloat(event.entryFee).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  All participants bet the same amount
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsBettingDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceBet}
                disabled={prediction === null || joinEventMutation.isPending}
                className="flex-1 bg-primary text-white hover:bg-primary/90"
              >
                {joinEventMutation.isPending ? "Placing..." : `Place Bet (₦${parseFloat(event.entryFee).toLocaleString()})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Card Modal */}
      {selectedProfileUserId && (
        <ProfileCard 
          userId={selectedProfileUserId} 
          onClose={() => setSelectedProfileUserId(null)} 
        />
      )}
      </div>
    </>
  );
}