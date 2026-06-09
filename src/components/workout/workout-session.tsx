"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  History,
  Info,
  Loader2,
  Plus,
  SkipForward,
  Timer,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { ExerciseInfoDialog } from "@/components/exercise/exercise-dialog";
import { completeSession, type LoggedSet } from "@/lib/session-actions";
import { kgToLb, lbToKg } from "@/lib/fitness";
import { formatDuration, weightUnit } from "@/lib/format";
import { muscleLabel } from "@/lib/labels";
import type { UnitSystem, WorkoutDay } from "@/types";
import { cn } from "@/lib/utils";

interface SetEntry {
  weight: string;
  reps: string;
  done: boolean;
}

export function WorkoutSession({
  day,
  unit,
  lastSets = {},
}: {
  day: WorkoutDay;
  unit: UnitSystem;
  lastSets?: Record<string, { weight_kg: number | null; reps: number | null }>;
}) {
  const router = useRouter();

  const toDisplayWeight = (kg: number) =>
    String(Math.round(unit === "imperial" ? kgToLb(kg) : kg));

  const [elapsed, setElapsed] = React.useState(0);
  const [current, setCurrent] = React.useState(0);
  const [sets, setSets] = React.useState<SetEntry[][]>(() =>
    day.exercises.map((ex) => {
      const last = lastSets[ex.exercise_slug];
      const weight = last?.weight_kg != null ? toDisplayWeight(last.weight_kg) : "";
      const reps = String(last?.reps ?? ex.rep_high);
      return Array.from({ length: ex.sets }, () => ({
        weight,
        reps,
        done: false,
      }));
    })
  );
  const [rest, setRest] = React.useState<{ active: boolean; left: number }>({
    active: false,
    left: 0,
  });
  const [finishing, setFinishing] = React.useState(false);
  const [confirmFinish, setConfirmFinish] = React.useState(false);

  // Session timer
  React.useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Rest countdown — a self-stopping interval (decrements inside the callback)
  React.useEffect(() => {
    if (!rest.active) return;
    const id = setInterval(() => {
      setRest((r) =>
        r.left <= 1 ? { active: false, left: 0 } : { ...r, left: r.left - 1 }
      );
    }, 1000);
    return () => clearInterval(id);
  }, [rest.active]);

  const exercise = day.exercises[current];
  const totalSets = sets.reduce((n, s) => n + s.length, 0);
  const doneSets = sets.reduce((n, s) => n + s.filter((x) => x.done).length, 0);
  const progress = totalSets ? (doneSets / totalSets) * 100 : 0;

  function updateSet( exIdx: number, setIdx: number, patch: Partial<SetEntry>) {
    setSets((prev) => {
      const next = prev.map((arr) => arr.slice());
      next[exIdx][setIdx] = { ...next[exIdx][setIdx], ...patch };
      return next;
    });
  }

  function toggleDone(setIdx: number) {
    const entry = sets[current][setIdx];
    const nowDone = !entry.done;
    updateSet(current, setIdx, { done: nowDone });
    if (nowDone && exercise.rest_seconds > 0) {
      setRest({ active: true, left: exercise.rest_seconds });
    }
  }

  function totalVolumeKg(): number {
    let kg = 0;
    sets.forEach((arr) => {
      arr.forEach((s) => {
        if (!s.done) return;
        const w = parseFloat(s.weight) || 0;
        const reps = parseInt(s.reps) || 0;
        kg += (unit === "imperial" ? lbToKg(w) : w) * reps;
      });
    });
    return Math.round(kg);
  }

  function collectLogs(): LoggedSet[] {
    const logs: LoggedSet[] = [];
    day.exercises.forEach((ex, ei) => {
      sets[ei].forEach((s, si) => {
        if (!s.done) return;
        const w = parseFloat(s.weight);
        const reps = parseInt(s.reps);
        logs.push({
          exercise_slug: ex.exercise_slug,
          set_number: si + 1,
          reps: Number.isNaN(reps) ? null : reps,
          weight_kg: Number.isNaN(w)
            ? null
            : +(unit === "imperial" ? lbToKg(w) : w).toFixed(1),
        });
      });
    });
    return logs;
  }

  async function finish() {
    setFinishing(true);
    const res = await completeSession({
      day_index: day.index,
      day_name: day.name,
      duration_seconds: elapsed,
      total_volume_kg: totalVolumeKg(),
      logs: collectLogs(),
    });
    if (res.ok) {
      toast.success("Workout complete — nice work! 💪");
      router.push("/workouts");
    } else {
      setFinishing(false);
      toast.error(res.error ?? "Could not save your session.");
    }
  }

  const allCurrentDone = sets[current].every((s) => s.done);

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/workouts")}
            aria-label="Exit workout"
          >
            <X className="size-5" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold leading-none">{day.name}</p>
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Timer className="size-3" />
              {formatDuration(elapsed)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmFinish(true)}
          >
            <Flag className="size-4" /> Finish
          </Button>
        </div>
        <div className="mx-auto w-full max-w-2xl px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Exercise {current + 1} / {day.exercises.length}
            </span>
            <span>
              {doneSets} / {totalSets} sets
            </span>
          </div>
          <Progress value={progress} className="mt-1 h-1.5" />
        </div>
      </header>

      {/* Rest timer */}
      {rest.active && (
        <div className="sticky top-[88px] z-20 mx-auto w-full max-w-2xl px-4 py-2">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg">
            <div className="flex items-center gap-2">
              <Timer className="size-5" />
              <span className="font-semibold">Rest</span>
              <span className="font-mono text-xl tabular-nums">
                {formatDuration(rest.left)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRest((r) => ({ ...r, left: r.left + 15 }))}
              >
                <Plus className="size-4" /> 15s
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRest({ active: false, left: 0 })}
              >
                <SkipForward className="size-4" /> Skip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{exercise.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Target: {exercise.sets} sets × {exercise.reps} reps ·{" "}
                  {exercise.rest_seconds}s rest
                </p>
                {lastSets[exercise.exercise_slug]?.weight_kg != null && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <History className="size-3.5" />
                    Last time:{" "}
                    {toDisplayWeight(
                      lastSets[exercise.exercise_slug]!.weight_kg as number
                    )}{" "}
                    {weightUnit(unit)}
                    {lastSets[exercise.exercise_slug]?.reps != null
                      ? ` × ${lastSets[exercise.exercise_slug]!.reps}`
                      : ""}
                  </p>
                )}
              </div>
              <ExerciseInfoDialog
                slug={exercise.exercise_slug}
                className={buttonVariants({ variant: "outline", size: "icon" })}
                aria-label="Exercise info"
              >
                <Info className="size-4" />
              </ExerciseInfoDialog>
            </div>

            <MediaPlaceholder
              seed={exercise.exercise_slug}
              icon="Dumbbell"
              className="aspect-[16/9] w-full rounded-xl"
            />

            <div className="flex flex-wrap gap-1.5">
              {exercise.muscle_groups.slice(0, 4).map((g) => (
                <Badge key={g} variant="secondary">
                  {muscleLabel(g)}
                </Badge>
              ))}
            </div>

            {/* Sets */}
            <div className="overflow-hidden rounded-xl border">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="w-8">Set</span>
                <span>Weight ({weightUnit(unit)})</span>
                <span>Reps</span>
                <span className="w-12 text-center">Done</span>
              </div>
              {sets[current].map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 px-3 py-2 transition-colors",
                    s.done && "bg-primary/5"
                  )}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {i + 1}
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="–"
                    value={s.weight}
                    onChange={(e) =>
                      updateSet(current, i, { weight: e.target.value })
                    }
                    className="h-10"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) =>
                      updateSet(current, i, { reps: e.target.value })
                    }
                    className="h-10"
                  />
                  <Button
                    size="icon"
                    variant={s.done ? "default" : "outline"}
                    className="size-10"
                    onClick={() => toggleDone(i)}
                    aria-label={s.done ? "Mark not done" : "Mark done"}
                  >
                    <Check className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer nav */}
      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur pb-safe">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          {current < day.exercises.length - 1 ? (
            <Button
              onClick={() => {
                setCurrent((c) => c + 1);
                setRest({ active: false, left: 0 });
                window.scrollTo({ top: 0 });
              }}
              className={cn(allCurrentDone && "animate-pulse")}
            >
              Next exercise <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={() => setConfirmFinish(true)}>
              <Flag className="size-4" /> Finish workout
            </Button>
          )}
        </div>
      </footer>

      {/* Finish confirmation */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish this workout?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-lg font-bold">{formatDuration(elapsed)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Sets</p>
              <p className="text-lg font-bold">
                {doneSets}/{totalSets}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-lg font-bold">
                {Math.round(
                  unit === "imperial" ? kgToLb(totalVolumeKg()) : totalVolumeKg()
                )}
                <span className="text-xs font-normal"> {weightUnit(unit)}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmFinish(false)}
              disabled={finishing}
            >
              Keep training
            </Button>
            <Button onClick={finish} disabled={finishing}>
              {finishing && <Loader2 className="size-4 animate-spin" />}
              Save & finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
