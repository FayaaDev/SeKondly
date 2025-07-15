import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService from '../services/NotificationService';
import { useAuth } from './useAuth';
import { queryClient } from '../lib/queryClient';

/**
 * useNotifications - Hook for managing push notifications
 * 
 * Features:
 * - Automatic notification setup when user is authenticated
 * - Token registration with backend
 * - Notification listeners management
 * - Permission handling
 * 
 * @returns notification management utilities
 */
export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Register for notifications when user is authenticated and approved
  const registerForNotifications = useCallback(async () => {
    if (!user?.isApproved) {
      console.log('User not approved, skipping notification registration');
      return;
    }

    try {
      setError(null);
      
      // Get push token
      const token = await NotificationService.registerForPushNotifications();
      
      if (token) {
        setPushToken(token);
        
        // Register token with backend
        const success = await NotificationService.registerTokenWithBackend(user.id, token);
        setIsRegistered(success);
        
        if (success) {
          console.log('Successfully registered for push notifications');
        } else {
          setError('Failed to register token with backend');
        }
      } else {
        setError('Failed to get push notification token');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error setting up notifications:', err);
    }
  }, [user]);

  // Update notification preferences
  const updatePreferences = useCallback(async (preferences: Record<string, boolean>) => {
    try {
      const success = await NotificationService.updatePreferences(preferences);
      if (success) {
        // Invalidate preferences query to refresh UI
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      }
      return success;
    } catch (err) {
      console.error('Error updating preferences:', err);
      return false;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        // Invalidate notification queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      }
      return success;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  // Setup notification listeners
  useEffect(() => {
    if (!user?.isApproved) return;

    const listeners = NotificationService.setupNotificationListeners();

    return () => {
      NotificationService.removeNotificationListeners(listeners);
    };
  }, [user?.isApproved]);

  // Auto-register when user becomes available and approved
  useEffect(() => {
    if (user?.isApproved && !isRegistered && !pushToken) {
      registerForNotifications();
    }
  }, [user?.isApproved, isRegistered, pushToken, registerForNotifications]);

  return {
    pushToken,
    isRegistered,
    error,
    registerForNotifications,
    updatePreferences,
    markAsRead,
  };
}
