"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateSettings } from "@/actions/settings";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

interface NotificationSettingsFormProps {
  settings: { emailNotifications: boolean; aiSuggestions: boolean };
}

const Schema = z.object({
  emailNotifications: z.boolean(),
  aiSuggestions: z.boolean(),
});

type FormValues = z.infer<typeof Schema>;

export function NotificationSettingsForm({
  settings,
}: NotificationSettingsFormProps) {
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      emailNotifications: !!settings.emailNotifications,
      aiSuggestions: !!settings.aiSuggestions,
    },
  });

  async function onSubmit(values: FormValues) {
    const fd = new FormData();
    if (values.emailNotifications) fd.set("emailNotifications", "on");
    if (values.aiSuggestions) fd.set("aiSuggestions", "on");
    const res = await updateSettings(fd);
    if ("error" in res) {
      toast.error(res.error);
    } else {
      toast.success("Preferences updated");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="emailNotifications">Email Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive updates about boards and invites via email.
          </p>
        </div>
        <Controller
          control={control}
          name="emailNotifications"
          render={({ field }) => (
            <Switch
              id="emailNotifications"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={formState.isSubmitting}
            />
          )}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="aiSuggestions">AI Suggestions</Label>
          <p className="text-sm text-muted-foreground">
            Enable AI-generated summaries and suggestions.
          </p>
        </div>
        <Controller
          control={control}
          name="aiSuggestions"
          render={({ field }) => (
            <Switch
              id="aiSuggestions"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={formState.isSubmitting}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={formState.isSubmitting}>
        Save Preferences
      </Button>
    </form>
  );
}
