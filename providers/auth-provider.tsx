'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { authClient } from '@/lib/auth-client'

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || 'https://example.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  )
}
