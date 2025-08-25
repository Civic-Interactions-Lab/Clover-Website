import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateUserPassword } from "../api/user";
import { supabase } from "../supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

export const ResetPasswordButton = ({ userId }: { userId?: string }) => {
  const [open, setOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePassword = async () => {
    if (form.getValues("newPassword") !== form.getValues("confirmPassword")) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }
    if (userId) {
      const { error } = await updateUserPassword(
        userId,
        form.getValues("newPassword")
      );

      if (error) {
        console.error("Error resetting password: ", error);
      }
    } else {
      const { data, error } = await supabase.auth.updateUser({
        password: form.getValues("newPassword"),
      });
      if (data) {
        console.log("Password updated successfully");
      }
      if (error) {
        console.error("Error updating user: ", error);
      }
    }

    setOpen(false);
    form.reset();
  };

  return (
    <div className="">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gray-500 hover:bg-gray-600">
            Change Password
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white dark:bg-zinc-900 rounded-xl shadow shadow-gray-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Enter a new password</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(changePassword)}
              className="space-y-8 mt-4"
            >
              <FormField
                control={form.control}
                name="newPassword"
                rules={{ required: "Password is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                rules={{ required: "Please confirm your password" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full !mt-8 font-semibold text-lg !py-5"
              >
                Change
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
