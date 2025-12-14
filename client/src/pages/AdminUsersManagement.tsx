import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Shield, 
  ShieldOff, 
  DollarSign, 
  MessageSquare,
  UserCheck,
  UserX,
  Crown,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const userActionSchema = z.object({
  action: z.enum(['ban', 'unban', 'balance', 'admin', 'message']),
  value: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
});

interface User {
  id: string;
  username: string;
  firstName: string;
  email: string;
  level: number;
  points: number;
  balance: string;
  streak: number;
  createdAt: string;
  lastLogin: string;
  status: string;
}

export default function AdminUsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);

  const form = useForm<z.infer<typeof userActionSchema>>({
    resolver: zodResolver(userActionSchema),
    defaultValues: {
      action: 'message',
      value: '',
      reason: '',
    },
  });

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const userActionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userActionSchema> & { userId: string }) => {
      const response = await fetch(`/api/admin/users/${data.userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to execute action');
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Action Completed",
        description: `Successfully executed ${variables.action} action.`,
      });
      setShowActionDialog(false);
      setSelectedUser(null);
      form.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: User) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const onSubmit = (data: z.infer<typeof userActionSchema>) => {
    if (!selectedUser) return;
    userActionMutation.mutate({ ...data, userId: selectedUser.id });
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'bg-green-500';
      case 'banned': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'Online': return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'Offline': return <Badge variant="secondary">Offline</Badge>;
      case 'banned': return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
            <h1 className="text-2xl font-bold text-white">Users Management</h1>
            <p className="text-slate-400">Manage platform users and their permissions</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Online Users</p>
                  <p className="text-2xl font-bold text-green-400">
                    {users.filter((u: User) => u.status === 'Online').length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Banned Users</p>
                  <p className="text-2xl font-bold text-red-400">
                    {users.filter((u: User) => u.status === 'banned').length}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">New This Week</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {users.filter((u: User) => {
                      const createdAt = new Date(u.createdAt);
                      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      return createdAt > weekAgo;
                    }).length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Users List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.firstName?.[0] || user.username?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">
                          {user.firstName || 'No Name'}
                        </h3>
                        {getUserStatusBadge(user.status)}
                      </div>
                      <p className="text-sm text-slate-400">@{user.username}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-slate-400">Level</p>
                      <p className="text-white font-semibold">{user.level}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">Points</p>
                      <p className="text-white font-semibold">{user.points?.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">Balance</p>
                      <p className="text-white font-semibold">₦{parseFloat(user.balance || '0').toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">Last Login</p>
                      <p className="text-white font-semibold">
                        {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowActionDialog(true);
                    }}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Actions
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                User Action: {selectedUser?.firstName || selectedUser?.username}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Action Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="message">Send Message</SelectItem>
                          <SelectItem value="balance">Adjust Balance</SelectItem>
                          <SelectItem value="ban">Ban User</SelectItem>
                          <SelectItem value="unban">Unban User</SelectItem>
                          <SelectItem value="admin">Toggle Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form.watch('action') === 'balance' || form.watch('action') === 'message' || form.watch('action') === 'admin') && (
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          {form.watch('action') === 'balance' ? 'Amount' : 
                           form.watch('action') === 'admin' ? 'Admin Status' : 'Message'}
                        </FormLabel>
                        {form.watch('action') === 'message' ? (
                          <FormControl>
                            <Textarea 
                              placeholder="Enter message..."
                              className="bg-slate-700 border-slate-600 text-white"
                              {...field} 
                            />
                          </FormControl>
                        ) : form.watch('action') === 'admin' ? (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Select admin status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="true">Make Admin</SelectItem>
                              <SelectItem value="false">Remove Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Enter amount (positive or negative)"
                              className="bg-slate-700 border-slate-600 text-white"
                              {...field} 
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Reason</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter reason for this action..."
                          className="bg-slate-700 border-slate-600 text-white"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowActionDialog(false)}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={userActionMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {userActionMutation.isPending ? "Executing..." : "Execute Action"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}