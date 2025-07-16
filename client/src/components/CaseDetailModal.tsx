import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Heart, 
  MessageCircle, 
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { CommentWithAuthor, CaseWithAuthor } from "@shared/schema";

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseWithAuthor;
}

export default function CaseDetailModal({ isOpen, onClose, caseData }: CaseDetailModalProps) {
  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch case comments
  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/cases", caseData?.id, "comments"],
    enabled: !!caseData?.id && isOpen,
  });

  // Like/unlike mutation
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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/cases/${caseData.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData?.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setNewComment("");
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

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const nextImage = () => {
    if (caseData?.imageUrls && currentImageIndex < caseData.imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleProfileClick = () => {
    navigate(`/profile/${caseData.author.id}`);
    onClose(); // Close the modal when navigating to profile
  };

  if (!caseData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 rounded-xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={handleProfileClick}>
              <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity">
                <AvatarImage src={caseData.author?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-medical-blue to-ios-blue text-white font-semibold">
                  {getInitials(caseData.author?.firstName || undefined, caseData.author?.lastName || undefined)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold hover:text-ios-blue transition-colors">
                  Dr. {caseData.author?.firstName} {caseData.author?.lastName}
                </p>
                <p className="text-sm text-gray-500">{caseData.author?.specialty}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-2 h-auto rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Case Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {caseData.specialty}
              </Badge>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(caseData.createdAt || new Date()))} ago</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{caseData.viewsCount || 0}</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold">{caseData.title}</h2>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Case History</h3>
              <p className="text-blue-700 leading-relaxed">{caseData.history}</p>
            </div>

            {/* Image Gallery */}
            {caseData.imageUrls && caseData.imageUrls.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Medical Images</h3>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={caseData.imageUrls[currentImageIndex]}
                    alt={`Case image ${currentImageIndex + 1}`}
                    className="w-full h-64 object-contain"
                  />
                  
                  {caseData.imageUrls.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={nextImage}
                        disabled={currentImageIndex === caseData.imageUrls.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {caseData.imageUrls.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Interaction Buttons */}
            <div className="flex items-center space-x-4 pt-2">
              <Button
                variant="ghost"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className={`flex items-center space-x-2 ${
                  caseData.isLikedByUser ? 'text-red-500' : 'text-gray-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${caseData.isLikedByUser ? 'fill-current' : ''}`} />
                <span>{caseData.likesCount || 0}</span>
              </Button>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageCircle className="w-4 h-4" />
                <span>{caseData.commentsCount || 0} comments</span>
              </div>
            </div>
          </div>

          {/* Comments Section - Twitter-inspired */}
          <div className="border-t bg-white">
            {/* Comment Input */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-medical-blue to-ios-blue text-white font-semibold text-sm">
                    {getInitials(caseData.author?.firstName || undefined, caseData.author?.lastName || undefined)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Post your medical insights..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] border-0 resize-none text-lg placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gray-500">
                      {newComment.length}/280 characters
                    </div>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending || newComment.length > 280}
                      className="bg-ios-blue hover:bg-ios-blue/90 text-white px-6 py-2 rounded-full font-semibold disabled:opacity-50"
                    >
                      {addCommentMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="max-h-80 overflow-y-auto">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ios-blue"></div>
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div 
                    key={comment.id} 
                    className={`px-6 py-4 hover:bg-gray-50/50 transition-colors ${
                      index !== comments.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={comment.author?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white font-semibold text-sm">
                          {getInitials(comment.author?.firstName || undefined, comment.author?.lastName || undefined)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-sm truncate">
                            Dr. {comment.author?.firstName} {comment.author?.lastName}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100"
                          >
                            {comment.author?.specialty}
                          </Badge>
                          <span className="text-gray-500 text-sm">·</span>
                          <span className="text-gray-500 text-sm">
                            {formatDistanceToNow(new Date(comment.createdAt || new Date()))}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-900 break-words">
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-6 mt-3">
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-ios-blue transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                              <Heart className="w-4 h-4" />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">No comments yet</h3>
                  <p className="text-gray-500 text-sm">
                    Be the first to share your medical insights!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}