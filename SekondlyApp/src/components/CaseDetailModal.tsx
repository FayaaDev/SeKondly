import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { apiRequest } from "../lib/queryClient";
import { handleAuthError } from "../lib/authUtils";
import { API_BASE_URL } from "../config/api";
import ImageGalleryModal from "./ImageGalleryModal";
import { useAuth } from "../hooks/useAuth";
import type { CaseWithAuthor, CommentWithAuthor, CaseFormat } from "../types/schema";
import LongCaseDetailModal from "./LongCaseDetailModal";

interface CaseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  caseData: CaseWithAuthor | null;
  onProfilePress?: (userId: string) => void;
}

const { width: screenWidth } = Dimensions.get("window");

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl; // Already a full URL
  }
  return `${API_BASE_URL}${imageUrl}`; // Convert relative URL to full URL
};

export default function CaseDetailModal({ 
  visible, 
  onClose, 
  caseData,
  onProfilePress 
}: CaseDetailModalProps): React.ReactElement | null {
  // Determine case format with fallback - if format is undefined/null, default to 'short'
  const caseFormat = caseData?.format || 'short';
  
  // Early return for long cases
  if (caseFormat === 'long') {
    return (
      <LongCaseDetailModal
        visible={visible}
        onClose={onClose}
        caseData={caseData}
        onProfilePress={onProfilePress}
      />
    );
  }

  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showImageManagement, setShowImageManagement] = useState(false);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (replyingTo) {
      commentInputRef.current?.focus();
    }
  }, [replyingTo]);

  // Fetch case comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["/api/cases", caseData?.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/cases/${caseData?.id}/comments`),
    enabled: !!caseData?.id && visible,
    retry: false,
  });

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/cases/${caseData?.id}/favorite`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/cases/${caseData?.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData?.id, "comments"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setNewComment("");
      setReplyingTo(null);
      Keyboard.dismiss();
      Alert.alert("Success", "Your comment has been posted successfully.");
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to add comment");
      }
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest("POST", `/api/comments/${commentId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData?.id, "comments"] 
      });
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to like comment");
      }
    },
  });

  // Delete case mutation
  const deleteCaseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/cases/${caseData?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      Alert.alert("Success", "Case deleted successfully");
      onClose();
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to delete case");
      }
    },
  });

  // Remove image mutation
  const removeImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      return await apiRequest("DELETE", `/api/cases/${caseData?.id}/images`, { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      Alert.alert("Success", "Image removed successfully");
      // Reset current image index if needed
      if (caseData?.imageUrls && currentImageIndex >= caseData.imageUrls.length - 1) {
        setCurrentImageIndex(Math.max(0, caseData.imageUrls.length - 2));
      }
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to remove image");
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

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const finalComment = replyingTo 
      ? `@${replyingTo} ${newComment}` 
      : newComment;
    addCommentMutation.mutate(finalComment);
  };

  const handleReply = (authorName: string) => {
    setReplyingTo(authorName);
    setNewComment("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this medical case: ${caseData?.title}`,
        title: caseData?.title,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleCommentInputFocus = () => {
    // Add a longer delay to ensure keyboard is fully open
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 500);
  };

  const handleProfilePress = () => {
    if (caseData?.author.id) {
      onProfilePress?.(caseData.author.id);
      onClose();
    }
  };

  // Check if current user is the author
  const isAuthor = currentUser?.id === caseData?.authorId;

  const confirmDelete = () => {
    Alert.alert(
      "Delete Case",
      "Are you sure you want to delete this case? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteCaseMutation.mutate()
        }
      ]
    );
  };

  const confirmImageRemoval = (imageUrl: string) => {
    Alert.alert(
      "Remove Image",
      "Are you sure you want to remove this image? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => removeImageMutation.mutate(imageUrl)
        }
      ]
    );
  };

  const nextImage = () => {
    if (caseData?.imageUrls && currentImageIndex < caseData.imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Render image gallery
  const renderImageGallery = () => {
    if (!caseData?.imageUrls || caseData.imageUrls.length === 0) return null;

    return (
      <View style={styles.imageGalleryContainer}>
        <View style={styles.imageSectionHeader}>
          <Text style={styles.sectionTitle}>Medical Images</Text>
          {isAuthor && (
            <TouchableOpacity 
              style={styles.manageImagesButton}
              onPress={() => setShowImageManagement(!showImageManagement)}
            >
              <Ionicons 
                name={showImageManagement ? "close" : "create-outline"} 
                size={20} 
                color="#4ECDC4" 
              />
              <Text style={styles.manageImagesText}>
                {showImageManagement ? "Done" : "Manage"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => {
            if (!showImageManagement) {
              setShowImageGallery(true);
            }
          }}
          disabled={showImageManagement}
        >
          <ExpoImage
            source={{ uri: getFullImageUrl(caseData.imageUrls[currentImageIndex]) }}
            style={styles.caseImage}
            contentFit="contain"
          />
          
          {/* Image management overlay for authors */}
          {isAuthor && showImageManagement && (
            <View style={styles.imageManagementOverlay}>
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => confirmImageRemoval(caseData.imageUrls![currentImageIndex])}
                disabled={removeImageMutation.isPending}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                <Text style={styles.removeImageText}>Remove Image</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {caseData.imageUrls.length > 1 && !showImageManagement && (
            <>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.prevButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                disabled={currentImageIndex === 0}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={24} 
                  color={currentImageIndex === 0 ? "#ccc" : "#333"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.imageNavButton, styles.nextButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                disabled={currentImageIndex === caseData.imageUrls.length - 1}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={currentImageIndex === caseData.imageUrls.length - 1 ? "#ccc" : "#333"} 
                />
              </TouchableOpacity>
              
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {caseData.imageUrls.length}
                </Text>
              </View>
            </>
          )}
          
          {/* Tap to expand hint - only show when not in management mode */}
          {!showImageManagement && (
            <View style={styles.expandHint}>
              <Ionicons name="expand-outline" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render comment item - Twitter-inspired
  const renderComment = ({ item }: { item: CommentWithAuthor }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <TouchableOpacity style={styles.commentAvatar}>
          {item.author.profileImageUrl ? (
            <ExpoImage
              source={{ uri: getFullImageUrl(item.author.profileImageUrl) }}
              style={styles.commentAvatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.commentAvatarText}>
              {getInitials(item.author.firstName, item.author.lastName)}
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.commentMainContent}>
          <View style={styles.commentNameRow}>
            <Text style={styles.commentAuthorName}>
              Dr. {item.author.firstName} {item.author.lastName}
            </Text>
            <Text style={styles.commentHandle}>
              @{((item.author.firstName || '') + (item.author.lastName || '')).toLowerCase()}
            </Text>
            <Text style={styles.commentDot}>·</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt!)}</Text>
          </View>
          
          <View style={styles.commentBadgesContainer}>
            {(item.author as any)?.level && (
              <View style={styles.commentLevelBadge}>
                <Text style={styles.commentLevelText}>{(item.author as any)?.level}</Text>
              </View>
            )}
            <View style={styles.commentSpecialtyBadge}>
              <Text style={styles.commentSpecialtyText}>{item.author.specialty}</Text>
            </View>
          </View>
          
          <Text style={styles.commentContent}>{item.content}</Text>
          
          {/* Twitter-style Comment Actions */}
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => handleReply(`${item.author.firstName || ''}${item.author.lastName || ''}`)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="chatbubble-outline" size={16} color="#536471" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => likeCommentMutation.mutate(item.id.toString())}
            >
              <View style={[
                styles.actionIconContainer,
                (item as any).isLikedByUser && styles.actionIconContainerLiked
              ]}>
                <Ionicons 
                  name={(item as any).isLikedByUser ? "heart" : "heart-outline"} 
                  size={16} 
                  color={(item as any).isLikedByUser ? "#F91880" : "#536471"} 
                />
              </View>
              {((item as any).likesCount || 0) > 0 && (
                <Text style={[
                  styles.commentActionCount,
                  (item as any).isLikedByUser && styles.commentActionCountLiked
                ]}>
                  {(item as any).likesCount}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (!caseData) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 20}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.authorSection} onPress={handleProfilePress}>
              <View style={styles.avatar}>
                {caseData.author.profileImageUrl ? (
                  <ExpoImage
                    source={{ uri: getFullImageUrl(caseData.author.profileImageUrl) }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials(caseData.author.firstName, caseData.author.lastName)}
                  </Text>
                )}
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>
                  Dr. {caseData.author.firstName} {caseData.author.lastName}
                </Text>
                <Text style={styles.authorSpecialty}>{caseData.author.specialty}</Text>
                {(caseData.author as any)?.level && (
                  <Text style={styles.authorLevel}>{(caseData.author as any)?.level}</Text>
                )}
              </View>
            </TouchableOpacity>
            
            
            {isAuthor && (
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={confirmDelete}
                disabled={deleteCaseMutation.isPending}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* Case Details */}
            <View style={styles.caseDetails}>
              <View style={styles.caseMetaRow}>
                <View style={styles.metaBadges}>
                  <View style={[
                    styles.formatBadge,
                    styles.shortFormatBadge
                  ]}>
                    <Text style={[
                      styles.formatBadgeText,
                      styles.shortFormatText
                    ]}>
                      Short Case
                    </Text>
                  </View>
                  <View style={styles.specialtyBadge}>
                    <Text style={styles.specialtyBadgeText}>{caseData.specialty}</Text>
                  </View>
                </View>
                <View style={styles.metaInfo}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{formatTimeAgo(caseData.createdAt!)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="eye-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{caseData.viewsCount || 0}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.caseTitle}>{caseData.title}</Text>
              
              <View style={styles.historyCard}>
                <Text style={styles.historyTitle}>Case History</Text>
                <Text style={styles.historyContent}>{caseData.history}</Text>
              </View>

              {/* Image Gallery */}
              {renderImageGallery()}

              {/* Interaction Buttons */}
              <View style={styles.interactions}>
                <TouchableOpacity
                  style={styles.interactionButton}
                  onPress={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                >
                  <Ionicons
                    name={caseData.isFavoritedByUser ? "heart" : "heart-outline"}
                    size={20}
                    color={caseData.isFavoritedByUser ? "#FF3B30" : "#666"}
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.interactionButton}
                  onPress={() => {
                    // Scroll to comments section
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#666" />
                  <Text style={styles.interactionText}>
                    {caseData.commentsCount || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.interactionButton} 
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={20} color="#666" />
                  <Text style={styles.interactionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments Section - Twitter-inspired */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Medical Discussion</Text>
              
              {commentsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1D9BF0" />
                  <Text style={styles.loadingText}>Loading comments...</Text>
                </View>
              ) : comments.length > 0 ? (
                <FlatList
                  data={comments}
                  renderItem={renderComment}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color="#E1E8ED" />
                  <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
                  <Text style={styles.emptyCommentsText}>
                    Be the first to share your medical insights!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Twitter-inspired Add Comment */}
          <View style={styles.addCommentContainer}>
            {replyingTo && (
              <View style={styles.replyIndicator}>
                <Text style={styles.replyText}>Replying to @{replyingTo}</Text>
                <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
                  <Ionicons name="close" size={16} color="#536471" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.commentInputRow}>
              <View style={styles.currentUserAvatar}>
                <Text style={styles.currentUserAvatarText}>
                  {getInitials(currentUser?.firstName, currentUser?.lastName)}
                </Text>
              </View>
              
              <View style={styles.addCommentInputContainer}>
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder={replyingTo ? "Post your reply" : "Post your medical insights..."}
                  placeholderTextColor="#536471"
                  value={newComment}
                  onChangeText={setNewComment}
                  onFocus={handleCommentInputFocus}
                  multiline
                  textAlignVertical="top"
                  maxLength={280}
                />
                <View style={styles.commentInputFooter}>
                  <Text style={styles.characterCount}>
                    {newComment.length}/280
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newComment.trim() || addCommentMutation.isPending || newComment.length > 280) && styles.sendButtonDisabled
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending || newComment.length > 280}
              >
                <Text style={[
                  styles.sendButtonText,
                  (!newComment.trim() || addCommentMutation.isPending || newComment.length > 280) && styles.sendButtonTextDisabled
                ]}>
                  {addCommentMutation.isPending ? "Posting..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
      
      {/* Image Gallery Modal */}
      <ImageGalleryModal
        visible={showImageGallery}
        images={caseData?.imageUrls?.map(url => getFullImageUrl(url)) || []}
        initialIndex={currentImageIndex}
        onClose={() => setShowImageGallery(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  formatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shortFormatBadge: {
    backgroundColor: "#718096",
  },
  formatBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  shortFormatText: {
    color: "#FFFFFF",
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
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1D9BF0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1419",
  },
  authorSpecialty: {
    fontSize: 13,
    color: "#536471",
    marginTop: 1,
  },
  authorLevel: {
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
    fontWeight: "500",
  },
  closeButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20, // Add bottom padding to ensure comments are reachable
  },
  caseDetails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  caseMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  metaBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  specialtyBadge: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyBadgeText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  caseTitle: {
    fontSize: 23,
    fontWeight: "400",
    color: "#0F1419",
    marginBottom: 12,
    lineHeight: 28,
  },
  historyCard: {
    backgroundColor: "#F7F9FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFF3F4",
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1419",
    marginBottom: 8,
  },
  historyContent: {
    fontSize: 15,
    color: "#0F1419",
    lineHeight: 20,
  },
  imageGalleryContainer: {
    marginBottom: 20,
  },
  imageSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  manageImagesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#EBF4FF",
  },
  manageImagesText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
    marginLeft: 4,
  },
  imageManagementOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  removeImageText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  imageContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  caseImage: {
    width: screenWidth - 32,
    height: 250,
  },
  imageNavButton: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: {
    left: 8,
  },
  nextButton: {
    right: 8,
  },
  imageCounter: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expandHint: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  interactions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 16,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  interactionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  commentsSection: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20, // Add bottom padding
    minHeight: 200, // Ensure minimum height for visibility
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F1419",
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#536471",
    marginLeft: 8,
  },
  emptyCommentsContainer: {
    paddingVertical: 40,
    alignItems: "center",
    minHeight: 120, // Ensure minimum height
  },
  emptyCommentsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1419",
    marginTop: 16,
    marginBottom: 4,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: "#536471",
    textAlign: "center",
  },
  commentCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EFF3F4",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1D9BF0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  commentAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentAvatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  commentMainContent: {
    flex: 1,
  },
  commentNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  commentAuthorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1419",
    marginRight: 4,
  },
  commentHandle: {
    fontSize: 15,
    color: "#536471",
    marginRight: 4,
  },
  commentDot: {
    fontSize: 15,
    color: "#536471",
    marginHorizontal: 2,
  },
  commentTime: {
    fontSize: 15,
    color: "#536471",
  },
  commentSpecialtyBadge: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  commentSpecialtyText: {
    fontSize: 11,
    color: "#1D9BF0",
    fontWeight: "500",
  },
  commentBadgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  commentLevelBadge: {
    backgroundColor: "#E8FDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  commentLevelText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "500",
  },
  commentContent: {
    fontSize: 15,
    color: "#0F1419",
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    maxWidth: 425,
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 60,
  },
  actionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  actionIconContainerLiked: {
    backgroundColor: "#FDF2F8",
  },
  commentActionCount: {
    fontSize: 13,
    color: "#536471",
    marginLeft: 4,
    fontWeight: "400",
  },
  commentActionCountLiked: {
    color: "#F91880",
  },
  addCommentContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EFF3F4",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
    maxHeight: Platform.OS === "ios" ? 180 : 160, // Constrain container height
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F9FA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  replyText: {
    fontSize: 14,
    color: "#536471",
  },
  cancelReplyButton: {
    padding: 4,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 12,
    maxHeight: 140, // Prevent the entire row from growing too much
  },
  currentUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1D9BF0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  currentUserAvatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  addCommentInputContainer: {
    flex: 1,
    maxHeight: 120, // Constrain the container height
    marginRight: 12, // Add space between input and button
  },
  commentInput: {
    fontSize: 18,
    color: "#0F1419",
    lineHeight: 22,
    minHeight: 40,
    maxHeight: 80, // Reduce max height to prevent screen takeover
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  commentInputFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  characterCount: {
    fontSize: 13,
    color: "#536471",
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    height: 40, // Match avatar height
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: "#A8E6E0",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  sendButtonTextDisabled: {
    color: "#fff",
    opacity: 0.7,
  },
});
