import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Users, FileText, Check, X, Eye, Settings, LogOut, Shield, TrendingUp, Clock, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User, Document } from "@shared/schema";

type AdminTab = "users" | "documents";

export default function AdminPanel() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const { user, isLoading, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();


  const { data: pendingUsers = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/pending-users"],
    enabled: !!user?.isAdmin,
    retry: false,
  });

  const { data: pendingDocuments = [], isLoading: documentsLoading, error: documentsError } = useQuery<Document[]>({
    queryKey: ["/api/admin/pending-documents"],
    enabled: !!user?.isAdmin && currentTab === "documents",
    retry: false,
  });

  // Query for user documents when modal is opened
  const { data: userDocuments = [], isLoading: userDocumentsLoading } = useQuery<Document[]>({
    queryKey: [`/api/admin/user-documents/${selectedUser?.id || ''}`],
    enabled: !!selectedUser?.id && showDocumentsModal,
    retry: false,
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/approve-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      toast({
        title: "User approved",
        description: "The user has been approved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/reject-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      toast({
        title: "User rejected",
        description: "The user has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("POST", `/api/admin/approve-document/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-documents"] });
      toast({
        title: "Document approved",
        description: "The document has been approved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      await apiRequest("POST", `/api/admin/reject-document/${documentId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-documents"] });
      toast({
        title: "Document rejected",
        description: "The document has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mock auth - no error handling needed

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have administrator privileges to access this panel.</p>
          <Button 
            onClick={() => setLocation("/")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to App
              </Button>
              <div className="hidden sm:block w-px h-6 bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage users and documents • SeKondly</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-500">Administrator</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Description */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Administration Panel</h2>
          <p className="mt-2 text-gray-600">
            Review and manage pending user registrations and document submissions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Users</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pendingUsers.length === 0 ? "All reviewed" : "Awaiting approval"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingDocuments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pendingDocuments.length === 0 ? "All reviewed" : "Need review"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Check className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingUsers.length + pendingDocuments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Combined actions needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current View</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{currentTab}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Active section
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setCurrentTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                User Approvals ({pendingUsers.length})
              </button>
              <button
                onClick={() => setCurrentTab("documents")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentTab === "documents"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Document Reviews ({pendingDocuments.length})
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {/* Users Tab */}
            {currentTab === "users" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Pending User Approvals</h2>
                  <p className="text-gray-600">Review and approve new user registrations</p>
                </div>
                
                {usersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <div className="h-8 bg-gray-200 rounded flex-1"></div>
                            <div className="h-8 bg-gray-200 rounded flex-1"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending users</h3>
                    <p className="text-gray-600">All user registrations have been reviewed.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingUsers.map((user) => (
                      <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <p className="text-sm text-blue-600 font-medium">{user.specialty}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                {user.institution && (
                                  <p className="text-sm text-gray-600">{user.institution}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending Review
                            </Badge>
                          </div>
                          
                          <div className="flex space-x-3 mt-6">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approveUserMutation.mutate(user.id)}
                              disabled={approveUserMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve User
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => rejectUserMutation.mutate(user.id)}
                              disabled={rejectUserMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-4"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDocumentsModal(true);
                              }}
                              title="View user credentials and documents"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Documents Tab */}
            {currentTab === "documents" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Pending Document Reviews</h2>
                  <p className="text-gray-600">Review and approve uploaded documents</p>
                </div>
                
                {documentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <div className="h-8 bg-gray-200 rounded flex-1"></div>
                            <div className="h-8 bg-gray-200 rounded flex-1"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : pendingDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending documents</h3>
                    <p className="text-gray-600">All documents have been reviewed.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingDocuments.map((document) => (
                      <Card key={document.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{document.fileName}</h3>
                                <p className="text-sm text-gray-600">
                                  Uploaded by {document.userId}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(document.createdAt || new Date()).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Needs Review
                            </Badge>
                          </div>
                          
                          <div className="flex space-x-3 mt-6">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approveDocumentMutation.mutate(document.id)}
                              disabled={approveDocumentMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve Document
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => rejectDocumentMutation.mutate({ 
                                documentId: document.id, 
                                reason: "Document does not meet requirements" 
                              })}
                              disabled={rejectDocumentMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-4"
                              onClick={() => window.open(document.fileUrl, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* User Documents Modal */}
      {showDocumentsModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDocumentsModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Credentials for {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedUser.specialty} • {selectedUser.institution}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDocumentsModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {userDocumentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              ) : userDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600">This user hasn't uploaded any credentials yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {userDocuments.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{document.fileName}</h3>
                              <p className="text-sm text-gray-600">
                                Type: {document.fileType}
                              </p>
                              <p className="text-sm text-gray-500">
                                Uploaded: {new Date(document.createdAt || new Date()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={document.isApproved ? "default" : "secondary"}
                              className={document.isApproved ? "bg-green-100 text-green-700" : ""}
                            >
                              {document.isApproved ? "Approved" : "Pending"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(document.fileUrl, '_blank')}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = window.document.createElement('a');
                                link.href = document.fileUrl;
                                link.download = document.fileName;
                                link.click();
                              }}
                              className="flex items-center space-x-1"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {userDocuments.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedUser.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Medical Board:</span>
                      <span className="ml-2 font-medium">{selectedUser.medicalBoard || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fellowship:</span>
                      <span className="ml-2 font-medium">{selectedUser.fellowship || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Experience:</span>
                      <span className="ml-2 font-medium">{selectedUser.experience || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Institution:</span>
                      <span className="ml-2 font-medium">{selectedUser.institution || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
