import React from 'react';
import { View } from 'react-native';
import OnboardingFlow from '../components/OnboardingFlow';

interface OnboardingScreenProps {
  onComplete: () => void;
}

/**
 * OnboardingScreen - Full-screen onboarding wrapper
 * 
 * This screen handles the complete onboarding flow for new users,
 * including welcome, sign-in, sign-up, and approval screens.
 * 
 * @param onComplete - Callback when onboarding is completed successfully
 * 
 * @example
 * ```tsx
 * <OnboardingScreen onComplete={() => setIsOnboarded(true)} />
 * ```
 */
const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  return (
    <View style={styles.container}>
      <OnboardingFlow 
        onComplete={onComplete}
        onSignIn={onComplete} // For now, both sign-in and sign-up lead to completion
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
} as const;

export default OnboardingScreen;
