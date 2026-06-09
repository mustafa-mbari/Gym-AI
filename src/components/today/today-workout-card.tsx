import Link from "next/link";
import { ArrowRight, BedDouble, CheckCircle2, Gauge, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DailyWorkout } from "@/types";

/** The hub's centrepiece: exactly what today's session (or rest) looks like. */
export function TodayWorkoutCard({ workout }: { workout: DailyWorkout }) {
  if (workout.kind === "done") {
    return (
      <Card className="overflow-hidden border-primary/30 bg-linear-to-br from-primary/5 to-transparent">
        <CardContent className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Today&apos;s workout</p>
            <h3 className="text-lg font-bold">{workout.completedName} — done ✅</h3>
            <p className="text-sm text-muted-foreground">
              Banked. Now win the recovery: protein, water and a proper night&apos;s
              sleep.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (workout.kind === "rest") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <BedDouble className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Today&apos;s workout</p>
              <h3 className="text-lg font-bold">Rest day</h3>
              <p className="text-sm text-muted-foreground">{workout.suggestion}</p>
            </div>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/calendar">
              View calendar <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/30 bg-linear-to-br from-primary/5 to-transparent">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Play className="size-5 fill-current" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Today&apos;s workout</p>
            <h3 className="text-lg font-bold">{workout.name}</h3>
            <p className="text-sm text-muted-foreground">
              {workout.focus} · ~{workout.estimatedMinutes} min
            </p>
            {workout.intensityNote && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-600 dark:text-amber-500">
                <Gauge className="mt-0.5 size-4 shrink-0" />
                {workout.intensityNote}
              </p>
            )}
          </div>
        </div>
        <Button size="lg" asChild className="shrink-0">
          <Link href={`/session/${workout.dayIndex}`}>
            Start workout <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
