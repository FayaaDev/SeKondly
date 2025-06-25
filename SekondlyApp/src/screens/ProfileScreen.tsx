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
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/queryClient";
import ProfilePicture from "../components/ProfilePicture";
import ProfilePictureModal from "../components/ProfilePictureModal";
import { useNavigation } from '@react-navigation/native';
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
  
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

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
      // Note: You might want to implement specific refetch functions here
    } finally {
      setRefreshing(false);
    }
  }, []);

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
          {user?.experience && (
            <Text style={styles.userExperience}>
              Career experience: {user?.experience} years
            </Text>
          )}
          <Text style={styles.userInstitution}>{user?.institution}</Text>
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
          
          <TouchableOpacity style={[styles.settingItem, styles.signOutItem]} onPress={handleSignOut}>
            <View style={styles.settingContent}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
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
                <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <ProfilePicture imageUrl={u.profileImageUrl} userName={`${u.firstName || ''} ${u.lastName || ''}`.trim()} size="small" />
                  <View style={{ marginLeft: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '500' }}>{u.firstName} {u.lastName}</Text>
                    {u.specialty && <Text style={{ color: '#888', fontSize: 14 }}>{u.specialty}</Text>}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
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
    color: "#8E8E93",
    marginBottom: 4,
    textAlign: "center",
  },
  userExperience: {
    fontSize: 13,
    color: "#666666",
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
    color: "#8E8E93",
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
});
