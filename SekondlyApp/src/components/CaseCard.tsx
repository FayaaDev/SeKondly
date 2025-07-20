import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Share,
  Modal,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { apiRequest } from "../lib/queryClient";
import { handleAuthError } from "../lib/authUtils";
import { API_BASE_URL } from "../config/api";
import ImageGalleryModal from "./ImageGalleryModal";
import { useCustomAlert } from "./CustomAlert";
import { useAuth } from "../hooks/useAuth";
import type { CaseWithAuthor } from "../types/shared";

interface CaseCardProps {
  case: CaseWithAuthor;
  onPress?: () => void;
  onProfilePress?: (userId: string) => void;
}

const { width: screenWidth } = Dimensions.get("window");
const imageWidth = screenWidth - 60; // Updated to account for new padding (32 + 28 margins)
const MAX_WORDS = 150; // Reduced from 200 to save space
const UNIFIED_IMAGE_HEIGHT = 120; // Unified smaller height for all images

// Helper function to truncate text to word limit
const truncateText = (text: string): string => {
  const words = text.split(/\s+/);
  if (words.length <= MAX_WORDS) return text;
  return words.slice(0, MAX_WORDS).join(' ') + '...';
};

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl; // Already a full URL
  }
  return `${API_BASE_URL}${imageUrl}`; // Convert relative URL to full URL
};

