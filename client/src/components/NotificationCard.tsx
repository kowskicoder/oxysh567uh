import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  Flame, 
  Crown,
  Gift,
  ChevronRight,
  User,
  Swords,
  Calendar,
  Coins,
  Plus
} from "lucide-react";

interface NotificationCardProps {
  notification: any;
  onMarkAsRead?: (id: number) => void;
}

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const { handleNotificationAction } = useNotifications();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal states
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Challenge form states
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeType, setChallengeType] = useState("prediction");
  const [challengeAmount, setChallengeAmount] = useState("");
  
  // Event form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState("sports");
  const [eventEndDate, setEventEndDate] = useState("");

  // Challenge mutation
  const challengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      return await apiRequest("POST", "/api/challenges", challengeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setShowChallengeModal(false);
      setChallengeTitle("");
      setChallengeDescription("");
      setChallengeAmount("");
      toast({
        title: "Challenge Sent!",
        description: "Your challenge has been sent successfully.",
      });
      if (onMarkAsRead) onMarkAsRead(notification.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send challenge",
        variant: "destructive",
      });
    },
  });

  // Event creation mutation
  const eventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return await apiRequest("POST", "/api/events", eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setShowEventModal(false);
      setEventTitle("");
      setEventDescription("");
      setEventEndDate("");
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      if (onMarkAsRead) onMarkAsRead(notification.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  // Handle challenge form submission
  const handleChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeTitle || !challengeAmount) return;

    const targetUserId = notification.data?.targetUserId || notification.data?.userId;
    
    challengeMutation.mutate({
      challenged: targetUserId,
      title: challengeTitle,
      description: challengeDescription,
      category: challengeType,
      amount: challengeAmount,
    });
  };

  // Handle event form submission
  const handleEventCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDescription) return;

    eventMutation.mutate({
      title: eventTitle,
      description: eventDescription,
      category: eventCategory,
      endDate: eventEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days
      entryFee: 100, // Default entry fee
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_follower':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'leaderboard_leader':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'winner_challenge':
        return <Crown className="w-5 h-5 text-purple-500" />;
      case 'loser_encourage':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'event_joiner':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'streak_performer':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'coin_earner':
        return <Coins className="w-5 h-5 text-green-500" />;
      case 'successful_event_creator':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      default:
        return <Gift className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_follower':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'leaderboard_leader':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'winner_challenge':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'loser_encourage':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'event_joiner':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'streak_performer':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'coin_earner':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'successful_event_creator':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'border-l-primary bg-primary/5';
    }
  };

  const handleActionClick = async (action: string) => {
    try {
      // Handle view profile action for new follower notifications
      if (action === 'view_profile' && notification.type === 'new_follower') {
        // Get the username from notification data or fetch it
        const followerName = notification.data?.followerName;
        const followerId = notification.data?.followerId;
        
        if (followerName) {
          navigate(`/@${followerName}`);
        } else if (followerId) {
          // If we don't have username, navigate using user ID
          navigate(`/u/${followerId}`);
        } else {
          // Last resort fallback
          navigate('/friends');
        }
        
        // Mark as read
        if (onMarkAsRead) {
          onMarkAsRead(notification.id);
        }
        return;
      }

      const response = await handleNotificationAction({
        notificationId: notification.id,
        action,
        targetUserId: notification.data?.targetUserId,
        eventId: notification.data?.eventId,
      });

      // Handle different action responses
      if (response?.action === 'open_challenge_dialog' || response?.action === 'navigate_to_challenges') {
        navigate('/challenges');
      } else if (response?.action === 'navigate_to_event') {
        navigate(`/events/${response.eventId}`);
      }

      // Mark as read
      if (onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  const getActionButton = (notificationType: string, data: any) => {
    switch (notificationType) {
      case 'new_follower':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
            onClick={() => handleActionClick('view_profile')}
          >
            <User className="w-4 h-4 mr-1" />
            View Profile
          </Button>
        );
      case 'leaderboard_leader':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => handleActionClick('challenge_user')}
          >
            <Target className="w-4 h-4 mr-1" />
            Challenge
          </Button>
        );
      case 'winner_challenge':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-purple-50 hover:bg-purple-100 border-purple-200"
            onClick={() => handleActionClick('create_challenges')}
          >
            <Crown className="w-4 h-4 mr-1" />
            Create Challenges
          </Button>
        );
      case 'loser_encourage':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
            onClick={() => handleActionClick('challenge_user')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Get Redemption
          </Button>
        );
      case 'event_joiner':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-green-50 hover:bg-green-100 border-green-200"
            onClick={() => handleActionClick('join_event')}
          >
            <Users className="w-4 h-4 mr-1" />
            Join Event
          </Button>
        );
      case 'streak_performer':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-orange-50 hover:bg-orange-100 border-orange-200"
            onClick={() => handleActionClick('challenge_user')}
          >
            <Flame className="w-4 h-4 mr-1" />
            Challenge
          </Button>
        );
      case 'coin_earner':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-green-50 hover:bg-green-100 border-green-200"
            onClick={() => setShowChallengeModal(true)}
          >
            <Swords className="w-4 h-4 mr-1" />
            Challenge
          </Button>
        );
      case 'successful_event_creator':
        return (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto bg-purple-50 hover:bg-purple-100 border-purple-200"
            onClick={() => setShowEventModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Event
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => handleActionClick('view')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        );
    }
  };

  const formatNotificationText = (message: string) => {
    // Replace @username with styled badges
    return message.replace(/@(\w+)/g, (match, username) => {
      return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">@${username}</span>`;
    });
  };

  return (
    <>
      <Card className={`border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {notification.title}
                </h4>
                {!notification.read && (
                  <Badge variant="secondary" className="ml-2 h-2 w-2 p-0 bg-primary rounded-full" />
                )}
              </div>
              
              <p 
                className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: formatNotificationText(notification.message) 
                }}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                
                {getActionButton(notification.type, notification.data)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Modal */}
      <Dialog open={showChallengeModal} onOpenChange={setShowChallengeModal}>
        <DialogContent className="sm:max-w-sm max-w-[90vw] max-h-[80vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-center">
              Challenge {notification.data?.targetName || notification.data?.username || 'User'}
            </DialogTitle>
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Swords className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleChallenge} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="challengeTitle" className="text-sm font-medium">Challenge Title</Label>
              <Input
                id="challengeTitle"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="Enter challenge title"
                className="h-9 text-sm rounded-xl px-3 py-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challengeDescription" className="text-sm font-medium">Description</Label>
              <Textarea
                id="challengeDescription"
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder="Describe the challenge..."
                className="rounded-xl px-4 py-3 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="challengeType" className="text-xs font-medium">Type</Label>
                <Select value={challengeType} onValueChange={setChallengeType}>
                  <SelectTrigger className="h-8 rounded-xl px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg">
                    <SelectItem value="prediction">Prediction</SelectItem>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="trivia">Trivia</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="challengeAmount" className="text-xs font-medium">Stake (₦)</Label>
                <Input
                  id="challengeAmount"
                  type="number"
                  value={challengeAmount}
                  onChange={(e) => setChallengeAmount(e.target.value)}
                  placeholder="500"
                  className="h-8 rounded-xl px-3 text-sm"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowChallengeModal(false)}
                className="flex-1 h-8 px-3 text-sm rounded-xl border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={challengeMutation.isPending || !challengeTitle || !challengeAmount}
                className="flex-1 h-8 px-3 text-sm rounded-xl shadow-lg"
                style={{ backgroundColor: "#ccff00", color: "black" }}
              >
                {challengeMutation.isPending ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Swords className="w-3 h-3 mr-1" />
                    Send Challenge
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Creation Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-center">
              Create New Event
            </DialogTitle>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleEventCreation} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="eventTitle" className="text-sm font-medium">Event Title</Label>
              <Input
                id="eventTitle"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Enter event title"
                className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDescription" className="text-sm font-medium">Description</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Describe the event..."
                className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 resize-none"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventCategory" className="text-sm font-medium">Category</Label>
              <Select value={eventCategory} onValueChange={setEventCategory}>
                <SelectTrigger className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-0 shadow-lg">
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventEndDate" className="text-sm font-medium">End Date (Optional)</Label>
              <Input
                id="eventEndDate"
                type="datetime-local"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="border-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEventModal(false)}
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={eventMutation.isPending || !eventTitle || !eventDescription}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg"
              >
                {eventMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
}