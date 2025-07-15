import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '../hooks/useNotifications';
import { apiRequest } from '../lib/queryClient';

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
  const { updatePreferences, isRegistered } = useNotifications();

  // Fetch current preferences from backend
  const { data: currentPreferences, isLoading } = useQuery({
    queryKey: ['/api/notifications/preferences'],
    queryFn: () => apiRequest('GET', '/api/notifications/preferences'),
    retry: false,
  });

  // Update local state when backend preferences are loaded
  useEffect(() => {
    if (currentPreferences) {
      setPreferences({
        caseLikes: currentPreferences.caseLikes ?? true,
        caseComments: currentPreferences.caseComments ?? true,
        newFollowers: currentPreferences.newFollowers ?? true,
        caseApprovals: currentPreferences.caseApprovals ?? true,
        mentions: currentPreferences.mentions ?? true,
        weeklyDigest: currentPreferences.weeklyDigest ?? false,
        pushNotifications: currentPreferences.pushNotifications ?? true,
        emailNotifications: currentPreferences.emailNotifications ?? false,
      });
    }
  }, [currentPreferences]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updatePreferences(preferences);
      
      if (success) {
        Alert.alert('Settings saved', 'Your notification preferences have been updated.');
      } else {
        Alert.alert('Error', 'Failed to save notification preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const NotificationItem = ({ icon, title, description, prefKey }: { icon: any; title: string; description: string; prefKey: keyof typeof preferences }) => (
    <View style={styles.itemRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#4ECDC4" />
      </View>
      <View style={styles.itemTextBox}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDesc}>{description}</Text>
      </View>
      <Switch
        value={preferences[prefKey]}
        onValueChange={() => handleToggle(prefKey)}
        trackColor={{ false: '#E5E5EA', true: '#4ECDC4' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={28} color="#4ECDC4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Registration Status */}
        {__DEV__ && (
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Push Notification Status</Text>
            <View style={styles.statusItem}>
              <Ionicons 
                name={isRegistered ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={isRegistered ? "#4ECDC4" : "#FF6B6B"} 
              />
              <Text style={styles.statusText}>
                {isRegistered ? 'Push notifications are active' : 'Push notifications not registered'}
              </Text>
            </View>
          </View>
        )}
        
        {/* Activity Notifications */}
        <Text style={styles.sectionTitle}>Activity Notifications</Text>
        <NotificationItem icon="heart-outline" title="Case Likes" description="When someone likes your medical cases" prefKey="caseLikes" />
        <NotificationItem icon="chatbubble-outline" title="Case Comments" description="When someone comments on your cases" prefKey="caseComments" />
        <NotificationItem icon="checkmark-done-outline" title="Case Approvals" description="When your cases are approved by administrators" prefKey="caseApprovals" />
        {/* Social Notifications */}
        <Text style={styles.sectionTitle}>Social Notifications</Text>
        <NotificationItem icon="person-add-outline" title="New Followers" description="When other medical professionals follow you" prefKey="newFollowers" />
        <NotificationItem icon="at-outline" title="Mentions" description="When someone mentions you in comments" prefKey="mentions" />
        {/* Digest & Summary */}
        <Text style={styles.sectionTitle}>Digest & Summary</Text>
        <NotificationItem icon="calendar-outline" title="Weekly Digest" description="Weekly summary of interesting cases and activity" prefKey="weeklyDigest" />
        {/* Delivery Methods */}
        <Text style={styles.sectionTitle}>Delivery Methods</Text>
        <NotificationItem icon="notifications-outline" title="Push Notifications" description="Receive notifications on your mobile device" prefKey="pushNotifications" />
        <NotificationItem icon="mail-outline" title="Email Notifications" description="Receive notifications via email" prefKey="emailNotifications" />
        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Preferences'}</Text>
        </TouchableOpacity>
        <Text style={styles.infoText}>
          You can change these settings at any time. Some notifications may be required for security purposes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
    marginTop: 24,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextBox: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  itemDesc: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 16,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
});