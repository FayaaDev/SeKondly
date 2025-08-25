import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
} from "react-native";
import * as Haptics from 'expo-haptics';
import PagerView from 'react-native-pager-view';
import { 
  GestureHandlerRootView, 
  PanGestureHandler, 
  Directions,
  State,
  PanGestureHandlerGestureEvent 
} from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  runOnJS, 
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from "../hooks/useAuth";
import { apiRequest, SearchManager, CacheManager } from "../lib/queryClient";
import StorageService from "../lib/storage";
import CaseCard from "../components/CaseCard";
import CaseDetailModal from "../components/CaseDetailModal";
import NewCaseModal from "../components/NewCaseModal";
import FloatingActionButton from "../components/FloatingActionButton";
import type { CaseWithAuthor } from "../types/schema";
import type { HomeStackParamList } from "../types/navigation";
import { MEDICAL_SPECIALTIES } from '../types/shared';

type FeedScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Feed'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const tabPagerRef = useRef<PagerView>(null);
  const allPagerRef = useRef<PagerView>(null);
  const specialtyPagerRef = useRef<PagerView>(null);
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
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pagerKey, setPagerKey] = useState(0); // Add key to force PagerView re-render
  
  // Animated values for smooth tab transitions
  const translateX = useSharedValue(0);
  const isHorizontalGesture = useSharedValue(false);
  
  // Pan gesture handler refs
  const horizontalGestureRef = useRef<PanGestureHandler>(null);
  
  const { user } = useAuth();

  // Show disclaimer on sign-in (unless user chose not to show it again)
  useEffect(() => {
    const checkDisclaimerPreference = async () => {
      if (user?.isApproved) {
        try {
          const settings = await StorageService.getAppSettings();
          if (!settings?.disclaimer?.hideDisclaimer) {
            setShowDisclaimer(true);
          }
        } catch (error) {
          console.error('Error checking disclaimer preference:', error);
          setShowDisclaimer(true);
        }
      }
    };
    
    checkDisclaimerPreference();
  }, [user?.isApproved]);

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
  };

  const handleDisclaimerDontShowAgain = async () => {
    try {
      const currentSettings = await StorageService.getAppSettings();
      if (currentSettings) {
        const updatedSettings = {
          ...currentSettings,
          disclaimer: {
            hideDisclaimer: true,
          },
        };
        await StorageService.setAppSettings(updatedSettings);
      }
      setShowDisclaimer(false);
    } catch (error) {
      console.error('Error saving disclaimer preference:', error);
      setShowDisclaimer(false);
    }
  };

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
  const allTabCases = React.useMemo(() => {
    let filtered = cases;
    
    // In All tab: show all cases (including user's specialty cases)
    // This ensures shared cases appear in both All feed and specialty feed
    // No filtering by user's specialty here - we want to show everything in All tab

    // Apply specialty filter if selected in All tab
    if (selectedSpecialty !== "All Cases") {
      const selectedSpecialtyLower = selectedSpecialty.toLowerCase();
      filtered = filtered.filter((case_data: any) => 
        case_data.specialty.toLowerCase() === selectedSpecialtyLower
      );
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
    
    // Sort to ensure admin cases (from 'admin@sekondly.app') always appear last
    filtered.sort((a: any, b: any) => {
      const aIsAdmin = a.author?.email === 'admin@sekondly.app';
      const bIsAdmin = b.author?.email === 'admin@sekondly.app';
      
      // If one is admin and other is not, put non-admin first
      if (aIsAdmin && !bIsAdmin) return 1;
      if (!aIsAdmin && bIsAdmin) return -1;
      
      // If both are admin or both are user, maintain original order (by creation date)
      return 0;
    });
    
    return filtered;
  }, [cases, selectedSpecialty, user?.specialty, user?.id, titleSearchKeyword, doctorNameSearch]);

  const specialtyTabCases = React.useMemo(() => {
    let filtered = cases;
    
    // In specialty tab: show only user's specialty cases (excluding user's own cases)
    if (user?.specialty) {
      const userSpecialty = user.specialty.toLowerCase();
      filtered = filtered.filter((case_data: any) => 
        case_data.specialty.toLowerCase() === userSpecialty && 
        case_data.authorId !== user.id
      );
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
    
    // Sort to ensure admin cases (from 'admin@sekondly.app') always appear last
    filtered.sort((a: any, b: any) => {
      const aIsAdmin = a.author?.email === 'admin@sekondly.app';
      const bIsAdmin = b.author?.email === 'admin@sekondly.app';
      
      // If one is admin and other is not, put non-admin first
      if (aIsAdmin && !bIsAdmin) return 1;
      if (!aIsAdmin && bIsAdmin) return -1;
      
      // If both are admin or both are user, maintain original order (by creation date)
      return 0;
    });
    
    return filtered;
  }, [cases, user?.specialty, user?.id, titleSearchKeyword, doctorNameSearch]);

  // Current filtered cases based on active tab
  const filteredCases = activeTab === 'all' ? allTabCases : specialtyTabCases;

  // Reset specialty filter when switching tabs
  useEffect(() => {
    setSelectedSpecialty("All Cases");
  }, [activeTab]);

  // Reset specialty filter if user's specialty changes and they have their old specialty selected
  useEffect(() => {
    if (user?.specialty && selectedSpecialty !== "All Cases") {
      // No longer need to auto-reset when user has their own specialty selected
      // since we now allow viewing own specialty cases in All tab
    }
  }, [user?.specialty, selectedSpecialty, activeTab]);

  // Reset page index when filters change or tab changes
  useEffect(() => {
    setCurrentPageIndex(0);
    // Reset both pagers to first page when tab or filters change
    const resetPagers = () => {
      if (allPagerRef.current) {
        allPagerRef.current.setPage(0);
      }
      if (specialtyPagerRef.current) {
        specialtyPagerRef.current.setPage(0);
      }
    };
    
    // Add a small delay to ensure pagers are ready
    setTimeout(resetPagers, 50);
  }, [filteredCases.length, activeTab, selectedSpecialty, titleSearchKeyword, doctorNameSearch]);

  // Use MEDICAL_SPECIALTIES for the list
  const specialties = ["All Cases", ...MEDICAL_SPECIALTIES];

  // Filter specialties based on search input
  const filteredSpecialties = React.useMemo(() => {
    let availableSpecialties = specialties;
    
    // No need to exclude user's specialty from All tab filter options anymore
    // since All tab now shows all cases including user's specialty cases
    
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

  // Handle tab changes - sync with horizontal pager
  const handleTabChange = (tab: 'all' | 'specialty') => {
    setActiveTab(tab);
    const pageIndex = tab === 'all' ? 0 : 1;
    tabPagerRef.current?.setPage(pageIndex);
  };

  // Handle horizontal pager page selection
  const handleTabPageSelected = (pageIndex: number) => {
    const tab = pageIndex === 0 ? 'all' : 'specialty';
    setActiveTab(tab);
  };

  // Function to switch tabs programmatically
  const switchToTab = (tab: 'all' | 'specialty') => {
    setActiveTab(tab);
    const pageIndex = tab === 'all' ? 0 : 1;
    tabPagerRef.current?.setPage(pageIndex);
  };

  // Horizontal gesture handler for tab switching
  const horizontalGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (event) => {
      // Determine if this is primarily a horizontal gesture
      isHorizontalGesture.value = Math.abs(event.velocityX) > Math.abs(event.velocityY) * 2;
      if (isHorizontalGesture.value) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onActive: (event) => {
      // Only handle if it's clearly a horizontal gesture
      if (isHorizontalGesture.value) {
        translateX.value = event.translationX;
      }
    },
    onEnd: (event) => {
      if (isHorizontalGesture.value) {
        const threshold = screenWidth * 0.25; // 25% of screen width
        const velocity = Math.abs(event.velocityX);
        const translation = Math.abs(event.translationX);
        
        const shouldSwitch = translation > threshold || velocity > 800;
        
        if (shouldSwitch) {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
          if (event.translationX > 0 && activeTab === 'specialty') {
            // Swipe right: go to "All" tab (previous)
            runOnJS(switchToTab)('all');
          } else if (event.translationX < 0 && activeTab === 'all') {
            // Swipe left: go to "Specialty" tab (next)
            runOnJS(switchToTab)('specialty');
          }
        }
      }
      
      // Reset translation
      translateX.value = withSpring(0);
      isHorizontalGesture.value = false;
    },
  });

  // Animated style for the tab content
  const animatedTabStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, screenWidth * 0.3],
      [1, 0.8],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, screenWidth * 0.3],
      [1, 0.95],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { translateX: translateX.value * 0.1 }, // Subtle parallax effect
        { scale }
      ],
      opacity,
    };
  });

  // Swipe indicator styles
  const swipeIndicatorLeftStyle = useAnimatedStyle(() => {
    const shouldShow = translateX.value > 20 && activeTab === 'specialty';
    const opacity = interpolate(
      translateX.value,
      [20, 80],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: shouldShow ? opacity : 0,
      transform: [
        { scale: shouldShow ? opacity : 0 }
      ],
    };
  });

  const swipeIndicatorRightStyle = useAnimatedStyle(() => {
    const shouldShow = translateX.value < -20 && activeTab === 'all';
    const opacity = interpolate(
      Math.abs(translateX.value),
      [20, 80],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: shouldShow ? opacity : 0,
      transform: [
        { scale: shouldShow ? opacity : 0 }
      ],
    };
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCases();
      // Reset to first case after refresh with a slight delay to ensure pager is ready
      setCurrentPageIndex(0);
      // Force PagerView to re-render by changing the key
      setPagerKey(prev => prev + 1);
      setTimeout(() => {
        if (activeTab === 'all' && allPagerRef.current) {
          allPagerRef.current.setPage(0);
        } else if (activeTab === 'specialty' && specialtyPagerRef.current) {
          specialtyPagerRef.current.setPage(0);
        }
      }, 100);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCases, activeTab]);

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

  // Render vertical pager for cases
  const renderVerticalPager = (casesData: CaseWithAuthor[], tabType: 'all' | 'specialty') => {
    const pagerRef = tabType === 'all' ? allPagerRef : specialtyPagerRef;
    
    return (
      <View style={styles.pagerContainer}>
        <PanGestureHandler
          activeOffsetY={Platform.OS === 'android' ? [-15, 15] : [-10, 10]}
          failOffsetX={[-20, 20]}
          simultaneousHandlers={horizontalGestureRef}
        >
          <Animated.View style={{ flex: 1 }}>
            <PagerView
              ref={pagerRef}
              style={styles.pagerView}
              initialPage={0}
              orientation="vertical"
              key={`${tabType}-${casesData.length}-${pagerKey}`}
              onPageSelected={(e) => setCurrentPageIndex(e.nativeEvent.position)}
              onPageScrollStateChanged={(e) => {
                console.log(`Vertical (${tabType}) page scroll state:`, e.nativeEvent.pageScrollState);
              }}
              overdrag={Platform.OS === 'android' ? true : false}
              scrollEnabled={true}
              keyboardDismissMode="on-drag"
              pageMargin={0}
              overScrollMode={Platform.OS === 'android' ? "auto" : "never"}
              layoutDirection="ltr"
            >
          {casesData.map((caseData: CaseWithAuthor, index: number) => (
            <View key={caseData.id} style={styles.pageContainer}>
              <View style={styles.caseContainer}>
                <CaseCard
                  case={caseData}
                  onPress={() => {
                    setSelectedCase(caseData);
                    setShowCaseDetail(true);
                  }}
                  onProfilePress={(userId) => {
                    navigation.navigate('PublicProfile', { userId });
                  }}
                />
              </View>
              
              {/* Page Indicator */}
              <View style={styles.pageIndicatorContainer}>
                <View style={styles.pageIndicator}>
                  <Text style={styles.pageIndicatorText}>
                    {index + 1} of {casesData.length}
                  </Text>
                </View>
              </View>
              
              {/* Pull to refresh indicator for first page */}
              {index === 0 && refreshing && (
                <View style={styles.refreshIndicator}>
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                  <Text style={styles.refreshText}>Refreshing...</Text>
                </View>
              )}
            </View>
          ))}
          
          {/* Last page with refresh option */}
          <View key={`refresh-page-${tabType}`} style={styles.pageContainer}>
            <View style={styles.refreshPageContainer}>
              <Ionicons name="refresh-circle" size={64} color="#007AFF" />
              <Text style={styles.refreshPageTitle}>Pull to refresh</Text>
              <Text style={styles.refreshPageSubtitle}>Get the latest cases</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Ionicons 
                  name={refreshing ? "hourglass" : "refresh"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.refreshButtonText}>
                  {refreshing ? "Refreshing..." : "Refresh Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </PagerView>
          </Animated.View>
        </PanGestureHandler>
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
        <View style={styles.headerLeftButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={24} color="#4ECDC4" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "hourglass" : "refresh-circle"} 
              size={24} 
              color={refreshing ? "#8E8E93" : "#4ECDC4"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => handleTabChange('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'specialty' && styles.activeTab]}
          onPress={() => handleTabChange('specialty')}
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

      {/* Content with Gesture-Based Horizontal Tab Switching */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PanGestureHandler
          ref={horizontalGestureRef}
          onGestureEvent={horizontalGestureHandler}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-30, 30]}
          maxPointers={1}
        >
          <Animated.View style={[{ flex: 1 }, animatedTabStyle]}>
            {/* Swipe Indicators */}
            <Animated.View style={[styles.swipeIndicatorLeft, swipeIndicatorLeftStyle]}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={styles.swipeIndicatorText}>All</Text>
            </Animated.View>
            
            <Animated.View style={[styles.swipeIndicatorRight, swipeIndicatorRightStyle]}>
              <Text style={styles.swipeIndicatorText}>{user?.specialty || 'Specialty'}</Text>
              <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </Animated.View>

            {/* Render content based on active tab */}
            {activeTab === 'all' ? (
              // All Tab Content
              casesLoading ? (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#007AFF"
                      colors={["#007AFF"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  {renderLoadingSkeleton()}
                </ScrollView>
              ) : allTabCases.length === 0 ? (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#007AFF"
                      colors={["#007AFF"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  {renderEmptyState()}
                </ScrollView>
              ) : (
                renderVerticalPager(allTabCases, 'all')
              )
            ) : (
              // Specialty Tab Content
              casesLoading ? (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#007AFF"
                      colors={["#007AFF"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  {renderLoadingSkeleton()}
                </ScrollView>
              ) : specialtyTabCases.length === 0 ? (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#007AFF"
                      colors={["#007AFF"]}
                      progressBackgroundColor="#FFFFFF"
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  {renderEmptyState()}
                </ScrollView>
              ) : (
                renderVerticalPager(specialtyTabCases, 'specialty')
              )
            )}
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>

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

      {/* Disclaimer Modal */}
      <Modal
        visible={showDisclaimer}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}} // Prevent dismissing without acceptance
      >
        <View style={styles.disclaimerOverlay}>
          <View style={styles.disclaimerContainer}>
            <View style={styles.disclaimerHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#4ECDC4" />
              <Text style={styles.disclaimerTitle}>Important Notice</Text>
            </View>
            
            <Text style={styles.disclaimerText}>
              All SeKondly users are verified licensed physicians. Content on SeKondly is for discussion purposes only and should not replace the standard of care or serve as the sole guide for clinical judgment.
            </Text>
            
            <View style={styles.disclaimerButtonsContainer}>
              <TouchableOpacity
                style={[styles.disclaimerButton, styles.disclaimerSecondaryButton]}
                onPress={handleDisclaimerAccept}
              >
                <Text style={styles.disclaimerSecondaryButtonText}>Ok</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.disclaimerButton, styles.disclaimerPrimaryButton]}
                onPress={handleDisclaimerDontShowAgain}
              >
                <Text style={styles.disclaimerPrimaryButtonText}>Ok, Don't show this again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerLeftButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    borderColor: "#4ECDC4",
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: "#4ECDC4",
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
    backgroundColor: "#4ECDC4",
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
    bottom: 120,
    right: 16,
    zIndex: 20,
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
    borderBottomColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#4ECDC4',
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
    backgroundColor: '#E0F7F6',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#4ECDC4',
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
    backgroundColor: '#4ECDC4',
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
  // Pager View Styles
  pagerContainer: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  caseContainer: {
    flex: 1,
    paddingHorizontal: 8, // Reduced padding to make card wider
    paddingTop: 40,
    paddingBottom: 140, // Space for bottom navigation
    justifyContent: 'center',
  },
  pageIndicatorContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  pageIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  refreshIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  refreshText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '500',
  },
  refreshPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  refreshPageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
    marginBottom: 8,
  },
  refreshPageSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pagerCaseCard: {
    marginHorizontal: 0,
    marginVertical: 0,
    flex: 1,
    minHeight: screenHeight * 0.65, // Take at least 65% of screen height
    borderRadius: 20, // Slightly larger border radius for modern look
    shadowOpacity: 0.15, // Slightly more prominent shadow
    shadowRadius: 12,
    elevation: 6,
  },
  // Horizontal Tab Pager Styles
  tabPagerView: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  tabPageContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  // Swipe Indicator Styles
  swipeIndicatorLeft: {
    position: 'absolute',
    top: '50%',
    left: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  swipeIndicatorRight: {
    position: 'absolute',
    top: '50%',
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  swipeIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
    marginHorizontal: 4,
  },
  // Disclaimer Modal Styles
  disclaimerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  disclaimerContainer: {
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
  disclaimerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  disclaimerButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  disclaimerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disclaimerPrimaryButton: {
    backgroundColor: '#4ECDC4',
  },
  disclaimerSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  disclaimerPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerSecondaryButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
