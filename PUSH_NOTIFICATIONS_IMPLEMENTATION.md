# Push Notifications Implementation Guide for SeKondly

## Overview

This document outlines the complete implementation of push notifications for the SeKondly React Native/Expo application. The system will handle notifications for case interactions, social features, and administrative updates.

## Architecture

- **Frontend**: Expo Notifications for React Native
- **Backend**: Node.js/Express with Expo Server SDK
- **Database**: PostgreSQL for storing tokens and preferences
- **Queue System**: Redis/Bull for reliable notification delivery (optional but recommended)

## 1. Frontend Implementation

### 1.1 Install Required Packages

```bash
cd SekondlyApp
npx expo install expo-notifications expo-device expo-constants
```

### 1.2 Create Notification Service

Create `SekondlyApp/src/services/NotificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async registerForPushNotifications(): Promise<string> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Failed to get push token for push notification!');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      throw new Error('Must use physical device for Push Notifications');
    }

    return token;
  }

  static async sendTokenToBackend(token: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notification-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          token,
          userId,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register notification token');
      }
    } catch (error) {
      console.error('Failed to send token to backend:', error);
      throw error;
    }
  }

  static async updateNotificationPreferences(preferences: any): Promise<void> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  static async getNotificationPreferences(): Promise<any> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notification-preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      throw error;
    }
  }

  static async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { notification } = response;
    const data = notification.request.content.data;

    // Handle different notification types
    switch (data?.type) {
      case 'case_like':
        // Navigate to specific case
        // NavigationService.navigate('CaseDetail', { caseId: data.caseId });
        break;
      case 'case_comment':
        // Navigate to case comments
        // NavigationService.navigate('CaseDetail', { caseId: data.caseId, scrollToComments: true });
        break;
      case 'new_follower':
        // Navigate to followers screen
        // NavigationService.navigate('Followers');
        break;
      case 'case_approval':
        // Navigate to user's cases
        // NavigationService.navigate('MyCases');
        break;
      default:
        // Default navigation or no action
        break;
    }
  }

  private static async getAuthToken(): Promise<string> {
    // TODO: Implement your actual auth token retrieval
    // This should get the token from AsyncStorage, SecureStore, or your auth context
    return 'your-auth-token';
  }
}
```

### 1.3 Update App.tsx

Add notification initialization to your main App component:

```typescript
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from './src/services/NotificationService';

export default function App() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    initializeNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      NotificationService.handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      const token = await NotificationService.registerForPushNotifications();
      const userId = 'current-user-id'; // Get from your auth context
      await NotificationService.sendTokenToBackend(token, userId);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  // ...rest of your App component
}
```

### 1.4 Update NotificationSettingsScreen

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '../services/NotificationService';

const initialPreferences = {
  caseLikes: true,
  caseComments: true,
  newFollowers: true,
  caseApprovals: true,
  mentions: true,
  weeklyDigest: false,
  pushNotifications: true,
  emailNotifications: false,
};

export default function NotificationSettingsScreen({ navigation }: any) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await NotificationService.getNotificationPreferences();
      setPreferences({ ...initialPreferences, ...savedPreferences });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await NotificationService.updateNotificationPreferences(preferences);
      Alert.alert('Settings saved', 'Your notification preferences have been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification preferences. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ...rest of your component remains the same
}
```

## 2. Backend Implementation

### 2.1 Install Required Packages

```bash
npm install @expo/server-sdk
```

### 2.2 Database Schema

Add these tables to your PostgreSQL database:

```sql
-- Notification tokens table
CREATE TABLE notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  case_likes BOOLEAN DEFAULT true,
  case_comments BOOLEAN DEFAULT true,
  new_followers BOOLEAN DEFAULT true,
  case_approvals BOOLEAN DEFAULT true,
  mentions BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification history table (optional, for tracking sent notifications)
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered'))
);

-- Indexes for better performance
CREATE INDEX idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX idx_notification_tokens_active ON notification_tokens(is_active);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_type ON notification_history(notification_type);
```

### 2.3 Create Notification Service (Backend)

Create `server/services/NotificationService.js`:

```javascript
const { Expo } = require('@expo/server-sdk');
const db = require('../db'); // Your database connection

class NotificationService {
  constructor() {
    this.expo = new Expo();
  }

