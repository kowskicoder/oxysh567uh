import { useAuth } from "@/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  

  useEffect(() => {
    setIsVisible(true);

    // Extract referral code from URL
    if (params.code) {
      setReferralCode(params.code);
      localStorage.setItem("referralCode", params.code);
      toast({
        title: "Referral Code Applied!",
        description: `You'll get bonus rewards when you sign up with code: ${params.code}`,
      });
    }

    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation, params.code, toast]);

  const handleGetStarted = () => {
    // Store referral code before authentication
    if (referralCode) {
      localStorage.setItem("referralCode", referralCode);
    }
    // Trigger Privy modal directly
    login();
  };

  // Fix: Add handleNavigation for logo click
  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  // Hero Mascot Characters with new assets
  const HeroMascots = () => (
    <div className="relative w-full flex justify-center items-center">
      {/* Main Central Character - Golden Trophy */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src="/assets/bantahblue.svg"
          alt="Trophy Character"
          className="w-28 h-28 object-contain filter drop-shadow-lg"
        />
      </motion.div>

      {/* Happy Chat Character - Left */}

      {/* Blue Bantah Mascot - Bottom Left */}
      <motion.div
        className="absolute -bottom-8 -left-8 z-15"
        animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      >
        <img
          src="/assets/chat_icon.png"
          alt="Blue Bantah Mascot"
          className="w-20 h-20 object-contain filter drop-shadow-md"
        />
      </motion.div>

      {/* Yellow Bantah Mascot - Right */}
      <motion.div
        className="absolute -right-12 bottom-2 z-15"
        animate={{ y: [0, -6, 0], rotate: [0, -8, 8, 0] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        <img
          src="/assets/bet_icon.png"
          alt="Yellow Bantah Mascot"
          className="w-14 h-14 object-contain filter drop-shadow-md"
        />
      </motion.div>
    </div>
  );

  // Floating elements with new images
  const FloatingElements = () => (
    <>
      <motion.img
        src="/assets/newbitcoin.png"
        alt="Bitcoin"
        className="absolute top-16 right-1/4 w-10 h-10 opacity-70"
        animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.img
        src="/assets/versus.svg"
        alt="VS Icon"
        className="absolute bottom-32 right-1/5 w-10 h-10 opacity-60"
        animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      />
      <motion.img
        src="/assets/footballicon.png"
        alt="Football"
        className="absolute top-40 left-1/6 w-8 h-8 opacity-50"
        animate={{ rotate: [0, -360], y: [0, -10, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-all duration-500">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
                <img
                  src="/assets/bantahblue.svg"
                  alt="Bantah Logo"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  Bantah
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                Explore
              </button>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                FAQ
              </button>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <Button
                onClick={handleGetStarted}
                size="sm"
                className="bg-[#7440ff] hover:bg-[#6538e6] text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Get started
              </Button>
            </div>

            {/* Mobile menu button and theme toggle */}
            <div className="flex items-center space-x-3 md:hidden">
              <Button
                size="sm"
                className="text-sm font-medium bg-[#7440ff] dark:bg-white text-white dark:text-gray-900"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Floating Elements */}
        <FloatingElements />

        <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-16 text-center">
          {/* Referral Code Banner */}
          {referralCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-4 mb-8 max-w-md mx-auto"
            >
              <div className="text-center">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  🎁 Referral Code Applied:{" "}
                  <span className="font-bold">{referralCode}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  You'll get bonus rewards when you sign up!
                </p>
              </div>
            </motion.div>
          )}

          {/* Hero Mascot Characters */}
          <div className="relative mb-12">
            <HeroMascots />
          </div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Welcome to Bantah v1.0
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join the community where predictions meet rewards.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                size="lg"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleGetStarted}
              >
                {referralCode ? "Sign Up with Bonus" : "Sign in"}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Auth handled by Privy modal (no local fallback) */}
    </div>
  );
}
