import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatWeight } from "@/lib/format";
import { paceText, paceTone } from "@/lib/labels";
import type { Journey, UnitSystem } from "@/types";

/** Compact journey status for the Today hub, linking to the full roadmap. */
export function JourneySnippet({
  journey,
  unit,
}: {
  journey: Journey;
  unit: UnitSystem;
}) {
  const { target } = journey;
  const title =
    target.kind === "weight"
      ? `${formatWeight(target.currentKg, unit)} → ${formatWeight(target.targetKg, unit)}`
      : `${target.weeklyTarget}×/week training habit`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Map className="size-4 text-primary" />
            <p className="font-semibold">{title}</p>
            <Badge variant={paceTone(journey.pace.status)}>
              {paceText(journey.pace)}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Progress value={journey.progressPct} className="flex-1" />
            <span className="text-sm font-semibold tabular-nums">
              {journey.progressPct}%
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {journey.successProbability}% likely to hit the goal
            {journey.etaISO
              ? ` · projected ${new Date(`${journey.etaISO}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
              : ""}
          </p>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <Link href="/journey">
            View journey <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
