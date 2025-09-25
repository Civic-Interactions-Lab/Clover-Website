import React, { useState } from "react";
import { supabase } from "@/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SURVEY_TYPES = "PRE_SURVEY" | "POST_SURVEY" | "POST_STUDY";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSurveyCreated?: (surveyId: string) => void;
}

const NewSurveyDialog = ({ open, onOpenChange, onSurveyCreated }: Props) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    context: "",
    type: "PRE_SURVEY" as SURVEY_TYPES,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 255) {
      newErrors.title = "Title too long (max 255 characters)";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description too long (max 1000 characters)";
    }

    if (formData.context && formData.context.length > 100) {
      newErrors.context = "Context too long (max 100 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsCreating(true);

      // Get current user for RLS
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Authentication required to create survey");
        return;
      }

      const newSurveyData = {
        title: formData.title,
        description: formData.description || "",
        context: formData.context || "",
        type: formData.type,
      };

      const { data: surveyData, error } = await supabase
        .from("surveys")
        .insert([newSurveyData])
        .select()
        .single();

      if (error) throw error;

      console.log("Survey created successfully!");

      // Close dialog and notify parent
      onOpenChange(false);
      onSurveyCreated?.(surveyData.id);

      // Reset form
      setFormData({
        title: "",
        description: "",
        context: "",
        type: "PRE_SURVEY",
      });
      setErrors({});
    } catch (error: any) {
      console.error("Error creating survey:", error);
      setErrors({ submit: error.message || "Failed to create survey" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      context: "",
      type: "PRE_SURVEY",
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Survey</DialogTitle>
          <DialogDescription>
            Create a new survey to collect responses from participants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Survey Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter survey title"
              disabled={isCreating}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the survey"
              rows={3}
              disabled={isCreating}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context (Optional)</Label>
            <Input
              id="context"
              value={formData.context}
              onChange={(e) => handleInputChange("context", e.target.value)}
              placeholder="e.g., study_phase_1, baseline"
              disabled={isCreating}
            />
            {errors.context && (
              <p className="text-sm text-red-600">{errors.context}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Survey Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: SURVEY_TYPES) =>
                handleInputChange("type", value)
              }
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select survey type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRE_SURVEY">Pre-Survey</SelectItem>
                <SelectItem value="POST_SURVEY">Post-Survey</SelectItem>
                <SelectItem value="POST_STUDY">Post-Study</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Survey"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSurveyDialog;