export default function CaseCard({ 
  case: caseData, 
  onPress, 
  onProfilePress
}: CaseCardProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { showAlert, AlertComponent } = useCustomAlert();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Extract format info
  const isLongCase = caseData.format === 'long';
  const isHot = caseData.isHot;
  const isAdmin = user?.isAdmin;

  // Pulsating animation for hot cases
  useEffect(() => {
    if (isHot) {
      const pulsate = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulsate());
      };
      pulsate();
    }
  }, [isHot, pulseAnim]);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/cases/${caseData.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to like case",
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle',
          '#FF3B30'
        );
      }
    },
  });

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/cases/${caseData.id}/favorite`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      // Favorite status updated - no popup needed, UI will reflect the change
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to favorite case",
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle',
          '#FF3B30'
        );
      }
    },
  });

  // Hide specialty mutation
  const hideSpecialtyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/specialties/hide", {
        specialty: caseData.specialty
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      showAlert(
        "Specialty Hidden",
        `${caseData.specialty} cases will no longer appear in your feed.`,
        [{ text: 'OK', onPress: () => {} }],
        'eye-off',
        '#4ECDC4'
      );
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to hide specialty",
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle',
          '#FF3B30'
        );
      }
    },
  });

  // Toggle hot case mutation (admin only)
  const toggleHotMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/cases/${caseData.id}/hot`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to toggle hot status",
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle',
          '#FF3B30'
        );
      }
    },
  });

  // Helper functions
  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return past.toLocaleDateString();
  };

  const truncateHistory = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this medical case: ${caseData.title}`,
        title: caseData.title,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleMoreOptions = () => {
    showAlert(
      "Options",
      "Choose an action",
      [
        {
          text: `Not interested in ${caseData.specialty}`,
          onPress: () => hideSpecialtyMutation.mutate(),
          style: "destructive",
        },
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
      ],
      'ellipsis-horizontal',
      '#4ECDC4'
    );
  };

  const handleProfilePress = () => {
    if (caseData.author?.id) {
      onProfilePress?.(caseData.author.id);
    }
  };

  // Render image gallery
  const renderImages = () => {
    if (!caseData.imageUrls || caseData.imageUrls.length === 0) return null;

    // Limit to 3 images maximum
    const imagesToShow = caseData.imageUrls.slice(0, 3);
    const fullImageUrls = imagesToShow.map(url => getFullImageUrl(url));

    if (imagesToShow.length === 1) {
      return (
        <TouchableOpacity 
          style={styles.singleImageContainer}
          onPress={() => {
            setCurrentImageIndex(0);
            setShowImageGallery(true);
          }}
        >
          <ExpoImage
            source={{ uri: fullImageUrls[0] }}
            style={styles.singleImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      );
    }

    if (imagesToShow.length === 2) {
      return (
        <View style={styles.imageGrid}>
          {imagesToShow.map((url, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.twoImageContainer}
              onPress={() => {
                setCurrentImageIndex(index);
                setShowImageGallery(true);
              }}
            >
              <ExpoImage
                source={{ uri: getFullImageUrl(url) }}
                style={styles.gridImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // Three images - special layout
    return (
      <View style={styles.threeImageGrid}>
        <TouchableOpacity 
          style={styles.largeImageContainer}
          onPress={() => {
            setCurrentImageIndex(0);
            setShowImageGallery(true);
          }}
        >
          <ExpoImage
            source={{ uri: getFullImageUrl(imagesToShow[0]) }}
            style={styles.gridImage}
            contentFit="cover"
          />
        </TouchableOpacity>
        <View style={styles.smallImagesColumn}>
          {imagesToShow.slice(1).map((url, index) => (
            <TouchableOpacity 
              key={index + 1} 
              style={styles.smallImageContainer}
              onPress={() => {
                setCurrentImageIndex(index + 1);
                setShowImageGallery(true);
              }}
            >
              <ExpoImage
                source={{ uri: getFullImageUrl(url) }}
                style={styles.gridImage}
                contentFit="cover"
              />
              {index === 1 && caseData.imageUrls!.length > 3 && (
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>
                    +{caseData.imageUrls!.length - 3}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render case content based on format
  const renderCaseContent = () => {
    // For both long and short cases, show only history in feed view
    // All detailed fields will be shown when the case is clicked (in modal)
    return (
      <View style={styles.historyContainer}>
        <Text style={styles.history} numberOfLines={4}>
          {truncateText(caseData.history)}
        </Text>
        {caseData.history.length > MAX_WORDS && (
          <TouchableOpacity 
            style={styles.readMoreButton}
            onPress={onPress}
          >
            <Text style={styles.readMoreText}>Read more</Text>
          </TouchableOpacity>
        )}
        {isLongCase && (
          <View style={styles.longCaseBadge}>
            <Text style={styles.longCaseBadgeText}>Long Case</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.container,
          isHot && styles.hotContainer,
          isHot && { transform: [{ scale: pulseAnim }] }
        ]}
      >
      {/* Hot Case Indicator */}
      {isHot && (
        <View style={styles.hotIndicator}>
          <Ionicons name="flame" size={16} color="#4ECDC4" />
          <Text style={styles.hotIndicatorText}>HOT</Text>
        </View>
      )}
      
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorInfo} onPress={handleProfilePress}>
          <View style={styles.avatar}>
            {caseData.author?.profileImageUrl ? (
              <ExpoImage
                source={{ uri: getFullImageUrl(caseData.author.profileImageUrl) }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {getInitials(caseData.author?.firstName, caseData.author?.lastName)}
              </Text>
            )}
          </View>
          <View style={styles.authorDetails}>
            <View style={styles.authorNameRow}>
              <View style={styles.nameWithIndicator}>
                <Text style={styles.authorName}>
                  {caseData.author?.firstName} {caseData.author?.lastName}
                </Text>
                {caseData.isAuthorFollowedByUser && (
                  <View style={styles.followingIndicator}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                  </View>
                )}
              </View>
              <View style={styles.badgesContainer}>
                {caseData.author?.level && (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{caseData.author.level}</Text>
                  </View>
                )}
                <View style={styles.specialtyBadge}>
                  <Text style={styles.specialtyBadgeText}>{caseData.specialty}</Text>
                </View>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.timeAgo}>{formatTimeAgo(caseData.createdAt || new Date())}</Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.viewCount}>{caseData.viewsCount} views</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>{caseData.title}</Text>

      {/* Case Content (Short or Long format) */}
      {renderCaseContent()}

      {/* Images - Make sure they have proper spacing */}
      {renderImages()}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onPress}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{caseData.commentsCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => favoriteMutation.mutate()}
        >
          <Ionicons
            name={caseData.isFavoritedByUser ? "heart" : "heart-outline"}
            size={20}
            color={caseData.isFavoritedByUser ? "#4ECDC4" : "#666"}
          />
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={[styles.actionButton, isHot && styles.hotActionButton]}
            onPress={() => toggleHotMutation.mutate()}
          >
            <Ionicons
              name={isHot ? "flame" : "flame-outline"}
              size={20}
              color={isHot ? "#4ECDC4" : "#666"}
            />
            <Text style={[styles.actionText, isHot && styles.hotActionText]}>
              {isHot ? "Hot" : "Hot"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        visible={showImageGallery}
        images={caseData.imageUrls?.map(getFullImageUrl) || []}
        initialIndex={currentImageIndex}
        onClose={() => setShowImageGallery(false)}
      />
      
      {/* Custom Alert Component */}
      <AlertComponent />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6, // Reduced from 8 to save vertical space
    borderRadius: 16,
    padding: 14, // Reduced from 16 to save space
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hotContainer: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#4ECDC4",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10, // Reduced from 12
  },
  authorInfo: {
    flexDirection: "row",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  authorDetails: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  nameWithIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  followingIndicator: {
    marginLeft: 4,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 8,
    padding: 2,
  },
  specialtyBadge: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  specialtyBadgeText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  levelBadge: {
    backgroundColor: "#E8FDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeAgo: {
    fontSize: 14,
    color: "#666",
  },
  metaSeparator: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 6,
  },
  viewCount: {
    fontSize: 14,
    color: "#666",
  },
  moreButton: {
    padding: 4,
  },
  title: {
    fontSize: 17, // Reduced from 18 to save space
    fontWeight: "600",
    color: "#333",
    marginBottom: 10, // Reduced from 12
    lineHeight: 22, // Reduced from 24
  },
  historyContainer: {
    marginTop: 8,
    marginBottom: 12, // Reduced from 16 to make more compact
  },
  history: {
    fontSize: 15,
    lineHeight: 20,
    color: "#333",
  },
  readMoreButton: {
    marginTop: 4,
  },
  readMoreText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "600",
  },
  singleImageContainer: {
    marginBottom: 12, // Reduced from 16
    marginTop: 8, // Add top margin to ensure spacing
    borderRadius: 12,
    overflow: "hidden",
  },
  singleImage: {
    width: imageWidth,
    height: UNIFIED_IMAGE_HEIGHT,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12, // Reduced from 16
    marginTop: 8, // Add top margin to ensure spacing
    gap: 4,
  },
  gridImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    // Dynamic width based on number of images
    // 2 images: half width each
    // 3 images: first image full width, second and third half width
    flex: 1,
    minHeight: UNIFIED_IMAGE_HEIGHT,
    maxHeight: UNIFIED_IMAGE_HEIGHT,
  },
  twoImageContainer: {
    width: (imageWidth - 4) / 2,
    height: UNIFIED_IMAGE_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  threeImageGrid: {
    flexDirection: "row",
    marginBottom: 12, // Reduced from 16
    marginTop: 8, // Add top margin to ensure spacing
    gap: 4,
    height: UNIFIED_IMAGE_HEIGHT,
  },
  largeImageContainer: {
    width: (imageWidth * 2) / 3,
    height: UNIFIED_IMAGE_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  smallImagesColumn: {
    flex: 1,
    gap: 4,
  },
  smallImageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlayText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  actionTextActive: {
    color: "#4ECDC4",
  },
  hotActionButton: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "#4ECDC4",
  },
  hotActionText: {
    color: "#4ECDC4",
    fontWeight: "600",
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  moreImagesOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderTopLeftRadius: 8,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Long case format styles
  longCaseContainer: {
    marginTop: 12,
  },
  contentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
  },
  longCaseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 4, // Add bottom margin to ensure spacing before images
  },
  longCaseBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  hotIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  hotIndicatorText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});
