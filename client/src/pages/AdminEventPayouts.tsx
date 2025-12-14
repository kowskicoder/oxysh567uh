
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Eye, 
  DollarSign, 
  Users, 
  Trophy, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AdminLayout from "@/components/AdminLayout";

interface Event {
  id: number;
  title: string;
  status: string;
  eventPool: string;
  yesPool: string;
  noPool: string;
  creatorFee: string;
  endDate: string;
  adminResult: boolean | null;
  creatorId: string;
}

interface PayoutDetails {
  winnersCount: number;
  totalPayout: number;
  creatorFee: number;
}

export default function AdminEventPayouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: selectedEventStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/events", selectedEventId, "stats"],
    enabled: !!selectedEventId,
    retry: false,
  });

  const setResultMutation = useMutation({
    mutationFn: async ({ eventId, result }: { eventId: number; result: boolean }) => {
      return apiRequest(`/api/admin/events/${eventId}/result`, {
        method: 'POST',
        body: { result },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Event Resolved ✅",
        description: data.message,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setSelectedEventId(null); // Clear selection after successful payout
    },
    onError: (error: Error) => {
      toast({
        title: "Payout Failed ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSetResult = (eventId: number, result: boolean) => {
    const event = events.find((e: Event) => e.id === eventId);
    if (!event) return;

    const resultText = result ? 'YES' : 'NO';
    const totalPool = parseFloat(event.eventPool);
    const creatorFee = totalPool * 0.03;
    const payoutPool = totalPool - creatorFee;
    
    const confirmMessage = `Set event result to ${resultText}?\n\nPayout Details:\n- Total Pool: ₦${totalPool.toLocaleString()}\n- Creator Fee (3%): ₦${creatorFee.toLocaleString()}\n- Winner Payout: ₦${payoutPool.toLocaleString()}\n\nThis will trigger automatic payouts to all winners.`;
    
    if (confirm(confirmMessage)) {
      setResultMutation.mutate({ eventId, result });
    }
  };

  const getStatusColor = (status: string, adminResult: boolean | null) => {
    if (status === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (status === 'pending_admin') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (status === 'active') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const needsAdminAction = (event: Event) => {
    const endDate = new Date(event.endDate);
    const now = new Date();
    return endDate <= now && event.status === 'active' && event.adminResult === null;
  };

  const filteredEvents = events.filter((event: Event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingEvents = filteredEvents.filter((e: Event) => needsAdminAction(e));
  const completedEvents = filteredEvents.filter((e: Event) => e.status === 'completed');
  const activeEvents = filteredEvents.filter((e: Event) => e.status === 'active' && !needsAdminAction(e));

  const totalPools = events.reduce((sum: number, e: Event) => sum + parseFloat(e.eventPool || '0'), 0);
  const totalCreatorFees = events.reduce((sum: number, e: Event) => sum + parseFloat(e.creatorFee || '0'), 0);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Event Payouts</h1>
            <p className="text-slate-400">Manage event results and fund distribution</p>
          </div>
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-slate-800 border-slate-700"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending Actions</p>
                  <p className="text-2xl font-bold text-yellow-400">{pendingEvents.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Pool Value</p>
                  <p className="text-2xl font-bold text-green-400">₦{totalPools.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Creator Fees</p>
                  <p className="text-2xl font-bold text-blue-400">₦{totalCreatorFees.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Completed Events</p>
                  <p className="text-2xl font-bold text-emerald-400">{completedEvents.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions */}
        {pendingEvents.length > 0 && (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
                Events Requiring Admin Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingEvents.map((event: Event) => (
                  <div key={event.id} className="bg-slate-800 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <p className="text-slate-400 text-sm">
                          Ended {formatDistanceToNow(new Date(event.endDate), { addSuffix: true })}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm text-slate-300">
                            Pool: ₦{parseFloat(event.eventPool).toLocaleString()}
                          </span>
                          <span className="text-sm text-green-400">
                            YES: ₦{parseFloat(event.yesPool).toLocaleString()}
                          </span>
                          <span className="text-sm text-red-400">
                            NO: ₦{parseFloat(event.noPool).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSetResult(event.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={setResultMutation.isPending}
                        >
                          Set YES
                        </Button>
                        <Button
                          onClick={() => handleSetResult(event.id, false)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={setResultMutation.isPending}
                        >
                          Set NO
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedEventId(event.id)}
                          className="border-slate-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Events */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">All Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 text-slate-400">Event</th>
                    <th className="text-left p-3 text-slate-400">Status</th>
                    <th className="text-left p-3 text-slate-400">Pool</th>
                    <th className="text-left p-3 text-slate-400">Result</th>
                    <th className="text-left p-3 text-slate-400">End Date</th>
                    <th className="text-left p-3 text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event: Event) => (
                    <tr key={event.id} className="border-b border-slate-800 hover:bg-slate-800">
                      <td className="p-3">
                        <div className="font-medium text-white">{event.title}</div>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(event.status, event.adminResult)}>
                          {event.status === 'pending_admin' ? 'Pending Admin' : event.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-300">
                        ₦{parseFloat(event.eventPool).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {event.adminResult === null ? (
                          <span className="text-slate-500">-</span>
                        ) : (
                          <Badge className={event.adminResult ? 'bg-green-600' : 'bg-red-600'}>
                            {event.adminResult ? 'YES' : 'NO'}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(event.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {needsAdminAction(event) && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSetResult(event.id, true)}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                YES
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSetResult(event.id, false)}
                                className="bg-red-600 hover:bg-red-700 text-xs"
                              >
                                NO
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEventId(event.id)}
                            className="border-slate-600 text-xs"
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Event Details Modal */}
        {selectedEventId && selectedEventStats && (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Event Pool Details
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEventId(null)}
                  className="border-slate-600"
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Total Pool</div>
                    <div className="text-xl font-bold text-white">
                      ₦{selectedEventStats.totalPool.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">YES Pool</div>
                    <div className="text-xl font-bold text-green-400">
                      ₦{selectedEventStats.yesPool.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">NO Pool</div>
                    <div className="text-xl font-bold text-red-400">
                      ₦{selectedEventStats.noPool.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Participants</div>
                    <div className="text-xl font-bold text-blue-400">
                      {selectedEventStats.participantsCount}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
