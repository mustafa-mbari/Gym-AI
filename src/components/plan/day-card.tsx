import Link from "next/link";
import { ChevronRight, HeartPulse, Play, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExerciseInfoDialog } from "@/components/exercise/exercise-dialog";
import type { PlannedExercise, WorkoutDay } from "@/types";
import { muscleLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function ExerciseList({
  exercises,
  className,
}: {
  exercises: PlannedExercise[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-y", className)}>
      {exercises.map((ex, i) => (
        <li key={`${ex.exercise_slug}-${i}`}>
          <ExerciseInfoDialog
            slug={ex.exercise_slug}
            className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-accent/40"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{ex.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {muscleLabel(ex.muscle_groups[0])}
                {ex.tempo ? ` · tempo ${ex.tempo}` : ""}
                {ex.notes ? ` · ${ex.notes}` : ""}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold tabular-nums">
                {ex.sets} × {ex.reps}
              </span>
              <span className="block text-xs text-muted-foreground">
                {ex.rest_seconds}s rest
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </ExerciseInfoDialog>
        </li>
      ))}
    </ul>
  );
}

export function PlanDayCard({
  day,
  startHref,
}: {
  day: WorkoutDay;
  startHref?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 border-b pb-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
            {day.index + 1}
          </span>
          <div>
            <h3 className="font-bold leading-tight">{day.name}</h3>
            <p className="text-sm text-muted-foreground">{day.focus}</p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Timer className="size-3" />~{day.estimated_minutes}m
        </Badge>
      </CardHeader>
      <CardContent>
        <ExerciseList exercises={day.exercises} />
        {day.cardio && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
            <HeartPulse className="size-4 text-primary" />
            <span className="font-medium">Finisher:</span>
            <span className="text-muted-foreground">{day.cardio}</span>
          </div>
        )}
        {startHref && (
          <Button asChild className="mt-4 w-full" size="lg">
            <Link href={startHref}>
              <Play className="size-4 fill-current" /> Start {day.name}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
