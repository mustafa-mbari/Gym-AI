import { AlertTriangle, CalendarRange, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyReview } from "@/types";

function monthLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** One completed month vs the roadmap: expected, actual, risks. */
export function MonthlyReviewCard({ review }: { review: MonthlyReview }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="size-4 text-primary" />
          {monthLabel(review.monthStart)}
        </CardTitle>
        {review.variancePct != null && (
          <Badge variant={review.variancePct >= 75 ? "success" : "warning"}>
            {Math.max(0, review.variancePct)}% of planned progress
          </Badge>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        <ul className="grid gap-1.5 text-sm">
          {review.summary.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-muted-foreground">{s}</span>
            </li>
          ))}
        </ul>

        {review.milestonesHit.length > 0 && (
          <p className="flex items-start gap-2 text-sm">
            <Trophy className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium">Milestones: </span>
              {review.milestonesHit.join(", ")}
            </span>
          </p>
        )}

        {review.risks.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-500">
              <AlertTriangle className="size-3.5" /> Watch-outs
            </p>
            <ul className="grid gap-1 text-sm text-muted-foreground">
              {review.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
