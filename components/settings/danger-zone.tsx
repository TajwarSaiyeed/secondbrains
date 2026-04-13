'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { deleteAccount } from '@/actions/settings'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

const Schema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE'),
})

type FormValues = z.infer<typeof Schema>

export function DangerZone() {
  const router = useRouter()
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(Schema),
  })

  async function onSubmit(values: FormValues) {
    const res = await deleteAccount(values.password)
    if ('error' in res && res.error) {
      toast.error(res.error)
    } else {
      toast.success('Account deleted. Redirecting...')
      reset()
      setTimeout(() => router.push('/'), 800)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Confirm with Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          disabled={formState.isSubmitting}
          {...register('password')}
        />
        {formState.errors.password && (
          <p className="text-xs text-red-500">
            {formState.errors.password.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmation">Type DELETE to confirm</Label>
        <Input
          id="confirmation"
          type="text"
          placeholder="DELETE"
          disabled={formState.isSubmitting}
          {...register('confirmation')}
        />
        {formState.errors.confirmation && (
          <p className="text-xs text-red-500">
            {formState.errors.confirmation.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="destructive"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? 'Deleting...' : 'Delete Account'}
      </Button>
    </form>
  )
}
