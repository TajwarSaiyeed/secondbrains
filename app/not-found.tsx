import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        {/* Main Illustration Area */}
        <div className="relative">
          <div className="relative mx-auto mb-8 h-64 w-64">
            {/* Library/Study Scene Illustration */}
            <div className="from-primary/10 to-secondary/10 absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br">
              <div className="relative">
                {/* Books Stack */}
                <div className="absolute -top-4 -left-8">
                  <div className="bg-primary/20 h-16 w-12 -rotate-12 transform rounded-sm"></div>
                  <div className="bg-secondary/20 -mt-14 ml-2 h-16 w-12 rotate-6 transform rounded-sm"></div>
                  <div className="bg-primary/30 -mt-14 ml-1 h-16 w-12 -rotate-3 transform rounded-sm"></div>
                </div>

                {/* Central Search Icon */}
                <div className="bg-card border-border flex h-24 w-24 items-center justify-center rounded-full border-2 shadow-lg">
                  <Brain className="text-primary h-12 w-12" />
                </div>

                {/* Floating Notes */}
                <div className="absolute -top-2 -right-6">
                  <div className="bg-secondary/20 h-10 w-8 rotate-12 transform rounded-sm"></div>
                  <div className="bg-primary/20 -mt-8 ml-3 h-10 w-8 -rotate-6 transform rounded-sm"></div>
                </div>

                {/* Question Marks */}
                <div className="text-muted-foreground absolute -top-8 left-12 animate-bounce text-2xl">
                  ?
                </div>
                <div
                  className="text-muted-foreground absolute -right-4 -bottom-6 animate-bounce text-xl"
                  style={{ animationDelay: '0.5s' }}
                >
                  ?
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-primary text-6xl font-bold">404</h1>
          <h2 className="text-foreground text-3xl font-semibold">
            Lost in the Library?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md text-lg">
            Oops! Looks like this page isn&apos;t in your notes. The content
            you&apos;re looking for seems to have wandered off to another study
            session.
          </p>
        </div>

        <div className="text-muted-foreground text-sm">
          <p>Still can&apos;t find what you&apos;re looking for?</p>
          <p className="mt-1">
            Try checking your{' '}
            <Link
              href="/dashboard"
              className="text-primary font-medium hover:underline"
            >
              recent boards
            </Link>{' '}
            or start a new study session.
          </p>
        </div>
      </div>
    </div>
  )
}
