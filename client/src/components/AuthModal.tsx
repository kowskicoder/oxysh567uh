import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, Mail } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, ready, authenticated } = usePrivy();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Detect referral code from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode && refCode !== 'undefined') {
      setReferralCode(refCode);
    }

    // Also check localStorage
    const storedCode = localStorage.getItem('referralCode');
    if (storedCode && storedCode !== 'undefined') {
      setReferralCode(storedCode);
    }
  }, []);

  // Close modal when authenticated
  useEffect(() => {
    if (authenticated) {
      onClose();
    }
  }, [authenticated, onClose]);

  const getTitle = () => "Welcome to Bantah";
  const getDescription = () => "Join the community where predictions meet rewards";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-w-xs p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header with floating decorative elements */}
        <div className="relative p-4 sm:p-6 text-center overflow-hidden">
          {/* Decorative floating elements - smaller for mobile */}
          <div className="absolute -top-4 -right-4 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl opacity-20 blur-sm"></div>
          <div className="absolute -top-2 -left-6 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-xl opacity-30"></div>
          <div className="absolute -bottom-6 -right-8 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl opacity-25"></div>
          <div className="absolute -bottom-4 -left-4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-red-400 to-red-500 rounded-lg opacity-35"></div>
          <div className="absolute top-1/2 -right-6 w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20"></div>
          <div className="absolute top-1/3 -left-6 w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg opacity-25"></div>

          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 relative z-10">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400 relative z-10">
            {getDescription()}
          </DialogDescription>
        </div>

        {/* Dynamic Content */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Referral Code Banner */}
          {referralCode && (
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="text-center">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  🎁 Referral Code Applied:{" "}
                  <span className="font-bold">{referralCode}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  You'll get bonus rewards when you sign up!
                </p>
              </div>
            </div>
          )}

          {/* Login Options */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={() => login()}
              disabled={!ready}
              className="w-full bg-[#7440ff] hover:bg-[#6538e6] text-white rounded-xl py-3 text-sm font-medium"
            >
              {!ready ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Continue with Email
            </Button>

            <Button
              onClick={() => login()}
              disabled={!ready}
              className="w-full bg-black dark:bg-gray-800 border border-black dark:border-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-700 rounded-xl py-3 text-sm font-medium"
            >
              {!ready ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              Connect Wallet
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed px-2">
            By continuing you agree to our{" "}
            <span className="underline cursor-pointer">Terms</span> and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}