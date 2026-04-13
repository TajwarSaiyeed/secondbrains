"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  forgotPasswordSchema,
  ForgotPasswordValues,
} from "@/schema/auth-schema";
import { sendPasswordResetEmail } from "@/actions/auth/password";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  async function handleSubmit(values: ForgotPasswordValues) {
    setIsLoading(true);
    setError("");

    const result = await sendPasswordResetEmail(values.email);

    if (!result?.status) {
      setError(result?.message || "Failed to send reset email");
      toast.error(result?.message || "Failed to send reset email");
      setIsLoading(false);
    } else {
      setSuccessEmail(values.email);
      toast.success("If the email exists, a reset link has been sent.");
      setIsLoading(false);
      form.reset();
    }
  }

  if (successEmail) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Check your email
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            We&apos;ve sent a password reset link to{" "}
            <strong>{successEmail}</strong>
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Didn&apos;t receive the email? Check your spam folder or</p>
          <Button
            variant="link"
            onClick={() => {
              setSuccessEmail(null);
              setError("");
            }}
            className="h-auto p-0"
          >
            try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                We&apos;ll send a reset link to this email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !form.formState.isValid}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </Form>
  );
}
