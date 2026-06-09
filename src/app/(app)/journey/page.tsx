import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  Award,
  CalendarCheck2,
  Flag,
  Flame,
  Map,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageContainer, PageHeader } from "@/components/page-container";
import { DemoBanner } from "@/components/demo-banner";
import { MilestoneList } from "@/components/journey/milestone-list";
import { MonthlyReviewCard } from "@/components/journey/monthly-review-card";
import { ProbabilityDial } from "@/components/journey/probability-dial";
import { WeeklyReviewCard } from "@/components/journey/weekly-review-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCompanionData } from "@/lib/queries";
import { buildJourney } from "@/lib/journey";
import { computeConsistency } from "@/lib/journey/habits";
import {
  monthlyReview,
  recentWeekStarts,
  weeklyReview,
} from "@/lib/journey/reviews";
import { addDaysISO, isoMonthStart } from "@/lib/dates";
import { formatWeight } from "@/lib/format";
import { goalLabel, paceText, paceTone } from "@/lib/labels";

export const metadata: Metadata = { title: "Journey" };

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function JourneyPage() {
  const data = await getCompanionData();

  if (!data) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Map className="size-10 text-primary" />
            <h2 className="text-xl font-semibold">No journey yet</h2>
            <p className="text-muted-foreground">
              Complete onboarding and JYM maps your transformation — milestones,
              pace and a projected finish date.
            </p>
            <Button size="lg" asChild>
              <Link href="/onboarding">Start my journey</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const { profile, plan, checkins, sessions, measurements, todayISO } = data;
  const unit = profile.unit_system;
  const journey = buildJourney({
    todayISO,
    profile,
    measurements,
    sessions,
    checkins,
  });
  const consistency = computeConsistency(todayISO, checkins, sessions);
  const { target } = journey;

  const goalStatement =
    target.kind === "weight"
      ? `${goalLabel(profile.goals[0])}: ${formatWeight(target.startKg, unit)} → ${formatWeight(target.targetKg, unit)}`
      : `${goalLabel(profile.goals[0])}: train ${target.weeklyTarget}× per week, every week`;

  // Weekly reviews for completed weeks that overlap the member's history.
  const firstActivity = [
    ...sessions.map((s) => s.started_at.slice(0, 10)),
    ...checkins.map((c) => c.date),
  ].sort()[0];
  const reviews = firstActivity
    ? recentWeekStarts(todayISO, 8)
        .filter((w) => addDaysISO(w, 7) > firstActivity)
        .map((weekStart) =>
          weeklyReview({ weekStart, profile, plan, checkins, sessions, measurements })
        )
    : [];

  // The most recent fully-completed calendar month, when it has any data.
  const prevMonthStart = isoMonthStart(addDaysISO(isoMonthStart(todayISO), -1));
  const monthly =
    firstActivity && firstActivity < isoMonthStart(todayISO)
      ? monthlyReview({
          monthStart: prevMonthStart,
          profile,
          plan,
          checkins,
          sessions,
          measurements,
        })
      : null;

  const achievedBadges = consistency.badges.filter((b) => b.achieved);
  const nextBadge = consistency.badges.find((b) => !b.achieved);

  return (
    <PageContainer>
      {!isSupabaseConfigured && <DemoBanner />}

      <PageHeader title="Your journey" description={goalStatement} />

      {/* Hero: progress + prediction */}
      <Card className="mb-6 overflow-hidden border-primary/30 bg-linear-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="w-full flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">
                {journey.progressPct}% of the way there
              </h2>
              <Badge variant={paceTone(journey.pace.status)}>
                {paceText(journey.pace)}
              </Badge>
            </div>
            <Progress value={journey.progressPct} className="mt-3" />
            <dl className="mt-4 grid gap-1 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <dt className="font-medium text-foreground">Started:</dt>
                <dd>{longDate(journey.startDate)}</dd>
              </div>
              {journey.etaISO && (
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground">
                    Projected finish:
                  </dt>
                  <dd>{longDate(journey.etaISO)}</dd>
                </div>
              )}
              {journey.plannedEtaISO && journey.plannedEtaISO !== journey.etaISO && (
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground">Plan says:</dt>
                  <dd>{longDate(journey.plannedEtaISO)}</dd>
                </div>
              )}
            </dl>
          </div>
          <ProbabilityDial value={journey.successProbability} />
        </CardContent>
      </Card>

      {/* Risks */}
      {journey.risks.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-3.5" /> Watch-outs
          </p>
          <ul className="grid gap-1 text-sm text-muted-foreground">
            {journey.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roadmap */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Flag className="size-5 text-primary" />
            <CardTitle>Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneList milestones={journey.milestones} />
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Flame className="size-5 text-primary" />
            <CardTitle>Habits</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {consistency.checkinStreakDays}
                </p>
                <p className="text-xs text-muted-foreground">
                  day check-in streak
                </p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {consistency.workoutStreakWeeks}
                </p>
                <p className="text-xs text-muted-foreground">
                  week training streak
                </p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {consistency.totalWorkouts}
                </p>
                <p className="text-xs text-muted-foreground">total workouts</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">
                  {consistency.totalCheckins}
                </p>
                <p className="text-xs text-muted-foreground">total check-ins</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Badges</p>
              <div className="flex flex-wrap gap-1.5">
                {achievedBadges.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Your first badge is one check-in away.
                  </p>
                )}
                {achievedBadges.map((b) => (
                  <Badge key={b.id} variant="success" className="gap-1">
                    <Award className="size-3" /> {b.label}
                  </Badge>
                ))}
                {nextBadge && (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    Next: {nextBadge.label}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly reviews */}
      {reviews.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-semibold">
            <CalendarCheck2 className="size-5 text-primary" /> Weekly reviews
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.map((r) => (
              <WeeklyReviewCard key={r.weekStart} review={r} unit={unit} />
            ))}
          </div>
        </>
      )}

      {/* Monthly review */}
      {monthly && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-semibold">Monthly review</h2>
          <MonthlyReviewCard review={monthly} />
        </>
      )}
    </PageContainer>
  );
}
