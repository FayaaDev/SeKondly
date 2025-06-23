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
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/queryClient";
import CaseCard from "../components/CaseCard";
import CaseDetailModal from "../components/CaseDetailModal";
import CommentModal from "../components/CommentModal";
import NewCaseModal from "../components/NewCaseModal";
import { SearchModal } from "../components";
import ProfileModal from "../components/ProfileModal";
import FloatingActionButton from "../components/FloatingActionButton";
import { MEDICAL_SPECIALTIES } from "../types/shared";
import type { 
  Tab, 
  CaseWithAuthor, 
  Notification, 
  SearchFilters
} from "../types/schema";

export default function HomeScreen() {
  const [currentTab, setCurrentTab] = useState<Tab>("feed");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All Cases");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ 
    query: "", 
    specialty: "", 
    dateRange: "" 
  });
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithAuthor | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentModalCase, setCommentModalCase] = useState<{ id: number; title: string } | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const { user, isLoading } = useAuth();

  // Check if user is approved
  useEffect(() => {
    if (user && !user.isApproved) {
      Alert.alert(
        "Account Pending",
        "Your account is still under review.",
        [{ text: "OK" }]
      );
    }
  }, [user]);

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

  // My cases query
  const { 
    data: myCases = [], 
    isLoading: myCasesLoading 
  } = useQuery({
    queryKey: ["/api/my-cases"],
    queryFn: () => apiRequest("GET", "/api/my-cases"),
    enabled: !!user?.isApproved && currentTab === "mycases",
    retry: false,
  });

  // Notifications query
  const { 
    data: notifications = [], 
    isLoading: notificationsLoading 
  } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications"),
    enabled: !!user?.isApproved && currentTab === "notifications",
    retry: false,
  });

  // Unread notifications count
  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: () => apiRequest("GET", "/api/notifications/unread-count"),
    enabled: !!user?.isApproved,
    refetchInterval: 30000,
    retry: false,
  });

  // Favorites query
  const { 
    data: favorites = [], 
    isLoading: favoritesLoading 
  } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: () => apiRequest("GET", "/api/favorites"),
    enabled: !!user?.isApproved && currentTab === "favorites",
    retry: false,
  });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchCases();
    } catch (error) {
      console.error("Refresh error:", error);
    }
    setRefreshing(false);
  };

  // Filter cases by specialty
  const specialties = ["All Cases", ...MEDICAL_SPECIALTIES];

  const filteredCases = isSearchActive 
    ? searchResults
    : selectedSpecialty === "All Cases" 
      ? cases 
      : cases?.filter((caseData: CaseWithAuthor) => 
          caseData.specialty === selectedSpecialty
        ) || [];

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>SeKondly</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications" size={24} color="#007AFF" />
          {unreadCount.count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount.count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render specialty filter
  const renderSpecialtyFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.specialtyScroll}
      >
        {specialties.map((specialty) => (
          <TouchableOpacity
            key={specialty}
            style={[
              styles.specialtyChip,
              selectedSpecialty === specialty && styles.specialtyChipActive
            ]}
            onPress={() => setSelectedSpecialty(specialty)}
          >
            <Text
              style={[
                styles.specialtyText,
                selectedSpecialty === specialty && styles.specialtyTextActive
              ]}
            >
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render case card (simplified for now)
  const renderCaseCard = (caseData: CaseWithAuthor) => (
    <CaseCard
      key={caseData.id}
      case={caseData}
      onPress={() => {
        setSelectedCase(caseData);
        setShowCaseDetail(true);
      }}
      onProfilePress={(userId) => {
        setShowProfileModal(true);
        // TODO: Set userId for ProfileModal
        console.log("Profile pressed:", userId);
      }}
    />
  );

  // Render content based on current tab
  const renderContent = () => {
    const isLoading = casesLoading || myCasesLoading || notificationsLoading || favoritesLoading;
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      );
    }

    switch (currentTab) {
      case "feed":
        return (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderSpecialtyFilter()}
            {filteredCases.map(renderCaseCard)}
          </ScrollView>
        );
      
      case "mycases":
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>My Cases</Text>
            {myCases.map(renderCaseCard)}
          </ScrollView>
        );
      
      case "favorites":
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            {favorites.map(renderCaseCard)}
          </ScrollView>
        );
      
      case "notifications":
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifications.map((notification: Notification) => (
              <View key={notification.id} style={styles.notificationCard}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
            ))}
          </ScrollView>
        );
      
      case "profile":
        // Open profile modal and reset to feed tab
        setShowProfileModal(true);
        setCurrentTab("feed");
        return null;
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}
      {renderContent()}
      
      {/* Case Detail Modal */}
      <CaseDetailModal
        visible={showCaseDetail}
        onClose={() => {
          setShowCaseDetail(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
        onProfilePress={(userId) => {
          setShowProfileModal(true);
          // TODO: Set userId for ProfileModal  
          console.log("Profile pressed from modal:", userId);
        }}
      />
      
      {/* Comment Modal */}
      {commentModalCase && (
        <CommentModal
          visible={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setCommentModalCase(null);
          }}
          caseId={commentModalCase.id}
          caseTitle={commentModalCase.title}
        />
      )}
      
      {/* New Case Modal */}
      <NewCaseModal
        isOpen={showNewCaseModal}
        onClose={() => setShowNewCaseModal(false)}
      />
      
      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={(filters: any) => {
          setSearchFilters(filters);
          setIsSearchActive(true);
          // TODO: Implement search functionality
          console.log('Search filters:', filters);
        }}
      />
      
      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      
      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setShowNewCaseModal(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    marginLeft: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specialtyScroll: {
    paddingHorizontal: 16,
  },
  specialtyChip: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  specialtyChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  specialtyText: {
    fontSize: 14,
    color: "#666",
  },
  specialtyTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 16,
    color: "#333",
  },
  notificationCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
  },
  profileCard: {
    alignItems: "center",
    padding: 32,
    margin: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileAvatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileSpecialty: {
    fontSize: 16,
    color: "#666",
  },
});
