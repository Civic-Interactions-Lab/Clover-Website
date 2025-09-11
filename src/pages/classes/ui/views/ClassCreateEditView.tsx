import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Save, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import { useClassData } from "@/pages/classes/hooks/useClassData";
import { toast } from "sonner";
import { createClass, updateClass } from "@/api/classes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { COLOR_PALETTE } from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ClassInfo } from "@/types/class";

interface FormErrors {
  classTitle?: string;
  classCode?: string;
  classDescription?: string;
  image?: string;
  submit?: string;
}

const ClassCreateEditView = () => {
  const { userData } = useUser();
  const { classId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!classId;
  const queryClient = useQueryClient();

  const imageUpload = useImageUpload({
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    bucketType: "class",
    onSuccess: (url) => {
      setFormData((prev) => ({ ...prev, classImageCover: url }));
    },
    onError: (error) => {
      setErrors((prev) => ({ ...prev, image: error }));
    },
  });

  const { data: existingClassData, isLoading: isLoadingClass } = useClassData(
    classId,
    { enabled: isEditMode }
  );

  const [formData, setFormData] = useState<ClassInfo>({
    classTitle: "",
    classCode: "",
    classDescription: "",
    classHexColor: COLOR_PALETTE[0],
    classImageCover: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode && existingClassData) {
      setFormData({
        classTitle: existingClassData.classTitle || "",
        classCode: existingClassData.classCode || "",
        classDescription: existingClassData.classDescription || "",
        classHexColor: existingClassData.classHexColor || COLOR_PALETTE[0],
        classImageCover: existingClassData.classImageCover || "",
      });

      imageUpload.setImageData(existingClassData.classImageCover);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existingClassData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleColorSelect = (color: string) => {
    setFormData((prev) => ({ ...prev, classHexColor: color }));
  };

  const resetForm = () => {
    if (isEditMode && existingClassData) {
      setFormData({
        classTitle: existingClassData.classTitle || "",
        classCode: existingClassData.classCode || "",
        classDescription: existingClassData.classDescription || "",
        classHexColor: existingClassData.classHexColor || COLOR_PALETTE[0],
        classImageCover: existingClassData.classImageCover || "",
      });
      imageUpload.setImageData(existingClassData.classImageCover);
    } else {
      setFormData({
        classTitle: "",
        classCode: "",
        classDescription: "",
        classHexColor: COLOR_PALETTE[0],
        classImageCover: "",
      });
      imageUpload.resetImageUpload();
    }

    setErrors({});
    toast.success(isEditMode ? "Form reset" : "Form cleared");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.classTitle.trim()) {
      newErrors.classTitle = "Class title is required";
    }

    if (!formData?.classCode?.trim()) {
      newErrors.classCode = "Class code is required";
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.classCode)) {
      newErrors.classCode = "Class code must be 3-10 uppercase letters/numbers";
    }

    if (!formData?.classDescription?.trim()) {
      newErrors.classDescription = "Class description is required";
    } else if (formData.classDescription.length < 20) {
      newErrors.classDescription = "Description must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !userData?.id) {
      return;
    }

    setIsSaving(true);

    try {
      const finalImageUrl = await imageUpload.getFinalImageUrl(userData.id);

      const classData: ClassInfo = {
        classTitle: formData.classTitle,
        classCode: formData.classCode,
        classDescription: formData.classDescription,
        classHexColor: formData.classHexColor,
        classImageCover: finalImageUrl,
        instructorId: userData.id,
      };

      if (isEditMode && classId) {
        console.log("Updating class with ID:", classId);
        const { id, error } = await updateClass(classId, classData);
        if (error) {
          throw new Error(error);
        }

        toast.success("Class updated successfully");
        queryClient.invalidateQueries({ queryKey: ["class", classId] });
        navigate(`/classes/${id}`, { replace: true });
      } else {
        const { id, error } = await createClass(classData);
        if (error) {
          throw new Error(error);
        }

        toast.success("Class created successfully");
        queryClient.invalidateQueries({
          queryKey: ["instructorClasses", userData.id],
        });
        navigate(`/classes/${id}`, { replace: true });
      }
    } catch (error) {
      console.error("Error saving class:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to save class. Please try again.",
      });
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save class. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? Any unsaved changes will be lost."
      )
    ) {
      navigate(-1);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        isEditMode
          ? "Are you sure you want to reset the form? All changes will be lost and the form will return to the original data."
          : "Are you sure you want to clear all form data?"
      )
    ) {
      resetForm();
    }
  };

  if (isLoadingClass) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Edit Class" : "Create New Class"}
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isSaving || imageUpload.isUploading}
              >
                {isEditMode ? "Reset" : "Clear"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || imageUpload.isUploading}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {imageUpload.isUploading
                      ? "Uploading image..."
                      : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? "Save Changes" : "Create Class"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Basic Information
            </h2>

            <div className="space-y-6">
              {/* Class Title */}
              <div className="space-y-2">
                <Label htmlFor="classTitle">
                  Class Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="classTitle"
                  name="classTitle"
                  value={formData.classTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Web Development"
                  className={errors.classTitle ? "border-red-500" : ""}
                />
                {errors.classTitle && (
                  <p className="text-sm text-red-500">{errors.classTitle}</p>
                )}
              </div>

              {/* Class Code */}
              <div className="space-y-2">
                <Label htmlFor="classCode">
                  Class Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="classCode"
                  name="classCode"
                  value={formData.classCode || ""}
                  onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    setFormData((prev) => ({
                      ...prev,
                      classCode: upperValue,
                    }));
                    setErrors((prev) => ({ ...prev, classCode: "" }));
                  }}
                  placeholder="e.g., WEB101"
                  maxLength={10}
                  className={errors.classCode ? "border-red-500" : ""}
                />
                {errors.classCode && (
                  <p className="text-sm text-red-500">{errors.classCode}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="classDescription">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="classDescription"
                  name="classDescription"
                  value={formData.classDescription}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Provide a detailed description of what students will learn..."
                  className={errors.classDescription ? "border-red-500" : ""}
                />
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">
                    {(formData.classDescription ?? "").length} characters
                  </p>
                  {errors.classDescription && (
                    <p className="text-sm text-red-500">
                      {errors.classDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Customization */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Visual Customization
            </h2>

            {/* Color Selection */}
            <div className="mb-6">
              <Label className="mb-3 block">Theme Color</Label>
              <div className="grid grid-cols-10 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-full aspect-square rounded-lg transition-all ${
                      formData.classHexColor === color
                        ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: formData.classHexColor }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {formData.classHexColor}
                </span>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-4">
              <Label>Cover Image (Optional)</Label>

              {/* Image Input Mode Selection */}
              <RadioGroup
                value={imageUpload.imageInputMode}
                onValueChange={(value: "upload" | "url") =>
                  imageUpload.setImageInputMode(value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="upload" />
                  <Label
                    htmlFor="upload"
                    className="font-normal cursor-pointer"
                  >
                    Upload Image
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" />
                  <Label htmlFor="url" className="font-normal cursor-pointer">
                    Image URL
                  </Label>
                </div>
              </RadioGroup>

              {/* Upload or URL Input */}
              {imageUpload.imageInputMode === "upload"
                ? !imageUpload.imagePreview && (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload cover image
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        JPEG, PNG or WebP (Max 5MB)
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={imageUpload.handleImageUpload}
                        disabled={imageUpload.isUploading}
                      />
                    </label>
                  )
                : !imageUpload.imagePreview && (
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={imageUpload.imageUrl}
                        onChange={(e) =>
                          imageUpload.setImageUrl(e.target.value)
                        }
                        placeholder="https://example.com/image.jpg"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={imageUpload.handleImageUrlSubmit}
                        variant="secondary"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Add URL
                      </Button>
                    </div>
                  )}

              {/* Image Preview */}
              {imageUpload.imagePreview && (
                <div className="relative">
                  <img
                    src={imageUpload.imagePreview}
                    alt="Class cover"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    onClick={imageUpload.removeImage}
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    disabled={imageUpload.isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {imageUpload.selectedImageFile &&
                    imageUpload.imageInputMode === "upload" && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Will upload: {imageUpload.selectedImageFile.name}
                      </div>
                    )}
                </div>
              )}

              {errors.image && (
                <p className="text-sm text-red-500">{errors.image}</p>
              )}

              {errors.submit && (
                <p className="text-sm text-red-500">{errors.submit}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCreateEditView;
