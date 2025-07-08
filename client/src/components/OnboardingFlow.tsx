import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRound, ChevronLeft, Clock, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OnboardingScreen = "welcome" | "signin" | "signup" | "approval";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = () => {
    setCurrentScreen("signin");
  };

  const handleSignUp = () => {
    setCurrentScreen("signup");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const loginData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        onComplete();
      } else {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const signupData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      boardCertification: formData.get('specialty') as string,
      fellowship: formData.get('fellowship') as string,
      yearsOfExperience: formData.get('experience') as string,
    };

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Account created successfully! Your account is being reviewed.",
        });
        setCurrentScreen("approval");
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
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
              onClick={handleSignUp}
              variant="outline"
              className="w-full border-ios-blue text-ios-blue hover:bg-ios-blue hover:text-white py-4 rounded-xl text-lg font-medium ios-button"
            >
              Create Account
            </Button>
          </div>
        </div>
      )}

      {/* Sign In Screen */}
      {currentScreen === "signin" && (
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
          
          <h2 className="text-2xl font-semibold mb-8">Sign In</h2>
          
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1"
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1"
                placeholder="Enter your password"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ios-blue hover:bg-ios-blue-dark text-white py-4 rounded-xl text-lg font-medium mt-8 ios-button"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Button
                variant="link"
                onClick={handleSignUp}
                className="text-ios-blue p-0 h-auto"
              >
                Create Account
              </Button>
            </p>
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
          
          <h2 className="text-2xl font-semibold mb-8">Create Account</h2>
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  className="mt-1"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  className="mt-1"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="mt-1"
                placeholder="john.doe@hospital.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password *
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1"
                placeholder="Create a secure password"
              />
            </div>
            
            <div>
              <Label htmlFor="specialty" className="text-sm font-medium text-gray-700">
                Primary Specialty
              </Label>
              <Select name="specialty">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="emergency-medicine">Emergency Medicine</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="radiology">Radiology</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="internal-medicine">Internal Medicine</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="dermatology">Dermatology</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="psychiatry">Psychiatry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="fellowship" className="text-sm font-medium text-gray-700">
                Fellowship (Optional)
              </Label>
              <Input
                id="fellowship"
                name="fellowship"
                className="mt-1"
                placeholder="e.g., Interventional Cardiology"
              />
            </div>
            
            <div>
              <Label htmlFor="experience" className="text-sm font-medium text-gray-700">
                Years of Experience
              </Label>
              <Select name="experience">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="4-7">4-7 years</SelectItem>
                  <SelectItem value="8-15">8-15 years</SelectItem>
                  <SelectItem value="15+">15+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ios-blue hover:bg-ios-blue-dark text-white py-4 rounded-xl text-lg font-medium mt-8 ios-button"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={() => setCurrentScreen("signin")}
                className="text-ios-blue p-0 h-auto"
              >
                Sign In
              </Button>
            </p>
          </div>
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
              Your account is being reviewed by our medical team. You'll receive an email notification once approved.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={async () => {
                  // Quick demo login for development
                  try {
                    const response = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ email: 'demo@medconnect.com', password: 'demo123' }),
                    });
                    if (response.ok) {
                      toast({
                        title: "Demo Access",
                        description: "Logged in with demo account!",
                      });
                      onComplete();
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Demo login failed",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full bg-ios-blue hover:bg-ios-blue-dark text-white px-8 py-3 rounded-xl ios-button mb-3"
              >
                Try Demo Account
              </Button>
              
              <Button
                onClick={() => setCurrentScreen("welcome")}
                variant="outline"
                className="w-full px-8 py-3 rounded-xl ios-button"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