  async registerToken(userId, token, platform) {
    try {
      await db.query(`
        INSERT INTO notification_tokens (user_id, token, platform)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, token) 
        DO UPDATE SET 
          is_active = true,
          updated_at = NOW()
      `, [userId, token, platform]);
    } catch (error) {
      console.error('Error registering notification token:', error);
      throw error;
    }
  }

  async updatePreferences(userId, preferences) {
    try {
      await db.query(`
        INSERT INTO notification_preferences (user_id, case_likes, case_comments, new_followers, case_approvals, mentions, weekly_digest, push_notifications, email_notifications)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id)
        DO UPDATE SET
          case_likes = $2,
          case_comments = $3,
          new_followers = $4,
          case_approvals = $5,
          mentions = $6,
          weekly_digest = $7,
          push_notifications = $8,
          email_notifications = $9,
          updated_at = NOW()
      `, [
        userId,
        preferences.caseLikes,
        preferences.caseComments,
        preferences.newFollowers,
        preferences.caseApprovals,
        preferences.mentions,
        preferences.weeklyDigest,
        preferences.pushNotifications,
        preferences.emailNotifications
      ]);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  async getPreferences(userId) {
    try {
      const result = await db.query(`
        SELECT * FROM notification_preferences WHERE user_id = $1
      `, [userId]);
      
      return result.rows[0] || {};
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  async getUserTokens(userId) {
    try {
      const result = await db.query(`
        SELECT token FROM notification_tokens 
        WHERE user_id = $1 AND is_active = true
      `, [userId]);
      
      return result.rows.map(row => row.token);
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }
  }

  async sendNotification(userIds, title, body, data = {}, notificationType = 'general') {
    try {
      // Get tokens for all users and check their preferences
      const tokensQuery = await db.query(`
        SELECT nt.token, nt.user_id
        FROM notification_tokens nt
        JOIN notification_preferences np ON nt.user_id = np.user_id
        WHERE nt.user_id = ANY($1) 
          AND nt.is_active = true 
          AND np.push_notifications = true
          AND ${this.getPreferenceCondition(notificationType)}
      `, [userIds]);

      const tokens = tokensQuery.rows.map(row => row.token).filter(token => Expo.isExpoPushToken(token));

      if (tokens.length === 0) {
        console.log('No valid tokens found for notification');
        return [];
      }

      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: { ...data, type: notificationType },
        badge: 1,
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          
          // Log notification history
          for (const userId of userIds) {
            await this.logNotification(userId, notificationType, title, body, data);
          }
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  getPreferenceCondition(notificationType) {
    const typeMap = {
      'case_like': 'np.case_likes = true',
      'case_comment': 'np.case_comments = true',
      'new_follower': 'np.new_followers = true',
      'case_approval': 'np.case_approvals = true',
      'mention': 'np.mentions = true',
      'weekly_digest': 'np.weekly_digest = true',
    };

    return typeMap[notificationType] || 'true';
  }

  async logNotification(userId, type, title, body, data) {
    try {
      await db.query(`
        INSERT INTO notification_history (user_id, notification_type, title, body, data)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, type, title, body, JSON.stringify(data)]);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Specific notification methods
  async sendCaseLikeNotification(caseOwnerId, likerName, caseName, caseId) {
    await this.sendNotification(
      [caseOwnerId],
      'Case Liked',
      `${likerName} liked your case: ${caseName}`,
      { caseId },
      'case_like'
    );
  }

  async sendCaseCommentNotification(caseOwnerId, commenterName, caseName, caseId) {
    await this.sendNotification(
      [caseOwnerId],
      'New Comment',
      `${commenterName} commented on your case: ${caseName}`,
      { caseId },
      'case_comment'
    );
  }

  async sendNewFollowerNotification(userId, followerName) {
    await this.sendNotification(
      [userId],
      'New Follower',
      `${followerName} started following you`,
      { type: 'new_follower' },
      'new_follower'
    );
  }

  async sendCaseApprovalNotification(userId, caseName, caseId) {
    await this.sendNotification(
      [userId],
      'Case Approved',
      `Your case "${caseName}" has been approved`,
      { caseId },
      'case_approval'
    );
  }

  async sendMentionNotification(userId, mentionerName, contextType, contextId) {
    await this.sendNotification(
      [userId],
      'You were mentioned',
      `${mentionerName} mentioned you in a ${contextType}`,
      { contextType, contextId },
      'mention'
    );
  }
}

module.exports = new NotificationService();
```

### 2.4 Add API Routes

Add to your `server/routes.ts`:

```typescript
import express from 'express';
import NotificationService from './services/NotificationService';

const router = express.Router();

// Register notification token
router.post('/api/notification-tokens', async (req, res) => {
  try {
    const { token, userId, platform } = req.body;
    // Get userId from auth middleware instead of request body in production
    const authenticatedUserId = req.user?.id || userId;
    
    await NotificationService.registerToken(authenticatedUserId, token, platform);
    res.json({ success: true });
  } catch (error) {
    console.error('Error registering notification token:', error);
    res.status(500).json({ error: 'Failed to register notification token' });
  }
});

// Update notification preferences
router.put('/api/notification-preferences', async (req, res) => {
  try {
    const userId = req.user?.id; // From auth middleware
    const preferences = req.body;
    
    await NotificationService.updatePreferences(userId, preferences);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Get notification preferences
router.get('/api/notification-preferences', async (req, res) => {
  try {
    const userId = req.user?.id; // From auth middleware
    
    const preferences = await NotificationService.getPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

export default router;
```

## 3. Integration Points

### 3.1 Case Interactions

Integrate notification triggers in your existing case-related endpoints:

```typescript
// When someone likes a case
router.post('/api/cases/:caseId/like', async (req, res) => {
  try {
    // ...existing like logic...
    
    // Send notification
    const case = await getCaseById(caseId);
    const liker = req.user;
    await NotificationService.sendCaseLikeNotification(
      case.userId,
      liker.name,
      case.title,
      caseId
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like case' });
  }
});

// When someone comments on a case
router.post('/api/cases/:caseId/comments', async (req, res) => {
  try {
    // ...existing comment logic...
    
    // Send notification
    const case = await getCaseById(caseId);
    const commenter = req.user;
    await NotificationService.sendCaseCommentNotification(
      case.userId,
      commenter.name,
      case.title,
      caseId
    );
    
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});
```

## 4. Testing

### 4.1 Development Testing

1. Use Expo Development Build on physical devices
2. Test notification permissions flow
3. Verify token registration
4. Test different notification types
5. Test notification preferences

### 4.2 Production Testing

1. Build production app with EAS Build
2. Test on both iOS and Android
3. Test with app in background/foreground
4. Test notification response handling
5. Monitor notification delivery rates

## 5. Environment Configuration

### 5.1 Add to app.json

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#4ECDC4",
      "sounds": [
        "./assets/notification-sound.wav"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4ECDC4"
        }
      ]
    ]
  }
}
```

### 5.2 Environment Variables

Add to your `.env` files:

```env
# .env.development
EXPO_PUBLIC_API_URL=http://localhost:5001

# .env.production
EXPO_PUBLIC_API_URL=https://api.sekondly.app
```

## 6. Deployment Considerations

### 6.1 Expo Application Services (EAS)

1. Configure EAS Build for production builds
2. Set up proper push notification credentials
3. Test with EAS Update for OTA updates

### 6.2 Monitoring

1. Implement notification analytics
2. Monitor delivery rates
3. Track user engagement with notifications
4. Set up error alerting for failed notifications

## 7. Future Enhancements

1. **Rich Notifications**: Add images, actions, and interactive elements
2. **Scheduled Notifications**: Weekly digests, reminders
3. **Notification Categories**: Allow users to customize notification sounds per type
4. **Analytics Integration**: Track notification performance
5. **A/B Testing**: Test different notification messages and timing

## 8. Security Considerations

1. Validate notification tokens before storing
2. Implement rate limiting for notification endpoints
3. Sanitize notification content
4. Use HTTPS for all API communications
5. Implement proper authentication for all notification endpoints

## 9. Performance Optimization

1. Use batching for multiple notifications
2. Implement queue system for high-volume notifications
3. Cache user preferences
4. Use database indexes for faster queries
5. Monitor and optimize notification delivery times

This implementation provides a robust foundation for push notifications in your SeKondly app, with room for future enhancements and scalability.
