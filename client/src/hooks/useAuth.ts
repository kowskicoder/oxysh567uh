import { usePrivy } from '@privy-io/react-auth';
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const { toast } = useToast();
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout: privyLogout 
  } = usePrivy();

  const logout = async () => {
    try {
      await privyLogout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return { 
    user: authenticated ? user : null, 
    isLoading: !ready,
    isAuthenticated: authenticated,
    login,
    logout,
    isLoggingOut: false,
  };
}