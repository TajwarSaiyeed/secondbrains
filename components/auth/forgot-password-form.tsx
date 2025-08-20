"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { sendPasswordResetEmail } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError("");

    const result = await sendPasswordResetEmail(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setIsLoading(false);
  }

  if (success) {
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
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Didn&apos;t receive the email? Check your spam folder or</p>
          <Button
            variant="link"
            onClick={() => {
              setSuccess(false);
              setEmail("");
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
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || !email}>
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}
