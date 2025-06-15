import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, FileCheck, Shield, Ban, Trash2, Check, X, Eye, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Admin() {
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { adminUser, isLoading: authLoading, isAuthenticated } = useAdminAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/admin/login";
    }
  }, [authLoading, isAuthenticated]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/logout", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      queryClient.clear();
      window.location.href = "/admin/login";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render admin panel if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
  });

  // Fetch pending credentials
  const { data: pendingCredentials = [], isLoading: credentialsLoading } = useQuery({
    queryKey: ["/api/admin/credentials"],
    queryFn: async () => {
      const response = await fetch("/api/admin/credentials");
      if (!response.ok) throw new Error("Failed to fetch pending credentials");
      return response.json() as Promise<User[]>;
    },
  });

  // Update user status mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Credentials approval mutation
  const credentialsMutation = useMutation({
    mutationFn: async ({ userId, status, rejectReason }: { userId: number; status: string; rejectReason?: string }) => {
      const response = await fetch(`/api/admin/credentials/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectReason }),
      });
      if (!response.ok) throw new Error("Failed to update credentials");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Credentials updated successfully" });
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getUserStatusBadge = (user: User) => {
    if (user.isBanned) return <Badge variant="destructive">Banned</Badge>;
    if (user.isVerified) return <Badge variant="default" className="bg-green-500">Verified</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getCredentialsStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleVerifyUser = (userId: number) => {
    updateUserMutation.mutate({ userId, updates: { isVerified: 1 } });
  };

  const handleBanUser = (userId: number) => {
    updateUserMutation.mutate({ userId, updates: { isBanned: 1 } });
  };

  const handleUnbanUser = (userId: number) => {
    updateUserMutation.mutate({ userId, updates: { isBanned: 0 } });
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const handleApproveCredentials = (userId: number) => {
    credentialsMutation.mutate({ userId, status: "approved" });
  };

  const handleRejectCredentials = (userId: number) => {
    if (!rejectReason.trim()) {
      toast({ title: "Reject reason required", variant: "destructive" });
      return;
    }
    credentialsMutation.mutate({ userId, status: "rejected", rejectReason });
  };

  return (
    <div className="p-6 pb-20">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage users and approve credentials</p>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as admin
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Users
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Approve Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Verify, ban, or delete user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          {getUserStatusBadge(user)}
                          {user.isAdmin === 1 && <Badge variant="outline">Admin</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.specialty} • {user.experience} years</p>
                        <p className="text-xs text-gray-400">Joined: {new Date(user.createdAt!).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!user.isVerified && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyUser(user.id)}
                            disabled={updateUserMutation.isPending}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        {user.isBanned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnbanUser(user.id)}
                            disabled={updateUserMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBanUser(user.id)}
                            disabled={updateUserMutation.isPending}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone and will remove all their cases and comments.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Approval</CardTitle>
              <CardDescription>
                Review and approve medical credentials uploaded during registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {credentialsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : pendingCredentials.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending credentials to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCredentials.map((user) => (
                    <div key={user.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            {getCredentialsStatusBadge(user.credentialsStatus || "pending")}
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.specialty} • {user.experience} years</p>
                          <p className="text-sm text-gray-500">Board Certification: {user.boardCertification}</p>
                          {user.fellowship && (
                            <p className="text-sm text-gray-500">Fellowship: {user.fellowship}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Submitted: {new Date(user.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {user.credentialsUrl && (
                        <div className="mb-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mb-2"
                            onClick={() => window.open(`/api/admin/credentials/${user.id}/document`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Credentials
                          </Button>
                        </div>
                      )}

                      {user.credentialsStatus === "pending" && (
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <Textarea
                              placeholder="Rejection reason (required if rejecting)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveCredentials(user.id)}
                              disabled={credentialsMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectCredentials(user.id)}
                              disabled={credentialsMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {user.credentialsRejectReason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-700">
                            <strong>Rejection Reason:</strong> {user.credentialsRejectReason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}