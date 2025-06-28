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
          // If API call fails, clear cached data and don't retry
          console.log('Auth API call failed with status:', response.status);
          if (response.status === 401) {
            console.log('401 Unauthorized - clearing cached data');
            await StorageService.removeAuthToken();
            await StorageService.removeUser();
          }
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
      
      // 1. Immediately set user to null to prevent UI issues
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // 2. Clear all local storage and cache immediately  
      await StorageService.clearAllAuthData();
      await queryClient.clear();
      
      // 3. Then attempt server logout (don't wait for it)
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(error => {
        console.log('Server logout failed (continuing anyway):', error);
      });
      
      console.log('Sign out completed - all local data cleared');
      
      // 4. Reset sign out state after a brief delay
      setTimeout(() => {
        setIsSigningOut(false);
      }, 500);
      
    } catch (error) {
      console.error("Sign out error:", error);
      // Ensure local state is always cleared even if something fails
      try {
        await StorageService.clearAllAuthData();
        queryClient.setQueryData(["/api/auth/user"], null);
        await queryClient.clear();
      } catch (clearError) {
        console.error("Error clearing local data:", clearError);
      }
      
      setTimeout(() => {
        setIsSigningOut(false);
      }, 500);
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
