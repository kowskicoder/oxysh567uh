import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Event {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  creatorId: string;
  eventPool: string;
  yesPool: string;
  noPool: string;
  entryFee: string;
  endDate: string;
  result?: boolean;
  adminResult?: boolean;
  creatorFee: string;
  isPrivate: boolean;
  maxParticipants: number;
  createdAt: string;
}

interface EventStats {
  totalPool: number;
  yesPool: number;
  noPool: number;
  participantsCount: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: eventStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/events", selectedEvent?.id, "stats"],
    enabled: !!selectedEvent,
    retry: false,
  });

  const setEventResultMutation = useMutation({
    mutationFn: async ({ eventId, result }: { eventId: number; result: boolean }) => {
      return apiRequest(`/api/admin/events/${eventId}/result`, {
        method: "POST",
        body: { result },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Event Result Set",
        description: data.message,
      });
      setShowResultDialog(false);
      setSelectedEvent(null);
      refetchEvents();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSetResult = (result: boolean) => {
    if (selectedEvent) {
      setEventResultMutation.mutate({ eventId: selectedEvent.id, result });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const needsAdminAction = (event: Event) => {
    const endDate = new Date(event.endDate);
    const now = new Date();
    return endDate <= now && event.status === 'active' && event.adminResult === null;
  };

  const activeEvents = events.filter((e: Event) => e.status === 'active');
  const completedEvents = events.filter((e: Event) => e.status === 'completed');
  const eventsNeedingAction = events.filter((e: Event) => needsAdminAction(e));

  const totalEventPool = events.reduce((sum: number, e: Event) => sum + parseFloat(e.eventPool || '0'), 0);
  const totalCreatorFees = events.reduce((sum: number, e: Event) => sum + parseFloat(e.creatorFee || '0'), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            You need to be logged in to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Admin Dashboard 🛠️
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage events, set results, and process payouts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{events.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeEvents.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Needs Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{eventsNeedingAction.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">₦{totalEventPool.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Events Needing Action */}
        {eventsNeedingAction.length > 0 && (
          <Card className="mb-8 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Events Requiring Admin Action ({eventsNeedingAction.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventsNeedingAction.map((event: Event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Pool: ₦{parseFloat(event.eventPool).toLocaleString()} • 
                        Ended: {formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowResultDialog(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Set Result
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Events */}
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event: Event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        {event.isPrivate && (
                          <Badge variant="outline">Private</Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <span>Category: {event.category}</span> • 
                        <span>Pool: ₦{parseFloat(event.eventPool).toLocaleString()}</span> • 
                        <span>Fee: ₦{parseFloat(event.entryFee).toLocaleString()}</span> • 
                        <span>Max: {event.maxParticipants} participants</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {event.status === 'completed' ? (
                          <span>Result: {event.result ? 'YES' : 'NO'} • Creator fee: ₦{parseFloat(event.creatorFee || '0').toLocaleString()}</span>
                        ) : (
                          <span>Ends: {formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEvent(event)}
                      >
                        View Details
                      </Button>
                      {needsAdminAction(event) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowResultDialog(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Set Result
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent && !showResultDialog} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Category</p>
                  <p className="font-medium">{selectedEvent.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                  <Badge className={getStatusColor(selectedEvent.status)}>
                    {selectedEvent.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Entry Fee</p>
                  <p className="font-medium">₦{parseFloat(selectedEvent.entryFee).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Max Participants</p>
                  <p className="font-medium">{selectedEvent.maxParticipants}</p>
                </div>
              </div>

              {eventStats && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Pool Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Pool</p>
                      <p className="font-medium">₦{eventStats.totalPool.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">YES Pool</p>
                      <p className="font-medium">₦{eventStats.yesPool.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">NO Pool</p>
                      <p className="font-medium">₦{eventStats.noPool.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Participants</p>
                    <p className="font-medium">{eventStats.participantsCount}</p>
                  </div>
                </div>
              )}

              {needsAdminAction(selectedEvent) && (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => setShowResultDialog(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Set Event Result
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Set Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Event Result</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEvent.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total Pool: ₦{parseFloat(selectedEvent.eventPool).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Creator Fee (3%): ₦{(parseFloat(selectedEvent.eventPool) * 0.03).toLocaleString()}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose the winning outcome. This will trigger the payout system:
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleSetResult(true)}
                    disabled={setEventResultMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {setEventResultMutation.isPending ? "Processing..." : "YES Wins"}
                  </Button>
                  <Button
                    onClick={() => handleSetResult(false)}
                    disabled={setEventResultMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {setEventResultMutation.isPending ? "Processing..." : "NO Wins"}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Event status will be set to completed</li>
                  <li>Winners will receive their share of the pool</li>
                  <li>Creator will receive 3% fee (₦{(parseFloat(selectedEvent.eventPool) * 0.03).toLocaleString()})</li>
                  <li>All participants will be notified</li>
                  <li>Transaction records will be created</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}