import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, StyleSheet, Modal, Linking, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/queryClient';
import { API_BASE_URL } from '../config/api';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
  institution?: string;
}

interface Document {
  id: number;
  fileName: string;
  userId: string;
  createdAt?: string;
  fileUrl?: string;
  fileType?: string;
  isApproved?: boolean;
}

interface CaseForReview {
  id: number;
  title: string;
  history: string;
  specialty: string;
  format: 'short' | 'long';
  createdAt: string;
  isHot: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
  };
  imageUrls?: string[];
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
}

type AdminTab = 'users' | 'documents' | 'cases';

export default function AdminPanelScreen() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseForReview | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showCaseDetailModal, setShowCaseDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [userToReject, setUserToReject] = useState<User | null>(null);
  
  // Case rejection modal state
  const [showCaseRejectModal, setShowCaseRejectModal] = useState(false);
  const [caseRejectionReason, setCaseRejectionReason] = useState('');
  const [caseToReject, setCaseToReject] = useState<CaseForReview | null>(null);
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  // Queries
  const { data: pendingUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/pending-users'],
    queryFn: () => apiRequest('GET', '/api/admin/pending-users'),
    enabled: !!user?.isAdmin,
    retry: false,
  });

  const { data: pendingDocuments = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/admin/pending-documents'],
    queryFn: () => apiRequest('GET', '/api/admin/pending-documents'),
    enabled: !!user?.isAdmin && currentTab === 'documents',
    retry: false,
  });

  const { data: pendingCases = [], isLoading: casesLoading } = useQuery<CaseForReview[]>({
    queryKey: ['/api/admin/pending-cases'],
    queryFn: () => apiRequest('GET', '/api/admin/pending-cases'),
    enabled: !!user?.isAdmin && currentTab === 'cases',
    retry: false,
  });

  // Query for user documents when modal is opened
  const { data: userDocuments = [], isLoading: userDocumentsLoading } = useQuery<Document[]>({
    queryKey: [`/api/admin/user-documents/${selectedUser?.id || ''}`],
    queryFn: () => apiRequest('GET', `/api/admin/user-documents/${selectedUser?.id || ''}`),
    enabled: !!selectedUser?.id && showDocumentsModal,
    retry: false,
  });

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/admin/approve-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-users'] });
      Alert.alert('✅ Success', 'The user has been approved successfully.');
    },
    onError: (error: any) => {
      Alert.alert('❌ Error', error.message || 'Failed to approve user');
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await apiRequest('DELETE', `/api/admin/reject-user/${userId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-users'] });
      Alert.alert('🗑️ User Rejected', 'The user has been rejected and notified via email.');
      setShowRejectModal(false);
      setRejectionReason('');
      setUserToReject(null);
    },
    onError: (error: any) => {
      Alert.alert('❌ Error', error.message || 'Failed to reject user');
    },
  });

  const approveDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest('POST', `/api/admin/approve-document/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-documents'] });
      Alert.alert('✅ Success', 'The document has been approved successfully.');
    },
    onError: (error: any) => {
      Alert.alert('❌ Error', error.message || 'Failed to approve document');
    },
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      await apiRequest('POST', `/api/admin/reject-document/${documentId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-documents'] });
      Alert.alert('🗑️ Document Rejected', 'The document has been rejected.');
    },
    onError: (error: any) => {
      Alert.alert('❌ Error', error.message || 'Failed to reject document');
    },
  });

  const approveCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      await apiRequest('POST', `/api/admin/approve-case/${caseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-cases'] });
      Alert.alert('✅ Success', 'The case has been approved successfully.');
    },
    onError: (error: any) => {
      Alert.alert('❌ Error', error.message || 'Failed to approve case');
    },
  });

  const rejectCaseMutation = useMutation({
    mutationFn: async ({ caseId, reason }: { caseId: number; reason: string }) => {
      await apiRequest('DELETE', `/api/admin/reject-case/${caseId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-cases'] });
      Alert.alert('🗑️ Case Rejected', 'The case has been rejected and the author notified via email.');
      setShowCaseRejectModal(false);
      setCaseRejectionReason('');
      setCaseToReject(null);
    },
    onError: (error: any) => {
      Alert.alert('❌ Error', error.message || 'Failed to reject case');
    },
  });

  const toggleHotCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      await apiRequest('POST', `/api/cases/${caseId}/hot`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      Alert.alert('🔥 Hot Status Updated', 'The case hot status has been updated.');
    },
    onError: (error: any) => {
      Alert.alert('❌ Error', error.message || 'Failed to toggle hot status');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <View style={styles.unauthorizedContainer}>
          <Ionicons name="lock-closed" size={64} color="#8E8E93" />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedSubtitle}>You don't have admin privileges</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#4ECDC4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setCurrentTab('users')}
          style={[styles.tab, currentTab === 'users' && styles.activeTab]}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={currentTab === 'users' ? '#4ECDC4' : '#8E8E93'} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, currentTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setCurrentTab('documents')}
          style={[styles.tab, currentTab === 'documents' && styles.activeTab]}
        >
          <Ionicons 
            name="document-text" 
            size={20} 
            color={currentTab === 'documents' ? '#4ECDC4' : '#8E8E93'} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, currentTab === 'documents' && styles.activeTabText]}>
            Documents
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setCurrentTab('cases')}
          style={[styles.tab, currentTab === 'cases' && styles.activeTab]}
        >
          <Ionicons 
            name="medical" 
            size={20} 
            color={currentTab === 'cases' ? '#4ECDC4' : '#8E8E93'} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, currentTab === 'cases' && styles.activeTabText]}>
            Cases
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {currentTab === 'users' && (
          <View>
            <Text style={styles.sectionTitle}>Pending User Approvals</Text>
            
            {usersLoading ? (
              <View style={styles.loadingSection}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonHeader}>
                      <View style={styles.skeletonAvatar} />
                      <View style={styles.skeletonInfo}>
                        <View style={styles.skeletonLine} />
                        <View style={[styles.skeletonLine, styles.skeletonLineSmall]} />
                      </View>
                    </View>
                    <View style={styles.skeletonButtons}>
                      <View style={styles.skeletonButton} />
                      <View style={styles.skeletonButton} />
                    </View>
                  </View>
                ))}
              </View>
            ) : pendingUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={64} color="#8E8E93" />
                <Text style={styles.emptyTitle}>No pending users</Text>
                <Text style={styles.emptySubtitle}>All users have been reviewed.</Text>
              </View>
            ) : (
              pendingUsers.map((user) => (
                <View key={user.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.userAvatar}>
                      <Ionicons name="person" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text style={styles.userSpecialty}>{user.specialty}</Text>
                      <Text style={styles.userDetail}>{user.email}</Text>
                      {user.institution && (
                        <Text style={styles.userDetail}>{user.institution}</Text>
                      )}
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Pending</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedUser(user);
                        setShowDocumentsModal(true);
                      }}
                      style={[styles.actionButton, styles.viewButton]}
                    >
                      <Ionicons name="eye" size={16} color="#4ECDC4" />
                      <Text style={styles.viewButtonText}>View Docs</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => approveUserMutation.mutate(user.id)}
                      style={[styles.actionButton, styles.approveButton]}
                      disabled={approveUserMutation.isPending}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        setUserToReject(user);
                        setShowRejectModal(true);
                      }}
                      style={[styles.actionButton, styles.rejectButton]}
                      disabled={rejectUserMutation.isPending}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        
        {currentTab === 'documents' && (
          <View>
            <Text style={styles.sectionTitle}>Pending Document Reviews</Text>
            
            {documentsLoading ? (
              <View style={styles.loadingSection}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonHeader}>
                      <View style={styles.skeletonDocIcon} />
                      <View style={styles.skeletonInfo}>
                        <View style={styles.skeletonLine} />
                        <View style={[styles.skeletonLine, styles.skeletonLineSmall]} />
                      </View>
                    </View>
                    <View style={styles.skeletonButtons}>
                      <View style={styles.skeletonButton} />
                      <View style={styles.skeletonButton} />
                    </View>
                  </View>
                ))}
              </View>
            ) : pendingDocuments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text" size={64} color="#8E8E93" />
                <Text style={styles.emptyTitle}>No pending documents</Text>
                <Text style={styles.emptySubtitle}>All documents have been reviewed.</Text>
              </View>
            ) : (
              pendingDocuments.map((document) => (
                <View key={document.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.docIcon}>
                      <Ionicons name="document-text" size={24} color="#4ECDC4" />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{document.fileName}</Text>
                      <Text style={styles.docDetail}>Uploaded by {document.userId}</Text>
                      <Text style={styles.docDetail}>
                        {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : ''}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Review</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => approveDocumentMutation.mutate(document.id)}
                      style={[styles.actionButton, styles.approveButton]}
                      disabled={approveDocumentMutation.isPending}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => rejectDocumentMutation.mutate({ 
                        documentId: document.id, 
                        reason: 'Document does not meet requirements' 
                      })}
                      style={[styles.actionButton, styles.rejectButton]}
                      disabled={rejectDocumentMutation.isPending}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    
                    {document.fileUrl && (
                      <TouchableOpacity
                        onPress={() => {
                          if (document.fileUrl) {
                            const fullUrl = `${API_BASE_URL}${document.fileUrl}`;
                            Linking.openURL(fullUrl).catch(err => Alert.alert('Error', 'Could not open document.'));
                          }
                        }}
                        style={[styles.actionButton, styles.viewButton]}
                      >
                        <Ionicons name="eye" size={16} color="#4ECDC4" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {currentTab === 'cases' && (
          <View>
            <Text style={styles.sectionTitle}>Pending Case Approvals</Text>
            
            {casesLoading ? (
              <View style={styles.loadingSection}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonHeader}>
                      <View style={styles.skeletonAvatar} />
                      <View style={styles.skeletonInfo}>
                        <View style={styles.skeletonLine} />
                        <View style={[styles.skeletonLine, styles.skeletonLineSmall]} />
                      </View>
                    </View>
                    <View style={styles.skeletonButtons}>
                      <View style={styles.skeletonButton} />
                      <View style={styles.skeletonButton} />
                    </View>
                  </View>
                ))}
              </View>
            ) : pendingCases.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="medical" size={64} color="#8E8E93" />
                <Text style={styles.emptyTitle}>No pending cases</Text>
                <Text style={styles.emptySubtitle}>All cases have been reviewed.</Text>
              </View>
            ) : (
              pendingCases.map((caseItem) => (
                <View key={caseItem.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.caseIcon}>
                      <Ionicons name="medical" size={24} color="#FF6B35" />
                    </View>
                    <View style={styles.caseInfo}>
                      <Text style={styles.caseTitle}>{caseItem.title}</Text>
                      <Text style={styles.caseAuthor}>
                        By Dr. {caseItem.author.firstName} {caseItem.author.lastName}
                      </Text>
                      <Text style={styles.caseSpecialty}>{caseItem.specialty}</Text>
                      <Text style={styles.caseFormat}>
                        {caseItem.format === 'long' ? 'Long Case Format' : 'Short Case Format'}
                      </Text>
                      <Text style={styles.caseDate}>
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Review</Text>
                    </View>
                  </View>
                  
                  <View style={styles.casePreview}>
                    <Text style={styles.caseHistory} numberOfLines={3}>
                      {caseItem.history}
                    </Text>
                  </View>
                  
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCase(caseItem);
                        setShowCaseDetailModal(true);
                      }}
                      style={[styles.actionButton, styles.viewButton]}
                    >
                      <Ionicons name="eye" size={16} color="#4ECDC4" />
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => toggleHotCaseMutation.mutate(caseItem.id)}
                      style={[styles.actionButton, caseItem.isHot ? styles.hotButton : styles.coolButton]}
                      disabled={toggleHotCaseMutation.isPending}
                    >
                      <Ionicons 
                        name={caseItem.isHot ? "flame" : "flame-outline"} 
                        size={16} 
                        color={caseItem.isHot ? "#FFFFFF" : "#FF3B30"} 
                      />
                      <Text style={[styles.viewButtonText, caseItem.isHot && { color: "#FFFFFF" }]}>
                        {caseItem.isHot ? 'Hot' : 'Make Hot'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => approveCaseMutation.mutate(caseItem.id)}
                      style={[styles.actionButton, styles.approveButton]}
                      disabled={approveCaseMutation.isPending}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        setCaseToReject(caseItem);
                        setShowCaseRejectModal(true);
                      }}
                      style={[styles.actionButton, styles.rejectButton]}
                      disabled={rejectCaseMutation.isPending}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* User Documents Modal */}
      <Modal
        visible={showDocumentsModal && !!selectedUser}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowDocumentsModal(false);
          setSelectedUser(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>
                Credentials for {selectedUser?.firstName} {selectedUser?.lastName}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedUser?.specialty} {(selectedUser as any)?.level && `• ${(selectedUser as any)?.level}`} • {selectedUser?.institution}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowDocumentsModal(false);
                setSelectedUser(null);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {userDocumentsLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={styles.modalLoadingText}>Loading documents...</Text>
              </View>
            ) : userDocuments.length === 0 ? (
              <View style={styles.modalEmptyState}>
                <Ionicons name="document-text" size={64} color="#8E8E93" />
                <Text style={styles.modalEmptyTitle}>No documents found</Text>
                <Text style={styles.modalEmptySubtitle}>This user hasn't uploaded any credentials yet.</Text>
              </View>
            ) : (
              <View style={styles.documentsGrid}>
                {userDocuments.map((document) => (
                  <View key={document.id} style={styles.documentCard}>
                    <View style={styles.documentCardHeader}>
                      <View style={styles.documentIcon}>
                        <Ionicons name="document-text" size={24} color="#4ECDC4" />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{document.fileName}</Text>
                        {document.fileType && (
                          <Text style={styles.documentDetail}>
                            Type: {document.fileType}
                          </Text>
                        )}
                        <Text style={styles.documentDetail}>
                          Uploaded: {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </View>
                      <View style={[styles.documentStatusBadge, document.isApproved && styles.approvedStatusBadge]}>
                        <Text style={[styles.documentStatusText, document.isApproved && styles.approvedStatusText]}>
                          {document.isApproved ? 'Approved' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                    {document.fileUrl && (
                      <TouchableOpacity
                        onPress={() => {
                          if (document.fileUrl) {
                            const fullUrl = `${API_BASE_URL}${document.fileUrl}`;
                            Linking.openURL(fullUrl).catch(err => Alert.alert('Error', 'Could not open document.'));
                          }
                        }}
                        style={styles.documentViewButton}
                      >
                        <Ionicons name="eye" size={16} color="#4ECDC4" />
                        <Text style={styles.documentViewButtonText}>View Document</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* User Rejection Modal */}
      <Modal
        visible={showRejectModal && !!userToReject}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setUserToReject(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>Reject User Application</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setUserToReject(null);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {userToReject && (
              <View style={styles.card}>
                <Text style={styles.userName}>
                  Dr. {userToReject.firstName} {userToReject.lastName}
                </Text>
                <Text style={styles.userDetail}>{userToReject.email}</Text>
                <Text style={styles.userDetail}>{userToReject.specialty}</Text>
              </View>
            )}
            
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Reason for Rejection</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={6}
                placeholder="Please provide a detailed reason for rejecting this application. This message will be sent to the user via email."
                value={rejectionReason}
                onChangeText={setRejectionReason}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                The user will be notified via email with the reason you provide above.
              </Text>
            </View>
            
            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.viewButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setUserToReject(null);
                }}
              >
                <Text style={styles.viewButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalRejectButton]}
                onPress={() => {
                  if (userToReject && rejectionReason.trim()) {
                    rejectUserMutation.mutate({
                      userId: userToReject.id,
                      reason: rejectionReason.trim()
                    });
                  }
                }}
                disabled={rejectUserMutation.isPending || !rejectionReason.trim()}
              >
                <Text style={styles.modalRejectButtonText}>
                  {rejectUserMutation.isPending ? 'Rejecting...' : 'Reject User'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Case Rejection Modal */}
      <Modal
        visible={showCaseRejectModal && !!caseToReject}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCaseRejectModal(false);
          setCaseRejectionReason('');
          setCaseToReject(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>Reject Case Submission</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowCaseRejectModal(false);
                setCaseRejectionReason('');
                setCaseToReject(null);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {caseToReject && (
              <View style={styles.card}>
                <Text style={styles.caseTitle}>
                  {caseToReject.title}
                </Text>
                <Text style={styles.caseAuthor}>
                  By Dr. {caseToReject.author.firstName} {caseToReject.author.lastName}
                </Text>
                <Text style={styles.caseSpecialty}>{caseToReject.specialty}</Text>
                <Text style={styles.caseFormat}>Format: {caseToReject.format}</Text>
              </View>
            )}
            
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Reason for Rejection</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={6}
                placeholder="Please provide detailed feedback about why this case requires revision. This message will be sent to the author via email to help them improve their submission."
                value={caseRejectionReason}
                onChangeText={setCaseRejectionReason}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                The case author will be notified via email with the feedback you provide above. Be specific about what needs to be improved.
              </Text>
            </View>
            
            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.viewButton]}
                onPress={() => {
                  setShowCaseRejectModal(false);
                  setCaseRejectionReason('');
                  setCaseToReject(null);
                }}
              >
                <Text style={styles.viewButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalRejectButton]}
                onPress={() => {
                  if (caseToReject && caseRejectionReason.trim()) {
                    rejectCaseMutation.mutate({
                      caseId: caseToReject.id,
                      reason: caseRejectionReason.trim()
                    });
                  }
                }}
                disabled={rejectCaseMutation.isPending || !caseRejectionReason.trim()}
              >
                <Text style={styles.modalRejectButtonText}>
                  {rejectCaseMutation.isPending ? 'Rejecting...' : 'Reject Case'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Case Detail Modal */}
      <Modal
        visible={showCaseDetailModal && !!selectedCase}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCaseDetailModal(false);
          setSelectedCase(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>
                {selectedCase?.title}
              </Text>
              <Text style={styles.modalSubtitle}>
                By Dr. {selectedCase?.author.firstName} {selectedCase?.author.lastName} • {selectedCase?.specialty}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowCaseDetailModal(false);
                setSelectedCase(null);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {selectedCase && (
              <View style={styles.caseDetailContainer}>
                <View style={styles.caseMetaInfo}>
                  <View style={styles.caseMetaItem}>
                    <Text style={styles.caseMetaLabel}>Format:</Text>
                    <Text style={styles.caseMetaValue}>
                      {selectedCase.format === 'long' ? 'Long Case Format' : 'Short Case Format'}
                    </Text>
                  </View>
                  <View style={styles.caseMetaItem}>
                    <Text style={styles.caseMetaLabel}>Submitted:</Text>
                    <Text style={styles.caseMetaValue}>
                      {new Date(selectedCase.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {selectedCase.imageUrls && selectedCase.imageUrls.length > 0 && (
                    <View style={styles.caseMetaItem}>
                      <Text style={styles.caseMetaLabel}>Images:</Text>
                      <Text style={styles.caseMetaValue}>
                        {selectedCase.imageUrls.length} attached
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.caseSection}>
                  <Text style={styles.caseSectionTitle}>Case History</Text>
                  <Text style={styles.caseSectionContent}>{selectedCase.history}</Text>
                </View>

                {selectedCase.format === 'long' && selectedCase.chiefComplaint && (
                  <View style={styles.caseSection}>
                    <Text style={styles.caseSectionTitle}>Chief Complaint</Text>
                    <Text style={styles.caseSectionContent}>{selectedCase.chiefComplaint}</Text>
                  </View>
                )}

                {selectedCase.format === 'long' && selectedCase.historyOfPresentIllness && (
                  <View style={styles.caseSection}>
                    <Text style={styles.caseSectionTitle}>History of Present Illness</Text>
                    <Text style={styles.caseSectionContent}>{selectedCase.historyOfPresentIllness}</Text>
                  </View>
                )}

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      approveCaseMutation.mutate(selectedCase.id);
                      setShowCaseDetailModal(false);
                      setSelectedCase(null);
                    }}
                    style={[styles.modalActionButton, styles.modalApproveButton]}
                    disabled={approveCaseMutation.isPending}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.modalApproveButtonText}>Approve Case</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setCaseToReject(selectedCase);
                      setShowCaseDetailModal(false);
                      setShowCaseRejectModal(true);
                    }}
                    style={[styles.modalActionButton, styles.modalRejectButton]}
                    disabled={rejectCaseMutation.isPending}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.modalRejectButtonText}>Reject Case</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    marginTop: 8,
  },
  loadingSection: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
    marginRight: 12,
  },
  skeletonDocIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLineSmall: {
    width: '60%',
    height: 12,
  },
  skeletonButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userSpecialty: {
    fontSize: 14,
    color: '#4ECDC4',
    marginBottom: 2,
  },
  userDetail: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  docDetail: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  statusBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 40,
  },
  approveButton: {
    backgroundColor: '#34C759',
    flex: 1,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    flex: 1,
  },
  viewButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    paddingHorizontal: 12,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewButtonText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  modalEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  modalEmptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  documentsGrid: {
    gap: 16,
  },
  documentCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  documentDetail: {
    fontSize: 12,
    color: '#8E8E93',
  },
  documentStatusBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  documentStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#856404',
  },
  approvedStatusBadge: {
    backgroundColor: '#D4EDDA',
  },
  approvedStatusText: {
    color: '#155724',
  },
  documentViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  documentViewButtonText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Case styles
  caseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caseInfo: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  caseAuthor: {
    fontSize: 14,
    color: '#2E86AB',
    marginBottom: 2,
  },
  caseSpecialty: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  caseFormat: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
    marginBottom: 2,
  },
  caseDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  casePreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  caseHistory: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  // Case detail modal styles
  caseDetailContainer: {
    padding: 16,
  },
  caseMetaInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  caseMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseMetaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  caseMetaValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  caseSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  caseSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  caseSectionContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  modalApproveButton: {
    backgroundColor: '#4ECDC4',
  },
  modalApproveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalRejectButton: {
    backgroundColor: '#FF3B30',
  },
  modalRejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hotButton: {
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  coolButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
  },
  helperText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    lineHeight: 20,
  },
});