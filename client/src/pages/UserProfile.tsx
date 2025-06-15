import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, MapPin, Calendar, Award, User, FileText, Heart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CaseCard from "@/components/CaseCard";
import CaseDetailModal from "@/components/CaseDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User as UserType, CaseWithAuthor } from "@shared/schema";

export default function UserProfile() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  // Mock auth - no redirect needed

  // Fetch user profile data
  const { data: profileUser, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
    retry: false,

  });

  // Fetch user's cases
  const { data: userCases = [], isLoading: isLoadingCases } = useQuery<CaseWithAuthor[]>({
    queryKey: ["/api/users", userId, "cases"],
    enabled: !!userId,
    retry: false,

  });

  if (!userId) {
    return (
      <div className="min-h-screen bg-ios-background flex items-center justify-center p-4">
        <Card className="ios-card rounded-xl p-8 text-center">
          <User className="w-16 h-16 text-ios-gray mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">User not found</h3>
          <p className="text-ios-gray">The profile you're looking for doesn't exist.</p>
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    window.history.back();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="min-h-screen bg-ios-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-ios-separator">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-ios-blue hover:bg-ios-blue/10"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {isLoadingUser ? (
          <Card className="ios-card rounded-xl p-6 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </Card>
        ) : profileUser ? (
          <>
            {/* Profile Header */}
            <Card className="ios-card rounded-xl p-6 mb-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={profileUser.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials(profileUser.firstName || undefined, profileUser.lastName || undefined)}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-bold mb-1">
                  Dr. {profileUser.firstName} {profileUser.lastName}
                </h2>
                
                {profileUser.specialty && (
                  <Badge variant="outline" className="mb-3">
                    {profileUser.specialty}
                  </Badge>
                )}

                <div className="flex items-center text-sm text-ios-gray mb-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  {profileUser.experience} years experience
                </div>

                {profileUser.institution && (
                  <div className="flex items-center text-sm text-ios-gray mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profileUser.institution}
                  </div>
                )}

                <div className="flex items-center text-sm text-ios-gray">
                  <Award className="w-4 h-4 mr-1" />
                  Board Certified • Verified
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card className="ios-card rounded-xl p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-ios-blue">{userCases.length}</div>
                  <div className="text-sm text-ios-gray">Cases Shared</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-ios-blue">
                    {userCases.reduce((total: number, case_data: any) => total + (case_data.likes || 0), 0)}
                  </div>
                  <div className="text-sm text-ios-gray">Total Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-ios-blue">
                    {userCases.reduce((total: number, case_data: any) => total + (case_data.comments || 0), 0)}
                  </div>
                  <div className="text-sm text-ios-gray">Comments</div>
                </div>
              </div>
            </Card>

            {/* Cases Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Published Cases</h3>
                <Badge variant="secondary">{userCases.length}</Badge>
              </div>

              {isLoadingCases ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="ios-card rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="flex space-x-4">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : userCases.length === 0 ? (
                <Card className="ios-card rounded-xl p-8 text-center">
                  <FileText className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No cases shared yet</h3>
                  <p className="text-ios-gray">This doctor hasn't shared any cases.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {userCases.map((case_data) => (
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
            </div>
          </>
        ) : (
          <Card className="ios-card rounded-xl p-8 text-center">
            <User className="w-16 h-16 text-ios-gray mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
            <p className="text-ios-gray">This user profile doesn't exist or has been removed.</p>
          </Card>
        )}
      </div>

      {/* Case Detail Modal */}
      <CaseDetailModal
        isOpen={showCaseDetail}
        onClose={() => {
          setShowCaseDetail(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
      />
    </div>
  );
}