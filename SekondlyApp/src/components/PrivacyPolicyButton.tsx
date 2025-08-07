import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface PrivacyPolicyButtonProps {
  style?: any;
  textStyle?: any;
}

/**
 * PrivacyPolicyButton - Reusable button component for accessing privacy policy
 * 
 * This component renders a small button that opens the privacy policy modal
 * when pressed. It can be styled externally for different use cases.
 * 
 * @param style - Optional custom styles for the button container
 * @param textStyle - Optional custom styles for the button text
 * 
 * @example
 * ```tsx
 * <PrivacyPolicyButton 
 *   style={{ marginTop: 20 }}
 *   textStyle={{ fontSize: 14 }}
 * />
 * ```
 */
const PrivacyPolicyButton: React.FC<PrivacyPolicyButtonProps> = ({
  style,
  textStyle,
}) => {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={() => setShowPrivacyPolicy(true)}
      >
        <Text style={[styles.buttonText, textStyle]}>Privacy Policy</Text>
      </TouchableOpacity>

      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});

export default PrivacyPolicyButton;
