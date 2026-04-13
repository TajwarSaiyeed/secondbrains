import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getUser } from '@/actions/profile'
import { ProfileEditForm } from '../../components/profile/profile-edit-form'
import { ArrowLeft, User } from 'lucide-react'

async function ProfileContent() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login?from=/profile')
  }

  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="text-primary h-6 w-6" />
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <ProfileEditForm
          user={{
            _id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }}
        />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  )
}
