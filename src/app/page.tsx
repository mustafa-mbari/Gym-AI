import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  LineChart,
  QrCode,
  ScanLine,
  Sparkles,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wordmark } from "@/components/brand";
import { Icon } from "@/components/icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { GOALS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { chooseSplit } from "@/lib/plan/templates";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Instant personalised plans",
    body: "Answer a few questions and get a science-based split tuned to your goal, experience and schedule — in seconds.",
  },
  {
    icon: Dumbbell,
    title: "Equipment-aware",
    body: "Full gym, home setup or just bodyweight — every exercise is chosen from what you actually have.",
  },
  {
    icon: Timer,
    title: "Guided session mode",
    body: "Run each workout with sets, reps, rest timers and machine instructions, one exercise at a time.",
  },
  {
    icon: QrCode,
    title: "Scan any machine",
    body: "Point your camera at a gym machine's QR code to see how to use it and start the right exercise.",
  },
  {
    icon: LineChart,
    title: "Track real progress",
    body: "Log weight, body-fat, measurements and strength, and watch the trends move week over week.",
  },
  {
    icon: CalendarDays,
    title: "Your training calendar",
    body: "See the week ahead, reschedule sessions and never lose your streak.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Tell us about you",
    body: "Goals, experience, equipment, lifestyle and any injuries — a 5-minute onboarding.",
  },
  {
    n: "02",
    title: "Get your plan",
    body: "JYM assembles a personalised weekly split with the right volume, intensity and exercises.",
  },
  {
    n: "03",
    title: "Train & improve",
    body: "Follow guided sessions, scan machines, log your lifts and track measurable progress.",
  },
];

export default function LandingPage() {
  const previewDays = chooseSplit(4, "intermediate", "hypertrophy");

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Wordmark />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#goals" className="transition-colors hover:text-foreground">
              Goals
            </a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)",
            }}
          />
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
            <div className="flex flex-col items-start gap-6">
              <Badge variant="success" className="gap-1.5 px-3 py-1">
                <Sparkles className="size-3.5" />
                Your AI gym & weight-loss coach
              </Badge>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Train smarter.
                <br />
                <span className="text-primary">Lose weight.</span> Build muscle.
              </h1>
              <p className="max-w-prose text-pretty text-lg text-muted-foreground">
                JYM is your personal trainer and planner in one. Get a workout
                plan built around your goals, your equipment and your body — then
                get coached through every rep.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="xl" asChild>
                  <Link href="/onboarding">
                    Build my plan <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="#how">See how it works</Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Timer className="size-4 text-primary" /> 5-min setup
                </span>
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="size-4 text-primary" /> 70+ exercises
                </span>
                <span className="flex items-center gap-1.5">
                  <ScanLine className="size-4 text-primary" /> QR machine scanner
                </span>
              </div>
            </div>

            {/* Sample plan preview */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl"
              />
              <Card className="overflow-hidden shadow-xl">
                <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Your plan</p>
                    <p className="font-semibold">4-Day Upper / Lower</p>
                  </div>
                  <Badge variant="success">Hypertrophy</Badge>
                </div>
                <CardContent className="grid grid-cols-2 gap-3 p-5">
                  {previewDays.map((day) => (
                    <div
                      key={day.name}
                      className="rounded-xl border bg-card p-4"
                    >
                      <p className="font-semibold">{day.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {day.focus}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Dumbbell className="size-3.5" />
                        {day.slots.length} exercises
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/30 py-16 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to get in shape
              </h2>
              <p className="mt-3 text-muted-foreground">
                A complete coaching experience — from your first plan to your
                hundredth workout.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-16 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From zero to training in minutes
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="relative rounded-2xl border p-6">
                  <span className="font-mono text-4xl font-bold text-primary/30">
                    {s.n}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Goals */}
        <section id="goals" className="border-t bg-muted/30 py-16 lg:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for your goal
            </h2>
            <p className="mt-3 text-muted-foreground">
              Whatever you&apos;re training for, JYM adapts the volume, intensity
              and exercise selection to match.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {GOALS.map((g) => (
                <span
                  key={g.value}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm"
                >
                  <Icon name={g.icon} className="size-4 text-primary" />
                  {g.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
                  backgroundSize: "22px 22px",
                }}
              />
              <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
                Your first plan is ready in 5 minutes
              </h2>
              <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/90">
                No credit card. No equipment required. Just tell JYM your goal
                and start training today.
              </p>
              <div className="relative mt-8">
                <Button size="xl" variant="secondary" asChild>
                  <Link href="/onboarding">
                    Build my free plan <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Wordmark />
          <p className="text-sm text-muted-foreground">
            Built with Next.js &amp; Supabase · {new Date().getFullYear()} JYM.
          </p>
          {!isSupabaseConfigured && (
            <Badge variant="warning" className="gap-1.5">
              Demo mode — connect Supabase to save accounts
            </Badge>
          )}
        </div>
      </footer>
    </div>
  );
}
