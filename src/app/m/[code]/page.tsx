import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ChevronRight, Home, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { CATEGORY_ICON } from "@/components/equipment/equipment-card";
import { ExerciseInfoDialog } from "@/components/exercise/exercise-dialog";
import { exercisesForEquipment, getEquipment } from "@/data";
import { getProfile } from "@/lib/queries";
import { planForProfile } from "@/lib/plan";
import {
  categoryLabel,
  difficultyLabel,
  difficultyTone,
  muscleLabel,
} from "@/lib/labels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const item = getEquipment(code);
  return { title: item ? `${item.name} · Scan` : "Machine" };
}

export default async function MachineScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const item = getEquipment(code);
  if (!item) notFound();

  const related = exercisesForEquipment(item);
  const profile = await getProfile();
  const plan = profile ? planForProfile(profile) : null;

  // Is this machine part of any day in the user's plan?
  const planDay = plan?.days.find((d) =>
    d.exercises.some((e) => item.exercises.includes(e.exercise_slug))
  );
  const plannedExercise = planDay?.exercises.find((e) =>
    item.exercises.includes(e.exercise_slug)
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
          <Wordmark />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild aria-label="Home">
              <Link href="/dashboard">
                <Home className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <Badge variant="success" className="mb-3">
          Machine scanned
        </Badge>

        <MediaPlaceholder
          seed={item.slug}
          icon={CATEGORY_ICON[item.category] ?? "Dumbbell"}
          className="aspect-[16/9] w-full rounded-2xl"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={difficultyTone(item.difficulty)}>
            {difficultyLabel(item.difficulty)}
          </Badge>
          <Badge variant="outline">{categoryLabel(item.category)}</Badge>
          <span className="text-sm text-muted-foreground">
            {item.manufacturer}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">{item.name}</h1>
        <p className="mt-2 text-muted-foreground">{item.description}</p>

        {/* Plan integration */}
        {planDay && plannedExercise ? (
          <Card className="mt-5 border-primary/40 bg-primary/5">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge variant="success" className="mb-1">
                  In your plan
                </Badge>
                <p className="font-semibold">
                  {plannedExercise.name} — {plannedExercise.sets} ×{" "}
                  {plannedExercise.reps}
                </p>
                <p className="text-sm text-muted-foreground">
                  Part of your {planDay.name} session.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link href={`/session/${planDay.index}`}>
                  <Play className="size-4 fill-current" /> Start {planDay.name}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-5">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                This machine isn&apos;t in today&apos;s plan, but here&apos;s how
                to use it.
              </p>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/plan">
                  My plan <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Proper usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {item.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Related exercises */}
        {related.length > 0 && (
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Exercises on this machine</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {related.map((ex) => (
                  <li key={ex.slug}>
                    <ExerciseInfoDialog slug={ex.slug}>
                      <button className="flex w-full items-center justify-between gap-2 py-3 text-left hover:text-primary">
                        <span>
                          <span className="font-medium">{ex.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {muscleLabel(ex.muscle_groups[0])}
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </ExerciseInfoDialog>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="mt-5 text-center">
          <Button variant="link" asChild>
            <Link href={`/equipment/${item.slug}`}>
              View full machine details
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
