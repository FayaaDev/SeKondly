import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Users, FileText, Check, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User, Document } from "@shared/schema";

type AdminTab = "users" | "documents";

export default function AdminPanel() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("users");
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock auth - admin access granted

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
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-blue"></div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="p-4 safe-area-inset-top">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/"}
            className="text-ios-blue text-lg p-0 h-auto"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />Back
          </Button>
          <h1 className="text-xl font-semibold ml-4">Admin Panel</h1>
        </div>
        
        {/* Admin Tabs */}
        <div className="flex mb-6 bg-ios-gray-light rounded-xl p-1">
          <Button
            variant={currentTab === "users" ? "default" : "ghost"}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg ${
              currentTab === "users" 
                ? "bg-white shadow-sm text-gray-900" 
                : "text-ios-gray"
            }`}
            onClick={() => setCurrentTab("users")}
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
          <Button
            variant={currentTab === "documents" ? "default" : "ghost"}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg ${
              currentTab === "documents" 
                ? "bg-white shadow-sm text-gray-900" 
                : "text-ios-gray"
            }`}
            onClick={() => setCurrentTab("documents")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </Button>
        </div>
        
        {/* Users Tab */}
        {currentTab === "users" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold mb-4">Pending User Approvals</h2>
            
            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="ios-card rounded-xl p-4 animate-pulse">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : pendingUsers.length === 0 ? (
              <Card className="ios-card rounded-xl p-8 text-center">
                <Users className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending users</h3>
                <p className="text-ios-gray">All users have been reviewed.</p>
              </Card>
            ) : (
              pendingUsers.map((user) => (
                <Card key={user.id} className="ios-card rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-ios-blue rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-ios-gray">{user.specialty}</p>
                      <p className="text-xs text-ios-gray">{user.email}</p>
                      <p className="text-xs text-ios-gray">{user.institution}</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white ios-button"
                      onClick={() => approveUserMutation.mutate(user.id)}
                      disabled={approveUserMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 ios-button"
                      onClick={() => rejectUserMutation.mutate(user.id)}
                      disabled={rejectUserMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 ios-button"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        
        {/* Documents Tab */}
        {currentTab === "documents" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold mb-4">Pending Document Reviews</h2>
            
            {documentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="ios-card rounded-xl p-4 animate-pulse">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : pendingDocuments.length === 0 ? (
              <Card className="ios-card rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending documents</h3>
                <p className="text-ios-gray">All documents have been reviewed.</p>
              </Card>
            ) : (
              pendingDocuments.map((document) => (
                <Card key={document.id} className="ios-card rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-blue-600 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{document.fileName}</h3>
                      <p className="text-sm text-ios-gray">
                        Uploaded by {document.userId}
                      </p>
                      <p className="text-xs text-ios-gray">
                        {new Date(document.createdAt || new Date()).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Review</Badge>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white ios-button"
                      onClick={() => approveDocumentMutation.mutate(document.id)}
                      disabled={approveDocumentMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 ios-button"
                      onClick={() => rejectDocumentMutation.mutate({ 
                        documentId: document.id, 
                        reason: "Document does not meet requirements" 
                      })}
                      disabled={rejectDocumentMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 ios-button"
                      onClick={() => window.open(document.fileUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
