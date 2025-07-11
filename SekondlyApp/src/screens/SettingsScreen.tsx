import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StorageService from "../lib/storage";
import { CacheManager, SearchManager } from "../lib/queryClient";

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

/**
 * SettingsScreen - Manage app settings and storage
 * 
 * Features:
 * - Notification preferences
 * - Privacy settings
 * - Cache management
 * - Search history management
 * - Storage usage information
 * 
 * @example
 * ```tsx
 * <SettingsScreen />
 * ```
 */
export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ keys: string[]; size: string }>({ keys: [], size: '0 KB' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const appSettings = await StorageService.getAppSettings();
      setSettings(appSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await StorageService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    try {
      await StorageService.setAppSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleNotification = (key: keyof AppSettings['notifications']) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    updateSettings(newSettings);
  };

  const togglePrivacy = (key: keyof AppSettings['privacy']) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key],
      },
    };
    updateSettings(newSettings);
  };

  const clearSearchHistory = async () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear your search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await SearchManager.clearHistory();
              Alert.alert('Success', 'Search history cleared');
              loadStorageInfo();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear search history');
            }
          },
        },
      ]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear cached data for favorites and notifications. You may need to refresh the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await CacheManager.clearCache();
              Alert.alert('Success', 'Cache cleared');
              loadStorageInfo();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will sign you out and remove all locally stored data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Success', 'All data cleared. Please restart the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear all data');
            }
          },
        },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications</Text>
            </View>
            <Switch
              value={settings.notifications.pushEnabled}
              onValueChange={() => toggleNotification('pushEnabled')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive email notifications</Text>
            </View>
            <Switch
              value={settings.notifications.emailEnabled}
              onValueChange={() => toggleNotification('emailEnabled')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Case Updates</Text>
              <Text style={styles.settingDescription}>Notify about case updates</Text>
            </View>
            <Switch
              value={settings.notifications.caseUpdates}
              onValueChange={() => toggleNotification('caseUpdates')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Comments</Text>
              <Text style={styles.settingDescription}>Notify about new comments</Text>
            </View>
            <Switch
              value={settings.notifications.comments}
              onValueChange={() => toggleNotification('comments')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Followers</Text>
              <Text style={styles.settingDescription}>Notify about new followers</Text>
            </View>
            <Switch
              value={settings.notifications.followers}
              onValueChange={() => toggleNotification('followers')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Profile Visible</Text>
              <Text style={styles.settingDescription}>Make your profile visible to others</Text>
            </View>
            <Switch
              value={settings.privacy.profileVisible}
              onValueChange={() => togglePrivacy('profileVisible')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Show Email</Text>
              <Text style={styles.settingDescription}>Display email on profile</Text>
            </View>
            <Switch
              value={settings.privacy.showEmail}
              onValueChange={() => togglePrivacy('showEmail')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Show Institution</Text>
              <Text style={styles.settingDescription}>Display institution on profile</Text>
            </View>
            <Switch
              value={settings.privacy.showInstitution}
              onValueChange={() => togglePrivacy('showInstitution')}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage & Data</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Storage Used</Text>
            <Text style={styles.infoValue}>{storageInfo.size}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Stored Items</Text>
            <Text style={styles.infoValue}>{storageInfo.keys.length}</Text>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={clearSearchHistory}>
            <Ionicons name="search" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Clear Search History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={clearAllData}>
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  section: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#8E8E93",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#000000",
  },
  infoValue: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: "#FF3B30",
  },
});
