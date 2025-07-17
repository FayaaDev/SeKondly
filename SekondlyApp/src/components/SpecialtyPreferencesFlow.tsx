import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MEDICAL_SPECIALTIES } from '../types/shared';
import { apiRequest } from '../lib/queryClient';
import { API_BASE_URL } from '../config/api';

interface SpecialtyPreferencesFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface SelectedTag {
  specialty: string;
  id: string;
}

/**
 * SpecialtyPreferencesFlow - Component for selecting specialty interests
 * 
 * Features:
 * - Search and autocomplete for medical specialties
 * - Tag-based selection interface similar to the attached image
 * - Allows multiple specialty selection
 * - Saves preferences to backend for feed customization
 * 
 * @param onComplete - Callback when user completes preference selection
 * @param onSkip - Optional callback if user chooses to skip
 * 
 * @example
 * ```tsx
 * <SpecialtyPreferencesFlow
 *   onComplete={() => navigation.navigate('Home')}
 *   onSkip={() => navigation.navigate('Home')}
 * />
 * ```
 */
const SpecialtyPreferencesFlow: React.FC<SpecialtyPreferencesFlowProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<SelectedTag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const queryClient = useQueryClient();

  // Filter specialties based on search and exclude already selected ones
  const filteredSpecialties = MEDICAL_SPECIALTIES.filter(specialty => 
    specialty.toLowerCase().includes(searchText.toLowerCase()) &&
    !selectedSpecialties.some(selected => selected.specialty === specialty)
  );

  const savePreferencesMutation = useMutation({
    mutationFn: async (specialties: string[]) => {
      console.log('Saving specialty preferences:', specialties);
      console.log('API Base URL:', API_BASE_URL);
      try {
        const result = await apiRequest('POST', '/api/specialty-preferences', { specialties });
        console.log('Save preferences result:', result);
        return result;
      } catch (error) {
        console.error('Save preferences error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      console.log('Specialty preferences saved successfully');
      
      // Invalidate the preferences status query to trigger re-fetch
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/specialty-preferences/status'] 
      });
      
      // Also invalidate user preferences in case they're cached
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/specialty-preferences'] 
      });
      
      console.log('Query cache invalidated, triggering navigation');
      onComplete();
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      const errorMessage = error.message || 'Failed to save preferences';
      Alert.alert(
        'Error Saving Preferences', 
        `${errorMessage}\n\nPlease check your network connection and try again.`,
        [
          { text: 'Retry', onPress: () => {
            if (selectedSpecialties.length > 0) {
              const specialtyNames = selectedSpecialties.map(tag => tag.specialty);
              savePreferencesMutation.mutate(specialtyNames);
            }
          }},
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    },
  });

  const handleAddSpecialty = (specialty: string) => {
    if (!selectedSpecialties.some(selected => selected.specialty === specialty)) {
      const newTag: SelectedTag = {
        specialty,
        id: `${specialty}-${Date.now()}`,
      };
      setSelectedSpecialties(prev => [...prev, newTag]);
      setSearchText('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveSpecialty = (id: string) => {
    setSelectedSpecialties(prev => prev.filter(tag => tag.id !== id));
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowSuggestions(text.length > 0);
  };

  const handleSavePreferences = () => {
    if (selectedSpecialties.length === 0) {
      // If no specialties selected, just skip
      if (onSkip) {
        onSkip();
      }
      return;
    }

    const specialtyNames = selectedSpecialties.map(tag => tag.specialty);
    savePreferencesMutation.mutate(specialtyNames);
  };

  const handleSkip = () => {
    console.log('Skip button pressed');
    console.log('onSkip callback:', onSkip);
    console.log('onComplete callback:', onComplete);
    
    // Try onSkip first, then fallback to onComplete
    if (onSkip) {
      console.log('Calling onSkip callback');
      onSkip();
    } else {
      console.log('No onSkip callback, using onComplete');
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={48} color="#4ECDC4" />
          </View>
          <Text style={styles.title}>Choose Your Interests</Text>
          <Text style={styles.subtitle}>
            Select medical specialties you're most interested in. Cases from these specialties will appear first in your feed.
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={handleSearchChange}
              placeholder="Search medical specialties..."
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setShowSuggestions(searchText.length > 0)}
            />
            {searchText.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchText('');
                  setShowSuggestions(false);
                }} 
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Suggestions */}
          {showSuggestions && filteredSpecialties.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                {filteredSpecialties.slice(0, 8).map((specialty) => (
                  <TouchableOpacity
                    key={specialty}
                    style={styles.suggestionItem}
                    onPress={() => handleAddSpecialty(specialty)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#4ECDC4" />
                    <Text style={styles.suggestionText}>{specialty}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Selected Specialties Tags */}
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Selected Interests ({selectedSpecialties.length})
          </Text>
          
          {selectedSpecialties.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={32} color="#C7C7CC" />
              <Text style={styles.emptyText}>No specialties selected yet</Text>
              <Text style={styles.emptySubtext}>
                Use the search above to find and add specialties you're interested in
              </Text>
            </View>
          ) : (
            <View style={styles.tagsContainer}>
              {selectedSpecialties.map((tag) => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.specialty}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveSpecialty(tag.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Popular Specialties Quick Add */}
        <View style={styles.popularContainer}>
          <Text style={styles.popularTitle}>Popular Specialties</Text>
          <View style={styles.popularTagsContainer}>
            {['Cardiology', 'Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics', 'Psychiatry'].map((specialty) => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.popularTag,
                  selectedSpecialties.some(selected => selected.specialty === specialty) && styles.popularTagSelected
                ]}
                onPress={() => handleAddSpecialty(specialty)}
                disabled={selectedSpecialties.some(selected => selected.specialty === specialty)}
              >
                <Text style={[
                  styles.popularTagText,
                  selectedSpecialties.some(selected => selected.specialty === specialty) && styles.popularTagTextSelected
                ]}>
                  {specialty}
                </Text>
                <Ionicons 
                  name="add" 
                  size={16} 
                  color={selectedSpecialties.some(selected => selected.specialty === specialty) ? "#4ECDC4" : "#8E8E93"} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          disabled={savePreferencesMutation.isPending}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            selectedSpecialties.length === 0 && styles.saveButtonDisabled
          ]}
          onPress={handleSavePreferences}
          disabled={savePreferencesMutation.isPending}
        >
          {savePreferencesMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>
                Save Preferences {selectedSpecialties.length > 0 && `(${selectedSpecialties.length})`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    position: 'relative',
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsList: {
    maxHeight: 280,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  selectedContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
  popularContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  popularTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  popularTagSelected: {
    backgroundColor: '#E0F7F6',
    borderColor: '#4ECDC4',
  },
  popularTagText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  popularTagTextSelected: {
    color: '#4ECDC4',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#F2F2F7',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'transparent',
    minHeight: 48,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default SpecialtyPreferencesFlow;
