import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Award } from "lucide-react";
import { Link } from "wouter";
import CaseCard from "@/components/case-card";
import { useState } from "react";
import CaseDetailModal from "@/components/case-detail-modal";
import type { CaseWithAuthor, User } from "@shared/schema";

interface DoctorProfileData extends User {
  casesShared: number;
  helps: number;
  favorites: number;
}

export default function DoctorProfile() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const { data: doctor, isLoading: isDoctorLoading } = useQuery<DoctorProfileData>({
    queryKey: ["/api/doctors", doctorId],
    enabled: !!doctorId,
  });

  const { data: doctorCases = [], isLoading: isCasesLoading } = useQuery<CaseWithAuthor[]>({
    queryKey: ["/api/doctors", doctorId, "cases"],
    enabled: !!doctorId,
  });

  const handleCaseClick = (caseId: number) => {
    setSelectedCaseId(caseId);
    setIsCaseModalOpen(true);
  };

  if (isDoctorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Doctor not found</p>
          <Link href="/feed">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link href="/feed">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white">
        <div className="max-w-md mx-auto px-6 py-8 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarFallback className="text-xl bg-medical-blue text-white">
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{doctor.name}</h1>
          
          <div className="text-gray-600 mb-1">
            <span className="font-medium">{doctor.specialty}</span>
            {doctor.hospitalName && (
              <>
                <span className="mx-2">•</span>
                <span>{doctor.hospitalName}</span>
              </>
            )}
          </div>
          
          {doctor.experience && (
            <p className="text-gray-500 mb-6">{doctor.experience} years experience</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{doctor.casesShared || 0}</div>
              <div className="text-sm text-gray-500">Cases Shared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{doctor.helps || 0}</div>
              <div className="text-sm text-gray-500">Helps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{doctor.favorites || 0}</div>
              <div className="text-sm text-gray-500">Favorites</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 text-sm text-gray-600">
            {doctor.city && doctor.state && (
              <div className="flex items-center justify-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{doctor.city}, {doctor.state}</span>
              </div>
            )}
            {doctor.boardCertification && (
              <div className="flex items-center justify-center">
                <Award className="h-4 w-4 mr-2" />
                <span>Board Certified: {doctor.boardCertification}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-md mx-auto bg-white">
        <Tabs defaultValue="cases" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 mx-4 mb-4">
            <TabsTrigger value="cases" className="data-[state=active]:bg-white text-xs">
              Cases ({doctorCases.length})
            </TabsTrigger>
            <TabsTrigger value="helps" className="data-[state=active]:bg-white text-xs">
              Helps ({doctor.helps || 0})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-white text-xs">
              Favorites ({doctor.favorites || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="mt-0">
            <div className="px-4 pb-4">
              {isCasesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medical-blue mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading cases...</p>
                </div>
              ) : doctorCases.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No cases shared yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {doctorCases.map((caseData) => (
                    <CaseCard
                      key={caseData.id}
                      case={caseData}
                      onClick={() => handleCaseClick(caseData.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="helps" className="mt-0">
            <div className="px-4 pb-4">
              <div className="text-center py-8">
                <p className="text-gray-500">Help history coming soon</p>
                <p className="text-sm text-gray-400 mt-1">
                  This will show cases where this doctor provided helpful responses
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            <div className="px-4 pb-4">
              <div className="text-center py-8">
                <p className="text-gray-500">Favorite cases coming soon</p>
                <p className="text-sm text-gray-400 mt-1">
                  This will show cases this doctor has favorited
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Case Detail Modal */}
      <CaseDetailModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        caseId={selectedCaseId}
      />
    </div>
  );
}