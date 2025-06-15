import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList, HomeStackParamList } from '../types/navigation';

// Import components directly
import OnboardingFlow from '../components/OnboardingFlow';
import FeedScreen from '../screens/FeedScreen';
import MyCasesScreen from '../screens/MyCasesScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import PendingVerificationScreen from '../screens/PendingVerificationScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

// HomeStackNavigator - Handles navigation within the Feed/Home tab
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen 
        name="Feed" 
        component={FeedScreen} 
      />
      <HomeStack.Screen 
        name="PublicProfile" 
        component={PublicProfileScreen} 
      />
    </HomeStack.Navigator>
  );
};

// Simple auth wrapper component
const AuthScreen: React.FC = () => {
  return (
    <OnboardingFlow
      onComplete={() => {
        // Navigation will be handled automatically by auth state change
      }}
      onSignIn={() => {
        // Navigation will be handled automatically by auth state change
      }}
    />
  );
};

// Simple main app wrapper component
const MainScreen: React.FC = () => {
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
            case 'MyCases':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Favorites':
              iconName = focused ? 'heart' : 'heart-outline';
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
        options={{ tabBarLabel: 'Feed' }}
      />
      <MainTab.Screen
        name="MyCases"
        component={MyCasesScreen}
        options={{ tabBarLabel: 'My Cases' }}
      />
      <MainTab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Favorites' }}
      />
      <MainTab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Notifications' }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </MainTab.Navigator>
  );
};

/**
 * RootNavigator - Main navigation container for the entire app
 * 
 * Handles the top-level navigation flow based on authentication state:
 * - Shows OnboardingFlow for unauthenticated users
 * - Shows MainScreen with tabs for authenticated users
 * - Shows PendingVerificationScreen for users awaiting approval
 * 
 * Features:
 * - Automatic navigation based on auth state
 * - Type-safe navigation with TypeScript
 * - Seamless transitions between auth states
 * - iOS-native tab bar styling
 */
const RootNavigator: React.FC = () => {
  const { user, isLoading, isVerificationPending } = useAuth();
  console.log('user:', user);

  if (isLoading) {
    // You could show a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {user ? (
          isVerificationPending ? (
            <RootStack.Screen
              name="PendingVerification"
              options={{
                gestureEnabled: false,
              }}
            >
              {() => (
                <PendingVerificationScreen
                  onCheckStatus={() => {
                    // TODO: Implement status check
                    console.log('Checking verification status...');
                  }}
                  userEmail={user.email || undefined}
                />
              )}
            </RootStack.Screen>
          ) : (
            <>
              <RootStack.Screen name="Main" component={MainScreen} />
              <RootStack.Screen name="AdminPanel" component={AdminPanelScreen} />
              <RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
              <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
            </>
          )
        ) : (
          <RootStack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              gestureEnabled: false,
            }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
