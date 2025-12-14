import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function TelegramTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testMessage, setTestMessage] = useState('');

  // Get Telegram status
  const { data: telegramStatus, isLoading } = useQuery({
    queryKey: ['/api/telegram/status'],
    enabled: !!user,
  });

  // Test broadcast mutation
  const testBroadcastMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('/api/telegram/test-broadcast', {
        method: 'POST',
        body: { message },
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      if (data.success) {
        setTestMessage('');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive",
      });
    },
  });

  // Broadcast existing events mutation
  const broadcastExistingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/telegram/broadcast-existing', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Success" : "Info",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to broadcast existing events",
        variant: "destructive",
      });
    },
  });

  const handleTestBroadcast = () => {
    if (!testMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test message",
        variant: "destructive",
      });
      return;
    }
    testBroadcastMutation.mutate(testMessage);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">Please log in to access Telegram settings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Telegram Integration Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test the Telegram broadcasting functionality for events and challenges
          </p>
        </div>

        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-sync-alt"></i>
                  Telegram Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={telegramStatus?.sync?.enabled ? "default" : "secondary"}>
                        {telegramStatus?.sync?.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant={telegramStatus?.sync?.connected ? "default" : "destructive"}>
                        {telegramStatus?.sync?.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {telegramStatus?.sync?.message}
                    </p>
                    {telegramStatus?.sync?.groupInfo && (
                      <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                        <p className="text-sm font-medium">
                          Group: {telegramStatus.sync.groupInfo.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {telegramStatus.sync.groupInfo.id}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bot Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-robot"></i>
                  Telegram Bot
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={telegramStatus?.bot?.enabled ? "default" : "secondary"}>
                        {telegramStatus?.bot?.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant={telegramStatus?.bot?.connected ? "default" : "destructive"}>
                        {telegramStatus?.bot?.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {telegramStatus?.bot?.message}
                    </p>
                    {telegramStatus?.bot?.channelInfo && (
                      <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                        <p className="text-sm font-medium">
                          Channel: {telegramStatus.bot.channelInfo.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {telegramStatus.bot.channelInfo.id}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Broadcast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-paper-plane"></i>
                Test Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-message">Test Message</Label>
                  <Input
                    id="test-message"
                    placeholder="Enter a test message to broadcast..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={testBroadcastMutation.isPending}
                  />
                </div>
                <Button
                  onClick={handleTestBroadcast}
                  disabled={testBroadcastMutation.isPending || !telegramStatus?.bot?.connected}
                  className="w-full"
                >
                  {testBroadcastMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Send Test Message
                    </>
                  )}
                </Button>
                {!telegramStatus?.bot?.connected && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Bot must be connected to send test messages
                  </p>
                )}

                {/* Broadcast Existing Events Button */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={() => broadcastExistingMutation.mutate()}
                    disabled={broadcastExistingMutation.isPending || !telegramStatus?.bot?.connected}
                    variant="outline"
                    className="w-full"
                  >
                    {broadcastExistingMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Broadcasting Existing Events...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-broadcast-tower mr-2"></i>
                        Broadcast All Existing Events
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    This will send all existing events to your Telegram channel
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-info-circle"></i>
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Phase 1: Broadcasting
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>• When you create a new event, it's automatically broadcasted to the Telegram channel</li>
                    <li>• When you create a new challenge, it's automatically broadcasted to the Telegram channel</li>
                    <li>• Messages include event/challenge details, creator info, and direct links</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Next Phases
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>• Phase 2: Bot commands for creating challenges directly in Telegram</li>
                    <li>• Phase 3: Account linking and full bidirectional sync</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}