import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X, Camera, Upload, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCaseModal({ isOpen, onClose }: NewCaseModalProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCaseMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Use fetch directly for multipart form data
      const response = await fetch("/api/cases", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create case");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-cases"] });
      toast({
        title: "Case submitted",
        description: "Your case has been submitted for review.",
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedImages([]);
    setSelectedSpecialty("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload up to 5 images per case.",
        variant: "destructive",
      });
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedSpecialty) {
      toast({
        title: "Specialty required",
        description: "Please select a medical specialty for this case.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    // Ensure specialty is properly added
    formData.set("specialty", selectedSpecialty);
    
    // Add images
    selectedImages.forEach(image => {
      formData.append("images", image);
    });

    createCaseMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl p-6 pt-8 w-full max-w-sm mx-auto animate-slide-up">
        <div className="w-12 h-1 bg-ios-gray-light rounded-full mx-auto mb-6"></div>
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Share a New Case</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-ios-gray p-2 h-auto"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Case Title
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter a descriptive title"
              className="w-full px-4 py-3 border border-ios-gray-light rounded-xl"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="history" className="block text-sm font-medium text-gray-700 mb-2">
              Brief History
            </Label>
            <Textarea
              id="history"
              name="history"
              placeholder="Describe the case background, symptoms, and relevant history..."
              rows={4}
              className="w-full px-4 py-3 border border-ios-gray-light rounded-xl resize-none"
              required
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Images
            </Label>
            
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-ios-gray-light rounded-xl p-6 text-center mb-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="text-ios-gray text-3xl w-8 h-8 mx-auto mb-2" />
                <p className="text-ios-gray">Add medical images, scans, or charts</p>
                <p className="text-xs text-ios-gray mt-1">Up to 5 images</p>
              </label>
            </div>
            
            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Specialty Tags
            </Label>
            <Select onValueChange={setSelectedSpecialty} required>
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
                <SelectItem value="dermatology">Dermatology</SelectItem>
                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                <SelectItem value="psychiatry">Psychiatry</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3 mt-8">
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-3 border-ios-gray-light text-ios-gray rounded-xl ios-button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCaseMutation.isPending}
              className="flex-1 py-3 bg-ios-blue hover:bg-ios-blue-dark text-white rounded-xl ios-button"
            >
              {createCaseMutation.isPending ? "Sharing..." : "Share Case"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
