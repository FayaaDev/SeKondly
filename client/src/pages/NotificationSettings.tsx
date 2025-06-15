import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell, MessageSquare, Heart, UserPlus, CheckCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  caseLikes: boolean;
  caseComments: boolean;
  newFollowers: boolean;
  caseApprovals: boolean;
  mentions: boolean;
  weeklyDigest: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    caseLikes: true,
    caseComments: true,
    newFollowers: true,
    caseApprovals: true,
    mentions: true,
    weeklyDigest: false,
    pushNotifications: true,
    emailNotifications: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save notification preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save your notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const NotificationItem = ({ 
    icon: Icon, 
    title, 
    description, 
    prefKey 
  }: { 
    icon: any, 
    title: string, 
    description: string, 
    prefKey: keyof NotificationPreferences 
  }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start space-x-3 flex-1">
        <div className="flex-shrink-0 w-10 h-10 bg-ios-blue/10 rounded-full flex items-center justify-center">
          <Icon className="h-5 w-5 text-ios-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <Switch
        checked={preferences[prefKey]}
        onCheckedChange={() => handleToggle(prefKey)}
        className="ml-4"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-ios-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notifications</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Activity Notifications */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Activity Notifications</h2>
            <p className="text-sm text-gray-600">Get notified when others interact with your content</p>
          </div>
          
          <div className="space-y-1 divide-y divide-gray-100">
            <NotificationItem
              icon={Heart}
              title="Case Likes"
              description="When someone likes your medical cases"
              prefKey="caseLikes"
            />
            
            <NotificationItem
              icon={MessageSquare}
              title="Case Comments"
              description="When someone comments on your cases"
              prefKey="caseComments"
            />
            
            <NotificationItem
              icon={CheckCircle}
              title="Case Approvals"
              description="When your cases are approved by administrators"
              prefKey="caseApprovals"
            />
          </div>
        </Card>

        {/* Social Notifications */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Social Notifications</h2>
            <p className="text-sm text-gray-600">Stay connected with the medical community</p>
          </div>
          
          <div className="space-y-1 divide-y divide-gray-100">
            <NotificationItem
              icon={UserPlus}
              title="New Followers"
              description="When other medical professionals follow you"
              prefKey="newFollowers"
            />
            
            <NotificationItem
              icon={Bell}
              title="Mentions"
              description="When someone mentions you in comments"
              prefKey="mentions"
            />
          </div>
        </Card>

        {/* Digest & Summary */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Digest & Summary</h2>
            <p className="text-sm text-gray-600">Periodic summaries of platform activity</p>
          </div>
          
          <div className="space-y-1 divide-y divide-gray-100">
            <NotificationItem
              icon={Bell}
              title="Weekly Digest"
              description="Weekly summary of interesting cases and activity"
              prefKey="weeklyDigest"
            />
          </div>
        </Card>

        {/* Delivery Methods */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Delivery Methods</h2>
            <p className="text-sm text-gray-600">Choose how you want to receive notifications</p>
          </div>
          
          <div className="space-y-1 divide-y divide-gray-100">
            <NotificationItem
              icon={Bell}
              title="Push Notifications"
              description="Receive notifications on your mobile device"
              prefKey="pushNotifications"
            />
            
            <NotificationItem
              icon={Bell}
              title="Email Notifications"
              description="Receive notifications via email"
              prefKey="emailNotifications"
            />
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-ios-blue hover:bg-blue-600 text-white"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>

        {/* Info Text */}
        <div className="text-center text-sm text-gray-500 px-4">
          <p>You can change these settings at any time. Some notifications may be required for security purposes.</p>
        </div>
      </div>
    </div>
  );
}