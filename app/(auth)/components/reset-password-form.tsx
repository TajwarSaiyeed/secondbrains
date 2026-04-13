'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { resetSchema, ResetValues } from '@/schema/auth-schema'
import { resetPassword } from '@/actions/auth/password'
import { toast } from 'sonner'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
  })

  const password = form.watch('password')
  const confirmPassword = form.watch('confirmPassword')

  const requirements = [
    { text: 'At least 8 characters', met: (password || '').length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password || '') },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password || '') },
    { text: 'Contains number', met: /\d/.test(password || '') },
  ]

  async function onSubmit(values: ResetValues) {
    setIsLoading(true)
    setError('')

    const result = await resetPassword(token, values.password)

    if (!result?.status) {
      const msg = result?.message || 'Failed to reset password'
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
    } else {
      toast.success('Password reset successful. Please sign in.')
      router.push('/login?message=Password reset successful')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Choose a strong password for your account.
              </FormDescription>
              <FormMessage />

              {password && (
                <div className="mt-2 space-y-1">
                  {requirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      {req.met ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="text-muted-foreground h-3 w-3" />
                      )}
                      <span
                        className={
                          req.met ? 'text-green-600' : 'text-muted-foreground'
                        }
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>Re-enter your new password.</FormDescription>
              <FormMessage />

              {confirmPassword && (
                <div className="mt-1 flex items-center gap-2 text-sm">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-muted-foreground h-3 w-3" />
                      <span className="text-muted-foreground">
                        Passwords do not match
                      </span>
                    </>
                  )}
                </div>
              )}
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
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </Form>
  )
}
