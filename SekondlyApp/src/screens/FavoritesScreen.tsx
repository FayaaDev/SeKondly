import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from "../hooks/useAuth";
import { apiRequest, CacheManager } from "../lib/queryClient";
import CaseCard from "../components/CaseCard";
import CaseDetailModal from "../components/CaseDetailModal";
import type { CaseWithAuthor } from "../types/schema";

/**
 * FavoritesScreen - Display user's favorite medical cases
 * 
 * Features:
 * - View all cases favorited by the user
 * - Easy access to saved cases
 * - Pull-to-refresh functionality
 * - Empty state for new users
 * 
 * @example
 * ```tsx
 * <FavoritesScreen />
 * ```
 */
export default function FavoritesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithAuthor | null>(null);
  const [cachedFavorites, setCachedFavorites] = useState<CaseWithAuthor[]>([]);
  
  const { user } = useAuth();
  const navigation = useNavigation();

  // Load cached favorites on mount
  useEffect(() => {
    const loadCachedData = async () => {
      const cached = await CacheManager.getCachedFavorites();
      if (cached) {
        setCachedFavorites(cached);
      }
    };
    loadCachedData();
  }, []);

  // Query for user's favorite cases
  const { 
    data: favorites = [], 
    isLoading: favoritesLoading, 
    refetch: refetchFavorites 
  } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/favorites");
      // Cache the favorites data
      await CacheManager.cacheFavorites(data);
      setCachedFavorites(data);
      return data;
    },
    enabled: !!user?.isApproved,
    retry: false,
    placeholderData: cachedFavorites, // Use cached data as placeholder
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchFavorites();
    } finally {
      setRefreshing(false);
    }
  }, [refetchFavorites]);

  const handleProfilePress = (userId: string) => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'PublicProfile',
          params: { userId }
        }
      })
    );
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, styles.loadingCard]}>
          <View style={[styles.loadingBar, { width: '75%', height: 20 }]} />
          <View style={[styles.loadingBar, { width: '50%', height: 16, marginTop: 8 }]} />
          <View style={[styles.loadingBar, { width: '25%', height: 12, marginTop: 4 }]} />
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the heart icon on cases you'd like to save for later.
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
      </View>

      {/* Favorites List */}
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
        {favoritesLoading ? (
          renderLoadingSkeleton()
        ) : favorites.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.container}>
            {favorites.map((caseData: CaseWithAuthor) => (
              <CaseCard
                key={caseData.id}
                case={caseData}
                onPress={() => {
                  setSelectedCase(caseData);
                  setShowCaseDetail(true);
                }}
                onProfilePress={handleProfilePress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Case Detail Modal */}
      <CaseDetailModal
        visible={showCaseDetail}
        onClose={() => {
          setShowCaseDetail(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
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
});
