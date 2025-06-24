import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import StorageService from '../lib/storage';

interface ProfilePictureModalProps {
  visible: boolean;
  onClose: () => void;
  currentImageUrl?: string;
  userName?: string;
  onUploadComplete?: (imageUrl: string) => void;
}

export default function ProfilePictureModal({ 
  visible,
  onClose,
  currentImageUrl, 
  userName = 'User',
  onUploadComplete 
}: ProfilePictureModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      const authToken = await StorageService.getAuthToken();
      
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/auth/user/profile-picture`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          // Don't set Content-Type for FormData, let the browser set it with boundary
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload profile picture');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      Alert.alert(
        'Success',
        'Your profile picture has been successfully updated.'
      );
      onUploadComplete?.(data.profileImageUrl);
      setIsUploading(false);
      onClose();
    },
    onError: (error: any) => {
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload profile picture'
      );
      setIsUploading(false);
    },
  });

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera roll permissions to update your profile picture.'
      );
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera permissions to take a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          'File Too Large',
          'Please select an image smaller than 5MB.'
        );
        return;
      }

      setIsUploading(true);
      uploadMutation.mutate(asset.uri);
    }
  };

  const openImageLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          'File Too Large',
          'Please select an image smaller than 5MB.'
        );
        return;
      }

      setIsUploading(true);
      uploadMutation.mutate(asset.uri);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement remove photo API call
            console.log('Remove photo');
          }
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'ios' ? 60 : 20,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5E7',
          }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{
                fontSize: 17,
                color: '#007AFF',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#000000',
            }}>
              Profile Picture
            </Text>
            
            <View style={{ width: 60 }} />
          </View>

          {/* Content */}
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
          }}>
            {/* Large Avatar */}
            <View style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: currentImageUrl ? 'transparent' : '#007AFF',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              marginBottom: 40,
              position: 'relative',
            }}>
              {currentImageUrl ? (
                <Image
                  source={{ uri: currentImageUrl }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 80,
                  fontWeight: 'bold',
                }}>
                  {getInitials(userName)}
                </Text>
              )}
              
              {/* Loading overlay */}
              {isUploading && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    marginTop: 12,
                  }}>
                    Uploading...
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ width: '100%', gap: 16 }}>
              {/* Take Photo Button */}
              <TouchableOpacity
                onPress={openCamera}
                disabled={isUploading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#007AFF',
                  borderRadius: 12,
                  padding: 16,
                  gap: 12,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Take Photo
                </Text>
              </TouchableOpacity>

              {/* Choose from Library Button */}
              <TouchableOpacity
                onPress={openImageLibrary}
                disabled={isUploading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#007AFF',
                  gap: 12,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="images" size={20} color="#007AFF" />
                <Text style={{
                  color: '#007AFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Choose from Library
                </Text>
              </TouchableOpacity>

              {/* Remove Photo Button (only if photo exists) */}
              {currentImageUrl && (
                <TouchableOpacity
                  onPress={handleRemovePhoto}
                  disabled={isUploading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#FF3B30',
                    gap: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                  <Text style={{
                    color: '#FF3B30',
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Remove Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Instructions */}
            <Text style={{
              fontSize: 14,
              color: '#8E8E93',
              textAlign: 'center',
              marginTop: 24,
              lineHeight: 20,
            }}>
              Your profile picture helps other medical professionals recognize you.{'\n'}
              JPEG or PNG format, maximum 5MB.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
