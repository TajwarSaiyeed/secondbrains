import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import { getToken } from '@/lib/auth-server'
import { cn } from '@/lib/utils'
import AuthProvider from '@/providers/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import Navbar from '@/components/navbar'
import { TooltipProvider } from '@/components/ui/tooltip'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SecondBrains - AI-Powered Collaborative Study Platform',
  description:
    'Collaborate on study boards, share notes, and get AI-powered insights for better learning',
  icons: {
    icon: '/logo.jpg',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const token = await getToken()
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn('antialiased', geistMono.variable, geistSans.variable)}
      >
        <AuthProvider>
          <ConvexClientProvider initialToken={token}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <Navbar />
                <div className="flex min-h-screen flex-col">
                  <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                  </main>
                </div>

                <Toaster richColors closeButton position="top-right" />
              </TooltipProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
