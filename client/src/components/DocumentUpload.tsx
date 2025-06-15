import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      
      // Use fetch directly for file uploads instead of apiRequest
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include", // Important for session cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded",
        description: "Your document has been submitted for review.",
      });
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
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type === "application/pdf" || file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Only PDF files and images are allowed.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Files must be smaller than 10MB.",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, index: number) => {
    try {
      await uploadMutation.mutateAsync(file);
      setUploadedFiles(prev => [...prev, file.name]);
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Medical Documents</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please upload your medical license, board certifications, and any relevant credentials.
        </p>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
        <input
          type="file"
          accept=".pdf,image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="document-upload"
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-1">Click to upload documents</p>
          <p className="text-xs text-gray-400">PDF files and images up to 10MB</p>
        </label>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <Card key={index} className="p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => uploadFile(file, index)}
                  disabled={uploadMutation.isPending}
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  Upload
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-green-700">Uploaded Documents:</h4>
          {uploadedFiles.map((fileName, index) => (
            <Card key={index} className="p-3 flex items-center space-x-3 bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">{fileName}</p>
                <p className="text-xs text-green-600">Uploaded successfully</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Completion Button */}
      {uploadedFiles.length > 0 && (
        <Button
          onClick={onUploadComplete}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
        >
          Complete Document Upload
        </Button>
      )}

      {/* Required Documents Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-sm text-blue-800 mb-2">Required Documents:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Medical License</li>
          <li>• Board Certification</li>
          <li>• Professional ID or Credentials</li>
          <li>• Institution Verification (if applicable)</li>
        </ul>
      </Card>
    </div>
  );
}