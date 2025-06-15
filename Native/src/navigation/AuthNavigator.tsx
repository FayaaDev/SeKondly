import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import OnboardingFlow from '../components/OnboardingFlow';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../types/navigation';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator - Navigation stack for authentication flows
 * 
 * Handles navigation between different authentication screens:
 * - Onboarding flow for new users
 * - Sign-in flow for existing users
 * 
 * Features:
 * - Seamless transitions between auth screens
 * - Type-safe navigation
 * - Integration with onboarding completion
 */
const AuthNavigator: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleOnboardingComplete = () => {
    // Navigation will be handled automatically by RootNavigator
    // based on updated auth state
  };

  const OnboardingScreen = () => (
    <OnboardingFlow
      onComplete={handleOnboardingComplete}
      onSignIn={handleOnboardingComplete}
    />
  );

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <AuthStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          gestureEnabled: false, // Disable swipe back on onboarding
        }}
      />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
