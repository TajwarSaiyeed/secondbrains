import Link from "next/link";
import { Brain } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "../components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MindMesh</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Reset your password
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              We&apos;ll send you a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
