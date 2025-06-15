import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfilePictureModal from "@/components/ProfilePictureModal";
import { User, Calendar, MapPin, Award, ChevronLeft, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CaseCard from "@/components/CaseCard";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import CaseDetailModal from "@/components/CaseDetailModal";
import { useLocation } from "wouter";
import { User as UserType, CaseWithAuthor, UserWithFollowStats } from "@shared/schema";

export default function PublicProfile() {
  const params = useParams();
  const userId = params.id;
  const [, setLocation] = useLocation();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: userCases, isLoading: casesLoading } = useQuery<CaseWithAuthor[]>({
    queryKey: [`/api/users/${userId}/cases`],
    enabled: !!userId,
  });

  const { data: followStatus } = useQuery<UserWithFollowStats>({
    queryKey: [`/api/users/${userId}/follow-status`],
    enabled: !!userId && !!currentUser,
  });

  const { data: followers } = useQuery<UserType[]>({
    queryKey: [`/api/users/${userId}/followers`],
    enabled: !!userId,
  });

  const { data: following } = useQuery<UserType[]>({
    queryKey: [`/api/users/${userId}/following`],
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      // Invalidate target user's data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/follow-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] });
      
      // Invalidate current user's following data
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/following`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/follow-status`] });
      }
      
      toast({
        title: "Following",
        description: "You are now following this user",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need to log in to follow users",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      // Invalidate target user's data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/follow-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] });
      
      // Invalidate current user's following data
      if (currentUser) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/following`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/follow-status`] });
      }
      
      toast({
        title: "Unfollowed",
        description: "You are no longer following this user",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need to log in to unfollow users",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-ios-bg">
        <div className="ios-safe-area">
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-ios-separator z-50">
            <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Profile</h1>
              <div className="w-9" />
            </div>
          </div>

          {/* Loading State */}
          <div className="p-4 space-y-6">
            <Card className="ios-card rounded-xl p-6">
              <div className="flex items-center space-x-4 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ios-bg">
        <div className="ios-safe-area">
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-ios-separator z-50">
            <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Profile</h1>
              <div className="w-9" />
            </div>
          </div>

          {/* Not Found State */}
          <div className="flex flex-col items-center justify-center p-8 text-center mt-20">
            <div className="w-24 h-24 bg-ios-gray/20 rounded-full flex items-center justify-center mb-6">
              <User className="w-12 h-12 text-ios-gray" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
            <p className="text-ios-gray mb-6">
              This user profile doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/")} variant="default">
              Back to Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalCases = userCases?.length || 0;
  const totalLikes = userCases?.reduce((sum: number, case_data: any) => sum + (case_data.likesCount || 0), 0) || 0;
  const totalViews = userCases?.reduce((sum: number, case_data: any) => sum + (case_data.viewsCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-ios-bg">
      <div className="ios-safe-area">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-ios-separator z-50">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Profile</h1>
            <div className="w-9" />
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-4 space-y-6">
          {/* User Info Card */}
          <Card className="ios-card rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <ProfilePictureModal
                imageUrl={user?.profileImageUrl || undefined}
                userName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                size="lg"
              />
              
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">
                  {user?.firstName || user?.lastName
                    ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                    : "Anonymous User"}
                </h2>
                
                {user?.specialty && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {user?.specialty}
                    </Badge>
                    {user?.experience && (
                      <Badge variant="outline" className="text-xs">
                        {user.experience}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col space-y-1 mt-3 text-sm text-ios-gray">
                  {user.institution && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{user.institution}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {formatDate(user.createdAt?.toISOString() || new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Card with Follow Button */}
          <Card className="ios-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="grid grid-cols-3 gap-4 text-center flex-1">
                <div>
                  <div className="text-2xl font-bold text-ios-blue">{totalCases}</div>
                  <div className="text-sm text-ios-gray">Cases</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-ios-blue">{followStatus?.followersCount || 0}</div>
                  <div className="text-sm text-ios-gray">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-ios-blue">{followStatus?.followingCount || 0}</div>
                  <div className="text-sm text-ios-gray">Following</div>
                </div>
              </div>
            </div>
            
            {currentUser && currentUser.id !== userId && (
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant={followStatus?.isFollowing ? "outline" : "default"}
                  onClick={() => followStatus?.isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className="flex items-center gap-2 w-full max-w-sm"
                >
                  {followStatus?.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="cases" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-ios-bg border border-ios-separator">
              <TabsTrigger value="cases" className="data-[state=active]:bg-white">
                Cases ({totalCases})
              </TabsTrigger>
              <TabsTrigger value="followers" className="data-[state=active]:bg-white">
                Followers ({followStatus?.followersCount || 0})
              </TabsTrigger>
              <TabsTrigger value="following" className="data-[state=active]:bg-white">
                Following ({followStatus?.followingCount || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="cases" className="mt-4">
              {casesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="ios-card rounded-xl p-4 animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : totalCases === 0 ? (
                <Card className="ios-card rounded-xl p-8 text-center">
                  <Award className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No cases yet</h4>
                  <p className="text-ios-gray">
                    This user hasn't shared any cases yet.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {userCases?.map((case_data) => (
                    <CaseCard
                      key={case_data.id}
                      case={case_data}
                      onClick={() => {
                        setSelectedCase(case_data);
                        setShowCaseDetail(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="followers" className="mt-4">
              {followers?.length === 0 ? (
                <Card className="ios-card rounded-xl p-8 text-center">
                  <User className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No followers yet</h4>
                  <p className="text-ios-gray">
                    This user doesn't have any followers yet.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {followers?.map((follower) => (
                    <Card key={follower.id} className="ios-card rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <ProfilePictureModal
                          imageUrl={follower.profileImageUrl || undefined}
                          userName={`${follower.firstName || ""} ${follower.lastName || ""}`.trim()}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold">
                            {follower.firstName || follower.lastName
                              ? `${follower.firstName || ""} ${follower.lastName || ""}`.trim()
                              : "Anonymous User"}
                          </div>
                          {follower.specialty && (
                            <div className="text-sm text-ios-gray">{follower.specialty}</div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/profile/${follower.id}`)}
                          className="text-ios-blue border-ios-blue"
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="following" className="mt-4">
              {following?.length === 0 ? (
                <Card className="ios-card rounded-xl p-8 text-center">
                  <User className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Not following anyone</h4>
                  <p className="text-ios-gray">
                    This user isn't following anyone yet.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {following?.map((followedUser) => (
                    <Card key={followedUser.id} className="ios-card rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <ProfilePictureModal
                          imageUrl={followedUser.profileImageUrl || undefined}
                          userName={`${followedUser.firstName || ""} ${followedUser.lastName || ""}`.trim()}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold">
                            {followedUser.firstName || followedUser.lastName
                              ? `${followedUser.firstName || ""} ${followedUser.lastName || ""}`.trim()
                              : "Anonymous User"}
                          </div>
                          {followedUser.specialty && (
                            <div className="text-sm text-ios-gray">{followedUser.specialty}</div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/profile/${followedUser.id}`)}
                          className="text-ios-blue border-ios-blue"
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Case Detail Modal */}
        {selectedCase && (
          <CaseDetailModal
            isOpen={showCaseDetail}
            onClose={() => {
              setShowCaseDetail(false);
              setSelectedCase(null);
            }}
            caseData={selectedCase}
          />
        )}
      </div>
    </div>
  );
}