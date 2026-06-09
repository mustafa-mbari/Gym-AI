import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Clock, Dumbbell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-container";
import { PlanDayCard } from "@/components/plan/day-card";
import { getProfile, getSessions } from "@/lib/queries";
import { planForProfile } from "@/lib/plan";
import { formatMinutes, formatWeight } from "@/lib/format";

export const metadata: Metadata = { title: "Workouts" };

export default async function WorkoutsPage() {
  const [profile, sessions] = await Promise.all([getProfile(), getSessions()]);

  if (!profile) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Dumbbell className="size-10 text-primary" />
            <p className="text-muted-foreground">
              Build a plan to see your workouts.
            </p>
            <Button asChild>
              <Link href="/onboarding">Build my plan</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const plan = planForProfile(profile);
  const recent = sessions.filter((s) => s.status === "completed").slice(0, 6);
  const unit = profile.unit_system;

  return (
    <PageContainer>
      <PageHeader
        title="Workouts"
        description="Pick today's session and train with guided sets, reps and rest timers."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {plan.days.map((day) => (
          <PlanDayCard
            key={day.index}
            day={day}
            startHref={`/session/${day.index}`}
          />
        ))}
      </div>

      {recent.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-primary" />
                    <div>
                      <p className="font-medium">{s.day_name ?? "Workout"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.started_at).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {s.duration_seconds != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatMinutes(Math.round(s.duration_seconds / 60))}
                      </span>
                    )}
                    {s.total_volume_kg != null && (
                      <Badge variant="secondary">
                        {formatWeight(s.total_volume_kg, unit, {
                          decimals: 0,
                        })}{" "}
                        volume
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
