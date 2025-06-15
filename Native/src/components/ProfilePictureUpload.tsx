import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import StorageService from '../lib/storage';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  userName?: string;
  onUploadComplete?: (imageUrl: string) => void;
}

export default function ProfilePictureUpload({ 
  currentImageUrl, 
  userName = 'User',
  onUploadComplete 
}: ProfilePictureUploadProps) {
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

  const handleImageSelect = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Photo',
      'Choose how you want to select your profile picture',
      [
        { 
          text: 'Camera', 
          onPress: openCamera 
        },
        { 
          text: 'Photo Library', 
          onPress: openImageLibrary 
        },
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
      ]
    );
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
      
      // Validate file size (5MB limit)
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      // Validate file size (5MB limit)
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={{
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Avatar with Camera Button */}
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          onPress={handleImageSelect}
          disabled={isUploading}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: currentImageUrl ? 'transparent' : '#007AFF',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
          activeOpacity={0.8}
        >
          {currentImageUrl ? (
            <Image
              source={{ uri: currentImageUrl }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
              }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{
              color: '#FFFFFF',
              fontSize: 32,
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
              borderRadius: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Camera Button Overlay */}
        <TouchableOpacity
          onPress={handleImageSelect}
          disabled={isUploading}
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#FFFFFF',
            borderWidth: 2,
            borderColor: '#F2F2F7',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="camera" 
            size={16} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Change Photo Button */}
      <TouchableOpacity
        onPress={handleImageSelect}
        disabled={isUploading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#E5E5E7',
          backgroundColor: '#FFFFFF',
          gap: 8,
        }}
        activeOpacity={0.7}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons name="cloud-upload-outline" size={16} color="#007AFF" />
        )}
        <Text style={{
          color: '#007AFF',
          fontSize: 14,
          fontWeight: '500',
        }}>
          {isUploading ? 'Uploading...' : 'Change Photo'}
        </Text>
      </TouchableOpacity>

      {/* Instructions */}
      <Text style={{
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center',
        maxWidth: 200,
        lineHeight: 16,
      }}>
        Tap the avatar or button to change your profile picture. JPEG or PNG, max 5MB.
      </Text>
    </View>
  );
}
