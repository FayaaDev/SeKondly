import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  /** Function to call when the button is pressed */
  onPress: () => void;
  /** Ionicons icon name to display (default: 'add') */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Size of the icon (default: 28) */
  size?: number;
  /** Color of the icon (default: '#FFFFFF') */
  color?: string;
  /** Background color of the button (default: '#4ECDC4') */
  backgroundColor?: string;
  /** Distance from bottom of screen (default: 100) */
  bottom?: number;
  /** Distance from right of screen (default: 20) */
  right?: number;
  /** Additional custom styles */
  style?: ViewStyle;
}

/**
 * A floating action button component with iOS-native styling.
 * Positioned absolutely and includes proper shadow/elevation.
 * 
 * @example
 * ```tsx
 * <FloatingActionButton
 *   onPress={() => setShowModal(true)}
 *   icon="add"
 *   backgroundColor="#4ECDC4"
 * />
 * ```
 */
export default function FloatingActionButton({ 
  onPress,
  icon = 'add',
  size = 28,
  color = '#FFFFFF',
  backgroundColor = '#4ECDC4',
  bottom = 100,
  right = 20,
  style
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor,
          bottom,
          right,
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
