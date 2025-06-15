import { Clock, FileCheck, Shield, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PendingVerification() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Clock className="h-16 w-16 text-blue-500" />
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <FileCheck className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl">Verification Pending</CardTitle>
            <CardDescription className="text-base">
              Your account is currently under review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Thank you for completing your registration! Your medical credentials are currently being reviewed by our verification team.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <div>
                      <div className="font-medium">Document Review</div>
                      <div className="text-blue-700">Our team reviews your uploaded credentials</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div>
                      <div className="font-medium">Verification Process</div>
                      <div className="text-blue-700">We validate your medical license and board certifications</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle className="h-3 w-3 text-green-700" />
                    </div>
                    <div>
                      <div className="font-medium">Account Activation</div>
                      <div className="text-blue-700">You'll receive email notification when approved</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-yellow-800">Verification Timeline</div>
                    <div className="text-yellow-700">
                      Most applications are reviewed within 1-2 business days. We may contact you if additional documentation is needed.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Check Status
              </Button>
              
              <p className="text-xs text-gray-500">
                Need help? Contact support at{" "}
                <a href="mailto:support@medshare.com" className="text-blue-600 hover:underline">
                  support@medshare.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}