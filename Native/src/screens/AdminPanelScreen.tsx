import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/queryClient';

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
}

type AdminTab = 'users' | 'documents';

export default function AdminPanelScreen() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('users');
  const { user, isLoading } = useAuth();
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

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/admin/approve-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-users'] });
      Alert.alert('User approved', 'The user has been approved successfully.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to approve user');
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/admin/reject-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-users'] });
      Alert.alert('User rejected', 'The user has been rejected.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to reject user');
    },
  });

  const approveDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest('POST', `/api/admin/approve-document/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-documents'] });
      Alert.alert('Document approved', 'The document has been approved successfully.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to approve document');
    },
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      await apiRequest('POST', `/api/admin/reject-document/${documentId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-documents'] });
      Alert.alert('Document rejected', 'The document has been rejected.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to reject document');
    },
  });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (!user?.isAdmin) {
    return <Text>Not authorized</Text>;
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setCurrentTab('users')} style={{ marginRight: 16 }}>
          <Text style={{ fontWeight: currentTab === 'users' ? 'bold' : 'normal' }}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTab('documents')}>
          <Text style={{ fontWeight: currentTab === 'documents' ? 'bold' : 'normal' }}>Documents</Text>
        </TouchableOpacity>
      </View>
      {currentTab === 'users' && (
        <View>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Pending User Approvals</Text>
          {usersLoading ? (
            <ActivityIndicator />
          ) : (
            pendingUsers.map((user) => (
              <View key={user.id} style={{ marginBottom: 12, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                <Text>{user.firstName} {user.lastName} ({user.email})</Text>
                <Text>{user.specialty}</Text>
                <Text>{user.institution}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => approveUserMutation.mutate(user.id)}
                    style={{ marginRight: 12, backgroundColor: 'green', padding: 8, borderRadius: 4 }}
                  >
                    <Text style={{ color: 'white' }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => rejectUserMutation.mutate(user.id)}
                    style={{ backgroundColor: 'red', padding: 8, borderRadius: 4 }}
                  >
                    <Text style={{ color: 'white' }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
      {currentTab === 'documents' && (
        <View>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Pending Document Reviews</Text>
          {documentsLoading ? (
            <ActivityIndicator />
          ) : (
            pendingDocuments.map((document) => (
              <View key={document.id} style={{ marginBottom: 12, padding: 12, backgroundColor: '#e0eaff', borderRadius: 8 }}>
                <Text>{document.fileName}</Text>
                <Text>Uploaded by: {document.userId}</Text>
                <Text>Date: {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : ''}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => approveDocumentMutation.mutate(document.id)}
                    style={{ marginRight: 12, backgroundColor: 'green', padding: 8, borderRadius: 4 }}
                  >
                    <Text style={{ color: 'white' }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => rejectDocumentMutation.mutate({ documentId: document.id, reason: 'Document does not meet requirements' })}
                    style={{ backgroundColor: 'red', padding: 8, borderRadius: 4 }}
                  >
                    <Text style={{ color: 'white' }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
} 