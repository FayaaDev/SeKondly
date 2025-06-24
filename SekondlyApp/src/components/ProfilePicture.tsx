import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

interface ProfilePictureProps {
  imageUrl?: string | null;
  userName?: string;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

/**
 * ProfilePicture - Display user profile picture with fallback to initials
 * 
 * Features:
 * - Shows profile image when available
 * - Falls back to user initials
 * - Multiple size options
 * - Optional onPress handler
 * - iOS-native styling
 * 
 * @example
 * ```tsx
 * <ProfilePicture
 *   imageUrl={user.profileImageUrl}
 *   userName="John Doe"
 *   size="large"
 *   onPress={handleProfilePress}
 * />
 * ```
 */
export default function ProfilePicture({
  imageUrl,
  userName = '',
  size = 'medium',
  onPress,
}: ProfilePictureProps) {
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  // Helper function to get full image URL
  const getFullImageUrl = (imageUrl: string): string => {
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already a full URL
    }
    return `${API_BASE_URL}${imageUrl}`; // Convert relative URL to full URL
  };

  const textSizeStyles = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  };

  const containerStyle = [styles.container, sizeStyles[size]];
  const textStyle = [styles.initialsText, textSizeStyles[size]];

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={containerStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {imageUrl ? (
        <ExpoImage
          source={{ uri: getFullImageUrl(imageUrl) }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <Text style={textStyle}>{getInitials(userName)}</Text>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 80,
    height: 80,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 18,
  },
  largeText: {
    fontSize: 28,
  },
});
