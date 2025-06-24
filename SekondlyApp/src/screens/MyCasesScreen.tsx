import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/queryClient";
import CaseCard from "../components/CaseCard";
import CaseDetailModal from "../components/CaseDetailModal";
import NewCaseModal from "../components/NewCaseModal";
import FloatingActionButton from "../components/FloatingActionButton";
import type { CaseWithAuthor } from "../types/schema";

/**
 * MyCasesScreen - Display user's published medical cases
 * 
 * Features:
 * - View all cases created by the user
 * - See case status (published/pending)
 * - Quick access to create new cases
 * - View detailed case statistics
 * - Pull-to-refresh functionality
 * 
 * @example
 * ```tsx
 * <MyCasesScreen />
 * ```
 */
export default function MyCasesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithAuthor | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  
  const { user } = useAuth();

  // Query for user's cases
  const { 
    data: myCases = [], 
    isLoading: myCasesLoading, 
    refetch: refetchMyCases 
  } = useQuery({
    queryKey: ["/api/my-cases"],
    queryFn: () => apiRequest("GET", "/api/my-cases"),
    enabled: !!user?.isApproved,
    retry: false,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchMyCases();
    } finally {
      setRefreshing(false);
    }
  }, [refetchMyCases]);

  const renderLoadingSkeleton = () => (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.caseCard, styles.loadingCard]}>
          <View style={[styles.loadingBar, { width: '75%', height: 16 }]} />
          <View style={[styles.loadingBar, { width: '50%', height: 12, marginTop: 8 }]} />
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
      <Text style={styles.emptyTitle}>No cases yet</Text>
      <Text style={styles.emptySubtitle}>Start sharing your medical cases with colleagues.</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowNewCaseModal(true)}
      >
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Share Your First Case</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCaseItem = (caseData: any) => (
    <TouchableOpacity
      key={caseData.id}
      style={styles.caseCard}
      onPress={() => {
        setSelectedCase(caseData);
        setShowCaseDetail(true);
      }}
    >
      <View style={styles.caseHeader}>
        <Text style={styles.caseTitle}>{caseData.title}</Text>
        {caseData.isApproved && (
          <View style={[styles.statusBadge, styles.publishedBadge]}>
            <Text style={[styles.statusText, styles.publishedText]}>Published</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.caseDate}>
        {caseData.isApproved 
          ? `Published ${new Date(caseData.approvedAt || caseData.createdAt).toLocaleDateString()}`
          : `Submitted ${new Date(caseData.createdAt).toLocaleDateString()}`
        }
      </Text>
      
      <View style={styles.caseStats}>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={12} color="#8E8E93" />
          <Text style={styles.statText}>{caseData.viewsCount || 0} views</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={12} color="#8E8E93" />
          <Text style={styles.statText}>{caseData.commentsCount || 0} comments</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={12} color="#8E8E93" />
          <Text style={styles.statText}>{caseData.likesCount || 0} likes</Text>
        </View>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.caseCount}>{myCases.length} cases</Text>
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
        {myCasesLoading ? (
          renderLoadingSkeleton()
        ) : myCases.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.container}>
            {myCases.map(renderCaseItem)}
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
  caseCount: {
    fontSize: 14,
    color: "#8E8E93",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  container: {
    padding: 16,
    gap: 12,
  },
  caseCard: {
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
  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publishedBadge: {
    backgroundColor: "#007AFF",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  publishedText: {
    color: "#FFFFFF",
  },
  caseDate: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 12,
  },
  caseStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#8E8E93",
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#4ECDC4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
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
});
