import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Modal, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { MEDICAL_SPECIALTIES, FELLOWSHIPS } from '../types/shared';

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
    workplace: '',
  });
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [showFellowshipPicker, setShowFellowshipPicker] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [fellowshipSearch, setFellowshipSearch] = useState('');
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
        workplace: user.institution || '',
      });
    }
  }, [user]);

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Filter specialties based on search
  const filteredSpecialties = MEDICAL_SPECIALTIES.filter((specialty: string) =>
    specialty.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  // Filter fellowships based on search
  const filteredFellowships = FELLOWSHIPS.filter((fellowship: string) =>
    fellowship.toLowerCase().includes(fellowshipSearch.toLowerCase())
  );

  const handleSpecialtySearch = (text: string) => {
    setSpecialtySearch(text);
  };

  const handleFellowshipSearch = (text: string) => {
    setFellowshipSearch(text);
  };

  const selectSpecialty = (specialty: string) => {
    updateFormData('boardCertification', specialty);
    setSpecialtySearch(specialty);
    setShowSpecialtyPicker(false);
  };

  const selectFellowship = (fellowship: string) => {
    updateFormData('fellowship', fellowship);
    setFellowshipSearch(fellowship);
    setShowFellowshipPicker(false);
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
        institution: data.workplace,
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
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.boardCertification.trim() || !formData.yearsOfExperience.trim() || !formData.workplace.trim()) {
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
              onPress={() => {
                setSpecialtySearch(formData.boardCertification);
                setShowSpecialtyPicker(true);
              }}
            >
              <Text style={{ fontSize: 16, color: formData.boardCertification ? '#000' : '#8E8E93' }}>
                {formData.boardCertification || 'Search or select your board certification'}
              </Text>
              <Ionicons name="search" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>Fellowship (Optional)</Text>
            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              onPress={() => {
                setFellowshipSearch(formData.fellowship);
                setShowFellowshipPicker(true);
              }}
            >
              <Text style={{ fontSize: 16, color: formData.fellowship ? '#000' : '#8E8E93' }}>
                {formData.fellowship || 'Search or select your fellowship specialty'}
              </Text>
              <Ionicons name="search" size={20} color="#999" />
            </TouchableOpacity>
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
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>Workplace *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, backgroundColor: '#FFFFFF' }}
              value={formData.workplace}
              onChangeText={(text) => updateFormData('workplace', text)}
              placeholder="Enter your workplace/institution"
              autoCapitalize="words"
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
            <View style={{ padding: 16, backgroundColor: '#FFFFFF' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9FB', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D1D1D6', marginBottom: 16 }}>
                <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, paddingVertical: 12, color: '#000' }}
                  value={specialtySearch}
                  onChangeText={handleSpecialtySearch}
                  placeholder="Search board certifications..."
                  placeholderTextColor="#8E8E93"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                />
                {specialtySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setSpecialtySearch('')} style={{ marginLeft: 8, padding: 4 }}>
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredSpecialties.length > 0 ? (
                  filteredSpecialties.map((certification: string) => (
                    <TouchableOpacity
                      key={certification}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}
                      onPress={() => selectSpecialty(certification)}
                    >
                      <Text style={{ fontSize: 16, color: '#000' }}>{certification}</Text>
                      {formData.boardCertification === certification && (
                        <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: 16 }}>
                    <Text style={{ color: '#8E8E93', textAlign: 'center' }}>No specialties found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
        {/* Fellowship Picker Modal */}
        <Modal
          visible={showFellowshipPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', backgroundColor: '#FFFFFF' }}>
              <TouchableOpacity onPress={() => setShowFellowshipPicker(false)}>
                <Text style={{ color: '#4ECDC4', fontSize: 18 }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Fellowship</Text>
              <View style={{ width: 60 }} />
            </View>
            <View style={{ padding: 16, backgroundColor: '#FFFFFF' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9FB', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D1D1D6', marginBottom: 16 }}>
                <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, paddingVertical: 12, color: '#000' }}
                  value={fellowshipSearch}
                  onChangeText={handleFellowshipSearch}
                  placeholder="Search fellowships..."
                  placeholderTextColor="#8E8E93"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                />
                {fellowshipSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setFellowshipSearch('')} style={{ marginLeft: 8, padding: 4 }}>
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredFellowships.length > 0 ? (
                  filteredFellowships.map((fellowship: string) => (
                    <TouchableOpacity
                      key={fellowship}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}
                      onPress={() => selectFellowship(fellowship)}
                    >
                      <Text style={{ fontSize: 16, color: '#000' }}>{fellowship}</Text>
                      {formData.fellowship === fellowship && (
                        <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: 16 }}>
                    <Text style={{ color: '#8E8E93', textAlign: 'center' }}>No fellowships found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}