import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  StyleSheet, 
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: { caseKeywords?: string; doctorName?: string; specialty?: string }) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearch }) => {
  const [caseKeywords, setCaseKeywords] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');

  const handleApplyFilters = () => {
    onSearch({
      caseKeywords: caseKeywords.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      specialty: specialty.trim() || undefined,
    });
    onClose();
  };

  const clearFilters = () => {
    setCaseKeywords('');
    setDoctorName('');
    setSpecialty('');
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.header}>
          <Text style={styles.title}>Search Cases</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#4ECDC4" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search by Case */}
          <View style={styles.searchSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>Search by Case</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Find cases by keywords in titles (e.g., chest pain, fracture, diabetes)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter keywords..."
              value={caseKeywords}
              onChangeText={setCaseKeywords}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Search by Doctor */}
          <View style={styles.searchSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>Search by Doctor</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Find cases by doctor's name (e.g., John, Smith, Dr. Johnson)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter doctor name..."
              value={doctorName}
              onChangeText={setDoctorName}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Search by Specialty */}
          <View style={styles.searchSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={20} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>Search by Specialty</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Filter cases by medical specialty
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter specialty..."
              value={specialty}
              onChangeText={setSpecialty}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Apply Filters Button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>

          {/* Clear Filters Button */}
          {(caseKeywords || doctorName || specialty) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#000000',
  },
  applyButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
});

export default SearchModal;
