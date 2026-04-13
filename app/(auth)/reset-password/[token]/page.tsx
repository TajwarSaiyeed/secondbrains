import Link from 'next/link'
import { Brain } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ResetPasswordForm } from '../../components/reset-password-form'

interface PageProps {
  params: Promise<{
    token: string
  }>
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { token } = await params

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <Brain className="text-primary h-8 w-8" />
            <span className="text-foreground text-2xl font-bold">
              SecondBrains
            </span>
          </Link>
          <h1 className="text-foreground text-2xl font-bold">
            Set new password
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm token={token} />

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Remember your password?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
