import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (file: SelectedFile) => {
      const formData = new FormData();
      formData.append('document', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      } as any);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/documents`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      Alert.alert('Success', 'Your document has been submitted for review.');
    },
    onError: (error: any) => {
      Alert.alert('Upload Failed', error.message || 'Failed to upload document');
    },
  });

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const validFiles = result.assets.filter((file: any) => {
          const isValidType = 
            file.mimeType === 'application/pdf' || 
            file.mimeType?.startsWith('image/');
          const isValidSize = file.size ? file.size <= 10 * 1024 * 1024 : true; // 10MB

          if (!isValidType) {
            Alert.alert(
              'Invalid File Type',
              'Only PDF files and images are allowed.'
            );
            return false;
          }

          if (!isValidSize) {
            Alert.alert(
              'File Too Large',
              'Files must be smaller than 10MB.'
            );
            return false;
          }

          return true;
        });

        const newFiles: SelectedFile[] = validFiles.map((file: any) => ({
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
          mimeType: file.mimeType || 'application/octet-stream',
        }));

        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select documents');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: SelectedFile, index: number) => {
    try {
      await uploadMutation.mutateAsync(file);
      setUploadedFiles(prev => [...prev, file.name]);
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): keyof typeof Ionicons.glyphMap => {
    if (mimeType === 'application/pdf') {
      return 'document-text';
    }
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    return 'document';
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: 8,
        }}>
          Upload Medical Documents
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#8E8E93',
          lineHeight: 22,
        }}>
          Please upload your medical license, board certifications, and any relevant credentials.
        </Text>
      </View>

      {/* Upload Area */}
      <TouchableOpacity
        onPress={handleFileSelect}
        style={{
          borderWidth: 2,
          borderColor: '#E5E5E7',
          borderStyle: 'dashed',
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          backgroundColor: '#F9F9F9',
          marginBottom: 24,
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="cloud-upload-outline" size={48} color="#8E8E93" />
        <Text style={{
          fontSize: 16,
          color: '#8E8E93',
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 4,
        }}>
          Tap to upload documents
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#8E8E93',
          textAlign: 'center',
        }}>
          PDF files and images up to 10MB
        </Text>
      </TouchableOpacity>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#000000',
            marginBottom: 12,
          }}>
            Selected Files:
          </Text>
          {selectedFiles.map((file, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E5E5E7',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}>
                <Ionicons 
                  name={getFileIcon(file.mimeType)} 
                  size={24} 
                  color="#4ECDC4" 
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#000000',
                    }}
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#8E8E93',
                  }}>
                    {formatFileSize(file.size)}
                  </Text>
                </View>
              </View>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <TouchableOpacity
                  onPress={() => uploadFile(file, index)}
                  disabled={uploadMutation.isPending}
                  style={{
                    backgroundColor: uploadMutation.isPending ? '#8E8E93' : '#4ECDC4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  {uploadMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      Upload
                    </Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => removeFile(index)}
                  style={{
                    padding: 4,
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#34C759',
            marginBottom: 12,
          }}>
            Uploaded Documents:
          </Text>
          {uploadedFiles.map((fileName, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#F0F9F0',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#34C759',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color="#34C759" 
                style={{ marginRight: 12 }}
              />
              <View>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#1D4F1F',
                }}>
                  {fileName}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#34C759',
                }}>
                  Uploaded successfully
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Completion Button */}
      {uploadedFiles.length > 0 && (
        <TouchableOpacity
          onPress={onUploadComplete}
          style={{
            backgroundColor: '#34C759',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
          }}>
            Complete Document Upload
          </Text>
        </TouchableOpacity>
      )}

      {/* Required Documents Info */}
      <View style={{
        backgroundColor: '#E8F4FD',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#4ECDC4',
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1D3A5F',
          marginBottom: 12,
        }}>
          Required Documents:
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{
            fontSize: 14,
            color: '#4ECDC4',
          }}>
            • Medical License
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#4ECDC4',
          }}>
            • Board Certification
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#4ECDC4',
          }}>
            • Professional ID or Credentials
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#4ECDC4',
          }}>
            • Institution Verification (if applicable)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
