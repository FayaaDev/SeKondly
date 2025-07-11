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
import { useCustomAlert } from "./CustomAlert";
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
  const { showAlert, AlertComponent } = useCustomAlert();
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
      // Comment posted successfully - no popup needed
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to add comment",
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle',
          '#FF3B30'
        );
      }
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      console.log('Attempting to like comment with ID:', commentId);
      return await apiRequest("POST", `/api/comments/${commentId}/like`);
    },
    onSuccess: (data) => {
      console.log('Like comment success:', data);
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData?.id, "comments"] 
      });
    },
    onError: (error) => {
      console.error('Like comment error:', error);
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to agree with comment",
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle',
          '#FF3B30'
        );
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
      showAlert(
        "Success", 
        "Case deleted successfully",
        [{ text: 'OK', onPress: () => {} }],
        'trash',
        '#4ECDC4'
      );
      onClose();
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to delete case",
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle',
          '#FF3B30'
        );
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
      showAlert(
        "Success", 
        "Image removed successfully",
        [{ text: 'OK', onPress: () => {} }],
        'checkmark-circle',
        '#4ECDC4'
      );
      // Reset current image index if needed
      if (caseData?.imageUrls && currentImageIndex >= caseData.imageUrls.length - 1) {
        setCurrentImageIndex(Math.max(0, caseData.imageUrls.length - 2));
      }
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        showAlert(
          "Error", 
          error.message || "Failed to remove image",
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
    showAlert(
      "Delete Case",
      "Are you sure you want to delete this case? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        { 
          text: "Delete", 
          onPress: () => deleteCaseMutation.mutate(),
          style: "destructive"
        }
      ],
      'trash',
      '#FF3B30'
    );
  };

  const confirmImageRemoval = (imageUrl: string) => {
    showAlert(
      "Remove Image",
      "Are you sure you want to remove this image? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        { 
          text: "Remove", 
          onPress: () => removeImageMutation.mutate(imageUrl),
          style: "destructive"
        }
      ],
      'image',
      '#FF3B30'
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

  // Render comment item - Medical-focused design
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
          <View style={styles.commentAuthorInfo}>
            <View style={styles.commentNameRow}>
              <Text style={styles.commentAuthorName}>
                Dr. {item.author.firstName} {item.author.lastName}
              </Text>
              <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt!)}</Text>
            </View>
            <View style={styles.commentCredentialsBadges}>
              <View style={styles.commentSpecialtyBadge}>
                <Ionicons name="medical" size={10} color="#4ECDC4" />
                <Text style={styles.commentSpecialtyText}>{item.author.specialty}</Text>
              </View>
              {(item.author as any)?.level && (
                <View style={styles.commentLevelBadge}>
                  <Ionicons name="ribbon" size={10} color="#059669" />
                  <Text style={styles.commentLevelText}>{(item.author as any)?.level}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.commentContentContainer}>
            <Text style={styles.commentContent}>{item.content}</Text>
          </View>
          
          {/* Medical-focused Comment Actions */}
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => handleReply(`${item.author.firstName || ''}${item.author.lastName || ''}`)}
            >
              <View style={styles.medicalActionIcon}>
                <Ionicons name="chatbubble-outline" size={16} color="#4ECDC4" />
              </View>
              <Text style={styles.commentActionLabel}>Reply</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.commentActionButton}
              onPress={() => {
                console.log('Agree button pressed for comment:', item.id);
                likeCommentMutation.mutate(item.id.toString());
              }}
            >
              <View style={[
                styles.medicalActionIcon,
                (item as any).isLikedByUser && styles.medicalActionIconActive
              ]}>
                <Ionicons 
                  name={(item as any).isLikedByUser ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={16} 
                  color={(item as any).isLikedByUser ? "#22C55E" : "#4ECDC4"} 
                />
              </View>
              <Text style={[
                styles.commentActionLabel,
                (item as any).isLikedByUser && styles.commentActionLabelActive
              ]}>
                {((item as any).likesCount || 0) > 0 ? (item as any).likesCount : 'Agree'}
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

            {/* Comments Section - Medical-focused */}
            <View style={styles.commentsSection}>
              <View style={styles.discussionHeader}>
                <View style={styles.discussionTitleRow}>
                  <View style={styles.discussionIconContainer}>
                    <Ionicons name="medical" size={20} color="#4ECDC4" />
                  </View>
                  <Text style={styles.commentsTitle}>Medical Discussion</Text>
                  <View style={styles.participantsCounter}>
                    <Ionicons name="people-outline" size={16} color="#536471" />
                    <Text style={styles.participantsText}>
                      {comments.length > 0 ? `${new Set(comments.map((c: CommentWithAuthor) => c.authorId)).size} participants` : '0 participants'}
                    </Text>
                  </View>
                </View>
                
                {comments.length > 0 && (
                  <View style={styles.discussionStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubbles-outline" size={14} color="#059669" />
                      <Text style={styles.statText}>{comments.length} insights</Text>
                    </View>
                  </View>
                )}
              </View>
              
              {commentsLoading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingSpinner}>
                    <ActivityIndicator size="small" color="#4ECDC4" />
                  </View>
                  <Text style={styles.loadingText}>Loading medical insights...</Text>
                </View>
              ) : comments.length > 0 ? (
                <View style={styles.commentsContainer}>
                  <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.commentSeparator} />}
                  />
                </View>
              ) : (
                <View style={styles.emptyCommentsContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="medical-outline" size={48} color="#E1E8ED" />
                  </View>
                  <Text style={styles.emptyCommentsTitle}>Start the Medical Discussion</Text>
                  <Text style={styles.emptyCommentsText}>
                    Share your clinical insights, differential diagnosis, or treatment recommendations
                  </Text>
                  <View style={styles.emptyPrompts}>
                    <Text style={styles.promptText}>💡 Consider discussing:</Text>
                    <Text style={styles.promptItem}>• Differential diagnosis</Text>
                    <Text style={styles.promptItem}>• Treatment approach</Text>
                    <Text style={styles.promptItem}>• Similar cases you've encountered</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Medical-focused Add Comment */}
          <View style={styles.addCommentContainer}>
            {replyingTo && (
              <View style={styles.replyIndicator}>
                <View style={styles.replyIconContainer}>
                  <Ionicons name="return-down-forward" size={14} color="#4ECDC4" />
                </View>
                <Text style={styles.replyText}>Replying to Dr. {replyingTo}</Text>
                <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
                  <Ionicons name="close" size={16} color="#536471" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.commentInputRow}>
              <View style={styles.currentUserAvatar}>
                {currentUser?.profileImageUrl ? (
                  <ExpoImage
                    source={{ uri: getFullImageUrl(currentUser.profileImageUrl) }}
                    style={styles.currentUserAvatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.currentUserAvatarText}>
                    {getInitials(currentUser?.firstName, currentUser?.lastName)}
                  </Text>
                )}
              </View>
              
              <View style={styles.addCommentInputContainer}>
                {/* Helper tags positioned above the input */}
                <View style={styles.commentHelperTags}>
                  <TouchableOpacity 
                    style={styles.helperTag}
                    onPress={() => setNewComment(prev => prev + "#diagnosis ")}
                  >
                    <Text style={styles.helperTagText}>#diagnosis</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.helperTag}
                    onPress={() => setNewComment(prev => prev + "#treatment ")}
                  >
                    <Text style={styles.helperTagText}>#treatment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.helperTag}
                    onPress={() => setNewComment(prev => prev + "#experience ")}
                  >
                    <Text style={styles.helperTagText}>#experience</Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder={replyingTo ? "Share your medical insights in response..." : ""}
                  placeholderTextColor="#94A3B8"
                  value={newComment}
                  onChangeText={setNewComment}
                  onFocus={handleCommentInputFocus}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
                <View style={styles.commentInputFooter}>
                  <Text style={[
                    styles.characterCount,
                    newComment.length > 450 && styles.characterCountWarning,
                    newComment.length > 500 && styles.characterCountError
                  ]}>
                    {newComment.length}/500
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newComment.trim() || addCommentMutation.isPending || newComment.length > 500) && styles.sendButtonDisabled
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending || newComment.length > 500}
              >
                {addCommentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={[
                      styles.sendButtonText,
                      (!newComment.trim() || addCommentMutation.isPending || newComment.length > 500) && styles.sendButtonTextDisabled
                    ]}>
                      Post
                    </Text>
                  </>
                )}
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
      
      {/* Custom Alert Component */}
      <AlertComponent />
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
    backgroundColor: "#fff",
    minHeight: 200,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#FAFBFC",
    margin: 16,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyCommentsContainer: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    minHeight: 200,
    backgroundColor: "#FAFBFC",
    margin: 16,
    borderRadius: 16,
  },
  emptyCommentsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyCommentsText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  commentCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  commentAuthorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  commentTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "400",
  },
  commentSpecialtyBadge: {
    backgroundColor: "#E6F7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentSpecialtyText: {
    fontSize: 11,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  commentLevelBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentLevelText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  commentContent: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 22,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
    marginTop: 8,
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
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
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    maxHeight: Platform.OS === "ios" ? 200 : 180,
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  replyText: {
    fontSize: 13,
    color: "#4ECDC4",
    fontWeight: "500",
    flex: 1,
  },
  cancelReplyButton: {
    padding: 4,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  currentUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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
    fontSize: 16,
    color: "#1E293B",
    lineHeight: 22,
    minHeight: 44,
    maxHeight: 88,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  commentInputFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 80,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButtonTextDisabled: {
    color: "#fff",
    opacity: 0.8,
  },
  
  // New medical discussion styles
  discussionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FAFBFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  discussionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  discussionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E6F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  participantsCounter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  participantsText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginLeft: 4,
  },
  discussionStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  loadingSpinner: {
    marginRight: 8,
  },
  commentsContainer: {
    backgroundColor: "#fff",
  },
  commentSeparator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
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
  emptyPrompts: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    alignSelf: "stretch",
  },
  promptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  promptItem: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
    paddingLeft: 8,
  },
  
  // Updated comment styles for medical theme
  commentAuthorInfo: {
    marginBottom: 8,
  },
  commentNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  commentNameAndCredentials: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  commentCredentialsBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  commentContentContainer: {
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  medicalActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  medicalActionIconActive: {
    backgroundColor: "#F0FDF4",
  },
  commentActionLabel: {
    fontSize: 13,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  commentActionLabelActive: {
    color: "#22C55E",
  },
  
  // Updated input styles for medical theme
  replyIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  currentUserAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentHelperTags: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  helperTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E6F7FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#B8E6FF",
  },
  helperTagText: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  characterCountWarning: {
    color: "#F59E0B",
  },
  characterCountError: {
    color: "#EF4444",
  },
});
