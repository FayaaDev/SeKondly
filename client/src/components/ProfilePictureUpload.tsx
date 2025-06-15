import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  userName?: string;
  onUploadComplete?: (imageUrl: string) => void;
}

export default function ProfilePictureUpload({ 
  currentImageUrl, 
  userName = "User",
  onUploadComplete 
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch("/api/auth/user/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload profile picture");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
      onUploadComplete?.(data.profileImageUrl);
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG or PNG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage 
            src={currentImageUrl} 
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="text-lg font-medium bg-ios-blue text-white">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        <Button
          size="sm"
          variant="outline"
          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white border-2 border-ios-background shadow-md"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="flex items-center space-x-2"
      >
        <Upload className="w-4 h-4" />
        <span>{isUploading ? "Uploading..." : "Change Photo"}</span>
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}