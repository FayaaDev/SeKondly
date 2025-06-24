import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/queryClient';
import CaseCard from './CaseCard';
import type { CaseWithAuthor, User } from '../types/schema';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: number;
}

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  institution: string;
  bio?: string;
  profilePicture?: string;
  joinedAt: string;
  verified: boolean;
  isApproved: boolean;
  casesCount: number;
  likesReceived: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfileModal({ visible, onClose, userId }: ProfileModalProps) {
  const { user: currentUser } = useAuth();
  const [selectedCase, setSelectedCase] = useState<CaseWithAuthor | null>(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [casesSectionRef, setCasesSectionRef] = useState(null);
  
  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = profileUserId === currentUser?.id;

  // Fetch user profile data
  const { data: profileUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users', profileUserId],
    queryFn: () => apiRequest('GET', `/api/users/${profileUserId}`),
    enabled: !!profileUserId && visible,
  });

  // Fetch user's cases
  const { data: userCases = [], isLoading: isLoadingCases } = useQuery({
    queryKey: ['/api/users', profileUserId, 'cases'],
    queryFn: () => apiRequest('GET', `/api/users/${profileUserId}/cases`),
    enabled: !!profileUserId && visible,
  });

  // Fetch followers/following
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}/followers`],
    queryFn: () => apiRequest('GET', `/api/users/${profileUserId}/followers`),
    enabled: showFollowModal && followModalType === 'followers',
  });
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}/following`],
    queryFn: () => apiRequest('GET', `/api/users/${profileUserId}/following`),
    enabled: showFollowModal && followModalType === 'following',
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const formatSpecialty = (specialty: string) => {
    return specialty
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!profileUserId) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <Ionicons name="person-circle-outline" size={80} color="#8E8E93" />
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#000000',
            marginTop: 16,
            marginBottom: 8,
          }}>
            User not found
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#8E8E93',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            The profile you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#007AFF',
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'ios' ? 60 : 20,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5E7',
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{
              fontSize: 17,
              color: '#007AFF',
            }}>
              Back
            </Text>
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#000000',
          }}>
            {isOwnProfile ? 'My Profile' : 'Profile'}
          </Text>
          
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          {isLoadingUser ? (
            <View style={{
              backgroundColor: '#F9F9F9',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{
                fontSize: 16,
                color: '#8E8E93',
                marginTop: 12,
              }}>
                Loading profile...
              </Text>
            </View>
          ) : profileUser ? (
            <>
              {/* Profile Header */}
              <View style={{
                backgroundColor: '#F9F9F9',
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
                marginBottom: 20,
              }}>
                {/* Profile Picture */}
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#007AFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  {profileUser.profilePicture ? (
                    <Image
                      source={{ uri: profileUser.profilePicture }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                      }}
                    />
                  ) : (
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 32,
                      fontWeight: 'bold',
                    }}>
                      {getInitials(profileUser.firstName, profileUser.lastName)}
                    </Text>
                  )}
                </View>

                {/* Name and Verification */}
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: '#000000',
                    }}>
                      {profileUser.firstName} {profileUser.lastName}
                    </Text>
                    {profileUser.verified && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color="#007AFF" 
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </View>
                </View>

                {/* Specialty and Institution */}
                <Text style={{
                  fontSize: 16,
                  color: '#8E8E93',
                  textAlign: 'center',
                  marginBottom: 4,
                }}>
                  {formatSpecialty(profileUser.specialty)}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#8E8E93',
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                  {profileUser.institution}
                </Text>

                {/* Stats */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  width: '100%',
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#E5E5E7',
                }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000000' }}>{profileUser.casesCount || 0}</Text>
                    <Text style={{ fontSize: 14, color: '#8E8E93' }}>Cases</Text>
                  </View>
                  <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => { setFollowModalType('followers'); setShowFollowModal(true); }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000000' }}>{profileUser.followersCount || 0}</Text>
                    <Text style={{ fontSize: 14, color: '#8E8E93' }}>Followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => { setFollowModalType('following'); setShowFollowModal(true); }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000000' }}>{profileUser.followingCount || 0}</Text>
                    <Text style={{ fontSize: 14, color: '#8E8E93' }}>Following</Text>
                  </TouchableOpacity>
                </View>

                {/* Bio */}
                {profileUser.bio && (
                  <View style={{
                    width: '100%',
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#E5E5E7',
                    marginTop: 16,
                  }}>
                    <Text style={{
                      fontSize: 16,
                      color: '#000000',
                      textAlign: 'center',
                      lineHeight: 22,
                    }}>
                      {profileUser.bio}
                    </Text>
                  </View>
                )}
              </View>

              {/* Cases Section */}
              <View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#000000',
                  marginBottom: 16,
                }}>
                  {isOwnProfile ? 'My Cases' : `${profileUser.firstName}'s Cases`}
                </Text>

                {isLoadingCases ? (
                  <View style={{ alignItems: 'center', padding: 40 }}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={{
                      fontSize: 16,
                      color: '#8E8E93',
                      marginTop: 12,
                    }}>
                      Loading cases...
                    </Text>
                  </View>
                ) : userCases.length > 0 ? (
                  <View style={{ gap: 16 }}>
                    {userCases.map((caseData: CaseWithAuthor) => (
                      <CaseCard
                        key={caseData.id}
                        case={caseData}
                        onPress={() => setSelectedCase(caseData)}
                        onProfilePress={() => {}}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: '#F9F9F9',
                    borderRadius: 16,
                    padding: 40,
                    alignItems: 'center',
                  }}>
                    <Ionicons name="document-outline" size={48} color="#8E8E93" />
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#000000',
                      marginTop: 16,
                      marginBottom: 8,
                    }}>
                      No cases yet
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      color: '#8E8E93',
                      textAlign: 'center',
                    }}>
                      {isOwnProfile
                        ? 'Share your first case to get started!'
                        : `${profileUser.firstName} hasn't shared any cases yet.`}
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={{
              alignItems: 'center',
              padding: 40,
            }}>
              <Ionicons name="person-circle-outline" size={80} color="#8E8E93" />
              <Text style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#000000',
                marginTop: 16,
                marginBottom: 8,
              }}>
                Profile not found
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#8E8E93',
                textAlign: 'center',
              }}>
                Unable to load profile information.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

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
              (followModalType === 'followers' ? followers : following).map((u: User) => (
                <TouchableOpacity key={u.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => { setShowFollowModal(false); /* Optionally navigate to user profile */ }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}</Text>
                  </View>
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
    </Modal>
  );
}
