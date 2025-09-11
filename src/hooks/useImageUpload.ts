import { useState } from "react";
import { toast } from "sonner";
import { IMAGE_UPLOAD_ENDPOINT } from "@/api/endpoints";

interface ImageUploadResponse {
  success: boolean;
  image_url?: string;
  image_path?: string;
  error?: string;
}

interface UseImageUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  bucketType?: "class" | "user";
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    bucketType = "user",
    onSuccess,
    onError,
  } = options;

  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">(
    "upload"
  );
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload image to server
  const uploadImageToServer = async (
    file: File,
    userId: string
  ): Promise<ImageUploadResponse | null> => {
    if (!userId) {
      const error = "User not authenticated";
      toast.error(error);
      onError?.(error);
      return null;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const uploadUrl = `${IMAGE_UPLOAD_ENDPOINT}?type=${bucketType}`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userId}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result: ImageUploadResponse = await response.json();

      if (result.success) {
        const imageUrl = result.image_url || "";
        onSuccess?.(imageUrl);
        return result;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";
      setUploadError(errorMessage);
      toast.error("Failed to upload image");
      onError?.(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Validate and handle file selection
  const handleFileSelect = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      const error = `Please upload a valid image file (${allowedTypes.map((type) => type.split("/")[1].toUpperCase()).join(", ")})`;
      setUploadError(error);
      onError?.(error);
      return error;
    }

    if (file.size > maxSize) {
      const error = `Image size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
      setUploadError(error);
      onError?.(error);
      return error;
    }

    setSelectedImageFile(file);
    setUploadError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);

    return null; // No error
  };

  // Handle image upload from file input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle URL submission
  const handleImageUrlSubmit = () => {
    if (imageUrl.trim()) {
      try {
        new URL(imageUrl);
        setImagePreview(imageUrl);
        setSelectedImageFile(null); // Clear file if using URL
        setUploadError(null);
        onSuccess?.(imageUrl);
      } catch {
        const error = "Please enter a valid URL";
        setUploadError(error);
        onError?.(error);
      }
    }
  };

  // Remove/clear image
  const removeImage = () => {
    setImagePreview(null);
    setImageUrl("");
    setSelectedImageFile(null);
    setUploadError(null);
  };

  // Reset all state
  const resetImageUpload = () => {
    setImageInputMode("upload");
    setImageUrl("");
    setSelectedImageFile(null);
    setImagePreview(null);
    setIsUploading(false);
    setUploadError(null);
  };

  // Set image data (useful for editing existing data)
  const setImageData = (imageUrl?: string | null) => {
    if (imageUrl) {
      setImagePreview(imageUrl);
      if (imageUrl.startsWith("http")) {
        setImageInputMode("url");
        setImageUrl(imageUrl);
        setSelectedImageFile(null);
      }
    } else {
      removeImage();
    }
  };

  // Get the final image URL (either uploaded or from URL input)
  const getFinalImageUrl = async (userId: string): Promise<string> => {
    if (selectedImageFile && imageInputMode === "upload") {
      const uploadResult = await uploadImageToServer(selectedImageFile, userId);
      if (uploadResult && uploadResult.success) {
        return uploadResult.image_url || "";
      } else {
        throw new Error("Failed to upload image");
      }
    }
    return imageUrl;
  };

  return {
    // State
    imageInputMode,
    imageUrl,
    selectedImageFile,
    imagePreview,
    isUploading,
    uploadError,

    // Actions
    setImageInputMode,
    setImageUrl,
    handleImageUpload,
    handleImageUrlSubmit,
    removeImage,
    resetImageUpload,
    setImageData,
    getFinalImageUrl,
    uploadImageToServer,

    // Utilities
    hasImage: !!imagePreview,
    hasSelectedFile: !!selectedImageFile,
    isUrlMode: imageInputMode === "url",
    isUploadMode: imageInputMode === "upload",
  };
};
