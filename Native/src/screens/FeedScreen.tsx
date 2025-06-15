import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from "../hooks/useAuth";
import { apiRequest, SearchManager, CacheManager } from "../lib/queryClient";
import CaseCard from "../components/CaseCard";
import CaseDetailModal from "../components/CaseDetailModal";
import NewCaseModal from "../components/NewCaseModal";
import FloatingActionButton from "../components/FloatingActionButton";
import type { CaseWithAuthor } from "../types/schema";
import type { HomeStackParamList } from "../types/navigation";
import { MEDICAL_SPECIALTIES } from '../types/shared';

type FeedScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Feed'>;

/**
 * FeedScreen - Main feed showing all medical cases
 * 
 * Features:
 * - Browse all medical cases
 * - Search modal with organized filters
 * - Search by case title keywords
 * - Search by doctor names
 * - Filter by specialty (All tab only)
 * - Real-time search suggestions for specialties
 * - Clear all filters functionality
 * - Pull-to-refresh
 * - iOS-native UI design
 * 
 * @example
 * ```tsx
 * <FeedScreen />
 * ```
 */
export default function FeedScreen() {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'all' | 'specialty'>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All Cases");
  const [specialtySearch, setSpecialtySearch] = useState<string>("");
  const [showSpecialtySuggestions, setShowSpecialtySuggestions] = useState<boolean>(false);
  const [titleSearchKeyword, setTitleSearchKeyword] = useState<string>("");
  const [doctorNameSearch, setDoctorNameSearch] = useState<string>("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithAuthor | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  
  const { user } = useAuth();

  // Query for cases
  const { 
    data: cases = [], 
    isLoading: casesLoading, 
    refetch: refetchCases 
  } = useQuery({
    queryKey: ["/api/cases", user?.specialty], // Add user specialty to query key
    queryFn: () => apiRequest("GET", "/api/cases"),
    enabled: !!user?.isApproved,
    retry: false,
  });

  // Refetch cases when user specialty changes to update filtering
  useEffect(() => {
    if (user?.specialty) {
      // Refetch cases to ensure proper filtering with new specialty
      refetchCases();
    }
  }, [user?.specialty, refetchCases]);

  // Filter cases based on active tab and selected specialty
  const filteredCases = React.useMemo(() => {
    let filtered = cases;
    
    if (activeTab === 'specialty') {
      // In specialty tab: show only user's specialty cases (excluding user's own cases)
      if (user?.specialty) {
        const userSpecialty = user.specialty.toLowerCase();
        filtered = filtered.filter((case_data: any) => 
          case_data.specialty.toLowerCase() === userSpecialty && 
          case_data.authorId !== user.id
        );
      }
    } else {
      // In All tab: show all cases EXCEPT those from user's specialty
      if (user?.specialty) {
        const userSpecialty = user.specialty.toLowerCase();
        filtered = filtered.filter((case_data: any) => 
          case_data.specialty.toLowerCase() !== userSpecialty
        );
      }

      // Apply specialty filter if selected in All tab, but only if it's not the user's own specialty
      if (selectedSpecialty !== "All Cases") {
        const selectedSpecialtyLower = selectedSpecialty.toLowerCase();
        const userSpecialtyLower = user?.specialty?.toLowerCase();
        
        // Only apply the filter if the selected specialty is different from user's specialty
        if (selectedSpecialtyLower !== userSpecialtyLower) {
          filtered = filtered.filter((case_data: any) => 
            case_data.specialty.toLowerCase() === selectedSpecialtyLower
          );
        } else {
          // If user tries to filter by their own specialty in "All" tab, show empty result
          // since their specialty cases should be in the specialty tab
          filtered = [];
        }
      }
    }

    // Apply title keyword filter
    if (titleSearchKeyword.trim()) {
      const keyword = titleSearchKeyword.toLowerCase().trim();
      filtered = filtered.filter((case_data: any) =>
        case_data.title.toLowerCase().includes(keyword)
      );
    }

    // Apply doctor name filter
    if (doctorNameSearch.trim()) {
      const searchName = doctorNameSearch.toLowerCase().trim();
      filtered = filtered.filter((case_data: any) => {
        const firstName = case_data.author?.firstName?.toLowerCase() || '';
        const lastName = case_data.author?.lastName?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        return firstName.includes(searchName) || 
               lastName.includes(searchName) || 
               fullName.includes(searchName);
      });
    }
    
    return filtered;
  }, [cases, activeTab, selectedSpecialty, user?.specialty, user?.id, titleSearchKeyword, doctorNameSearch]);

  // Reset specialty filter when switching tabs
  useEffect(() => {
    setSelectedSpecialty("All Cases");
  }, [activeTab]);

  // Reset specialty filter if user's specialty changes and they have their old specialty selected
  useEffect(() => {
    if (user?.specialty && selectedSpecialty !== "All Cases") {
      const userSpecialty = user.specialty.toLowerCase();
      const currentFilter = selectedSpecialty.toLowerCase();
      // If the current filter is the user's specialty, reset to "All Cases"
      if (currentFilter === userSpecialty && activeTab === 'all') {
        setSelectedSpecialty("All Cases");
        setSpecialtySearch("");
      }
    }
  }, [user?.specialty, selectedSpecialty, activeTab]);

  // Use MEDICAL_SPECIALTIES for the list
  const specialties = ["All Cases", ...MEDICAL_SPECIALTIES];

  // Filter specialties based on search input and exclude user's own specialty in "All" tab
  const filteredSpecialties = React.useMemo(() => {
    let availableSpecialties = specialties;
    
    // In "All" tab, exclude user's own specialty from filter options
    if (activeTab === 'all' && user?.specialty) {
      const userSpecialty = user.specialty.toLowerCase();
      availableSpecialties = specialties.filter(specialty => 
        specialty === "All Cases" || specialty.toLowerCase() !== userSpecialty
      );
    }
    
    // Apply search filter
    return specialtySearch 
      ? availableSpecialties.filter(specialty => 
          specialty.toLowerCase().includes(specialtySearch.toLowerCase())
        )
      : availableSpecialties;
  }, [specialties, activeTab, user?.specialty, specialtySearch]);

  const handleSpecialtySearchChange = (value: string) => {
    setSpecialtySearch(value);
    setShowSpecialtySuggestions(value.length > 0);
    // Do not set selectedSpecialty here; only set it when a suggestion is tapped
    if (value === "") {
      setSelectedSpecialty("All Cases");
    }
  };

  const handleSpecialtyFilter = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setSpecialtySearch(specialty);
    setShowSpecialtySuggestions(false);
  };

  const clearAllFilters = () => {
    setSelectedSpecialty("All Cases");
    setSpecialtySearch("");
    setTitleSearchKeyword("");
    setDoctorNameSearch("");
  };

  const hasActiveFilters = selectedSpecialty !== "All Cases" || titleSearchKeyword.trim() || doctorNameSearch.trim();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCases();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCases]);

  const renderLoadingSkeleton = () => (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, styles.loadingCard]}>
          <View style={[styles.loadingBar, { width: '75%', height: 16 }]} />
          <View style={[styles.loadingBar, { width: '100%', height: 12, marginTop: 8 }]} />
          <View style={[styles.loadingBar, { width: '100%', height: 120, marginTop: 12 }]} />
          <View style={styles.loadingFooter}>
            <View style={[styles.loadingBar, { width: 60, height: 12 }]} />
            <View style={[styles.loadingBar, { width: 60, height: 12 }]} />
            <View style={[styles.loadingBar, { width: 60, height: 12 }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => {
    let title = "No cases available";
    let subtitle = "Be the first to share a case!";

    if (hasActiveFilters) {
      title = "No cases match your filters";
      const activeFilters = [];
      if (selectedSpecialty !== "All Cases") activeFilters.push(`specialty: ${selectedSpecialty}`);
      if (titleSearchKeyword.trim()) activeFilters.push(`title: "${titleSearchKeyword}"`);
      if (doctorNameSearch.trim()) activeFilters.push(`doctor: "${doctorNameSearch}"`);
      
      subtitle = `Try adjusting your filters: ${activeFilters.join(", ")}`;
    } else if (selectedSpecialty !== "All Cases") {
      title = `No ${selectedSpecialty} cases`;
      subtitle = `No cases found for ${selectedSpecialty} specialty.`;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearAllFilters}
          >
            <Ionicons name="close-circle" size={16} color="#FF3B30" />
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!user?.isApproved) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <View style={styles.pendingContainer}>
          <View style={styles.pendingIcon}>
            <Ionicons name="document-text-outline" size={48} color="#F59E0B" />
          </View>
          <Text style={styles.pendingTitle}>Account Under Review</Text>
          <Text style={styles.pendingSubtitle}>
            Your account is being reviewed. You'll be notified once approved.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Cases</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'specialty' && styles.activeTab]}
          onPress={() => setActiveTab('specialty')}
        >
          <Text style={[styles.tabText, activeTab === 'specialty' && styles.activeTabText]}>
            {user?.specialty || 'Your Specialty'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.filterContainer}>
          <View style={styles.specialtyFilterContainer}>
            <View style={styles.activeFiltersContainer}>
              <View style={styles.currentFilterContainer}>
                <Text style={styles.currentFilterLabel}>Active filters:</Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearAllFilters}
                >
                  <Ionicons name="close-circle" size={14} color="#FF3B30" />
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activeFiltersRow}>
                {selectedSpecialty !== "All Cases" && (
                  <View style={styles.activeFilterChip}>
                    <Ionicons name="medical" size={12} color="#1976D2" />
                    <Text style={styles.activeFilterText}>{selectedSpecialty}</Text>
                  </View>
                )}
                {titleSearchKeyword.trim() && (
                  <View style={styles.activeFilterChip}>
                    <Ionicons name="document-text" size={12} color="#1976D2" />
                    <Text style={styles.activeFilterText}>"{titleSearchKeyword}"</Text>
                  </View>
                )}
                {doctorNameSearch.trim() && (
                  <View style={styles.activeFilterChip}>
                    <Ionicons name="person" size={12} color="#1976D2" />
                    <Text style={styles.activeFilterText}>"{doctorNameSearch}"</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Cases List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {casesLoading ? (
          renderLoadingSkeleton()
        ) : filteredCases.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.container}>
            {filteredCases.map((caseData: CaseWithAuthor) => (
              <CaseCard
                key={caseData.id}
                case={caseData}
                onPress={() => {
                  setSelectedCase(caseData);
                  setShowCaseDetail(true);
                }}
                onProfilePress={(userId) => {
                  navigation.navigate('PublicProfile', { userId });
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setShowNewCaseModal(true)}
        icon="add"
        style={styles.fab}
      />

      {/* Modals */}
      <NewCaseModal
        isOpen={showNewCaseModal}
        onClose={() => setShowNewCaseModal(false)}
      />

      <CaseDetailModal
        visible={showCaseDetail}
        onClose={() => {
          setShowCaseDetail(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
        onProfilePress={(userId) => {
          navigation.navigate('PublicProfile', { userId });
        }}
      />

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Cases</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSearchModal(false)}
              >
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            {/* Search by Case Title/Keywords */}
            <View style={styles.searchSection}>
              <View style={styles.searchSectionHeader}>
                <Ionicons name="document-text" size={20} color="#007AFF" />
                <Text style={styles.searchSectionTitle}>Search by Case</Text>
              </View>
              <Text style={styles.searchSectionSubtitle}>
                Find cases by keywords in titles (e.g., chest pain, fracture, diabetes)
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter case keywords..."
                value={titleSearchKeyword}
                onChangeText={setTitleSearchKeyword}
              />
            </View>

            {/* Search by Doctor */}
            <View style={styles.searchSection}>
              <View style={styles.searchSectionHeader}>
                <Ionicons name="person" size={20} color="#007AFF" />
                <Text style={styles.searchSectionTitle}>Search by Doctor</Text>
              </View>
              <Text style={styles.searchSectionSubtitle}>
                Find cases by doctor's name (e.g., John, Smith, Dr. Johnson)
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter doctor name..."
                value={doctorNameSearch}
                onChangeText={setDoctorNameSearch}
              />
            </View>

            {/* Search by Specialty (only in All tab) */}
            {activeTab === 'all' && (
              <View style={styles.searchSection}>
                <View style={styles.searchSectionHeader}>
                  <Ionicons name="medical" size={20} color="#007AFF" />
                  <Text style={styles.searchSectionTitle}>Search by Specialty</Text>
                </View>
                <Text style={styles.searchSectionSubtitle}>
                  Filter cases by medical specialty
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Search specialties..."
                  value={specialtySearch}
                  onChangeText={handleSpecialtySearchChange}
                  onFocus={() => setShowSpecialtySuggestions(specialtySearch.length > 0)}
                />
                
                {/* Specialty Suggestions */}
                {showSpecialtySuggestions && filteredSpecialties.length > 0 && (
                  <View style={styles.modalSuggestions}>
                    {filteredSpecialties.slice(0, 6).map((specialty) => (
                      <TouchableOpacity
                        key={specialty}
                        style={styles.modalSuggestionItem}
                        onPress={() => {
                          handleSpecialtyFilter(specialty);
                          setShowSpecialtySuggestions(false);
                        }}
                      >
                        <Text style={styles.modalSuggestionText}>{specialty}</Text>
                        {specialty !== "All Cases" && (
                          <Text style={styles.modalSuggestionSubtext}>Medical Specialty</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Clear All Button */}
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={() => {
                  clearAllFilters();
                  setShowSearchModal(false);
                }}
              >
                <Ionicons name="refresh" size={20} color="#FF3B30" />
                <Text style={styles.modalClearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.modalApplyButton}
              onPress={() => setShowSearchModal(false)}
            >
              <Text style={styles.modalApplyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchResultsContainer: {
    padding: 16,
  },
  searchResultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3C3C43",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  searchFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 12,
    color: "#3C3C43",
  },
  specialtyFilterContainer: {
    padding: 16,
    position: "relative",
  },
  specialtyInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  currentFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  currentFilterLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  currentFilterChip: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  currentFilterText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 120, // Increased from 80 to account for additional filter inputs
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    maxHeight: 240,
    zIndex: 1000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  suggestionSubtext: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
  },
  loadingBar: {
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
  },
  loadingFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  pendingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  pendingIcon: {
    width: 96,
    height: 96,
    backgroundColor: "#FEF3C7",
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  pendingSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  additionalFilter: {
    marginTop: 8,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  activeFiltersContainer: {
    marginTop: 8,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  activeFilterChip: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  // Modal styles
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  searchSectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  modalSuggestions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  modalSuggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalSuggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  modalSuggestionSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalClearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 24,
    gap: 8,
  },
  modalClearButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  modalApplyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  modalApplyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
