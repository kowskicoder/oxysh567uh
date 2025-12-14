import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useTheme } from "@/contexts/ThemeProvider";
import { Key } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

export default function ProfileSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings: notificationSettings, updateSetting, isUpdating } = useNotificationSettings();
  const { theme, toggleTheme } = useTheme();
  const { user: privyUser, linkEmail, linkWallet, linkGoogle, linkTwitter } = usePrivy();

  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateProfileSchema>) => {
      await apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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

      // Handle specific error messages from server
      let errorMessage = "Failed to update profile";
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = error.message || errorMessage;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: typeof notificationSettings) => {
      await apiRequest("PATCH", "/api/user/notifications", settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been updated!",
      });
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

  const onSubmit = (data: z.infer<typeof updateProfileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    updateSetting(key as keyof typeof notificationSettings, value);
    toast({
      title: "Notification Setting Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Removed title on mobile, more compact */}
        <div className="flex items-center justify-between mb-3 sm:mb-8">
          <div className="hidden sm:block">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Profile Settings ⚙️
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Manage your account settings and preferences
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/profile'}
            className="sm:size-default ml-auto"
          >
            <i className="fas fa-arrow-left mr-1 sm:mr-2"></i>
            <span className="hidden sm:inline">Back to Profile</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-6">
          {/* Profile Information - More compact on mobile */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage 
                    src={user.profileImageUrl || undefined} 
                    alt={user.firstName || user.username || 'User'} 
                  />
                  <AvatarFallback className="text-base sm:text-lg">
                    {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-camera mr-1 sm:mr-2"></i>
                    <span className="hidden sm:inline">Change Photo</span>
                    <span className="sm:hidden">Change</span>
                  </Button>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Choose between light and dark mode
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex items-center gap-2"
                >
                  {theme === "dark" ? (
                    <>
                      <i className="fas fa-sun"></i>
                      Light Mode
                    </>
                  ) : (
                    <>
                      <i className="fas fa-moon"></i>
                      Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings?.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={notificationSettings?.pushNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Challenge Notifications</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get notified about new challenges and results
                  </p>
                </div>
                <Switch
                  checked={notificationSettings?.challengeNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('challengeNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Event Notifications</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get notified about event updates and endings
                  </p>
                </div>
                <Switch
                  checked={notificationSettings?.eventNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('eventNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Friend Notifications</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get notified about friend requests and activities
                  </p>
                </div>
                <Switch
                  checked={notificationSettings?.friendNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('friendNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your account is secured with Privy. Manage your login methods:
                </p>
                <div className="grid gap-2">
                  {!privyUser?.email && (
                    <Button variant="outline" className="w-full justify-start" onClick={linkEmail}>
                      <Key className="w-4 h-4 mr-2" />
                      Link Email
                    </Button>
                  )}
                  {!privyUser?.wallet && (
                    <Button variant="outline" className="w-full justify-start" onClick={linkWallet}>
                      <Key className="w-4 h-4 mr-2" />
                      Link Wallet
                    </Button>
                  )}
                  {!privyUser?.google && (
                    <Button variant="outline" className="w-full justify-start" onClick={linkGoogle}>
                      <Key className="w-4 h-4 mr-2" />
                      Link Google
                    </Button>
                  )}
                  {!privyUser?.twitter && (
                    <Button variant="outline" className="w-full justify-start" onClick={linkTwitter}>
                      <Key className="w-4 h-4 mr-2" />
                      Link Twitter
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline">
                  Enable 2FA
                </Button>
              </div>

              <Separator />

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium text-red-700 dark:text-red-300">Delete Account</Label>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}