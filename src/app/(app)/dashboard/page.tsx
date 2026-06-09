import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  Target,
  TrendingDown,
  Trophy,
  Weight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/page-container";
import { StatCard } from "@/components/stat-card";
import { DemoBanner } from "@/components/demo-banner";
import { AreaTrend } from "@/components/charts/area-trend";
import { VolumeBars } from "@/components/charts/bars";
import { CheckinCard } from "@/components/today/checkin-card";
import { DailyTargets } from "@/components/today/daily-targets";
import { JourneySnippet } from "@/components/today/journey-snippet";
import { MotivationLine } from "@/components/today/motivation-line";
import { StreakChip } from "@/components/today/streak-chip";
import { TodayWorkoutCard } from "@/components/today/today-workout-card";
import { WeeklyReviewCard } from "@/components/journey/weekly-review-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCompanionData } from "@/lib/queries";
import { loadSchedule } from "@/lib/schedule-actions";
import { buildDailyBrief } from "@/lib/daily";
import { buildJourney } from "@/lib/journey";
import { latestCompletedWeeklyReview } from "@/lib/journey/reviews";
import { topMuscleGroups } from "@/lib/plan";
import { computeStats } from "@/lib/stats";
import { formatWeight, weightUnit } from "@/lib/format";
import { kgToLb } from "@/lib/fitness";
import { muscleLabel } from "@/lib/labels";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Today" };

export default async function DashboardPage() {
  const [data, schedule] = await Promise.all([
    getCompanionData(),
    loadSchedule(),
  ]);

  if (!data) {
    return (
      <PageContainer>
        {!isSupabaseConfigured && <DemoBanner />}
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Trophy className="size-10 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">
                Let&apos;s start your journey
              </h3>
              <p className="text-muted-foreground">
                A 5-minute onboarding builds your plan — then JYM coaches you
                day by day until you reach your goal.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/onboarding">Get started</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const { profile, plan, adaptation, checkins, sessions, measurements, todayISO } =
    data;
  const unit = profile.unit_system;

  const journey = buildJourney({
    todayISO,
    profile,
    measurements,
    sessions,
    checkins,
  });
  const todayCheckin = checkins.find((c) => c.date === todayISO) ?? null;
  const brief = buildDailyBrief({
    todayISO,
    profile,
    plan,
    adaptation,
    journey,
    todayCheckin,
    checkins,
    sessions,
    schedule,
  });
  const weeklyReview =
    brief.reviewDue === "weekly"
      ? latestCompletedWeeklyReview({
          todayISO,
          profile,
          plan,
          checkins,
          sessions,
          measurements,
        })
      : null;

  const stats = computeStats(profile, measurements, sessions);
  const toDisplay = (kg: number) =>
    unit === "imperial" ? +kgToLb(kg).toFixed(1) : +kg.toFixed(1);
  const weightPoints = measurements
    .filter((m) => m.weight_kg != null)
    .map((m) => ({
      label: new Date(m.measured_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      value: toDisplay(m.weight_kg as number),
    }));
  const volume = topMuscleGroups(plan, 8).map((v) => ({
    label: muscleLabel(v.group),
    sets: v.sets,
  }));

  return (
    <PageContainer>
      {!isSupabaseConfigured && <DemoBanner />}

      {/* Header: today's objective + streak */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back{profile.first_name ? `, ${profile.first_name}` : ""} 👋
          </h1>
          <p className="text-muted-foreground">{brief.objective}</p>
        </div>
        <StreakChip days={brief.streak.checkinStreakDays} />
      </div>

      <div className="grid gap-4">
        {/* Daily check-in */}
        <CheckinCard checkin={todayCheckin} unit={unit} />

        {/* Today's workout (or rest) */}
        <TodayWorkoutCard workout={brief.workout} />

        {/* Nutrition / activity / recovery targets */}
        <DailyTargets brief={brief} />

        {/* Journey status */}
        <JourneySnippet journey={journey} unit={unit} />

        {/* Monday: the weekly review */}
        {weeklyReview && (
          <WeeklyReviewCard review={weeklyReview} unit={unit} highlight />
        )}
        {brief.reviewDue === "monthly" && (
          <Card className="border-primary/30">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                <span className="font-semibold">A new month started</span> — your
                monthly review compares last month against the roadmap.
              </p>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/journey">
                  Open monthly review <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Daily motivation */}
        <MotivationLine fallback={brief.motivation} />
      </div>

      {/* Progress at a glance */}
      <h2 className="mt-8 mb-3 text-lg font-semibold">Progress at a glance</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Current weight"
          value={formatWeight(stats.currentWeight, unit, { decimals: 1 })}
          sub={
            stats.weightChange !== 0 ? (
              <span
                className={
                  stats.weightChange < 0 ? "text-primary" : "text-foreground"
                }
              >
                {stats.weightChange > 0 ? "+" : ""}
                {formatWeight(Math.abs(stats.weightChange), unit, {
                  withUnit: false,
                })}{" "}
                {weightUnit(unit)} so far
              </span>
            ) : (
              "Starting out"
            )
          }
          icon={Weight}
          tone="primary"
        />
        <StatCard
          label="Goal weight"
          value={formatWeight(stats.goalWeight, unit, { decimals: 1 })}
          sub={
            stats.toGoal != null
              ? `${formatWeight(stats.toGoal, unit, { withUnit: false })} ${weightUnit(unit)} to go`
              : "Set a target"
          }
          icon={Target}
        />
        <StatCard
          label="Goal progress"
          value={`${stats.goalProgressPct}%`}
          sub={<Progress value={stats.goalProgressPct} className="mt-2" />}
          icon={TrendingDown}
          tone="positive"
        />
        <StatCard
          label="Workouts"
          value={stats.completedWorkouts}
          sub={`${stats.thisWeekWorkouts} this week`}
          icon={Dumbbell}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Weight trend</CardTitle>
            <Badge variant="secondary">{weightPoints.length} entries</Badge>
          </CardHeader>
          <CardContent>
            <AreaTrend
              data={weightPoints}
              goal={stats.goalWeight ? toDisplay(stats.goalWeight) : null}
              suffix={` ${weightUnit(unit)}`}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Weekly volume</CardTitle>
            <Badge variant="secondary">
              {plan.split_type.replace(/_/g, " ")}
            </Badge>
          </CardHeader>
          <CardContent>
            <VolumeBars data={volume} />
          </CardContent>
        </Card>
      </div>

      {/* Plan link */}
      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="text-sm text-muted-foreground">{plan.summary}</p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/plan">
              View full plan <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
