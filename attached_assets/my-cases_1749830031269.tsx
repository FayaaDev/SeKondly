import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Eye, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyCases() {
  const { data: cases = [], isLoading, error } = useQuery({
    queryKey: ["/api/my-cases"],
    queryFn: api.getMyCases,
  });

  // Ensure cases is always an array
  const safeCases = Array.isArray(cases) ? cases : [];

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getStatusInfo = (commentsCount: number, createdAt: Date | string) => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (commentsCount >= 5) {
      return { label: "Resolved", color: "bg-medical-green", textColor: "text-white" };
    }
    if (daysSinceCreated <= 2) {
      return { label: "Active", color: "bg-amber-500", textColor: "text-white" };
    }
    return { label: "Pending", color: "bg-gray-500", textColor: "text-white" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load your cases</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold text-gray-900 mb-4">My Cases</h2>
      
      {safeCases.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases shared yet</h3>
          <p className="text-gray-600">Start sharing medical cases to get second opinions from colleagues.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeCases.map((caseData) => {
            const status = getStatusInfo(caseData.commentsCount, caseData.createdAt!);
            
            return (
              <div key={caseData.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1 pr-2">{caseData.title}</h3>
                  <span className={`text-sm ${status.color} ${status.textColor} px-2 py-1 rounded-full whitespace-nowrap`}>
                    {status.label}
                  </span>
                </div>
                
                <p className="clinical-gray text-sm mb-2">
                  Posted {formatTimeAgo(caseData.createdAt!)} • {caseData.commentsCount} responses
                </p>
                
                <div className="flex items-center space-x-4 text-sm clinical-gray">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{caseData.viewsCount} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{caseData.commentsCount} comments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{caseData.likesCount} likes</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
