import Link from "next/link";
import { Brain } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Main Illustration Area */}
        <div className="relative">
          <div className="w-64 h-64 mx-auto mb-8 relative">
            {/* Library/Study Scene Illustration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
              <div className="relative">
                {/* Books Stack */}
                <div className="absolute -left-8 -top-4">
                  <div className="w-12 h-16 bg-primary/20 rounded-sm transform -rotate-12"></div>
                  <div className="w-12 h-16 bg-secondary/20 rounded-sm transform rotate-6 -mt-14 ml-2"></div>
                  <div className="w-12 h-16 bg-primary/30 rounded-sm transform -rotate-3 -mt-14 ml-1"></div>
                </div>

                {/* Central Search Icon */}
                <div className="w-24 h-24 bg-card rounded-full border-2 border-border flex items-center justify-center shadow-lg">
                  <Brain className="h-12 w-12 text-primary" />
                </div>

                {/* Floating Notes */}
                <div className="absolute -right-6 -top-2">
                  <div className="w-8 h-10 bg-secondary/20 rounded-sm transform rotate-12"></div>
                  <div className="w-8 h-10 bg-primary/20 rounded-sm transform -rotate-6 -mt-8 ml-3"></div>
                </div>

                {/* Question Marks */}
                <div className="absolute -top-8 left-12 text-2xl text-muted-foreground animate-bounce">
                  ?
                </div>
                <div
                  className="absolute -bottom-6 -right-4 text-xl text-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                >
                  ?
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold text-foreground">
            Lost in the Library?
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Oops! Looks like this page isn&apos;t in your notes. The content
            you&apos;re looking for seems to have wandered off to another study
            session.
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Still can&apos;t find what you&apos;re looking for?</p>
          <p className="mt-1">
            Try checking your{" "}
            <Link
              href="/dashboard"
              className="text-primary hover:underline font-medium"
            >
              recent boards
            </Link>{" "}
            or start a new study session.
          </p>
        </div>
      </div>
    </div>
  );
}
