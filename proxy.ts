import { type NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth-server'

// Protect private routes - redirect unauthenticated users to login
const protectedRoutes = [
  '/dashboard',
  '/notifications',
  '/profile',
  '/settings',
  '/invite',
]

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  if (isProtected) {
    try {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        // Redirect to login with original path for post-login redirect
        const loginUrl = new URL('/login', request.nextUrl.origin)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      // If auth check fails, redirect to login for safety
      const loginUrl = new URL('/login', request.nextUrl.origin)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return undefined
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
