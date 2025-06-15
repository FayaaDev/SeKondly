import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  X, 
  Heart, 
  MessageCircle, 
  Send, 
  User, 
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
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
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

          {/* Comments Section */}
          <div className="border-t bg-gray-50">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold">Medical Discussion</h3>
              
              {/* Add Comment */}
              <div className="flex space-x-3">
                <Textarea
                  placeholder="Share your medical insights, differential diagnosis, or treatment suggestions..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 min-h-[80px] resize-none"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {commentsLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading comments...</div>
                ) : comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <Card key={comment.id} className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.author?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-sm">
                              Dr. {comment.author?.firstName} {comment.author?.lastName}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {comment.author?.specialty}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt || new Date()))} ago
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No comments yet. Be the first to share your medical insights!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}