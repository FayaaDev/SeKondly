import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  userName?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * ImageViewerModal - Display images in fullscreen
 * 
 * Features:
 * - Fullscreen image viewing
 * - Fallback to user initials when no image
 * - Clean, minimal interface
 * - Pinch to zoom (handled by expo-image)
 * 
 * @example
 * ```tsx
 * <ImageViewerModal
 *   visible={showImageViewer}
 *   onClose={() => setShowImageViewer(false)}
 *   imageUrl={user.profileImageUrl}
 *   userName="John Doe"
 * />
 * ```
 */
export default function ImageViewerModal({
  visible,
  onClose,
  imageUrl,
  userName = '',
}: ImageViewerModalProps) {
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Helper function to get full image URL
  const getFullImageUrl = (imageUrl: string): string => {
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already a full URL
    }
    return `${API_BASE_URL}${imageUrl}`; // Convert relative URL to full URL
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          {userName && (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {userName}
            </Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {imageUrl ? (
            <ExpoImage
              source={{ uri: getFullImageUrl(imageUrl) }}
              style={styles.image}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <View style={styles.fallbackCircle}>
                <Text style={styles.initialsText}>{getInitials(userName)}</Text>
              </View>
              <Text style={styles.noImageText}>No profile picture</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight - 100, // Account for header
  },
  fallbackContainer: {
    alignItems: 'center',
  },
  fallbackCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  initialsText: {
    fontSize: 80,
    fontWeight: '600',
    color: 'white',
  },
  noImageText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
