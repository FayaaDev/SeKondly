import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "../types/schema";
import StorageService from "../lib/storage";
import { API_BASE_URL } from "../config/api";

interface AuthResponse {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthResponse {
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async (): Promise<User | null> => {
      if (isSigningOut) {
        console.log('useAuth: Skipping fetch during signout');
        return null;
      }
      
      try {
        // Check if we have cached user data first
        const cachedUser = await StorageService.getUser();
        
        // Always try to get user from API using session cookie
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
        });
        
        if (!response.ok) {
          // If API call fails, remove cached data
          console.log('Auth API call failed, clearing cached data');
          await StorageService.removeAuthToken();
          await StorageService.removeUser();
          return null;
        }
        
        const userData = await response.json();
        // Cache the user data
        await StorageService.setUser(userData);
        return userData;
      } catch (error) {
        console.error("Auth error:", error);
        // On error, clear cached data and return null
        await StorageService.removeAuthToken();
        await StorageService.removeUser();
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isSigningOut, // Don't refetch during signout
  });

  // Cache user data whenever it changes
  useEffect(() => {
    if (user) {
      console.log('useAuth: User data changed, caching:', { id: user.id, email: user.email });
      StorageService.setUser(user);
    } else {
      console.log('useAuth: User is null');
    }
  }, [user]);

  const signOut = async () => {
    try {
      console.log('useAuth: Starting signout process');
      setIsSigningOut(true);
      
      // First, set user to null immediately to prevent race conditions
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Clear all local storage first
      await StorageService.clearAllAuthData();
      
      // Then attempt server logout
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      // Clear all query cache to prevent any stale data
      await queryClient.clear();
      
      // Wait a bit before allowing refetch
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
      
      console.log('Sign out successful, cache cleared');
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if server logout fails, ensure local state is cleared
      await StorageService.clearAllAuthData();
      queryClient.setQueryData(["/api/auth/user"], null);
      await queryClient.clear();
      
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
      
      console.log('Sign out completed (local cleanup), cache cleared');
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
