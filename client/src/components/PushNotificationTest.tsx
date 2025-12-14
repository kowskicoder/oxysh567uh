import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pushNotificationService } from '@/lib/pushNotifications';
import { useToast } from '@/hooks/use-toast';

export default function PushNotificationTest() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await pushNotificationService.initialize();
      setIsSubscribed(true);
      toast({
        title: "Success!",
        description: "Push notifications enabled successfully",
      });
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    setIsLoading(true);
    try {
      await pushNotificationService.sendTestNotification();
      toast({
        title: "Test Sent!",
        description: "Check your notifications",
      });
    } catch (error) {
      console.error('Failed to send test:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      toast({
        title: "Unsubscribed",
        description: "Push notifications disabled",
      });
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>
          Test push notification functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || isSubscribed}
            className="w-full"
          >
            {isLoading ? 'Loading...' : isSubscribed ? 'Subscribed' : 'Enable Notifications'}
          </Button>
          
          {isSubscribed && (
            <>
              <Button
                onClick={handleSendTest}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send Test Notification'}
              </Button>
              
              <Button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? 'Loading...' : 'Disable Notifications'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}