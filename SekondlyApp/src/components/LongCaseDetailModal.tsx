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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { handleAuthError } from '../lib/authUtils';
import { useAuth } from '../hooks/useAuth';
import ImageGalleryModal from './ImageGalleryModal';
import CommentAgreersModal from './CommentAgreersModal';
import { useCustomAlert } from './CustomAlert';
import type { CaseWithAuthor, CommentWithAuthor } from '../types/schema';
import { API_BASE_URL } from '../config/api';

const { width: screenWidth } = Dimensions.get('window');

// Enhanced comment interface for hierarchical structure
interface HierarchicalComment extends CommentWithAuthor {
  replies?: HierarchicalComment[];
  parentId?: string | null;
  replyToUsername?: string;
}

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

// Helper function to parse reply information from comment content
const parseCommentForReply = (content: string): { replyToUsername?: string; cleanContent: string } => {
  const replyMatch = content.match(/^@([^\s]+)\s+(.*)$/);
  if (replyMatch) {
    return {
      replyToUsername: replyMatch[1],
      cleanContent: replyMatch[2]
    };
  }
  return { cleanContent: content };
};

// Helper function to organize comments into hierarchical structure
const organizeCommentsHierarchically = (comments: CommentWithAuthor[]): HierarchicalComment[] => {
  const commentMap = new Map<string, HierarchicalComment>();
  const rootComments: HierarchicalComment[] = [];
  const replyQueue: HierarchicalComment[] = [];
  
  // First pass: create all comments with parsed reply info
  comments.forEach(comment => {
    const { replyToUsername, cleanContent } = parseCommentForReply(comment.content);
    const hierarchicalComment: HierarchicalComment = {
      ...comment,
      content: cleanContent,
      replyToUsername,
      replies: []
    };
    commentMap.set(comment.id.toString(), hierarchicalComment);
    
    if (replyToUsername) {
      replyQueue.push(hierarchicalComment);
    } else {
      rootComments.push(hierarchicalComment);
    }
  });
  
  // Second pass: organize replies into hierarchy
  // Sort comments by creation date to maintain chronological order
  const sortedComments = Array.from(commentMap.values()).sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );
  
  replyQueue.forEach(replyComment => {
    if (replyComment.replyToUsername) {
      // Find the most recent parent comment by author name (in case of multiple comments from same author)
      let parentComment: HierarchicalComment | undefined;
      
      // Search through all comments (including replies) to find the parent
      const findParentInComments = (commentsToSearch: HierarchicalComment[]): HierarchicalComment | undefined => {
        for (const comment of commentsToSearch) {
          const commentAuthorName = `${comment.author.firstName || ''}${comment.author.lastName || ''}`;
          if (commentAuthorName === replyComment.replyToUsername && 
              comment.id !== replyComment.id &&
              new Date(comment.createdAt!).getTime() < new Date(replyComment.createdAt!).getTime()) {
            if (!parentComment || new Date(comment.createdAt!).getTime() > new Date(parentComment.createdAt!).getTime()) {
              parentComment = comment;
            }
          }
          
          // Also search in replies recursively
          if (comment.replies && comment.replies.length > 0) {
            const foundInReplies = findParentInComments(comment.replies);
            if (foundInReplies) {
              const foundAuthorName = `${foundInReplies.author.firstName || ''}${foundInReplies.author.lastName || ''}`;
              if (foundAuthorName === replyComment.replyToUsername &&
                  new Date(foundInReplies.createdAt!).getTime() < new Date(replyComment.createdAt!).getTime()) {
                if (!parentComment || new Date(foundInReplies.createdAt!).getTime() > new Date(parentComment.createdAt!).getTime()) {
                  parentComment = foundInReplies;
                }
              }
            }
          }
        }
        return parentComment;
      };
      
      parentComment = findParentInComments(rootComments);
      
      if (parentComment) {
        replyComment.parentId = parentComment.id.toString();
        parentComment.replies!.push(replyComment);
        // Sort replies by creation time
        parentComment.replies!.sort((a, b) => 
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
        );
      } else {
        // If parent not found, treat as root comment
        rootComments.push(replyComment);
      }
    }
  });
  
  // Sort root comments by creation time
  rootComments.sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );
  
  return rootComments;
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
  const [replyingTo, setReplyingTo] = useState<{
    username: string;
    commentId: string;
    authorName: string;
  } | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showCommentAgreers, setShowCommentAgreers] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const { user: currentUser } = useAuth();
  const { showAlert, AlertComponent } = useCustomAlert();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  // Effect to handle comment input focus
  useEffect(() => {
    if (replyingTo) {
      commentInputRef.current?.focus();
    }
  }, [replyingTo]);

  // Add keyboard event listeners for better handling
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Scroll to bottom when keyboard shows with proper delay
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 200);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Optional: Handle keyboard hide if needed
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Fetch case comments
  const { data: comments = [] } = useQuery({
    queryKey: ["/api/cases", caseData.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/cases/${caseData.id}/comments`),
    enabled: !!caseData.id && visible,
    retry: false,
  });

  // Organize comments hierarchically
  const hierarchicalComments = organizeCommentsHierarchically(comments || []);

  // Render hierarchical comment function
  const renderHierarchicalComment = (comment: HierarchicalComment, depth: number = 0): React.ReactElement => {
    const maxDepth = 3; // Limit nesting depth
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id.toString());
    
    return (
      <View key={comment.id} style={[
        styles.commentCard,
        depth > 0 && styles.replyComment
        // Removed marginLeft - using repliesContainer padding instead
      ]}>
        {/* Reply indicator for nested comments */}
        {depth > 0 && (
          <View style={styles.replyIndicatorLine} />
        )}
        
        <View style={styles.commentHeader}>
          <TouchableOpacity style={styles.commentAvatar}>
            {comment.author.profileImageUrl ? (
              <ExpoImage
                source={{ uri: getFullImageUrl(comment.author.profileImageUrl) }}
                style={styles.commentAvatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.commentAvatarText}>
                {getInitials(comment.author.firstName, comment.author.lastName)}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.commentMainContent}>
            <View style={styles.commentAuthorInfo}>
              <View style={styles.commentNameRow}>
                <Text style={styles.commentAuthorName}>
                  Dr. {comment.author.firstName} {comment.author.lastName}
                </Text>
                <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt!)}</Text>
              </View>
              <View style={styles.commentCredentialsBadges}>
                <View style={styles.commentSpecialtyBadge}>
                  <Ionicons name="medical" size={10} color="#4ECDC4" />
                  <Text style={styles.commentSpecialtyText}>{comment.author.specialty}</Text>
                </View>
                {(comment.author as any)?.level && (
                  <View style={styles.commentLevelBadge}>
                    <Ionicons name="ribbon" size={10} color="#059669" />
                    <Text style={styles.commentLevelText}>{(comment.author as any)?.level}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.commentContentContainer}>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
            
            {/* Medical-focused Comment Actions */}
            <View style={styles.commentActions}>
              <TouchableOpacity 
                style={styles.commentActionButton}
                onPress={() => handleReply(
                  comment.id.toString(),
                  comment.author.firstName || '',
                  comment.author.lastName || ''
                )}
              >
                <View style={styles.medicalActionIcon}>
                  <Ionicons name="chatbubble-outline" size={16} color="#4ECDC4" />
                </View>
                <Text style={styles.commentActionLabel}>Reply</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.commentActionButton}
                onPress={() => {
                  console.log('=== LONG CASE AGREE BUTTON PRESSED ===');
                  console.log('LONG CASE: Agree button pressed for comment:', comment.id);
                  console.log('LONG CASE: Current isAgreedByUser state:', (comment as any).isAgreedByUser);
                  console.log('LONG CASE: Current agreesCount:', (comment as any).agreesCount);
                  console.log('LONG CASE: agreeCommentMutation.isPending:', agreeCommentMutation.isPending);
                  
                  if (agreeCommentMutation.isPending) {
                    console.log('LONG CASE: Button disabled due to pending mutation, ignoring press');
                    return;
                  }
                  
                  agreeCommentMutation.mutate(comment.id.toString());
                }}
                disabled={agreeCommentMutation.isPending}
              >
                <View style={[
                  styles.medicalActionIcon,
                  (comment as any).isAgreedByUser && styles.medicalActionIconActive
                ]}>
                  <Ionicons 
                    name={(comment as any).isAgreedByUser ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={16} 
                    color={(comment as any).isAgreedByUser ? "#22C55E" : "#4ECDC4"} 
                  />
                </View>
                <Text style={[
                  styles.commentActionLabel,
                  (comment as any).isAgreedByUser && styles.commentActionLabelActive
                ]}>
                  {(() => {
                    const count = (comment as any).agreesCount || 0;
                    if (count > 0) {
                      return `Agree (${count})`;
                    }
                    return 'Agree';
                  })()}
                </Text>
              </TouchableOpacity>

              {/* Delete button - only show for comment author */}
              {(currentUser?.id === comment.authorId || currentUser?.id === comment.author?.id) && (
                <TouchableOpacity 
                  style={styles.commentActionButton}
                  onPress={() => confirmDeleteComment(comment.id.toString())}
                  disabled={deleteCommentMutation.isPending}
                >
                  <View style={styles.medicalActionIcon}>
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  </View>
                  <Text style={[styles.commentActionLabel, styles.commentDeleteLabel]}>Delete</Text>
                </TouchableOpacity>
              )}
              
              {/* Show/Hide Replies Button */}
              {hasReplies && (
                <TouchableOpacity 
                  style={styles.commentActionButton}
                  onPress={() => toggleReplies(comment.id.toString())}
                >
                  <View style={styles.medicalActionIcon}>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#4ECDC4" 
                    />
                  </View>
                  <Text style={styles.commentActionLabel}>
                    {isExpanded ? 'Hide' : 'Show'} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Show Agreed List Button - positioned below action buttons */}
            {(comment as any).agreesCount > 0 && (
              <TouchableOpacity 
                style={styles.showAgreersButton}
                onPress={() => handleShowCommentAgreers(comment.id.toString())}
              >
                <Ionicons name="people-outline" size={12} color="#4ECDC4" />
                <Text style={styles.showAgreersText}>See who agreed with this</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Render replies */}
        {hasReplies && isExpanded && depth < maxDepth && (
          <View style={styles.repliesContainer}>
            {comment.replies!.map(reply => renderHierarchicalComment(reply, depth + 1))}
          </View>
        )}
        
        {/* Show message if max depth reached */}
        {hasReplies && isExpanded && depth >= maxDepth && (
          <View style={styles.maxDepthContainer}>
            <Text style={styles.maxDepthText}>
              View more replies by tapping the original comment
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Comments mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/cases/${caseData.id}/comments`, { content });
    },
    onSuccess: () => {
      // Invalidate and refetch the comments for this case
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
      
      // Invalidate and refetch the main cases feed
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.refetchQueries({ queryKey: ["/api/cases"] });
      
      // Invalidate and refetch my cases
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      queryClient.refetchQueries({ queryKey: ["/api/my-cases"] });
      
      setNewComment("");
      setReplyingTo(null);
      Keyboard.dismiss();
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", "Failed to add comment");
      }
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      console.log('LongCaseDetailModal - Attempting to delete comment with ID:', commentId);
      try {
        const response = await apiRequest("DELETE", `/api/comments/${commentId}`);
        console.log('LongCaseDetailModal - Delete comment response:', response);
        return response;
      } catch (error) {
        console.error('LongCaseDetailModal - Delete comment error details:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch the comments for this case
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
      
      // Invalidate and refetch the main cases feed
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.refetchQueries({ queryKey: ["/api/cases"] });
      
      // Invalidate and refetch my cases
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      queryClient.refetchQueries({ queryKey: ["/api/my-cases"] });
    },
    onError: (error) => {
      console.error('LongCaseDetailModal - Delete comment mutation error:', error);
      if (!handleAuthError(error)) {
        Alert.alert("Error", `Failed to delete comment: ${error.message || 'Unknown error'}`);
      }
    },
  });

  // Agree with comment mutation
  const agreeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      console.log('Attempting to agree with comment ID:', commentId);
      const result = await apiRequest("POST", `/api/comments/${commentId}/agree`);
      // Include the comment ID in the result for onSuccess callback
      return { ...result, commentId };
    },
    onSuccess: (data) => {
      console.log('Agree comment success:', data);
      // Refetch to get the latest data from server
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/cases", caseData.id, "comments"] 
      });
      
      // Invalidate and refetch the main cases feed
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.refetchQueries({ queryKey: ["/api/cases"] });
      
      // Invalidate and refetch my cases
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      queryClient.refetchQueries({ queryKey: ["/api/my-cases"] });
      
      // Also invalidate the agreers list for this comment
      queryClient.invalidateQueries({ 
        queryKey: ["/api/comments", data.commentId, "agrees"] 
      });
      // Invalidate all comment agrees queries to be safe
      queryClient.invalidateQueries({ 
        queryKey: ["/api/comments"], 
        predicate: (query) => query.queryKey[2] === "agrees"
      });
    },
    onError: (error) => {
      console.error('Agree comment error:', error);
      if (!handleAuthError(error)) {
        Alert.alert("Error", "Failed to agree with comment");
      }
    },
  });

  // Handlers
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const finalComment = replyingTo 
      ? `@${replyingTo.username} ${newComment}` 
      : newComment;
    addCommentMutation.mutate(finalComment);
  };

  const handleReply = (commentId: string, authorFirstName: string, authorLastName: string) => {
    const username = `${authorFirstName || ''}${authorLastName || ''}`;
    const authorName = `Dr. ${authorFirstName} ${authorLastName}`;
    setReplyingTo({ username, commentId, authorName });
    setNewComment("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
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
    // Scroll to bottom when input is focused and keyboard shows
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === 'ios' ? 200 : 400);
  };

  const handleShowCommentAgreers = (commentId: string) => {
    console.log('LongCaseDetailModal - handleShowCommentAgreers called with commentId:', commentId);
    setSelectedCommentId(commentId);
    setShowCommentAgreers(true);
    console.log('LongCaseDetailModal - showCommentAgreers set to true');
  };

  const handleCloseCommentAgreers = () => {
    setShowCommentAgreers(false);
    setSelectedCommentId(null);
  };

  const handleProfilePressFromAgreers = (userId: string) => {
    // Close the agreers modal first
    handleCloseCommentAgreers();
    // Close the main case modal
    onClose();
    // Navigate to profile
    onProfilePress?.(userId);
  };

  const confirmDeleteComment = (commentId: string) => {
    showAlert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        { 
          text: "Delete", 
          onPress: () => deleteCommentMutation.mutate(commentId),
          style: "destructive"
        }
      ],
      'trash',
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 40}
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
                  {(caseData.author as any)?.level && (
                    <Text style={styles.authorLevel}>{(caseData.author as any)?.level}</Text>
                  )}
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
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
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

              {/* Medical-focused Comments Section */}
              {comments.length > 0 && (
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

                  {hierarchicalComments.map(comment => renderHierarchicalComment(comment, 0))}
                </View>
              )}
            </ScrollView>

            {/* Medical-focused Add Comment */}
            <View style={styles.addCommentContainer}>
              {replyingTo && (
                <View style={styles.replyIndicator}>
                  <View style={styles.replyIconContainer}>
                    <Ionicons name="return-down-forward" size={14} color="#4ECDC4" />
                  </View>
                  <Text style={styles.replyText}>Replying to {replyingTo.authorName}</Text>
                  <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
                    <Ionicons name="close" size={16} color="#536471" />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.commentInputRow}>
                <View style={styles.currentUserAvatar}>
                  {currentUser?.profileImageUrl ? (
                    <ExpoImage
                      source={{ uri: `${API_BASE_URL}${currentUser.profileImageUrl}` }}
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
          
          {/* Comment Agreers Modal */}
          <CommentAgreersModal
            visible={showCommentAgreers}
            commentId={selectedCommentId}
            onClose={handleCloseCommentAgreers}
            onProfilePress={handleProfilePressFromAgreers}
            useOverlay={true}
          />
          
          {/* Custom Alert Component */}
          <AlertComponent />
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
    paddingBottom: 150,
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
  authorLevel: {
    fontSize: 13,
    color: "#059669",
    marginTop: 2,
    fontWeight: "500",
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
    backgroundColor: "#fff",
  },
  
  // Medical discussion styles
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
  commentsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
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
  
  // Updated comment card styles
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
  commentAuthorInfo: {
    marginBottom: 8,
  },
  commentNameRow: {
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
  commentContentContainer: {
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  
  // Medical action icons
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
  commentDeleteLabel: {
    color: "#FF3B30",
  },
  
  agreeCountButton: {
    // Make the count clickable without affecting the icon
  },
  
  agreeCountButtonClickable: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  
  commentActionLabelClickable: {
    color: "#1E40AF",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  
  clickableIndicator: {
    opacity: 0.7,
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
    gap: 16,
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
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    minHeight: Platform.OS === "ios" ? 80 : 70,
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
    paddingBottom: 4,
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
  
  // Medical input styles from CaseDetailModal
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
  characterCountWarning: {
    color: "#F59E0B",
  },
  characterCountError: {
    color: "#EF4444",
  },
  showAgreersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginLeft: 52, // Align with comment content (avatar width + margin)
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  showAgreersText: {
    fontSize: 12,
    color: '#4ECDC4',
    marginLeft: 4,
    fontWeight: '600',
  },

  // Hierarchical Reply Styles
  replyComment: {
    borderLeftWidth: 2,
    borderLeftColor: '#E2E8F0',
    backgroundColor: '#FAFBFC',
    borderRadius: 8,
    marginTop: 8,
  },
  replyIndicatorLine: {
    position: 'absolute',
    left: -2,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#4ECDC4',
  },
  replyingToText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 8, // Reduced from 16 to 8 for more conservative indentation
  },
  maxDepthContainer: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginLeft: 8, // Reduced from 16 to 8 to match repliesContainer
  },
  maxDepthText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LongCaseDetailModal;
