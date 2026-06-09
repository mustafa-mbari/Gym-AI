import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  Flame,
  Play,
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
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getMeasurements, getProfile, getSessions } from "@/lib/queries";
import { planForProfile, topMuscleGroups } from "@/lib/plan";
import { computeStats } from "@/lib/stats";
import { formatWeight, weightUnit } from "@/lib/format";
import { kgToLb } from "@/lib/fitness";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

const muscleLabel = (key: string) =>
  MUSCLE_GROUPS.find((m) => m.value === key)?.label ?? key;

export default async function DashboardPage() {
  const [profile, measurements, sessions] = await Promise.all([
    getProfile(),
    getMeasurements(),
    getSessions(),
  ]);

  const plan = profile ? planForProfile(profile) : null;
  const stats = computeStats(profile, measurements, sessions);
  const unit = profile?.unit_system ?? "metric";

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

  const volume = plan
    ? topMuscleGroups(plan, 8).map((v) => ({
        label: muscleLabel(v.group),
        sets: v.sets,
      }))
    : [];

  // Next session = rotate through the plan by completed-workout count.
  const nextDay =
    plan && plan.days.length
      ? plan.days[stats.completedWorkouts % plan.days.length]
      : null;

  return (
    <PageContainer>
      {!isSupabaseConfigured && <DemoBanner />}

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{profile?.first_name ? `, ${profile.first_name}` : ""} 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your progress and what&apos;s next.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
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
        <StatCard
          label="Streak"
          value={`${stats.streakWeeks} wk`}
          sub={stats.streakWeeks > 0 ? "Keep it going!" : "Start this week"}
          icon={Flame}
          tone="positive"
        />
      </div>

      {/* Next workout */}
      {nextDay && plan && (
        <Card className="mt-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Play className="size-5 fill-current" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Up next</p>
                <h3 className="text-lg font-bold">{nextDay.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {nextDay.focus} · {nextDay.exercises.length} exercises ·{" "}
                  ~{nextDay.estimated_minutes} min
                </p>
              </div>
            </div>
            <Button size="lg" asChild>
              <Link href={`/session/${nextDay.index}`}>
                Start workout <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
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
            {plan && <Badge variant="secondary">{plan.split_type.replace(/_/g, " ")}</Badge>}
          </CardHeader>
          <CardContent>
            <VolumeBars data={volume} />
          </CardContent>
        </Card>
      </div>

      {/* Plan link */}
      {plan && (
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
      )}

      {!profile && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Trophy className="size-10 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Let&apos;s build your plan</h3>
              <p className="text-muted-foreground">
                Complete a quick onboarding to get your personalised program.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/onboarding">Get started</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
