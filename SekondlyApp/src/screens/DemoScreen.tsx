import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import OnboardingFlow from '../components/OnboardingFlow';
import HomeScreen from './HomeScreen';

/**
 * DemoScreen - Demo screen to showcase OnboardingFlow and main app
 * 
 * This screen allows switching between the onboarding flow and the main app
 * for demonstration purposes.
 */
const DemoScreen: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  if (showOnboarding && !hasCompletedOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setHasCompletedOnboarding(true);
          setShowOnboarding(false);
        }}
        onSignIn={() => {
          setHasCompletedOnboarding(true);
          setShowOnboarding(false);
        }}
      />
    );
  }

  if (!showOnboarding || hasCompletedOnboarding) {
    return (
      <View style={styles.container}>
        <HomeScreen />
        <SafeAreaView style={styles.demoControls}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => {
              setShowOnboarding(true);
              setHasCompletedOnboarding(false);
            }}
          >
            <Text style={styles.demoButtonText}>Show Onboarding</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return null;
};

const styles = {
  container: {
    flex: 1,
  },
  demoControls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
  },
  demoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
} as const;

export default DemoScreen;
