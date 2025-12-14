import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/NotificationCard";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw, Target, Trophy, TrendingUp } from "lucide-react";

export default function NotificationTest() {
  const { notifications, isLoading, unreadCount } = useNotifications();
  const [testingAlgorithm, setTestingAlgorithm] = useState(false);

  const handleTestAlgorithm = async () => {
    setTestingAlgorithm(true);
    try {
      const response = await fetch('/api/notifications/trigger-algorithm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Algorithm triggered successfully');
      } else {
        console.error('Failed to trigger algorithm');
      }
    } catch (error) {
      console.error('Error triggering algorithm:', error);
    } finally {
      setTestingAlgorithm(false);
    }
  };

  const algorithmNotifications = notifications.filter((n: any) => 
    ['leaderboard_leader', 'winner_challenge', 'loser_encourage', 'event_joiner', 'streak_performer'].includes(n.type)
  );

  const regularNotifications = notifications.filter((n: any) => 
    !['leaderboard_leader', 'winner_challenge', 'loser_encourage', 'event_joiner', 'streak_performer'].includes(n.type)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Notification Algorithm Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test and monitor the notification algorithm system
          </p>
        </div>

        {/* Algorithm Control */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Algorithm Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleTestAlgorithm}
                disabled={testingAlgorithm}
                className="flex items-center gap-2"
              >
                {testingAlgorithm ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                {testingAlgorithm ? 'Running Algorithm...' : 'Trigger Algorithm'}
              </Button>
              
              <Badge variant="secondary" className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {unreadCount} unread
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Algorithm Generated Notifications
              <Badge variant="outline" className="ml-2">
                {algorithmNotifications.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {algorithmNotifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No algorithm notifications yet. Click "Trigger Algorithm" to generate some.
              </div>
            ) : (
              <div className="space-y-4">
                {algorithmNotifications.map((notification: any) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regular Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Regular Notifications
              <Badge variant="outline" className="ml-2">
                {regularNotifications.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {regularNotifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No regular notifications
              </div>
            ) : (
              <div className="space-y-4">
                {regularNotifications.map((notification: any) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}