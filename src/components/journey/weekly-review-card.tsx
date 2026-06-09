import { CalendarCheck2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WEEKLY_DECISION_LABEL } from "@/lib/labels";
import { formatWeight } from "@/lib/format";
import type { UnitSystem, WeeklyReview } from "@/types";

const decisionTone = (
  d: WeeklyReview["decision"]
): "success" | "warning" | "secondary" =>
  d === "increase_load" ? "success" : d === "keep" ? "secondary" : "warning";

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** One completed week: what happened, what was decided, what went right. */
export function WeeklyReviewCard({
  review,
  unit,
  highlight = false,
}: {
  review: WeeklyReview;
  unit: UnitSystem;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/30" : undefined}>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck2 className="size-4 text-primary" />
          Week of {shortDate(review.weekStart)}–{shortDate(review.weekEnd)}
        </CardTitle>
        <Badge variant={decisionTone(review.decision)}>
          {WEEKLY_DECISION_LABEL[review.decision]}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">
              {review.sessionsCompleted}/{review.sessionsPlanned}
            </span>{" "}
            sessions
          </span>
          {review.weightChangeKg != null && (
            <span>
              <span className="font-semibold text-foreground">
                {review.weightChangeKg > 0 ? "+" : ""}
                {formatWeight(review.weightChangeKg, unit)}
              </span>{" "}
              this week
            </span>
          )}
          <span>
            <span className="font-semibold text-foreground">
              {review.checkinDays}/7
            </span>{" "}
            check-ins
          </span>
          {review.avgEnergy != null && (
            <span>
              energy{" "}
              <span className="font-semibold text-foreground">
                {review.avgEnergy}/10
              </span>
            </span>
          )}
        </div>

        <ul className="grid gap-1.5">
          {review.wins.map((w, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{w}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
            Next week
          </p>
          {review.reasons.map((r, i) => (
            <p key={i}>{r}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
