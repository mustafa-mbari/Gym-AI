import Link from "next/link";
import type { Metadata } from "next";
import { Beef, Flame, Gauge, HeartPulse } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-container";
import { StatCard } from "@/components/stat-card";
import { AreaTrend } from "@/components/charts/area-trend";
import { FrequencyBars, VolumeBars } from "@/components/charts/bars";
import { getMeasurements, getProfile, getSessions } from "@/lib/queries";
import { computeStats, weeklyFrequency } from "@/lib/stats";
import { planForProfile, topMuscleGroups } from "@/lib/plan";
import { bmi, bmiCategory, bmr, calorieTarget, estimateWeeksToGoal, tdee } from "@/lib/fitness";
import { weightUnit } from "@/lib/format";
import { kgToLb } from "@/lib/fitness";
import { muscleLabel } from "@/lib/labels";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const [profile, measurements, sessions] = await Promise.all([
    getProfile(),
    getMeasurements(),
    getSessions(),
  ]);

  if (!profile) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Complete onboarding to unlock analytics.
            <div className="mt-4">
              <Button asChild>
                <Link href="/onboarding">Get started</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const unit = profile.unit_system;
  const stats = computeStats(profile, measurements, sessions);
  const plan = planForProfile(profile);

  const weightKg = stats.currentWeight ?? profile.weight_kg ?? 0;
  const heightCm = profile.height_cm ?? 0;
  const age = profile.age ?? 30;
  const bmiValue = bmi(weightKg, heightCm);
  const bmiCat = bmiCategory(bmiValue);
  const restingKcal = bmr({ weightKg, heightCm, age, gender: profile.gender });
  const maintenance = tdee(restingKcal, profile.daily_activity);
  const target = calorieTarget({
    tdeeKcal: maintenance,
    weightKg,
    primaryGoal: profile.goals[0] ?? null,
  });
  const weeksToGoal = estimateWeeksToGoal(weightKg, profile.target_weight_kg);

  const toW = (kg: number) => (unit === "imperial" ? +kgToLb(kg).toFixed(1) : +kg.toFixed(1));
  const weightPoints = measurements
    .filter((m) => m.weight_kg != null)
    .map((m) => ({
      label: new Date(m.measured_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      value: toW(m.weight_kg as number),
    }));

  const volume = topMuscleGroups(plan, 10).map((v) => ({
    label: muscleLabel(v.group),
    sets: v.sets,
  }));
  const frequency = weeklyFrequency(sessions, 12);

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Your body composition, energy needs and training breakdown."
      />

      {/* Body composition */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="BMI"
          value={bmiValue ? bmiValue.toFixed(1) : "—"}
          sub={<Badge variant={bmiCat.tone}>{bmiCat.label}</Badge>}
          icon={Gauge}
          tone="primary"
        />
        <StatCard
          label="Maintenance"
          value={maintenance ? maintenance.toLocaleString() : "—"}
          sub="kcal / day (TDEE)"
          icon={Flame}
        />
        <StatCard
          label="Target intake"
          value={target.calories ? target.calories.toLocaleString() : "—"}
          sub="kcal / day"
          icon={HeartPulse}
          tone="positive"
        />
        <StatCard
          label="Protein target"
          value={target.protein ? `${target.protein} g` : "—"}
          sub="per day"
          icon={Beef}
        />
      </div>

      {target.note && (
        <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {target.note}
          {weeksToGoal != null && weeksToGoal > 0 && (
            <>
              {" "}
              At a steady pace you could reach your target weight in about{" "}
              <span className="font-medium text-foreground">
                {weeksToGoal} weeks
              </span>
              .
            </>
          )}
        </p>
      )}

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Weight trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrend
              data={weightPoints}
              goal={profile.target_weight_kg ? toW(profile.target_weight_kg) : null}
              suffix={` ${weightUnit(unit)}`}
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Muscle focus</CardTitle>
          </CardHeader>
          <CardContent>
            <VolumeBars data={volume} height={300} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Training frequency (12 weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <FrequencyBars data={frequency} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
