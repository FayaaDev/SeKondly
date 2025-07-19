import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/queryClient";
import ProfilePicture from "../components/ProfilePicture";
import CaseCard from "../components/CaseCard";
import { handleAuthError } from "../lib/authUtils";
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/navigation';
import type { CaseWithAuthor, User, UserWithFollowStats } from "../types/schema";
import CaseDetailModal from "../components/CaseDetailModal";
import ImageViewerModal from "../components/ImageViewerModal";

type PublicProfileScreenRouteProp = RouteProp<HomeStackParamList, 'PublicProfile'>;
type PublicProfileScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'PublicProfile'>;

interface PublicProfileScreenProps {
  route: PublicProfileScreenRouteProp;
  navigation: PublicProfileScreenNavigationProp;
}

/**
 * PublicProfileScreen - View another user's profile
 * 
 * Features:
 * - View user profile information
 * - View user's published cases
 * - Follow/unfollow functionality
 * - View followers/following statistics
 * 
 * @example
 * ```tsx
 * <PublicProfileScreen route={route} navigation={navigation} />
 * ```
 */
export default function PublicProfileScreen({ route, navigation }: PublicProfileScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithAuthor | null>(null);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerUser, setImageViewerUser] = useState<{ imageUrl?: string | null; userName: string } | null>(null);
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Query for user profile
  const { data: profileUser, isLoading: profileLoading, error: profileError } = useQuery<UserWithFollowStats>({
    queryKey: [`/api/users/${userId}`],
    queryFn: () => apiRequest("GET", `/api/users/${userId}`),
    enabled: !!userId,
  });

  // Query for user's published cases
  const { data: userCases = [], isLoading: casesLoading } = useQuery<CaseWithAuthor[]>({
    queryKey: [`/api/users/${userId}/cases`],
    queryFn: () => apiRequest("GET", `/api/users/${userId}/cases`),
    enabled: !!userId,
  });

  // Fetch followers/following
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: [`/api/users/${userId}/followers`],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/followers`),
    enabled: showFollowModal && followModalType === 'followers',
  });
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: [`/api/users/${userId}/following`],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/following`),
    enabled: showFollowModal && followModalType === 'following',
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: (data) => {
      // Invalidate target user's data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] });
      
      // Invalidate current user's following data
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/following`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/follow-status`] });
      }
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to follow user");
      }
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/users/${userId}/follow`);
    },
    onSuccess: (data) => {
      // Invalidate target user's data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] });
      
      // Invalidate current user's following data
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/following`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/follow-status`] });
      }
    },
    onError: (error) => {
      if (!handleAuthError(error)) {
        Alert.alert("Error", error.message || "Failed to unfollow user");
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/cases`] });
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFollowPress = () => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to follow users");
      return;
    }
    
    if (profileUser?.isFollowedByUser) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError || !profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Don't show follow button for current user's own profile
  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {profileUser.firstName} {profileUser.lastName}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <ProfilePicture
            imageUrl={profileUser.profileImageUrl}
            userName={`${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim()}
            size="large"
            onPress={() => {
              setImageViewerUser({
                imageUrl: profileUser.profileImageUrl,
                userName: `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim()
              });
              setShowImageViewer(true);
            }}
          />
          
          <Text style={styles.userName}>
            {profileUser.firstName} {profileUser.lastName}
          </Text>
          
          <Text style={styles.userSpecialty}>
            {profileUser.specialty}
          </Text>
          
          <Text style={styles.userExperienceInstitution}>
            {profileUser.experience && (
              <>
                {profileUser.experience.toString().includes('experience') 
                  ? profileUser.experience 
                  : profileUser.experience.toString().includes('years')
                    ? `${profileUser.experience} experience`
                    : `${profileUser.experience} years experience`}
                {profileUser.institution && '\n'}
              </>
            )}
            {profileUser.institution}
          </Text>

          {/* Follow Button */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,
                profileUser.isFollowedByUser && styles.followingButton
              ]}
              onPress={handleFollowPress}
              disabled={followMutation.isPending || unfollowMutation.isPending}
            >
              <Text style={[
                styles.followButtonText,
                profileUser.isFollowedByUser && styles.followingButtonText
              ]}>
                {(followMutation.isPending || unfollowMutation.isPending)
                  ? "Loading..." 
                  : profileUser.isFollowedByUser 
                    ? "Following" 
                    : "Follow"
                }
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userCases.length}</Text>
            <Text style={styles.statLabel}>Cases</Text>
          </View>
          <TouchableOpacity style={styles.statItem} onPress={() => { setFollowModalType('followers'); setShowFollowModal(true); }}>
            <Text style={styles.statNumber}>{profileUser.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => { setFollowModalType('following'); setShowFollowModal(true); }}>
            <Text style={styles.statNumber}>{profileUser.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Cases Section */}
        <View style={styles.casesSection}>
          <Text style={styles.sectionTitle}>Published Cases</Text>
          
          {casesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading cases...</Text>
            </View>
          ) : userCases.length === 0 ? (
            <View style={styles.emptyCases}>
              <Ionicons name="document-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyCasesText}>No published cases yet</Text>
            </View>
          ) : (
            <View style={styles.casesList}>
              {userCases.map((caseData) => {
                // Add detailed logging to debug the data structure
                console.log("=== CASE DEBUG INFO ===");
                console.log("Case ID:", caseData.id);
                console.log("Case Title:", caseData.title);
                console.log("Case Author Object:", JSON.stringify(caseData.author, null, 2));
                console.log("Author ID:", caseData.author?.id);
                console.log("Author Name:", caseData.author?.firstName, caseData.author?.lastName);
                console.log("======================");
                
                // Skip cases without author data
                if (!caseData.author) {
                  console.warn("Case missing author data:", caseData.id);
                  return null;
                }
                
                return (
                  <CaseCard
                    key={caseData.id}
                    case={caseData}
                    onPress={() => {
                      setSelectedCase(caseData);
                      setShowCaseDetail(true);
                    }}
                    onProfilePress={(userId) => {
                      // Navigate to another profile
                      navigation.push('PublicProfile', { userId });
                    }}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Case Detail Modal */}
      <CaseDetailModal
        visible={showCaseDetail}
        onClose={() => {
          setShowCaseDetail(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
        onProfilePress={(userId) => {
          navigation.push('PublicProfile', { userId });
        }}
      />

      <Modal visible={showFollowModal} animationType="slide" onRequestClose={() => setShowFollowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <TouchableOpacity onPress={() => setShowFollowModal(false)}><Ionicons name="chevron-back" size={28} color="#007AFF" /></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 16 }}>{followModalType === 'followers' ? 'Followers' : 'Following'}</Text>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {(followModalType === 'followers' ? followersLoading : followingLoading) ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : (followModalType === 'followers' ? followers : following).length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No users found.</Text>
            ) : (
              (followModalType === 'followers' ? followers : following).map((u: User, index: number) => (
                <TouchableOpacity key={`${followModalType}-${u.id}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => { setShowFollowModal(false); navigation.push('PublicProfile', { userId: u.id }); }}>
                  <ProfilePicture 
                    imageUrl={u.profileImageUrl} 
                    userName={`${u.firstName || ''} ${u.lastName || ''}`.trim()} 
                    size="small" 
                    onPress={() => {
                      setImageViewerUser({
                        imageUrl: u.profileImageUrl,
                        userName: `${u.firstName || ''} ${u.lastName || ''}`.trim()
                      });
                      setShowImageViewer(true);
                    }}
                  />
                  <View style={{ marginLeft: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '500' }}>{u.firstName} {u.lastName}</Text>
                    {u.specialty && <Text style={{ color: '#888', fontSize: 14 }}>{u.specialty}</Text>}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageViewer}
        onClose={() => {
          setShowImageViewer(false);
          setImageViewerUser(null);
        }}
        imageUrl={imageViewerUser?.imageUrl}
        userName={imageViewerUser?.userName || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  profilePicture: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userSpecialty: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  userInfo: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  userExperience: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userExperienceInstitution: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  institution: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  followingButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#C6C6C8',
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  casesSection: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  casesList: {
    gap: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCases: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCasesText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
});
