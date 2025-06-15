import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, Award, Upload, CloudUpload, LogIn } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  boardCertification: string;
  fellowship: string;
  yearsOfExperience: string;
  credentialsFile?: File;
}

const boardCertifications = [
  "Internal Medicine",
  "Cardiology", 
  "Neurology",
  "Orthopedic Surgery",
  "Emergency Medicine",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Anesthesiology",
  "Dermatology",
  "Oncology",
  "Other"
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInData, setSignInData] = useState({
    username: "",
    password: ""
  });
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    boardCertification: "",
    fellowship: "",
    yearsOfExperience: "",
  });
  const [credentialsFile, setCredentialsFile] = useState<File | null>(null);
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const formData = new FormData();
      
      // Add form fields
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('phone', data.phone);
      formData.append('password', data.password);
      formData.append('boardCertification', data.boardCertification);
      formData.append('fellowship', data.fellowship || '');
      formData.append('yearsOfExperience', data.yearsOfExperience);
      formData.append('email', `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`);
      
      // Add credentials file if uploaded
      if (credentialsFile) {
        formData.append('credentialsFile', credentialsFile);
      }

      const response = await fetch("/api/onboarding", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete onboarding");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to MedShare!",
        description: "Your profile has been created successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest("/api/login", "POST", credentials);
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.password || !formData.confirmPassword) {
        toast({
          title: "Required fields missing",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password mismatch",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        return;
      }
      if (formData.password.length < 6) {
        toast({
          title: "Password too short",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.boardCertification || !formData.yearsOfExperience) {
        toast({
          title: "Required fields missing",
          description: "Please fill in board certification and years of experience.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      submitMutation.mutate(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCredentialsFile(file);
    }
  };

  const updateFormData = (key: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInData.username || !signInData.password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    signInMutation.mutate(signInData);
  };

  const renderSignInForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <LogIn className="h-12 w-12 text-medical-blue" />
        </div>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your existing account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={signInData.username}
              onChange={(e) => setSignInData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              disabled={signInMutation.isPending}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={signInData.password}
              onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              disabled={signInMutation.isPending}
              className="mt-1"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSignIn(false)}
              disabled={signInMutation.isPending}
              className="flex-1"
            >
              Back to Sign Up
            </Button>
            <Button
              type="submit"
              disabled={signInMutation.isPending}
              className="flex-1"
            >
              {signInMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderStep1 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <User className="h-12 w-12 text-medical-blue" />
        </div>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Let's start with your basic information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData("firstName", e.target.value)}
            placeholder="Enter your first name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData("lastName", e.target.value)}
            placeholder="Enter your last name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => updateFormData("password", e.target.value)}
            placeholder="Create a password"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData("confirmPassword", e.target.value)}
            placeholder="Confirm your password"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Award className="h-12 w-12 text-medical-blue" />
        </div>
        <CardTitle>Professional Information</CardTitle>
        <CardDescription>
          Tell us about your medical qualifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="boardCertification">Board Certification *</Label>
          <Select value={formData.boardCertification} onValueChange={(value) => updateFormData("boardCertification", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your board certification" />
            </SelectTrigger>
            <SelectContent>
              {boardCertifications.map((cert) => (
                <SelectItem key={cert} value={cert}>{cert}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="fellowship">Fellowship (Optional)</Label>
          <Input
            id="fellowship"
            value={formData.fellowship}
            onChange={(e) => updateFormData("fellowship", e.target.value)}
            placeholder="Enter your fellowship specialty"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
          <Input
            id="yearsOfExperience"
            type="number"
            value={formData.yearsOfExperience}
            onChange={(e) => updateFormData("yearsOfExperience", e.target.value)}
            placeholder="Enter years of experience"
            className="mt-1"
            min="0"
            max="50"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Upload className="h-12 w-12 text-medical-blue" />
        </div>
        <CardTitle>Upload Credentials</CardTitle>
        <CardDescription>
          Upload your medical credentials for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-900">Medical Credentials</Label>
          <div className="mt-2">
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors block">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {credentialsFile ? (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm text-gray-600">{credentialsFile.name}</p>
                  <p className="text-xs text-gray-400">Click to change file</p>
                </div>
              ) : (
                <>
                  <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Upload your medical credentials</p>
                  <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                </>
              )}
            </label>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Your credentials will be reviewed by our verification team. 
          This process typically takes 1-2 business days.
        </div>
      </CardContent>
    </Card>
  );

  if (showSignIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MedShare</h1>
            <p className="text-gray-600">Sign in to your existing account</p>
          </div>
        </div>
        {renderSignInForm()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto mb-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MedShare</h1>
          <p className="text-gray-600">Complete your profile to get started</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignIn(true)}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Already have an account? Sign In
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <Progress value={(currentStep / 3) * 100} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Personal Info</span>
            <span>Professional Info</span>
            <span>Credentials</span>
          </div>
        </div>
      </div>

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      <div className="w-full max-w-md mx-auto mt-6">
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
              disabled={submitMutation.isPending}
            >
              Previous
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 bg-medical-blue hover:bg-blue-600"
            disabled={submitMutation.isPending}
          >
            {currentStep === 3 ? 
              (submitMutation.isPending ? "Creating Profile..." : "Complete Setup") : 
              "Next"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}