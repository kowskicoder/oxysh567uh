import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeProvider";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Bell, Palette, Zap, Globe, Shield, Download, Trash2, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { preferences, isLoading, updatePreferences, isUpdating } = useUserPreferences();

  const handleNotificationToggle = (key: string, value: boolean) => {
    if (!preferences) return;

    updatePreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value
      }
    }).then(() => {
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    }).catch((error) => {
      console.error('Failed to update notification preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive",
      });
    });
  };

  const handleAppearanceChange = (key: string, value: string | boolean) => {
    if (!preferences) return;

    // Handle theme changes through ThemeProvider
    if (key === 'theme' && typeof value === 'string') {
      // Update the actual theme
      if (value === 'light' || value === 'dark') {
        // Only toggle if the current theme is different
        if (theme !== value) {
          toggleTheme();
        }
      }
    }

    updatePreferences({
      ...preferences,
      appearance: {
        ...preferences.appearance,
        [key]: value
      }
    }).then(() => {
      toast({
        title: "Appearance Updated",
        description: "Your appearance preferences have been saved.",
      });
    }).catch((error) => {
      console.error('Failed to update appearance preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save appearance preferences. Please try again.",
        variant: "destructive",
      });
    });
  };

  const handlePerformanceToggle = (key: string, value: boolean | string) => {
    if (!preferences) return;

    updatePreferences({
      ...preferences,
      performance: {
        ...preferences.performance,
        [key]: value
      }
    }).then(() => {
      toast({
        title: "Performance Settings Updated",
        description: "Your performance preferences have been saved.",
      });
    }).catch((error) => {
      console.error('Failed to update performance preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save performance preferences. Please try again.",
        variant: "destructive",
      });
    });
  };

  const handleRegionalChange = (key: string, value: string) => {
    if (!preferences) return;

    updatePreferences({
      ...preferences,
      regional: {
        ...preferences.regional,
        [key]: value
      }
    }).then(() => {
      toast({
        title: "Regional Settings Updated",
        description: "Your regional preferences have been saved.",
      });
    }).catch((error) => {
      console.error('Failed to update regional preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save regional preferences. Please try again.",
        variant: "destructive",
      });
    });
  };

  const handlePrivacyChange = (key: string, value: string) => {
    if (!preferences) return;

    updatePreferences({
      ...preferences,
      privacy: {
        ...preferences.privacy,
        [key]: value
      }
    }).then(() => {
      toast({
        title: "Privacy Settings Updated", 
        description: "Your privacy preferences have been saved.",
      });
    }).catch((error) => {
      console.error('Failed to update privacy preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save privacy preferences. Please try again.",
        variant: "destructive",
      });
    });
  };

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear query cache as well
    window.location.reload();
    toast({
      title: "Cache Cleared",
      description: "Application cache has been cleared successfully.",
    });
  };

  const exportData = () => {
    const userData = {
      profile: user,
      preferences: preferences,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `betchat-data-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Data Exported",
      description: "Your data has been downloaded successfully.",
    });
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="flex justify-between items-center">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Customize your Bantah experience
          </p>
        </div>

        <div className="space-y-4 md:space-y-8">
          {/* Notification Preferences */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <Bell className="mr-2 h-5 w-5 text-blue-500" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Email Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Receive notifications via email
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.notifications?.email || false}
                  onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Push Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Receive push notifications in your browser
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.notifications?.push || false}
                  onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
                  disabled={isUpdating}
                />
              </div>

              <Separator className="md:block hidden" />

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Challenge Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Get notified about new challenges and results
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.notifications?.challenge || false}
                  onCheckedChange={(checked) => handleNotificationToggle('challenge', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Event Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Get notified about event updates and endings
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.notifications?.event || false}
                  onCheckedChange={(checked) => handleNotificationToggle('event', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Friend Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Get notified about friend requests and activity
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.notifications?.friend || false}
                  onCheckedChange={(checked) => handleNotificationToggle('friend', checked)}
                  disabled={isUpdating}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <Palette className="mr-2 h-5 w-5 text-green-500" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Theme</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Choose your preferred theme
                  </p>
                </div>
                <Select
                  value={theme || 'light'}
                  onValueChange={(value) => {
                    if (value === 'light' || value === 'dark') {
                      if (theme !== value) {
                        toggleTheme();
                      }
                      handleAppearanceChange('theme', value);
                    }
                  }}
                >
                  <SelectTrigger className="w-32 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 bg-white dark:bg-slate-800">
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Compact View</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Use less spacing in the interface
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.appearance?.compactView || false}
                  onCheckedChange={(checked) => handleAppearanceChange('compactView', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Language</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Choose your preferred language
                  </p>
                </div>
                <Select
                  value={preferences?.appearance?.language || 'en'}
                  onValueChange={(value) => handleAppearanceChange('language', value)}
                >
                  <SelectTrigger className="w-32 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 bg-white dark:bg-slate-800">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Performance Settings */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Auto Refresh</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Automatically refresh content
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.performance?.autoRefresh || false}
                  onCheckedChange={(checked) => handlePerformanceToggle('autoRefresh', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Sound Effects</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Play sound effects for actions
                  </p>
                </div>
                <CustomToggle
                  checked={preferences?.performance?.soundEffects || false}
                  onCheckedChange={(checked) => handlePerformanceToggle('soundEffects', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Data Usage</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Control data consumption
                  </p>
                </div>
                <Select
                  value={preferences?.performance?.dataUsage || 'medium'}
                  onValueChange={(value) => handlePerformanceToggle('dataUsage', value)}
                >
                  <SelectTrigger className="w-32 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 bg-white dark:bg-slate-800">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <Globe className="mr-2 h-5 w-5 text-purple-500" />
                Regional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Currency</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Your preferred currency
                  </p>
                </div>
                <Select
                  value={preferences?.regional?.currency || 'NGN'}
                  onValueChange={(value) => handleRegionalChange('currency', value)}
                >
                  <SelectTrigger className="w-32 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 bg-white dark:bg-slate-800">
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Timezone</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Your local timezone
                  </p>
                </div>
                <Select
                  value={preferences?.regional?.timezone || 'Africa/Lagos'}
                  onValueChange={(value) => handleRegionalChange('timezone', value)}
                >
                  <SelectTrigger className="w-40 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 bg-white dark:bg-slate-800">
                    <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <Shield className="mr-2 h-5 w-5 text-red-500" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Profile Visibility</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Who can see your profile
                  </p>
                </div>
                <Select
                  value={preferences?.privacy?.profileVisibility || 'public'}
                  onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                >
                  <SelectTrigger className="w-32 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 bg-white dark:bg-slate-800">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Activity Visibility</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Who can see your activity
                  </p>
                </div>
                <Select
                  value={preferences?.privacy?.activityVisibility || 'friends'}
                  onValueChange={(value) => handlePrivacyChange('activityVisibility', value)}
                >
                  <SelectTrigger className="w-32 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-0 bg-white dark:bg-slate-800">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5 text-orange-500" />
                Account Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={exportData}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>

                <Button
                  onClick={clearCache}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}