import { Suspense } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "../components/login-form";

interface PageProps {
  searchParams: Promise<{
    invite?: string;
    message?: string;
    callbackUrl?: string;
  }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { invite, message, callbackUrl } = await searchParams;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MindMesh</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            {invite
              ? "Sign in to join the board"
              : "Sign in to your MindMesh account"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {message}
                </p>
              </div>
            )}
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm inviteToken={invite} callbackUrl={callbackUrl} />
            </Suspense>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href={invite ? `/register?invite=${invite}` : "/register"}
                  className="text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
