import { useNavigation as useReactNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../types/navigation';

/**
 * Custom navigation hook with type safety
 * 
 * Provides type-safe navigation methods for the app's navigation structure.
 * 
 * @returns Navigation object with type-safe methods
 * 
 * @example
 * ```tsx
 * const navigation = useNavigation();
 * navigation.navigate('Main');
 * ```
 */
export function useNavigation() {
  return useReactNavigation<RootStackNavigationProp>();
}

/**
 * Navigation utilities for common navigation patterns
 */
export const NavigationUtils = {
  /**
   * Navigate to the main app after authentication
   */
  goToMain: (navigation: RootStackNavigationProp) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  },

  /**
   * Navigate to authentication flow
   */
  goToAuth: (navigation: RootStackNavigationProp) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  },

  /**
   * Navigate to pending verification screen
   */
  goToPendingVerification: (navigation: RootStackNavigationProp, userEmail?: string) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'PendingVerification', params: { userEmail } }],
    });
  },
} as const;
