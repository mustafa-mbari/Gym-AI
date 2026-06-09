import { CheckCircle2, Circle, Flag } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types";

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Vertical roadmap of journey milestones with achieved/projected dates. */
export function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="relative ml-2.5 grid gap-0 border-l-2 border-border">
      {milestones.map((m, i) => {
        const isGoal = i === milestones.length - 1;
        return (
          <li key={m.id} className="relative pb-6 pl-6 last:pb-0">
            <span
              className={cn(
                "absolute -left-[11px] top-0.5 flex size-5 items-center justify-center rounded-full bg-background",
                m.achieved ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {m.achieved ? (
                <CheckCircle2 className="size-5" />
              ) : isGoal ? (
                <Flag className="size-5" />
              ) : (
                <Circle className="size-5" />
              )}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p
                className={cn(
                  "font-medium",
                  m.achieved && "text-muted-foreground line-through decoration-primary/40"
                )}
              >
                {m.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {m.achieved && m.achievedDate
                  ? `Reached ${shortDate(m.achievedDate)}`
                  : m.achieved
                    ? "Reached"
                    : m.projectedDate
                      ? `Projected ${shortDate(m.projectedDate)}`
                      : "Projection needs more data"}
              </p>
            </div>
            {!m.achieved && (
              <div className="mt-2 flex items-center gap-2">
                <Progress value={m.progressPct} className="h-1.5 flex-1" />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {m.progressPct}%
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
