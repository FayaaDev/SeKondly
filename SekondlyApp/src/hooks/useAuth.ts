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
  const [logoutTimestamp, setLogoutTimestamp] = useState<number | null>(null);
  
  // Check for persistent logout timestamp on mount
  useEffect(() => {
    const checkLogoutTimestamp = async () => {
      const persistentLogoutTime = await StorageService.getLogoutTimestamp();
      if (persistentLogoutTime) {
        setLogoutTimestamp(persistentLogoutTime);
      }
    };
    checkLogoutTimestamp();
  }, []);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async (): Promise<User | null> => {
      // Always check for recent logout first
      const now = Date.now();
      const persistentLogoutTime = await StorageService.getLogoutTimestamp();
      const recentLogout = (logoutTimestamp && (now - logoutTimestamp) < 5000) || 
                          (persistentLogoutTime && (now - persistentLogoutTime) < 5000);
      
      if (isSigningOut || recentLogout) {
        console.log('useAuth: Skipping fetch - recent logout or signing out');
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
        // Only cache and return user data if we're not in a recent logout state
        const stillRecentLogout = await StorageService.getLogoutTimestamp();
        if (stillRecentLogout && (now - stillRecentLogout) < 5000) {
          console.log('useAuth: Ignoring user data due to recent logout');
          return null;
        }
        
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
    enabled: true, // Always enabled, but protection is in queryFn
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Disable focus refetch entirely
  });

  // Cache user data whenever it changes (but not during signout or recent logout)
  useEffect(() => {
    const handleUserChange = async () => {
      const now = Date.now();
      const persistentLogoutTime = await StorageService.getLogoutTimestamp();
      const recentLogout = (logoutTimestamp && (now - logoutTimestamp) < 5000) || 
                          (persistentLogoutTime && (now - persistentLogoutTime) < 5000);
      
      if (user && !isSigningOut && !recentLogout) {
        console.log('useAuth: User data changed, caching:', { id: user.id, email: user.email });
        await StorageService.setUser(user);
        
        // Clear logout protection since user is successfully logged in
        if (persistentLogoutTime || logoutTimestamp) {
          await StorageService.removeLogoutTimestamp();
          setLogoutTimestamp(null);
          console.log('User logged in - clearing logout protection');
        }
      } else if (!user) {
        console.log('useAuth: User is null');
      } else if (recentLogout) {
        console.log('useAuth: Skipping cache - recent logout');
      }
    };
    
    handleUserChange();
  }, [user, isSigningOut, logoutTimestamp]);

  const signOut = async () => {
    try {
      console.log('useAuth: Starting signout process');
      const now = Date.now();
      setIsSigningOut(true);
      setLogoutTimestamp(now);
      
      // 1. Set persistent logout timestamp first (this persists across app restarts)
      await StorageService.setLogoutTimestamp(now);
      
      // 2. Immediately set user to null and disable all queries
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.cancelQueries({ queryKey: ["/api/auth/user"] });
      
      // 3. Clear all local storage and cache immediately  
      await StorageService.clearAllAuthData();
      await queryClient.clear();
      
      // 4. Then attempt server logout (don't wait for it since server may still be broken)
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(error => {
        console.log('Server logout failed (continuing anyway):', error);
      });
      
      console.log('Sign out completed - all local data cleared');
      
      // 5. Reset signing out state but keep logout timestamp for protection
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
      
      // 6. Clear the logout timestamp after longer delay to allow refetch later
      setTimeout(async () => {
        await StorageService.removeLogoutTimestamp();
        setLogoutTimestamp(null);
        console.log('Logout protection expired - auth queries re-enabled');
      }, 10000); // 10 seconds protection
      
    } catch (error) {
      console.error("Sign out error:", error);
      // Ensure local state is always cleared even if something fails
      try {
        const now = Date.now();
        setLogoutTimestamp(now);
        await StorageService.setLogoutTimestamp(now);
        queryClient.setQueryData(["/api/auth/user"], null);
        queryClient.cancelQueries({ queryKey: ["/api/auth/user"] });
        await StorageService.clearAllAuthData();
        await queryClient.clear();
      } catch (clearError) {
        console.error("Error clearing local data:", clearError);
      }
      
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
      
      setTimeout(async () => {
        await StorageService.removeLogoutTimestamp();
        setLogoutTimestamp(null);
      }, 10000);
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
