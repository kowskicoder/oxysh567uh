import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { formatBalance } from "@/utils/currencyUtils";
import {
  Star,
  Clock,
  MessageCircle,
  Trophy,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit modal states
  const [editEventModal, setEditEventModal] = useState(false);
  const [editChallengeModal, setEditChallengeModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editEntryFee, setEditEntryFee] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState("");

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
    enabled: !!user,
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["/api/challenges"],
    retry: false,
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/wallet/transactions"],
    retry: false,
    enabled: !!user,
  });



  if (!user) return null;

  // Combine and categorize all activities
  const allActivities = [
    ...(Array.isArray(events) ? events.map((event: any) => ({ ...event, type: "event" })) : []),
    ...(Array.isArray(challenges) ? challenges.map((challenge: any) => ({
      ...challenge,
      type: "challenge",
    })) : []),
  ];

  const createdActivities = allActivities.filter(
    (activity) => activity.creatorId === user.id || activity.createdBy === user.id || activity.challenger?.id === user.id,
  );

  const activeActivities = allActivities.filter(
    (activity) => activity.status === "active" || activity.status === "live",
  );

  const discussActivities = allActivities.filter(
    (activity) => activity.chatEnabled || activity.type === "challenge",
  );

  const wonActivities = Array.isArray(transactions) ? transactions.filter(
    (tx: any) => tx.type === "win" || tx.type === "prize",
  ) : [];

  const lostActivities = Array.isArray(transactions) ? transactions.filter(
    (tx: any) => tx.type === "bet" || tx.type === "challenge_bet",
  ) : [];

  const getActivityImage = (activity: any) => {
    if (activity.type === "event") {
      // Check for proper image URL, fallback to a proper default
      if (activity.image_url && activity.image_url !== "TEST IMAGE") {
        return activity.image_url;
      }
      // Use a proper event placeholder image
      return "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop&crop=center";
    }
    // For challenges, use a proper challenge image
    return "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=200&fit=crop&crop=center";
  };

  const getStatusBadge = (activity: any) => {
    const status = activity.status || "pending";
    const colors = {
      active: "bg-purple-500 text-white",
      live: "bg-green-500 text-white",
      pending: "bg-yellow-500 text-white",
      completed: "bg-blue-500 text-white",
      settled: "bg-gray-500 text-white",
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const canEditActivity = (activity: any) => {
    // Can only edit if the activity hasn't started yet
    if (activity.type === "event") {
      const endDate = new Date(activity.endDate);
      const now = new Date();
      return now < endDate && (activity.status === "pending" || activity.status === "active");
    } else if (activity.type === "challenge") {
      const dueDate = new Date(activity.dueDate);
      const now = new Date();
      return now < dueDate && activity.status === "active";
    }
    return false;
  };

  const openEditModal = (activity: any) => {
    setSelectedActivity(activity);

    if (activity.type === "event") {
      setEditTitle(activity.title || "");
      setEditDescription(activity.description || "");
      setEditCategory(activity.category || "");
      setEditEntryFee(activity.entryFee?.toString() || "");

      // Format date and time for inputs
      if (activity.endDate) {
        const endDate = new Date(activity.endDate);
        setEditEndDate(endDate.toISOString().split('T')[0]);
        setEditEndTime(endDate.toTimeString().slice(0, 5));
      }

      setEditEventModal(true);
    } else if (activity.type === "challenge") {
      setEditTitle(activity.title || "");
      setEditDescription(activity.description || "");
      setEditType(activity.type || "");
      setEditAmount(activity.amount?.toString() || "");

      setEditChallengeModal(true);
    }
  };

  const editEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const endDateTime = new Date(`${editEndDate}T${editEndTime}`);
      return apiRequest('PUT', `/api/events/${selectedActivity.id}`, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        entryFee: parseInt(editEntryFee),
        endDate: endDateTime.toISOString()
      });
    },
    onSuccess: () => {
      toast({
        title: "Event Updated!",
        description: "Your event has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setEditEventModal(false);
      setSelectedActivity(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const editChallengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      return apiRequest('PUT', `/api/challenges/${selectedActivity.id}`, {
        title: editTitle,
        description: editDescription,
        amount: parseInt(editAmount)
      });
    },
    onSuccess: () => {
      toast({
        title: "Challenge Updated!",
        description: "Your challenge has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setEditChallengeModal(false);
      setSelectedActivity(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const ActivityCard = ({ activity }: { activity: any }) => (
    <Card className="mb-2 hover:shadow-md transition-shadow mobile-compact-card">
      <CardContent className="p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 flex-1">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              <img
                src={getActivityImage(activity)}
                alt={activity.title || activity.description}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = activity.type === "challenge" ? "/assets/versus.svg" : "/assets/default-event-banner.jpg";
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 mb-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                  {activity.title || activity.description}
                </h3>
                <Badge className={`text-xs px-1.5 py-0.5 h-5 ${getStatusBadge(activity)}`}>
                  {activity.status || "pending"}
                </Badge>
              </div>

              <div className="flex items-center space-x-2.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-3 h-3" />
                  <span>{activity.participantsCount || 0}</span>
                </div>
              </div>

              <div className="mt-0.5">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {formatBalance(activity.entryFee || activity.betAmount || activity.amount || 0)}{" "}
                  Pool
                </span>
              </div>
            </div>
          </div>

          <div className="ml-2 flex space-x-1 flex-shrink-0">
            {canEditActivity(activity) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(activity)}
                className="h-7 px-2 text-xs"
              >
                <Edit className="w-3 h-3" />
                <span className="hidden sm:inline sm:ml-1">Edit</span>
              </Button>
            )}
            <Button
              style={{ backgroundColor: "#7440ff", color: "white" }}
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="hidden sm:inline sm:ml-1">Chat</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <Card className="mb-2 hover:shadow-md transition-shadow mobile-compact-card">
      <CardContent className="p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              {transaction.type === "win" || transaction.type === "prize" ? (
                <Trophy className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {transaction.description || `${transaction.type} transaction`}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatDistanceToNow(new Date(transaction.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span
              className={`font-semibold text-sm ${
                transaction.type === "win" || transaction.type === "prize"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {transaction.type === "win" || transaction.type === "prize"
                ? "+"
                : "-"}
              {formatBalance(transaction.amount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Compact Tab Navigation */}
            <Tabs defaultValue="created" className="space-y-2">
              <TabsList className="grid w-full grid-cols-5 h-8 sm:h-9">
                <TabsTrigger value="created" className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-plus text-xs"></i>
                  <span className="hidden sm:inline">Created</span>
                  <span>({createdActivities.length})</span>
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-clock text-xs"></i>
                  <span className="hidden sm:inline">Active</span>
                  <span>({activeActivities.length})</span>
                </TabsTrigger>
                <TabsTrigger value="discuss" className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-comments text-xs"></i>
                  <span className="hidden sm:inline">Discuss</span>
                  <span>({discussActivities.length})</span>
                </TabsTrigger>
                <TabsTrigger value="won" className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-trophy text-xs"></i>
                  <span className="hidden sm:inline">Won</span>
                  <span>({wonActivities.length})</span>
                </TabsTrigger>
                <TabsTrigger value="lost" className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-exclamation-triangle text-xs"></i>
                  <span className="hidden sm:inline">Lost</span>
                  <span>({lostActivities.length})</span>
                </TabsTrigger>
              </TabsList>

            <TabsContent value="created" className="space-y-2">
              {eventsLoading || challengesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading activities...</p>
                </div>
              ) : createdActivities.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mobile-compact-card">
                  <CardContent className="text-center py-8">
                    <i className="fas fa-star text-3xl mb-3" style={{ color: '#7440ff' }}></i>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No created activities yet
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Start by creating an event or challenge!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                createdActivities.map((activity: any) => (
                  <ActivityCard
                    key={`${activity.type}-${activity.id}`}
                    activity={activity}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-2">
              {eventsLoading || challengesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading activities...</p>
                </div>
              ) : activeActivities.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mobile-compact-card">
                  <CardContent className="text-center py-8">
                    <i className="fas fa-clock text-3xl mb-3" style={{ color: '#7440ff' }}></i>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No active activities
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Accept pending challenges or join events to get started!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeActivities.map((activity: any) => (
                  <ActivityCard
                    key={`${activity.type}-${activity.id}`}
                    activity={activity}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="discuss" className="space-y-2">
              {eventsLoading || challengesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading activities...</p>
                </div>
              ) : discussActivities.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mobile-compact-card">
                  <CardContent className="text-center py-8">
                    <i className="fas fa-comments text-3xl mb-3" style={{ color: '#7440ff' }}></i>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No discussions available
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Join events and challenges to start discussions!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                discussActivities.map((activity: any) => (
                  <ActivityCard
                    key={`${activity.type}-${activity.id}`}
                    activity={activity}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="won" className="space-y-2">
              {wonActivities.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mobile-compact-card">
                  <CardContent className="text-center py-8">
                    <i className="fas fa-trophy text-3xl mb-3" style={{ color: '#7440ff' }}></i>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No winnings yet
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Win challenges and events to see your victories here!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                wonActivities.map((transaction: any) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="lost" className="space-y-2">
              {lostActivities.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mobile-compact-card">
                  <CardContent className="text-center py-8">
                    <i className="fas fa-exclamation-triangle text-3xl mb-3" style={{ color: '#7440ff' }}></i>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No losses recorded
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Keep up the good work!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                lostActivities.map((transaction: any) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              )}
            </TabsContent>


          </Tabs>
        </div>

      {/* Edit Event Modal */}
      <Dialog open={editEventModal} onOpenChange={setEditEventModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Event title"
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Event description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editEntryFee">Entry Fee (₦)</Label>
              <Input
                id="editEntryFee"
                type="number"
                value={editEntryFee}
                onChange={(e) => setEditEntryFee(e.target.value)}
                placeholder="Entry fee"
                min="1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editEndTime">End Time</Label>
                <Input
                  id="editEndTime"
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3">
              <Button variant="outline" onClick={() => setEditEventModal(false)} className="h-8 px-3 text-sm">
                Cancel
              </Button>
              <Button 
                onClick={() => editEventMutation.mutate()}
                disabled={editEventMutation.isPending}
                className="h-8 px-3 text-sm"
              >
                {editEventMutation.isPending ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Challenge Modal */}
      <Dialog open={editChallengeModal} onOpenChange={setEditChallengeModal}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Edit Challenge</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="editChallengeTitle" className="text-sm font-medium">Title</Label>
              <Input
                id="editChallengeTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Challenge title"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editChallengeDescription" className="text-sm font-medium">Description</Label>
              <Textarea
                id="editChallengeDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Challenge description"
                rows={2}
                className="min-h-[60px] text-sm resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editChallengeAmount" className="text-sm font-medium">Stake Amount (₦)</Label>
              <Input
                id="editChallengeAmount"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Stake amount"
                min="1"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3">
              <Button variant="outline" onClick={() => setEditChallengeModal(false)} className="h-8 px-3 text-sm">
                Cancel
              </Button>
              <Button 
                onClick={() => editChallengeMutation.mutate()}
                disabled={editChallengeMutation.isPending}
                className="h-8 px-3 text-sm"
              >
                {editChallengeMutation.isPending ? "Updating..." : "Update Challenge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}