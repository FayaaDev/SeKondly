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
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Clear query cache and redirect
      queryClient.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if logout fails, clear cache and redirect
      queryClient.clear();
      window.location.href = "/";
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
