import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiRequest } from '../lib/queryClient';

/**
 * NotificationService - Handles push notification setup and management
 * 
 * Features:
 * - Register for push notifications
 * - Get push token
 * - Handle notification permissions
 * - Send tokens to backend
 * - Configure notification handlers
 */

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  private constructor() {
    this.setupAndroidChannel();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Setup Android notification channel
   */
  private async setupAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4ECDC4',
        sound: 'default',
      });
    }
  }

  /**
   * Register for push notifications and get token
   */
  public async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for push notifications');
        return null;
      }

      // Get project ID from app config
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found in app config');
        return null;
      }

      // Get push token
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = pushTokenData.data;
      console.log('Push token obtained:', this.pushToken);

      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Send push token to backend
   */
  public async registerTokenWithBackend(userId: string, token: string): Promise<boolean> {
    try {
      await apiRequest('POST', '/api/notifications/register-token', {
        userId,
        token,
        platform: Platform.OS,
      });
      
      console.log('Token registered with backend successfully');
      return true;
    } catch (error) {
      console.error('Error registering token with backend:', error);
      return false;
    }
  }

  /**
   * Update notification preferences on backend
   */
  public async updatePreferences(preferences: Record<string, boolean>): Promise<boolean> {
    try {
      await apiRequest('PUT', '/api/notifications/preferences', preferences);
      console.log('Notification preferences updated');
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: number): Promise<boolean> {
    try {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Get current push token
   */
  public getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Setup notification listeners
   */
  public setupNotificationListeners() {
    // Listener for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can handle the notification here (e.g., show custom UI)
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      
      // Handle navigation based on notification data
      const notificationData = response.notification.request.content.data;
      this.handleNotificationPress(notificationData);
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  /**
   * Handle notification press navigation
   */
  private handleNotificationPress(data: any) {
    // This would typically use your navigation service
    // to navigate to the appropriate screen based on notification type
    console.log('Handling notification press with data:', data);
    
    // Example: Navigate based on notification type
    switch (data?.type) {
      case 'case_like':
      case 'case_comment':
        // Navigate to case details
        break;
      case 'new_follower':
        // Navigate to profile
        break;
      case 'case_approval':
        // Navigate to my cases
        break;
      default:
        // Navigate to notifications screen
        break;
    }
  }

  /**
   * Remove notification listeners
   */
  public removeNotificationListeners(listeners: {
    notificationListener: Notifications.Subscription;
    responseListener: Notifications.Subscription;
  }) {
    listeners.notificationListener.remove();
    listeners.responseListener.remove();
  }
}

export default NotificationService.getInstance();
