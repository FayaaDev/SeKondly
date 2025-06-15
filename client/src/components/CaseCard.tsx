import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Bookmark, User, MoreHorizontal, ThumbsUp, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CommentModal from "./CommentModal";
import ProfilePictureModal from "./ProfilePictureModal";

interface CaseCardProps {
  case: any; // CaseWithAuthor type from schema
  onClick?: () => void;
}

export default function CaseCard({ case: caseData, onClick }: CaseCardProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/cases/${caseData.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      console.log('Favorite mutation triggered for case:', caseData.id);
      const result = await apiRequest("POST", `/api/cases/${caseData.id}/favorite`);
      console.log('Favorite mutation result:', result);
      return result;
    },
    onSuccess: (data: any) => {
      console.log('Favorite mutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Success",
        description: data?.favorited ? "Case added to favorites" : "Case removed from favorites",
      });
    },
    onError: (error) => {
      console.error('Favorite mutation error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hideSpecialtyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/specialties/hide`, {
        specialty: caseData.specialty
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Specialty Hidden",
        description: `${caseData.specialty} cases will no longer appear in your feed.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return past.toLocaleDateString();
  };

  const truncateHistory = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the case click
    setLocation(`/user/${caseData.author.id}`);
  };

  return (
    <Card className="ios-card rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      {/* Header */}
      <div className="flex items-start space-x-3 mb-3">
        <div onClick={handleProfileClick}>
          <ProfilePictureModal
            imageUrl={caseData.author?.profileImageUrl}
            userName={`Dr. ${caseData.author?.firstName || 'Unknown'} ${caseData.author?.lastName || 'User'}`}
            size="md"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span 
              className="font-medium text-gray-900 cursor-pointer hover:text-ios-blue transition-colors"
              onClick={handleProfileClick}
            >
              Dr. {caseData.author?.firstName || 'Unknown'} {caseData.author?.lastName || 'User'}
            </span>
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
              {caseData.specialty}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-ios-gray">
            <span>{formatTimeAgo(caseData.createdAt)}</span>
            <span>•</span>
            <span>{caseData.viewsCount || 0} views</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-ios-gray p-2 h-auto" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                hideSpecialtyMutation.mutate();
              }}
              className="flex items-center space-x-2 text-red-600"
            >
              <EyeOff className="h-4 w-4" />
              <span>Not interested in {caseData.specialty}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-lg mb-2">{caseData.title}</h3>
      
      {/* History/Description */}
      <div className="text-gray-700 mb-3">
        {showFullHistory ? (
          <p>{caseData.history}</p>
        ) : (
          <p>{truncateHistory(caseData.history)}</p>
        )}
        {caseData.history.length > 150 && (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-ios-blue mt-1"
            onClick={() => setShowFullHistory(!showFullHistory)}
          >
            {showFullHistory ? "Show less" : "Read more"}
          </Button>
        )}
      </div>
      
      {/* Images */}
      {caseData.imageUrls && caseData.imageUrls.length > 0 && (
        <div className="mb-3">
          {caseData.imageUrls.length === 1 ? (
            <img
              src={caseData.imageUrls[0]}
              alt="Medical case image"
              className="w-full case-image rounded-lg object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {caseData.imageUrls.slice(0, 4).map((url: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Medical case image ${index + 1}`}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  {index === 3 && caseData.imageUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium">
                        +{caseData.imageUrls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between text-ios-gray">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center space-x-1 p-2 h-auto ${
            caseData.isLikedByUser ? "text-blue-500" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            likeMutation.mutate();
          }}
          disabled={likeMutation.isPending}
        >
          <ThumbsUp 
            className={`h-4 w-4 ${caseData.isLikedByUser ? "fill-current" : ""}`} 
          />
          <span>{caseData.likesCount || 0}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1 p-2 h-auto"
          onClick={() => setShowComments(true)}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{caseData.commentsCount || 0}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1 p-2 h-auto"
        >
          <Share className="h-4 w-4" />
          <span>Share</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center space-x-1 p-2 h-auto ${
            caseData.isFavoritedByUser ? "text-pink-500" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            favoriteMutation.mutate();
          }}
          disabled={favoriteMutation.isPending}
        >
          <Heart 
            className={`h-4 w-4 ${caseData.isFavoritedByUser ? "fill-current" : ""}`} 
          />
        </Button>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        caseId={caseData.id}
        caseTitle={caseData.title}
      />
    </Card>
  );
}
