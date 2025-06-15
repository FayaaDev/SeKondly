import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  specialty: string;
  dateRange: string;
}

const specialties = [
  { label: 'All Specialties', value: '' },
  { label: 'Cardiology', value: 'cardiology' },
  { label: 'Dermatology', value: 'dermatology' },
  { label: 'Emergency Medicine', value: 'emergency-medicine' },
  { label: 'Endocrinology', value: 'endocrinology' },
  { label: 'Gastroenterology', value: 'gastroenterology' },
  { label: 'Hematology', value: 'hematology' },
  { label: 'Infectious Disease', value: 'infectious-disease' },
  { label: 'Nephrology', value: 'nephrology' },
  { label: 'Neurology', value: 'neurology' },
  { label: 'Oncology', value: 'oncology' },
  { label: 'Orthopedics', value: 'orthopedics' },
  { label: 'Pediatrics', value: 'pediatrics' },
  { label: 'Psychiatry', value: 'psychiatry' },
  { label: 'Pulmonology', value: 'pulmonology' },
  { label: 'Radiology', value: 'radiology' },
  { label: 'Surgery', value: 'surgery' },
  { label: 'Urology', value: 'urology' },
];

const dateRanges = [
  { label: 'Any Time', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'This Year', value: 'year' },
];

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    specialty: '',
    dateRange: '',
  });

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      specialty: '',
      dateRange: '',
    });
  };

  const hasActiveFilters = filters.query || filters.specialty || filters.dateRange;

  return (
    <Modal
      visible={isOpen}
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
              Search Cases
            </Text>
            
            <TouchableOpacity onPress={handleSearch}>
              <Text style={{
                fontSize: 17,
                color: '#007AFF',
                fontWeight: '600',
              }}>
                Search
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search Query */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
                marginBottom: 8,
              }}>
                Keywords
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={filters.query}
                  onChangeText={(text) => setFilters({ ...filters, query: text })}
                  placeholder="Search symptoms, diagnoses, treatments..."
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E5E7',
                    borderRadius: 12,
                    padding: 16,
                    paddingLeft: 44,
                    fontSize: 16,
                    backgroundColor: '#FFFFFF',
                  }}
                  placeholderTextColor="#8E8E93"
                />
                <View style={{
                  position: 'absolute',
                  left: 16,
                  top: 16,
                }}>
                  <Ionicons name="search" size={20} color="#8E8E93" />
                </View>
              </View>
            </View>

            {/* Specialty Filter */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
                marginBottom: 8,
              }}>
                Medical Specialty
              </Text>
              <View style={{
                borderWidth: 1,
                borderColor: '#E5E5E7',
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
              }}>
                <Picker
                  selectedValue={filters.specialty}
                  onValueChange={(itemValue) =>
                    setFilters({ ...filters, specialty: itemValue })
                  }
                  style={{
                    height: Platform.OS === 'ios' ? 200 : 50,
                  }}
                >
                  {specialties.map((specialty) => (
                    <Picker.Item
                      key={specialty.value}
                      label={specialty.label}
                      value={specialty.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#000000',
                marginBottom: 8,
              }}>
                Date Range
              </Text>
              <View style={{
                borderWidth: 1,
                borderColor: '#E5E5E7',
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
              }}>
                <Picker
                  selectedValue={filters.dateRange}
                  onValueChange={(itemValue) =>
                    setFilters({ ...filters, dateRange: itemValue })
                  }
                  style={{
                    height: Platform.OS === 'ios' ? 200 : 50,
                  }}
                >
                  {dateRanges.map((range) => (
                    <Picker.Item
                      key={range.value}
                      label={range.label}
                      value={range.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <View style={{ marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={{
                    backgroundColor: '#F2F2F7',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    color: '#007AFF',
                    fontWeight: '500',
                  }}>
                    Clear All Filters
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#000000',
                  marginBottom: 12,
                }}>
                  Active Filters
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {filters.query && (
                    <View style={{
                      backgroundColor: '#007AFF',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '500',
                      }}>
                        "{filters.query}"
                      </Text>
                    </View>
                  )}
                  {filters.specialty && (
                    <View style={{
                      backgroundColor: '#007AFF',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '500',
                      }}>
                        {specialties.find(s => s.value === filters.specialty)?.label}
                      </Text>
                    </View>
                  )}
                  {filters.dateRange && (
                    <View style={{
                      backgroundColor: '#007AFF',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '500',
                      }}>
                        {dateRanges.find(r => r.value === filters.dateRange)?.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
