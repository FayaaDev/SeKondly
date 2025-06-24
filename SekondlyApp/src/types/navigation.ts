/**
 * Navigation types for React Navigation
 * 
 * Defines all the navigation stacks and their parameter types
 * for type-safe navigation throughout the app.
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AdminPanel: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  NewCase: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  CaseDetail: { caseId: string };
  PublicProfile: { userId: string };
  EditProfile: undefined;
};

export type SearchStackParamList = {
  SearchHome: undefined;
  SearchResults: { query: string; filters?: any };
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  NotificationDetail: { notificationId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
  DocumentUpload: undefined;
  ProfilePictureUpload: undefined;
};

// Re-export navigation prop types for convenience
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Root Stack Navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;

// Auth Stack Navigation
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AuthStackRouteProp<T extends keyof AuthStackParamList> = RouteProp<AuthStackParamList, T>;

// Main Tab Navigation
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type MainTabRouteProp<T extends keyof MainTabParamList> = RouteProp<MainTabParamList, T>;

// Home Stack Navigation
export type HomeStackNavigationProp = NativeStackNavigationProp<HomeStackParamList>;
export type HomeStackRouteProp<T extends keyof HomeStackParamList> = RouteProp<HomeStackParamList, T>;

// Navigation Hook Types
export type UseNavigationType = NavigationProp<RootStackParamList>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
