import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';

/**
 * NotificationSetup - Component to handle push notification setup
 * 
 * This component automatically sets up push notifications when the user
 * is authenticated and approved. It's designed to be used once in the app.
 * 
 * Features:
 * - Automatic notification registration for approved users
 * - Error handling and user feedback
 * - Background setup (no visible UI)
 */
export function NotificationSetup() {
  const { user } = useAuth();
  const { isRegistered, error, registerForNotifications } = useNotifications();

  useEffect(() => {
    // Only show error alerts in development
    if (__DEV__ && error) {
      Alert.alert(
        'Notification Setup Error',
        error,
        [{ text: 'OK' }]
      );
    }
  }, [error]);

  useEffect(() => {
    // Log registration status in development
    if (__DEV__) {
      console.log('Notification setup status:', {
        userApproved: user?.isApproved,
        isRegistered,
        error,
      });
    }
  }, [user?.isApproved, isRegistered, error]);

  // This component doesn't render anything visible in production
  if (!__DEV__) {
    return null;
  }

  // Show setup status in development builds
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Push Notifications</Text>
      <Text style={styles.status}>
        User Approved: {user?.isApproved ? '✅' : '❌'}
      </Text>
      <Text style={styles.status}>
        Notifications Registered: {isRegistered ? '✅' : '❌'}
      </Text>
      {error && (
        <Text style={styles.error}>
          Error: {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'monospace',
  },
});
