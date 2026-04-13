"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/actions/settings";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const Schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof Schema>;

export function ChangePasswordForm() {
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  });

  async function onSubmit(values: FormValues) {
    const fd = new FormData();
    const res = await changePassword(
      values.currentPassword,
      values.newPassword,
    );
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else {
      toast.success("Password changed successfully");
      reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="Enter current password"
          disabled={formState.isSubmitting}
          {...register("currentPassword")}
        />
        {formState.errors.currentPassword && (
          <p className="text-xs text-red-500">
            {formState.errors.currentPassword.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            disabled={formState.isSubmitting}
            {...register("newPassword")}
          />
          {formState.errors.newPassword && (
            <p className="text-xs text-red-500">
              {formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            disabled={formState.isSubmitting}
            {...register("confirmPassword")}
          />
          {formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={formState.isSubmitting} className="gap-2">
        <Save className="h-4 w-4" />
        {formState.isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
