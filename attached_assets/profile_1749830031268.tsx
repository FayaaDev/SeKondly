import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MapPin, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: api.getProfile,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
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
      {/* Profile Header */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-medical-blue rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-100">
            <span className="text-white text-2xl font-bold">
              {profile?.name?.split(' ')[1]?.[0] || 'D'}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
        <p className="clinical-gray">{profile.specialty} • {profile.hospitalName || 'Medical Center'}</p>
        <p className="text-sm clinical-gray mt-1">{profile.experience} years experience</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profile.stats?.cases || 0}</div>
          <div className="text-sm clinical-gray">Cases</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profile.stats?.responses || 0}</div>
          <div className="text-sm clinical-gray">Helps</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profile.stats?.helped || 0}</div>
          <div className="text-sm clinical-gray">Favorites</div>
        </div>
      </div>
      
      {/* Professional Details */}
      <div className="space-y-4 mb-6">
        {profile.city && profile.state && (
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{profile.city}, {profile.state}</span>
          </div>
        )}
        
        {profile.boardCertification && (
          <div className="flex items-center space-x-3">
            <Award className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">Board Certified: {profile.boardCertification}</span>
          </div>
        )}
        
        {profile.hospitalName && (
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">Currently at {profile.hospitalName}</span>
          </div>
        )}
      </div>
      
      {/* Additional Information */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Professional Verification</h3>
        <p className="text-sm clinical-gray">
          Your medical credentials have been verified. This badge ensures colleagues can trust your professional background.
        </p>
        <div className="mt-2 flex items-center">
          <div className="w-4 h-4 bg-medical-green rounded-full flex items-center justify-center mr-2">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-sm font-medium text-green-700">Verified Medical Professional</span>
        </div>
      </div>
    </div>
  );
}
