import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfilePictureModalProps {
  imageUrl?: string;
  userName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export default function ProfilePictureModal({ 
  imageUrl, 
  userName,
  size = "md",
  className = "",
  children
}: ProfilePictureModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm": return "w-8 h-8";
      case "md": return "w-12 h-12";
      case "lg": return "w-24 h-24";
      default: return "w-12 h-12";
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${userName}_profile_picture.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Avatar className={`${getSizeClasses()} ${className} cursor-pointer hover:opacity-80 transition-opacity`}>
            <AvatarImage src={imageUrl} alt={userName} className="object-cover" />
            <AvatarFallback className="bg-ios-blue text-white font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-black/95 border-none">
        <div className="relative flex flex-col items-center justify-center min-h-[400px]">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* User info header */}
          <div className="absolute top-4 left-4 z-10 text-white">
            <h3 className="font-semibold text-lg">{userName}</h3>
            <p className="text-sm text-white/70">Profile Picture</p>
          </div>

          {/* Main image */}
          <div className="w-full h-full flex items-center justify-center p-8">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={userName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: '70vh' }}
              />
            ) : (
              <div className="w-64 h-64 bg-ios-blue rounded-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {getInitials(userName)}
                </span>
              </div>
            )}
          </div>

          {/* Download button */}
          {imageUrl && (
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-4 right-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={downloadImage}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}