import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff, Check, Loader2 } from "lucide-react";

interface MobileAuthFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userData: any) => void;
}

export function MobileAuthFlow({ isOpen, onClose, onComplete }: MobileAuthFlowProps) {
  const [step, setStep] = useState<"email" | "password" | "signup" | "verify">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    // Simulate API call to check if user exists
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const exists = Math.random() > 0.7; // Simulate user exists 30% of the time
      setUserExists(exists);
      setStep(exists ? "password" : "signup");
    } catch (error) {
      setStep("signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete({ email, type: "login" });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !password.trim()) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      onComplete({ email, firstName, lastName, type: "register" });
    } catch (error) {
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case "password":
      case "signup":
        setStep("email");
        break;
      case "verify":
        setStep("signup");
        break;
      default:
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {step === "email" && "Welcome"}
          {step === "password" && "Welcome back"}
          {step === "signup" && "Create account"}
          {step === "verify" && "Verify email"}
        </h1>
        
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center p-4">
        <div className="flex space-x-2">
          {["email", "password", "signup"].map((stepName, index) => (
            <div
              key={stepName}
              className={`h-2 w-8 rounded-full transition-colors ${
                (step === stepName || 
                 (stepName === "password" && step === "password") ||
                 (stepName === "signup" && (step === "signup" || step === "verify")))
                  ? "bg-blue-500" 
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 py-4">
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Join Bantah
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your email to get started
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                />

                <Button
                  onClick={handleEmailSubmit}
                  disabled={!email.trim() || isLoading}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>

              {/* Social Login */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <span>Google</span>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-12">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-black dark:bg-white rounded flex items-center justify-center">
                      <span className="text-white dark:text-black text-xs">🍎</span>
                    </div>
                    <span>Apple</span>
                  </div>
                </Button>
              </div>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base pr-12"
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>

                <Button
                  onClick={handlePasswordSubmit}
                  disabled={!password.trim() || isLoading}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <button className="w-full text-center text-sm text-blue-500 hover:text-blue-600">
                  Forgot your password?
                </button>
              </div>
            </motion.div>
          )}

          {step === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create account
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 text-base"
                  />
                  <Input
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>

                <Button
                  onClick={handleSignupSubmit}
                  disabled={!firstName.trim() || !lastName.trim() || !password.trim() || isLoading}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4">
                By creating an account, you agree to our{" "}
                <span className="underline">Terms of Service</span> and{" "}
                <span className="underline">Privacy Policy</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-6 bg-white dark:bg-gray-900" />
    </div>
  );
}