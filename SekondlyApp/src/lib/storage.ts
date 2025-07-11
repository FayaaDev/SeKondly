import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility for persisting data using AsyncStorage
 * 
 * Features:
 * - Type-safe storage operations
 * - Error handling with fallbacks
 * - JSON serialization/deserialization
 * - Consistent key prefixing
 * - Batch operations for performance
 * 
 * @example
 * ```tsx
 * // Store user data
 * await StorageService.setUser(userData);
 * 
 * // Get user data
 * const user = await StorageService.getUser();
 * 
 * // Store auth token
 * await StorageService.setAuthToken('jwt-token-here');
 * ```
 */

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: '@MedConnect:auth_token',
  USER_DATA: '@MedConnect:user_data',
  APP_SETTINGS: '@MedConnect:app_settings',
  SEARCH_HISTORY: '@MedConnect:search_history',
  FAVORITES_CACHE: '@MedConnect:favorites_cache',
  NOTIFICATIONS_CACHE: '@MedConnect:notifications_cache',
  DRAFT_CASE: '@MedConnect:draft_case',
  ONBOARDING_COMPLETED: '@MedConnect:onboarding_completed',
  LOGOUT_TIMESTAMP: '@MedConnect:logout_timestamp',
} as const;

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    caseUpdates: boolean;
    comments: boolean;
    followers: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
    showInstitution: boolean;
  };
  disclaimer: {
    hideDisclaimer: boolean;
  };
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  specialty?: string;
}

interface DraftCase {
  title?: string;
  description?: string;
  format?: 'short' | 'long';
  specialty?: string;
  images?: string[];
  timestamp: number;
  history?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  drugHistory?: string;
  systemicReview?: string;
  examination?: string;
  management?: string;
}

export class StorageService {
  /**
   * Generic method to store any JSON-serializable data
   */
  private static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to retrieve JSON data
   */
  private static async getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item from storage
   */
  private static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // Authentication Methods
  static async setAuthToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  static async getAuthToken(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
  }

