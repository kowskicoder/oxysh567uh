import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatBalance } from "@/utils/currencyUtils";
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Coins, Gift, ShoppingCart, Star, Zap, Crown, Sparkles } from "lucide-react";

export default function Shop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftRecipient, setGiftRecipient] = useState("");
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
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

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const coinPackages = [
    { 
      coins: 1000, 
      price: 100, 
      bonus: 0, 
      popular: false,
      icon: "🪙",
      gradient: "from-blue-400 to-blue-600",
      emoji: "💎"
    },
    { 
      coins: 2500, 
      price: 200, 
      bonus: 500, 
      popular: false,
      icon: "💰",
      gradient: "from-green-400 to-green-600",
      emoji: "💚"
    },
    { 
      coins: 5000, 
      price: 400, 
      bonus: 1500, 
      popular: true,
      icon: "🔥",
      gradient: "from-purple-400 to-purple-600",
      emoji: "🔥"
    },
    { 
      coins: 10000, 
      price: 750, 
      bonus: 4000, 
      popular: false,
      icon: "👑",
      gradient: "from-yellow-400 to-yellow-600",
      emoji: "👑"
    },
  ];

  const purchaseCoinsMutation = useMutation({
    mutationFn: async ({ coins, nairaAmount }: { coins: number; nairaAmount: number }) => {
      return await apiRequest("POST", "/api/shop/purchase-coins", { coins, nairaAmount });
    },
    onSuccess: (data) => {
      toast({
        title: "Coins Purchased! 🪙",
        description: `You received ${data.coins} coins!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsPurchaseDialogOpen(false);
      setCustomAmount("");
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
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const giftCoinsMutation = useMutation({
    mutationFn: async ({ recipientId, coins }: { recipientId: string; coins: number }) => {
      return await apiRequest("POST", "/api/shop/gift-coins", { recipientId, coins });
    },
    onSuccess: (data) => {
      toast({
        title: "Gift Sent! 🎁",
        description: `You gifted ${data.coins} coins to ${data.recipientName}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsGiftDialogOpen(false);
      setGiftAmount("");
      setGiftRecipient("");
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
        title: "Gift Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchasePackage = (pkg: any) => {
    const currentBalance = typeof balance === 'object' ? balance.balance : balance;
    if (currentBalance < pkg.price) {
      toast({
        title: "Insufficient Balance",
        description: "Please deposit more Naira to purchase this package.",
        variant: "destructive",
      });
      return;
    }

    const totalCoins = pkg.coins + pkg.bonus;
    purchaseCoinsMutation.mutate({ 
      coins: totalCoins, 
      nairaAmount: pkg.price 
    });
  };

  const handleCustomPurchase = () => {
    const nairaAmount = parseFloat(customAmount);
    const currentBalance = typeof balance === 'object' ? balance.balance : balance;

    if (!nairaAmount || nairaAmount < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase is ₦50",
        variant: "destructive",
      });
      return;
    }

    if (currentBalance < nairaAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Please deposit more Naira to purchase coins.",
        variant: "destructive",
      });
      return;
    }

    // Exchange rate: 1 Naira = 10 coins
    const coins = nairaAmount * 10;
    purchaseCoinsMutation.mutate({ coins, nairaAmount });
  };

  const handleGiftCoins = () => {
    const coins = parseInt(giftAmount);
    const currentCoins = typeof balance === 'object' ? balance.coins || 0 : 0;

    if (!coins || coins < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum gift is 100 coins",
        variant: "destructive",
      });
      return;
    }

    if (currentCoins < coins) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins to gift.",
        variant: "destructive",
      });
      return;
    }

    const recipient = users.find((u: any) => 
      u.username === giftRecipient || u.firstName === giftRecipient || u.id === giftRecipient
    );

    if (!recipient) {
      toast({
        title: "User Not Found",
        description: "Please enter a valid username or user ID.",
        variant: "destructive",
      });
      return;
    }

    giftCoinsMutation.mutate({ recipientId: recipient.id, coins });
  };

  if (!user) return null;

  const currentBalance = typeof balance === 'object' ? (balance.balance || 0) : (balance || 0);
  const currentCoins = typeof balance === 'object' ? (balance.coins || 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


      {/* Clean shop design */}
      <div className="relative max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Coin Shop
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Purchase coins to participate in challenges and eventse! 🚀
          </p>
        </div>

        {/* Balance Cards with glassmorphism */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-xs text-purple-200 mb-1">Naira Balance</p>
              <p className="text-lg font-bold text-white">
                {formatBalance(currentBalance)}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🪙</span>
              </div>
              <p className="text-xs text-purple-200 mb-1">Coins</p>
              <p className="text-lg font-bold text-white">
                {currentCoins.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Coin Packages - TikTok Gift Style Grid */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            Choose Your Power-Up 🔥
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {coinPackages.map((pkg, index) => (
              <div
                key={index}
                className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                  pkg.popular ? 'ring-2 ring-pink-400 ring-opacity-60' : ''
                }`}
                onClick={() => handlePurchasePackage(pkg)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      🔥 HOT
                    </Badge>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${pkg.gradient} rounded-3xl p-4 text-center text-white relative overflow-hidden`}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-white/10 rounded-3xl"></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-4xl mb-2">{pkg.icon}</div>
                    <div className="text-lg font-bold mb-1">
                      {pkg.coins.toLocaleString()}
                    </div>
                    <div className="text-xs opacity-80 mb-2">coins</div>

                    {pkg.bonus > 0 && (
                      <div className="bg-white/20 rounded-full px-2 py-1 text-xs font-medium mb-2">
                        +{pkg.bonus.toLocaleString()} bonus!
                      </div>
                    )}

                    <div className="bg-white/20 rounded-2xl px-3 py-2">
                      <div className="text-sm font-bold">
                        {formatBalance(pkg.price)}
                      </div>
                    </div>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Amount Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 text-center">
            Custom Amount 💎
          </h3>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter amount (min ₦50)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder-purple-200 rounded-2xl h-12 text-center backdrop-blur"
                min="50"
              />
            </div>

            {customAmount && (
              <div className="text-center">
                <div className="bg-purple-500/30 rounded-2xl p-3 border border-purple-400/50">
                  <p className="text-purple-100 text-sm mb-1">You'll receive:</p>
                  <p className="text-white font-bold text-lg">
                    {(parseFloat(customAmount) * 10).toLocaleString()} coins 🪙
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleCustomPurchase}
              disabled={!customAmount || purchaseCoinsMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg"
            >
              {purchaseCoinsMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Buy Coins
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Gift Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 text-center flex items-center justify-center">
            <Gift className="w-5 h-5 mr-2 text-pink-400" />
            Send Gifts 🎁
          </h3>

          <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold shadow-lg">
                <Gift className="w-5 h-5 mr-2" />
                Send Gift to Friend
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-400/50 text-white rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-center text-xl flex items-center justify-center">
                  <span className="text-2xl mr-2">🎁</span>
                  Send Gift
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter username or user ID"
                    value={giftRecipient}
                    onChange={(e) => setGiftRecipient(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder-purple-200 rounded-2xl h-12 backdrop-blur"
                  />
                </div>

                <div>
                  <Input
                    type="number"
                    placeholder="Enter coin amount (min 100)"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder-purple-200 rounded-2xl h-12 text-center backdrop-blur"
                    min="100"
                  />
                  <p className="text-xs text-purple-200 text-center mt-2">
                    Your balance: {currentCoins.toLocaleString()} coins
                  </p>
                </div>

                <Button
                  onClick={handleGiftCoins}
                  disabled={!giftAmount || !giftRecipient || giftCoinsMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold"
                >
                  {giftCoinsMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      Send Gift
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}