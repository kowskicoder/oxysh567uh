import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FriendsPerformanceComparison } from "@/components/FriendsPerformanceComparison";
import { ChallengePreviewCard } from "@/components/ChallengePreviewCard";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
import { formatDistanceToNow } from "date-fns";
import { useForm, Form } from "react-hook-form";
import { z } from "zod";

const createChallengeSchema = z.object({
  challenged: z.string().min(1, "Challenged user required"),
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category required"),
  amount: z.string().min(1, "Amount required"),
  dueDate: z.string().min(1, "Due date required"),
});
  export default function Friends() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [friendEmail, setFriendEmail] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

  const form = useForm<z.infer<typeof createChallengeSchema>>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      challenged: "",
      title: "",
      description: "",
      category: "",
      amount: "",
      dueDate: "",
    },
  });

  const categories = [
    { value: "gaming", label: "Gaming", icon: "fas fa-gamepad" },
    { value: "sports", label: "Sports", icon: "fas fa-dumbbell" },
    { value: "trading", label: "Trading", icon: "fas fa-chart-line" },
    { value: "fitness", label: "Fitness", icon: "fas fa-running" },
    { value: "skill", label: "Skill", icon: "fas fa-brain" },
    { value: "other", label: "Other", icon: "fas fa-star" },
  ];

  const { data: friends = [] as any[], isLoading } = useQuery({
    queryKey: ["/api/friends"],
    retry: false,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (addresseeId: string) => {
      await apiRequest("POST", "/api/friends/request", { addresseeId });
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setIsAddDialogOpen(false);
      setFriendEmail("");
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

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      await apiRequest("PATCH", `/api/friends/${friendId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
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

  const createChallengeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createChallengeSchema>) => {
      const challengeData = {
        challengedId: selectedUser?.id || data.challenged,
        title: data.title,
        description: data.description,
        category: data.category,
        amount: parseFloat(data.amount),
        dueDate: data.dueDate,
      };
      return await apiRequest("POST", "/api/challenges", challengeData);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Sent!",
        description: `Challenge sent to ${selectedUser?.firstName || selectedUser?.username}`,
      });
      setShowChallengeModal(false);
      setSelectedUser(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
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

  const filteredFriends = (friends as any[]).filter((friend: any) => {
    if (!searchTerm) return true;
    const friendUser = getFriendUser(friend);
    const searchLower = searchTerm.toLowerCase();
    return (
      (friendUser.firstName || "").toLowerCase().includes(searchLower) ||
      (friendUser.lastName || "").toLowerCase().includes(searchLower) ||
      (friendUser.username || "").toLowerCase().includes(searchLower) ||
      (friendUser.email || "").toLowerCase().includes(searchLower)
    );
  });

  const acceptedFriends = filteredFriends.filter(
    (f: any) => f.status === "accepted",
  );
  const pendingRequests = filteredFriends.filter(
    (f: any) => f.status === "pending" && f.addresseeId === user?.id,
  );
  const sentRequests = filteredFriends.filter(
    (f: any) => f.status === "pending" && f.requesterId === user?.id,
  );

  const getFriendUser = (friend: any) => {
    return friend.requesterId === user?.id
      ? friend.addressee
      : friend.requester;
  };

  const handleSendRequest = () => {
    // In a real app, you'd search for users by email first
    // For now, we'll simulate with a placeholder
    if (friendEmail.trim()) {
      // This would normally be the found user's ID
      sendFriendRequestMutation.mutate("placeholder-user-id");
    }
  };

  const handleChallengeClick = (user: any) => {
    setSelectedUser(user);
    setShowChallengeModal(true);
    form.setValue("challenged", user.id);
  };

  const onSubmit = (data: z.infer<typeof createChallengeSchema>) => {
    createChallengeMutation.mutate(data);
  };

  if (!user) return null;

  const { data: allUsers = [] as any[] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const filteredUsers = (allUsers as any[]).filter((u: any) => {
    if (u.id === user?.id) return false;
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const firstName = (u.firstName || "").toLowerCase();
    const lastName = (u.lastName || "").toLowerCase();
    const username = (u.username || "").toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();

    return (
      firstName.includes(searchLower) ||
      lastName.includes(searchLower) ||
      username.includes(searchLower) ||
      fullName.includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - spacing reduced after removing intro text */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div className="hidden md:block"></div>
        </div>

        {/* Search and Add Friend */}
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 w-3/4 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0 focus:border-slate-400 focus-visible:ring-slate-400 placeholder:text-slate-400 placeholder:text-sm"
          />

          <Button
            className="bg-[#7440ff] text-white font-black px-6 py-2 rounded-lg shadow hover:bg-[#7440ff]/90"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Friend
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-sm max-w-[360px]">
              <DialogHeader>
                <DialogTitle>Add Friend</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Username or Email
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter email or username..."
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendRequest}
                    disabled={
                      !friendEmail.trim() || sendFriendRequestMutation.isPending
                    }
                    className="flex-1 bg-[#7440ff] text-white hover:bg-[#6538e6] disabled:opacity-60"
                  >
                    {sendFriendRequestMutation.isPending
                      ? "Sending..."
                      : "Send a Request"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Friends Tabs */}
        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends">Friends ({acceptedFriends.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="requests">
              <div className="flex flex-col leading-tight">
                <span className="text-sm">Requests ({pendingRequests.length})</span>
                <span className="text-sm text-slate-500">Sent ({sentRequests.length})</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">
                  Loading friends...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {acceptedFriends.map((friend: any) => {
                  const friendUser = getFriendUser(friend);
                  return (
                    <Card
                      key={friend.id}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              userId={friendUser.id}
                              username={friendUser.username || friendUser.email}
                              size={48}
                              className="w-12 h-12"
                            />
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                {friendUser.firstName || friendUser.username}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Level {friendUser.level || 1} •{" "}
                                <span className="font-medium">
                                  {friendUser.coins?.toLocaleString() || 0}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              className="text-xs px-3 py-1.5"
                              style={{ backgroundColor: "#ccff00", color: "black" }}
                              onClick={() => handleChallengeClick(friendUser)}
                            >
                              Challenge
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {filteredUsers.map((user: any) => (
              <Card
                key={user.id}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserAvatar
                        userId={user.id}
                        username={user.username || user.email}
                        size={48}
                        className="w-12 h-12"
                      />
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {user.firstName || user.username}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Level {user.level || 1} •{" "}
                          <span className="font-medium">
                            {user.coins?.toLocaleString() || 0}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        className="text-xs px-3 py-1.5"
                        style={{ backgroundColor: "#ccff00", color: "black" }}
                        onClick={() => handleChallengeClick(user)}
                      >
                        Challenge
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <FriendsPerformanceComparison />
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i
                    className="fas fa-inbox text-4xl mb-4"
                    style={{ color: "#7440ff" }}
                  ></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No friend requests
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    When people send you friend requests, they'll appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request: any) => {
                  const requesterUser = request.requester;
                  return (
                    <Card
                      key={request.id}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              userId={requesterUser.id}
                              username={requesterUser.username || requesterUser.email}
                              size={48}
                              className="w-12 h-12"
                            />
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                {requesterUser.firstName ||
                                  requesterUser.username}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Sent{" "}
                                {formatDistanceToNow(
                                  new Date(request.createdAt),
                                  { addSuffix: true },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() =>
                                acceptFriendRequestMutation.mutate(request.id)
                              }
                              disabled={acceptFriendRequestMutation.isPending}
                            >
                              Accept
                            </Button>
                            <Button size="sm" variant="outline">
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Sent requests */}
            <div className="pt-4">
              {sentRequests.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="text-center py-12">
                    <i className="fas fa-paper-plane text-4xl mb-4" style={{ color: "#7440ff" }}></i>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No sent requests</h3>
                    <p className="text-slate-600 dark:text-slate-400">Friend requests you send will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request: any) => {
                    const addresseeUser = request.addressee;
                    return (
                      <Card key={request.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <UserAvatar userId={addresseeUser.id} username={addresseeUser.username || addresseeUser.email} size={48} className="w-12 h-12" />
                              <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{addresseeUser.firstName || addresseeUser.username}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</p>
                              </div>
                            </div>
                            <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Pending</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Challenge Modal */}
      <Dialog 
        open={showChallengeModal} 
        onOpenChange={(open) => {
          setShowChallengeModal(open);
          if (!open) {
            setSelectedUser(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-sm max-w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg flex items-center space-x-2">
              {selectedUser ? (
                <>
                  <UserAvatar
                    userId={selectedUser.id}
                    username={selectedUser.username}
                    size={24}
                    className="h-6 w-6"
                  />
                  <span>
                    Challenge{" "}
                    {selectedUser.firstName || selectedUser.username}
                  </span>
                </>
              ) : (
                "Create New Challenge"
              )}
            </DialogTitle>
          </DialogHeader>
          {/* Challenge Preview Card */}
          {selectedUser && form.watch("title") && form.watch("amount") && (
            <div className="mb-3">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Preview</div>
              <ChallengePreviewCard
                challenger={{
                  id: (user as any)?.id || '',
                  firstName: (user as any)?.firstName,
                  username: (user as any)?.username,
                  profileImageUrl: (user as any)?.profileImageUrl
                }}
                challenged={selectedUser}
                title={form.watch("title")}
                description={form.watch("description")}
                category={form.watch("category")}
                amount={form.watch("amount")}
                dueDate={form.watch("dueDate")}
              />
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2"
            >
              {selectedUser && (
                <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {(
                      selectedUser.firstName ||
                      selectedUser.username ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-xs">
                      {selectedUser.firstName ||
                        selectedUser.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      Level {selectedUser.level || 1} •{" "}
                      {selectedUser.points || 0} pts
                    </p>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-medium">
                      Challenge Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What's the challenge?"
                        className="h-8 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-medium">
                      Description (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the challenge details..."
                        className="min-h-[50px] text-sm resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Three fields in one row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium">
                        Category
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              <div className="flex items-center space-x-2">
                                <i className={category.icon}></i>
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-medium">
                        Stake (₦)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          className="h-8 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1 col-span-2 sm:col-span-1">
                      <FormLabel className="text-xs font-medium">
                        Due Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="h-8 text-sm"
                          {...field}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowChallengeModal(false)}
                  className="flex-1 h-8 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createChallengeMutation.isPending}
                  className="flex-1 h-8 text-sm text-black hover:opacity-90"
                  style={{ backgroundColor: '#ccff00' }}
                >
                  {createChallengeMutation.isPending
                    ? "Creating..."
                    : "Challenge"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
