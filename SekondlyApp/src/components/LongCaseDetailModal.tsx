import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Share,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { handleAuthError } from '../lib/authUtils';
import { useAuth } from '../hooks/useAuth';
import ImageGalleryModal from './ImageGalleryModal';
import type { CaseWithAuthor, CommentWithAuthor } from '../types/schema';
import { API_BASE_URL } from '../config/api';

const { width: screenWidth } = Dimensions.get('window');

interface LongCaseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  caseData: CaseWithAuthor | null;
  onProfilePress?: (userId: string) => void;
}

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

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl; // Already a full URL
  }
  return `${API_BASE_URL}${imageUrl}`; // Convert relative URL to full URL
};

const LongCaseDetailModal = ({
  visible,
  onClose,
  caseData,
  onProfilePress,
}: LongCaseDetailModalProps): React.ReactElement | null => {
  if (!caseData || caseData.format !== 'long') return null;

  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  // Effect to handle comment input focus
  useEffect(() => {
    if (replyingTo) {
      commentInputRef.current?.focus();
    }
  }, [replyingTo]);

  // Fetch case comments
  const { data: comments = [] } = useQuery({
    queryKey: ["/api/cases", caseData.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/cases/${caseData.id}/comments`),
    enabled: !!caseData.id && visible,
    retry: false,
  });

  // Comments mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/cases/${caseData.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setNewComment("");
      setReplyingTo(null);
      Keyboard.dismiss();
      Alert.alert("Success", "Comment added successfully");
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", "Failed to add comment");
      }
    },
  });

  // Like mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest("POST", `/api/comments/${commentId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", "Failed to like comment");
      }
    },
  });

  // Handlers
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const finalComment = replyingTo 
      ? `@${replyingTo} ${newComment}` 
      : newComment;
    addCommentMutation.mutate(finalComment);
  };

  const handleReply = (username: string) => {
    setReplyingTo(username);
    setNewComment("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
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

  const handleCommentInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 500);
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

  // Gallery render functions
  const renderImageGallery = () => {
    if (!caseData?.imageUrls || caseData.imageUrls.length === 0) return null;

    return (
      <View style={styles.imageGalleryContainer}>
        <View style={styles.imageSectionHeader}>
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imageControls}>
            <TouchableOpacity 
              style={[styles.imageControlButton, { opacity: currentImageIndex === 0 ? 0.5 : 1 }]} 
              onPress={prevImage}
              disabled={currentImageIndex === 0}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.imageCounter}>
              {currentImageIndex + 1} / {caseData.imageUrls.length}
            </Text>
            <TouchableOpacity 
              style={[styles.imageControlButton, { opacity: currentImageIndex === caseData.imageUrls.length - 1 ? 0.5 : 1 }]} 
              onPress={nextImage}
              disabled={currentImageIndex === caseData.imageUrls.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowImageGallery(true)}>
          <ExpoImage
            source={{ uri: getFullImageUrl(caseData.imageUrls[currentImageIndex]) }}
            style={styles.image}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderImageGalleryModal = () => {
    if (!caseData?.imageUrls || !showImageGallery) return null;

    return (
      <ImageGalleryModal
        visible={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        images={caseData.imageUrls.map(getFullImageUrl)}
        initialIndex={currentImageIndex}
      />
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.authorSection} onPress={() => onProfilePress?.(caseData.author.id)}>
                <View style={styles.avatar}>
                  {caseData.author.profileImageUrl ? (
                    <ExpoImage
                      source={{ uri: `${API_BASE_URL}${caseData.author.profileImageUrl}` }}
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
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={styles.scrollViewContent}
            >
              <Text style={styles.caseTitle}>{caseData.title}</Text>

              <View style={styles.caseMetaRow}>
                <View style={styles.metaBadges}>
                  <View style={[styles.formatBadge, styles.longFormatBadge]}>
                    <Text style={[styles.formatBadgeText, styles.longFormatText]}>
                      Long Case
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

              <View style={styles.longCaseFields}>
                {[
                  { label: "Chief Complaint", value: caseData.chiefComplaint },
                  { label: "History of Present Illness", value: caseData.historyOfPresentIllness },
                  { label: "Past Medical History", value: caseData.pastMedicalHistory },
                  { label: "Family History", value: caseData.familyHistory },
                  { label: "Drug History", value: caseData.drugHistory },
                  { label: "Systemic Review", value: caseData.systemicReview },
                  { label: "Physical Examination", value: caseData.examination },
                  { label: "Management", value: caseData.management },
                  { label: "General History", value: caseData.history },
                ].map((field, index) => field.value && (
                  <View
                    key={field.label}
                    style={[
                      styles.longCaseField,
                      index === 0 && styles.firstLongCaseField
                    ]}
                  >
                    <Text style={styles.longCaseFieldTitle}>{field.label}</Text>
                    <Text style={styles.longCaseFieldContent}>{field.value}</Text>
                  </View>
                ))}
              </View>

              {/* Image Gallery */}
              {renderImageGallery()}

              {/* Comments Section */}
              {comments.length > 0 && (
                <View style={styles.commentsSection}>
                  {comments.map((comment: CommentWithAuthor) => (
                    <View key={comment.id} style={styles.commentContainer}>
                      <TouchableOpacity 
                        style={styles.authorSection}
                        onPress={() => onProfilePress?.(comment.author.id)}
                      >
                        <View style={styles.commentAvatarContainer}>
                          {comment.author.profileImageUrl ? (
                            <ExpoImage
                              source={{ uri: `${API_BASE_URL}${comment.author.profileImageUrl}` }}
                              style={styles.commentAvatarImage}
                              contentFit="cover"
                            />
                          ) : (
                            <Text style={styles.commentAvatarText}>
                              {getInitials(comment.author.firstName, comment.author.lastName)}
                            </Text>
                          )}
                        </View>
                        <View style={styles.commentMainContent}>
                          <View style={styles.commentNameRow}>
                            <Text style={styles.commentAuthorName}>
                              {comment.author.firstName} {comment.author.lastName}
                            </Text>
                            <Text style={styles.commentHandle}>@{comment.author.username}</Text>
                            <Text style={styles.commentDot}>·</Text>
                            <Text style={styles.commentTime}>
                              {formatTimeAgo(comment.createdAt!)}
                            </Text>
                          </View>
                          <Text style={styles.commentContent}>{comment.content}</Text>
                          <View style={styles.commentActions}>
                            <TouchableOpacity 
                              style={styles.commentActionButton}
                              onPress={() => handleReply(comment.author.username!)}
                            >
                              <View style={styles.actionIconContainer}>
                                <Ionicons name="chatbubble-outline" size={20} color="#536471" />
                              </View>
                              <Text style={styles.commentActionCount}>Reply</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.commentActionButton}
                              onPress={() => likeCommentMutation.mutate(comment.id.toString())}
                            >
                              <View 
                                style={[
                                  styles.actionIconContainer,
                                  comment.liked && styles.actionIconContainerLiked
                                ]}
                              >
                                <Ionicons 
                                  name={comment.liked ? "heart" : "heart-outline"}
                                  size={20}
                                  color={comment.liked ? "#F91880" : "#536471"}
                                />
                              </View>
                              {comment.likesCount! > 0 && (
                                <Text 
                                  style={[
                                    styles.commentActionCount,
                                    comment.liked && styles.commentActionCountLiked
                                  ]}
                                >
                                  {comment.likesCount}
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Add Comment Section */}
            <View style={styles.addCommentContainer}>
              {replyingTo && (
                <View style={styles.replyIndicator}>
                  <Text style={styles.replyText}>
                    Replying to @{replyingTo}
                  </Text>
                  <TouchableOpacity 
                    style={styles.cancelReplyButton}
                    onPress={cancelReply}
                  >
                    <Ionicons name="close" size={20} color="#536471" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.commentInputRow}>
                <View style={styles.currentUserAvatar}>
                  {currentUser?.profileImageUrl ? (
                    <ExpoImage
                      source={{ uri: `${API_BASE_URL}${currentUser.profileImageUrl}` }}
                      style={styles.commentAvatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.currentUserAvatarText}>
                      {getInitials(currentUser?.firstName, currentUser?.lastName)}
                    </Text>
                  )}
                </View>
                <View style={styles.addCommentInputContainer}>
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    placeholder="Add your comment..."
                    multiline
                    value={newComment}
                    onChangeText={setNewComment}
                    onFocus={handleCommentInputFocus}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !newComment.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Text 
                    style={[
                      styles.sendButtonText,
                      !newComment.trim() && styles.sendButtonTextDisabled
                    ]}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
      {renderImageGalleryModal()}
    </>
  );
};

const styles = StyleSheet.create({
  // Main Container Styles
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120,
  },

  // Author Section Styles
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1D9BF0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1419",
  },
  authorSpecialty: {
    fontSize: 14,
    color: "#536471",
  },

  // Case Meta Styles
  caseMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  metaBadges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
    marginRight: 12,
  },
  formatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  longFormatBadge: {
    backgroundColor: "#E8F5FD",
  },
  formatBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  longFormatText: {
    color: "#1D9BF0",
  },
  specialtyBadge: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  specialtyBadgeText: {
    fontSize: 13,
    color: "#1D9BF0",
    fontWeight: "600",
  },
  metaInfo: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: "#536471",
    marginLeft: 4,
  },

  // Image Gallery Styles
  imageGalleryContainer: {
    marginBottom: 16,
    backgroundColor: "#F7F9FA",
  },
  imageSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  imageControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  image: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: "#E1E8ED",
  },
  imageCounter: {
    fontSize: 14,
    color: "#536471",
    marginHorizontal: 8,
  },

  // Long Case Field Styles
  caseTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F1419",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  longCaseFields: {
    padding: 16,
  },
  longCaseField: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EFF3F4",
  },
  firstLongCaseField: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  longCaseFieldTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1419",
    marginBottom: 8,
  },
  longCaseFieldContent: {
    fontSize: 15,
    lineHeight: 20,
    color: "#0F1419",
  },

  // Comment Section Styles
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EFF3F4",
  },
  commentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF3F4",
  },
  commentAvatarContainer: {
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

  // Section Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1419",
    marginBottom: 8,
  },

  // Add Comment Section Styles
  addCommentContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EFF3F4",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
    minHeight: 80, // Ensure minimum visible height
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
    maxHeight: 120,
    marginRight: 12,
  },
  commentInput: {
    fontSize: 16,
    color: "#0F1419",
    lineHeight: 22,
    minHeight: 44,
    maxHeight: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 22,
    backgroundColor: "#F7F9FA",
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    height: 40,
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

export default LongCaseDetailModal;
