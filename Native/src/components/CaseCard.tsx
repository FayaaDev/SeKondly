import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { apiRequest } from "../lib/queryClient";
import { handleAuthError } from "../lib/authUtils";
import { API_BASE_URL } from "../config/api";
import ImageGalleryModal from "./ImageGalleryModal";
import type { CaseWithAuthor } from "../types/schema";

interface CaseCardProps {
  case: CaseWithAuthor;
  onPress?: () => void;
  onProfilePress?: (userId: string) => void;
}

const { width: screenWidth } = Dimensions.get("window");
const imageWidth = screenWidth - 64; // Account for padding

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
  const queryClient = useQueryClient();

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
        Alert.alert("Error", error.message || "Failed to like case");
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
      Alert.alert(
        "Success",
        data?.favorited ? "Case added to favorites" : "Case removed from favorites"
      );
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to favorite case");
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
      Alert.alert(
        "Specialty Hidden",
        `${caseData.specialty} cases will no longer appear in your feed.`
      );
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to hide specialty");
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

  const truncateHistory = (text: string, maxLength: number = 150) => {
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
    Alert.alert(
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
          style: "cancel",
        },
      ]
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorInfo} onPress={handleProfilePress}>
          <View style={styles.avatar}>
            {caseData.author?.profileImageUrl ? (
              <ExpoImage
                source={{ uri: getFullImageUrl(caseData.author?.profileImageUrl) }}
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
              <Text style={styles.authorName}>
                Dr. {caseData.author?.firstName || "Unknown"} {caseData.author?.lastName || "User"}
              </Text>
              <View style={styles.specialtyBadge}>
                <Text style={styles.specialtyBadgeText}>{caseData.specialty}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.timeAgo}>{formatTimeAgo(caseData.createdAt!)}</Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.viewCount}>{caseData.viewsCount || 0} views</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton} onPress={handleMoreOptions}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>{caseData.title}</Text>

      {/* History/Description */}
      <View style={styles.historyContainer}>
        <Text style={styles.history}>
          {showFullHistory ? caseData.history : truncateHistory(caseData.history)}
        </Text>
        {caseData.history.length > 150 && (
          <TouchableOpacity 
            style={styles.readMoreButton}
            onPress={() => setShowFullHistory(!showFullHistory)}
          >
            <Text style={styles.readMoreText}>
              {showFullHistory ? "Show less" : "Read more"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Images */}
      {renderImages()}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
        >
          <Ionicons
            name={caseData.isLikedByUser ? "thumbs-up" : "thumbs-up-outline"}
            size={20}
            color={caseData.isLikedByUser ? "#007AFF" : "#666"}
          />
          <Text style={[
            styles.actionText,
            caseData.isLikedByUser && styles.actionTextActive
          ]}>
            {caseData.likesCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onPress}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{caseData.commentsCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => favoriteMutation.mutate()}
          disabled={favoriteMutation.isPending}
        >
          <Ionicons
            name={caseData.isFavoritedByUser ? "heart" : "heart-outline"}
            size={20}
            color={caseData.isFavoritedByUser ? "#FF3B30" : "#666"}
          />
        </TouchableOpacity>
      </View>
      
      {/* Image Gallery Modal */}
      <ImageGalleryModal
        visible={showImageGallery}
        images={caseData.imageUrls?.slice(0, 3).map(url => getFullImageUrl(url)) || []}
        initialIndex={currentImageIndex}
        onClose={() => setShowImageGallery(false)}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: "row",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    lineHeight: 24,
  },
  historyContainer: {
    marginBottom: 16,
  },
  history: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "500",
  },
  singleImageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  singleImage: {
    width: imageWidth,
    height: 200,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
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
    minHeight: 120,
    maxHeight: (imageWidth - 4) / 2,
  },
  twoImageContainer: {
    width: (imageWidth - 4) / 2,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  threeImageGrid: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 4,
    height: 200,
  },
  largeImageContainer: {
    width: (imageWidth * 2) / 3,
    height: 200,
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
    color: "#007AFF",
  },
});
