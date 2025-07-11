import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
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
  useOverlay?: boolean; // New prop to use overlay instead of modal
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
  onProfilePress,
  useOverlay = false
}: CommentAgreersModalProps): React.ReactElement | null {
  
  // Fetch comment agreers
  const { data: agreersData, isLoading } = useQuery({
    queryKey: ["/api/comments", commentId, "agrees"],
    queryFn: () => apiRequest("GET", `/api/comments/${commentId}/agrees`),
    enabled: !!commentId && visible,
    retry: false,
  });

  const agreers = agreersData?.agreers || [];
  
  console.log('CommentAgreersModal render:', { 
    visible, 
    commentId, 
    agreersCount: agreers.length,
    isLoading,
    modalStackLevel: 'CommentAgreersModal received props'
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleProfilePress = (userId: string) => {
    console.log('Profile pressed in CommentAgreersModal:', userId);
    console.log('onProfilePress function exists:', !!onProfilePress);
    onProfilePress?.(userId);
  };

  if (!commentId) return null;

  const modalContent = (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={useOverlay ? styles.overlayBackground : styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="people" size={20} color="#4ECDC4" />
                </View>
                <Text style={styles.headerTitle}>Agreed ({agreers.length})</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ECDC4" />
            </View>
          ) : agreers.length > 0 ? (
            <View style={styles.agreersContainer}>
              {agreers.map((agreeer: CommentAgreeer) => (
                <TouchableOpacity 
                  key={agreeer.id}
                  style={styles.agreeerCard}
                  onPress={() => {
                    console.log('TouchableOpacity pressed for user:', agreeer.id);
                    handleProfilePress(agreeer.id);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                        <Ionicons name="medical" size={10} color="#4ECDC4" />
                        <Text style={styles.specialtyText}>{agreeer.specialty}</Text>
                      </View>
                      {agreeer.level && (
                        <View style={styles.levelBadge}>
                          <Ionicons name="ribbon" size={10} color="#059669" />
                          <Text style={styles.levelText}>{agreeer.level}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.agreementIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={32} color="#E1E8ED" />
              <Text style={styles.emptyTitle}>No agreements yet</Text>
            </View>
          )}
        </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );

  if (useOverlay) {
    return visible ? modalContent : null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '60%',
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF3F4",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E6F7FF",
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
    maxHeight: 300,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  agreersContainer: {
    paddingTop: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  agreeerCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    minHeight: 60,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  specialtyText: {
    fontSize: 10,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  levelBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  levelText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
  },
  agreementIndicator: {
    padding: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
    textAlign: "center",
  },
});
