
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { Users, Clock, Lock, Unlock, Crown, Trophy } from "lucide-react";
import { DynamicMetaTags } from "@/components/DynamicMetaTags";

export default function EventDetails() {
  const params = useParams();
  const eventId = params.id ? parseInt(params.id) : null;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const { data: event, isLoading } = useQuery({
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

  const { data: participants = [] } = useQuery({
    queryKey: ["/api/events", eventId, "participants"],
    enabled: !!eventId,
    retry: false,
  });

  const { data: joinRequests = [] } = useQuery({
    queryKey: ["/api/events", eventId, "join-requests"],
    enabled: !!eventId && event?.creatorId === user?.id,
    retry: false,
  });

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/events/${eventId}/join`, {
        prediction,
      });
    },
    onSuccess: () => {
      if (event?.isPrivate) {
        toast({
          title: "Join Request Sent",
          description: "Your request has been sent to the event creator for approval.",
        });
      } else {
        toast({
          title: "Event Joined!",
          description: `You've successfully joined the event with a ${prediction ? 'YES' : 'NO'} prediction.`,
        });
        // Navigate to chat for public events
        window.location.href = `/events/${eventId}/chat`;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      setIsJoinDialogOpen(false);
      setPrediction(null);
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

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await apiRequest("POST", `/api/events/join-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Request Approved",
        description: "The join request has been approved. User can now access the event chat.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "participants"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await apiRequest("POST", `/api/events/join-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Request Rejected",
        description: "The join request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "join-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  if (isLoading || !event) {
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
  const isCreator = user?.id === event.creatorId;
  const userParticipant = participants.find((p: any) => p.userId === user?.id);
  const hasJoined = !!userParticipant;
  const canAccessChat = !event.isPrivate || isCreator || hasJoined;

  const handleJoinEvent = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to join events",
        variant: "destructive",
      });
      return;
    }

    if (hasJoined) {
      // User already joined, navigate to chat
      window.location.href = `/events/${eventId}/chat`;
      return;
    }

    setIsJoinDialogOpen(true);
  };

  const handlePlaceJoinRequest = () => {
    if (prediction !== null) {
      joinEventMutation.mutate();
    }
  };

  return (
    <>
      {event && (
        <DynamicMetaTags
          pageType="event"
          event={event}
        />
      )}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/events'}
            className="flex items-center space-x-2"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Events</span>
          </Button>
          
          {canAccessChat && (
            <Button
              onClick={() => window.location.href = `/events/${eventId}/chat`}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <i className="fas fa-comments mr-2"></i>
              Join Chat
            </Button>
          )}
        </div>

        {/* Event Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  {event.isPrivate && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </Badge>
                  )}
                  {isCreator && (
                    <Badge variant="default" className="flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>Creator</span>
                    </Badge>
                  )}
                </div>
                
                <Badge variant="outline" className="capitalize mb-4">
                  {event.category}
                </Badge>
                
                {event.description && (
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Ends</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Participants</p>
                  <p className="font-medium">{participants.length}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Total Pool</p>
                  <p className="font-medium">₦{totalPool.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <i className="fas fa-coins text-slate-500"></i>
                <div>
                  <p className="text-sm text-slate-500">Entry Fee</p>
                  <p className="font-medium">{event.entryFee} coins</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Betting Options */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">YES</h3>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {yesPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      ₦{parseFloat(event.yesPool).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">NO</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {noPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ₦{parseFloat(event.noPool).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Button */}
            <div className="text-center">
              {!isAuthenticated ? (
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-primary text-white hover:bg-primary/90 px-8 py-2"
                >
                  Sign In to Join Event
                </Button>
              ) : hasJoined ? (
                <div className="space-y-2">
                  <Badge variant="default" className="text-base px-4 py-2">
                    <i className="fas fa-check mr-2"></i>
                    Joined Event
                  </Badge>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your prediction: <strong>{userParticipant.prediction ? 'YES' : 'NO'}</strong>
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleJoinEvent}
                  className="bg-primary text-white hover:bg-primary/90 px-8 py-2"
                >
                  {event.isPrivate ? 'Request to Join' : 'Join Event'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Join Requests (Creator only) */}
        {isCreator && event.isPrivate && joinRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Join Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {joinRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={request.user?.profileImageUrl} />
                        <AvatarFallback>
                          {request.user?.firstName?.[0] || request.user?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.user?.firstName || request.user?.username}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Prediction: <strong>{request.prediction ? 'YES' : 'NO'}</strong>
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => approveRequestMutation.mutate(request.id)}
                          disabled={approveRequestMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectRequestMutation.mutate(request.id)}
                          disabled={rejectRequestMutation.isPending}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {request.status !== 'pending' && (
                      <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                        {request.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join Request Dialog */}
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {event.isPrivate ? 'Request to Join Event' : 'Join Event'}
              </DialogTitle>
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
                    {event.entryFee} coins
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsJoinDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceJoinRequest}
                  disabled={prediction === null || joinEventMutation.isPending}
                  className="flex-1 bg-primary text-white hover:bg-primary/90"
                >
                  {joinEventMutation.isPending 
                    ? "Processing..." 
                    : event.isPrivate 
                      ? "Send Request" 
                      : "Join Event"
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </>
  );
}
