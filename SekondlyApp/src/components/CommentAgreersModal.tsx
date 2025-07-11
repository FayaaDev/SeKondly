import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { API_BASE_URL } from "../config/api";

interface CommentAgreersModalProps {
  visible: boolean;
  onClose: () => void;
  commentId: string | null;
  onProfilePress?: (userId: string) => void;
}

interface CommentAgreeer {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  level?: string;
  profileImageUrl?: string | null;
}

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl; // Already a full URL
  }
  return `${API_BASE_URL}${imageUrl}`; // Convert relative URL to full URL
};

export default function CommentAgreersModal({ 
  visible, 
  onClose, 
  commentId,
  onProfilePress 
}: CommentAgreersModalProps): React.ReactElement | null {
  
  // Fetch comment agreers
  const { data: agreersData, isLoading } = useQuery({
    queryKey: ["/api/comments", commentId, "agrees"],
    queryFn: () => apiRequest("GET", `/api/comments/${commentId}/agrees`),
    enabled: !!commentId && visible,
    retry: false,
  });

  const agreers = agreersData?.agreers || [];

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleProfilePress = (userId: string) => {
    onProfilePress?.(userId);
    onClose();
  };

  if (!commentId) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            </View>
            <Text style={styles.headerTitle}>Medical Agreement</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>
              {agreers.length} {agreers.length === 1 ? 'medical professional agrees' : 'medical professionals agree'}
            </Text>
            <Text style={styles.statsSubtitle}>
              Healthcare professionals who found this insight valuable
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ECDC4" />
              <Text style={styles.loadingText}>Loading agreement details...</Text>
            </View>
          ) : agreers.length > 0 ? (
            <View style={styles.agreersContainer}>
              {agreers.map((agreeer: CommentAgreeer) => (
                <TouchableOpacity 
                  key={agreeer.id}
                  style={styles.agreeerCard}
                  onPress={() => handleProfilePress(agreeer.id)}
                >
                  <View style={styles.agreeerAvatar}>
                    {agreeer.profileImageUrl ? (
                      <ExpoImage
                        source={{ uri: getFullImageUrl(agreeer.profileImageUrl) }}
                        style={styles.agreeerAvatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.agreeerAvatarText}>
                        {getInitials(agreeer.firstName, agreeer.lastName)}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.agreeerInfo}>
                    <Text style={styles.agreeerName}>
                      Dr. {agreeer.firstName} {agreeer.lastName}
                    </Text>
                    <View style={styles.agreeerCredentials}>
                      <View style={styles.specialtyBadge}>
                        <Ionicons name="medical" size={12} color="#4ECDC4" />
                        <Text style={styles.specialtyText}>{agreeer.specialty}</Text>
                      </View>
                      {agreeer.level && (
                        <View style={styles.levelBadge}>
                          <Ionicons name="ribbon" size={12} color="#059669" />
                          <Text style={styles.levelText}>{agreeer.level}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.agreementIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#E1E8ED" />
              </View>
              <Text style={styles.emptyTitle}>No agreements yet</Text>
              <Text style={styles.emptyText}>
                Be the first medical professional to agree with this insight
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    borderBottomColor: "#EFF3F4",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#FAFBFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: "center",
  },
  statsSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
    fontWeight: "500",
  },
  agreersContainer: {
    paddingTop: 16,
  },
  agreeerCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  agreeerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  agreeerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  agreeerAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  agreeerInfo: {
    flex: 1,
  },
  agreeerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  agreeerCredentials: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  specialtyBadge: {
    backgroundColor: "#E6F7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  levelBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  agreementIndicator: {
    padding: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});
