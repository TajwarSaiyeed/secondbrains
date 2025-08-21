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
import { RegisterForm } from "../components/register-form";

interface PageProps {
  searchParams: Promise<{
    invite?: string;
  }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const { invite } = await searchParams;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MindMesh</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Create your account
          </h1>
          <p className="text-muted-foreground mt-2">
            {invite
              ? "Create an account to join the board"
              : "Join the future of collaborative learning"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Enter your information to create your MindMesh account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <RegisterForm inviteToken={invite} />
            </Suspense>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={invite ? `/login?invite=${invite}` : "/login"}
                  className="text-primary hover:underline"
                >
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
