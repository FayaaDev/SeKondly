import { QueryClient } from "@tanstack/react-query";
import StorageService from "./storage";
import { API_BASE_URL } from "../config/api";

/**
 * Enhanced QueryClient with session-based authentication
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.message?.includes("Authentication failed")) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// API request helper function with session-based authentication
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: any
): Promise<any> {
  try {
    const isFormData = data instanceof FormData;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000); // 15 second timeout
    
    const config: RequestInit = {
      method,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
      credentials: "include", // Use session-based authentication
      signal: controller.signal, // Add abort signal
    };

    if (method !== "GET") {
      if (data) {
        config.body = isFormData ? data : JSON.stringify(data);
      } else {
        // For POST/PUT/DELETE requests without data, send empty JSON object
        config.body = JSON.stringify({});
      }
    }

    console.log('Request config:', {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: config.headers,
      hasBody: !!config.body
    });

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // Clear timeout on successful response
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response text:', errorText);
      
      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication failed");
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const result = await response.json();
      console.log('Response data:', result);
      return result;
    }
    const textResult = await response.text();
    console.log('Response text:', textResult);
    return textResult;
  } catch (error) {
    console.error("API request error:", error);
    
    // Handle abort error (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${method} ${url} took longer than 15 seconds`);
    }
    
    throw error;
  }
}

/**
 * Cache management utilities
 */
export class CacheManager {
  /**
   * Cache favorites data for offline access
   */
  static async cacheFavorites(favorites: any[]): Promise<void> {
    await StorageService.setFavoritesCache(favorites);
  }

  /**
   * Get cached favorites
   */
  static async getCachedFavorites(): Promise<any[] | null> {
    const cache = await StorageService.getFavoritesCache();
    if (!cache) return null;

    // Check if cache is still valid (less than 1 hour old)
    const isValid = Date.now() - cache.timestamp < 60 * 60 * 1000;
    return isValid ? cache.data : null;
  }

  /**
   * Cache notifications for offline access
   */
  static async cacheNotifications(notifications: any[]): Promise<void> {
    await StorageService.setNotificationsCache(notifications);
  }

  /**
   * Get cached notifications
   */
  static async getCachedNotifications(): Promise<any[] | null> {
    const cache = await StorageService.getNotificationsCache();
    if (!cache) return null;

    // Check if cache is still valid (less than 30 minutes old)
    const isValid = Date.now() - cache.timestamp < 30 * 60 * 1000;
    return isValid ? cache.data : null;
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    await StorageService.setFavoritesCache([]);
    await StorageService.setNotificationsCache([]);
  }
}

/**
 * Search history utilities
 */
export class SearchManager {
  /**
   * Add search query to history
   */
  static async addToHistory(query: string, specialty?: string): Promise<void> {
    if (query.trim().length < 2) return; // Don't save very short queries
    
    await StorageService.addSearchHistory({
      query: query.trim(),
      specialty,
      timestamp: Date.now(),
    });
  }

  /**
   * Get search suggestions based on history
   */
  static async getSearchSuggestions(input: string): Promise<string[]> {
    const history = await StorageService.getSearchHistory();
    return history
      .filter(item => item.query.toLowerCase().includes(input.toLowerCase()))
      .map(item => item.query)
      .slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Clear search history
   */
  static async clearHistory(): Promise<void> {
    await StorageService.clearSearchHistory();
  }
}
