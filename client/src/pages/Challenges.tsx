import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ChallengeChat } from "@/components/ChallengeChat";
import { ChallengePreviewCard } from "@/components/ChallengePreviewCard";
import { BantMap } from "@/components/BantMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UserAvatar } from "@/components/UserAvatar";
import {
  MessageCircle,
  Clock,
  Trophy,
  TrendingUp,
  Zap,
  Users,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import React from "react";

const createChallengeSchema = z.object({
  challenged: z.string().min(1, "Please select who to challenge"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Stake amount is required"),
  dueDate: z.string().optional(),
});

export default function Challenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [preSelectedUser, setPreSelectedUser] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<string>('pending');

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

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["/api/challenges"],
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

  const { data: friends = [] as any[] } = useQuery({
    queryKey: ["/api/friends"],
    retry: false,
  });

  const {
    data: allUsers = [] as any[],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
    enabled: !!user, // Only fetch when user is authenticated
  });

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createChallengeSchema>) => {
      const challengeData = {
        ...data,
        amount: data.amount, // Keep as string for backend validation
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString()
          : undefined,
      };
      await apiRequest("POST", "/api/challenges", challengeData);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Created",
        description: "Your challenge has been sent!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setIsCreateDialogOpen(false);
      setPreSelectedUser(null);
      form.reset();
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

  const categories = [
    { value: "gaming", label: "Gaming", icon: "fas fa-gamepad" },
    { value: "sports", label: "Sports", icon: "fas fa-dumbbell" },
    { value: "trading", label: "Trading", icon: "fas fa-chart-line" },
    { value: "fitness", label: "Fitness", icon: "fas fa-running" },
    { value: "skill", label: "Skill", icon: "fas fa-brain" },
    { value: "other", label: "Other", icon: "fas fa-star" },
  ];

  const filteredChallenges = challenges.filter((challenge: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (challenge.title || "").toLowerCase().includes(searchLower) ||
      (challenge.description || "").toLowerCase().includes(searchLower) ||
      (challenge.category || "").toLowerCase().includes(searchLower) ||
      (challenge.challengerUser?.username || "")
        .toLowerCase()
        .includes(searchLower) ||
      (challenge.challengedUser?.username || "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  const filteredUsers = allUsers.filter((u: any) => {
    if (!searchTerm || u.id === user?.id) return false;
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

  const pendingChallenges = filteredChallenges.filter(
    (c: any) => c.status === "pending",
  );
  const activeChallenges = filteredChallenges.filter(
    (c: any) => c.status === "active",
  );
  const completedChallenges = filteredChallenges.filter(
    (c: any) => c.status === "completed",
  );

  const onSubmit = (data: z.infer<typeof createChallengeSchema>) => {
    const amount = parseFloat(data.amount);
    const currentBalance =
      typeof balance === "object" ? balance.balance : balance;

    if (amount > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds to create this challenge.",
        variant: "destructive",
      });
      return;
    }

    createChallengeMutation.mutate(data);
  };

  const handleChallengeClick = (challenge: any) => {
    setSelectedChallenge(challenge);
    setShowChat(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "disputed":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock;
      case "active":
        return Zap;
      case "completed":
        return Trophy;
      case "disputed":
        return Shield;
      default:
        return Clock;
    }
  };

  // Handle authentication errors
  React.useEffect(() => {
    if (usersError && isUnauthorizedError(usersError as Error)) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
    }
  }, [usersError, toast]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - spacing reduced after removing intro text */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div className="hidden md:block"></div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                setPreSelectedUser(null);
                form.reset();
              }
            }}
          >
            <DialogContent className="sm:max-w-sm max-w-[90vw] max-h-[75vh] overflow-y-auto p-4">
                <DialogHeader className="pb-2">
                <DialogTitle className="text-base sm:text-lg flex items-center space-x-2">
                  {preSelectedUser ? (
                    <>
                      <UserAvatar
                        userId={preSelectedUser.id}
                        username={preSelectedUser.username}
                        size={24}
                        className="h-6 w-6"
                      />
                      <span>
                        Challenge{" "}
                        {preSelectedUser.firstName || preSelectedUser.username}
                      </span>
                    </>
                  ) : (
                    "Create New Challenge"
                  )}
                </DialogTitle>
              </DialogHeader>
              {/* Challenge Preview Card */}
              {(form.watch("challenged") || preSelectedUser) && form.watch("title") && form.watch("amount") && (
                <div className="mb-3">
                  <div className="hidden sm:block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Preview</div>
                  <ChallengePreviewCard
                    challenger={{
                      id: user?.id || '',
                      firstName: user?.firstName,
                      username: user?.username,
                      profileImageUrl: user?.profileImageUrl
                    }}
                    challenged={preSelectedUser || {
                      id: form.watch("challenged"),
                      firstName: "Selected User",
                      username: "user"
                    }}
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
                  {!preSelectedUser && (
                    <FormField
                      control={form.control}
                      name="challenged"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium hidden sm:block">
                            Challenge Friend
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 rounded-lg text-sm bg-transparent border-none focus:ring-0">
                                <SelectValue placeholder="Select a friend" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[80] border-none shadow-none" position="popper">
                              {friends.map((friend: any) => {
                                const friendUser =
                                  friend.requesterId === user.id
                                    ? friend.addressee
                                    : friend.requester;
                                return (
                                  <SelectItem
                                    key={friendUser.id}
                                    value={friendUser.id}
                                  >
                                    {friendUser.firstName ||
                                      friendUser.username}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {preSelectedUser && (
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {(
                          preSelectedUser.firstName ||
                          preSelectedUser.username ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-xs">
                          {preSelectedUser.firstName ||
                            preSelectedUser.username}
                        </p>
                        <p className="text-xs text-slate-500">
                          Level {preSelectedUser.level || 1} •{" "}
                          {preSelectedUser.points || 0} pts
                        </p>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium hidden sm:block">
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
                        <FormLabel className="text-xs font-medium hidden sm:block">
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
                          <FormLabel className="text-xs font-medium hidden sm:block">
                            Category
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 text-sm bg-transparent border-none focus:ring-0">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-slate-800 border-none ring-0 shadow-none">
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
                          <FormLabel className="text-xs font-medium hidden sm:block">
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
                          <FormLabel className="text-xs font-medium hidden sm:block">
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
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 h-8 text-sm"
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

        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Search challenges and users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 flex-1 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0 focus:border-slate-400 focus-visible:ring-slate-400 placeholder:text-slate-400 placeholder:text-sm"
          />
          {/* Bant MAP button hidden for now */}
          <Button
            className="bg-[#7440ff] text-white font-black px-4 py-2 rounded-lg shadow hover:bg-[#7440ff]/90 whitespace-nowrap"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            + Challenge
          </Button>
        </div>

        {/* Search Results for Users */}
        {searchTerm && filteredUsers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Users ({filteredUsers.length})
            </h3>
            <div className="space-y-3">
              {filteredUsers.slice(0, 3).map((userItem: any) => {
                const isFriend = friends.some((friend: any) => {
                  const friendUser =
                    friend.requesterId === user.id
                      ? friend.addressee
                      : friend.requester;
                  return friendUser.id === userItem.id;
                });

                return (
                  <div
                    key={userItem.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <UserAvatar
                          userId={userItem.id}
                          username={userItem.username}
                          size={40}
                          className="h-10 w-10"
                        />
                        {isFriend && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {userItem.firstName ||
                              userItem.username ||
                              "Anonymous"}
                          </h4>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            @{userItem.username || "unknown"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <i className="fas fa-trophy mr-1 text-amber-500"></i>
                            {userItem.wins || 0}
                          </span>
                          <span className="flex items-center">
                            <i className="fas fa-bolt mr-1 text-purple-500"></i>
                            Lvl {userItem.level || 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-[#7440ff] hover:bg-[#7440ff]/90 text-white rounded-full px-4 py-1 text-xs font-medium"
                      onClick={() => {
                        form.setValue("challenged", userItem.id);
                        setPreSelectedUser(userItem);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      Challenge
                    </Button>
                  </div>
                );
              })}
              {filteredUsers.length > 3 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  {filteredUsers.length - 3} more users found. Check the Users
                  tab for more.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Challenges Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 md:space-y-4">
            {isLoading ? (
              <div className="space-y-3 md:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-3 md:h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 md:w-32 animate-pulse"></div>
                          <div className="h-2 md:h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 md:w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-5 md:h-6 w-12 md:w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <div className="h-4 md:h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 md:h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                      <div className="h-3 md:h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingChallenges.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i
                    className="fas fa-clock text-4xl mb-4"
                    style={{ color: "#7440ff" }}
                  ></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No pending challenges
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Challenge your friends to start competing!
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingChallenges.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onChatClick={handleChallengeClick}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3 md:space-y-4">
            {activeChallenges.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i
                    className="fas fa-fire text-4xl mb-4"
                    style={{ color: "#7440ff" }}
                  ></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No active challenges
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Accept pending challenges to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeChallenges.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onChatClick={handleChallengeClick}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 md:space-y-4">
            {completedChallenges.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i
                    className="fas fa-trophy text-4xl mb-4"
                    style={{ color: "#7440ff" }}
                  ></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No completed challenges
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Complete some challenges to see them here!
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedChallenges.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onChatClick={handleChallengeClick}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : usersError ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {isUnauthorizedError(usersError as Error)
                      ? "Please log in"
                      : "Error loading users"}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {isUnauthorizedError(usersError as Error)
                      ? "You need to be logged in to view users."
                      : "Unable to fetch users. Please try refreshing the page."}
                  </p>
                  {isUnauthorizedError(usersError as Error) && (
                    <button
                      onClick={() => (window.location.href = "/api/login")}
                      className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Log In
                    </button>
                  )}
                </CardContent>
              </Card>
            ) : allUsers.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <i
                    className="fas fa-users text-4xl mb-4"
                    style={{ color: "#7440ff" }}
                  ></i>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No users found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    No users are currently available to challenge!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allUsers
                  .filter((u: any) => u.id !== user?.id)

                  .map((userItem: any) => {
                    // Check if this user is a friend
                    const isFriend = friends.some((friend: any) => {
                      const friendUser =
                        friend.requesterId === user.id
                          ? friend.addressee
                          : friend.requester;
                      return friendUser.id === userItem.id;
                    });

                    return (
                      <div
                        key={userItem.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <UserAvatar
                              userId={userItem.id}
                              username={userItem.username}
                              size={48}
                              className="h-12 w-12"
                            />
                            {isFriend && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                {userItem.firstName ||
                                  userItem.username ||
                                  "Anonymous"}
                              </h3>
                              <span className="text-slate-500 dark:text-slate-400 text-sm">
                                @{userItem.username || "unknown"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <span className="flex items-center">
                                <i className="fas fa-trophy mr-1 text-amber-500"></i>
                                {userItem.wins || 0}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-bolt mr-1 text-purple-500"></i>
                                {userItem.level || 1}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-naira-sign mr-1 text-green-500"></i>
                                {userItem.balance || "N0"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="bg-[#7440ff] hover:bg-[#7440ff] text-white rounded-full px-6 py-2 font-medium"
                          onClick={() => {
                            form.setValue("challenged", userItem.id);
                            setPreSelectedUser(userItem);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          Challenge
                        </Button>
                      </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <BantMap
              embedded={true}
              onChallengeUser={(mapUser) => {
                form.setValue("challenged", String(mapUser.id));
                setPreSelectedUser(mapUser);
                setIsCreateDialogOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Challenge Chat Dialog */}
      {showChat && selectedChallenge && (
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] p-0">
            <ChallengeChat
              challenge={selectedChallenge}
              onClose={() => setShowChat(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <MobileNavigation />
    </div>
  );
}
