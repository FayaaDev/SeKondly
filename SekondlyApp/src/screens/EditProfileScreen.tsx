import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Modal, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { MEDICAL_SPECIALTIES } from '../types/shared';

// Use centralized medical specialties for board certifications

export default function EditProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    boardCertification: '',
    fellowship: '',
    yearsOfExperience: '',
  });
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Prefill form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        boardCertification: user.specialty || '',
        fellowship: user.fellowship || '',
        yearsOfExperience: user.experience ? String(user.experience) : '',
      });
    }
  }, [user]);

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Map form fields to backend fields
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialty: data.boardCertification,
        fellowship: data.fellowship,
        experience: data.yearsOfExperience,
      };
      return apiRequest('PATCH', '/api/auth/user', payload);
    },
    onSuccess: async () => {
      // Invalidate user data to ensure fresh data across the app
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Also invalidate cases with all possible specialty values to refresh feed
      await queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      // Invalidate search results too
      await queryClient.invalidateQueries({ queryKey: ['/api/cases/search'] });
      setIsSaving(false);
      Alert.alert('Profile Updated', 'Your profile has been updated successfully.');
      navigation.goBack();
    },
    onError: (error: any) => {
      setIsSaving(false);
      Alert.alert('Update Failed', error.message || 'Failed to update profile');
    },
  });

  const handleSave = () => {
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.boardCertification.trim() || !formData.yearsOfExperience.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setIsSaving(true);
    mutation.mutate(formData);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={28} color="#4ECDC4" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 16 }}>Edit Profile</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {/* Personal Info */}
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#4ECDC4', marginBottom: 16 }}>Personal Information</Text>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>First Name *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, backgroundColor: '#FFFFFF' }}
              value={formData.firstName}
              onChangeText={(text) => updateFormData('firstName', text)}
              placeholder="Enter your first name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>Last Name *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, backgroundColor: '#FFFFFF' }}
              value={formData.lastName}
              onChangeText={(text) => updateFormData('lastName', text)}
              placeholder="Enter your last name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>Phone Number *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, backgroundColor: '#FFFFFF' }}
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoCorrect={false}
            />
          </View>
          {/* Professional Info */}
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#4ECDC4', marginBottom: 16, marginTop: 16 }}>Professional Information</Text>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>Board Certification *</Text>
            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              onPress={() => setShowSpecialtyPicker(true)}
            >
              <Text style={{ fontSize: 16, color: formData.boardCertification ? '#000' : '#8E8E93' }}>
                {formData.boardCertification || 'Select your board certification'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>Fellowship (Optional)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, backgroundColor: '#FFFFFF' }}
              value={formData.fellowship}
              onChangeText={(text) => updateFormData('fellowship', text)}
              placeholder="Enter your fellowship specialty"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>Years of Experience *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, backgroundColor: '#FFFFFF' }}
              value={formData.yearsOfExperience}
              onChangeText={(text) => updateFormData('yearsOfExperience', text)}
              placeholder="Enter years of experience"
              keyboardType="numeric"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={{ marginTop: 32, backgroundColor: '#4ECDC4', borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
        {/* Board Certification Picker Modal */}
        <Modal
          visible={showSpecialtyPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', backgroundColor: '#FFFFFF' }}>
              <TouchableOpacity onPress={() => setShowSpecialtyPicker(false)}>
                <Text style={{ color: '#4ECDC4', fontSize: 18 }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Board Certification</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
              {MEDICAL_SPECIALTIES.map((certification: string) => (
                <TouchableOpacity
                  key={certification}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}
                  onPress={() => {
                    updateFormData('boardCertification', certification);
                    setShowSpecialtyPicker(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#000' }}>{certification}</Text>
                  {formData.boardCertification === certification && (
                    <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 