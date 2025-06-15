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
import SearchModal from "../components/SearchModal";
import FloatingActionButton from "../components/FloatingActionButton";
import type { CaseWithAuthor, SearchFilters } from "../types/schema";
import type { HomeStackParamList } from "../types/navigation";
import { MEDICAL_SPECIALTIES } from '../types/shared';

type FeedScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Feed'>;

/**
 * FeedScreen - Main feed showing all medical cases
 * 
 * Features:
 * - Browse all medical cases
 * - Filter by specialty
 * - Search functionality
 * - Real-time search suggestions
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
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ 
    query: "", 
    specialty: "", 
    dateRange: "" 
  });
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithAuthor | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const { user } = useAuth();

  // Query for cases
  const { 
    data: cases = [], 
    isLoading: casesLoading, 
    refetch: refetchCases 
  } = useQuery({
    queryKey: ["/api/cases"],
    queryFn: () => apiRequest("GET", "/api/cases"),
    enabled: !!user?.isApproved && !isSearchActive,
    retry: false,
  });

  // Search results query
  const { 
    data: searchResults = [], 
    isLoading: searchLoading 
  } = useQuery({
    queryKey: ["/api/cases/search", searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFilters.query) params.append('query', searchFilters.query);
      if (searchFilters.specialty && searchFilters.specialty !== 'all') {
        params.append('specialty', searchFilters.specialty);
      }
      if (searchFilters.dateRange && searchFilters.dateRange !== 'all') {
        params.append('dateRange', searchFilters.dateRange);
      }
      
      return apiRequest("GET", `/api/cases/search?${params.toString()}`);
    },
    enabled: !!user?.isApproved && isSearchActive,
    retry: false,
  });

  // Filter cases based on active tab and selected specialty
  const filteredCases = React.useMemo(() => {
    if (isSearchActive) return searchResults;
    
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

      // Apply specialty filter if selected in All tab
      if (selectedSpecialty !== "All Cases") {
        filtered = filtered.filter((case_data: any) => 
          case_data.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
        );
      }
    }
    
    return filtered;
  }, [cases, searchResults, isSearchActive, activeTab, selectedSpecialty, user?.specialty, user?.id]);

  // Reset specialty filter when switching tabs
  useEffect(() => {
    setSelectedSpecialty("All Cases");
  }, [activeTab]);

  // Use MEDICAL_SPECIALTIES for the list
  const specialties = ["All Cases", ...MEDICAL_SPECIALTIES];

  // Filter specialties based on search input - show all matches
  const filteredSpecialties = specialtySearch 
    ? specialties.filter(specialty => 
        specialty.toLowerCase().includes(specialtySearch.toLowerCase())
      )
    : specialties;

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

  const handleSearch = async (filters: SearchFilters) => {
    setSearchFilters(filters);
    setIsSearchActive(true);
    setShowSearchModal(false);
    
    // Save search to history
    if (filters.query) {
      await SearchManager.addToHistory(filters.query, filters.specialty);
    }
  };

  const clearSearch = () => {
    setSearchFilters({ query: "", specialty: "", dateRange: "" });
    setIsSearchActive(false);
    setSelectedSpecialty("All Cases");
  };

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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>
        {selectedSpecialty === "All Cases" ? "No cases available" : `No ${selectedSpecialty} cases`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedSpecialty === "All Cases" 
          ? "Be the first to share a case!" 
          : `No cases found for ${selectedSpecialty} specialty.`
        }
      </Text>
    </View>
  );

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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
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

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        {isSearchActive ? (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>Search Results</Text>
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchFiltersContainer}>
              {searchFilters.query && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>"{searchFilters.query}"</Text>
                </View>
              )}
              {searchFilters.specialty && searchFilters.specialty !== 'all' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{searchFilters.specialty}</Text>
                </View>
              )}
              {searchFilters.dateRange && searchFilters.dateRange !== 'all' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{searchFilters.dateRange}</Text>
                </View>
              )}
            </View>
          </View>
        ) : activeTab === 'all' ? (
          <View style={styles.specialtyFilterContainer}>
            <TextInput
              style={styles.specialtyInput}
              placeholder="Search specialties (e.g. Card, Emer, Surg...)"
              value={specialtySearch}
              onChangeText={handleSpecialtySearchChange}
              onFocus={() => setShowSpecialtySuggestions(specialtySearch.length > 0)}
            />
            
            {/* Current Filter Display */}
            {selectedSpecialty !== "All Cases" && (
              <View style={styles.currentFilterContainer}>
                <Text style={styles.currentFilterLabel}>Filtering by:</Text>
                <TouchableOpacity
                  style={styles.currentFilterChip}
                  onPress={() => handleSpecialtyFilter("All Cases")}
                >
                  <Text style={styles.currentFilterText}>{selectedSpecialty}</Text>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Suggestions Dropdown */}
            {showSpecialtySuggestions && filteredSpecialties.length > 0 && (
              <ScrollView style={styles.suggestionsContainer} nestedScrollEnabled>
                {filteredSpecialties.map((specialty) => (
                  <TouchableOpacity
                    key={specialty}
                    style={styles.suggestionItem}
                    onPress={() => handleSpecialtyFilter(specialty)}
                  >
                    <Text style={styles.suggestionText}>{specialty}</Text>
                    {specialty !== "All Cases" && (
                      <Text style={styles.suggestionSubtext}>Medical Specialty</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
      </View>

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
        {(casesLoading || (isSearchActive && searchLoading)) ? (
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

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleSearch}
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
    top: 80,
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
});
