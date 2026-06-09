"use client";

import { Repeat, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { getExercise } from "@/data";
import {
  difficultyLabel,
  difficultyTone,
  equipmentTypeLabel,
  muscleLabel,
} from "@/lib/labels";

const iconFor = (category: string) =>
  category === "cardio"
    ? "HeartPulse"
    : category === "core"
      ? "Hexagon"
      : "Dumbbell";

export function ExerciseInfoDialog({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const ex = getExercise(slug);
  if (!ex) return <>{children}</>;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[88vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>{ex.name}</DialogTitle>
          <DialogDescription>{ex.description}</DialogDescription>
        </DialogHeader>

        <MediaPlaceholder
          seed={ex.slug}
          icon={iconFor(ex.category)}
          className="aspect-video w-full rounded-xl"
        />

        <div className="flex flex-wrap gap-1.5">
          <Badge variant={difficultyTone(ex.difficulty)}>
            {difficultyLabel(ex.difficulty)}
          </Badge>
          {ex.muscle_groups.map((g) => (
            <Badge key={g} variant="secondary">
              {muscleLabel(g)}
            </Badge>
          ))}
          {ex.equipment.map((e) => (
            <Badge key={e} variant="outline">
              {equipmentTypeLabel(e)}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <Repeat className="size-4 text-primary" />
            <span>
              {ex.default_sets} sets · {ex.rep_range[0]}–{ex.rep_range[1]} reps
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <Timer className="size-4 text-primary" />
            <span>{ex.rest_seconds}s rest</span>
          </div>
        </div>

        <section>
          <h4 className="mb-2 text-sm font-semibold">How to perform</h4>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {ex.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>

        {ex.tips.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold">Coaching tips</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {ex.tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
