import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { apiRequest } from "../lib/queryClient";
import { handleAuthError } from "../lib/authUtils";
import { useAuth } from "../hooks/useAuth";
import type { CommentWithAuthor } from "../types/schema";

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  caseId: number;
  caseTitle: string;
}

export default function CommentModal({ 
  visible, 
  onClose, 
  caseId, 
  caseTitle 
}: CommentModalProps) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/cases", caseId, "comments"],
    queryFn: () => apiRequest("GET", `/api/cases/${caseId}/comments`),
    enabled: visible,
    retry: false,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/cases/${caseId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseId, "comments"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      setComment("");
      Alert.alert("Success", "Your comment has been posted successfully.");
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to add comment");
      }
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      console.log('CommentModal - Attempting to delete comment with ID:', commentId);
      try {
        const response = await apiRequest("DELETE", `/api/comments/${commentId}`);
        console.log('CommentModal - Delete comment response:', response);
        return response;
      } catch (error) {
        console.error('CommentModal - Delete comment error details:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cases", caseId, "comments"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      Alert.alert("Success", "Comment deleted successfully.");
    },
    onError: (error) => {
      console.error('CommentModal - Delete comment mutation error:', error);
      if (!handleAuthError(error)) {
        Alert.alert("Error", `Failed to delete comment: ${error.message || 'Unknown error'}`);
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

  const handleSubmit = () => {
    if (comment.trim()) {
      addCommentMutation.mutate(comment.trim());
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteCommentMutation.mutate(commentId)
        }
      ]
    );
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
        </View>
      ))}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubble-outline" size={32} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptySubtitle}>Be the first to share your medical insights</Text>
    </View>
  );

  // Render comment item
  const renderComment = ({ item }: { item: CommentWithAuthor }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {item.author.profileImageUrl ? (
          <ExpoImage
            source={{ uri: item.author.profileImageUrl }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarText}>
            {getInitials(item.author.firstName, item.author.lastName)}
          </Text>
        )}
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthorSection}>
            <Text style={styles.commentAuthor}>
              Dr. {item.author.firstName} {item.author.lastName}
            </Text>
            <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt!)}</Text>
          </View>
          {/* Delete button - only show for comment author */}
          {(currentUser?.id === item.authorId || currentUser?.id === item.author?.id) && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => confirmDeleteComment(item.id.toString())}
              disabled={deleteCommentMutation.isPending}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
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
            {/* Drag indicator */}
            <View style={styles.dragIndicator} />
            
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Comments</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {caseTitle}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.commentsContainer}>
            {isLoading ? (
              renderLoadingSkeleton()
            ) : comments.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                contentContainerStyle={styles.commentsList}
              />
            )}
          </View>

          {/* Comment Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Add a thoughtful comment..."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!comment.trim() || addCommentMutation.isPending) && styles.sendButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!comment.trim() || addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color="#fff" 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentsList: {
    paddingBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 16,
  },
  skeletonItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: "60%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthorSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 20 : 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#f8f9fa",
    minHeight: 90, // Increased minimum visible height
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 80,
    minHeight: 40,
    backgroundColor: "#fff",
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
});
