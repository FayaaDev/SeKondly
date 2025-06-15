import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Send, User } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CommentWithAuthor } from "@shared/schema";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  caseTitle: string;
}

export default function CommentModal({ isOpen, onClose, caseId, caseTitle }: CommentModalProps) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/cases", caseId, "comments"],
    enabled: isOpen,
    retry: false,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/cases/${caseId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setComment("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addCommentMutation.mutate(comment.trim());
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return past.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-w-sm mx-auto h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Comments</h3>
              <p className="text-sm text-gray-600 truncate">{caseTitle}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 p-2 h-auto"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to share your thoughts</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-medical-blue to-ios-blue rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">
                      Dr. {comment.author.firstName} {comment.author.lastName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(comment.createdAt?.toISOString() || new Date().toISOString())}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a thoughtful comment..."
              className="flex-1 min-h-[40px] max-h-[100px] resize-none rounded-xl border-gray-200"
              rows={1}
            />
            <Button
              type="submit"
              disabled={!comment.trim() || addCommentMutation.isPending}
              className="bg-ios-blue hover:bg-ios-blue-dark text-white rounded-xl px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}