  static async removeAuthToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // User Data Methods
  static async setUser(user: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_DATA, user);
  }

  static async getUser(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.USER_DATA);
  }

  static async removeUser(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // Logout Timestamp Methods
  static async setLogoutTimestamp(timestamp: number): Promise<void> {
    return this.setItem(STORAGE_KEYS.LOGOUT_TIMESTAMP, timestamp);
  }

  static async getLogoutTimestamp(): Promise<number | null> {
    return this.getItem<number>(STORAGE_KEYS.LOGOUT_TIMESTAMP);
  }

  static async removeLogoutTimestamp(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.LOGOUT_TIMESTAMP);
  }

  // App Settings Methods
  static async setAppSettings(settings: AppSettings): Promise<void> {
    return this.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  static async getAppSettings(): Promise<AppSettings | null> {
    const defaultSettings: AppSettings = {
      theme: 'system',
      notifications: {
        pushEnabled: true,
        emailEnabled: true,
        caseUpdates: true,
        comments: true,
        followers: true,
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showInstitution: true,
      },
      disclaimer: {
        hideDisclaimer: false,
      },
    };
    
    const settings = await this.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
    if (!settings) return defaultSettings;
    
    // Merge with defaults to ensure all properties are present
    return {
      ...defaultSettings,
      ...settings,
      notifications: {
        ...defaultSettings.notifications,
        ...settings.notifications,
      },
      privacy: {
        ...defaultSettings.privacy,
        ...settings.privacy,
      },
      disclaimer: {
        ...defaultSettings.disclaimer,
        ...settings.disclaimer,
      },
    };
  }

  // Search History Methods
  static async addSearchHistory(item: SearchHistoryItem): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      const updatedHistory = [item, ...history.filter(h => h.query !== item.query)].slice(0, 10); // Keep last 10 searches
      return this.setItem(STORAGE_KEYS.SEARCH_HISTORY, updatedHistory);
    } catch (error) {
      console.error('Error adding search history:', error);
    }
  }

  static async getSearchHistory(): Promise<SearchHistoryItem[]> {
    const history = await this.getItem<SearchHistoryItem[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
    return history || [];
  }

  static async clearSearchHistory(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  }

  // Favorites Cache Methods (for offline access)
  static async setFavoritesCache(favorites: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.FAVORITES_CACHE, {
      data: favorites,
      timestamp: Date.now(),
    });
  }

  static async getFavoritesCache(): Promise<{ data: any[]; timestamp: number } | null> {
    return this.getItem(STORAGE_KEYS.FAVORITES_CACHE);
  }

  // Notifications Cache Methods
  static async setNotificationsCache(notifications: any[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.NOTIFICATIONS_CACHE, {
      data: notifications,
      timestamp: Date.now(),
    });
  }

  static async getNotificationsCache(): Promise<{ data: any[]; timestamp: number } | null> {
    return this.getItem(STORAGE_KEYS.NOTIFICATIONS_CACHE);
  }

  // Draft Case Methods (for saving work in progress)
  static async setDraftCase(draft: DraftCase): Promise<void> {
    return this.setItem(STORAGE_KEYS.DRAFT_CASE, {
      ...draft,
      timestamp: Date.now(),
    });
  }

  static async getDraftCase(): Promise<DraftCase | null> {
    return this.getItem<DraftCase>(STORAGE_KEYS.DRAFT_CASE);
  }

  static async removeDraftCase(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.DRAFT_CASE);
  }

  // Onboarding Methods
  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    return this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  }

  static async getOnboardingCompleted(): Promise<boolean> {
    const completed = await this.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
    return completed || false;
  }

  // Utility Methods
  static async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  static async getStorageInfo(): Promise<{ keys: string[]; size: string }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const medConnectKeys = keys.filter(key => key.startsWith('@MedConnect:'));
      
      // Calculate approximate size
      let totalSize = 0;
      for (const key of medConnectKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return {
        keys: medConnectKeys,
        size: `${(totalSize / 1024).toFixed(2)} KB`,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { keys: [], size: '0 KB' };
    }
  }

  // Batch operations for performance
  static async batchSet(items: Array<{ key: keyof typeof STORAGE_KEYS; value: any }>): Promise<void> {
    try {
      const keyValuePairs: [string, string][] = items.map(item => [
        STORAGE_KEYS[item.key],
        JSON.stringify(item.value)
      ]);
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error in batch set:', error);
      throw error;
    }
  }

  static async batchGet(keys: Array<keyof typeof STORAGE_KEYS>): Promise<Record<string, any>> {
    try {
      const storageKeys = keys.map(key => STORAGE_KEYS[key]);
      const keyValuePairs = await AsyncStorage.multiGet(storageKeys);
      
      const result: Record<string, any> = {};
      keyValuePairs.forEach(([key, value]) => {
        if (value) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error in batch get:', error);
      return {};
    }
  }

  // Complete logout method
  static async clearAllAuthData(): Promise<void> {
    try {
      const authKeys = [
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.FAVORITES_CACHE,
        STORAGE_KEYS.NOTIFICATIONS_CACHE,
        STORAGE_KEYS.SEARCH_HISTORY,
        // Note: Don't clear LOGOUT_TIMESTAMP here - we need it for protection
      ];
      
      // Use batch removal for performance
      await AsyncStorage.multiRemove(authKeys);
      console.log('All authentication data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Fallback to individual removals
      try {
        await Promise.all([
          this.removeAuthToken(),
          this.removeUser(),
          this.clearSearchHistory(),
          this.setFavoritesCache([]),
          this.setNotificationsCache([]),
        ]);
      } catch (fallbackError) {
        console.error('Fallback clear failed:', fallbackError);
      }
    }
  }
}

export default StorageService;
