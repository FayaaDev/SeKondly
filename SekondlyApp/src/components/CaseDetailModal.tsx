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
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
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
import type { CaseWithAuthor, CommentWithAuthor } from "../types/schema";

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
}: CaseDetailModalProps) {
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

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/cases/${caseData?.id}/like`);
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

  const handleCommentInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
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

  // Render comment item
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
          <View style={styles.commentInfo}>
            <View style={styles.commentNameRow}>
              <Text style={styles.commentAuthorName}>
                Dr. {item.author.firstName} {item.author.lastName}
              </Text>
              <Text style={styles.commentHandle}>
                @{((item.author.firstName || '') + (item.author.lastName || '')).toLowerCase()}
              </Text>
              <Text style={styles.commentTime}>·</Text>
              <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt!)}</Text>
            </View>
            <View style={styles.commentSpecialtyBadge}>
              <Text style={styles.commentSpecialtyText}>{item.author.specialty}</Text>
            </View>
          </View>
          
          <Text style={styles.commentContent}>{item.content}</Text>
          
          {/* Comment Actions */}
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => handleReply(`${item.author.firstName || ''}${item.author.lastName || ''}`)}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#536471" />
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => likeCommentMutation.mutate(item.id.toString())}
            >
              <Ionicons 
                name={(item as any).isLikedByUser ? "heart" : "heart-outline"} 
                size={16} 
                color={(item as any).isLikedByUser ? "#F91880" : "#536471"} 
              />
              <Text style={[
                styles.commentActionText,
                (item as any).isLikedByUser && styles.commentActionTextLiked
              ]}>
                {(item as any).likesCount || 0}
              </Text>
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
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
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
          >
            {/* Case Details */}
            <View style={styles.caseDetails}>
              <View style={styles.caseMetaRow}>
                <View style={styles.specialtyBadge}>
                  <Text style={styles.specialtyBadgeText}>{caseData.specialty}</Text>
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
                  onPress={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                >
                  <Ionicons
                    name={caseData.isLikedByUser ? "heart" : "heart-outline"}
                    size={20}
                    color={caseData.isLikedByUser ? "#F91880" : "#536471"}
                  />
                  <Text style={[
                    styles.interactionText,
                    caseData.isLikedByUser && styles.interactionTextActive
                  ]}>
                    {caseData.likesCount || 0}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.interactionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color="#536471" />
                  <Text style={styles.interactionText}>
                    {caseData.commentsCount || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.interactionButton}>
                  <Ionicons name="share-outline" size={20} color="#536471" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Medical Discussion</Text>
              
              {commentsLoading ? (
                <View style={styles.loadingContainer}>
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
                  <Text style={styles.emptyCommentsText}>
                    No comments yet. Be the first to share your medical insights!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Add Comment */}
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
                <Text style={styles.currentUserAvatarText}>ME</Text>
              </View>
              
              <View style={styles.addCommentInputContainer}>
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder={replyingTo ? "Tweet your reply" : "Share your medical insights..."}
                  value={newComment}
                  onChangeText={setNewComment}
                  onFocus={handleCommentInputFocus}
                  multiline
                  textAlignVertical="top"
                />
                
                <View style={styles.commentInputActions}>
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!newComment.trim() || addCommentMutation.isPending) && styles.sendButtonDisabled
                    ]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                  >
                    <Text style={[
                      styles.sendButtonText,
                      (!newComment.trim() || addCommentMutation.isPending) && styles.sendButtonTextDisabled
                    ]}>
                      {addCommentMutation.isPending ? "Posting..." : "Post"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
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
  keyboardAvoid: {
    flex: 1,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EFF3F4",
    marginTop: 16,
    maxWidth: 425,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
  },
  interactionText: {
    fontSize: 13,
    color: "#536471",
    marginLeft: 4,
    fontWeight: "400",
  },
  interactionTextActive: {
    color: "#F91880",
  },
  commentsSection: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingTop: 16,
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
  },
  loadingText: {
    fontSize: 14,
    color: "#536471",
  },
  emptyCommentsContainer: {
    paddingVertical: 20,
    alignItems: "center",
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
  commentInfo: {
    marginBottom: 4,
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
  commentSpecialtyBadge: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  commentSpecialtyText: {
    fontSize: 11,
    color: "#1D9BF0",
    fontWeight: "500",
  },
  commentTime: {
    fontSize: 15,
    color: "#536471",
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
    justifyContent: "space-between",
    maxWidth: 425,
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  commentActionText: {
    fontSize: 13,
    color: "#536471",
    marginLeft: 4,
    fontWeight: "400",
  },
  commentActionTextLiked: {
    color: "#F91880",
  },
  addCommentContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EFF3F4",
    paddingHorizontal: 16,
    paddingTop: 12,
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
  },
  commentInput: {
    fontSize: 20,
    color: "#0F1419",
    lineHeight: 24,
    minHeight: 50,
    maxHeight: 200,
    paddingVertical: 12,
  },
  commentInputActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  sendButton: {
    backgroundColor: "#1D9BF0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: "#8ECDF8",
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
