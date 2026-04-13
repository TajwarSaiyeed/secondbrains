import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Brain,
  Users,
  FileText,
  Download,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'

import Abid from '@/components/assets/abid.png'
import Ahad from '@/components/assets/ahad.jpg'
import Ahammad from '@/components/assets/ahammad.jpg'

const teamMembers = [
  {
    id: 1,
    name: 'Tahmidul Alam Ahad',
    designation: 'Backend Developer',
    image: Ahad,
  },
  {
    id: 2,
    name: 'Tajwar Saiyeed Abid',
    designation: 'Full Stack Developer',
    image: Abid,
  },
  {
    id: 3,
    name: 'Kazi Ahammad Ullah',
    designation: 'Frontend Developer',
    image: Ahammad,
  },
]

export default async function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}

      <BackgroundBeamsWithCollision className="min-h-screen">
        <section className="relative z-10 px-4 py-20">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-3">
                <Brain className="text-primary h-12 w-12" />
              </div>
            </div>
            <div className="mb-6">
              <TextGenerateEffect
                words="Transform your learning with AI-powered collaborative study and research that adapts to your unique learning style and accelerates your academic success."
                className="text-foreground text-5xl font-bold"
              />
            </div>
            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
              Experience intelligent study boards, seamless collaboration, and
              AI-driven insights that help you understand complex topics faster
              than ever before.
            </p>
            <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="px-8 py-6 text-lg">
                <Link href="/register">Start Learning Today</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-background/50 dark:bg-background/80 border-border hover:bg-accent px-8 py-6 text-lg"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Team Section with Animated Tooltips */}
            <div className="mt-16">
              <p className="text-muted-foreground mb-4 text-sm">
                Trusted by researchers worldwide
              </p>
              <div className="flex justify-center">
                <AnimatedTooltip items={teamMembers} />
              </div>
            </div>
          </div>
        </section>
      </BackgroundBeamsWithCollision>

      {/* Features Section */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold">
              Everything you need for effective studying
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Powerful features designed to enhance collaboration and accelerate
              learning
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border">
              <CardHeader>
                <div className="bg-primary/10 w-fit rounded-lg p-2">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Real-time Collaboration</CardTitle>
                <CardDescription>
                  Work together on study boards with live editing, comments, and
                  instant updates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="bg-secondary/10 w-fit rounded-lg p-2">
                  <Sparkles className="text-secondary h-6 w-6" />
                </div>
                <CardTitle>AI Summarization</CardTitle>
                <CardDescription>
                  Get intelligent summaries of your notes and research materials
                  powered by advanced AI
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="bg-primary/10 w-fit rounded-lg p-2">
                  <FileText className="text-primary h-6 w-6" />
                </div>
                <CardTitle>File Management</CardTitle>
                <CardDescription>
                  Upload, organize, and preview documents, images, and research
                  materials in one place
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="bg-secondary/10 w-fit rounded-lg p-2">
                  <MessageSquare className="text-secondary h-6 w-6" />
                </div>
                <CardTitle>Discussion Forums</CardTitle>
                <CardDescription>
                  Engage in focused discussions with AI-powered Q&A to deepen
                  understanding
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="bg-primary/10 w-fit rounded-lg p-2">
                  <Download className="text-primary h-6 w-6" />
                </div>
                <div className="flex items-center gap-3">
                  <CardTitle>PDF Export</CardTitle>
                  <span className="bg-muted/20 text-muted-foreground rounded-full px-2 py-1 text-xs font-medium">
                    Upcoming
                  </span>
                </div>
                <CardDescription>
                  Export your study materials and summaries as beautifully
                  formatted PDFs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="bg-secondary/10 w-fit rounded-lg p-2">
                  <Brain className="text-secondary h-6 w-6" />
                </div>
                <div className="flex items-center gap-3">
                  <CardTitle>Smart Insights</CardTitle>
                  <span className="bg-muted/20 text-muted-foreground rounded-full px-2 py-1 text-xs font-medium">
                    Upcoming
                  </span>
                </div>
                <CardDescription>
                  Discover connections between topics and get personalized study
                  recommendations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-foreground mb-6 text-3xl font-bold">
            Ready to revolutionize your learning?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of students and researchers who are already using
            SecondBrains to study smarter, not harder.
          </p>
          <Button size="lg" asChild className="px-8 py-6 text-lg">
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border border-t px-4 py-8">
        <div className="container mx-auto text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Brain className="text-primary h-6 w-6" />
            <span className="text-foreground text-lg font-semibold">
              SecondBrains
            </span>
          </div>
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} SecondBrains. Empowering collaborative
            learning with AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
