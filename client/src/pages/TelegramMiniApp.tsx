import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface TelegramInitData {
  user: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
    photo_url?: string;
  };
  auth_date: number;
  hash: string;
}

export default function TelegramMiniApp() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'challenges'>('wallet');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Authenticate via Telegram initData
  useEffect(() => {
    const initTelegramApp = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg) {
        toast({ title: 'Error', description: 'Please open this from Telegram', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      try {
        tg.ready();
        tg.expand();

        // Get initData (Telegram-signed)
        const initData = tg.initData;
        if (!initData) {
          throw new Error('No initData');
        }

        // Parse initData
        const params = new URLSearchParams(initData);
        const userStr = params.get('user');
        const authDate = params.get('auth_date');
        const hash = params.get('hash');

        if (!userStr || !hash) {
          throw new Error('Missing required Telegram data');
        }

        const user = JSON.parse(userStr);
        const data: TelegramInitData = { user, auth_date: parseInt(authDate || '0'), hash };

        // Authenticate with backend
        const response = await apiRequest('POST', '/api/telegram/mini-app/auth', { initData: data });
        if (response.success) {
          console.log('✅ Authenticated:', response.user);
          setIsAuthed(true);
        } else {
          throw new Error(response.message || 'Auth failed');
        }
      } catch (error) {
        console.error('❌ Auth error:', error);
        toast({ title: 'Auth Failed', description: String(error), variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    initTelegramApp();
  }, [toast]);

  // Check URL params for tab routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'wallet', 'challenges'].includes(tab)) {
      setActiveTab(tab as 'profile' | 'wallet' | 'challenges');
    }
  }, []);

  // Fetch data only when authenticated
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: isAuthed,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['/api/wallet/balance'],
    enabled: isAuthed,
  });

  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['/api/challenges'],
    enabled: isAuthed,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">Failed to authenticate. Please try opening this link from Telegram again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - Show tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3">
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Bantah</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="wallet">💰 Wallet</TabsTrigger>
                <TabsTrigger value="challenges">⚔️ Challenges</TabsTrigger>
                <TabsTrigger value="profile">👤 Profile</TabsTrigger>
              </TabsList>

              {/* Wallet Tab */}
              <TabsContent value="wallet" className="space-y-4">
                {walletLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : walletData ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-lg p-4">
                      <p className="text-sm opacity-90">Balance</p>
                      <p className="text-2xl font-bold">₦{walletData.balance?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg p-4">
                      <p className="text-sm opacity-90">Coins</p>
                      <p className="text-2xl font-bold">{walletData.coins || '0'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">No wallet data</div>
                )}
              </TabsContent>

              {/* Challenges Tab */}
              <TabsContent value="challenges" className="space-y-4">
                {challengesLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : challengesData && challengesData.length > 0 ? (
                  <div className="space-y-2">
                    {challengesData
                      .filter((c: any) => c.status === 'active' || c.status === 'pending')
                      .map((challenge: any) => (
                        <div key={challenge.id} className="border rounded-lg p-3 space-y-2">
                          <div className="font-semibold text-sm">{challenge.title}</div>
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>₦{challenge.amount?.toLocaleString() || '0'}</span>
                            <span className="capitalize">{challenge.status}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">No active challenges</div>
                )}
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                {profileData ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-slate-600">Username</p>
                      <p className="font-semibold">{profileData.username || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-slate-600">Level</p>
                      <p className="font-semibold">Lvl {profileData.level || '1'}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-slate-600">XP</p>
                      <p className="font-semibold">{profileData.xp || '0'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">No profile data</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
