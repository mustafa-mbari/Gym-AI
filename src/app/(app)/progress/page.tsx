import type { Metadata } from "next";
import { Activity, Dumbbell, Scale, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/page-container";
import { StatCard } from "@/components/stat-card";
import { AreaTrend } from "@/components/charts/area-trend";
import { FrequencyBars } from "@/components/charts/bars";
import { LogMeasurementDialog } from "@/components/progress/log-measurement-dialog";
import { getMeasurements, getProfile, getSessions } from "@/lib/queries";
import { computeStats, weeklyFrequency } from "@/lib/stats";
import { formatWeight, lengthUnit, weightUnit } from "@/lib/format";
import { kgToLb } from "@/lib/fitness";
import type { Measurement } from "@/types";

export const metadata: Metadata = { title: "Progress" };

const LENGTH_METRICS: Array<{ key: keyof Measurement; label: string }> = [
  { key: "waist_cm", label: "Waist" },
  { key: "chest_cm", label: "Chest" },
  { key: "arms_cm", label: "Arms" },
  { key: "legs_cm", label: "Legs" },
  { key: "shoulders_cm", label: "Shoulders" },
  { key: "neck_cm", label: "Neck" },
];

export default async function ProgressPage() {
  const [profile, measurements, sessions] = await Promise.all([
    getProfile(),
    getMeasurements(),
    getSessions(),
  ]);

  const unit = profile?.unit_system ?? "metric";
  const stats = computeStats(profile, measurements, sessions);

  const toW = (kg: number) => (unit === "imperial" ? +kgToLb(kg).toFixed(1) : +kg.toFixed(1));
  const toLen = (cm: number) => (unit === "imperial" ? +(cm / 2.54).toFixed(1) : +cm.toFixed(1));

  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const weightPoints = measurements
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ label: dateLabel(m.measured_at), value: toW(m.weight_kg as number) }));

  const bodyFatPoints = measurements
    .filter((m) => m.body_fat_pct != null)
    .map((m) => ({ label: dateLabel(m.measured_at), value: +(m.body_fat_pct as number).toFixed(1) }));

  const completed = sessions
    .filter((s) => s.status === "completed" && s.total_volume_kg != null)
    .slice()
    .reverse();
  const volumePoints = completed.map((s) => ({
    label: dateLabel(s.started_at),
    value: Math.round(unit === "imperial" ? kgToLb(s.total_volume_kg as number) : (s.total_volume_kg as number)),
  }));

  const frequency = weeklyFrequency(sessions, 8);

  function metricSummary(key: keyof Measurement) {
    const series = measurements
      .map((m) => m[key] as number | null)
      .filter((v): v is number => v != null);
    if (!series.length) return null;
    const first = series[0];
    const last = series[series.length - 1];
    return { current: last, delta: +(last - first).toFixed(1) };
  }

  return (
    <PageContainer>
      <PageHeader
        title="Progress"
        description="Track your weight, body composition and strength over time."
      >
        <LogMeasurementDialog unit={unit} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Current weight"
          value={formatWeight(stats.currentWeight, unit)}
          sub={
            stats.weightChange !== 0
              ? `${stats.weightChange > 0 ? "+" : ""}${formatWeight(stats.weightChange, unit, { withUnit: false })} ${weightUnit(unit)}`
              : "—"
          }
          icon={Scale}
          tone="primary"
        />
        <StatCard
          label="Body fat"
          value={
            stats.currentWeight && bodyFatPoints.length
              ? `${bodyFatPoints[bodyFatPoints.length - 1].value}%`
              : profile?.body_fat_pct
                ? `${profile.body_fat_pct}%`
                : "—"
          }
          icon={Activity}
        />
        <StatCard
          label="Goal progress"
          value={`${stats.goalProgressPct}%`}
          icon={TrendingDown}
          tone="positive"
        />
        <StatCard
          label="Total volume"
          value={formatWeight(stats.totalVolumeKg, unit, { decimals: 0 })}
          sub={`${stats.completedWorkouts} workouts`}
          icon={Dumbbell}
        />
      </div>

      <Tabs defaultValue="weight" className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="bodyfat">Body fat</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Weight trend</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaTrend
                data={weightPoints}
                goal={stats.goalWeight ? toW(stats.goalWeight) : null}
                suffix={` ${weightUnit(unit)}`}
                height={300}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bodyfat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Body fat %</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaTrend
                data={bodyFatPoints}
                color="var(--color-chart-3)"
                suffix="%"
                height={300}
                domainPadding={1}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="mt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LENGTH_METRICS.map((m) => {
              const summary = metricSummary(m.key);
              return (
                <Card key={String(m.key)} className="gap-1 p-4">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold">
                    {summary ? `${toLen(summary.current)}` : "—"}
                    {summary && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        {lengthUnit(unit)}
                      </span>
                    )}
                  </p>
                  {summary && summary.delta !== 0 && (
                    <p
                      className={
                        summary.delta < 0
                          ? "text-sm text-primary"
                          : "text-sm text-foreground"
                      }
                    >
                      {summary.delta > 0 ? "+" : "−"}
                      {toLen(Math.abs(summary.delta))} {lengthUnit(unit)} since
                      start
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workouts per week</CardTitle>
              </CardHeader>
              <CardContent>
                <FrequencyBars data={frequency} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Training volume</CardTitle>
              </CardHeader>
              <CardContent>
                <AreaTrend
                  data={volumePoints}
                  color="var(--color-chart-2)"
                  suffix={` ${weightUnit(unit)}`}
                  domainPadding={200}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
