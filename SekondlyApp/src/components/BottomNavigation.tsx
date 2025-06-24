import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Tab = "feed" | "mycases" | "favorites" | "notifications" | "profile";

interface BottomNavigationProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  notificationCount?: number;
}

/**
 * iOS-native bottom navigation component with tab switching functionality.
 * Features notification badges, proper iOS styling, and accessibility support.
 * 
 * @example
 * ```tsx
 * <BottomNavigation
 *   currentTab={currentTab}
 *   onTabChange={setCurrentTab}
 *   notificationCount={5}
 * />
 * ```
 */
export default function BottomNavigation({ 
  currentTab, 
  onTabChange, 
  notificationCount = 0 
}: BottomNavigationProps) {
  const tabs = [
    { 
      id: "feed" as Tab, 
      icon: "home" as keyof typeof Ionicons.glyphMap, 
      label: "Feed",
      accessibilityLabel: "Navigate to Feed tab"
    },
    { 
      id: "mycases" as Tab, 
      icon: "document-text" as keyof typeof Ionicons.glyphMap, 
      label: "My Cases",
      accessibilityLabel: "Navigate to My Cases tab"
    },
    { 
      id: "favorites" as Tab, 
      icon: "heart" as keyof typeof Ionicons.glyphMap, 
      label: "Favorites",
      accessibilityLabel: "Navigate to Favorites tab"
    },
    { 
      id: "notifications" as Tab, 
      icon: "notifications" as keyof typeof Ionicons.glyphMap, 
      label: "Notifications",
      accessibilityLabel: `Navigate to Notifications tab${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`
    },
    { 
      id: "profile" as Tab, 
      icon: "person" as keyof typeof Ionicons.glyphMap, 
      label: "Profile",
      accessibilityLabel: "Navigate to Profile tab"
    },
  ];

  const handleTabPress = (tab: Tab) => {
    if (currentTab !== tab) {
      onTabChange(tab);
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map(({ id, icon, label, accessibilityLabel }) => {
        const isActive = currentTab === id;
        const hasNotificationBadge = id === "notifications" && notificationCount > 0;
        
        return (
          <TouchableOpacity
            key={id}
            style={styles.tabButton}
            onPress={() => handleTabPress(id)}
            activeOpacity={0.6}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={icon}
                size={24}
                color={isActive ? "#4ECDC4" : "#8E8E93"}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              
              {/* Notification Badge */}
              {hasNotificationBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    paddingBottom: 20, // Safe area padding for iPhone home indicator
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
