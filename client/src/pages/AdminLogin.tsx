import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // If user is already signed in and is admin, redirect to admin panel
  if (user?.isAdmin) {
    setLocation("/admin-panel");
    return null;
  }

  // If user is signed in but not admin, show access denied
  if (user && !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            Your account doesn't have administrator privileges. Please contact support if you believe this is an error.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation("/")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
            <Button 
              variant="outline"
              onClick={() => signOut()}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Starting login process...");
      
      // Step 1: Perform login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", loginResponse.status);

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log("Login successful, received data:", loginData);
        
        // Step 2: Fetch user data to check admin status
        const userResponse = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        console.log("User data response status:", userResponse.status);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("User data received:", userData);
          
          // Step 3: Check if user is admin and redirect accordingly
          if (userData.isAdmin) {
            toast({
              title: "Welcome back!",
              description: "Signed in successfully as administrator.",
            });
            // Force a page reload to update auth state and redirect to admin panel
            window.location.href = "/admin";
          } else {
            toast({
              title: "Access Denied",
              description: "Your account doesn't have administrator privileges.",
              variant: "destructive",
            });
            // Sign out the non-admin user
            await signOut();
          }
        } else {
          throw new Error("Failed to fetch user data after login");
        }
      } else {
        let errorMessage = "Invalid email or password.";
        try {
          const error = await loginResponse.json();
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse login error response:", parseError);
          errorMessage = `Login failed with status ${loginResponse.status}`;
        }
        
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Administrator Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access the SeKondly admin dashboard
          </p>
        </div>

        {/* Sign In Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-800">Sign in to continue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your admin email"
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In as Admin
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Main App
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Only authorized administrators can access this area.
            <br />
            If you need access, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
