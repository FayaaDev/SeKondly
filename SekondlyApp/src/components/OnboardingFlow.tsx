import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';
import StorageService from '../lib/storage';
import { MEDICAL_SPECIALTIES, FELLOWSHIPS, MEDICAL_LEVELS } from '../types/shared';

interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  boardCertification: string;
  fellowship: string;
  level: string;
  yearsOfExperience: string;
  workplace: string;
  credentialsFile?: DocumentPicker.DocumentPickerAsset;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSignIn?: () => void;
}

type OnboardingScreen = 'welcome' | 'signin' | 'signup' | 'professional' | 'credentials';

// Helper function to check password strength
const checkPasswordStrength = (password: string) => {
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return {
    hasMinLength,
    hasNumber,
    hasSpecialChar,
    isValid: hasMinLength && hasNumber && hasSpecialChar
  };
};

// Use centralized medical specialties for board certifications

/**
 * OnboardingFlow - Multi-step onboarding component for new users
 * 
 * Features:
 * - Welcome screen with sign-in/sign-up options
 * - Multi-step sign-up process (personal info, professional info, credentials)
 * - Document upload for medical credentials
 * - Form validation and error handling
 * - iOS-native design patterns
 * - Progress indicator for multi-step flow
 * 
 * @param onComplete - Callback when onboarding is completed successfully
 * @param onSignIn - Optional callback for existing users to sign in
 * 
 * @example
 * ```tsx
 * <OnboardingFlow
 *   onComplete={() => navigation.navigate('Home')}
 *   onSignIn={() => navigation.navigate('SignIn')}
 * />
 * ```
 */
