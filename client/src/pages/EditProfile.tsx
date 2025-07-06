import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { User as UserType } from "@shared/schema";
import { MEDICAL_SPECIALTIES, MEDICAL_LEVELS } from "@/constants/medical";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  institution: z.string().min(1, "Institution is required"),
  specialty: z.string().min(1, "Specialty is required"),
  experience: z.string().min(1, "Experience is required"),
  fellowship: z.string().optional(),
});

type EditProfileData = z.infer<typeof editProfileSchema>;

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      institution: user?.institution || "",
      specialty: user?.specialty || "",
      experience: user?.experience || "",
      fellowship: user?.fellowship || "",
    },
  });

  // Update form when user data loads
  useState(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        institution: user.institution || "",
        specialty: user.specialty || "",
        experience: user.experience || "",
        fellowship: user.fellowship || "",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileData) => {
      const response = await fetch("/api/auth/user", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setLocation("/");
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProfileData) => {
    updateProfileMutation.mutate(data);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-ios-blue" />
      </div>
    );
  }

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
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Picture Section */}
        <Card className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Profile Picture</h3>
            <p className="text-sm text-gray-600">Upload a professional photo</p>
          </div>
          <ProfilePictureUpload
            currentImageUrl={user?.profileImageUrl || undefined}
            userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
            onUploadComplete={() => {
              // Refresh user data after upload
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            }}
          />
        </Card>

        {/* Edit Form */}
        <Card className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    placeholder="First name"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    placeholder="Last name"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="Phone number"
                  type="tel"
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Professional Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  {...form.register("institution")}
                  placeholder="Hospital or medical institution"
                />
                {form.formState.errors.institution && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.institution.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Select
                  value={form.watch("specialty")}
                  onValueChange={(value) => form.setValue("specialty", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICAL_SPECIALTIES.map((specialty: string) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.specialty && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.specialty.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <Select
                  value={form.watch("experience")}
                  onValueChange={(value) => form.setValue("experience", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.experience && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.experience.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fellowship">Fellowship</Label>
                <Input
                  id="fellowship"
                  {...form.register("fellowship")}
                  placeholder="Fellowship training (optional)"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-ios-blue hover:bg-blue-600 text-white"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}