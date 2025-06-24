import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Camera, Image as ImageIcon, Save } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '../lib/storage';
import { API_BASE_URL } from '../config/api';
import { MEDICAL_SPECIALTIES } from '../types/shared';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageAsset {
  uri: string;
  type: string;
  name: string;
}

const { width: screenWidth } = Dimensions.get('window');

export default function NewCaseModal({ isOpen, onClose }: NewCaseModalProps) {
  const [title, setTitle] = useState('');
  const [history, setHistory] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [showSpecialtySuggestions, setShowSpecialtySuggestions] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  // Load draft on modal open
  useEffect(() => {
    if (isOpen) {
      loadDraft();
    }
  }, [isOpen]);

  const loadDraft = async () => {
    try {
      const draft = await StorageService.getDraftCase();
      if (draft) {
        setTitle(draft.title);
        setHistory(draft.description);
        setSelectedSpecialty(draft.specialty);
        setSpecialtyInput(draft.specialty);
        // Note: We can't restore images from draft due to security restrictions
        setHasDraft(true);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    try {
      if (!title.trim() && !history.trim()) {
        Alert.alert('Info', 'Nothing to save as draft');
        return;
      }

      await StorageService.setDraftCase({
        title: title.trim(),
        description: history.trim(),
        specialty: selectedSpecialty,
        images: [], // Can't save image URIs due to security
        timestamp: Date.now(),
      });

      Alert.alert('Success', 'Draft saved successfully');
      setHasDraft(true);
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const clearDraft = async () => {
    try {
      await StorageService.removeDraftCase();
      setHasDraft(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const handleClose = () => {
    // Auto-save draft if there's content
    if ((title.trim() || history.trim()) && !hasDraft) {
      Alert.alert(
        'Save Draft?',
        'Would you like to save your progress as a draft?',
        [
          { text: 'Discard', style: 'destructive', onPress: onClose },
          { text: 'Save Draft', onPress: async () => {
            await saveDraft();
            onClose();
          }},
        ]
      );
    } else {
      onClose();
    }
  };

  const createCaseMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('Submitting case to:', `${API_BASE_URL}/api/cases`);
      
      const response = await fetch(`${API_BASE_URL}/api/cases`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData - browser will set it automatically with boundary
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Case submission failed:', response.status, errorText);
        let errorMessage = 'Failed to create case';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('Case created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-cases'] });
      Alert.alert('Success', 'Your case has been submitted successfully!');
      
      // Clear draft after successful submission
      await clearDraft();
      
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('Case submission error:', error);
      Alert.alert('Error', error.message || 'Failed to create case');
    },
  });

  const resetForm = () => {
    setTitle('');
    setHistory('');
    setSelectedImages([]);
    setSelectedSpecialty('');
    setSpecialtyInput('');
    setShowSpecialtySuggestions(false);
    setHasDraft(false);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const handleImagePicker = async () => {
    if (selectedImages.length >= 5) {
      Alert.alert('Maximum images', 'You can upload up to 3 images per case.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageAsset: ImageAsset = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
      };
      setSelectedImages(prev => [...prev, imageAsset]);
    }
  };

  const openImageLibrary = async () => {
    const remainingSlots = 5 - selectedImages.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages: ImageAsset[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `image_${Date.now()}_${index}.jpg`,
      }));
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a case title.');
      return;
    }
    
    if (!history.trim()) {
      Alert.alert('Missing history', 'Please enter the case history.');
      return;
    }
    
    if (!selectedSpecialty) {
      Alert.alert('Missing specialty', 'Please select a medical specialty for this case.');
      return;
    }

    console.log('Preparing case submission:', {
      title: title.trim(),
      history: history.trim(),
      specialty: selectedSpecialty,
      imageCount: selectedImages.length,
    });

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('history', history.trim());
    formData.append('specialty', selectedSpecialty);

    selectedImages.forEach((image, index) => {
      console.log(`Adding image ${index}:`, image.name);
      formData.append('images', {
        uri: image.uri,
        type: image.type,
        name: image.name,
      } as any);
    });

    createCaseMutation.mutate(formData);
  };

  // Use centralized medical specialties list

  const filteredSpecialties = MEDICAL_SPECIALTIES.filter((specialty: string) =>
    specialty.toLowerCase().includes(specialtyInput.toLowerCase())
  );

  const handleSpecialtyInputChange = (text: string) => {
    setSpecialtyInput(text);
    setShowSpecialtySuggestions(text.length > 0);
  };

  const handleSpecialtyInputFocus = () => {
    setShowSpecialtySuggestions(specialtyInput.length > 0);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd();
    }, 300);
  };

  const selectSpecialty = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setSpecialtyInput(specialty);
    setShowSpecialtySuggestions(false);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
            <TouchableOpacity onPress={handleClose}>
              <Text style={{
                fontSize: 17,
                color: '#4ECDC4',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
              }}>
                New Case
              </Text>
              {hasDraft && (
                <View style={{
                  backgroundColor: '#FF9500',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}>
                  <Text style={{
                    fontSize: 10,
                    color: '#FFFFFF',
                    fontWeight: '600',
                  }}>
                    DRAFT
                  </Text>
                </View>
              )}
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={saveDraft}>
                <Save size={20} color="#4ECDC4" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={createCaseMutation.isPending}
              style={{
                opacity: createCaseMutation.isPending ? 0.5 : 1,
              }}
            >
              {createCaseMutation.isPending ? (
                <ActivityIndicator size="small" color="#4ECDC4" />
              ) : (
                <Text style={{
                  fontSize: 17,
                  color: '#4ECDC4',
                  fontWeight: '600',
                }}>
                  Share
                </Text>
              )}
            </TouchableOpacity>
            </View>
          </View>

          <KeyboardAwareScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={20}
            onTouchStart={() => {
              if (!showSpecialtySuggestions) {
                setShowSpecialtySuggestions(false);
              }
            }}
            scrollEnabled={!showSpecialtySuggestions}
          >
            {/* Case Title */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
                marginBottom: 8,
              }}>
                Case Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a descriptive title"
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E5E7',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#FFFFFF',
                }}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Brief History */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
                marginBottom: 8,
              }}>
                Brief History
              </Text>
              <TextInput
                value={history}
                onChangeText={setHistory}
                placeholder="Describe the case background, symptoms, and relevant history..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E5E7',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#FFFFFF',
                  height: 120,
                }}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Medical Images */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
                marginBottom: 8,
              }}>
                Medical Images
              </Text>
              
              {/* Image Upload Button */}
              <TouchableOpacity
                onPress={handleImagePicker}
                style={{
                  borderWidth: 2,
                  borderColor: '#E5E5E7',
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  padding: 32,
                  alignItems: 'center',
                  backgroundColor: '#F9F9F9',
                  marginBottom: 16,
                }}
              >
                <Camera size={32} color="#8E8E93" />
                <Text style={{
                  fontSize: 16,
                  color: '#8E8E93',
                  textAlign: 'center',
                  marginTop: 8,
                }}>
                  Add medical images, scans, or charts
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#8E8E93',
                  textAlign: 'center',
                  marginTop: 4,
                }}>
                  Up to 3 images
                </Text>
              </TouchableOpacity>

              {/* Selected Images Preview */}
              {selectedImages.length > 0 && (
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {selectedImages.map((image, index) => (
                    <View
                      key={index}
                      style={{
                        width: (screenWidth - 56) / 3,
                        aspectRatio: 1,
                        position: 'relative',
                      }}
                    >
                      <Image
                        source={{ uri: image.uri }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 8,
                        }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#FF3B30',
                          borderRadius: 12,
                          width: 24,
                          height: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Specialty Selection */}
            <View style={{ marginBottom: 32, position: 'relative', zIndex: 1000 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
                marginBottom: 8,
              }}>
                Specialty Tags
              </Text>
              
              <View style={{ position: 'relative' }}>
                {/* Backdrop for suggestions */}
                {showSpecialtySuggestions && (
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: -1000,
                      left: -1000,
                      right: -1000,
                      bottom: -1000,
                      zIndex: 999,
                    }}
                    onPress={() => setShowSpecialtySuggestions(false)}
                    activeOpacity={1}
                  />
                )}
                
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: showSpecialtySuggestions ? '#4ECDC4' : '#E5E5E7',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 16,
                    backgroundColor: '#FFFFFF',
                  }}
                  placeholder="Type to search specialties..."
                  value={specialtyInput}
                  onChangeText={handleSpecialtyInputChange}
                  onFocus={handleSpecialtyInputFocus}
                />
                
                {selectedSpecialty && !showSpecialtySuggestions && (
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 16,
                    }}
                    onPress={() => {
                      setSelectedSpecialty('');
                      setSpecialtyInput('');
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                )}
                
                {showSpecialtySuggestions && filteredSpecialties.length > 0 && (
                  <View style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E5E5E7',
                    borderBottomWidth: 0,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    maxHeight: 150,
                    zIndex: 1001,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 5,
                  }}>
                    <ScrollView 
                      style={{ maxHeight: 150 }}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="always"
                      scrollEventThrottle={16}
                    >
                      {filteredSpecialties.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderBottomWidth: filteredSpecialties.indexOf(item) === filteredSpecialties.length - 1 ? 0 : 1,
                            borderBottomColor: '#F2F2F7',
                          }}
                          onPress={() => selectSpecialty(item)}
                          activeOpacity={0.6}
                        >
                          <Text style={{
                            fontSize: 16,
                            color: '#1C1C1E',
                          }}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}
