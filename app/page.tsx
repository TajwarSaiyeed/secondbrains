import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Brain,
  Users,
  FileText,
  Download,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

import Abid from "@/components/assets/abid.png";
import Ahad from "@/components/assets/ahad.jpg";
import Ahammad from "@/components/assets/ahammad.jpg";

const teamMembers = [
  {
    id: 1,
    name: "Tahmidul Alam Ahad",
    designation: "Backend Developer",
    image: Ahad,
  },
  {
    id: 2,
    name: "Tajwar Saiyeed Abid",
    designation: "Full Stack Developer",
    image: Abid,
  },
  {
    id: 3,
    name: "Kazi Ahammad Ullah",
    designation: "Frontend Developer",
    image: Ahammad,
  },
];

export default async function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}

      <BackgroundBeamsWithCollision className="min-h-screen">
        <section className="py-20 px-4 relative z-10">
          <div className="container mx-auto text-center max-w-4xl">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-full">
                <Brain className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="mb-6">
              <TextGenerateEffect
                words="Transform your learning with AI-powered collaborative study and research that adapts to your unique learning style and accelerates your academic success."
                className="text-5xl font-bold text-foreground"
              />
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience intelligent study boards, seamless collaboration, and
              AI-driven insights that help you understand complex topics faster
              than ever before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/register">Start Learning Today</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 py-6 bg-background/50 dark:bg-background/80 border-border hover:bg-accent"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Team Section with Animated Tooltips */}
            <div className="mt-16">
              <p className="text-sm text-muted-foreground mb-4">
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
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need for effective studying
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to enhance collaboration and accelerate
              learning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-primary" />
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
                <div className="p-2 bg-secondary/10 rounded-lg w-fit">
                  <Sparkles className="h-6 w-6 text-secondary" />
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
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <FileText className="h-6 w-6 text-primary" />
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
                <div className="p-2 bg-secondary/10 rounded-lg w-fit">
                  <MessageSquare className="h-6 w-6 text-secondary" />
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
                <div className="p-2 bg-primary/10 rounded-lg w-fit">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center gap-3">
                  <CardTitle>PDF Export</CardTitle>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted/20 text-muted-foreground">
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
                <div className="p-2 bg-secondary/10 rounded-lg w-fit">
                  <Brain className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex items-center gap-3">
                  <CardTitle>Smart Insights</CardTitle>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted/20 text-muted-foreground">
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
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to revolutionize your learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students and researchers who are already using
            SecondBrains to study smarter, not harder.
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">
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
  );
}
