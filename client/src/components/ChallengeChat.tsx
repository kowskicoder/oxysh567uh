import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Upload, AlertCircle, Clock, Shield, MessageCircle, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pusher } from "@/lib/pusher";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Challenge {
  id: number;
  challenger: string;
  challenged: string;
  title: string;
  description: string;
  category: string;
  amount: string;
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  evidence: any;
  result: 'challenger_won' | 'challenged_won' | 'draw' | null;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
  challengerUser: {
    id: string;
    username: string;
    firstName: string;
    profileImageUrl: string;
  };
  challengedUser: {
    id: string;
    username: string;
    firstName: string;
    profileImageUrl: string;
  };
}

interface Message {
  id: number;
  challengeId: number;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    profileImageUrl: string;
  };
}

interface ChallengeChatProps {
  challenge: Challenge;
  onClose: () => void;
}

export function ChallengeChat({ challenge, onClose }: ChallengeChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const [realTimeMessages, setRealTimeMessages] = useState<Message[]>([]);
  
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/challenges", challenge.id, "messages"],
    onSuccess: (data) => {
      setRealTimeMessages(data);
    }
  });

  // WebSocket for real-time messaging and typing
  const { sendMessage: sendWebSocketMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'challenge_message' && data.challengeId === challenge.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/challenges", challenge.id, "messages"] });
      } else if (data.type === 'user_typing' && data.challengeId === challenge.id) {
        if (data.userId !== user?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(id => id !== data.userId);
            return data.isTyping ? [...filtered, data.userId] : filtered;
          });
        }
      }
    }
  });

  // Use real-time messages instead of polling
  const displayMessages = realTimeMessages.length > 0 ? realTimeMessages : messages;

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      return await apiRequest("POST", `/api/challenges/${challenge.id}/messages`, messageData);
    },
    onSuccess: () => {
      setMessage("");
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/challenges/${challenge.id}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Success",
        description: "Challenge accepted! Your funds have been escrowed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept challenge",
        variant: "destructive",
      });
    },
  });

  const disputeChallengeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/challenges/${challenge.id}`, { status: "disputed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Dispute Opened",
        description: "Admin has been notified. Challenge is now under review.",
      });
      setShowDispute(false);
    },
  });

  // Calculate time remaining
  useEffect(() => {
    if (challenge.dueDate) {
      const interval = setInterval(() => {
        const now = new Date();
        const dueDate = new Date(challenge.dueDate);
        const diff = dueDate.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft("Expired");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [challenge.dueDate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  // Set up Pusher for real-time challenge messages
  useEffect(() => {
    if (!user || !challenge.id) return;
    
    const channel = pusher.subscribe(`challenge-${challenge.id}`);
    
    channel.bind('new-message', (data: Message) => {
      setRealTimeMessages(prev => [...prev, data]);
      scrollToBottom();
    });

    return () => {
      pusher.unsubscribe(`challenge-${challenge.id}`);
    };
  }, [user, challenge.id]);

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendWebSocketMessage({
      type: 'user_typing',
      challengeId: challenge.id,
      userId: user?.id,
      isTyping: true,
    });

    typingTimeoutRef.current = setTimeout(() => {
      sendWebSocketMessage({
        type: 'user_typing',
        challengeId: challenge.id,
        userId: user?.id,
        isTyping: false,
      });
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ message });
    
    // Send WebSocket message for real-time updates
    sendWebSocketMessage({
      type: 'challenge_message',
      challengeId: challenge.id,
      message,
      userId: user?.id,
    });
  };

  const handleAcceptChallenge = () => {
    acceptChallengeMutation.mutate();
  };

  const handleDispute = () => {
    disputeChallengeMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'disputed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const isMyMessage = (msg: Message) => msg.userId === user?.id;
  const isParticipant = user?.id === challenge.challenger || user?.id === challenge.challenged;
  const isPending = challenge.status === 'pending';
  const isActive = challenge.status === 'active';
  const canAccept = isPending && user?.id === challenge.challenged;

  if (!isParticipant) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold mb-2">Private Challenge</h3>
          <p className="text-slate-600 dark:text-slate-400">
            This challenge is private and only accessible to participants.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white dark:bg-slate-900 rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {challenge.title}
              </h3>
            </div>
            <Badge className={`${getStatusColor(challenge.status)} text-white`}>
              {challenge.status.toUpperCase()}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Stake: <span className="font-semibold text-green-600">₦{parseFloat(challenge.amount).toLocaleString()}</span>
            </div>
            {challenge.dueDate && (
              <div className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{timeLeft}</span>
              </div>
            )}
          </div>

          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDispute(true)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Dispute
            </Button>
          )}
        </div>
      </div>

      {/* Accept Challenge Section */}
      {canAccept && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Challenge Received
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Accept this challenge to start the competition
              </p>
            </div>
            <Button
              onClick={handleAcceptChallenge}
              disabled={acceptChallengeMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {acceptChallengeMutation.isPending ? "Accepting..." : "Accept Challenge"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">No messages yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Start the conversation!
            </p>
          </div>
        ) : (
          displayMessages.filter(msg => msg && typeof msg === 'object' && msg.id).map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${isMyMessage(msg) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  isMyMessage(msg)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">
                    {msg.user?.firstName || msg.user?.username || 'Unknown User'}
                  </span>
                  <span className="text-xs opacity-70">
                    {msg.createdAt && !isNaN(new Date(msg.createdAt).getTime()) 
                      ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })
                      : 'Just now'
                    }
                  </span>
                </div>
                <p className="text-sm">{msg?.message || ''}</p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicators */}
        <TypingIndicator 
          typingUsers={typingUsers} 
          className="px-4 py-2"
        />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {isActive && (
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center space-x-2">
            <Input
              value={message}
              onChange={handleInputChange}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dispute Dialog */}
      <Dialog open={showDispute} onOpenChange={setShowDispute}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to open a dispute for this challenge? An admin will review the case and make a final decision.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDispute(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleDispute}
                disabled={disputeChallengeMutation.isPending}
                variant="destructive"
              >
                {disputeChallengeMutation.isPending ? "Opening..." : "Open Dispute"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}