import { User, UserRole } from "@/types/user";
import { useState } from "react";
import { updateUser } from "@/api/user";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { Edit3, Link, Save, Upload, UserIcon, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useUser } from "@/context/UserContext";

interface EditUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
}

const EditUserButton = ({ user }: { user: User }) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { refetchUser } = useUser();

  const imageUpload = useImageUpload({
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    onSuccess: (url) => {
      form.setValue("avatarUrl", url);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const form = useForm<EditUserFormData>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  });

  const editUser = async (data: EditUserFormData) => {
    setIsSaving(true);

    try {
      const finalAvatarUrl = await imageUpload.getFinalImageUrl(user.id);

      const editedUser: User = {
        ...user,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        avatarUrl: finalAvatarUrl || data.avatarUrl,
        role: data.role,
      };

      const { success, error } = await updateUser(user.id, editedUser);

      if (success) {
        toast.success("User updated successfully");
        setOpen(false);
        form.reset(editedUser);
        imageUpload.resetImageUpload();
        refetchUser();
      } else {
        toast.error(`Error updating user: ${error}`);
        console.error("Error updating user:", error);
      }

      if (error) {
        toast.error(`Error updating user: ${error}`);
        console.error("Error updating user:", error);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });
      imageUpload.setImageData(user.avatarUrl);
    } else {
      imageUpload.resetImageUpload();
    }
  };

  const removeAvatar = () => {
    imageUpload.removeImage();
    form.setValue("avatarUrl", "");
  };

  const canEditRole =
    user.role === UserRole.DEV || user.role === UserRole.ADMIN;
  const notAnonymous = !user.email.includes("@anonymous.com");

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Edit3 className="h-4 w-4" />
          <span className="sr-only">Edit user</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(editUser)} className="space-y-6">
            {/* Avatar Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Profile Picture</Label>

              {/* Current Avatar Display */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {imageUpload.imagePreview || user.avatarUrl ? (
                    <div className="relative">
                      <img
                        src={imageUpload.imagePreview || user.avatarUrl}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                      <Button
                        type="button"
                        onClick={removeAvatar}
                        size="icon"
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                        disabled={imageUpload.isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.email.includes("@anonymous.com")
                      ? "Anonymous"
                      : user.email}
                  </p>
                </div>
              </div>

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
                    className="font-normal cursor-pointer text-sm"
                  >
                    Upload Image
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" />
                  <Label
                    htmlFor="url"
                    className="font-normal cursor-pointer text-sm"
                  >
                    Image URL
                  </Label>
                </div>
              </RadioGroup>

              {/* Upload or URL Input */}
              {imageUpload.imageInputMode === "upload"
                ? !imageUpload.imagePreview && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload avatar
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
                        placeholder="https://example.com/avatar.jpg"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={imageUpload.handleImageUrlSubmit}
                        variant="secondary"
                        size="sm"
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
            </div>

            {/* Form Fields */}
            {notAnonymous && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  rules={{ required: "First name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  rules={{ required: "Last name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {notAnonymous && (
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Role Selection - Only for DEV/ADMIN users */}
            {canEditRole && (
              <FormField
                control={form.control}
                name="role"
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.STUDENT}>
                          Student
                        </SelectItem>
                        <SelectItem value={UserRole.INSTRUCTOR}>
                          Instructor
                        </SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        {user.role === UserRole.DEV && (
                          <SelectItem value={UserRole.DEV}>
                            Developer
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={isSaving || imageUpload.isUploading}
              >
                <X /> Cancel
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={isSaving || imageUpload.isUploading}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {imageUpload.isUploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserButton;
