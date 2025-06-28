import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated
          return null;
        }
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const signOut = async () => {
    try {
      // First set user to null to prevent UI showing stale data
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Make logout request to server
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Clear all cached data
      queryClient.clear();
      
      // Force reload to ensure clean state
      window.location.replace("/");
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if logout fails, clear cache and redirect
      queryClient.clear();
      window.location.replace("/");
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
