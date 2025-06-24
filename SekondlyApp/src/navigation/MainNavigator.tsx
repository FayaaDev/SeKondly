import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, HomeStackParamList } from '../types/navigation';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import { SearchModal } from '../components';
import NewCaseModal from '../components/NewCaseModal';
import ProfileModal from '../components/ProfileModal';

const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

/**
 * HomeStackNavigator - Stack navigator for Home tab
 */
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="Feed" component={HomeScreen} />
    </HomeStack.Navigator>
  );
};

// Screen wrappers for modal components
const SearchScreen: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  
  return (
    <SearchModal
      isOpen={isSearchOpen}
      onClose={() => setIsSearchOpen(false)}
      onSearch={(query: string) => {
        console.log('Search:', query);
        setIsSearchOpen(false);
      }}
    />
  );
};

const NewCaseScreen: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  return (
    <NewCaseModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
  );
};

const ProfileScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <ProfileModal
      visible={isVisible}
      onClose={() => setIsVisible(false)}
      userId={1} // TODO: Get from auth context
    />
  );
};

const NotificationsScreen: React.FC = () => {
  return <HomeScreen />; // Placeholder for now
};

/**
 * MainNavigator - Main tab navigation for authenticated users
 * 
 * Provides the core app navigation with bottom tabs:
 * - Home: Main feed and case browsing
 * - Search: Case search and filtering
 * - New Case: Create new medical case
 * - Notifications: App notifications
 * - Profile: User profile and settings
 * 
 * Features:
 * - iOS-native tab bar styling
 * - Badge support for notifications
 * - Type-safe navigation between tabs
 */
const MainNavigator: React.FC = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'NewCase':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <MainTab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      
      <MainTab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      
      <MainTab.Screen
        name="NewCase"
        component={NewCaseScreen}
        options={{
          tabBarLabel: 'New Case',
        }}
      />
      
      <MainTab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarBadge: undefined, // Can be set dynamically based on unread count
        }}
      />
      
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
};

export default MainNavigator;
