import { useState } from "react";
import { Plus, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import CaseCard from "@/components/case-card";
import AddCaseModal from "@/components/add-case-modal";
import CaseDetailModal from "@/components/case-detail-modal";
import { Button } from "@/components/ui/button";
import { useVerification } from "@/hooks/use-verification";

export default function Feed() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  
  const { userStatus, isVerified } = useVerification();

  const { data: cases = [], isLoading, error } = useQuery({
    queryKey: ["/api/cases"],
    queryFn: api.getCases,
    enabled: isVerified, // Only fetch cases if user is verified
  });

  // Ensure cases is always an array
  const safeCases = Array.isArray(cases) ? cases : [];

  const handleCaseClick = (caseId: number) => {
    setSelectedCaseId(caseId);
  };

  // Show pending verification message for unverified users
  if (userStatus && !isVerified) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Pending</h3>
          <p className="text-gray-600 mb-4">
            Your account is currently under review. Once approved, you'll be able to view and share medical cases with your colleagues.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              We're verifying your medical credentials to ensure a secure professional environment. This process typically takes 1-2 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load cases</p>
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
    <>
      <div className="pb-20">
        {safeCases.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share a medical case with your colleagues.</p>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-medical-blue hover:bg-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Share First Case
            </Button>
          </div>
        ) : (
          safeCases.map((caseData) => (
            <CaseCard
              key={caseData.id}
              case={caseData}
              onClick={() => handleCaseClick(caseData.id)}
            />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-medical-blue hover:bg-blue-600 rounded-full shadow-lg z-30"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Modals */}
      <AddCaseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      <CaseDetailModal
        isOpen={selectedCaseId !== null}
        onClose={() => setSelectedCaseId(null)}
        caseId={selectedCaseId}
      />
    </>
  );
}
