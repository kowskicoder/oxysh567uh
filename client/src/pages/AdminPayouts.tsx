
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import AdminLayout from "@/components/AdminLayout";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Trophy,
  Target,
  Users,
  Eye,
  Clock,
  Trash2,
  MessageSquareOff,
  MessageSquare,
  XCircle
} from 'lucide-react';

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
  createdAt: string;
  chatEnabled?: boolean;
}

interface Challenge {
  id: number;
  challenger: string;
  challenged: string;
  title: string;
  description: string;
  category: string;
  amount: string;
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  result: 'challenger_won' | 'challenged_won' | 'draw' | null;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
  challengerUser: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  challengedUser: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export default function AdminPayouts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('events');

  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: challenges = [], isLoading: challengesLoading, refetch: refetchChallenges } = useQuery({
    queryKey: ["/api/admin/challenges"],
    retry: false,
  });

  // Mutations for event actions
  const setEventResultMutation = useMutation({
    mutationFn: async ({ eventId, result }: { eventId: number; result: boolean }) => {
      return apiRequest(`/api/admin/events/${eventId}/result`, {
        method: 'POST',
        body: { result },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Event Result Set ✅",
        description: data.message,
      });
      refetchEvents();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Set Result ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted ✅",
        description: "Event has been successfully deleted",
      });
      refetchEvents();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Event ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleEventChatMutation = useMutation({
    mutationFn: async ({ eventId, enabled }: { eventId: number; enabled: boolean }) => {
      return apiRequest(`/api/admin/events/${eventId}/chat`, {
        method: 'PATCH',
        body: { enabled },
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.enabled ? "Chat Enabled ✅" : "Chat Disabled ❌",
        description: data.message,
      });
      refetchEvents();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Toggle Chat ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutations for challenge actions
  const setChallengeResultMutation = useMutation({
    mutationFn: async ({ challengeId, result }: { challengeId: number; result: string }) => {
      return apiRequest(`/api/admin/challenges/${challengeId}/result`, {
        method: 'POST',
        body: { result },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Challenge Result Set ✅",
        description: data.message,
      });
      refetchChallenges();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Set Result ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      return apiRequest(`/api/admin/challenges/${challengeId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Challenge Deleted ✅",
        description: "Challenge has been successfully deleted",
      });
      refetchChallenges();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Challenge ❌",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const needsEventAction = (event: Event) => {
    const endDate = new Date(event.endDate);
    const now = new Date();
    return endDate <= now && event.status === 'active' && event.adminResult === null;
  };

  const needsChallengeAction = (challenge: Challenge) => {
    return challenge.status === 'active' && challenge.dueDate && 
           new Date(challenge.dueDate) <= new Date() && !challenge.result;
  };

  const getStatusColor = (status: string, result: any = null) => {
    if (status === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (status === 'disputed') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    if (status === 'active') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const handleEventAction = (eventId: number, action: string) => {
    const event = events.find((e: Event) => e.id === eventId);
    if (!event) return;

    switch (action) {
      case 'set_yes':
        setEventResultMutation.mutate({ eventId, result: true });
        break;
      case 'set_no':
        setEventResultMutation.mutate({ eventId, result: false });
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
          deleteEventMutation.mutate(eventId);
        }
        break;
      case 'toggle_chat':
        toggleEventChatMutation.mutate({ eventId, enabled: !event.chatEnabled });
        break;
    }
  };

  const handleChallengeAction = (challengeId: number, action: string) => {
    const challenge = challenges.find((c: Challenge) => c.id === challengeId);
    if (!challenge) return;

    switch (action) {
      case 'challenger_won':
        setChallengeResultMutation.mutate({ challengeId, result: 'challenger_won' });
        break;
      case 'challenged_won':
        setChallengeResultMutation.mutate({ challengeId, result: 'challenged_won' });
        break;
      case 'draw':
        setChallengeResultMutation.mutate({ challengeId, result: 'draw' });
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
          deleteChallengeMutation.mutate(challengeId);
        }
        break;
    }
  };

  // Filter data based on search
  const filteredEvents = events.filter((event: Event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChallenges = challenges.filter((challenge: Challenge) =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.challengerUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.challengedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate metrics
  const eventsNeedingAction = filteredEvents.filter(needsEventAction);
  const challengesNeedingAction = filteredChallenges.filter(needsChallengeAction);
  const completedEvents = filteredEvents.filter((e: Event) => e.status === 'completed');
  const completedChallenges = filteredChallenges.filter((c: Challenge) => c.status === 'completed');

  const totalEventPool = events.reduce((sum: number, e: Event) => sum + parseFloat(e.eventPool || '0'), 0);
  const totalChallengeStaked = challenges.reduce((sum: number, c: Challenge) => sum + (parseFloat(c.amount) * 2), 0);
  const totalCreatorFees = events.reduce((sum: number, e: Event) => sum + parseFloat(e.creatorFee || '0'), 0);
  const totalPlatformFees = completedChallenges.reduce((sum: number, c: Challenge) => sum + (parseFloat(c.amount) * 2 * 0.05), 0);

  const isLoading = eventsLoading || challengesLoading;

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
            <h1 className="text-2xl font-bold text-white">Payouts Management</h1>
            <p className="text-slate-400">Manage event and challenge payouts, revenue tracking</p>
          </div>
          <Input
            placeholder="Search events or challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-slate-800 border-slate-700"
          />
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Volume</p>
                  <p className="text-2xl font-bold text-white">₦{(totalEventPool + totalChallengeStaked).toLocaleString()}</p>
                  <p className="text-xs text-blue-400">All-time</p>
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
                  <p className="text-2xl font-bold text-white">₦{totalCreatorFees.toLocaleString()}</p>
                  <p className="text-xs text-green-400">3% of event pools</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Platform Fees</p>
                  <p className="text-2xl font-bold text-white">₦{totalPlatformFees.toLocaleString()}</p>
                  <p className="text-xs text-purple-400">5% of challenge pools</p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">₦{(totalCreatorFees + totalPlatformFees).toLocaleString()}</p>
                  <p className="text-xs text-green-400">Platform profit</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions Alert */}
        {(eventsNeedingAction.length > 0 || challengesNeedingAction.length > 0) && (
          <Card className="bg-red-900/20 border-red-800">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Urgent Actions Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {eventsNeedingAction.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white">{eventsNeedingAction.length} events need resolution</span>
                  </div>
                )}
                {challengesNeedingAction.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    <span className="text-white">{challengesNeedingAction.length} challenges need resolution</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Events and Challenges */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="events" className="data-[state=active]:bg-blue-600">
              <Trophy className="w-4 h-4 mr-2" />
              Events ({filteredEvents.length})
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-purple-600">
              <Target className="w-4 h-4 mr-2" />
              Challenges ({filteredChallenges.length})
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Event Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-slate-400">Event</th>
                        <th className="text-left p-3 text-slate-400">Status</th>
                        <th className="text-left p-3 text-slate-400">Pool</th>
                        <th className="text-left p-3 text-slate-400">Creator Fee</th>
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
                            <div className="text-xs text-slate-400">
                              Created {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(event.status, event.adminResult)}>
                              {event.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-300">
                            <div>₦{parseFloat(event.eventPool).toLocaleString()}</div>
                            <div className="text-xs text-slate-500">
                              YES: ₦{parseFloat(event.yesPool).toLocaleString()} | 
                              NO: ₦{parseFloat(event.noPool).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3 text-green-400">
                            ₦{parseFloat(event.creatorFee).toLocaleString()}
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
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">
                                {new Date(event.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {needsEventAction(event) && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEventAction(event.id, 'set_yes')}
                                    className="bg-green-600 hover:bg-green-700 text-xs px-2"
                                  >
                                    YES
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEventAction(event.id, 'set_no')}
                                    className="bg-red-600 hover:bg-red-700 text-xs px-2"
                                  >
                                    NO
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEventAction(event.id, 'toggle_chat')}
                                className="border-slate-600 text-xs px-2"
                              >
                                {event.chatEnabled ? <MessageSquareOff className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEventAction(event.id, 'delete')}
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-xs px-2"
                              >
                                <Trash2 className="w-3 h-3" />
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
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Challenge Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-slate-400">Challenge</th>
                        <th className="text-left p-3 text-slate-400">Participants</th>
                        <th className="text-left p-3 text-slate-400">Status</th>
                        <th className="text-left p-3 text-slate-400">Stake</th>
                        <th className="text-left p-3 text-slate-400">Platform Fee</th>
                        <th className="text-left p-3 text-slate-400">Result</th>
                        <th className="text-left p-3 text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChallenges.map((challenge: Challenge) => (
                        <tr key={challenge.id} className="border-b border-slate-800 hover:bg-slate-800">
                          <td className="p-3">
                            <div className="font-medium text-white">{challenge.title}</div>
                            <div className="text-xs text-slate-400">{challenge.category}</div>
                          </td>
                          <td className="p-3 text-slate-300">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span className="text-xs">
                                {challenge.challengerUser.username} vs {challenge.challengedUser.username}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(challenge.status, challenge.result)}>
                              {challenge.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-300">
                            <div>₦{parseFloat(challenge.amount).toLocaleString()}</div>
                            <div className="text-xs text-slate-500">Each participant</div>
                          </td>
                          <td className="p-3 text-purple-400">
                            ₦{(parseFloat(challenge.amount) * 2 * 0.05).toLocaleString()}
                          </td>
                          <td className="p-3">
                            {challenge.result ? (
                              <Badge className="bg-green-600">
                                {challenge.result === 'challenger_won' ? 'Challenger' : 
                                 challenge.result === 'challenged_won' ? 'Challenged' : 'Draw'}
                              </Badge>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {needsChallengeAction(challenge) && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleChallengeAction(challenge.id, 'challenger_won')}
                                    className="bg-green-600 hover:bg-green-700 text-xs px-2"
                                  >
                                    C
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleChallengeAction(challenge.id, 'challenged_won')}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs px-2"
                                  >
                                    P
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleChallengeAction(challenge.id, 'draw')}
                                    className="bg-gray-600 hover:bg-gray-700 text-xs px-2"
                                  >
                                    D
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleChallengeAction(challenge.id, 'delete')}
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-xs px-2"
                              >
                                <Trash2 className="w-3 h-3" />
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