const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSignIn }) => {
  const queryClient = useQueryClient();
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>('welcome');
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [showFellowshipPicker, setShowFellowshipPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [showAccountReview, setShowAccountReview] = useState(false);
  const [showSignInAccountReview, setShowSignInAccountReview] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [fellowshipSearch, setFellowshipSearch] = useState('');
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    boardCertification: '',
    fellowship: '',
    level: '',
    yearsOfExperience: '',
    workplace: '',
  });

  const submitMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      console.log('Submitting onboarding data:', data);
      const formData = new FormData();
      
      // Add form fields
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('boardCertification', data.boardCertification);
      formData.append('fellowship', data.fellowship || '');
      formData.append('level', data.level);
      formData.append('yearsOfExperience', data.yearsOfExperience);
      formData.append('workplace', data.workplace || '');
      
      console.log('Form data level:', data.level);
      console.log('Form data workplace:', data.workplace);
      
      // Add credentials file if uploaded
      if (data.credentialsFile) {
        formData.append('credentialsFile', {
          uri: data.credentialsFile.uri,
          type: data.credentialsFile.mimeType || 'application/octet-stream',
          name: data.credentialsFile.name,
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/api/onboarding`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete onboarding');
      }

      return response.json();
    },
    onSuccess: () => {
      setShowAccountReview(true);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid credentials');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      try {
        if (data.user) {
          // Check if user is approved before proceeding
          if (!data.user.isApproved) {
            setShowSignInAccountReview(true);
            return; // Don't save user data or navigate away
          }
          
          await StorageService.setUser(data.user);
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          onComplete();
        }
      } catch (error) {
        console.error('Error saving sign in data:', error);
        Alert.alert('Error', 'Failed to save login data');
      }
    },
    onError: (error: Error) => {
      Alert.alert('Sign In Failed', error.message);
    },
  });

  const validatePersonalInfo = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Required Fields Missing', 'Please fill in all required fields.');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    
    // Strong password validation
    if (formData.password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
      return false;
    }
    
    const hasNumber = /\d/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
    
    if (!hasNumber) {
      Alert.alert('Password Invalid', 'Password must contain at least one number.');
      return false;
    }
    
    if (!hasSpecialChar) {
      Alert.alert('Password Invalid', 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?).'); 
      return false;
    }
    
    return true;
  };

  const validateProfessionalInfo = (): boolean => {
    if (!formData.boardCertification || !formData.level || !formData.yearsOfExperience || !formData.workplace) {
      Alert.alert('Required Fields Missing', 'Please fill in board certification, level, years of experience, and workplace.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    switch (currentScreen) {
      case 'signup':
        if (validatePersonalInfo()) {
          setCurrentScreen('professional');
        }
        break;
      case 'professional':
        if (validateProfessionalInfo()) {
          setCurrentScreen('credentials');
        }
        break;
      case 'credentials':
        submitMutation.mutate(formData);
        break;
      default:
        break;
    }
  };

  const handlePrevious = () => {
    switch (currentScreen) {
      case 'signin':
        setCurrentScreen('welcome');
        break;
      case 'signup':
        setCurrentScreen('welcome');
        break;
      case 'professional':
        setCurrentScreen('signup');
        break;
      case 'credentials':
        setCurrentScreen('professional');
        break;
      default:
        break;
    }
  };

  const handleSignIn = () => {
    if (!signInData.email || !signInData.password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    signInMutation.mutate(signInData);
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, credentialsFile: result.assets[0] }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const updateFormData = (key: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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

  const selectLevel = (level: string) => {
    console.log('Level selected:', level);
    updateFormData('level', level);
    console.log('Form data after level update:', formData);
    setShowLevelPicker(false);
  };

  const getProgressPercentage = (): number => {
    switch (currentScreen) {
      case 'signup':
        return 33;
      case 'professional':
        return 66;
      case 'credentials':
        return 100;
      default:
        return 0;
    }
  };

  const renderWelcomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="leaf" size={48} color="#4ECDC4" />
          </View>
          <Text style={styles.appTitle}>Sekondly</Text>
          <Text style={styles.appSubtitle}>
            A physician-exclusive platform. Get Second opinions by sharing challenging cases with colleagues.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => setCurrentScreen('signin')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setCurrentScreen('signup')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.contactButton]}
            onPress={() => {
              Linking.openURL('https://sekondly.app').catch((err) => {
                console.error('Failed to open URL:', err);
                Alert.alert('Error', 'Could not open website. Please try again.');
              });
            }}
          >
            <Text style={styles.contactButtonText}>Contact us</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderSignInScreen = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#4ECDC4" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Ionicons name="log-in-outline" size={48} color="#4ECDC4" />
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to your existing account</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={signInData.email}
                onChangeText={(text) => setSignInData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!signInMutation.isPending}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={signInData.password}
                onChangeText={(text) => setSignInData(prev => ({ ...prev, password: text }))}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!signInMutation.isPending}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
              onPress={handleSignIn}
              disabled={signInMutation.isPending}
            >
              {signInMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderSignUpScreen = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#4ECDC4" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 3: Personal Information</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Ionicons name="person-outline" size={48} color="#4ECDC4" />
              <Text style={styles.formTitle}>Personal Information</Text>
              <Text style={styles.formSubtitle}>Let's start with your basic information</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => updateFormData('firstName', text)}
                placeholder="Enter your first name"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => updateFormData('lastName', text)}
                placeholder="Enter your last name"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                placeholder="Create a password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.passwordRequirementsContainer}>
                {formData.password.length > 0 && (
                  <View style={styles.passwordChecks}>
                    <View style={styles.passwordCheck}>
                      <Ionicons 
                        name={checkPasswordStrength(formData.password).hasMinLength ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={checkPasswordStrength(formData.password).hasMinLength ? "#34C759" : "#FF3B30"} 
                      />
                      <Text style={[
                        styles.passwordCheckText,
                        { color: checkPasswordStrength(formData.password).hasMinLength ? "#34C759" : "#FF3B30" }
                      ]}>
                        At least 6 characters
                      </Text>
                    </View>
                    <View style={styles.passwordCheck}>
                      <Ionicons 
                        name={checkPasswordStrength(formData.password).hasNumber ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={checkPasswordStrength(formData.password).hasNumber ? "#34C759" : "#FF3B30"} 
                      />
                      <Text style={[
                        styles.passwordCheckText,
                        { color: checkPasswordStrength(formData.password).hasNumber ? "#34C759" : "#FF3B30" }
                      ]}>
                        Contains a number
                      </Text>
                    </View>
                    <View style={styles.passwordCheck}>
                      <Ionicons 
                        name={checkPasswordStrength(formData.password).hasSpecialChar ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={checkPasswordStrength(formData.password).hasSpecialChar ? "#34C759" : "#FF3B30"} 
                      />
                      <Text style={[
                        styles.passwordCheckText,
                        { color: checkPasswordStrength(formData.password).hasSpecialChar ? "#34C759" : "#FF3B30" }
                      ]}>
                        Contains a special character
                      </Text>
                    </View>
                  </View>
                )}
                {formData.password.length === 0 && (
                  <Text style={styles.passwordRequirements}>
                    Password must be at least 6 characters and include a number and special character
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
              onPress={handleNext}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderProfessionalScreen = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#4ECDC4" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 3: Professional Information</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Ionicons name="school-outline" size={48} color="#4ECDC4" />
              <Text style={styles.formTitle}>Professional Information</Text>
              <Text style={styles.formSubtitle}>Tell us about your medical qualifications</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Board Certification *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setSpecialtySearch(formData.boardCertification);
                  setShowSpecialtyPicker(true);
                }}
              >
                <Text style={[styles.pickerButtonText, !formData.boardCertification && styles.placeholderText]}>
                  {formData.boardCertification || 'Search or select your board certification'}
                </Text>
                <Ionicons name="search" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fellowship (Optional)</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setFellowshipSearch(formData.fellowship);
                  setShowFellowshipPicker(true);
                }}
              >
                <Text style={[styles.pickerButtonText, !formData.fellowship && styles.placeholderText]}>
                  {formData.fellowship || 'Search or select your fellowship specialty'}
                </Text>
                <Ionicons name="search" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Medical Level *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowLevelPicker(true)}
              >
                <Text style={[styles.pickerButtonText, !formData.level && styles.placeholderText]}>
                  {formData.level || 'Select your medical level'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Years of Experience *</Text>
              <TextInput
                style={styles.input}
                value={formData.yearsOfExperience}
                onChangeText={(text) => updateFormData('yearsOfExperience', text)}
                placeholder="Enter years of experience"
                keyboardType="numeric"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Workplace *</Text>
              <TextInput
                style={styles.input}
                value={formData.workplace}
                onChangeText={(text) => updateFormData('workplace', text)}
                placeholder="Enter your workplace/institution"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
              onPress={handleNext}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showSpecialtyPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSpecialtyPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Board Certification</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.modalSearchContainer}>
            <View style={styles.modalSearchInputContainer}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                value={specialtySearch}
                onChangeText={handleSpecialtySearch}
                placeholder="Search board certifications..."
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
              {specialtySearch.length > 0 && (
                <TouchableOpacity onPress={() => setSpecialtySearch('')} style={styles.modalSearchClear}>
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {filteredSpecialties.map((certification: string) => (
              <TouchableOpacity
                key={certification}
                style={styles.modalOption}
                onPress={() => selectSpecialty(certification)}
              >
                <Text style={styles.modalOptionText}>{certification}</Text>
                {formData.boardCertification === certification && (
                  <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                )}
              </TouchableOpacity>
            ))}
            {filteredSpecialties.length === 0 && (
              <View style={styles.modalNoResults}>
                <Text style={styles.modalNoResultsText}>No specialties found</Text>
                <Text style={styles.modalNoResultsSubtext}>Try adjusting your search terms</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showFellowshipPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFellowshipPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Fellowship</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.modalSearchContainer}>
            <View style={styles.modalSearchInputContainer}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                value={fellowshipSearch}
                onChangeText={handleFellowshipSearch}
                placeholder="Search fellowships..."
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
              {fellowshipSearch.length > 0 && (
                <TouchableOpacity onPress={() => setFellowshipSearch('')} style={styles.modalSearchClear}>
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {filteredFellowships.map((fellowship: string) => (
              <TouchableOpacity
                key={fellowship}
                style={styles.modalOption}
                onPress={() => selectFellowship(fellowship)}
              >
                <Text style={styles.modalOptionText}>{fellowship}</Text>
                {formData.fellowship === fellowship && (
                  <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                )}
              </TouchableOpacity>
            ))}
            {filteredFellowships.length === 0 && (
              <View style={styles.modalNoResults}>
                <Text style={styles.modalNoResultsText}>No fellowships found</Text>
                <Text style={styles.modalNoResultsSubtext}>Try adjusting your search terms</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showLevelPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLevelPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Medical Level</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {MEDICAL_LEVELS.map((level: string) => (
              <TouchableOpacity
                key={level}
                style={styles.modalOption}
                onPress={() => selectLevel(level)}
              >
                <Text style={styles.modalOptionText}>{level}</Text>
                {formData.level === level && (
                  <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );

  const renderCredentialsScreen = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#4ECDC4" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>Step 3 of 3: Upload Credentials</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Ionicons name="document-outline" size={48} color="#4ECDC4" />
              <Text style={styles.formTitle}>Upload Credentials</Text>
              <Text style={styles.formSubtitle}>Upload your medical credentials for verification</Text>
            </View>

            <TouchableOpacity style={styles.uploadContainer} onPress={handleDocumentPick}>
              {formData.credentialsFile ? (
                <View style={styles.uploadSuccess}>
                  <Ionicons name="document" size={48} color="#34C759" />
                  <Text style={styles.uploadSuccessText}>{formData.credentialsFile.name}</Text>
                  <Text style={styles.uploadSuccessSubtext}>Tap to change file</Text>
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <Ionicons name="cloud-upload-outline" size={48} color="#999" />
                  <Text style={styles.uploadPromptText}>Upload your medical credentials</Text>
                  <Text style={styles.uploadPromptSubtext}>PDF, JPG, PNG up to 10MB</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimerText}>
              Your credentials will be reviewed by our verification team.
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
              onPress={() => {
                submitMutation.mutate(formData);
              }}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return (
    <>
      {(() => {
        switch (currentScreen) {
          case 'welcome':
            return renderWelcomeScreen();
          case 'signin':
            return renderSignInScreen();
          case 'signup':
            return renderSignUpScreen();
          case 'professional':
            return renderProfessionalScreen();
          case 'credentials':
            return renderCredentialsScreen();
          default:
            return renderWelcomeScreen();
        }
      })()}
      
      {/* Account Under Review Modal */}
      <Modal
        visible={showAccountReview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.accountReviewOverlay}>
          <View style={styles.accountReviewContainer}>
            <View style={styles.accountReviewHeader}>
              <Ionicons name="time-outline" size={32} color="#4ECDC4" />
              <Text style={styles.accountReviewTitle}>Account Under Review</Text>
            </View>
            
            <Text style={styles.accountReviewText}>
              Your account has been submitted for review. You will receive an Email once your account is approved.
            </Text>
            
            <TouchableOpacity
              style={styles.accountReviewButton}
              onPress={() => {
                setShowAccountReview(false);
                setCurrentScreen('signin');
              }}
            >
              <Text style={styles.accountReviewButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Sign In Account Under Review Modal */}
      <Modal
        visible={showSignInAccountReview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.accountReviewOverlay}>
          <View style={styles.accountReviewContainer}>
            <View style={styles.accountReviewHeader}>
              <Ionicons name="time-outline" size={32} color="#4ECDC4" />
              <Text style={styles.accountReviewTitle}>Account Under Review</Text>
            </View>
            
            <Text style={styles.accountReviewText}>
              Your account is currently being reviewed by our medical verification team.
            </Text>
            
            <TouchableOpacity
              style={styles.accountReviewButton}
              onPress={() => {
                setShowSignInAccountReview(false);
              }}
            >
              <Text style={styles.accountReviewButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 96,
    height: 96,
    backgroundColor: '#E0F7F6',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  contactButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  fullWidthButton: {
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: '600',
  },
  contactButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#4ECDC4',
    fontSize: 18,
    marginLeft: 4,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordRequirements: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 16,
  },
  passwordRequirementsContainer: {
    marginTop: 4,
  },
  passwordChecks: {
    gap: 4,
  },
  passwordCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passwordCheckText: {
    fontSize: 12,
    lineHeight: 16,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadPromptText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  uploadPromptSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadSuccess: {
    alignItems: 'center',
  },
  uploadSuccessText: {
    fontSize: 16,
    color: '#000',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadSuccessSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    color: '#4ECDC4',
    fontSize: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalSearchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#000',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  modalSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchClear: {
    marginLeft: 8,
    padding: 4,
  },
  modalNoResults: {
    padding: 40,
    alignItems: 'center',
  },
  modalNoResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  modalNoResultsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Account Review Modal Styles
  accountReviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  accountReviewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  accountReviewHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  accountReviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    textAlign: 'center',
  },
  accountReviewText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  accountReviewButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  accountReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
} as const;

export default OnboardingFlow;
