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
  ActivityIndicator,
  Modal,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/queryClient";
import ProfilePicture from "../components/ProfilePicture";
import ProfilePictureModal from "../components/ProfilePictureModal";
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { User } from '../types/schema';

/**
 * ProfileScreen - User profile and settings
 * 
 * Features:
 * - View user profile information
 * - Edit profile picture and details
 * - View followers/following statistics
 * - Access settings and admin panel
 * - Sign out functionality
 * 
 * @example
 * ```tsx
 * <ProfileScreen />
 * ```
 */
export default function ProfileScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showPictureModal, setShowPictureModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  // Query for user's cases count
  const { data: myCases = [] } = useQuery({
    queryKey: ["/api/my-cases"],
    queryFn: () => apiRequest("GET", "/api/my-cases"),
    enabled: !!user?.isApproved,
    retry: false,
  });

  // Query for follow status
  const { data: myFollowStatus } = useQuery({
    queryKey: [`/api/users/${user?.id}/follow-status`],
    queryFn: () => apiRequest("GET", `/api/users/${user?.id}/follow-status`),
    enabled: !!user?.id,
    retry: false,
  });

  // Query for followers
  const { data: myFollowers } = useQuery({
    queryKey: [`/api/users/${user?.id}/followers`],
    queryFn: () => apiRequest("GET", `/api/users/${user?.id}/followers`),
    enabled: !!user?.id,
    retry: false,
  });

  // Query for following
  const { data: myFollowing } = useQuery({
    queryKey: [`/api/users/${user?.id}/following`],
    queryFn: () => apiRequest("GET", `/api/users/${user?.id}/following`),
    enabled: !!user?.id,
    retry: false,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Refetch all profile-related data
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/follow-status`] });
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/followers`] });
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/following`] });
        await queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      }
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, queryClient]);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: () => signOut()
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const handleFollowersPress = () => {
    setFollowModalType('followers');
    setShowFollowModal(true);
  };

  const handleFollowingPress = () => {
    setFollowModalType('following');
    setShowFollowModal(true);
  };

  if (!user?.isApproved) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <View style={styles.pendingContainer}>
          <View style={styles.pendingIcon}>
            <Ionicons name="document-text-outline" size={48} color="#F59E0B" />
          </View>
          <Text style={styles.pendingTitle}>Account Under Review</Text>
          <Text style={styles.pendingSubtitle}>
            Your account is being reviewed. You'll be notified once approved.
          </Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
      </View>

      {/* Profile Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={() => setShowPictureModal(true)}
          >
            <ProfilePicture
              imageUrl={user?.profileImageUrl}
              userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
              size="large"
            />
          </TouchableOpacity>
          
          <Text style={styles.userName}>
            Dr. {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userSpecialty}>
            {user?.specialty}
          </Text>
          {user?.level && (
            <Text style={styles.userLevel}>
              {user?.level}
            </Text>
          )}
          {user?.fellowship && (
            <Text style={styles.userFellowship}>
              {user?.fellowship}
            </Text>
          )}
          <Text style={styles.userExperienceInstitution}>
            {user?.experience && (
              <>
                {user?.experience.toString().includes('experience') 
                  ? user?.experience 
                  : user?.experience.toString().includes('years')
                    ? `${user?.experience} experience`
                    : `${user?.experience} years experience`}
                {user?.institution && '\n'}
              </>
            )}
            {user?.institution}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{myCases?.length || 0}</Text>
            <Text style={styles.statLabel}>Cases</Text>
          </View>
          
          <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
            <Text style={styles.statNumber}>{myFollowStatus?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statItem} onPress={handleFollowingPress}>
            <Text style={styles.statNumber}>{myFollowStatus?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Menu */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.settingContent}>
              <Ionicons name="person-outline" size={20} color="#8E8E93" />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('NotificationSettings')}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={20} color="#8E8E93" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
          
          {user?.isAdmin && (
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('AdminPanel')}
            >
              <View style={styles.settingContent}>
                <Ionicons name="shield-outline" size={20} color="#8E8E93" />
                <Text style={styles.settingText}>Admin Panel</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingContent}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, styles.deleteAccountItem]} onPress={handleDeleteAccount}>
            <View style={styles.settingContent}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.settingText, styles.deleteAccountText]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Picture Modal for editing */}
      <ProfilePictureModal
        visible={showPictureModal}
        onClose={() => setShowPictureModal(false)}
        currentImageUrl={user?.profileImageUrl || undefined}
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
        onUploadComplete={(imageUrl) => {
          // Handle profile picture update
          console.log('Profile picture updated:', imageUrl);
          setShowPictureModal(false);
        }}
      />

      <Modal visible={showFollowModal} animationType="slide" onRequestClose={() => setShowFollowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <TouchableOpacity onPress={() => setShowFollowModal(false)}><Ionicons name="chevron-back" size={28} color="#007AFF" /></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 16 }}>{followModalType === 'followers' ? 'Followers' : 'Following'}</Text>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {(followModalType === 'followers' ? myFollowers : myFollowing) === undefined ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : (followModalType === 'followers' ? myFollowers : myFollowing).length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No users found.</Text>
            ) : (
              (followModalType === 'followers' ? myFollowers : myFollowing).map((u: User) => (
                <TouchableOpacity key={u.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => { 
                  setShowFollowModal(false); 
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: 'Home',
                      params: {
                        screen: 'PublicProfile',
                        params: { userId: u.id }
                      }
                    })
                  );
                }}>
                  <ProfilePicture imageUrl={u.profileImageUrl} userName={`${u.firstName || ''} ${u.lastName || ''}`.trim()} size="small" />
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

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View style={styles.deleteAccountOverlay}>
          <View style={styles.deleteAccountContainer}>
            <View style={styles.deleteAccountHeader}>
              <Ionicons name="trash-outline" size={32} color="#FF3B30" />
              <Text style={styles.deleteAccountTitle}>Delete Account</Text>
            </View>
            
            <Text style={styles.deleteAccountModalText}>
              To delete your account, please send an email to{' '}
              <Text style={styles.deleteAccountEmail}>admin@sekondly.app</Text>
              {' '}
            </Text>
            
            <Text style={styles.deleteAccountSubText}>
              Our admin team will process your request and confirm the deletion.
            </Text>
            
            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={() => setShowDeleteAccountModal(false)}
            >
              <Text style={styles.deleteAccountButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  userSpecialty: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  userLevel: {
    fontSize: 13,
    color: "#4ECDC4",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  userExperience: {
    fontSize: 13,
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  userExperienceInstitution: {
    fontSize: 13,
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
  },
  userFellowship: {
    fontSize: 13,
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  userDetails: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
    textAlign: "center",
  },
  userInstitution: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  settingsContainer: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: "#000000",
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: "#FF3B30",
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
  },
  deleteAccountText: {
    color: "#FF3B30",
  },
  pendingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  pendingIcon: {
    width: 96,
    height: 96,
    backgroundColor: "#FEF3C7",
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  pendingSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  signOutButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  // Delete Account Modal Styles
  deleteAccountOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteAccountContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteAccountHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteAccountTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    textAlign: 'center',
  },
  deleteAccountModalText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteAccountEmail: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  deleteAccountSubText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
  },
  deleteAccountButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
