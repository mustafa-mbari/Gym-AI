import { Footprints, Moon, UtensilsCrossed } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DailyBrief } from "@/types";

/** Today's nutrition, activity and recovery targets, side by side. */
export function DailyTargets({ brief }: { brief: DailyBrief }) {
  const { nutrition, activity, recovery } = brief;
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
      <Card>
        <CardContent className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UtensilsCrossed className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Nutrition</p>
            <p className="text-sm">
              <span className="font-bold">
                {nutrition.calories ? nutrition.calories.toLocaleString() : "—"}
              </span>{" "}
              kcal · <span className="font-bold">{nutrition.protein || "—"}</span> g
              protein · <span className="font-bold">{nutrition.waterL}</span> L water
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{nutrition.note}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Footprints className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Activity</p>
            <p className="text-sm">
              <span className="font-bold">{activity.steps.toLocaleString()}</span>{" "}
              steps
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{activity.note}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Moon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Recovery</p>
            <p className="text-sm">
              <span className="font-bold">{recovery.sleepTargetH}</span> h sleep
              target
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {recovery.notes[0]}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
