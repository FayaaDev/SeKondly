import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRound, ChevronLeft, Clock, Upload, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/DocumentUpload";

type OnboardingScreen = "welcome" | "signin" | "signup" | "documents" | "approval";

export default function Landing() {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>("welcome");
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const profileUpdateMutation = useMutation({
    mutationFn: async (profileData: any) => {
      await apiRequest("PATCH", "/api/auth/user", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been submitted. Please upload your documents.",
      });
      setCurrentScreen("documents");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user is already logged in and determine screen
  useEffect(() => {
    if (user) {
      if (!user.specialty) {
        setCurrentScreen("signup");
      } else if (!user.isApproved) {
        setCurrentScreen("approval");
      }
    }
  }, [user]);

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const profileData = {
      phone: formData.get("phone"),
      medicalBoard: formData.get("medicalBoard"),
      fellowship: formData.get("fellowship"),
      experience: formData.get("experience"),
      specialty: formData.get("specialty"),
      institution: formData.get("institution"),
    };

    profileUpdateMutation.mutate(profileData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative">
      {/* Welcome Screen */}
      {currentScreen === "welcome" && (
        <div className="p-6 safe-area-inset-top">
          <div className="text-center mt-16">
            <div className="w-24 h-24 bg-medical-blue rounded-full flex items-center justify-center mx-auto mb-8">
              <UserRound className="text-white text-3xl w-12 h-12" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">Sekondly</h1>
            <p className="text-ios-gray text-lg mb-12">
              A physician-exclusive platform. Get Second opinions by sharing challenging cases with colleagues.
            </p>
            
            <Button
              onClick={handleSignIn}
              className="w-full bg-ios-blue hover:bg-ios-blue-dark text-white py-4 rounded-xl text-lg font-medium mb-4 ios-button"
            >
              Sign In
            </Button>
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full border-ios-blue text-ios-blue hover:bg-ios-blue hover:text-white py-4 rounded-xl text-lg font-medium ios-button"
            >
              Create Account
            </Button>
          </div>
        </div>
      )}

      {/* Sign Up Screen */}
      {currentScreen === "signup" && (
        <div className="p-6 safe-area-inset-top">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentScreen("welcome")}
              className="text-ios-blue text-lg p-0 h-auto"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
          
          <h2 className="text-2xl font-semibold mb-8">Complete Your Profile</h2>
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-ios-gray-light rounded-xl"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="medicalBoard" className="block text-sm font-medium text-gray-700 mb-2">
                Medical Board
              </Label>
              <Select name="medicalBoard" required>
                <SelectTrigger className="w-full px-4 py-3 border border-ios-gray-light rounded-xl">
                  <SelectValue placeholder="Select Board Certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal-medicine">American Board of Internal Medicine</SelectItem>
                  <SelectItem value="surgery">American Board of Surgery</SelectItem>
                  <SelectItem value="pediatrics">American Board of Pediatrics</SelectItem>
                  <SelectItem value="emergency-medicine">American Board of Emergency Medicine</SelectItem>
                  <SelectItem value="cardiology">American Board of Cardiology</SelectItem>
                  <SelectItem value="neurology">American Board of Neurology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="fellowship" className="block text-sm font-medium text-gray-700 mb-2">
                Fellowship (Optional)
              </Label>
              <Input
                id="fellowship"
                name="fellowship"
                placeholder="Cardiology, Neurology, etc."
                className="w-full px-4 py-3 border border-ios-gray-light rounded-xl"
              />
            </div>
            
            <div>
              <Label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </Label>
              <Select name="experience" required>
                <SelectTrigger className="w-full px-4 py-3 border border-ios-gray-light rounded-xl">
                  <SelectValue placeholder="Select Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Resident (1-3 years)</SelectItem>
                  <SelectItem value="junior">Junior Attending (4-7 years)</SelectItem>
                  <SelectItem value="senior">Senior Attending (8-15 years)</SelectItem>
                  <SelectItem value="veteran">Veteran (15+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                Primary Specialty
              </Label>
              <Select name="specialty" required>
                <SelectTrigger className="w-full px-4 py-3 border border-ios-gray-light rounded-xl">
                  <SelectValue placeholder="Select Primary Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="emergency-medicine">Emergency Medicine</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="radiology">Radiology</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="internal-medicine">Internal Medicine</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                Institution
              </Label>
              <Input
                id="institution"
                name="institution"
                placeholder="Hospital or clinic name"
                className="w-full px-4 py-3 border border-ios-gray-light rounded-xl"
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={profileUpdateMutation.isPending}
              className="w-full bg-ios-blue hover:bg-ios-blue-dark text-white py-4 rounded-xl text-lg font-medium mt-8 ios-button"
            >
              {profileUpdateMutation.isPending ? "Submitting..." : "Complete Profile"}
            </Button>
          </form>
        </div>
      )}

      {/* Approval Pending Screen */}
      {currentScreen === "approval" && (
        <div className="p-6 safe-area-inset-top text-center">
          <div className="mt-20">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Clock className="text-yellow-600 w-12 h-12" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Account Under Review</h2>
            <p className="text-ios-gray text-lg mb-8">
              Your account is being reviewed by our medical team. You'll receive a notification once approved.
            </p>
            
            <Button
              onClick={() => window.location.reload()}
              className="bg-ios-blue hover:bg-ios-blue-dark text-white px-8 py-3 rounded-xl ios-button"
            >
              Check Status
            </Button>
            
            <Button
              onClick={async () => {
                await fetch("/api/logout", { method: "POST", credentials: "include" });
                window.location.href = "/";
              }}
              variant="ghost"
              className="w-full mt-4 text-ios-gray"
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Document Upload Screen */}
      {currentScreen === "documents" && (
        <div className="p-6 safe-area-inset-top">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentScreen("signup")}
              className="text-ios-blue text-lg p-0 h-auto"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
          
          <DocumentUpload onUploadComplete={() => setCurrentScreen("approval")} />
        </div>
      )}
    </div>
  );
}
