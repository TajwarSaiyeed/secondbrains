'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Save } from 'lucide-react'
import { updateProfile } from '@/actions/profile'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

interface ProfileEditFormProps {
  user: {
    _id: string
    name: string
    email: string
    createdAt: string
    updatedAt: string
  }
}

const Schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email'),
})

type FormValues = z.infer<typeof Schema>

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: user.name, email: user.email },
  })

  async function onSubmit(values: FormValues) {
    const result = await updateProfile(values)
    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profile updated successfully')
      reset(values)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your account details and personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-muted-foreground text-xs">
                Avatar is generated from your initials
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10"
                  disabled={formState.isSubmitting}
                  {...register('name')}
                />
              </div>
              {formState.errors.name && (
                <p className="text-xs text-red-500">
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  disabled={formState.isSubmitting}
                  {...register('email')}
                />
              </div>
              {formState.errors.email && (
                <p className="text-xs text-red-500">
                  {formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Created</Label>
              <Input
                value={new Date(user.createdAt).toLocaleDateString()}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <Input
                value={new Date(user.updatedAt).toLocaleDateString()}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
